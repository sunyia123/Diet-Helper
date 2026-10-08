// All stored meal amounts remain grams in the selected food's nutrition basis.
// Measurements describe one batch; portion inputs describe only the part used.
function normalizeWeightRule(value) {
  if (!value || typeof value !== 'object' || !['trim','cook','cookOnly','direct'].includes(value.mode)) return null
  const {bought, cooked, basis} = value
  const edible=value.mode==='direct' && (value.edible===undefined||value.edible===null||value.edible==='') ? bought : value.edible
  if (![bought,edible].every(n => Number.isFinite(n) && n > 0 && n <= 1000000) || edible > bought) return null
  if (value.mode !== 'trim' && (!Number.isFinite(cooked) || cooked <= 0 || cooked > 1000000 || cooked > edible * 20)) return null
  if (value.mode === 'cookOnly' && bought !== edible) return null
  if (!['edible','cooked'].includes(basis) || value.mode === 'trim' && basis !== 'edible') return null
  if (typeof value.foodId !== 'string' || !/^[\w-]{1,100}$/.test(value.foodId)) return null
  return {version:1, id:typeof value.id === 'string' && /^[\w-]{1,100}$/.test(value.id) ? value.id : '',
    foodId:value.foodId, name:String(value.name || '常用换算').slice(0,40), mode:value.mode, bought, edible,
    cooked:value.mode !== 'trim' ? cooked : null, basis,
    ...(value.mode==='direct'?{edibleMeasured:value.edibleMeasured===true}:{}),
    portionStage:['bought','edible',...(value.mode !== 'trim'?['cooked']:[])].includes(value.portionStage)?value.portionStage:basis}
}
function normalizeWeightRules(values) {
  const result=[],seen=new Set()
  for (const value of (Array.isArray(values)?values:[]).slice(0,2000)) {
    const rule=normalizeWeightRule(value)
    if (!rule?.id || seen.has(rule.id)) continue
    seen.add(rule.id);result.push(rule)
  }
  return result
}
function weightStageName(rule, stage) {
  return stage === 'bought' ? '购买原重' : stage === 'cooked' ? '熟可食重' : rule?.mode !== 'trim' ? '生可食重' : '可食净重'
}
function normalizeFoodStatePairs(values) {
  const result=[],used=new Set()
  for(const row of (Array.isArray(values)?values:[]).slice(0,1000)) {
    const rawFoodId=row?.rawFoodId,cookedFoodId=row?.cookedFoodId
    if(typeof rawFoodId!=='string'||typeof cookedFoodId!=='string'||!/^[-\w]{1,100}$/.test(rawFoodId)||!/^[-\w]{1,100}$/.test(cookedFoodId)||rawFoodId===cookedFoodId||used.has(rawFoodId)||used.has(cookedFoodId))continue
    result.push({rawFoodId,cookedFoodId});used.add(rawFoodId);used.add(cookedFoodId)
  }
  return result
}
function foodStageName(food) {
  const match=typeof food?.name==='string'?food.name.match(/^(.+)[（(](生|熟)[）)]$/):null
  return match?{base:match[1],stage:match[2]}:null
}
function matchingFoodStagePair(rawFood,cookedFood) {
  const raw=foodStageName(rawFood),cooked=foodStageName(cookedFood)
  return Boolean(raw&&cooked&&raw.stage==='生'&&cooked.stage==='熟'&&raw.base===cooked.base)
}
function foodStatePair(foodId) {
  const id=canonicalFoodId(foodId),explicit=(state.foodStatePairs||[]).find(pair=>pair.rawFoodId===id||pair.cookedFoodId===id)
  if(explicit&&foodById(explicit.rawFoodId)?.kind!=='dish'&&foodById(explicit.cookedFoodId)?.kind!=='dish'&&matchingFoodStagePair(foodById(explicit.rawFoodId),foodById(explicit.cookedFoodId)))return explicit
  const food=foodById(id)
  if(!food||food.kind==='dish')return null
  const stage=foodStageName(food)
  if(!stage)return null
  const counterpart=foods.find(item=>item.id!==id&&item.kind!=='dish'&&(stage.stage==='生'?matchingFoodStagePair(food,item):matchingFoodStagePair(item,food)))
  if(!counterpart)return null
  if((state.foodStatePairs||[]).some(pair=>[pair.rawFoodId,pair.cookedFoodId].includes(counterpart.id)&&matchingFoodStagePair(foodById(pair.rawFoodId),foodById(pair.cookedFoodId))))return null
  return stage.stage==='生'?{rawFoodId:id,cookedFoodId:counterpart.id}:{rawFoodId:counterpart.id,cookedFoodId:id}
}
function foodForState(foodId,stage) {
  const pair=foodStatePair(foodId)
  return pair?(stage==='raw'?pair.rawFoodId:pair.cookedFoodId):foodId
}
function foodState(foodId) {
  const pair=foodStatePair(foodId)
  return pair?(pair.rawFoodId===canonicalFoodId(foodId)?'raw':'cooked'):null
}
function equivalentFoodAmount(foodId,amount,toStage) {
  const pair=foodStatePair(foodId)
  if(!pair)return amount
  const ratio=foodPairRatio(pair).ratio
  return foodState(foodId)===toStage?amount:toStage==='cooked'?amount*ratio:amount/ratio
}
function foodStageSegmentedHtml(stage,{label='食物生熟状态',buttonAttribute='data-food-stage-choice',family='',className=''}={}) {
  const selected=stage==='raw'?'raw':'cooked',index=selected==='raw'?0:1
  const familyAttribute=family?` data-family="${escapeHtml(family)}"`:''
  return `<span class="summary-day-toggle slime-toggle food-stage-toggle ${className}" role="group" aria-label="${escapeHtml(label)}" data-stage="${selected}" style="${slimeChoiceStyle(slimeChoiceGeometry(2,index,index,0,2))}"><i class="choice-slime day-choice-slime" aria-hidden="true"></i><button type="button" ${buttonAttribute}="raw"${familyAttribute} aria-pressed="${selected==='raw'}" class="${selected==='raw'?'active':''}">生</button><button type="button" ${buttonAttribute}="cooked"${familyAttribute} aria-pressed="${selected==='cooked'}" class="${selected==='cooked'?'active':''}">熟</button></span>`
}
function foodStageToggleHtml(foodId) {
  const stage=foodState(foodId)
  return stage?foodStageSegmentedHtml(stage):''
}
function pairedYieldRule(rawFoodId) {
  const pair=foodStatePair(rawFoodId)
  if(!pair)return null
  const rules=[],seen=new Set()
  for(const row of state.shoppingPurchases||[]) {
    if(canonicalFoodId(row.foodId)!==pair.rawFoodId)continue
    const rule=normalizeWeightSnapshot(row.weightConversion,row.foodId)?.rule
    if(rule&&rule.cooked>0&&rule.mode!=='cookOnly'&&!seen.has(rule.id)) {rules.push(rule);if(rule.id)seen.add(rule.id)}
  }
  for(const value of state.foodWeightRules||[]) {
    const rule=normalizeWeightRule(value)
    if(rule&&canonicalFoodId(rule.foodId)===pair.rawFoodId&&rule.cooked>0&&rule.mode!=='cookOnly'&&!seen.has(rule.id)) {rules.push(rule);if(rule.id)seen.add(rule.id)}
  }
  if(!rules.length)return null
  const total=key=>rules.reduce((sum,rule)=>sum+rule[key],0)
  const bought=total('bought'),edible=total('edible'),cooked=total('cooked')
  return {id:'paired-average',foodId:pair.rawFoodId,name:'实测加权平均',mode:'cook',bought,edible,cooked,basis:'edible',portionStage:'edible',sampleCount:rules.length,edibleEstimatedCount:rules.filter(rule=>rule.mode==='direct'&&!rule.edibleMeasured).length,cookedEstimatedCount:rules.filter(rule=>rule.cooked===null).length}
}
function foodPairRatio(pair) {
  const measured=pairedYieldRule(pair.rawFoodId)
  if(measured?.edible>0&&measured.cooked>0)return {ratio:measured.cooked/measured.edible,source:'实测',sampleCount:measured.sampleCount,edibleEstimatedCount:measured.edibleEstimatedCount}
  const raw=foodById(pair.rawFoodId),cooked=foodById(pair.cookedFoodId)
  const saved=state.foodPairNutrients?.[pair.rawFoodId]
  const preferred=['protein','carbs','fat'].includes(saved)?saved:raw?.category==='protein'?'protein':raw?.category==='fat'?'fat':raw?.category==='carbs'?'carbs':null
  const keys=[preferred,'carbs','protein','fat'].filter((key,index,all)=>key&&all.indexOf(key)===index)
  const key=keys.find(key=>Number(raw?.[key])>0&&Number(cooked?.[key])>0)
  if(key){const ratio=raw[key]/cooked[key];if(Number.isFinite(ratio)&&ratio>=0.05&&ratio<=20)return {ratio,source:'营养估算',nutrient:key}}
  return {ratio:1,source:'暂按 1:1'}
}
function foodEdibleRatio(rawFoodId){
  const candidates=[],seen=new Set()
  for(const row of state.shoppingPurchases||[]){
    if(canonicalFoodId(row.foodId)!==rawFoodId)continue
    const rule=normalizeWeightSnapshot(row.weightConversion,row.foodId)?.rule
    if(rule?.edibleMeasured||rule?.mode==='trim'&&rule.edible<rule.bought){if(!seen.has(rule.id)){candidates.push(rule);seen.add(rule.id)}}
  }
  for(const value of state.foodWeightRules||[]){
    const rule=normalizeWeightRule(value)
    if(canonicalFoodId(rule?.foodId)===rawFoodId&&(rule.edibleMeasured||rule.mode==='trim'&&rule.edible<rule.bought)&&!seen.has(rule.id)){candidates.push(rule);seen.add(rule.id)}
  }
  const bought=candidates.reduce((sum,rule)=>sum+rule.bought,0)
  return bought?candidates.reduce((sum,rule)=>sum+rule.edible,0)/bought:1
}
function effectiveFoodNutrition(foodId) {
  const food=foodById(foodId),pair=foodStatePair(foodId)
  if(food?.kind==='dish'&&food.recipe?.ingredients?.length){
    const calculated=calculateDishNutrition(food.recipe.ingredients,food.recipe.yieldWeight)
    return calculated?{...food,...calculated.per100}:food
  }
  if(!food||!pair||pair.cookedFoodId!==canonicalFoodId(foodId))return food
  const raw=foodById(pair.rawFoodId)
  if(!raw)return food
  const {ratio,source}=foodPairRatio(pair)
  // With no comparable nutrient and no measured yield, retain an existing
  // cooked profile instead of inventing it from an incomplete raw profile.
  if(source==='暂按 1:1'&&['calories','carbs','protein','fat'].some(key=>Number(food[key])>0))return food
  return {...food,...Object.fromEntries(['calories','carbs','protein','fat'].map(key=>[key,Number(raw[key]||0)/ratio]))}
}
function foodFamilyId(foodId){return foodStatePair(foodId)?.rawFoodId||canonicalFoodId(foodId)}
function foodFamilyIds(foodId){const pair=foodStatePair(foodId);return pair?[pair.rawFoodId,pair.cookedFoodId]:[canonicalFoodId(foodId)]}
function weightConvert(amount, rule, from, to=rule.basis) {
  const stages={bought:rule.bought,edible:rule.edible,cooked:rule.cooked}
  return Number.isFinite(amount) && amount >= 0 && stages[from]>0 && stages[to]>0 ? amount * stages[to] / stages[from] : NaN
}
function normalizeWeightSnapshot(value, foodId) {
  const rule=normalizeWeightRule(value?.rule)
  if (!rule || rule.foodId !== foodId || !['bought','edible','cooked'].includes(value.stage) || rule.mode==='trim' && value.stage==='cooked') return null
  return {rule,stage:value.stage}
}
function normalizeWeightEntry(value, foodId) {
  const snap=normalizeWeightSnapshot(value,foodId)
  if (!snap || !Number.isFinite(value.entered) || value.entered<=0 || value.entered>1000000) return null
  const amount=weightConvert(value.entered,snap.rule,snap.stage)
  if (!Number.isFinite(amount) || amount<=0 || amount>1000000) return null
  const cost=value.cost && Number.isFinite(value.cost.cents) && value.cost.cents>=0 && value.cost.cents<=100000000
    ? {cents:value.cost.cents,estimated:true} : null
  return {...snap,entered:value.entered,amount,...(cost?{cost}:{})}
}
function weightEntriesFor(item) {
  const entries=(Array.isArray(item.weightEntries)?item.weightEntries:[]).slice(0,200).map(value=>normalizeWeightEntry(value,item.foodId)).filter(Boolean)
  return entries.reduce((sum,row)=>sum+row.amount,0)<=item.amount+0.001 ? entries : []
}
function scaleWeightEntries(item, amount) {
  const factor=amount/item.amount
  return weightEntriesFor(item).map(entry=>({...entry,amount:entry.amount*factor,entered:entry.entered*factor,...(entry.cost?{cost:{...entry.cost,cents:entry.cost.cents*factor}}:{})}))
}
function weightRulesFor(foodId) { return (state.foodWeightRules||[]).filter(rule=>canonicalFoodId(rule.foodId)===canonicalFoodId(foodId)) }
function commonWeightRule(foodId) {
  if(foodById(foodId)?.kind==='dish')return null
  const pair=foodStatePair(foodId),average=pair&&pairedYieldRule(pair.rawFoodId)
  if(average)return pair.cookedFoodId===canonicalFoodId(foodId)?{...average,foodId:pair.cookedFoodId,basis:'cooked',portionStage:'cooked'}:average
  return weightRulesFor(foodId)[0]||null
}
function stageWeightRule(rule) {
  const normalized=normalizeWeightRule({...rule,id:rule.id || `weight-${crypto.randomUUID()}`})
  if (!normalized) throw new Error('实测重量无效')
  // The first rule per food is the current purchasing suggestion. Old receipts
  // and recorded portions retain their own immutable copies, never this pointer.
  return [normalized,...(state.foodWeightRules||[]).filter(item=>item.id!==normalized.id)].slice(0,2000)
}
function weightPurchaseGrams(row) {
  const snap=normalizeWeightSnapshot(row.weightConversion,row.foodId), amount=row.quantity*row.gramsEach
  return snap ? weightConvert(amount,snap.rule,snap.stage) : amount
}
function weightSuggestedPurchase(foodId, amount) {
  const pair=foodStatePair(foodId)
  if(pair){const edible=foodState(foodId)==='cooked'?amount/foodPairRatio(pair).ratio:amount;return edible/foodEdibleRatio(pair.rawFoodId)}
  const rule=commonWeightRule(foodId)
  return rule ? weightConvert(amount,rule,rule.basis,'bought') : amount
}
function weightEntryFor(foodId, entered, conversion) {
  const entry=normalizeWeightEntry({...conversion,entered},foodId)
  if (!entry) return null
  if (shoppingLedgerEnabled()) {
    if(foodById(foodId)?.recipe?.ingredients?.length) {
      const cost=dishIngredientCost(foodId,entry.amount)
      if(!cost.missing)entry.cost={cents:cost.cents,estimated:true}
    } else {
      const history=shoppingFoodHistory(foodId)
      if (history.count) entry.cost={cents:entry.amount*history.perKg/10,estimated:true}
    }
  }
  return entry
}
function weightRecordSummary(item) {
  const entries=weightEntriesFor(item)
  if (!entries.length) return ''
  return entries.map(entry=>`${shoppingWeightLabel(entry.entered)} ${weightStageName(entry.rule,entry.stage)} → ${shoppingWeightLabel(entry.amount)} ${weightStageName(entry.rule,entry.rule.basis)}${entry.cost?` · 当时估算 ${shoppingMoney(entry.cost.cents)}`:''}`).join('；')
}
function readWeightPortion(control, foodId, entered) {
  const result=control?control.read(true):{conversion:null,saveRule:null}
  if(!result)return null
  const entry=result.conversion?weightEntryFor(foodId,entered,result.conversion):null
  const amount=entry?.amount??entered
  if(!Number.isFinite(entered)||entered<=0||!Number.isFinite(amount)||amount<0.1||amount>3000) {showToast('换算后的营养计量应在0.1–3000g之间');return null}
  return {amount,entry,saveRule:result.saveRule}
}

// Logging only consumes a saved rule; editing lives in the library/prep views.
function readSavedWeightPortion(foodId, entered) {
  if(foodStatePair(foodId)) {
    const stage=foodState(foodId)==='cooked'?'cooked':'edible'
    const rule=commonWeightRule(foodId)||{id:'paired-default',foodId,name:'生熟重量',mode:'direct',bought:100,edible:100,cooked:100,basis:stage,portionStage:stage,edibleMeasured:false}
    return readWeightPortion({read:()=>({conversion:{rule:{...rule,foodId,basis:stage},stage},saveRule:null})},foodId,entered)
  }
  const rule=commonWeightRule(foodId)
  return readWeightPortion(rule?{read:()=>({conversion:{rule:{...rule,foodId},stage:rule.portionStage},saveRule:null})}:null,foodId,entered)
}
function applySavedWeightLoggingContext(container, foodId, prefix, amount, fromCanonical=true) {
  const rule=foodStatePair(foodId)?null:commonWeightRule(foodId)
  const toInput=value=>rule?oneDecimal(weightConvert(Number(value),rule,rule.basis,rule.portionStage),0.1,3000):value
  container.querySelectorAll(`[data-${prefix}-amount-choice]`).forEach(button=>{
    const attr=`data-${prefix}-amount-choice`,value=toInput(button.getAttribute(attr))
    button.setAttribute(attr,value);button.textContent=`${value}g`
  })
  const caption=container.querySelector('.current-amount-panel small')
  if(caption)caption.textContent=foodById(foodId)?.kind==='dish'?'熟重 · g':foodState(foodId)==='raw'?'生可食重 · g':foodState(foodId)==='cooked'?'熟可食重 · g':rule?`按${weightStageName(rule,rule.portionStage)}`:'按克记录'
  const next=fromCanonical?toInput(amount):amount
  const input=container.querySelector(`[data-${prefix}-amount-input]`)
  if(input)input.value=next
  return next
}

function saveLibraryFoodWithWeightRule(food, existing, update) {
  const before=existing?{...existing}:null,previousRules=state.foodWeightRules,previousPairs=state.foodStatePairs,previousNutrients=state.foodPairNutrients
  try {
    if(existing)Object.assign(existing,food);else foods.push(food)
    if(update.changed)state.foodWeightRules=update.rule?stageWeightRule(update.rule):(previousRules||[]).filter(rule=>canonicalFoodId(rule.foodId)!==canonicalFoodId(food.id))
    if(update.pair){
      const {rawFoodId,cookedFoodId}=update.pair
      if(rawFoodId!==food.id||!foodById(cookedFoodId)||foodById(cookedFoodId)?.kind==='dish'||!matchingFoodStagePair(food,foodById(cookedFoodId)))throw new Error('仅能关联名称前缀相同、只差生熟后缀的食材')
      state.foodStatePairs=normalizeFoodStatePairs([...(previousPairs||[]).filter(item=>![rawFoodId,cookedFoodId].includes(item.rawFoodId)&&![rawFoodId,cookedFoodId].includes(item.cookedFoodId)),update.pair])
      if(!state.foodStatePairs.some(item=>item.rawFoodId===rawFoodId&&item.cookedFoodId===cookedFoodId))throw new Error('关联食物冲突')
    }
    if(update.nutrientKey){
      const next={...(previousNutrients||{})}
      if(update.nutrientKey==='auto')delete next[food.id]
      else if(['carbs','protein','fat'].includes(update.nutrientKey))next[food.id]=update.nutrientKey
      else throw new Error('营养成分无效')
      state.foodPairNutrients=next
    }
    if(update.sampleRule)state.foodWeightRules=stageWeightRule(update.sampleRule)
    persistState()
    return true
  } catch {
    if(existing){for(const key of Object.keys(existing))delete existing[key];Object.assign(existing,before)}
    else {const index=foods.indexOf(food);if(index>=0)foods.splice(index,1)}
    state.foodWeightRules=previousRules;state.foodStatePairs=previousPairs;state.foodPairNutrients=previousNutrients;showToast('保存失败，原食物与规则已保留，草稿未丢失');return false
  }
}
function openMealWeightConversion(mealIndex, foodId) {
  const item=state.meals[mealIndex]?.items.find(item=>item.foodId===foodId);if(!item)return
  const parentInput=sheetContent.querySelector(`[data-meal-item-amount="${CSS.escape(foodId)}"]`)
  if(!parentInput)return
  const pending=parentInput.weightResult
  const source=pending?{foodId,amount:pending.amount,weightEntries:pending.entry?[pending.entry]:[]}:item
  const amount=parentInput.value===String(oneDecimal(source.amount,0.1,3000))?source.amount:oneDecimal(parentInput.value||source.amount,0.1,3000)
  const entries=scaleWeightEntries(source,amount)
  const single=entries.length===1&&Math.abs(entries[0].amount-amount)<0.001?entries[0]:null
  const dialog=openActionDialog(`${foodById(foodId).name} · 重量换算`,{className:'food-portion-overlay'})
  dialog.content.innerHTML=`<label class="form-field"><span>本餐此食物总分量 · g</span><input type="number" data-weight-portion value="${single?single.entered:parentInput.value}" min="0.1" max="1000000" step="0.1" aria-label="本餐称重分量"></label><div data-weight-host></div>${entries.length?`<details class="weight-stock-detail"><summary>已记录的换算与成本</summary><p>${escapeHtml(weightRecordSummary(source))}</p></details>`:''}<p class="weight-note">应用后重设本餐此食物的总分量，不追加一份；在餐食编辑页完成保存。</p><button type="button" id="save-meal-weight" class="primary-action">应用至本餐</button>`
  const input=dialog.content.querySelector('[data-weight-portion]')
  const control=mountWeightConversion(dialog.content.querySelector('[data-weight-host]'),foodId,{initial:single,auto:false,amount:()=>Number(input.value)})
  control.root.open=true;input.oninput=()=>control.refresh()
  dialog.content.querySelector('#save-meal-weight').onclick=()=>{
    const result=readWeightPortion(control,foodId,Number(input.value));if(!result)return
    if(single&&result.entry&&JSON.stringify({...result.entry,cost:null})===JSON.stringify({...single,cost:null}))result.entry.cost=single.cost
    parentInput.weightResult=result;parentInput.value=oneDecimal(result.amount,0.1,3000)
    parentInput.dispatchEvent(new Event('input',{bubbles:true}))
    dialog.close()
  }
}

// New transactions reuse a configured food rule. Existing records/receipts pass
// an explicit snapshot (or auto:false); changing a rule never rewrites history.
function mountWeightConversion(host, foodId, options={}) {
  const conversionFood=()=>options.food?.()||foodById(foodId)
  const isDish=conversionFood()?.kind==='dish'
  const rules=isDish?[]:weightRulesFor(foodId),common=options.auto===false?null:rules[0]
  const initial=normalizeWeightSnapshot(options.initial,foodId)||(common?{rule:{...common,foodId},stage:options.purchase?(common.mode==='cookOnly'?'edible':'bought'):common.portionStage}:null)
  const root=document.createElement('details');root.className='weight-conversion'
  root.dataset.foodId=foodId
  // Preserve explicit snapshots for legacy receipt edits, not new dish rules.
  root.hidden=isDish
  root.innerHTML=`<summary>可食部分 / 生熟换算 <span data-weight-caption></span></summary>
    <div class="weight-conversion-body"><label class="form-field"><span>换算方式</span><select data-weight-rule aria-label="重量换算规则"><option value="off">不换算（按食物营养口径）</option><option value="new">输入本次实测</option>${initial?'<option value="snapshot">当前使用的规则</option>':''}${rules.map((rule,i)=>`<option value="${i}">${escapeHtml(rule.name)}${i===0?' · 常用':''}</option>`).join('')}</select></label>
    <div data-weight-fields hidden><label class="form-field"><span>处理步骤</span><select data-weight-mode aria-label="处理步骤"><option value="trim">仅可食部分：买入 → 可食净重</option><option value="cookOnly">仅生熟差：生可食重 → 熟可食重</option><option value="cook">两项都算：买入 → 生净重 → 熟净重</option></select></label>
    <p class="weight-note">${options.detail?'填写同一批食物的实测重量，不含包装。保存后用于新记录和采购，不修改历史记录。':'填写同一整批食物的实测重量，不含包装；上方分量是本次使用量。'}</p>
    <div class="weight-measurements">${[['bought','购买原重'],['edible','去皮骨等后'],['cooked','做熟后']].map(([key,label])=>`<label class="form-field" data-weight-measure="${key}"><span>${label} · g</span><input data-weight-${key} type="number" min="0.1" max="1000000" step="0.1" aria-label="实测${label}" value=""></label>`).join('')}</div>
    <label class="form-field"><span>此食物每100g营养对应</span><select data-weight-basis aria-label="营养数据重量口径"></select></label>
    <label class="form-field"><span>${options.detail?'记录时默认称重口径':options.purchase?'本笔购买数量按':'上方本次分量按'}</span><select data-weight-stage aria-label="本次称重口径"></select></label>
    <p class="weight-note">营养数据应与生熟、去皮等状态一致；重量比例不会自动推断营养损失。</p>
    ${conversionFood()?.recipe?'<p class="weight-note">已填配方成品重量时按熟可食重，未填时按生投料口径；先折合营养口径再展开原料，不重复应用出成率。</p>':''}
    <label class="weight-save-rule"><input data-weight-save type="checkbox">保存为常用，下次自动沿用</label>
    <input data-weight-name type="text" maxlength="40" aria-label="常用规则名称" placeholder="例如：南瓜去瓤蒸熟" hidden>
    </div><p class="weight-preview" data-weight-preview role="status"></p></div>`
  host.append(root)
  const q=selector=>root.querySelector(selector)
  let ruleId='',loadedSnapshot=initial
  const fieldValues=()=>({id:ruleId,foodId,name:q('[data-weight-name]').value||'实测换算',mode:q('[data-weight-mode]').value,
    bought:Number(q(q('[data-weight-mode]').value==='cookOnly'?'[data-weight-edible]':'[data-weight-bought]').value),edible:Number(q('[data-weight-edible]').value),cooked:Number(q('[data-weight-cooked]').value),basis:q('[data-weight-basis]').value,
    portionStage:options.purchase?(loadedSnapshot?.rule.portionStage||q('[data-weight-basis]').value):q('[data-weight-stage]').value})
  const read=(warn=false)=>{
    if (q('[data-weight-rule]').value==='off') return {conversion:null,saveRule:null}
    const rule=normalizeWeightRule(fieldValues()),stage=q('[data-weight-stage]').value
    if (!rule || !Number.isFinite(weightConvert(1,rule,stage))) {
      if(warn)showToast('请填写完整有效的同批重量；可食净重不能超过购买原重')
      return null
    }
    if(conversionFood()?.recipe&&rule.mode!=='trim'&&rule.basis!==(conversionFood().recipe.yieldWeight>0?'cooked':'edible')) {
      if(warn)showToast(conversionFood().recipe.yieldWeight>0?'此菜肴营养已按成品重量计算，请选择熟可食重':'此菜肴未填成品重量，请选择生可食重，或先填写配方成品重量')
      return null
    }
    return {conversion:{rule,stage},saveRule:q('[data-weight-save]').checked?rule:null}
  }
  const preview=()=>{
    const result=read(),out=q('[data-weight-preview]')
    // History and preset amounts are stored in the nutrition basis. Display
    // them in the selected weighing stage before reusing them as input.
    host.parentElement.querySelectorAll('[data-portion-amount-choice],[data-log-amount-choice]').forEach(button=>{
      const attr=button.hasAttribute('data-portion-amount-choice')?'data-portion-amount-choice':'data-log-amount-choice'
      const canonical=Number(button.dataset.weightCanonicalAmount??button.getAttribute(attr))
      button.dataset.weightCanonicalAmount=canonical
      const next=result?.conversion?weightConvert(canonical,result.conversion.rule,result.conversion.rule.basis,result.conversion.stage):canonical
      button.setAttribute(attr,oneDecimal(next,0.1,3000));button.textContent=`${oneDecimal(next,0.1,3000)}g`
    })
    q('[data-weight-caption]').textContent=result?.conversion?'已启用 · '+weightStageName(result.conversion.rule,result.conversion.stage):'未启用'
    if (!result) out.textContent='请补齐同批实测重量，自动计算比例。'
    else if (!result.conversion) out.textContent='不应用可食率或生熟比例。'
    else {
      const {rule,stage}=result.conversion,input=Number(options.amount?.()||0),amount=weightConvert(input,rule,stage)
      const ratio=[...(rule.mode==='cookOnly'?[]:[`可食率 ${rounded(rule.edible/rule.bought*100)}%`]),...(rule.mode==='trim'?[]:[`熟/生重量比 ${rounded(rule.cooked/rule.edible*100)}%`])].join(' · ')
      const cost=!options.purchase&&input>0?weightEntryFor(foodId,input,result.conversion)?.cost:null
      out.textContent=`${ratio}${input>0?`。本次 ${shoppingWeightLabel(input)} ${weightStageName(rule,stage)} → ${shoppingWeightLabel(amount)} ${weightStageName(rule,rule.basis)}；对应原重 ${shoppingWeightLabel(weightConvert(input,rule,stage,'bought'))}`:''}${cost?` · 估算 ${shoppingMoney(cost.cents)}`:''}`
    }
    options.onchange?.(result)
  }
  const stageOptions=(basis,stage)=>{
    const mode=q('[data-weight-mode]').value,cook=mode!=='trim',temp={mode}
    q('[data-weight-measure="cooked"]').hidden=!cook
    q('[data-weight-measure="bought"]').hidden=mode==='cookOnly'
    q('[data-weight-measure="edible"] > span').textContent=mode==='cookOnly'?'生可食重 · g':'去皮骨等后 · g'
    q('[data-weight-basis]').innerHTML=['edible',...(cook?['cooked']:[])].map(key=>`<option value="${key}">${weightStageName(temp,key)}</option>`).join('')
    q('[data-weight-stage]').innerHTML=['bought','edible',...(cook?['cooked']:[])].map(key=>`<option value="${key}">${weightStageName(temp,key)}</option>`).join('')
    q('[data-weight-basis]').value=cook&&(basis==='cooked'||conversionFood()?.recipe?.yieldWeight>0)?'cooked':'edible'
    q('[data-weight-stage]').value=stage && (cook || stage!=='cooked')?stage:options.purchase?'bought':cook?'cooked':'edible'
  }
  const fill=snapshot=>{
    const rule=snapshot?.rule;ruleId=rule?.id||''
    q('[data-weight-mode]').value=rule?.mode||'trim'
    for (const key of ['bought','edible','cooked']) q(`[data-weight-${key}]`).value=rule?.[key]??''
    q('[data-weight-name]').value=rule?.name||''
    q('[data-weight-save]').checked=false;q('[data-weight-name]').hidden=!options.detail
    stageOptions(rule?.basis,snapshot?.stage);preview()
  }
  const load=snapshot=>{
    loadedSnapshot=snapshot
    q('[data-weight-rule]').value=snapshot?'snapshot':'off'
    if(snapshot&&!q('[data-weight-rule] option[value="snapshot"]')) q('[data-weight-rule]').add(new Option('当前使用的规则','snapshot'))
    q('[data-weight-rule]').value=snapshot?'snapshot':'off';q('[data-weight-fields]').hidden=!snapshot
    fill(snapshot)
  }
  q('[data-weight-rule]').onchange=()=>{
    const choice=q('[data-weight-rule]').value
    q('[data-weight-fields]').hidden=choice==='off'
    const rule=rules[Number(choice)]
    fill(choice==='snapshot'?loadedSnapshot:rule?{rule,stage:options.purchase?(rule.mode==='cookOnly'?'edible':'bought'):rule.portionStage}:null)
  }
  q('[data-weight-mode]').onchange=()=>{stageOptions(q('[data-weight-basis]').value);preview()}
  q('[data-weight-save]').onchange=()=>{q('[data-weight-name]').hidden=!q('[data-weight-save]').checked;preview()}
  root.addEventListener('input',preview);root.addEventListener('change',preview)
  load(initial)
  const capture=()=>({open:root.open,ruleId,loadedSnapshot,basis:q('[data-weight-basis]').value,stage:q('[data-weight-stage]').value,values:[...root.querySelectorAll('input,select')].map(input=>input.type==='checkbox'?input.checked:input.value)})
  const restore=draft=>{
    if(!draft)return
    load(draft.loadedSnapshot);ruleId=draft.ruleId
    const fields=[...root.querySelectorAll('input,select')]
    fields.forEach((input,i)=>{if(input.type==='checkbox')input.checked=draft.values[i];else input.value=draft.values[i]})
    stageOptions(draft.basis,draft.stage)
    q('[data-weight-fields]').hidden=q('[data-weight-rule]').value==='off'
    q('[data-weight-name]').hidden=!options.detail&&!q('[data-weight-save]').checked;root.open=draft.open;preview()
  }
  if(options.detail)q('.weight-save-rule').hidden=true
  const control={root,read,refresh:preview,load,capture,resetDefault:()=>load(common?{rule:{...common,foodId},stage:options.purchase?(common.mode==='cookOnly'?'edible':'bought'):common.portionStage}:null),signature:()=>capture().values}
  root.weightControl=control;restore(options.draft)
  if(initial&&common&&!options.initial&&!options.draft&&options.setPresetAmount) {
    options.setPresetAmount(oneDecimal(weightConvert(Number(options.amount()),initial.rule,initial.rule.basis,initial.stage),0.1,3000));preview()
  }
  return control
}

function openFoodWeightDetail(foodId, required=0) {
  const food=foodById(foodId);if(!food)return
  if(food.kind==='dish'){openDishCostDetail(foodId,required||100);return}
  beginEditorPage(`weight-${foodId}`);sheetKicker.textContent='';sheetTitle.textContent=`${food.name} · 生熟与称重`
  const pair=foodStatePair(foodId),average=pair&&pairedYieldRule(pair.rawFoodId),ratio=pair&&foodPairRatio(pair)
  const rule=commonWeightRule(foodId)
  const ledger=shoppingLedgerEnabled(),stats=ledger?shoppingPurchaseStats(state.shoppingPurchases,foodId,state.cycleStartDate,required):null
  sheetContent.innerHTML=`<div class="food-weight-detail">${pair?`<div class="weight-pair-summary"><strong>生可食 100g ≈ 熟可食 ${rounded(100*ratio.ratio)}g</strong><small>${ratio.source}${average?` · ${average.sampleCount} 次完整生熟称重${average.edibleEstimatedCount?` · ${average.edibleEstimatedCount} 次生可食重按买来重量估算`:''}`:ratio.nutrient?` · 依据${{protein:'蛋白质',carbs:'碳水',fat:'脂肪'}[ratio.nutrient]}浓度` : ''}</small><small>买来 100g ≈ 熟可食 ${rounded(100*foodEdibleRatio(pair.rawFoodId)*ratio.ratio)}g</small></div>`:`<p class="weight-note">尚未关联生熟两态。未设置换算时，记录重量按食物资料原样使用。</p>${rule?`<p class="weight-preview">当前常用可食率：${rounded(rule.edible/rule.bought*100)}%</p>`:''}`}
    ${required?`<p class="weight-preview">计划 ${shoppingWeightLabel(required)} · 约需买 ${shoppingWeightLabel(weightSuggestedPurchase(foodId,required))}</p>`:''}
    <button type="button" class="primary-action" id="edit-food-weight">编辑生熟关联与实测</button>
    ${ledger?`<details class="weight-stock-detail"><summary>本周期采购与余量</summary><p>实付 ${shoppingMoney(stats.cents)} · 折合可用 ${shoppingWeightLabel(stats.grams)}${required?` · 相对计划${stats.surplus?'余':'差'} ${shoppingWeightLabel(stats.surplus||stats.remaining)}`:''}</p><small>仅相对本周期计划的估算，不是实时库存，不跨周期自动结转。</small><button class="secondary-action" id="weight-open-purchases" type="button">查看 / 记录采购</button></details>`:''}</div>`
  sheetContent.querySelector('#edit-food-weight').onclick=()=>openFoodEditorSheet(pair?.rawFoodId||foodId)
  sheetContent.querySelector('#weight-open-purchases')?.addEventListener('click',()=>openShoppingPurchaseEditor(pair?.cookedFoodId===canonicalFoodId(foodId)?pair.rawFoodId:foodId))
  openSheet()
}
