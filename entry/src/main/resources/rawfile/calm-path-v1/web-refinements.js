// Local Web refinements. Preferences never remove nutrition or meal records.
function mealItemMacroHtml(item) {
  const values = nutrientsForItems([item])
  return ['carbs', 'protein', 'fat'].map(key => `<b class="${key}">${{carbs:'碳',protein:'蛋',fat:'脂'}[key]} ${Math.round(values[key] * 10) / 10}g</b>`).join(' ')
}

function installDailyMealActions() {
  mealList.querySelectorAll('[data-edit-meal-title]').forEach(button => button.onclick = () => openDailyMealDetails(Number(button.dataset.editMealTitle)))
  let add = document.querySelector('#add-daily-meal')
  if (!add) {
    add = document.createElement('button'); add.id = 'add-daily-meal'; add.type = 'button'; add.className = 'add-daily-meal'
    add.textContent = '＋ 添加餐次'; mealList.after(add)
    add.onclick = () => openDailyMealDetails()
  }
  add.disabled = state.meals.length >= 8
}

function openDailyMealDetails(index = null) {
  const key = dateKey(selectedDate())
  const meal = index === null ? null : state.meals[index]
  if (index !== null && !meal) return
  if (!meal && state.meals.length >= 8) { showToast('当天最多添加 8 个餐次'); return }
  const dialog = openActionDialog(meal ? '编辑当日餐次' : '添加当日餐次')
  const baseName = (meal?.name || '').replace(/\s*·\s*练[前后]/g, '')
  dialog.content.innerHTML = `<label class="form-field"><span>餐次名称</span><input id="daily-meal-name" maxlength="20" placeholder="例如：下午加餐" value="${escapeHtml(baseName)}"></label><div class="form-grid two-column"><label class="form-field"><span>训练标记</span><select id="daily-meal-timing"><option value="">普通餐</option><option value="preworkout">练前餐</option><option value="postworkout">练后餐</option></select></label><label class="form-field"><span>时间</span><input id="daily-meal-time" type="time" value="${meal?.time || '15:00'}"></label></div><p class="sheet-hint">仅修改当前日期的餐次。</p><button id="save-daily-meal" type="button" class="primary-action">保存餐次</button>`
  dialog.content.querySelector('#daily-meal-timing').value = normalizeMealTiming(meal?.timingType, meal?.name || '')
  dialog.content.querySelector('#save-daily-meal').onclick = () => {
    const name = safeImportedText(dialog.content.querySelector('#daily-meal-name').value, '', 20)
    const timingType = dialog.content.querySelector('#daily-meal-timing').value
    const time = dialog.content.querySelector('#daily-meal-time').value
    if (!name || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) { showToast('请填写餐次名称和时间'); return }
    if (key !== dateKey(selectedDate())) return
    // Preserve any amount draft before redrawing the parent editor.
    if (meal && editorPageKey === `meal-${index}`) commitMealEditor(index)
    const record = state.dailyRecords[key]
    record.mealSlots ||= state.meals.map(({items, photo, isPlanned, ...slot}) => ({...slot}))
    const slot = { ...(meal || {}), id: meal?.id || `daily-${Date.now()}`, name: `${name}${timingType ? ` · ${mealTimingName(timingType)}` : ''}`, time, mealType: normalizeMealType(meal?.mealType, name), timingType }
    delete slot.items; delete slot.photo; delete slot.isPlanned
    if (meal) { record.mealSlots[index] = slot; Object.assign(meal, slot) }
    else { record.mealSlots.push(slot); state.meals.push({...slot, items: []}) }
    record.meals = state.meals
    persistState(); renderMeals(); updateSummary()
    dialog.close(false, () => {
      if (meal && editorPageKey === `meal-${index}`) openMealEditorSheet(index)
      else if (sheetContent.querySelector('.meal-log-layout')) renderFoodSheet()
      showToast(meal ? '已更新当日餐次' : '已添加当日餐次')
    })
  }
}

function renderMonthlyTrendChart(kind, data) {
  renderInteractiveTrendChart(kind, data)
}

const trendCardCatalog = [
  ['average', '均值', '.average-card'], ['calorie', '热量', '[aria-labelledby="calorie-chart-title"]'],
  ['macro', '营养素', '[aria-labelledby="macro-chart-title"]'], ['consumption','饮食花费','.consumption-card'], ['weight', '体重', '.weight-card']
]
const trendPreferencesKey = 'shiyouji-trend-cards-v1'
function readTrendPreferences() {
  let value = {}; try { value = JSON.parse(localStorage.getItem(trendPreferencesKey) || '{}') || {} } catch {}
  const ids = trendCardCatalog.map(([id]) => id)
  return {order:[...new Set([...(Array.isArray(value.order) ? value.order.filter(id => ids.includes(id)) : []), ...ids])], hidden:Array.isArray(value.hidden) ? value.hidden.filter(id => ids.includes(id)) : []}
}
function applyTrendCardPreferences() {
  const root = document.querySelector('#trend-statistics'), preferences = readTrendPreferences()
  // Period controls live outside reorderable/hideable cards.
  const tools = document.querySelector('.trend-period-tools')
  if (tools && !tools.classList.contains('standalone-trend-period')) {
    tools.classList.add('standalone-trend-period'); root.before(tools)
  }
  if (tools) tools.hidden = state.trendView === 'calendar'
  preferences.order.forEach(id => {
    const card = root.querySelector(trendCardCatalog.find(([key]) => key === id)[2])
    if (card) { root.append(card); card.hidden = preferences.hidden.includes(id) || id==='consumption'&&!shoppingLedgerEnabled() }
  })
}
function openTrendCardSettings() {
  beginEditorPage('trend-cards')
  sheetTitle.textContent = '趋势卡片排序'; sheetKicker.textContent = 'TREND LAYOUT'
  const draft = readTrendPreferences()
  sheetContent.innerHTML = '<p class="sheet-hint">调整统计卡片顺序，关闭显示可隐藏卡片。记录不会删除。</p><div id="trend-card-options"></div><button id="restore-trend-cards" class="secondary-action" type="button">恢复默认</button><button id="save-trend-cards" class="primary-action" type="button">保存卡片设置</button>'
  const render = () => {
    const list = sheetContent.querySelector('#trend-card-options')
    list.innerHTML = draft.order.filter(id=>id!=='consumption'||shoppingLedgerEnabled()).map((id,i,shown) => `<div class="trend-card-option"><label><input type="checkbox" data-show-trend="${id}" ${draft.hidden.includes(id) ? '' : 'checked'}>${trendCardCatalog.find(([key]) => key === id)[1]}</label><button type="button" data-move-trend="${id}" data-direction="-1" aria-label="上移${id}" ${i===0?'disabled':''}>↑</button><button type="button" data-move-trend="${id}" data-direction="1" aria-label="下移${id}" ${i===shown.length-1?'disabled':''}>↓</button></div>`).join('')
    list.querySelectorAll('[data-show-trend]').forEach(input => input.onchange = () => {
      draft.hidden = input.checked ? draft.hidden.filter(id => id !== input.dataset.showTrend) : [...draft.hidden,input.dataset.showTrend]
    })
    list.querySelectorAll('[data-move-trend]').forEach(button => button.onclick = () => {
      const visible=draft.order.filter(id=>id!=='consumption'||shoppingLedgerEnabled()),i=visible.indexOf(button.dataset.moveTrend),other=visible[i+Number(button.dataset.direction)]
      if(!other)return
      const a=draft.order.indexOf(button.dataset.moveTrend),b=draft.order.indexOf(other)
      ;[draft.order[a],draft.order[b]]=[draft.order[b],draft.order[a]]; render()
    })
  }
  sheetContent.editDraftReader = {saveId:'save-trend-cards',read:() => draft}
  sheetContent.querySelector('#restore-trend-cards').onclick = () => { draft.order = trendCardCatalog.map(([id]) => id); draft.hidden = []; render() }
  sheetContent.querySelector('#save-trend-cards').onclick = () => {
    if (draft.order.filter(id=>id!=='consumption'||shoppingLedgerEnabled()).every(id=>draft.hidden.includes(id))) { showToast('至少显示一张趋势卡片'); return }
    localStorage.setItem(trendPreferencesKey, JSON.stringify(draft)); applyTrendCardPreferences(); closeSheet(); showToast('已保存趋势卡片设置')
  }
  render(); openSheet()
}

document.addEventListener('DOMContentLoaded', () => {
  const section = document.querySelector('.optional-settings-content')
  if (section) {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'setting-row'; button.id = 'trend-card-settings'
    button.innerHTML = '<span><strong>趋势卡片排序</strong></span><span class="row-value">调整 <b>›</b></span>'
    button.onclick = openTrendCardSettings
    section.insertBefore(button, section.querySelector('.weight-unit-setting'))
  }
})

function bindIngredientCopyGestures(container, copy) {
  container.querySelectorAll('.dish-ingredient-swipe').forEach(wrapper => {
    const row = wrapper.querySelector('.dish-ingredient-row'), button = wrapper.querySelector('[data-copy-dish-ingredient]')
    let start = null, moved = false
    const setOpen = open => { row.classList.remove('copy-dragging'); wrapper.classList.toggle('copy-open', open); row.style.transform = '' }
    button.onclick = () => copy(Number(button.dataset.copyDishIngredient))
    // Keyboard focus also reveals the action, independent of swipe ability.
    button.onfocus = () => setOpen(true)
    row.addEventListener('pointerdown', event => {
      if (event.target.closest('input,button,label') || event.button > 0) return
      start = {x:event.clientX,y:event.clientY,open:wrapper.classList.contains('copy-open')}; moved = false
    })
    row.addEventListener('pointermove', event => {
      if (!start) return
      const dx = event.clientX-start.x, dy=event.clientY-start.y
      if (!moved && Math.abs(dy)>Math.abs(dx) && Math.abs(dy)>8) { start=null; return }
      if (Math.abs(dx)>10 && Math.abs(dx)>Math.abs(dy)) { moved=true; row.setPointerCapture(event.pointerId) }
      if (moved) { event.preventDefault(); row.classList.add('copy-dragging'); row.style.transform=`translateX(${Math.max(-76,Math.min(0,dx-(start.open?76:0)))}px)` }
    })
    row.addEventListener('pointerup', event => {
      if (!start) return
      setOpen(moved ? event.clientX-start.x < -28 || (start.open && event.clientX-start.x < 28) : start.open)
      start=null
    })
    row.addEventListener('pointercancel', () => { setOpen(false); start=null })
  })
}
