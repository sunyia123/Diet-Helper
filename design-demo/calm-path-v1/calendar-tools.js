// Month selection reuses the app's accessible, keyboard-enabled wheel controls.
function openCalendarMonthPicker() {
  const anchor = trendAnchorDate()
  const current = new Date(anchor.getFullYear(), anchor.getMonth() + state.calendarMonthOffset, 1)
  let year = current.getFullYear(), month = current.getMonth() + 1
  const recordYears = Object.keys(state.dailyRecords).map(key => Number(key.slice(0, 4))).filter(Number.isFinite)
  const start = Math.min(2000, year, ...recordYears), end = Math.max(anchor.getFullYear() + 10, year, ...recordYears)
  const dialog = openActionDialog('选择年月', { className: 'calendar-month-overlay' })
  dialog.content.innerHTML = `<div class="calendar-month-wheels">${wheelColumnHtml('年份', Array.from({length: end - start + 1}, (_, i) => start + i), year, 'calendar-year')}${wheelColumnHtml('月份', Array.from({length: 12}, (_, i) => i + 1), month, 'calendar-month')}</div><button type="button" class="primary-action" data-calendar-month-confirm>确定</button>`
  initializeWheelPickers(dialog.content, (name, value) => { if (name === 'calendar-year') year = value; else month = value })
  dialog.content.querySelector('[data-calendar-month-confirm]').onclick = () => {
    state.calendarMonthOffset = (year - anchor.getFullYear()) * 12 + month - 1 - anchor.getMonth()
    renderNutritionCalendar()
    dialog.close()
  }
}
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#calendar-month-open').onclick = openCalendarMonthPicker
})
