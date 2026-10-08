// Web-only presentation tools. No writes to nutrition snapshots or purchase receipts.
let prepMaterialView = false

function mealSetAutomaticName(items) {
  return items.map(item => foodById(item.foodId)?.name || item.name || '食材').join('＋') || '套餐'
}

function expandPrepIngredients(items, ancestors = new Set()) {
  const leaves = new Map()
  const add = item => {
    const id = canonicalFoodId(item.foodId) || `recipe-${[...(item.name || '食材')].reduce((hash, char) => (Math.imul(hash, 31) + char.codePointAt(0)) | 0, 0) >>> 0}`
    const previous = leaves.get(id)
    leaves.set(id, {...item, foodId: id, amount: (previous?.amount || 0) + item.amount})
  }
  for (const item of items) {
    const food = foodById(item.foodId), recipe = food?.recipe
    const ingredients = recipe?.ingredients
    const inputWeight = ingredients?.reduce((sum, ingredient) => sum + Number(ingredient.amount), 0)
    const basis = Number(recipe?.yieldWeight) > 0 ? Number(recipe.yieldWeight) : inputWeight
    if (!ingredients?.length || !Number.isFinite(basis) || basis <= 0 || ancestors.has(food.id) || ancestors.size >= 20) {
      add({...item, name: food?.name || item.name || '缺失食材', unresolved: Boolean(ingredients?.length)})
      continue
    }
    const path = new Set(ancestors); path.add(food.id)
    for (const leaf of expandPrepIngredients(ingredients.map(ingredient => ({...ingredient, amount: ingredient.amount * item.amount / basis})), path)) add(leaf)
  }
  return [...leaves.values()]
}

function prepIngredientName(foodId) {
  const items = Object.entries(weeklyFoodTotals()).map(([foodId, amount]) => ({foodId, amount}))
  return expandPrepIngredients(items).find(item => item.foodId === foodId)?.name || '食材'
}

function dishIngredientCost(foodId, amount = 100) {
  const rows = expandPrepIngredients([{foodId, amount}]).map(item => {
    const history = shoppingFoodHistory(item.foodId)
    const known = history.count > 0 && !item.unresolved
    return {...item, known, perKg: history.perKg, cents: known ? history.perKg * item.amount / 10 : 0}
  })
  return {rows, cents: rows.reduce((sum, row) => sum + row.cents, 0), missing: rows.filter(row => !row.known).length}
}
// A purchase is an expense; this is the independent cost of food actually eaten.
function foodCostBasis(foodId, dateValue) {
  const ingredients=expandPrepIngredients([{foodId,amount:100}])
  let cents=0,missing=0
  for(const ingredient of ingredients){
    if(ingredient.unresolved){missing++;continue}
    const rows=shoppingRowsForFood(state.shoppingPurchases,ingredient.foodId).filter(row=>row.date<=dateValue)
    const grams=rows.reduce((sum,row)=>sum+shoppingGramsForFood(row,ingredient.foodId),0)
    if(!rows.length||grams<=0){missing++;continue}
    cents+=ingredient.amount*rows.reduce((sum,row)=>sum+row.paidCents,0)/grams
  }
  return {centsPerGram:cents/100,missing,sourceDate:dateValue}
}
function stampMealCostBasis(meal,dateValue){
  for(const item of meal.items||[]){
    if(item.costSnapshot)continue
    const basis=foodCostBasis(item.foodId,dateValue)
    if(!basis.missing)item.costSnapshot=basis
  }
}
function mealConsumptionCost(meal,dateValue){
  let cents=0,missing=0
  const macros={carbs:0,protein:0,fat:0,other:0}
  for(const item of meal.items||[]){
    const basis=item.costSnapshot?.missing===0?item.costSnapshot:foodCostBasis(item.foodId,dateValue)
    const itemCents=Number(basis.centsPerGram||0)*Number(item.amount||0)
    cents+=itemCents
    missing+=Number(basis.missing||0)
    const nutrition=nutrientsForItems([item])
    const energy={carbs:Math.max(0,nutrition.carbs)*4,protein:Math.max(0,nutrition.protein)*4,fat:Math.max(0,nutrition.fat)*9}
    const energyTotal=energy.carbs+energy.protein+energy.fat
    if(energyTotal>0){
      for(const key of ['carbs','protein','fat'])macros[key]+=itemCents*energy[key]/energyTotal
    }else macros.other+=itemCents
  }
  return {cents,missing,macros}
}
function dailyConsumptionCost(dateValue){
  const record=state.dailyRecords[dateValue]
  const meals=[...(record?.meals||[]),...(record?.hiddenMeals||[])].filter(meal=>meal.items?.length&&!meal.isPlanned)
  const costs=meals.map(meal=>({id:meal.id,name:meal.name,...mealConsumptionCost(meal,dateValue)}))
  const macros={carbs:0,protein:0,fat:0,other:0}
  for(const meal of costs)for(const key of Object.keys(macros))macros[key]+=meal.macros[key]
  return {meals:costs,macros,foodCount:meals.reduce((sum,meal)=>sum+meal.items.length,0),
    cents:costs.reduce((sum,meal)=>sum+meal.cents,0),missing:costs.reduce((sum,meal)=>sum+meal.missing,0)}
}

function bindPrepMaterialControls() {
  const heading = document.querySelector('#shopping-list').previousElementSibling
  let toggle = heading.querySelector('#prep-material-toggle')
  if (!toggle) {
    toggle = document.createElement('button'); toggle.id = 'prep-material-toggle'; toggle.type = 'button'
    heading.querySelector('h2')?.replaceChildren(toggle)
  }
  toggle.textContent = prepMaterialView ? '原料清单 ⇄' : '备餐清单 ⇄'
  toggle.setAttribute('aria-label', prepMaterialView ? '切换为菜肴显示' : '将菜肴展开为原材料')
  toggle.setAttribute('aria-pressed', String(prepMaterialView))
  toggle.onclick = () => { prepMaterialView = !prepMaterialView; renderPrep() }
  document.querySelectorAll('[data-shopping-row]').forEach(row => {
    const id = row.dataset.shoppingRow
    if (!foodById(id)?.recipe?.ingredients?.length) return
    const copy = row.querySelector('.shopping-copy')
    const button = document.createElement('button')
    button.type = 'button'; button.className = 'shopping-dish-detail'
    button.innerHTML = copy.innerHTML; button.setAttribute('aria-label', `查看${foodById(id).name}${shoppingLedgerEnabled() ? '原材料与费用' : '原材料'}`)
    button.onclick = () => openDishCostDetail(id, weeklyFoodTotals()[id] || 100)
    copy.replaceChildren(button)
  })
}

function openDishCostDetail(foodId, amount = 100) {
  const food = foodById(foodId)
  if (!food) return
  beginEditorPage(`dish-cost-${foodId}`)
  sheetKicker.textContent = ''; sheetTitle.textContent = food.name
  const ledger = shoppingLedgerEnabled()
  const cost = ledger ? dishIngredientCost(foodId, amount) : {rows: expandPrepIngredients([{foodId, amount}])}
  const measured = Number(food.recipe?.yieldWeight) > 0
  const rowsHtml = cost.rows.map((row, i) => {
    const price = ledger ? row.known ? ` · 净均 ¥${Number(row.perKg.toFixed(1))}/kg` : ' · 尚无均价' : ''
    const content = `${foodIconHtml(foodById(row.foodId) || {name: row.name, category: 'other', useIcon: false}, true)}<span><strong>${escapeHtml(row.name)}</strong><small>${shoppingWeightLabel(row.amount)}${price}</small></span>`
    return ledger ? `<button class="cost-row" type="button" data-cost-ingredient="${i}">${content}<b>${row.known ? shoppingMoney(row.cents) : '补记 ›'}</b></button>` : `<div class="cost-row">${content}</div>`
  }).join('')
  sheetContent.innerHTML = `<div class="dish-cost-view"><div class="cost-heading"><span>${shoppingWeightLabel(amount)} · ${measured ? '按成品重量' : '按投料重量'}</span><strong>${ledger ? `${cost.missing ? '已知成本 ' : '食材成本 '}${shoppingMoney(cost.cents)}` : '原材料'}</strong></div>${ledger ? `<p class="cost-basis">按食材历史采购加权均价自动计算${cost.missing ? ` · ${cost.missing}项待补价` : ''}</p>` : ''}<div class="cost-rows">${rowsHtml}</div>${ledger ? '<p class="cost-basis">费用随食材记账更新，不另记一笔采购。</p>' : ''}</div>`
  sheetContent.querySelectorAll('[data-cost-ingredient]').forEach(button => button.onclick = () => {
    const row = cost.rows[Number(button.dataset.costIngredient)]
    if (row.unresolved) { showToast('配方存在循环引用，请先编辑菜肴'); return }
    openShoppingPurchaseEditor(row.foodId, state.cycleStartDate, row.name)
  })
  sheetContent.querySelector('.dish-cost-view').dataset.costAmount = amount
  if (ledger && shoppingFoodHistory(foodId).count) {
    const legacy = document.createElement('button'); legacy.type = 'button'; legacy.className = 'secondary-action'
    legacy.textContent = '查看既有菜肴采购记录'; legacy.onclick = openShoppingPurchaseHistory
    sheetContent.querySelector('.dish-cost-view').append(legacy)
  }
  openSheet()
}

function clearMealFoods(mealIndex) {
  const recordDate = dateKey(selectedDate()), record = ensureSelectedDateRecord(), meal = state.meals[mealIndex]
  if (!meal?.items.length || mealContentMovePending) return
  const beforeItems = cloneItems(meal.items), beforePlanned = meal.isPlanned, plans = record.plannedMeals
  meal.items = []; markMealAsRecorded(mealIndex)
  try { persistState() } catch {
    meal.items = beforeItems
    if (beforePlanned) meal.isPlanned = true
    record.plannedMeals = plans
    showToast('清空失败，原餐食已保留'); renderMeals(); return
  }
  const refresh = () => { if (dateKey(selectedDate()) === recordDate) { renderMeals(); updateSummary() }; renderTrends() }
  refresh()
  showToast(`已清空${meal.name}的食物`, () => {
    // Do not undo across later edits/reorders. Photos and other meals are never cleared.
    const currentMeals = dateKey(selectedDate()) === recordDate ? state.meals : record.meals
    const currentMeal = currentMeals.find(item => item.id === meal.id)
    if (!currentMeal || currentMeal.items.length || currentMeal.isPlanned) { showToast('本餐已变更，未覆盖新记录'); return }
    const currentPlans = record.plannedMeals
    currentMeal.items = beforeItems
    if (beforePlanned) currentMeal.isPlanned = true
    record.meals = currentMeals
    record.plannedMeals = [...(currentPlans || []).filter(item => item.id !== meal.id), ...(plans || []).filter(item => item.id === meal.id)]
    try { persistState() } catch {
      currentMeal.items = []; delete currentMeal.isPlanned; record.plannedMeals = currentPlans
      showToast('恢复失败，请检查存储空间'); return
    }
    refresh(); showToast('已恢复本餐食物')
  })
}

function dailyShareData() {
  const meals = state.meals.filter(meal => !meal.isPlanned && meal.items.length)
  return {date: dateKey(selectedDate()), target: {...currentTarget()}, nutrition: {...totals()},
    complete: state.meals.length > 0 && meals.length === state.meals.length, count: meals.length, total: state.meals.length,
    meals: meals.map(meal => ({name: meal.name, time: meal.time, nutrition: mealNutrients(meal), items: meal.items.map(item => ({name: foodById(item.foodId)?.name || '食物', amount: item.amount}))}))}
}

function createDailyShareImage(data) {
  const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d')
  const theme = getComputedStyle(document.documentElement)
  const color = key => theme.getPropertyValue(key).trim()
  const lines = []
  // Wrap all food names rather than silently dropping long menus from the export.
  ctx.font = '24px system-ui'
  for (const meal of data.meals) {
    let line = '', wrapped = []
    for (const char of meal.items.map(item => `${item.name} ${Number(item.amount.toFixed(1))}g`).join(' · ')) {
      if (ctx.measureText(line + char).width > 556) { wrapped.push(line); line = char }
      else line += char
    }
    if (line) wrapped.push(line)
    lines.push({meal, wrapped})
  }
  canvas.width = 660; canvas.height = 330 + lines.reduce((sum, row) => sum + 95 + row.wrapped.length * 34, 0)
  ctx.fillStyle = color('--surface') || '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = color('--pine'); ctx.font = '700 24px system-ui'; ctx.fillText('食由己 · 每日饮食', 48, 55)
  ctx.fillStyle = color('--ink'); ctx.font = '700 38px system-ui'; ctx.fillText(data.date, 48, 115)
  ctx.fillStyle = color('--muted'); ctx.font = '24px system-ui'; ctx.fillText(`${data.complete ? '今日打卡完成' : '今日饮食记录'} · ${data.count}/${data.total} 餐`, 48, 157)
  ctx.fillStyle = color('--ink'); ctx.font = '700 32px system-ui'; ctx.fillText(`${Math.round(data.nutrition.calories)} / ${Math.round(data.target.calories)} kcal`, 48, 216)
  ctx.font = '24px system-ui'; ctx.fillText(`碳 ${Number(data.nutrition.carbs.toFixed(1))}g   蛋 ${Number(data.nutrition.protein.toFixed(1))}g   脂 ${Number(data.nutrition.fat.toFixed(1))}g`, 48, 260, 556)
  let y = 310
  for (const {meal, wrapped} of lines) {
    ctx.strokeStyle = color('--line'); ctx.beginPath(); ctx.moveTo(48,y); ctx.lineTo(612,y); ctx.stroke()
    ctx.fillStyle = color('--ink'); ctx.font = '700 27px system-ui'; ctx.fillText(`${meal.name}  ${meal.time}`, 48, y + 42, 556)
    ctx.fillStyle = color('--muted'); ctx.font = '24px system-ui'
    for (let i = 0; i < wrapped.length; i++) ctx.fillText(wrapped[i], 48, y + 82 + i * 34)
    y += 95 + wrapped.length * 34
  }
  return canvas.toDataURL('image/png')
}

function openDailySharePage(data = dailyShareData()) {
  beginEditorPage('daily-share')
  sheetKicker.textContent = ''; sheetTitle.textContent = '打卡分享'
  const image = createDailyShareImage(data)
  sheetContent.innerHTML = `<div class="daily-share-actions"><button class="secondary-action" id="download-daily-share" type="button">保存图片</button><button class="primary-action" id="share-daily-image" type="button">分享</button></div><img class="daily-share-image" src="${image}" alt="${data.date}饮食打卡，已记录${data.count}餐，共${Math.round(data.nutrition.calories)}千卡"><p class="cost-basis">仅包含当日饮食，不包含体重、账号或照片。</p>`
  const download = () => { const link = document.createElement('a'); link.href = image; link.download = `食由己-${data.date}.png`; link.click() }
  sheetContent.querySelector('#download-daily-share').onclick = download
  sheetContent.querySelector('#share-daily-image').onclick = async () => {
    const button = sheetContent.querySelector('#share-daily-image'); button.disabled = true
    try {
      const blob = await (await fetch(image)).blob(), file = new File([blob], `食由己-${data.date}.png`, {type: 'image/png'})
      if (navigator.canShare?.({files: [file]})) await navigator.share({files: [file], title: '食由己 · 每日打卡'})
      else { download(); showToast('图片已生成，可保存后分享') }
    } catch (error) { if (error.name !== 'AbortError') showToast('分享未完成，请使用保存图片') }
    finally { button.disabled = false }
  }
  openSheet()
}

// Stable search DOM + deferred IME search: composition text must not trigger a rerender.
const composingSearchInputs = new WeakSet()
document.addEventListener('compositionstart', event => {
  if (event.target.matches('input[type="search"]')) composingSearchInputs.add(event.target)
}, true)
document.addEventListener('input', event => {
  if (composingSearchInputs.has(event.target) || (event.isComposing && event.target.matches('input[type="search"]'))) event.stopImmediatePropagation()
}, true)
document.addEventListener('compositionend', event => {
  if (!composingSearchInputs.has(event.target)) return
  composingSearchInputs.delete(event.target)
  event.target.dispatchEvent(new Event('input', {bubbles: true}))
}, true)

const layoutTargets = {
  pages: ['所有主页', '.today-page,.page-content'], card: ['卡片', '.summary-card,.chart-card,.prep-plan-card,.prep-card'],
  summary: ['营养目标', '.today-page .summary-card'], date: ['营养日期', '.summary-date-button'],
  arrow: ['左右切日区', '.date-row'], macros: ['碳蛋脂', '.macro-stack'],
  title: ['营养目标左栏', '.summary-title-block'], meals: ['餐次内容', '.meal-row-content'],
  library: ['食物库列表', '#food-library'], food: ['食物列表行', '.library-food'],
  shopping: ['备餐清单行', '.shopping-item'], editor: ['编辑页内容', '#sheet-content,.meal-set-page-content'],
  log: ['记录餐食内容', '#bottom-sheet:has(.meal-log-layout) #sheet-content'],
  logRow: ['记录食物列表行', '.meal-log-layout .food-option'], settings: ['设置分组', '.settings-section-body']
}
const layoutProperties = ['padding-top','padding-right','padding-bottom','padding-left','margin-top','margin-right','margin-bottom','margin-left']
const layoutLabels = ['内上','内右','内下','内左','外上','外右','外下','外左']
const layoutStorageKey = 'shiyouji-web-layout-v1'
let savedLayout = typeof bundledSpacingDefaults==='object'?structuredClone(bundledSpacingDefaults.legacySpacing):{}
try { const stored=localStorage.getItem(layoutStorageKey);if(stored!==null)savedLayout=JSON.parse(stored) } catch {}
if (!savedLayout || typeof savedLayout !== 'object' || Array.isArray(savedLayout)) savedLayout = {}
function applyLayoutSettings(settings) {
  let style = document.querySelector('#user-layout-style')
  if (!style) { style = document.createElement('style'); style.id = 'user-layout-style'; document.head.append(style) }
  style.textContent = '@layer user-legacy-spacing {' + Object.entries(layoutTargets).map(([key, [, selector]]) => {
    const values = settings?.[key] || {}
    return `${selector}{${layoutProperties.filter(prop => Number.isFinite(values[prop]) && values[prop] >= 0 && values[prop] <= 48).map(prop => `${prop}:${values[prop]}px!important`).join(';')}}`
  }).join('\n') + '}'
}
applyLayoutSettings(savedLayout)

function openLayoutTuner() {
  openPageSpacingEditor()
}

document.addEventListener('DOMContentLoaded', () => {
  // Keep legacy saved spacing; the new editor adds page-scoped overrides.
  document.querySelector('#daily-share-open').onclick = () => openDailySharePage()
  const updateViewport = () => {
    const viewport = window.visualViewport
    document.documentElement.style.setProperty('--visible-height', `${viewport?.height || innerHeight}px`)
    document.documentElement.style.setProperty('--visible-top', `${viewport?.offsetTop || 0}px`)
    document.body.classList.toggle('compact-keyboard', (viewport?.height || innerHeight) < 560)
  }
  window.visualViewport?.addEventListener('resize', updateViewport)
  window.visualViewport?.addEventListener('scroll', updateViewport)
  window.addEventListener('resize', updateViewport); updateViewport()
})
