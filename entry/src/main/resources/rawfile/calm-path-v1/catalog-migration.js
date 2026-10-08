// Local food identity migration. Cooking states and cuts remain distinct.
const foodIdRedirects = Object.create(null)
const catalogNameAliases = { '鸡胸脯肉':'鸡胸肉生', '鸡胸肉':'鸡胸肉生', '鸡胸肉生':'鸡胸肉生', '马铃薯':'土豆生', '土豆':'土豆生', '土豆生':'土豆生', '瘦牛肉':'瘦牛肉生', '瘦猪肉':'瘦猪肉生', '结球甘蓝':'卷心菜', '甘蓝':'卷心菜', '大豆':'黄豆', '西红柿':'番茄', '番茄':'番茄', '花椰菜':'菜花' }
// These legacy items already represented fresh produce. Do not strip dry/cooked qualifiers.
for (const name of ['玉米','山药','毛豆','菠菜','莴笋','竹笋','茭白','香菇','金针菇','黄瓜','苦瓜','白萝卜','荸荠','海带','百合']) catalogNameAliases[`${name}鲜`] = name
Object.assign(catalogNameAliases, { '黑木耳干':'木耳干', '木耳':'木耳水发', '银耳':'银耳干', '红枣':'红枣干', '紫菜':'紫菜干', '裙带菜':'裙带菜干', '莲子':'莲子干', '豆芽':'黄豆芽', '土豆蒸':'土豆熟' })
function catalogFoodKey(name) {
  const key=String(name||'').normalize('NFKC').replace(/[\s()[\]【】·]/g,'').replace(/代表值/g,'')
  return Object.hasOwn(catalogNameAliases, key) ? catalogNameAliases[key] : key
}
function canonicalFoodId(id) {
  let current=id;const visited=new Set()
  while(!visited.has(current)) {
    visited.add(current)
    const next=foodIdRedirects[current]
    if(!next || next===current)break
    current=next
  }
  return current
}
function createFoodCatalog(defaults) {
  const result=defaults.map(food=>({...food}))
  if(typeof COMPOSITION_FOODS==='undefined')return result
  if(typeof COMPOSITION_FOOD_REDIRECTS!=='undefined')Object.assign(foodIdRedirects,COMPOSITION_FOOD_REDIRECTS)
  const byKey=new Map(result.map(food=>[catalogFoodKey(food.name),food]))
  for(const source of COMPOSITION_FOODS) {
    const match=byKey.get(catalogFoodKey(source.name))
    if(match) {
      foodIdRedirects[source.id]=match.id
      const id=match.id,name=match.name,icon=match.icon,symbol=match.symbol,useIcon=match.useIcon
      const keywords=`${match.keywords||''} ${source.keywords||''} ${source.name}`
      Object.assign(match,source,{id,name,keywords,icon,symbol,useIcon,compositionVersion:COMPOSITION_CATALOG_VERSION})
    } else {const food={...source,compositionVersion:COMPOSITION_CATALOG_VERSION};result.push(food);byKey.set(catalogFoodKey(food.name),food)}
  }
  if(typeof addBuiltInDishes==='function')addBuiltInDishes(result)
  return typeof addRequestedDishes==='function'?addRequestedDishes(result):result
}
function nutrientSnapshot(food) {
  return Object.fromEntries(['calories','carbs','protein','fat'].map(key=>[key,Number(food[key])||0]))
}
function validNutrientSnapshot(value) {
  if (!value || typeof value !== 'object' || !['calories','carbs','protein','fat'].every(key=>Number.isFinite(value[key]) && value[key]>=0 && value[key]<=(key==='calories'?5000:100))) return null
  return nutrientSnapshot(value)
}
function migrateFoodCatalog(saved = {}) {
  if(typeof COMPOSITION_FOODS==='undefined')return
  for (const id of Object.keys(foodIdRedirects)) delete foodIdRedirects[id]
  const oldById=new Map((saved.foods||legacyFoodDefaults).map(food=>[food.id,food]))
  const defaultsById=new Map(legacyFoodDefaults.map(food=>[food.id,food]))
  const originals=typeof COMPOSITION_ORIGINAL_FOODS==='undefined'?COMPOSITION_FOODS:COMPOSITION_ORIGINAL_FOODS
  const originalById=new Map(originals.map(food=>[food.id,food]))
  const originalByKey=new Map(originals.map(food=>[catalogFoodKey(food.name),food]))
  const sourceByKey=new Map(COMPOSITION_FOODS.map(food=>[catalogFoodKey(food.name),food]))
  const curatedById=new Map(COMPOSITION_FOODS.map(food=>[food.id,food]))
  for (const food of foods) {
    const source = sourceByKey.get(catalogFoodKey(food.name))
    if (!source || food.kind === 'dish') continue
    food.keywords = [...new Set(`${food.keywords || ''} ${source.keywords || ''} ${source.name}`.split(/\s+/))].join(' ')
  }
    for(const record of Object.values(state.dailyRecords)) for(const field of ['meals','hiddenMeals']) for(const meal of record[field]||[]) {
      if(meal.isPlanned)continue
      for(const item of meal.items||[])if(!validNutrientSnapshot(item.nutritionSnapshot) && oldById.has(item.foodId))item.nutritionSnapshot=nutrientSnapshot(oldById.get(item.foodId))
    }
    for(const food of foods) {
      if(food.kind==='dish'||food.custom)continue
      const old=oldById.get(food.id)
      const original=old?.compositionVersion===COMPOSITION_CATALOG_VERSION ? curatedById.get(food.id)||sourceByKey.get(catalogFoodKey(old.name))||defaultsById.get(food.id) : old?.compositionVersion ? originalById.get(food.id)||originalByKey.get(catalogFoodKey(old.name))||defaultsById.get(food.id) : defaultsById.get(food.id)||originalById.get(food.id)
      const userEdited=food.nutritionCustomized || old && original && ['calories','carbs','protein','fat'].some(key=>Number(old[key])!==Number(original[key]))
      if(userEdited){food.nutritionCustomized=true;continue}
      const redirected=typeof COMPOSITION_FOOD_REDIRECTS!=='undefined' && curatedById.get(COMPOSITION_FOOD_REDIRECTS[food.id])
      const source=redirected||sourceByKey.get(catalogFoodKey(food.name))
      if(source){Object.assign(food,nutrientSnapshot(source),{source:source.source,compositionVersion:COMPOSITION_CATALOG_VERSION});if(redirected)food.name=source.name;food.keywords=[...new Set(`${food.keywords||''} ${source.keywords||''} ${source.name}`.split(/\s+/))].join(' ')}
    }
  if(typeof COMPOSITION_RETIRED_IDS!=='undefined')for(const food of foods) {
    food.catalogArchived=COMPOSITION_RETIRED_IDS.has(food.id)&&!food.custom&&!food.nutritionCustomized&&food.kind!=='dish'
  }
  // Prefer an existing/user-edited ID over a newly introduced catalog ID.
  const priority=food=>(food.kind==='dish'?100:0)+(food.custom?20:0)+(food.nutritionCustomized?10:0)+(!food.id.startsWith('cfc6-')?5:0)
  const canonical=new Map(),kept=[]
  for(const food of [...foods].sort((a,b)=>priority(b)-priority(a))) {
    // User-created dishes are recipes, not raw ingredients with the same name.
    const key=`${food.kind==='dish'?'dish:':''}${catalogFoodKey(food.name)}`
    const match=canonical.get(key)
    if(!match){canonical.set(key,food);kept.push(food);continue}
    if(food.id!==match.id)foodIdRedirects[food.id]=match.id
    match.keywords=[...new Set(`${match.keywords||''} ${food.keywords||''} ${food.name}`.split(/\s+/))].join(' ')
    match.source ||= food.source
  }
  foods.splice(0,foods.length,...kept)
  const currentIds = new Set(foods.map(food=>food.id))
  for (const definition of [...legacyFoodDefaults,...originals,...COMPOSITION_FOODS,...(saved.foods||[]),...(saved.identityFoods||[])]) {
    if (currentIds.has(definition.id)) { delete foodIdRedirects[definition.id]; continue }
    const replacement=typeof COMPOSITION_FOOD_REDIRECTS!=='undefined'&&curatedById.get(COMPOSITION_FOOD_REDIRECTS[definition.id])
    const key = `${definition.kind==='dish'?'dish:':''}${catalogFoodKey(replacement?.name||definition.name)}`
    const match = canonical.get(key)
    if (match) foodIdRedirects[definition.id] = match.id
  }
  if(typeof COMPOSITION_FOOD_REDIRECTS!=='undefined')for(const [id,target] of Object.entries(COMPOSITION_FOOD_REDIRECTS)) {
    if(!currentIds.has(id) && id!==target)foodIdRedirects[id]=canonicalFoodId(target)
  }
  const remapItems=items=>{for(const item of items||[])item.foodId=canonicalFoodId(item.foodId)}
  for(const set of [...defaultMealSets,...state.savedMealSets])remapItems(set.items)
  for(const items of Object.values(state.scheduleMealOverrides))remapItems(items)
  for(const items of Object.values(state.recentByMeal))remapItems(items)
  for(const record of Object.values(state.dailyRecords))for(const field of ['meals','hiddenMeals','plannedMeals'])for(const meal of record[field]||[])remapItems(meal.items)
  for(const food of foods)if(food.recipe)remapItems(food.recipe.ingredients)
  remapItems(state.shoppingPurchases)
  for(const history of Object.values(state.amountHistoryByMeal))for(const id of Object.keys(history)){
    const mapped=canonicalFoodId(id);if(mapped!==id){history[mapped]=[...new Set([...(history[mapped]||[]),...history[id]])].slice(0,2);delete history[id]}
  }
  state.pinnedFoodIds=[...new Set(state.pinnedFoodIds.map(canonicalFoodId))]
  state.deletedFoodIds=[...new Set(state.deletedFoodIds.filter(id=>typeof COMPOSITION_FOOD_REDIRECTS==='undefined'||!COMPOSITION_FOOD_REDIRECTS[id]||COMPOSITION_FOOD_REDIRECTS[id]===id).map(canonicalFoodId))]
  state.selectedFood=canonicalFoodId(state.selectedFood)
}

function repairCatalogImport(beforeFoods, importedLibrary, importedRecords) {
  if (typeof COMPOSITION_FOODS === 'undefined') return
  const incoming = (Array.isArray(importedLibrary?.foods) ? importedLibrary.foods : []).map(validImportedFood).filter(Boolean)
  const references = new Set()
  const visit = items => (items || []).forEach(item => references.add(item.foodId))
  for (const set of [...defaultMealSets,...state.savedMealSets]) visit(set.items)
  for (const record of Object.values(state.dailyRecords)) for (const field of ['meals','hiddenMeals','plannedMeals']) for (const meal of record[field]||[]) visit(meal.items)
  Object.values(state.scheduleMealOverrides).forEach(visit)
  visit(state.shoppingPurchases)
  for (const food of foods) if (food.recipe) visit(food.recipe.ingredients)
  for (const id of references) {
    if (foods.some(food=>food.id===id)) continue
    const original = incoming.find(food=>food.id===id) || beforeFoods.find(food=>food.id===id) || legacyFoodDefaults.find(food=>food.id===id) || COMPOSITION_FOODS.find(food=>food.id===id) || (typeof COMPOSITION_ORIGINAL_FOODS!=='undefined' && COMPOSITION_ORIGINAL_FOODS.find(food=>food.id===id))
    if (!original) continue
    const alias = foods.find(food=>food.kind!=='dish' && catalogFoodKey(food.name)===catalogFoodKey(original.name))
    if (alias) foodIdRedirects[id]=alias.id
    else foods.push({...original})
  }
  const oldFoods = importedRecords && Array.isArray(importedLibrary?.foods) ? importedLibrary.foods : beforeFoods
  migrateFoodCatalog({ foods: oldFoods, identityFoods: incoming, compositionVersion: importedRecords && importedLibrary ? importedLibrary.compositionVersion : COMPOSITION_CATALOG_VERSION })
}

function foodSourceHtml(food) {
  if(food?.nutritionEstimate)return `<p class="sheet-hint food-source-note">${escapeHtml(food.nutritionEstimate)}</p>`
  const source=food?.source
  if(!source || !/^https:\/\/howtoeat\.cn\/food\/details\/\d+$/.test(source.url||''))return ''
  const samples=source.method==='mean'?` · 无原表代表值，按${source.ids.length}个同类样本计算平均值`:source.method==='representative'?' · 采用原表代表值':Array.isArray(source.ids) && source.ids.length>1?` · ${source.ids.length}个同名样本，当前采用编号${source.url.split('/').at(-1)}`:''
  return `<p class="sheet-hint food-source-note">来源：<a href="${source.url}" target="_blank" rel="noopener noreferrer">HowToEat · 食物成分表第6版</a>。每100g可食部${samples}。${food.nutritionCustomized?'当前使用你的修改值，可能与来源不同。':''}${Array.isArray(source.notes) && source.notes.includes('fat: 未检出')?'脂肪未检出，计算按0处理。':''}</p>`
}
