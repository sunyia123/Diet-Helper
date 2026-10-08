// Local purchase ledger. Purchases are scoped to a cycle start, not consumption
// records: buying/checking food never changes nutrition or carries stock forward.
function shoppingLedgerEnabled() { return state.ledgerEnabled !== false }
function requireShoppingLedger() {
  if (shoppingLedgerEnabled()) return true
  showToast('记账功能已关闭，可在设置中开启')
  return false
}
function updateLedgerPreferenceUI() {
  const enabled = shoppingLedgerEnabled()
  document.body.classList.toggle('ledger-disabled', !enabled)
  document.querySelector('#ledger-enabled').checked = enabled
  document.querySelector('#open-purchase-overview').hidden = !enabled
}
function setShoppingLedgerEnabled(enabled) {
  const previous = state.ledgerEnabled, checked = state.shoppingChecked
  if (enabled === shoppingLedgerEnabled()) return
  // Keep currently prepared items checked when switching to a manual-only list.
  // Receipts remain intact; later manual checks no longer require editing prices.
  if (!enabled) {
    const complete = Object.entries(weeklyFoodTotals(prepMaterialView))
      .filter(([id, amount]) => shoppingIsComplete(id, amount)).map(([id]) => id)
    state.shoppingChecked = [...new Set([...checked, ...complete])]
  }
  state.ledgerEnabled = enabled
  try { persistState() } catch {
    state.ledgerEnabled = previous; state.shoppingChecked = checked; updateLedgerPreferenceUI()
    showToast('设置未保存，请检查本机存储空间'); return
  }
  if(!enabled && /^(purchase-|purchase-overview|purchase-history|food-price-)/.test(editorPageKey||''))closeSheet()
  updateLedgerPreferenceUI(); renderFoodLibrary(); renderPrep(); updateSummary();renderTrends()
  showToast(enabled ? '记账功能已开启' : '记账功能已关闭，已有账目保留')
}

const INITIAL_SHOPPING_CHANNELS=['盒马','山姆','超市','叮咚','小象','拼多多']
function shoppingChannelText(value){
  return typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').trim().replace(/\s+/g,' ').slice(0,30):''
}
function shoppingChannelKey(value){return shoppingChannelText(value).normalize('NFKC').toLocaleLowerCase('zh-CN')}
function defaultShoppingChannels(){return INITIAL_SHOPPING_CHANNELS.map((name,order)=>({id:`channel-default-${order}`,name,frequent:true,order}))}
function normalizeShoppingChannels(value){
  if(!Array.isArray(value))return defaultShoppingChannels()
  const result=[],ids=new Set(),names=new Set()
  for(const row of value.slice(0,300)){
    const id=typeof row?.id==='string'&&/^[\w-]{1,100}$/.test(row.id)?row.id:''
    const name=shoppingChannelText(row?.name),key=shoppingChannelKey(name)
    if(!id||!name||ids.has(id)||names.has(key))continue
    ids.add(id);names.add(key)
    result.push({id,name,frequent:row.frequent===true,order:Number.isFinite(row.order)?Math.max(0,Math.min(1000,Math.round(row.order))):result.length})
  }
  return result
}
function shoppingChannelForName(name,channels=state.shoppingChannels){
  const key=shoppingChannelKey(name)
  return key?(channels||[]).find(row=>shoppingChannelKey(row.name)===key)||null:null
}
function shoppingChannelName(row){
  return (state.shoppingChannels||[]).find(channel=>channel.id===row?.channelId)?.name||shoppingChannelText(row?.channelName)||'未填写渠道'
}
function shoppingChannelIdentity(row){const known=(state.shoppingChannels||[]).find(channel=>channel.id===row.channelId)||shoppingChannelForName(row.channelName);return known?.id||(shoppingChannelText(row.channelName)?row.channelId||`name:${shoppingChannelKey(row.channelName)}`:'unassigned')}
function mergeShoppingChannels(current,incoming){
  const merged=normalizeShoppingChannels(current).map(row=>({...row})),idMap=new Map()
  for(const row of normalizeShoppingChannels(incoming)){
    const byId=merged.find(item=>item.id===row.id)
    if(byId){idMap.set(row.id,byId.id);byId.frequent ||=row.frequent;continue}
    const byName=shoppingChannelForName(row.name,merged)
    if(byName){idMap.set(row.id,byName.id);byName.frequent ||=row.frequent;continue}
    merged.push({...row});idMap.set(row.id,row.id)
  }
  return {channels:normalizeShoppingChannels(merged),idMap}
}
function shoppingChannelFieldHtml(){
  return `<label class="form-field purchase-channel-field"><span>购买渠道 · 选填</span><span class="purchase-channel-control"><input id="purchase-channel" type="text" maxlength="30" autocomplete="off" placeholder="选择或直接输入渠道" aria-label="购买渠道"><button type="button" id="purchase-channel-toggle" aria-label="选择常用渠道">⌄</button></span></label><div id="purchase-channel-options" class="purchase-channel-options" hidden></div><label id="purchase-channel-frequent-field" class="purchase-channel-frequent" hidden><input id="purchase-channel-frequent" type="checkbox">设为常用渠道</label>`
}
function openShoppingChannelManager(onChange=()=>{}){
  if(!requireShoppingLedger())return
  const draft=normalizeShoppingChannels(state.shoppingChannels).map(row=>({...row})),dialog=openActionDialog('管理常用渠道')
  const paint=()=>{
    const frequent=draft.filter(row=>row.frequent).sort((a,b)=>a.order-b.order)
    dialog.content.innerHTML=`<p class="sheet-hint">在这里改名会同步用于这个渠道的历史采购；移出常用不删除记录。</p><div class="shopping-channel-manage-list">${frequent.map((row,index)=>`<div class="shopping-channel-manage-row"><input type="text" maxlength="30" value="${escapeHtml(row.name)}" data-channel-name="${escapeHtml(row.id)}" aria-label="第${index+1}个渠道名称"><button type="button" data-channel-up="${escapeHtml(row.id)}" aria-label="上移${escapeHtml(row.name)}" ${index===0?'disabled':''}>↑</button><button type="button" data-channel-down="${escapeHtml(row.id)}" aria-label="下移${escapeHtml(row.name)}" ${index===frequent.length-1?'disabled':''}>↓</button><button type="button" data-channel-remove="${escapeHtml(row.id)}" aria-label="移出常用${escapeHtml(row.name)}">移出</button></div>`).join('')}</div><div class="shopping-channel-add"><input id="shopping-channel-new" type="text" maxlength="30" placeholder="新增常用渠道" aria-label="新增常用渠道"><button type="button" id="shopping-channel-add">添加</button></div><button class="primary-action" type="button" id="save-shopping-channels">保存渠道</button>`
    dialog.content.querySelectorAll('[data-channel-name]').forEach(input=>input.oninput=()=>{const row=draft.find(item=>item.id===input.dataset.channelName);if(row)row.name=input.value})
    const move=(id,delta)=>{const order=frequent.map(row=>row.id),index=order.indexOf(id);if(index<0||index+delta<0||index+delta>=order.length)return;[order[index],order[index+delta]]=[order[index+delta],order[index]];order.forEach((key,i)=>{draft.find(row=>row.id===key).order=i});paint()}
    dialog.content.querySelectorAll('[data-channel-up]').forEach(button=>button.onclick=()=>move(button.dataset.channelUp,-1))
    dialog.content.querySelectorAll('[data-channel-down]').forEach(button=>button.onclick=()=>move(button.dataset.channelDown,1))
    dialog.content.querySelectorAll('[data-channel-remove]').forEach(button=>button.onclick=()=>{draft.find(row=>row.id===button.dataset.channelRemove).frequent=false;paint()})
    const add=()=>{const input=dialog.content.querySelector('#shopping-channel-new'),name=shoppingChannelText(input.value);if(!name){showToast('请填写渠道名称');return}const known=shoppingChannelForName(name,draft);if(known){known.frequent=true;known.order=frequent.length}else draft.push({id:`channel-${crypto.randomUUID()}`,name,frequent:true,order:frequent.length});paint()}
    dialog.content.querySelector('#shopping-channel-add').onclick=add
    dialog.content.querySelector('#shopping-channel-new').onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();add()}}
    dialog.content.querySelector('#save-shopping-channels').onclick=()=>{
      const names=draft.map(row=>shoppingChannelKey(row.name))
      if(names.some(name=>!name)||new Set(names).size!==names.length){showToast('渠道名称不能留空或重复');return}
      const previous=state.shoppingChannels
      state.shoppingChannels=normalizeShoppingChannels(draft)
      try{persistState()}catch{state.shoppingChannels=previous;showToast('渠道未保存，原记录保持不变');return}
      dialog.close();onChange();showToast('常用渠道已保存')
    }
  }
  paint()
}
function bindShoppingChannelField(host){
  const input=host.querySelector('#purchase-channel'),options=host.querySelector('#purchase-channel-options'),frequentField=host.querySelector('#purchase-channel-frequent-field'),frequent=host.querySelector('#purchase-channel-frequent')
  const paint=()=>{
    const query=shoppingChannelKey(input.value),known=shoppingChannelForName(input.value)
    frequentField.hidden=!shoppingChannelText(input.value)||Boolean(known)
    const list=(state.shoppingChannels||[]).filter(row=>row.frequent||query&&shoppingChannelKey(row.name).includes(query)).sort((a,b)=>Number(b.frequent)-Number(a.frequent)||a.order-b.order).slice(0,40)
    options.innerHTML=`${list.map(row=>`<button type="button" data-channel-choose="${escapeHtml(row.id)}">${escapeHtml(row.name)}${row.frequent?'':' · 历史渠道'}</button>`).join('')}<button type="button" id="manage-shopping-channels">管理常用渠道</button>`
    options.querySelectorAll('[data-channel-choose]').forEach(button=>button.onclick=()=>{const channel=(state.shoppingChannels||[]).find(row=>row.id===button.dataset.channelChoose);if(!channel)return;input.value=channel.name;input.dataset.channelId=channel.id;frequent.checked=false;options.hidden=true;paint()})
    options.querySelector('#manage-shopping-channels').onclick=()=>openShoppingChannelManager(()=>{const chosen=(state.shoppingChannels||[]).find(row=>row.id===input.dataset.channelId);if(chosen)input.value=chosen.name;paint();options.hidden=false})
  }
  input.oninput=()=>{delete input.dataset.channelId;paint()}
  input.onfocus=()=>{paint();options.hidden=false}
  host.querySelector('#purchase-channel-toggle').onclick=()=>{paint();options.hidden=!options.hidden;if(!options.hidden)input.focus()}
  paint()
  return {paint,set(row){input.value=row?.channelId?shoppingChannelName(row):shoppingChannelText(row?.channelName);input.dataset.channelId=row?.channelId||'';frequent.checked=false;paint()},get(draft=[]){const name=shoppingChannelText(input.value);if(!name)return {id:'',name:'',frequent:false};const prior=(state.shoppingChannels||[]).find(row=>row.id===input.dataset.channelId&&shoppingChannelKey(row.name)===shoppingChannelKey(name))||shoppingChannelForName(name)||draft.find(row=>shoppingChannelKey(row.channelName)===shoppingChannelKey(name));return {id:prior?.id||prior?.channelId||`channel-${crypto.randomUUID()}`,name:prior?.name||prior?.channelName||name,frequent:frequent.checked}}}
}

function normalizeShoppingPurchases(value) {
  const seen = new Set()
  const validDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value
  return (Array.isArray(value) ? value : []).filter(row => {
    if (!row || typeof row !== 'object' || !/^[\w-]{1,100}$/.test(row.id || '') || seen.has(row.id)) return false
    if (!/^[\w-]{1,100}$/.test(row.foodId || '') || !validDate(row.cycleStart) || !validDate(row.date)) return false
    if (!['g','kg','个','盒','板','袋','瓶'].includes(row.unit)) return false
    if (![row.quantity,row.gramsEach,row.paidCents].every(Number.isFinite) || row.quantity <= 0 || row.gramsEach <= 0 || row.quantity * row.gramsEach > 1000000 || row.paidCents < 0 || row.paidCents > 100000000 || !Number.isInteger(row.paidCents)) return false
    if ((row.unit === 'g' && row.gramsEach !== 1) || (row.unit === 'kg' && row.gramsEach !== 1000)) return false
    if (row.weightConversion !== undefined && (!normalizeWeightSnapshot(row.weightConversion,row.foodId) || weightPurchaseGrams(row)>1000000)) return false
    seen.add(row.id)
    return true
  }).map(row => ({id:row.id, foodId:row.foodId, foodName:String(row.foodName || '食材').slice(0,40), cycleStart:row.cycleStart, date:row.date, unit:row.unit, quantity:row.quantity, gramsEach:row.gramsEach, paidCents:row.paidCents,
    ...(typeof row.channelId==='string'&&/^[\w-]{1,100}$/.test(row.channelId)?{channelId:row.channelId}:{}),
    ...(shoppingChannelText(row.channelName)?{channelName:shoppingChannelText(row.channelName)}:{}),
    ...(row.weightConversion?{weightConversion:normalizeWeightSnapshot(row.weightConversion,row.foodId)}:{})}))
}

function shoppingRowsForFood(records, foodId) {
  const family=foodFamilyId(foodId)
  return records.filter(row=>foodFamilyId(row.foodId)===family)
}
function shoppingGramsForFood(row, foodId) {
  const id=canonicalFoodId(foodId),source=canonicalFoodId(row.foodId)
  if(source===id)return row.weightConversion?weightPurchaseGrams(row):foodState(row.foodId)==='raw'?weightPurchaseGrams(row)*foodEdibleRatio(source):weightPurchaseGrams(row)
  const pair=foodStatePair(id)
  if(!pair||foodFamilyId(source)!==pair.rawFoodId)return 0
  const snapshot=normalizeWeightSnapshot(row.weightConversion,row.foodId),gross=row.quantity*row.gramsEach
  if(source===pair.rawFoodId&&id===pair.cookedFoodId){
    if(snapshot?.rule.cooked>0)return weightConvert(gross,snapshot.rule,snapshot.stage,'cooked')
    return (snapshot?weightPurchaseGrams(row):gross*foodEdibleRatio(source))*foodPairRatio(pair).ratio
  }
  if(source===pair.cookedFoodId&&id===pair.rawFoodId)return weightPurchaseGrams(row)/foodPairRatio(pair).ratio
  return 0
}

function shoppingPurchaseStats(records, foodId, cycleStart, required = 0) {
  const rows = shoppingRowsForFood(records,foodId).filter(row=>row.cycleStart===cycleStart)
  const grams = rows.reduce((sum,row) => sum + shoppingGramsForFood(row,foodId),0)
  const cents = rows.reduce((sum,row) => sum + row.paidCents,0)
  const used = Math.min(Math.max(0,required), grams)
  const usedCents = grams ? Math.round(cents * used / grams) : 0
  return {count:rows.length, grams, cents, perKg:grams ? cents * 10 / grams : 0, usedCents, surplusCents:cents-usedCents, remaining:Math.max(0,required-grams), surplus:Math.max(0,grams-required)}
}
function shoppingMoney(cents) { return `¥${Number((cents/100).toFixed(2))}` }
function shoppingChannelComparison(foodId,range='all',records=state.shoppingPurchases){
  const days=range==='30'?30:range==='90'?90:0
  const cutoff=days?new Date(Date.parse(`${APP_TODAY_KEY}T00:00:00Z`)-(days-1)*86400000).toISOString().slice(0,10):''
  const rows=shoppingRowsForFood(records,foodId).filter(row=>!cutoff||row.date>=cutoff)
  const groups=new Map(),entries=[]
  for(const row of rows){
    const key=shoppingChannelIdentity(row),name=shoppingChannelName(row),grams=shoppingGramsForFood(row,foodId),priced=Number.isFinite(grams)&&grams>0
    const entry={row,key,name,grams,priced,perKg:priced?row.paidCents*10/grams:null,estimated:!row.weightConversion&&Boolean(foodStatePair(foodId))}
    entries.push(entry)
    if(!groups.has(key))groups.set(key,{key,name,rows:[],cents:0,grams:0,paidCount:0,latest:'',minimum:null,zeroCount:0,missing:0})
    const group=groups.get(key);group.rows.push(entry);if(row.date>group.latest)group.latest=row.date
    if(row.paidCents===0)group.zeroCount++
    if(!priced){group.missing++;continue}
    group.cents+=row.paidCents;group.grams+=grams;if(row.paidCents>0)group.paidCount++
    if(!group.minimum||entry.perKg<group.minimum.perKg)group.minimum=entry
  }
  const values=[...groups.values()].map(group=>({...group,perKg:group.grams?group.cents*10/group.grams:null})).sort((a,b)=>{
    if(a.key==='unassigned')return 1;if(b.key==='unassigned')return -1
    return (a.perKg??Infinity)-(b.perKg??Infinity)||a.name.localeCompare(b.name,'zh-CN')
  })
  const candidates=values.filter(group=>group.key!=='unassigned'&&group.perKg!==null&&group.paidCount>0)
  const lowest=candidates[0]?.perKg
  const bestChannels=lowest===undefined?[]:candidates.filter(group=>Math.abs(group.perKg-lowest)<0.0001)
  const valid=entries.filter(entry=>entry.priced).sort((a,b)=>a.perKg-b.perKg||b.row.date.localeCompare(a.row.date))
  const bestPrice=valid[0]?.perKg
  const bestReceipts=bestPrice===undefined?[]:valid.filter(entry=>Math.abs(entry.perKg-bestPrice)<0.0001)
  return {rows,entries,groups:values,bestChannels,bestReceipts,overallGrams:valid.reduce((sum,entry)=>sum+entry.grams,0),overallCents:valid.reduce((sum,entry)=>sum+entry.row.paidCents,0),estimated:entries.some(entry=>entry.estimated)}
}
function shoppingPricePerKg(value){return value===null||!Number.isFinite(value)?'—':`¥${Number(value.toFixed(1))}/kg`}
function normalizeShoppingCompletionResetIds(value) {
  return [...new Set((Array.isArray(value) ? value : []).filter(id => typeof id === 'string' && /^[\w-]{1,100}$/.test(id)))].slice(0, 10000)
}
function resetShoppingPreparation() {
  state.shoppingChecked = []
  // Reusing a cycle start must not let old receipts immediately check the new
  // list again. Keep the receipts/costs; require a new preparation confirmation.
  state.shoppingCompletionResetIds = [...new Set((state.shoppingPurchases || [])
    .filter(row => row.cycleStart === state.cycleStartDate).map(row => row.foodId))]
}
function shoppingAutoComplete(foodId, required) {
  if (!shoppingLedgerEnabled()) return false
  if ((state.shoppingCompletionResetIds || []).includes(foodId)) return false
  const s=shoppingPurchaseStats(state.shoppingPurchases,foodId,state.cycleStartDate,required)
  return required>0 && s.count>0 && s.grams+1e-6>=required
}
function shoppingIsComplete(foodId, required) { return shoppingAutoComplete(foodId,required) || state.shoppingChecked.includes(foodId) }
function shoppingFoodHistory(foodId) {
  const id=canonicalFoodId(foodId)
  const rows=shoppingRowsForFood(state.shoppingPurchases,id)
  const grams=rows.reduce((sum,row)=>sum+shoppingGramsForFood(row,id),0)
  const cents=rows.reduce((sum,row)=>sum+row.paidCents,0)
  const seen=new Set()
  const recent=rows.map((row,index)=>({row,index})).sort((a,b)=>b.row.date.localeCompare(a.row.date)||b.index-a.index).map(item=>item.row).filter(row=>{
    const key=[row.quantity,row.unit,row.gramsEach,row.paidCents,JSON.stringify(row.weightConversion||null)].join(':')
    if(seen.has(key))return false;seen.add(key);return true
  }).slice(0,2)
  return {count:rows.length,perKg:grams?cents*10/grams:0,recent}
}
function shoppingWeightLabel(grams) { return grams >= 1000 && Math.abs(grams/100-Math.round(grams/100))<1e-8 ? `${grams/1000} kg` : `${Math.round(grams*10)/10} g` }

// Read-only views aggregate canonical IDs without rewriting historical receipts.
function shoppingOverviewGroups() {
  const groups=new Map()
  for(const row of state.shoppingPurchases) {
    const id=foodFamilyId(row.foodId)
    if(!groups.has(id))groups.set(id,{id,name:foodById(id)?.name||row.foodName,grams:0,cents:0,rows:[]})
    const group=groups.get(id)
    group.grams+=shoppingGramsForFood(row,id);group.cents+=row.paidCents;group.rows.push(row)
  }
  return [...groups.values()].map(group=>({...group,perKg:group.grams?group.cents*10/group.grams:0,
    rows:group.rows.slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id))}))
    .sort((a,b)=>b.cents-a.cents||a.name.localeCompare(b.name,'zh-CN'))
}

function openShoppingOverview() {
  if (!requireShoppingLedger()) return
  beginEditorPage('purchase-overview')
  sheetKicker.textContent='';sheetTitle.textContent='采购总览'
  const groups=shoppingOverviewGroups(),cents=groups.reduce((sum,g)=>sum+g.cents,0)
  sheetContent.innerHTML=`<div class="price-overview"><section class="price-summary"><div><small>累计实付</small><strong>${shoppingMoney(cents)}</strong></div><div><small>食材种类</small><strong>${groups.length}</strong></div><div><small>购物笔数</small><strong>${state.shoppingPurchases.length}</strong></div></section><button class="primary-action" id="overview-single-entry" type="button">＋ 记一笔</button><label class="search-field price-search"><input id="purchase-overview-search" type="search" placeholder="搜索已购食材" aria-label="搜索已购食材"><button type="button" class="search-clear" aria-label="清空搜索">×</button></label><div class="price-section-heading"><h3>食材账本</h3><span>按累计花费排序</span></div><div id="purchase-overview-list" class="price-list"></div><button class="secondary-action" id="overview-all-records" type="button">按周期查看采购记录 ›</button></div>`
  const search=sheetContent.querySelector('#purchase-overview-search'),list=sheetContent.querySelector('#purchase-overview-list')
  const paint=()=>{
    const matches=groups.filter(g=>matchesFoodSearch(foodById(g.id)||{name:g.name},search.value.trim()))
    list.innerHTML=matches.length?matches.map(g=>`<button class="price-food-row" type="button" data-price-detail="${escapeHtml(g.id)}">${foodIconHtml(foodById(g.id),true)}<span><strong>${escapeHtml(g.name)}</strong><small>${g.rows.length}笔 · ${shoppingWeightLabel(g.grams)}</small></span><span class="price-row-value"><strong>${shoppingMoney(g.cents)}</strong><small>均 ¥${Number(g.perKg.toFixed(1))}/kg</small></span><span aria-hidden="true">›</span></button>`).join(''):`<p class="price-empty">${groups.length?'没有匹配的采购食材':'还没有采购记录。在备餐清单点击「记账」，或点击食材名称记录第一笔。'}</p>`
    list.querySelectorAll('[data-price-detail]').forEach((button,i)=>{
      if(matches[i].rows.some(row=>row.weightConversion)) {
        button.querySelector('.library-food-icon + span small, .price-food-row > span small')?.replaceChildren(document.createTextNode(`${matches[i].rows.length}笔 · 折合 ${shoppingWeightLabel(matches[i].grams)}`))
        button.querySelector('.price-row-value small').textContent=`折合均 ¥${Number(matches[i].perKg.toFixed(1))}/kg`
      }
      button.onclick=()=>openFoodPriceOverview(button.dataset.priceDetail)
    })
  }
  search.oninput=paint;sheetContent.querySelector('.search-clear').onclick=()=>{search.value='';paint();search.focus()}
  sheetContent.querySelector('#overview-all-records').onclick=openShoppingPurchaseHistory
  sheetContent.querySelector('#overview-single-entry').onclick=openShoppingSingleEntryChooser
  paint();openSheet()
}

function openShoppingSingleEntryChooser() {
  if(!requireShoppingLedger())return
  beginEditorPage('purchase-choose-food');sheetKicker.textContent='';sheetTitle.textContent='选择要记账的食材'
  sheetContent.innerHTML='<label class="search-field price-search"><input id="purchase-choose-search" type="search" placeholder="输入食物名称或拼音" aria-label="搜索食材"></label><div class="price-list" id="purchase-choose-list"></div>'
  const search=sheetContent.querySelector('#purchase-choose-search'),list=sheetContent.querySelector('#purchase-choose-list')
  const paint=()=>{
    const seen=new Set(),items=selectableFoods().filter(food=>{
      if(food.kind==='dish'||seen.has(foodFamilyId(food.id)))return false
      seen.add(foodFamilyId(food.id))
      return foodFamilyIds(food.id).some(id=>matchesFoodSearch(foodById(id),search.value.trim()))
    }).slice(0,60)
    list.innerHTML=items.map(food=>{const pair=foodStatePair(food.id),raw=pair?foodById(pair.rawFoodId):food,cooked=pair&&foodById(pair.cookedFoodId)
      return `<div class="price-choice-row">${foodIconHtml(raw,true)}<strong>${escapeHtml(raw.name.replace(/[（(]生[）)]$/,''))}</strong><button type="button" data-single-purchase="${escapeHtml(raw.id)}">${pair?'生':'记账'}</button>${cooked?`<button type="button" data-single-purchase="${escapeHtml(cooked.id)}">熟</button>`:''}</div>`}).join('')||'<p class="price-empty">没有匹配的食材</p>'
    list.querySelectorAll('[data-single-purchase]').forEach(button=>button.onclick=()=>openShoppingPurchaseEditor(button.dataset.singlePurchase,state.cycleStartDate,foodById(button.dataset.singlePurchase)?.name||'食材',false,true))
  }
  search.oninput=paint;paint();openSheet()
}

function shoppingReceiptHtml(row, index) {
  return `<div class="price-receipt-row" data-receipt-id="${escapeHtml(row.id)}"><button type="button" class="price-receipt" data-price-receipt="${index}" title="点击编辑；左滑或按 Delete 删除"><span><strong>${row.date}</strong><small>${escapeHtml(shoppingChannelName(row))} · ${Number(row.quantity.toFixed(1))}${escapeHtml(row.unit)}${['g','kg'].includes(row.unit)?'':` · ${shoppingWeightLabel(row.quantity*row.gramsEach)}`}</small></span><span class="price-row-value"><strong>${shoppingMoney(row.paidCents)}</strong><small>¥${Number((row.paidCents*10/(row.quantity*row.gramsEach)).toFixed(1))}/kg</small></span><span aria-hidden="true">›</span></button><button type="button" class="price-receipt-delete" tabindex="-1" aria-label="删除${row.date} ${shoppingMoney(row.paidCents)}购物记录">删除</button></div>`
}

function confirmShoppingReceiptDelete(receiptId, refresh) {
  if (!requireShoppingLedger()) return
  const receipt = state.shoppingPurchases.find(row => row.id === receiptId)
  if (!receipt) return
  const signature = JSON.stringify(receipt)
  const dialog = openActionDialog('删除购物记录')
  dialog.content.innerHTML = `<p>删除 ${escapeHtml(receipt.date)} 的 ${escapeHtml(receipt.foodName)} ${shoppingMoney(receipt.paidCents)} 这笔记录？均价和累计金额会重新计算，饮食记录不受影响。</p><button type="button" class="primary-action danger-action" data-confirm-receipt-delete>删除这笔记录</button>`
  dialog.content.querySelector('[data-confirm-receipt-delete]').onclick = () => dialog.close(false, () => {
    if (!requireShoppingLedger()) return
    const original = state.shoppingPurchases, index = original.findIndex(row => row.id === receiptId)
    if (index < 0 || JSON.stringify(original[index]) !== signature) { showToast('这笔记录已变化，请重新查看'); refresh(); return }
    const removed = structuredClone(original[index])
    state.shoppingPurchases = original.filter(row => row.id !== receiptId)
    try { persistState() } catch { state.shoppingPurchases = original; showToast('删除未保存，记录仍保留，请检查本机存储空间'); return }
    renderPrep(); refresh()
    const undo = () => {
      if (!requireShoppingLedger()) return
      if (state.shoppingPurchases.some(row => row.id === receiptId)) return
      const beforeUndo = state.shoppingPurchases
      state.shoppingPurchases = beforeUndo.slice()
      state.shoppingPurchases.splice(Math.min(index, beforeUndo.length), 0, removed)
      try { persistState() } catch { state.shoppingPurchases = beforeUndo; showToast('撤销未保存，请检查本机存储空间', undo); return }
      renderPrep(); refresh(); showToast('已恢复购物记录')
    }
    showToast('已删除购物记录', undo)
  })
}

function bindShoppingReceiptSwipes(container, refresh) {
  const menuWidth = 72
  const reveal = (row, open) => {
    row.classList.toggle('revealed', open)
    row.querySelector('.price-receipt-delete').tabIndex = open ? 0 : -1
  }
  container.querySelectorAll('.price-receipt-row').forEach(row => {
    const content = row.querySelector('.price-receipt'), remove = row.querySelector('.price-receipt-delete')
    let gesture = null, suppressClick = false
    const closeOthers = () => container.querySelectorAll('.price-receipt-row.revealed').forEach(other => { if (other !== row) reveal(other, false) })
    remove.onclick = () => confirmShoppingReceiptDelete(row.dataset.receiptId, refresh)
    content.addEventListener('click', event => {
      if (!suppressClick) return
      event.preventDefault(); event.stopImmediatePropagation(); suppressClick = false
    }, true)
    content.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0 || event.defaultPrevented) return
      closeOthers(); suppressClick = false
      gesture = {id:event.pointerId,x:event.clientX,y:event.clientY,start:row.classList.contains('revealed')?-menuWidth:0,offset:0,axis:''}
      gesture.offset = gesture.start
    })
    content.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return
      const dx = event.clientX-gesture.x, dy = event.clientY-gesture.y
      if (!gesture.axis && Math.max(Math.abs(dx),Math.abs(dy))>7) {
        gesture.axis = Math.abs(dx)>Math.abs(dy) ? 'x' : 'y'
        suppressClick = true
        if (gesture.axis === 'x') { content.setPointerCapture(event.pointerId); content.classList.add('swipe-dragging') }
      }
      if (gesture.axis !== 'x') return
      if (event.cancelable) event.preventDefault()
      gesture.offset = Math.max(-menuWidth,Math.min(0,gesture.start+dx))
      content.style.transform = `translateX(${gesture.offset}px)`
    })
    const finish = event => {
      if (!gesture || gesture.id !== event.pointerId) return
      if (event.type === 'pointerup' && gesture.axis === 'x') reveal(row,gesture.start===0 ? gesture.offset<=-24 : gesture.offset<-48)
      gesture = null; content.classList.remove('swipe-dragging'); content.style.transform = ''
      if (content.hasPointerCapture(event.pointerId)) content.releasePointerCapture(event.pointerId)
    }
    content.addEventListener('pointerup', finish); content.addEventListener('pointercancel', finish)
    row.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { suppressClick = false; return }
      if (!['ArrowLeft','ArrowRight','Escape','Delete'].includes(event.key)) return
      event.preventDefault(); event.stopPropagation(); suppressClick = false
      if (event.key === 'Delete') { remove.click(); return }
      const open = event.key === 'ArrowLeft'; closeOthers(); reveal(row,open)
      ;(open?remove:content).focus({preventScroll:true})
    })
  })
}

function openFoodPriceOverview(foodId, fallbackName = '') {
  if (!requireShoppingLedger()) return
  if (foodById(foodId)?.recipe?.ingredients?.length) { openDishCostDetail(foodId); return }
  const id=canonicalFoodId(foodId),food=foodById(id)
  const rows=shoppingRowsForFood(state.shoppingPurchases,id).slice().sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id))
  const grams=rows.reduce((sum,row)=>sum+shoppingGramsForFood(row,id),0),cents=rows.reduce((sum,row)=>sum+row.paidCents,0)
  const group=rows.length?{name:food?.name||rows[0].foodName,rows,grams,cents,perKg:grams?cents*10/grams:0}:null
  if(!food&&!group&&!fallbackName)return
  const name=food?.name||group?.name||fallbackName
  beginEditorPage(`food-price-${id}`)
  sheetKicker.textContent='';sheetTitle.textContent=name
  sheetContent.innerHTML=`<div class="price-overview"><div class="price-food-heading">${foodIconHtml(food,true)}<span><strong>价格与采购</strong><small>${rows.length?`${rows.length}笔 · 最近购买 ${rows[0].date}`:'尚无购物记录'}</small></span></div><section class="price-summary"><div><small>加权均价 / kg</small><strong>${rows.length?'¥'+Number(group.perKg.toFixed(1)):'—'}</strong></div><div><small>累计购买</small><strong>${rows.length?shoppingWeightLabel(group.grams):'—'}</strong></div><div><small>累计实付</small><strong>${rows.length?shoppingMoney(group.cents):'—'}</strong></div></section><button class="primary-action" id="food-price-add" type="button">＋ 记一笔</button><section id="price-channel-compare" class="price-channel-compare" aria-label="历史渠道比价"></section><div class="price-section-heading"><h3>历史购物记录</h3><select id="price-channel-filter" aria-label="按渠道筛选购物记录"></select></div><div class="price-list" id="food-price-receipts"></div></div>`
  sheetContent.querySelector('#food-price-add').onclick=()=>openShoppingPurchaseEditor(id,state.cycleStartDate,name,false,true)
  if(food?.kind!=='dish'){
    const weightButton=document.createElement('button');weightButton.type='button';weightButton.className='secondary-action';weightButton.id='food-weight-rules';weightButton.textContent='生熟关联与实测重量'
    weightButton.onclick=()=>openFoodWeightDetail(id,weeklyFoodTotals(true)[id]||0)
    sheetContent.querySelector('#food-price-add').after(weightButton)
  }
  sheetContent.querySelector('.price-summary small').textContent='营养口径均价 / kg'
  sheetContent.querySelector('.price-summary > div:nth-child(2) small').textContent='累计折合可用'
  let range='all',selectedChannel='all'
  const compareHost=sheetContent.querySelector('#price-channel-compare'),list=sheetContent.querySelector('#food-price-receipts'),filter=sheetContent.querySelector('#price-channel-filter')
  const paint=()=>{
    const comparison=shoppingChannelComparison(id,range),basis=foodState(id)==='cooked'?'熟可食':foodState(id)==='raw'?'生可食':'可食'
    const best=comparison.bestChannels[0],single=comparison.bestReceipts[0]
    compareHost.innerHTML=`<div class="price-channel-heading"><h3>历史渠道比价</h3><select id="price-channel-range" aria-label="比价时间范围"><option value="all" ${range==='all'?'selected':''}>全部记录</option><option value="30" ${range==='30'?'selected':''}>近30天</option><option value="90" ${range==='90'?'selected':''}>近90天</option></select></div><small class="price-channel-basis">统一折合${basis} · 元/kg${comparison.estimated?' · 部分重量为估算':''}</small>
      <div class="price-channel-winners"><button type="button" data-best-channel ${best?'':'disabled'}><span>历史渠道均价最低</span><strong>${best?`${escapeHtml(comparison.bestChannels.map(item=>item.name).join('、'))} ${shoppingPricePerKg(best.perKg)}`:'暂无可比较渠道'}</strong><small>${best?`${comparison.bestChannels.length>1?`${comparison.bestChannels.length}个渠道并列`:`${best.rows.length}笔`}`:''}</small></button><button type="button" data-best-receipt ${single?'':'disabled'}><span>历史单笔最低</span><strong>${single?`${comparison.bestReceipts.length>1?`${comparison.bestReceipts.length}笔并列`:escapeHtml(single.name)} ${shoppingPricePerKg(single.perKg)}`:'暂无采购记录'}</strong><small>${single?`${single.row.date}${single.row.paidCents===0?' · 0元记录':''}`:''}</small></button></div>
      <div class="price-channel-table"><div class="price-channel-table-head"><span>渠道</span><span>均价</span><span>最低一笔</span><span>笔数</span></div>${comparison.groups.map(item=>`<button type="button" class="price-channel-table-row" data-compare-channel="${escapeHtml(item.key)}"><span><strong>${escapeHtml(item.name)}</strong><small>${item.latest}${item.zeroCount?` · ${item.zeroCount}笔0元`:''}</small></span><b>${shoppingPricePerKg(item.perKg)}</b><b>${shoppingPricePerKg(item.minimum?.perKg??null)}</b><em>${item.rows.length}${item.rows.length===1?' · 仅1笔':''}</em></button>`).join('')||'<p class="price-empty">所选时间范围内暂无采购记录</p>'}<div class="price-channel-overall"><span>全部渠道加权均价</span><strong>${shoppingPricePerKg(comparison.overallGrams?comparison.overallCents*10/comparison.overallGrams:null)}</strong></div></div>`
    compareHost.querySelector('#price-channel-range').onchange=event=>{range=event.target.value;selectedChannel='all';paint()}
    const available=new Set(comparison.groups.map(item=>item.key));if(selectedChannel!=='all'&&!available.has(selectedChannel))selectedChannel='all'
    filter.innerHTML=`<option value="all">全部渠道</option>${comparison.groups.map(item=>`<option value="${escapeHtml(item.key)}">${escapeHtml(item.name)}</option>`).join('')}`
    filter.value=selectedChannel;filter.onchange=()=>{selectedChannel=filter.value;paint()}
    const shown=comparison.entries.filter(entry=>selectedChannel==='all'||entry.key===selectedChannel).map(entry=>entry.row).sort((a,b)=>b.date.localeCompare(a.date)||b.id.localeCompare(a.id))
    list.innerHTML=shown.length?shown.map(shoppingReceiptHtml).join(''):'<p class="price-empty">此范围内没有匹配的购物记录。</p>'
    list.querySelectorAll('.price-receipt').forEach((button,i)=>{const row=shown[i],usable=shoppingGramsForFood(row,id),gross=row.quantity*row.gramsEach;if(Number.isFinite(usable)&&usable>0){button.querySelector('.price-row-value small').textContent=shoppingPricePerKg(row.paidCents*10/usable);if(row.weightConversion||canonicalFoodId(row.foodId)!==id||Math.abs(usable-gross)>0.01)button.querySelector('span small').textContent+=` · 折合 ${shoppingWeightLabel(usable)} ${basis}`}})
    list.querySelectorAll('[data-price-receipt]').forEach(button=>button.onclick=()=>{const row=shown[Number(button.dataset.priceReceipt)];openShoppingPurchaseEditor(row.foodId,row.cycleStart,foodById(row.foodId)?.name||name,true)})
    bindShoppingReceiptSwipes(list,()=>openFoodPriceOverview(id,name))
    compareHost.querySelector('[data-best-channel]').onclick=()=>{selectedChannel=best.key;paint();filter.scrollIntoView({block:'nearest'})}
    compareHost.querySelector('[data-best-receipt]').onclick=()=>{
      selectedChannel=single.key;paint()
      const target=[...list.querySelectorAll('.price-receipt-row')].find(row=>row.dataset.receiptId===single.row.id)
      if(!target)return
      const gross=single.row.quantity*single.row.gramsEach
      target.classList.add('price-channel-located')
      target.insertAdjacentHTML('beforeend',`<div class="price-receipt-detail"><span>原买入重量 ${shoppingWeightLabel(gross)} · ${shoppingPricePerKg(single.row.paidCents*10/gross)}</span><span>折合${basis} ${shoppingWeightLabel(single.grams)} · ${shoppingPricePerKg(single.perKg)}</span><button type="button">编辑这笔</button></div>`)
      target.querySelector('.price-receipt-detail button').onclick=()=>openShoppingPurchaseEditor(single.row.foodId,single.row.cycleStart,foodById(single.row.foodId)?.name||name,true)
      target.scrollIntoView({block:'center'})
    }
    compareHost.querySelectorAll('[data-compare-channel]').forEach(button=>button.onclick=()=>{selectedChannel=button.dataset.compareChannel;paint();filter.scrollIntoView({block:'nearest'})})
  }
  paint()
  openSheet()
}
function shoppingQuantityLabel(grams, food) {
  const units=Number(food?.unitGrams)
  return `${shoppingWeightLabel(grams)}${units>0?`（约${Math.round(grams/units*10)/10}${escapeHtml(food.unitLabel||'个')}）`:''}`
}

function shoppingPriceHtml(foodId, amount) {
  if (!shoppingLedgerEnabled()) return ''
  if (foodById(foodId)?.recipe?.ingredients?.length) {
    const cost = dishIngredientCost(foodId, amount)
    return `<button type="button" class="shopping-price has-purchases" data-shopping-price="${escapeHtml(foodId)}" aria-label="${escapeHtml(foodById(foodId).name)}食材成本"><strong>${cost.missing ? '待补价' : shoppingMoney(cost.cents)}</strong></button>`
  }
  const s=shoppingPurchaseStats(state.shoppingPurchases, foodId, state.cycleStartDate, amount)
  return `<button type="button" class="shopping-price ${s.count?'has-purchases':''}" data-shopping-price="${escapeHtml(foodId)}" aria-label="记录${escapeHtml(foodById(foodId)?.name || '食材')}采购"><strong>${s.count?shoppingMoney(s.cents):'＋记账'}</strong></button>`
}

function bindShoppingLedger() {
  const list=document.querySelector('#shopping-list')
  list.querySelectorAll('[data-shopping-price]').forEach(button => button.onclick=()=>openShoppingPurchaseEditor(button.dataset.shoppingPrice, state.cycleStartDate, button.closest('[data-shopping-row]').querySelector('.shopping-copy strong')?.textContent || '食材'))
  list.querySelectorAll('[data-shopping-weight]').forEach(button=>button.onclick=()=>openFoodWeightDetail(button.dataset.shoppingWeight,Number(button.dataset.required)))
  list.querySelectorAll('[data-shopping-row]').forEach(row=>row.onclick=event=>{if(!event.target.closest('button'))row.querySelector('[data-shopping-food]').click()})
  let summary=document.querySelector('#shopping-ledger-summary')
  if (!shoppingLedgerEnabled()) { summary?.remove(); return }
  if(!summary){summary=document.createElement('div');summary.id='shopping-ledger-summary';list.previousElementSibling.append(summary)}
  const required=weeklyFoodTotals(true)
  const rows=state.shoppingPurchases.filter(row=>row.cycleStart===state.cycleStartDate)
  const cents=rows.reduce((sum,row)=>sum+row.paidCents,0)
  const used=[...new Set(rows.map(row=>row.foodId))].reduce((sum,id)=>sum+shoppingPurchaseStats(rows,id,state.cycleStartDate,required[id]||0).usedCents,0)
  summary.innerHTML=`<span class="shopping-paid-total" title="本周期实付 ${shoppingMoney(cents)}；已购部分预计使用 ${shoppingMoney(used)}"><small>实付</small> <b>${shoppingMoney(cents)}</b></span><button type="button" id="shopping-ledger-history" aria-label="采购记录及费用明细">记录 ›</button>`
  summary.querySelector('button').onclick=openShoppingPurchaseHistory
}

function openShoppingPurchaseHistory() {
  if (!requireShoppingLedger()) return
  beginEditorPage('purchase-history')
  sheetKicker.textContent='';sheetTitle.textContent='采购记录'
  const groups=new Map()
  for(const row of state.shoppingPurchases) {
    const key=`${row.cycleStart}:${row.foodId}`
    if(!groups.has(key))groups.set(key,{foodId:row.foodId,foodName:row.foodName,cycleStart:row.cycleStart,cents:0,grams:0})
    const group=groups.get(key);group.cents+=row.paidCents;group.grams+=weightPurchaseGrams(row);group.converted ||= Boolean(row.weightConversion)
  }
  const entries=[...groups.values()].sort((a,b)=>b.cycleStart.localeCompare(a.cycleStart))
  const currentRows=state.shoppingPurchases.filter(row=>row.cycleStart===state.cycleStartDate),required=weeklyFoodTotals(true)
  const currentCents=currentRows.reduce((sum,row)=>sum+row.paidCents,0)
  const used=[...new Set(currentRows.map(row=>row.foodId))].reduce((sum,id)=>sum+shoppingPurchaseStats(currentRows,id,state.cycleStartDate,required[id]||0).usedCents,0)
  sheetContent.innerHTML=`<p class="purchase-period">本周期实付 ${shoppingMoney(currentCents)} · 已购部分预计使用 ${shoppingMoney(used)}</p><div class="purchase-history">${entries.length?entries.map((group,i)=>`<button type="button" data-purchase-history="${i}"><span><strong>${escapeHtml(foodById(group.foodId)?.name||group.foodName)}</strong><small>${group.cycleStart} 起的周期 · ${shoppingWeightLabel(group.grams)}</small></span><b>${shoppingMoney(group.cents)} ›</b></button>`).join(''):'<p>还没有采购记录。点击备餐清单中的「记账」开始。</p>'}</div>`
  const importActions=document.createElement('section');importActions.className='purchase-import-actions';importActions.setAttribute('aria-label','采购记录工具')
  importActions.innerHTML='<button type="button" class="secondary-action" id="open-purchase-import">一键导入</button><button type="button" class="secondary-action" id="copy-purchase-prompt">复制 Prompt</button>'
  sheetContent.querySelector('.purchase-period').after(importActions)
  importActions.querySelector('#open-purchase-import').onclick=openShoppingImport
  importActions.querySelector('#copy-purchase-prompt').onclick=()=>copyShoppingImportPrompt(importActions)
  sheetContent.querySelectorAll('[data-purchase-history]').forEach(button=>{
    const group=entries[Number(button.dataset.purchaseHistory)]
    if(group.converted)button.querySelector('small').textContent=`${group.cycleStart} 起的周期 · 折合 ${shoppingWeightLabel(group.grams)}`
    button.onclick=()=>openShoppingPurchaseEditor(group.foodId,group.cycleStart,group.foodName,true)
  })
  openSheet()
}

function openShoppingPurchaseEditor(foodId, cycleStart=state.cycleStartDate, fallbackName='食材', legacyReceipt=false, singleEntry=false) {
  if (!requireShoppingLedger()) return
  const initialPair=foodStatePair(foodId)
  if(!legacyReceipt&&!singleEntry&&initialPair?.cookedFoodId===canonicalFoodId(foodId))return openShoppingPurchaseEditor(initialPair.rawFoodId,cycleStart,foodById(initialPair.rawFoodId)?.name||fallbackName)
  if (foodById(foodId)?.recipe?.ingredients?.length && !legacyReceipt) { openDishCostDetail(foodId, weeklyFoodTotals()[foodId] || 100); return }
  beginEditorPage(`purchase-${foodId}-${cycleStart}`)
  const food=foodById(foodId), name=food?.name || fallbackName
  const pair=foodStatePair(foodId),directYield=pair?.rawFoodId===canonicalFoodId(foodId),buyCooked=pair?.cookedFoodId===canonicalFoodId(foodId)
  const current=cycleStart===state.cycleStartDate
  const required=current ? Number(weeklyFoodTotals(true)[foodId] || 0) : 0
  let draft=state.shoppingPurchases.filter(row=>row.foodId===foodId && row.cycleStart===cycleStart).map(row=>({...row}))
  let editingId=null
  const pendingRules=new Map()
  const history=shoppingFoodHistory(foodId)
  sheetKicker.textContent='';sheetTitle.textContent=`${name} · 采购`
  sheetContent.innerHTML=`<div class="purchase-editor">
    <p class="purchase-period">${cycleStart} 起的周期${current?` · 计划 ${shoppingQuantityLabel(required,food)}`:' · 历史采购'}</p>
    <div id="purchase-totals" aria-live="polite"></div>
    <section class="purchase-entry"><div class="purchase-entry-heading"><h3 id="purchase-entry-title">记一笔</h3>${history.count?`<button type="button" id="purchase-use-average" title="按历史加权均价估算本笔金额">历史均 ¥${Number(history.perKg.toFixed(1))}/kg · 套用</button>`:''}</div>
      ${history.count?`<div class="purchase-recent" aria-label="最近采购快捷输入">${history.recent.map((row,i)=>`<button type="button" data-purchase-reuse="${i}" title="带入数量、单位、净重和金额，保存后才记账">${row.quantity}${row.unit} · ${shoppingMoney(row.paidCents)} ↗</button>`).join('')}</div>`:''}
      <div class="purchase-fields"><label class="form-field"><span>购买日期</span><input type="date" id="purchase-date" value="${APP_TODAY_KEY}"></label><label class="form-field"><span>实付金额 · 元</span><input id="purchase-paid" aria-label="实付金额" data-unit="元" type="number" min="0" max="1000000" step="0.01" value=""></label></div>
      ${shoppingChannelFieldHtml()}
      <div class="purchase-fields"><label class="form-field"><span>购买数量</span><input id="purchase-quantity" aria-label="购买数量" type="number" min="0.1" max="1000000" step="0.1" value=""></label><label class="form-field"><span>单位</span><select id="purchase-unit">${['g','kg','个','盒','板','袋','瓶'].map(unit=>`<option>${unit}</option>`).join('')}</select></label></div>
      <label class="form-field" id="purchase-conversion" hidden><span id="purchase-conversion-label">每份克重 g</span><input id="purchase-grams-each" aria-label="每份克重" data-unit="g" type="number" min="0.1" max="1000000" step="0.1" value=""></label>
      <p class="purchase-hint" id="purchase-conversion-hint"></p>
      ${directYield?`<div class="purchase-yield"><label class="form-field"><span>做熟后能吃 · g（选填）</span><input id="purchase-cooked-grams" aria-label="做熟后能吃的重量" type="number" min="0.1" max="1000000" step="0.1" placeholder="做好后补填"></label><details><summary>去皮瓤后的生重 · 选填</summary><label class="form-field"><span>未称重时默认等于买来重量</span><input id="purchase-edible-grams" aria-label="去皮瓤后的生可食重量" type="number" min="0.1" max="1000000" step="0.1" placeholder="未称重可留空"></label></details><small>${escapeHtml(foodById(pair.cookedFoodId)?.name||'熟食')}与此笔采购关联；熟重未填也可先记价格。</small></div>`:''}
      <button class="secondary-action" id="purchase-add" type="button">加入这笔</button>
    </section>
    <section><div class="content-heading"><h3>购物明细</h3><small id="purchase-count"></small></div><div id="purchase-rows"></div></section>
    <button class="primary-action" id="save-shopping-purchases" type="button">保存采购记录</button>
  </div>`
  const q=id=>sheetContent.querySelector(`#${id}`)
  const channelField=bindShoppingChannelField(sheetContent)
  const weightHost=document.createElement('div');q('purchase-add').before(weightHost)
  const inputGrams=()=>Number(q('purchase-quantity').value)*(q('purchase-unit').value==='g'?1:q('purchase-unit').value==='kg'?1000:Number(q('purchase-grams-each').value))
  const weightControl=directYield||buyCooked?null:mountWeightConversion(weightHost,foodId,{purchase:true,amount:inputGrams})
  let weightBaseline=JSON.stringify(weightControl?.signature()||null)
  if(q('purchase-use-average'))q('purchase-use-average').title='按食物营养口径的历史加权均价估算；不同买入形态先折合可用重量'
  const formTouched=()=>editingId!==null || q('purchase-quantity').value!=='' || q('purchase-paid').value!=='' || q('purchase-cooked-grams')?.value!==''&&q('purchase-cooked-grams')?.value!==undefined || q('purchase-edible-grams')?.value!==''&&q('purchase-edible-grams')?.value!==undefined || JSON.stringify(weightControl?.signature()||null)!==weightBaseline
  const updateUnit=()=>{
    const unit=q('purchase-unit').value, weight=['g','kg'].includes(unit)
    q('purchase-conversion').hidden=weight
    q('purchase-conversion-label').textContent=`每${unit}净重 · g`
    q('purchase-grams-each').setAttribute('aria-label',`每${unit}净重`)
    if(unit==='个' && !q('purchase-grams-each').value && food?.unitGrams) q('purchase-grams-each').value=food.unitGrams
    q('purchase-conversion-hint').textContent=weight?'':`净重可按包装填写，如 30 个蛋 × 50g = 每板 1500g。`
    q('purchase-conversion-hint').hidden=weight
    weightControl?.refresh()
  }
  const reset=()=>{editingId=null;q('purchase-quantity').value='';q('purchase-paid').value='';if(directYield){q('purchase-cooked-grams').value='';q('purchase-edible-grams').value=''}q('purchase-entry-title').textContent='记一笔';q('purchase-add').textContent='加入这笔';weightControl?.resetDefault();weightBaseline=JSON.stringify(weightControl?.signature()||null)}
  const readEntry=()=>{
    const unit=q('purchase-unit').value
    const channel=channelField.get(draft)
    const row={id:editingId||`purchase-${crypto.randomUUID()}`, foodId, foodName:name, cycleStart, date:q('purchase-date').value, unit, quantity:Number(q('purchase-quantity').value), gramsEach:unit==='g'?1:unit==='kg'?1000:Number(q('purchase-grams-each').value), paidCents:Math.round(Number(q('purchase-paid').value)*100),...(channel.id?{channelId:channel.id,channelName:channel.name,channelFrequent:channel.frequent}:{})}
    const conversion=weightControl?.read(true);if(weightControl&&!conversion)return null
    if(conversion?.conversion)row.weightConversion=conversion.conversion
    if(directYield) {
      const gross=inputGrams(),rawText=q('purchase-edible-grams').value,cookedText=q('purchase-cooked-grams').value
      const edible=rawText?Number(rawText):gross,cooked=cookedText?Number(cookedText):null
      if(rawText||cookedText) {
        const rule=normalizeWeightRule({id:`yield-${row.id}`,foodId,name:'本次加工实测',mode:cookedText?'direct':'trim',bought:gross,edible,cooked,basis:'edible',portionStage:'edible',edibleMeasured:Boolean(rawText)})
        if(!rule){showToast('请核对同批重量：生可食不能大于买来重量，熟重需大于 0');return null}
        row.weightConversion={rule,stage:'bought'}
      }
    }
    if(q('purchase-paid').value==='' || q('purchase-quantity').value==='' || !normalizeShoppingPurchases([row]).length){showToast('请填写有效日期、数量、净重和金额');return null}
    return {row,saveRule:conversion?.saveRule}
  }
  const stageEntry=()=>{const result=readEntry();if(!result)return false;const {row,saveRule}=result;const index=draft.findIndex(item=>item.id===row.id);if(index<0)draft.push(row);else draft[index]=row;if(saveRule)pendingRules.set(row.id,saveRule);else pendingRules.delete(row.id);reset();render();return true}
  const render=()=>{
    const s=shoppingPurchaseStats(draft,foodId,cycleStart,required)
    q('purchase-totals').innerHTML=`<div><small>累计实付</small><strong>${shoppingMoney(s.cents)}</strong></div><div><small>折合可用重量</small><strong>${shoppingWeightLabel(s.grams)}</strong></div><div><small>营养口径均价 / kg</small><strong>¥${Number(s.perKg.toFixed(1))}</strong></div>${current?`<p>${s.remaining?`还差 ${shoppingQuantityLabel(s.remaining,food)}`:s.surplus?`相对计划余量 ${shoppingQuantityLabel(s.surplus,food)}`:'已购足计划用量'} · 已购部分预计使用 ${shoppingMoney(s.usedCents)}${s.surplus?` · 余量价值 ${shoppingMoney(s.surplusCents)}`:''}。仅按本周期计划估算，不是实时库存。</p>`:''}`
    q('purchase-count').textContent=`${draft.length} 笔`
    q('purchase-rows').innerHTML=draft.map((row,i)=>`<div class="purchase-line"><button type="button" data-purchase-edit="${i}"><strong>${row.quantity} ${row.unit} · ${shoppingMoney(row.paidCents)}</strong><small>${row.date} · ${escapeHtml(shoppingChannelName(row))}${['g','kg'].includes(row.unit)?'':` · 每${row.unit} ${row.gramsEach}g`} · ${shoppingWeightLabel(row.quantity*row.gramsEach)}</small></button><button type="button" data-purchase-remove="${i}" aria-label="删除第${i+1}笔">×</button></div>`).join('')||'<p class="purchase-hint">尚未记录</p>'
    q('purchase-rows').querySelectorAll('.purchase-line').forEach((line,i)=>{const row=draft[i];if(row.weightConversion)line.querySelector('small').textContent+=` · ${row.weightConversion.rule.cooked?`熟可食 ${shoppingWeightLabel(row.weightConversion.rule.cooked)}`:`折合 ${shoppingWeightLabel(weightPurchaseGrams(row))}`}`})
    q('purchase-rows').querySelectorAll('[data-purchase-edit]').forEach(button=>button.onclick=()=>{
      if(formTouched()){showToast('请先加入当前这一笔，再编辑其他记录');return}
      const row=draft[Number(button.dataset.purchaseEdit)];editingId=row.id
      q('purchase-date').value=row.date;q('purchase-quantity').value=row.quantity;q('purchase-paid').value=row.paidCents/100;q('purchase-unit').value=row.unit;q('purchase-grams-each').value=row.gramsEach;channelField.set(row)
      if(directYield){q('purchase-cooked-grams').value=row.weightConversion?.rule.cooked??'';q('purchase-edible-grams').value=row.weightConversion?.rule.edibleMeasured?row.weightConversion.rule.edible:''}
      weightControl?.load(row.weightConversion||null)
      q('purchase-entry-title').textContent='修改这笔';q('purchase-add').textContent='更新这笔';updateUnit();q('purchase-entry-title').scrollIntoView({block:'nearest',behavior:'smooth'})
    })
    q('purchase-rows').querySelectorAll('[data-purchase-remove]').forEach(button=>button.onclick=()=>{const index=Number(button.dataset.purchaseRemove);pendingRules.delete(draft[index].id);if(draft[index].id===editingId)reset();draft.splice(index,1);render()})
  }
  q('purchase-unit').onchange=updateUnit
  q('purchase-quantity').addEventListener('input',()=>weightControl?.refresh());q('purchase-grams-each').addEventListener('input',()=>weightControl?.refresh())
  sheetContent.querySelectorAll('[data-purchase-reuse]').forEach(button=>button.onclick=()=>{
    if(formTouched()){showToast('当前有待加入的记录，请先保存这一笔');return}
    const row=history.recent[Number(button.dataset.purchaseReuse)]
    q('purchase-quantity').value=row.quantity;q('purchase-unit').value=row.unit;q('purchase-grams-each').value=row.gramsEach;q('purchase-paid').value=row.paidCents/100;channelField.set(row)
    if(directYield){q('purchase-cooked-grams').value=row.weightConversion?.rule.cooked??'';q('purchase-edible-grams').value=row.weightConversion?.rule.edibleMeasured?row.weightConversion.rule.edible:''}
    weightControl?.load(row.weightConversion||null)
    // Retain the currently chosen date and create a new purchase ID on save.
    updateUnit()
    showToast('已带入历史采购，核对后保存')
  })
  if(q('purchase-use-average'))q('purchase-use-average').onclick=()=>{
    const unit=q('purchase-unit').value, grams=Number(q('purchase-quantity').value)*(unit==='g'?1:unit==='kg'?1000:Number(q('purchase-grams-each').value))
    if(!Number.isFinite(grams)||grams<=0||grams>1000000){showToast('先填写本次数量和净重');return}
    if(q('purchase-paid').value!==''){showToast('已有实付金额，请先清空金额再套用均价');return}
    const conversion=weightControl?.read(true);if(weightControl&&!conversion)return
    const normalizedGrams=directYield&&q('purchase-edible-grams').value?Number(q('purchase-edible-grams').value):conversion?.conversion?weightConvert(grams,conversion.conversion.rule,conversion.conversion.stage):grams
    q('purchase-paid').value=Math.round(history.perKg*normalizedGrams/100)/10
    showToast('已按历史均价估算，请核对实付金额')
  }
  q('purchase-add').onclick=stageEntry
  if(singleEntry){q('purchase-add').hidden=true;q('purchase-rows').closest('section').hidden=true;q('save-shopping-purchases').textContent='保存并返回'}
  q('save-shopping-purchases').onclick=()=>{
    if (!requireShoppingLedger()) return
    if(singleEntry&&!formTouched()){showToast('请填写这笔采购的数量和金额');return}
    if(formTouched()&&!stageEntry())return
    const wasComplete=current && shoppingIsComplete(foodId,required)
    const original=state.shoppingPurchases
    const originalRules=state.foodWeightRules
    const originalChannels=state.shoppingChannels
    const channels=normalizeShoppingChannels(originalChannels).map(row=>({...row}))
    for(const row of draft){
      if(!row.channelId||!shoppingChannelText(row.channelName))continue
      const known=channels.find(item=>item.id===row.channelId)||shoppingChannelForName(row.channelName,channels)
      if(known){row.channelId=known.id;row.channelName=known.name;if(row.channelFrequent)known.frequent=true}
      else channels.push({id:row.channelId,name:shoppingChannelText(row.channelName),frequent:row.channelFrequent===true,order:channels.length})
    }
    state.shoppingChannels=normalizeShoppingChannels(channels)
    for(const rule of pendingRules.values())state.foodWeightRules=stageWeightRule(rule)
    const originalReset=state.shoppingCompletionResetIds
    const previousRows=original.filter(row=>row.foodId===foodId&&row.cycleStart===cycleStart)
    if(current && JSON.stringify(previousRows)!==JSON.stringify(draft)) {
      state.shoppingCompletionResetIds=(originalReset||[]).filter(id=>id!==foodId)
    }
    state.shoppingPurchases=[...original.filter(row=>row.foodId!==foodId||row.cycleStart!==cycleStart),...draft.map(({channelFrequent,...row})=>row)]
    try{persistState()}catch(error){state.shoppingPurchases=original;state.shoppingChannels=originalChannels;state.shoppingCompletionResetIds=originalReset;state.foodWeightRules=originalRules;showToast('保存失败，草稿仍保留，请检查存储空间');return}
    renderPrep()
    if(current && wasComplete!==shoppingIsComplete(foodId,required))animateShoppingChecks([foodId],!wasComplete)
    closeSheet();if(editorPageKey==='purchase-history')openShoppingPurchaseHistory()
    showToast('已保存采购记录')
  }
  sheetContent.editDraftReader={saveId:'save-shopping-purchases',read:()=>({draft,rules:[...pendingRules],conversion:weightControl?.signature(),fields:['purchase-date','purchase-quantity','purchase-paid','purchase-channel','purchase-channel-frequent','purchase-unit','purchase-grams-each','purchase-cooked-grams','purchase-edible-grams'].map(id=>q(id)?.type==='checkbox'?q(id)?.checked:q(id)?.value)})}
  updateUnit();render();openSheet()
}

document.querySelector('#open-purchase-overview').addEventListener('click',openShoppingOverview)
document.querySelector('#ledger-enabled').addEventListener('change', event => setShoppingLedgerEnabled(event.target.checked))
