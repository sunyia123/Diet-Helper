// Nutrition programs are dated; training/rest only selects meal structure.
function programBaseId(methodId = state.methodId) {
  const method = methodById(methodId)
  return method.baseId || method.id
}

function isDatedProgram(methodId = state.methodId) {
  return ['fixed', 'dynamic'].includes(programBaseId(methodId))
}

function dateAfterDays(value, days) {
  const date = parseLocalDate(value)
  date.setDate(date.getDate() + days)
  return dateKey(date)
}

function programPhase(methodId = state.methodId, date = selectedDate()) {
  const base = programBaseId(methodId)
  const range = state.methodApplications[methodId] || state.methodApplications[base]
  const key = dateKey(date)
  if (range?.start && key < range.start) return { kind: 'pending', label: '尚未开始', day: 0 }
  const day = range?.start ? Math.round((parseLocalDate(key) - parseLocalDate(range.start)) / 86400000) + 1 : 1
  if (range?.end && key > range.end) return { kind: 'complete', label: '计划已完成', day }
  if (base === 'fixed') return { kind: [12,24,36].includes(day) ? 'high' : 'normal', day, label: `第${Math.min(day,40)}天 · ${[12,24,36].includes(day) ? '高碳日' : '一般阶段'}` }
  return { kind: 'dynamic', day, label: `第${day}天 · 三月动态调整` }
}

function reviewConfig(methodId = state.methodId) {
  const saved = state.reviewSettings?.[methodId] || {}
  const base = programBaseId(methodId)
  return {
    enabled: saved.enabled ?? base === 'dynamic',
    interval: Math.max(1, Math.min(90, Math.round(Number(saved.interval) || 7))),
    reduction: Math.max(1, Math.min(100, Number.isFinite(Number(saved.reduction)) ? Number(saved.reduction) : 40)),
    targetPercent: Math.max(0.1, Math.min(1, Number.isFinite(Number(saved.targetPercent)) ? Number(saved.targetPercent) : 0.6)),
    start: state.methodApplications[methodId]?.start || saved.start || APP_TODAY_KEY
  }
}

function reviewEvents(methodId, date) {
  const start = reviewConfig(methodId).start
  return (state.dietReviews || []).filter(event => event.methodId === methodId && event.date >= start && event.date <= date)
}

function reviewStatus(methodId = state.methodId, date = APP_TODAY_KEY) {
  const config = reviewConfig(methodId)
  const events = reviewEvents(methodId, date).sort((a,b) => a.date.localeCompare(b.date))
  const last = events.at(-1)?.date || config.start
  const nextDate = dateAfterDays(last, config.interval)
  const end = state.methodApplications[methodId]?.end
  return { ...config, nextDate, due: Boolean(config.enabled && date >= nextDate && (!end || date <= end)) }
}

function applyReviewAdjustment(target, methodId, date) {
  const delta = reviewEvents(methodId, dateKey(date)).reduce((total, event) => total + (Number(event.carbDelta) || 0), 0)
  if (!delta) return target
  const carbs = Math.max(0, Math.round((target.carbs + delta) * 10) / 10)
  return { ...target, carbs, calories: Math.max(0, Math.round(target.calories + (carbs - target.carbs) * 4)) }
}

function confirmDietReview(methodId, date, outcome, carbDelta, measuredWeight = state.bodyProfile.weight) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || dateKey(parseLocalDate(date)) !== date || !['reached','maintain','increase'].includes(outcome)) throw new Error('无效复盘')
  if (!Number.isFinite(carbDelta) || Math.abs(carbDelta) > 100) throw new Error('调整量应在 100g 以内')
  if ((state.dietReviews || []).some(event => event.methodId === methodId && event.date === date)) return false
  state.dietReviews ||= []
  state.dietReviews.push({ methodId, date, outcome, carbDelta: Math.round(carbDelta * 10) / 10, weight: measuredWeight })
  return true
}

function datedProgramTarget(methodId, date) {
  const base = programBaseId(methodId)
  const rangeId = state.methodApplications[methodId] ? methodId : base
  const values = editableProgramMultipliers(methodId, date) || (base === 'fixed' ? tanFixedMultipliers(date, rangeId) : tanDynamicMultipliers())
  const weight = state.bodyProfile.weight
  return applyReviewAdjustment(macroTarget(weight * values.carbs, weight * values.protein, weight * values.fat), methodId, date)
}

function restoreProgramState(saved = {}) {
  state.programCoefficients = normalizeProgramCoefficients(saved.programCoefficients)
  state.reviewSettings = {}
  for (const method of allMethods()) {
    const value = saved.reviewSettings?.[method.id]
    if (value && typeof value === 'object') state.reviewSettings[method.id] = { enabled: value.enabled === true, interval: Math.max(1, Math.min(90, Math.round(Number(value.interval) || 7))), reduction: Math.max(1, Math.min(100, Number(value.reduction) || 40)), targetPercent: Math.max(0.1, Math.min(1, Number(value.targetPercent) || 0.6)), start: /^\d{4}-\d{2}-\d{2}$/.test(value.start || '') ? value.start : APP_TODAY_KEY }
  }
  state.dietReviews = (Array.isArray(saved.dietReviews) ? saved.dietReviews : []).filter(event => event && allMethods().some(m=>m.id===event.methodId) && /^\d{4}-\d{2}-\d{2}$/.test(event.date || '') && Number.isFinite(event.carbDelta) && Math.abs(event.carbDelta)<=200).slice(-2000)
  // Keep old snapshots for recovery; do not use binary-day snapshots as a stage table.
  state.legacyProgramOverrides = saved.legacyProgramOverrides || {}
  for (const id of ['fixed','dynamic']) if (state.methodOverrides[id]) {
    state.legacyProgramOverrides[id] ||= state.methodOverrides[id]
    delete state.methodOverrides[id]
  }
}

function renderReviewBanner() {
  const button = document.querySelector('#diet-review-banner')
  if (!button) return
  const reviewDate = dateKey(selectedDate())
  const status = reviewStatus(state.methodId, reviewDate)
  button.hidden = !status.due
  button.innerHTML = '<span>复盘调整</span>'
  button.onclick = () => openDietReview(false, reviewDate)
}

function openReviewSettings() {
  beginEditorPage('review-settings')
  const config = reviewConfig()
  sheetTitle.textContent = '复盘提醒'
  sheetKicker.textContent = 'DIET REVIEW'
  sheetContent.innerHTML = `<p class="sheet-hint">为「${escapeHtml(methodById(state.methodId).name)}」设置。依据两次称重计算每周体重变化，确认后才调整碳水。</p><label class="review-enable"><input id="review-enabled" type="checkbox" ${config.enabled?'checked':''}>开启复盘提醒</label><div class="form-grid two-column"><label class="form-field"><span>复盘间隔</span><input id="review-interval" type="number" min="1" max="90" step="1" value="${config.interval}" data-unit="天"><em>天</em></label><label class="form-field"><span>每周下降目标</span><input id="review-target-percent" type="number" min="0.1" max="1" step="0.1" value="${config.targetPercent}" data-unit="%"><em>%</em></label><label class="form-field"><span>平台期减碳幅度</span><input id="review-reduction" type="number" min="1" max="100" step="1" value="${config.reduction}" data-unit="g"><em>g</em></label></div><p class="sheet-hint">每周下降目标可设 0.1%–1%，参考区间 0.4%–0.8%，默认 0.6%。体重基本不变时可按设定幅度减碳 1–100g；达标保持，下降过快可适当加碳。</p><p class="sheet-hint">${reviewStatus().enabled ? `下次提醒：${reviewStatus().nextDate}` : '开启后按设定间隔提醒'}。调整仅从确认日期起生效，不改变此前目标。</p><button class="secondary-action" id="preview-review" type="button">预览复盘操作</button><button class="primary-action" id="save-review-settings" type="button">保存提醒设置</button>`
  document.querySelector('#save-review-settings').onclick = () => {
    state.reviewSettings[state.methodId] = { enabled: document.querySelector('#review-enabled').checked, interval: Math.max(1, Math.min(90, Math.round(Number(document.querySelector('#review-interval').value) || 7))), reduction: Math.max(1, Math.min(100, Number(document.querySelector('#review-reduction').value) || 40)), targetPercent: Math.max(0.1, Math.min(1, Number(document.querySelector('#review-target-percent').value) || 0.6)), start: config.start }
    persistState(); updateSettingsSummaries(); renderReviewBanner(); closeSheet(); showToast('已保存提醒设置')
  }
  const preview = document.createElement('section')
  preview.className = 'review-settings-preview'; preview.id = 'review-settings-preview'
  document.querySelector('#preview-review').before(preview)
  const reduction = () => Math.max(1, Math.min(100, Number(document.querySelector('#review-reduction').value) || 40))
  const previewDate = () => {
    const last = reviewEvents(state.methodId, APP_TODAY_KEY).sort((a,b) => a.date.localeCompare(b.date)).at(-1)?.date || config.start
    const next = dateAfterDays(last, Math.max(1, Math.min(90, Math.round(Number(document.querySelector('#review-interval').value) || 7))))
    return next < APP_TODAY_KEY ? APP_TODAY_KEY : next
  }
  const paint = () => {
    preview.innerHTML = `<strong>仅平台期确认减碳时</strong>${dietReviewTargetPreview(state.methodId,previewDate(),-reduction())}<small>达标或仍在下降时保持目标；保存提醒不会执行调整。</small>`
  }
  for (const id of ['review-reduction','review-interval']) {
    document.getElementById(id).addEventListener('input',paint)
    document.getElementById(id).addEventListener('change',paint)
  }
  document.querySelector('#preview-review').onclick = () => openDietReview(true,previewDate(),reduction(),Math.max(0.1,Math.min(1,Number(document.querySelector('#review-target-percent').value)||0.6)))
  paint()
  openSheet()
}

function dietReviewTargetPreview(methodId, reviewDate, delta) {
  const rows = methodDayOptions(methodId).map(option => {
    const current = methodTargetValues(option.id,methodId,null,parseLocalDate(reviewDate))
    const next = Math.max(0,Math.round((current.carbs+delta)*10)/10)
    return `<span class="review-target-row"><strong>${option.name}</strong><span>${current.carbs}g → ${next}g</span></span>`
  }).join('')
  return `${rows}<span class="review-scope-note">${delta ? `${reviewDate} 起${isKingMethod(methodId)?'高、中、低碳日':'训练日与休息日'}调整碳水；蛋白质、脂肪及此前日期不变。` : '本次保持当前营养目标，不调整碳水。'}</span>`
}

function reviewWeightEvidence(methodId, reviewDate, interval) {
  const lastReview = reviewEvents(methodId, reviewDate).sort((a,b) => a.date.localeCompare(b.date)).at(-1)
  const baselineDate = lastReview?.date || dateAfterDays(reviewDate, -interval)
  const records = state.weightRecords.filter(record => record.date <= reviewDate)
  const baseline = [...records].reverse().find(record => record.date <= baselineDate && Math.abs((parseLocalDate(record.date) - parseLocalDate(baselineDate)) / 86400000) <= 3)
  const current = [...records].reverse().find(record => record.date > baselineDate && Math.abs((parseLocalDate(reviewDate) - parseLocalDate(record.date)) / 86400000) <= 3)
  return { baseline: baseline?.weight || lastReview?.weight || null, current: current?.weight || null,
    days: Math.max(1, Math.round((parseLocalDate(current?.date || reviewDate) - parseLocalDate(baseline?.date || baselineDate)) / 86400000)),
    baselineDate: baseline?.date || baselineDate, currentDate: current?.date || reviewDate }
}

function reviewRecommendation(baseline, current, days, targetPercent) {
  if (!Number.isFinite(baseline) || !Number.isFinite(current) || baseline < 20 || current < 20 || days < 1) return null
  const percent = (baseline - current) / baseline * 100 * 7 / days
  const upper = Math.min(1, targetPercent + 0.2)
  if (percent > upper) return { outcome: 'increase', percent, reason: percent > 1 ? '超过每周 1%，建议先核对称重并适当加碳' : '快于本次目标，建议适当加碳' }
  if (percent <= 0.1) return { outcome: 'maintain', percent, reason: '体重基本未下降，可考虑减少碳水' }
  return { outcome: 'reached', percent, reason: percent < Math.max(0.1, targetPercent - 0.2) ? '仍在下降，先保持并继续观察' : '达到目标范围，保持当前碳水' }
}

function openDietReview(preview = false, reviewDate = dateKey(selectedDate()), reduction = reviewConfig().reduction, targetPercent = reviewConfig().targetPercent) {
  const methodId = state.methodId
  const config = { ...reviewConfig(methodId), reduction, targetPercent }
  const evidence = reviewWeightEvidence(methodId, reviewDate, config.interval)
  const dialog = openActionDialog(preview ? '复盘提醒预览' : '复盘调整')
  dialog.content.closest('.action-dialog').classList.add('diet-review-dialog')
  dialog.content.innerHTML = `<p class="sheet-hint">目标每周下降 ${config.targetPercent}%；根据两次体重与实际间隔折算每周变化。需人工确认后才改变目标。</p><div class="review-weight-pair"><label class="form-field"><span>前次体重 · ${evidence.baselineDate}</span><input id="review-start-weight" type="number" min="${bodyWeightInputBounds(20,500).min}" max="${bodyWeightInputBounds(20,500).max}" step="${state.weightUnit === 'jin' ? '0.1' : '0.01'}" value="${evidence.baseline == null ? '' : bodyWeightDisplayValue(evidence.baseline)}" inputmode="decimal"><em>${bodyWeightUnitLabel()}</em></label><label class="form-field"><span>本次体重 · ${evidence.currentDate}</span><input id="review-end-weight" type="number" min="${bodyWeightInputBounds(20,500).min}" max="${bodyWeightInputBounds(20,500).max}" step="${state.weightUnit === 'jin' ? '0.1' : '0.01'}" value="${evidence.current == null ? '' : bodyWeightDisplayValue(evidence.current)}" inputmode="decimal"><em>${bodyWeightUnitLabel()}</em></label></div><button class="secondary-action" id="review-weight" type="button" ${preview?'disabled':''}>记录今日体重</button><div class="review-analysis" id="review-analysis" aria-live="polite"></div><div class="review-outcomes" role="group" aria-label="调整选择"><button type="button" data-review-outcome="reached">保持目标</button><button type="button" data-review-outcome="maintain">减少碳水</button><button type="button" data-review-outcome="increase">适当加碳</button></div><div class="review-adjustment"><strong id="review-adjustment-label">碳水调整</strong><input id="review-delta" type="number" min="1" max="100" step="1" value="${config.reduction}" inputmode="numeric" aria-label="碳水调整量"><span>g</span></div><p id="review-target-preview" class="sheet-hint" aria-live="polite"></p><button class="primary-action" id="confirm-diet-review" type="button">${preview?'关闭预览，不改变目标':`确认 ${reviewDate} 的复盘结果`}</button>`
  let outcome = 'reached', manualChoice = false
  const amount = dialog.content.querySelector('#review-delta')
  const firstWeight = dialog.content.querySelector('#review-start-weight')
  const lastWeight = dialog.content.querySelector('#review-end-weight')
  const recommendation = () => reviewRecommendation(bodyWeightFromDisplay(firstWeight.value), bodyWeightFromDisplay(lastWeight.value), evidence.days, config.targetPercent)
  const delta = () => outcome === 'reached' ? 0 : Number(amount.value) * (outcome === 'maintain' ? -1 : 1)
  const paint = () => {
    const result = recommendation()
    if (!manualChoice && result) outcome = result.outcome
    dialog.content.querySelector('#review-analysis').innerHTML = result
      ? `<strong>每周变化：${result.percent >= 0 ? '下降' : '上升'} ${Math.abs(result.percent).toFixed(2)}%</strong><br>${result.reason}。${evidence.days} 天由 ${firstWeight.value}${bodyWeightUnitLabel()} → ${lastWeight.value}${bodyWeightUnitLabel()}。`
      : '缺少前后两次有效体重；请先记录或填写，才能计算并确认。'
    dialog.content.querySelectorAll('[data-review-outcome]').forEach(button => button.classList.toggle('active', button.dataset.reviewOutcome === outcome))
    dialog.content.querySelector('#review-target-preview').innerHTML = dietReviewTargetPreview(methodId,reviewDate,delta())
    dialog.content.querySelector('#review-adjustment-label').textContent = outcome === 'reached' ? '保持碳水' : outcome === 'increase' ? '增加碳水' : '减少碳水'
    amount.disabled = outcome === 'reached'
    dialog.content.querySelector('#confirm-diet-review').disabled = !preview && (!result || reviewDate > APP_TODAY_KEY)
  }
  amount.oninput = paint
  ;[firstWeight,lastWeight].forEach(input => input.oninput = () => { manualChoice = false; paint() })
  dialog.content.querySelectorAll('[data-review-outcome]').forEach(button => button.onclick = () => { outcome = button.dataset.reviewOutcome; manualChoice = true; paint() })
  dialog.content.querySelector('#review-weight').onclick=()=>dialog.close(false,openWeightRecordSheet)
  dialog.content.querySelector('#confirm-diet-review').onclick=()=>{
    if(preview){dialog.close();return}
    if(state.methodId!==methodId) return
    if (!recommendation()) { showToast('请先填写两次有效体重'); return }
    if (outcome !== 'reached' && (!Number.isInteger(Number(amount.value)) || Number(amount.value) < 1 || Number(amount.value) > 100)) { showToast('碳水调整量应为 1–100g'); return }
    if(confirmDietReview(methodId,reviewDate,outcome,delta(),bodyWeightFromDisplay(lastWeight.value))) {persistState();updateSummary();updateSettingsSummaries();renderReviewBanner();renderPrep();showToast(outcome === 'reached' ? '复盘已记录，营养目标保持不变' : `已更新${isKingMethod(methodId)?'高、中、低碳日':'训练与休息日'}目标 · ${reviewDate} 起生效`)}
    else showToast('该日期已复盘，未重复调整')
    dialog.close()
  }
  paint()
}

function openProgramOverview(methodId = state.methodId) {
  beginEditorPage('program-overview')
  const fixed=programBaseId(methodId)==='fixed'
  const range=state.methodApplications[methodId]
  const phase=programPhase(methodId)
  sheetTitle.textContent=methodById(methodId).name
  sheetKicker.textContent='NUTRITION PROGRAM'
sheetContent.innerHTML=`<div class="program-heading"><strong>${phase.label}</strong><span>${range?`${range.start} — ${range.end}`:'选择开始日期后执行'}</span></div><p class="sheet-hint">${fixed?'营养阶段严格跟随日期，高碳日固定在第12、24、36天，不能临时切换。训练/休息仅用于标注与选择餐次、套餐，不改变营养阶段。':'按性别、全局活动系数和当前体重计算起点；训练/休息共用同一营养目标。每次复盘由你确认保持、减碳或加碳。'}</p>${fixed?fixedStageTableHtml(methodId):dynamicCoefficientHtml(methodId)}<p class="sheet-hint">每日克数 = 当前体重 × 系数；热量 = 碳水 × 4 + 蛋白质 × 4 + 脂肪 × 9。已确认的碳水调整另行叠加。计划到期显示完成，不会重复从第一天开始，暂保留最后目标供参考。</p><button class="secondary-action" id="program-dates" type="button">设置开始日期</button><button class="secondary-action" id="program-reminders" type="button">复盘提醒设置</button>`
  document.querySelector('#program-dates').onclick=()=>openMethodRangeSheet(methodId)
  document.querySelector('#program-reminders').onclick=()=>{if(state.methodId===methodId)openReviewSettings();else showToast('请先应用此方法，再设置提醒')}
  const overview=document.createElement('div');overview.className='program-overview'
  const heading=sheetContent.querySelector('.program-heading')
  const targets=datedProgramTarget(methodId,selectedDate())
  const status=reviewStatus(methodId,dateKey(selectedDate()))
  const summary=document.createElement('section');summary.className='program-today'
  summary.innerHTML=`<span>${dateKey(selectedDate())} · 营养目标</span><strong class="numeric">${rounded(targets.calories)} <small>kcal</small></strong>${nutritionGridHtml(targets,'program-macros')}<p>${status.enabled?`下次复盘 ${status.nextDate}`:'复盘提醒未开启'}</p>`
  const actions=document.createElement('div');actions.className='program-actions'
  actions.append(...['program-dates','program-reminders'].map(id=>document.getElementById(id)))
  actions.firstElementChild.className='primary-action'
  const edit=document.createElement('button');edit.type='button';edit.className='secondary-action';edit.id='edit-program-coefficients';edit.textContent='编辑营养倍数'
  edit.onclick=()=>openProgramCoefficientEditor(methodId);actions.prepend(edit)
  const details=document.createElement('details');details.className='program-calculation'
  details.innerHTML='<summary>计算依据与阶段安排</summary>'
  for(const node of [...sheetContent.childNodes])if(node!==heading)details.append(node)
  overview.append(heading,summary,actions,details);sheetContent.replaceChildren(overview)
  openSheet()
}

function fixedStageTableHtml(methodId = state.methodId) {
  const rows=[[1,11,3,1.4,.4,.5],[12,12,5,1,.4,.5],[13,23,2.5,1.6,.4,.6],[24,24,6,1.2,.5,.6],[25,35,2,1.8,.5,.6],[36,36,6,1.2,.5,.6],[37,40,2,1.8,.5,.6]]
  const revision=programCoefficientRevision(methodId,selectedDate())
  if(revision) return `<div class="program-table-wrap"><table class="program-table"><thead><tr><th>天数</th><th>碳水×</th><th>蛋白×</th><th>脂肪×</th></tr></thead><tbody>${revision.rows.map((row,i)=>`<tr><th>${rows[i][0]}–${rows[i][1]}</th><td>${row.carbs}</td><td>${row.protein}</td><td>${row.fat}</td></tr>`).join('')}</tbody></table></div><p class="sheet-hint">当前${revision.gender==='female'?'女性':'男性'}自定倍数 · ${revision.date} 起生效</p>`
  return `<div class="program-table-wrap"><table class="program-table"><thead><tr><th>天数</th><th>碳水×</th><th>蛋白×</th><th>男脂×</th><th>女脂×</th></tr></thead><tbody>${rows.map(([a,b,c,p,m,f])=>`<tr class="${a===b?'high-phase':''}"><th>${a===b?`${a} 高碳`:`${a}–${b}`}</th><td>${c}</td><td>${p}</td><td>${m}</td><td>${f}</td></tr>`).join('')}</tbody></table></div>`
}

function dynamicCoefficientHtml(methodId = state.methodId) {
  const revision=programCoefficientRevision(methodId,selectedDate())
  if(revision) return `<div class="program-table-wrap"><table class="program-table"><thead><tr><th>活动系数</th><th>碳水×</th><th>蛋白×</th><th>脂肪×</th></tr></thead><tbody>${revision.rows.map((row,i)=>`<tr><th>${activityFactorOptions[i].label} ×${activityFactorOptions[i].factor}</th><td>${row.carbs}</td><td>${row.protein}</td><td>${row.fat}</td></tr>`).join('')}</tbody></table></div><p class="sheet-hint">当前${revision.gender==='female'?'女性':'男性'}自定倍数 · ${revision.date} 起生效</p>`
  return `<div class="program-table-wrap"><table class="program-table"><thead><tr><th>活动系数</th><th>男 碳/蛋/脂</th><th>女 碳/蛋/脂</th></tr></thead><tbody>${activityFactorOptions.map((option,index)=>`<tr><th>${option.label} ×${option.factor}<small>总运动时长 ${option.hours}</small></th><td>${['2.2 / 1.4 / 0.8','2.5 / 1.6 / 0.9','3 / 1.7 / 1','3.5 / 1.8 / 1'][index]}</td><td>${['2 / 1.4 / 1','2.2 / 1.6 / 1.05','2.5 / 1.7 / 1.1','3 / 1.8 / 1.15'][index]}</td></tr>`).join('')}</tbody></table></div><p class="sheet-hint">女性脂肪系数按范围中值计算：1.05 和 1.15。活动系数可在身体参数中调整。</p>`
}

function programCoefficientRows(methodId, gender = state.bodyProfile.gender) {
  const female = gender === 'female'
  const values = programBaseId(methodId) === 'fixed'
    ? [[3,1.4,female?.5:.4],[5,1,female?.5:.4],[2.5,1.6,female?.6:.4],[6,1.2,female?.6:.5],[2,1.8,female?.6:.5],[6,1.2,female?.6:.5],[2,1.8,female?.6:.5]]
    : female ? [[2,1.4,1],[2.2,1.6,1.05],[2.5,1.7,1.1],[3,1.8,1.15]] : [[2.2,1.4,.8],[2.5,1.6,.9],[3,1.7,1],[3.5,1.8,1]]
  return values.map(([carbs,protein,fat]) => ({carbs,protein,fat}))
}

function normalizeProgramCoefficients(source) {
  const normalized = {}
  if (!source || typeof source !== 'object') return normalized
  for (const method of allMethods().filter(method => isDatedProgram(method.id))) {
    const count = programBaseId(method.id) === 'fixed' ? 7 : 4
    normalized[method.id] = (Array.isArray(source[method.id]) ? source[method.id] : []).filter(event =>
      event && /^\d{4}-\d{2}-\d{2}$/.test(event.date || '') && dateKey(parseLocalDate(event.date)) === event.date && ['male','female'].includes(event.gender) && Array.isArray(event.rows) && event.rows.length === count &&
      event.rows.every(row => row && ['carbs','protein','fat'].every(key => Number.isFinite(row[key]) && row[key] >= 0 && row[key] <= 10))
    ).map(event => ({date:event.date,gender:event.gender,rows:event.rows.map(row => ({carbs:row.carbs,protein:row.protein,fat:row.fat}))}))
  }
  return normalized
}

function programCoefficientRevision(methodId, date, gender = state.bodyProfile.gender) {
  return (state.programCoefficients?.[methodId] || []).filter(event => event.gender === gender && event.date <= dateKey(date)).sort((a,b) => a.date.localeCompare(b.date)).at(-1)
}

function editableProgramMultipliers(methodId, date) {
  const revision = programCoefficientRevision(methodId, date)
  if (!revision) return null
  const rangeId = state.methodApplications[methodId] ? methodId : programBaseId(methodId)
  const day = Math.min(40,programDay(rangeId,new Date(date)))
  const index = programBaseId(methodId) === 'fixed' ? [11,12,23,24,35,36,40].findIndex(end => day <= end) : activityIndexForProfile()
  return revision.rows[index]
}

function openProgramCoefficientEditor(methodId) {
  beginEditorPage(`program-coefficients-${methodId}`)
  const fixed = programBaseId(methodId) === 'fixed', gender = state.bodyProfile.gender
  const rows = structuredClone(programCoefficientRevision(methodId,parseLocalDate(APP_TODAY_KEY),gender)?.rows || programCoefficientRows(methodId,gender))
  const labels = fixed ? ['1–11天','12天 · 高碳','13–23天','24天 · 高碳','25–35天','36天 · 高碳','37–40天'] : activityFactorOptions.map(option => `${option.label} ×${option.factor}`)
  sheetTitle.textContent = '编辑营养倍数'; sheetKicker.textContent = 'PROGRAM COEFFICIENTS'
  sheetContent.innerHTML = `<p class="sheet-hint">${escapeHtml(methodById(methodId).name)} · ${gender==='female'?'女性':'男性'}系数（g/kg）。训练与休息共用；40天方案按阶段切换。</p><label class="form-field"><span>生效日期</span><input id="coefficient-effective-date" type="date" value="${APP_TODAY_KEY}" min="${APP_TODAY_KEY}"></label><div class="coefficient-row coefficient-head"><span>${fixed?'阶段':'活动系数'}</span><span>碳水 ×</span><span>蛋白 ×</span><span>脂肪 ×</span></div>${rows.map((row,i) => `<div class="coefficient-row"><strong>${labels[i]}</strong>${['carbs','protein','fat'].map(key => `<label class="form-field"><input type="number" data-coefficient-row="${i}" data-coefficient-key="${key}" aria-label="${labels[i]}${{carbs:'碳水',protein:'蛋白质',fat:'脂肪'}[key]}倍数" min="0" max="10" step="0.01" value="${row[key]}"></label>`).join('')}</div>`).join('')}<p class="sheet-hint">保存后按当前体重换算，已确认的减碳另行叠加；生效日期之前的目标不变。</p><button id="save-program-coefficients" class="primary-action" type="button">保存倍数</button>`
  sheetContent.querySelector('#save-program-coefficients').onclick = () => {
    const date = sheetContent.querySelector('#coefficient-effective-date').value
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || dateKey(parseLocalDate(date)) !== date || date < APP_TODAY_KEY) { showToast('请选择今天或之后的生效日期'); return }
    let valid = true
    sheetContent.querySelectorAll('[data-coefficient-row]').forEach(input => {
      const value = Number(input.value)
      if (input.value === '' || !Number.isFinite(value) || value < 0 || value > 10) valid=false
      rows[Number(input.dataset.coefficientRow)][input.dataset.coefficientKey] = value
    })
    if (!valid) { showToast('倍数应在 0–10 之间'); return }
    state.programCoefficients ||= {}
    const old = state.programCoefficients[methodId] || []
    state.programCoefficients[methodId] = [...old.filter(event => !(event.date===date && event.gender===gender)),{date,gender,rows:structuredClone(rows)}]
    persistState(); updateSummary(); updateSettingsSummaries(); renderPrep(); closeSheet(); openProgramOverview(methodId)
    showToast(`倍数已保存，${date} 起训休共同生效`)
  }
  openSheet()
}

function updateProgramSettingsDisplay() {
  const fixed=programBaseId()==='fixed'
  const heading=document.querySelector('[data-settings-section="schedule"] h2')
  if(heading) heading.textContent=fixed?'阶段日程':isDatedProgram()?'训练与餐次安排':'周期安排'
  if(isDatedProgram()) {
    const phase=programPhase()
    const target=methodTargetValues(state.day)
    const container=document.querySelector('#method-day-targets')
    container.classList.remove('three-days')
    container.classList.add('program-target')
    const dayLabel = !fixed ? '通用' : ['pending','complete'].includes(phase.kind) ? phase.label : `<span>第${Math.min(phase.day,40)}天</span><span>${phase.kind==='high'?'高碳日':'常规日'}</span>`
    container.innerHTML=`<button type="button" id="view-program"><span class="program-day-label">${dayLabel}</span><strong class="method-target-energy">${target.calories}<em> kcal</em></strong><div class="method-target-macros"><span class="carbs">碳 ${target.carbs}g</span><span class="protein">蛋 ${target.protein}g</span><span class="fat">脂 ${target.fat}g</span></div><b>阶段与计算 ›</b></button>`
    document.querySelector('#view-program').onclick=()=>openProgramOverview()
    if(fixed) document.querySelector('#weekly-plan-summary').textContent='40天一次 · 第12 / 24 / 36天高碳'
  } else document.querySelector('#method-day-targets').classList.remove('program-target')
  const summary=document.querySelector('#review-settings-summary')
  if(summary) {const config=reviewStatus();summary.textContent=config.enabled?`每${config.interval}天 · 目标每周下降${config.targetPercent}%`:'未开启 · 可为当前方法单独设置'}
  const prepTitle=document.querySelector('#week-plan-toggle h2')
  if(prepTitle) prepTitle.textContent=fixed?'备餐日期与餐次':'周期安排'
}

function updateProgramDayDisplay() {
  const fixed=programBaseId()==='fixed'
  const toggle=document.querySelector('.summary-day-toggle')
  const title=document.querySelector('.summary-title-block')
  const mealMarker=document.querySelector('#meal-training-mark')
  const phase=document.querySelector('#today-program-phase')
  if(!phase||!mealMarker) return
  if (!toggle || !title) return
  title.append(toggle)
  toggle.setAttribute('aria-label', fixed ? '训练或休息标注（不改变营养阶段）' : '营养日类型')
  mealMarker.hidden = true
  phase.hidden = true
  phase.textContent = ''
}

function openRecordDateCalendar() {
  beginEditorPage('record-calendar')
  sheetTitle.textContent='选择记录日期'
  sheetKicker.textContent='DAILY RECORDS'
  let month=new Date(selectedDate().getFullYear(),selectedDate().getMonth(),1)
  const paint=()=>{
    const first=new Date(month.getFullYear(),month.getMonth(),1-month.getDay())
    sheetContent.innerHTML=`<div class="record-calendar-heading"><button type="button" id="record-month-prev" aria-label="上个月">‹</button><strong>${month.getFullYear()}年${month.getMonth()+1}月</strong><button type="button" id="record-month-next" aria-label="下个月">›</button></div><div class="record-calendar-weekdays">${'日一二三四五六'.split('').map(d=>`<span>${d}</span>`).join('')}</div><div class="record-date-grid">${Array.from({length:42},(_,i)=>{
      const date=new Date(first.getFullYear(),first.getMonth(),first.getDate()+i);const key=dateKey(date)
      const meals=(state.dailyRecords[key]?.meals||[]).filter(meal=>!meal.isPlanned&&meal.items?.length)
      const calories=Math.round(meals.reduce((sum,meal)=>sum+mealNutrients(meal).calories,0))
      const target=targetForDayType(plannedNutritionDayTypeForDate(date),state.methodId,date)
      const progress=Math.min(100,Math.max(0,calories / Math.max(1,target.calories) * 100))
      return `<button type="button" data-record-date="${key}" aria-label="${date.getMonth()+1}月${date.getDate()}日${calories?`，已记录${calories}千卡`: '，暂无记录'}" aria-pressed="${key===dateKey(selectedDate())}" class="${date.getMonth()!==month.getMonth()?'outside':''} ${key===dateKey(selectedDate())?'selected':''} ${key===APP_TODAY_KEY?'today':''}"><span class="record-date-ring"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="19"/><circle class="record-ring-progress" cx="22" cy="22" r="19" pathLength="100" style="stroke-dasharray:${progress} 100"/></svg><strong>${date.getDate()}</strong></span><small>${calories?calories:key===APP_TODAY_KEY?'今天':'&nbsp;'}</small></button>`
    }).join('')}</div><button class="secondary-action" id="record-date-today" type="button">回到今天</button>`
    const move=delta=>{month=new Date(month.getFullYear(),month.getMonth()+delta,1);paint()}
    document.querySelector('#record-month-prev').onclick=()=>move(-1)
    document.querySelector('#record-month-next').onclick=()=>move(1)
    const choose=value=>{state.dayOffset=Math.round((parseLocalDate(value)-parseLocalDate(APP_TODAY_KEY))/86400000);closeSheet();switchPage('today');loadSelectedDate()}
    sheetContent.querySelectorAll('[data-record-date]').forEach(b=>b.onclick=()=>{if(!swiping)choose(b.dataset.recordDate)})
    document.querySelector('#record-date-today').onclick=()=>choose(APP_TODAY_KEY)
    const grid=sheetContent.querySelector('.record-date-grid');let start=null;let swiping=false
    grid.onpointerdown=e=>{start={x:e.clientX,y:e.clientY};swiping=false}
    grid.onpointerup=e=>{if(start&&Math.abs(e.clientX-start.x)>55&&Math.abs(e.clientY-start.y)<45){swiping=true;move(e.clientX<start.x?1:-1)}start=null}
    grid.onpointercancel=()=>{start=null}
  }
  paint();openSheet()
}
