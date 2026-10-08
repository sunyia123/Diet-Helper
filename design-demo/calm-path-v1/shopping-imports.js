// Text imports stage a local draft. Only an explicit save appends receipts.
function shoppingImportPrompt() {
  return `将下面的文字转换为购物记录。
只输出 JSON 数组，不使用表格或代码块。每笔实际购买单独一项，格式如下：
[
  {"name":"食材名称及生熟状态","date":"YYYY-MM-DD","quantity":500,"unit":"g","gramsEach":1,"paid":6.9,"channel":"盒马"}
]
字段说明：name 为食材名称；date 为购买日期；quantity 为购买数量；unit 为 g、kg、个、盒、板、袋或瓶；gramsEach 为每单位的克重，g 固定为 1，kg 固定为 1000，包装或按个购买必须有实际净重；paid 为这一笔的实付总金额（元），不是单价；channel 为购买渠道，原文没有时填 null。
只整理原文，不编造日期、数量、净重、金额或渠道。缺失字段填 null；没有日期时将由用户选择默认购买日期。保留生熟、带皮带骨等状态，不自行扣除不可食部分或估算烹饪损耗。不能确定净重的 ml、份或包，保留原单位和数量并令 gramsEach 为 null，供核对。
保留同一食材的多笔真实购买，但不要把小计、合计、运费再当作食材。不要自行分摊整单折扣；无法确定单项实付时填 null。不要复制下面的格式示例数字。

下面是需要转换的原文：
[请在这里粘贴购物清单、订单文字或购买记录]`
}

async function copyShoppingImportPrompt(host) {
  const button=host.querySelector('#copy-purchase-prompt')
  if(button)button.disabled=true
  try { await copyBackupText(shoppingImportPrompt());if(host.isConnected)showToast('Prompt 已复制，请在末尾插入购买记录') }
  catch {
    if(!host.isConnected)return
    const dialog=openActionDialog('复制购物记录 Prompt')
    dialog.content.innerHTML='<p class="sheet-hint">未能自动复制，可全选下方文字手动复制。</p><textarea class="recipe-prompt-fallback" aria-label="购物记录 Prompt" readonly rows="8"></textarea>'
    const input=dialog.content.querySelector('textarea');input.value=shoppingImportPrompt();input.focus();input.select()
  } finally { if(button?.isConnected)button.disabled=false }
}

function parseShoppingImport(text, defaultDate, library) {
  if(typeof text!=='string'||text.length>30000)return {error:'文字最多 30000 字'}
  const source=text.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'')
  if(!source)return {error:'请先粘贴购物记录'}
  let input
  try { input=JSON.parse(source) } catch {
    // Also accept a small, documented plain-text format without an AI step.
    const lines=source.split(/\r?\n/).map(line=>line.trim()).filter(Boolean)
    input=lines.map(line=>{
      const match=line.normalize('NFKC').match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*(kg|g|克|千克|公斤|斤)\s+[¥￥]?(\d+(?:\.\d{1,2})?)\s*元?(?:\s+(\d{4}-\d{2}-\d{2}))?(?:\s+@(.{1,30}))?$/i)
      if(!match)return null
      const unit=match[3].toLowerCase(),quantity=Number(match[2])
      return {name:match[1],quantity:unit==='斤'?quantity*500:quantity,unit:['kg','千克','公斤'].includes(unit)?'kg':'g',paid:Number(match[4]),date:match[5]||null,channel:match[6]||null}
    })
    if(input.some(row=>!row))return {error:'格式未识别。请粘贴 Prompt 整理后的 JSON，或按“食材名称 500g 6.9元”逐行填写'}
  }
  if(!Array.isArray(input)||!input.length||input.length>100||input.some(row=>!row||typeof row!=='object'||Array.isArray(row)))return {error:'一次可导入 1–100 笔购物记录'}
  const units=['g','kg','个','盒','板','袋','瓶']
  const numeric=value=>typeof value==='number'&&Number.isFinite(value)?value:null
  return {rows:input.map(value=>{
    const name=typeof value.name==='string'?value.name.slice(0,80).trim():''
    const candidates=ingredientCandidates(name,library)
    const food=candidates[0]?.score>=85&&candidates[0].score>(candidates[1]?.score||0)?candidates[0].food:null
    const unit=typeof value.unit==='string'?value.unit.trim():''
    return {name,foodId:food?.id||'',date:value.date==null||value.date===''?defaultDate:String(value.date).slice(0,20),quantity:numeric(value.quantity),unit:units.includes(unit)?unit:'',originalUnit:unit,channel:shoppingChannelText(value.channel),
      gramsEach:unit==='g'?1:unit==='kg'?1000:numeric(value.gramsEach),paid:numeric(value.paid),include:true,allowDuplicate:false}
  })}
}

function shoppingImportReceipt(row, cycleStart) {
  const food=selectableFoods().find(food=>food.id===row.foodId)
  if(!food||row.quantity===null||row.gramsEach===null||row.paid===null||!Number.isFinite(row.paid)||row.paid<0||Math.abs(row.paid*100-Math.round(row.paid*100))>1e-6)return null
  const channel=shoppingChannelForName(row.channel)
  const receipt={id:'import-preview',foodId:food.id,foodName:food.name,cycleStart,date:row.date,quantity:row.quantity,unit:row.unit,gramsEach:row.unit==='g'?1:row.unit==='kg'?1000:row.gramsEach,paidCents:Math.round(row.paid*100),...(shoppingChannelText(row.channel)?{channelName:channel?.name||shoppingChannelText(row.channel),...(channel?{channelId:channel.id}:{})}:{})}
  const common=commonWeightRule(food.id)
  if(common)receipt.weightConversion={rule:{...common,foodId:food.id},stage:common.mode==='cookOnly'?'edible':'bought'}
  return normalizeShoppingPurchases([receipt])[0]||null
}

function shoppingImportBaseFingerprint(receipt){return JSON.stringify([canonicalFoodId(receipt.foodId),receipt.cycleStart,receipt.date,receipt.quantity,receipt.unit,receipt.gramsEach,receipt.paidCents])}
function shoppingImportDuplicate(receipt,existing){
  const base=shoppingImportBaseFingerprint(receipt),channel=shoppingChannelKey(shoppingChannelName(receipt))
  let possible=false
  for(const item of existing){
    if(shoppingImportBaseFingerprint(item)!==base)continue
    const other=shoppingChannelKey(shoppingChannelName(item))
    if(receipt.channelId&&item.channelId&&receipt.channelId===item.channelId)return 'exact'
    if(channel===other)return 'exact'
    if(channel==='未填写渠道'||other==='未填写渠道')possible=true
  }
  return possible?'possible':''
}

function openShoppingImport() {
  if(!requireShoppingLedger())return
  const cycleStart=state.cycleStartDate
  beginEditorPage('purchase-import');sheetKicker.textContent='';sheetTitle.textContent='导入购物记录'
  sheetContent.innerHTML=`<div class="purchase-import"><p class="purchase-period">${escapeHtml(cycleStart)} 起的周期</p><label class="form-field"><span>缺少日期时使用</span><input id="purchase-import-date" type="date" value="${APP_TODAY_KEY}"></label><label class="form-field"><span>购物记录文字</span><textarea id="purchase-import-text" rows="5" maxlength="30000" placeholder="粘贴整理后的 JSON，或每行一笔：&#10;鸡蛋 500g 6.9元 @盒马&#10;牛奶 1kg 12.5元"></textarea></label><div class="purchase-import-actions"><button type="button" class="secondary-action" id="parse-purchase-import">识别记录</button><button type="button" class="secondary-action" id="copy-purchase-prompt">复制 Prompt</button><button type="button" class="secondary-action" id="manage-import-channels">管理常用渠道</button></div><datalist id="shopping-import-channel-options"></datalist><p id="purchase-import-status" role="status"></p><div id="purchase-import-rows"></div><button type="button" class="primary-action" id="save-purchase-import" hidden>确认导入</button></div>`
  const host=sheetContent.querySelector('.purchase-import'),q=id=>host.querySelector(`#${id}`),library=selectableFoods()
  let draft=[],committed=false
  const status=q('purchase-import-status'),save=q('save-purchase-import')
  const fillChannelOptions=()=>{q('shopping-import-channel-options').innerHTML=(state.shoppingChannels||[]).filter(row=>row.frequent).sort((a,b)=>a.order-b.order).map(row=>`<option value="${escapeHtml(row.name)}"></option>`).join('')}
  const duplicateSet=()=>state.shoppingPurchases.slice()
  const invalidate=()=>{draft=[];q('purchase-import-rows').replaceChildren();save.hidden=true;status.textContent=''}
  q('purchase-import-text').oninput=invalidate;q('purchase-import-date').onchange=invalidate
  q('copy-purchase-prompt').onclick=()=>copyShoppingImportPrompt(host)
  q('manage-import-channels').onclick=()=>openShoppingChannelManager(fillChannelOptions)
  fillChannelOptions()
  const updatePreview=()=>{
    const seen=duplicateSet();let count=0,cents=0
    draft.forEach((row,index)=>{
      const receipt=shoppingImportReceipt(row,cycleStart),duplicate=receipt?shoppingImportDuplicate(receipt,seen):''
      const note=host.querySelector(`[data-import-note="${index}"]`)
      note.textContent=!receipt?'请补齐对应食材、有效日期、数量、净重和实付金额':duplicate==='exact'?'与已有或本次记录相同；勾选才会再次导入':duplicate==='possible'?'同金额同重量的记录缺少渠道，可能重复；请核对后勾选':receipt.weightConversion?`沿用常用规则，折合 ${shoppingWeightLabel(weightPurchaseGrams(receipt))}`:'按购买重量记账'
      row.duplicate=duplicate
      if(row.include&&receipt){count++;cents+=receipt.paidCents;seen.push(receipt)}
    })
    status.textContent=`已选 ${count} 笔 · 实付 ¥${(cents/100).toFixed(2)}，核对后确认导入`
  }
  const render=()=>{
    const seen=duplicateSet()
    draft.forEach(row=>{const receipt=shoppingImportReceipt(row,cycleStart);if(!receipt)return;row.include=!shoppingImportDuplicate(receipt,seen);row.allowDuplicate=false;seen.push(receipt)})
    q('purchase-import-rows').innerHTML=draft.map((row,i)=>`<section class="purchase-import-row"><label class="purchase-import-select"><input type="checkbox" data-import-include="${i}" ${row.include?'checked':''}><strong>${escapeHtml(row.name||'未命名食材')}</strong></label><label class="form-field"><span>对应食物</span><select data-import-field="foodId" data-import-index="${i}" aria-label="第${i+1}笔食物"><option value="">请选择食物</option>${library.map(food=>`<option value="${escapeHtml(food.id)}" ${food.id===row.foodId?'selected':''}>${escapeHtml(food.name)}</option>`).join('')}</select></label><div class="purchase-import-fields"><label class="form-field"><span>购买日期</span><input type="date" data-import-field="date" data-import-index="${i}" value="${escapeHtml(row.date)}"></label><label class="form-field"><span>实付 · 元</span><input type="number" min="0" max="1000000" step="0.01" data-import-field="paid" data-import-index="${i}" value="${row.paid??''}"></label><label class="form-field"><span>购买数量</span><input type="number" min="0.1" max="1000000" step="0.1" data-import-field="quantity" data-import-index="${i}" value="${row.quantity??''}"></label><label class="form-field"><span>单位</span><select data-import-field="unit" data-import-index="${i}"><option value="">${escapeHtml(row.originalUnit||'待补')}</option>${['g','kg','个','盒','板','袋','瓶'].map(unit=>`<option ${unit===row.unit?'selected':''}>${unit}</option>`).join('')}</select></label><label class="form-field" data-import-net="${i}" ${['g','kg'].includes(row.unit)?'hidden':''}><span>每单位净重 · g</span><input type="number" min="0.1" max="1000000" step="0.1" data-import-field="gramsEach" data-import-index="${i}" value="${row.gramsEach??''}"></label></div><p class="purchase-hint" data-import-note="${i}"></p></section>`).join('')
    host.querySelectorAll('.purchase-import-row').forEach((section,index)=>{
      const field=document.createElement('label');field.className='form-field purchase-import-channel'
      field.innerHTML=`<span>购买渠道 · 可直接编辑</span><input type="text" maxlength="30" list="shopping-import-channel-options" data-import-field="channel" data-import-index="${index}" value="${escapeHtml(draft[index].channel||'')}" placeholder="未填写渠道">`
      section.querySelector('.purchase-import-fields').before(field)
    })
    host.querySelectorAll('[data-import-field]').forEach(input=>{
      const update=()=>{const row=draft[Number(input.dataset.importIndex)],field=input.dataset.importField;row[field]=['quantity','gramsEach','paid'].includes(field)?input.value===''?null:Number(input.value):input.value
        row.allowDuplicate=false
        if(field==='unit'){if(row.unit==='g'||row.unit==='kg')row.gramsEach=row.unit==='g'?1:1000;else row.gramsEach=null;const net=host.querySelector(`[data-import-net="${input.dataset.importIndex}"]`);net.hidden=['g','kg'].includes(row.unit);net.querySelector('input').value=row.gramsEach??''}
        updatePreview()
      };input.addEventListener('input',update);input.addEventListener('change',update)
    })
    host.querySelectorAll('[data-import-include]').forEach(input=>input.onchange=()=>{const row=draft[Number(input.dataset.importInclude)];row.include=input.checked;row.allowDuplicate=input.checked&&row.duplicate;updatePreview()})
    enhanceEditorControls(q('purchase-import-rows'));updatePreview();save.hidden=false
  }
  q('parse-purchase-import').onclick=()=>{
    const parsed=parseShoppingImport(q('purchase-import-text').value,q('purchase-import-date').value,library)
    if(parsed.error){invalidate();status.textContent=parsed.error;return}
    draft=parsed.rows;render()
  }
  save.onclick=()=>{
    if(committed||!requireShoppingLedger())return
    if(state.cycleStartDate!==cycleStart){status.textContent='备餐周期已改变，请返回采购记录后重新导入';return}
    const selected=draft.filter(row=>row.include),seen=duplicateSet(),receipts=[]
    if(!selected.length){status.textContent='请至少选择一笔记录';return}
    for(const row of selected){
      const receipt=shoppingImportReceipt(row,cycleStart)
      if(!receipt){status.textContent='选中的记录仍有缺失或无效项目，请核对后重试';return}
      const duplicate=shoppingImportDuplicate(receipt,seen)
      if(duplicate&&!row.allowDuplicate){updatePreview();status.textContent=duplicate==='possible'?'这笔可能与无渠道记录重复；请核对后取消再勾选':'发现相同记录；如确需再次导入，请取消后重新勾选该笔';return}
      seen.push(receipt);receipts.push({...receipt,id:`purchase-${crypto.randomUUID()}`})
    }
    const original=state.shoppingPurchases,originalReset=state.shoppingCompletionResetIds,originalChannels=state.shoppingChannels
    const channels=normalizeShoppingChannels(originalChannels).map(row=>({...row}))
    receipts.forEach(receipt=>{
      if(!receipt.channelName)return
      const known=shoppingChannelForName(receipt.channelName,channels)
      if(known){receipt.channelId=known.id;receipt.channelName=known.name}
      else {const channel={id:`channel-${crypto.randomUUID()}`,name:receipt.channelName,frequent:false,order:channels.length};channels.push(channel);receipt.channelId=channel.id}
    })
    state.shoppingChannels=normalizeShoppingChannels(channels)
    state.shoppingPurchases=[...original,...receipts]
    const ids=new Set(receipts.map(row=>row.foodId));state.shoppingCompletionResetIds=(originalReset||[]).filter(id=>!ids.has(id))
    try { persistState() } catch {state.shoppingPurchases=original;state.shoppingChannels=originalChannels;state.shoppingCompletionResetIds=originalReset;status.textContent='保存失败，草稿保留，请检查本机存储空间';return}
    committed=true;save.disabled=true;renderPrep();closeSheet();if(editorPageKey==='purchase-history')openShoppingPurchaseHistory();showToast(`已导入 ${receipts.length} 笔购物记录`)
  }
  sheetContent.editDraftReader={saveId:'save-purchase-import',read:()=>({text:q('purchase-import-text').value,date:q('purchase-import-date').value,draft})}
  enhanceEditorControls(host);openSheet()
}
