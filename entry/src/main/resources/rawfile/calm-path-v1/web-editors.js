// Shared interactions for the standalone Web editor.
const editorPageStack = []
let editorPageKey = ''
let editorNavigationPending = false
let ignoreEditorPop = false

document.addEventListener('pointerdown', () => { document.body.dataset.inputModality = 'pointer' }, true)
document.addEventListener('keydown', (event) => {
  if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) document.body.dataset.inputModality = 'keyboard'
}, true)

function beginEditorPage(key) {
  if (sheet.getAttribute('aria-hidden') === 'false' && editorPageKey !== key) {
    if(typeof sheetEditSession!=='undefined' && sheetEditSession)sheetEditSession.suspendedSignature=editSignature(sheetContent)
    editorPageStack.push({
      key: editorPageKey, title: sheetTitle.textContent, kicker: sheetKicker.textContent,
      nodes: [...sheetContent.childNodes], scrollTop: sheet.scrollTop,
      log: { selectedMeal: state.selectedMeal, selectedFood: state.selectedFood, amount: state.amount, foodSheetSearch: state.foodSheetSearch },
      foodSheetMode, directFoodDate, foodLogFilter, foodLogCommonCollapsed, foodGridScrollTop,
      editSession: typeof sheetEditSession !== 'undefined' ? sheetEditSession : null,
      editDraftReader: sheetContent.editDraftReader
    })
    editorNavigationPending = true
    if(typeof sheetEditSession !== 'undefined')sheetEditSession=null
    delete sheetContent.editDraftReader
  } else if (sheet.getAttribute('aria-hidden') !== 'false') {
    editorPageStack.length = 0
    editorNavigationPending = true
  }
  editorPageKey = key
}

function showEditorPage() {
  sheet.dataset.editor = editorPageKey
  document.querySelector('#pixel-header-save').hidden = editorPageKey !== 'pixel-art'
  window.clearTimeout(sheetCloseTimer)
  const wasOpen = sheet.getAttribute('aria-hidden') === 'false'
  if (!wasOpen || editorNavigationPending) {
    window.history.pushState({ editor: true }, '', `#/edit/${encodeURIComponent(editorPageKey || 'settings')}`)
  }
  editorNavigationPending = false
  toast.classList.remove('show')
  backdrop.hidden = true
  sheet.hidden = false
  sheet.setAttribute('aria-hidden', 'false')
  sheet.classList.add('open')
  document.querySelector('.page-stack').inert = true
  document.querySelector('.bottom-nav').inert = true
  mealSetPage.inert = true
  optionalSettingsPage.inert = true
  if (!wasOpen) sheet.scrollTop = 0
  enhanceEditorControls(sheetContent)
  if(typeof trackSheetEdit==='function')trackSheetEdit()
}

function leaveEditorPage(fromHistory = false) {
  if (sheet.getAttribute('aria-hidden') !== 'false') return
  const previous = editorPageStack.pop()
  if(typeof sheetEditSession!=='undefined')sheetEditSession=previous?.editSession || null
  if(typeof sheetEditSession!=='undefined' && sheetEditSession)delete sheetEditSession.suspendedSignature
  if (previous) {
    editorPageKey = previous.key
    sheetTitle.textContent = previous.title
    sheetKicker.textContent = previous.kicker
    sheetContent.replaceChildren(...previous.nodes)
    sheetContent.editDraftReader=previous.editDraftReader
    Object.assign(state, previous.log)
    foodSheetMode = previous.foodSheetMode
    directFoodDate = previous.directFoodDate
    foodLogFilter = previous.foodLogFilter
    foodLogCommonCollapsed = previous.foodLogCommonCollapsed
    foodGridScrollTop = previous.foodGridScrollTop
    const restoredFoodGrid = sheetContent.querySelector('.meal-log-layout .food-grid')
    if (restoredFoodGrid) restoredFoodGrid.scrollTop = foodGridScrollTop
    if (previous.key.startsWith('meal-')) openMealEditorSheet(Number(previous.key.slice(5)))
    sheet.scrollTop = previous.scrollTop
  } else {
    sheet.classList.remove('open')
    sheet.setAttribute('aria-hidden', 'true')
    sheet.hidden = true
    editorPageKey = ''
    document.querySelector('.page-stack').inert = !mealSetPage.hidden || !optionalSettingsPage.hidden
    document.querySelector('.bottom-nav').inert = !mealSetPage.hidden || !optionalSettingsPage.hidden
    mealSetPage.inert = false
    optionalSettingsPage.inert = false
  }
  backdrop.hidden = true
  if (!fromHistory && window.history.state?.editor) {
    ignoreEditorPop = true
    window.history.back()
  }
  sheet.dataset.editor = editorPageKey
  document.querySelector('#pixel-header-save').hidden = editorPageKey !== 'pixel-art'
  // Restored overview nodes may predate a purchase edited in a child page.
  if(previous?.key==='purchase-overview')openShoppingOverview()
  else if(previous?.key.startsWith('food-price-'))openFoodPriceOverview(previous.key.slice(11))
  else if(previous?.key.startsWith('dish-cost-'))openDishCostDetail(previous.key.slice(10), Number(sheetContent.querySelector('[data-cost-amount]')?.dataset.costAmount) || 100)
}

// Reuse the existing validated save action; never create a second save path.
function refreshEditorHeaderAction() {
  let button=document.querySelector('#editor-header-action')
  if(!button){
    button=document.createElement('button');button.id='editor-header-action';button.type='button'
    document.querySelector('.editor-page-header').append(button)
    button.onclick=()=>{const target=editSaveButton(sheetContent);if(target&&!target.disabled)target.click()}
  }
  const target=typeof editSaveButton==='function'?editSaveButton(sheetContent):null
  button.hidden=!target||target.id==='save-meal-settings'||editorPageKey==='pixel-art'||editorPageKey.startsWith('weight-')||sheet.hidden
  if(!button.hidden){
    button.textContent=target.id==='continue-method-save'?'下一步':target.id.startsWith('confirm-')?'确认':'保存'
    button.setAttribute('aria-label',target.textContent.trim());button.disabled=target.disabled
  }
  let setButton=document.querySelector('#set-header-action')
  if(!setButton){
    setButton=document.createElement('button');setButton.id='set-header-action';setButton.type='button';setButton.textContent='保存'
    mealSetPage.querySelector('.sub-page-header').append(setButton)
    setButton.onclick=()=>mealSetPageContent.querySelector('#save-meal-set-editor')?.click()
  }
  const setTarget=mealSetPageContent.querySelector('#save-meal-set-editor')
  setButton.hidden=!setTarget||mealSetPage.hidden
  if(setTarget){setButton.disabled=setTarget.disabled;setButton.setAttribute('aria-label',setTarget.textContent.trim())}
}
document.addEventListener('DOMContentLoaded',()=>{
  let pending=false
  const observer=new MutationObserver(()=>{if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;refreshEditorHeaderAction()})}})
  observer.observe(document.querySelector('#sheet-content'),{childList:true,subtree:true})
  observer.observe(document.querySelector('#bottom-sheet'),{attributes:true,attributeFilter:['data-editor','hidden']})
  observer.observe(mealSetPageContent,{childList:true,subtree:true})
  observer.observe(mealSetPage,{attributes:true,attributeFilter:['hidden']})
  refreshEditorHeaderAction()
})

let activeNumberKeypad = null
let ignoreNumberKeypadPop = false
let activeActionDialog = null
let actionDialogSequence = 0
let ignoreActionDialogPop = false
let afterActionDialogClose = null

function openActionDialog(title, { animate = false, className = '' } = {}) {
  const replacing = !!activeActionDialog
  if(activeActionDialog) activeActionDialog.close(true, null, true)
  const overlay=document.createElement('div')
  overlay.className=`action-dialog-overlay ${className}`.trim()
  const titleId = `action-dialog-title-${++actionDialogSequence}`
  overlay.innerHTML=`<section class="action-dialog" role="dialog" aria-modal="true" aria-labelledby="${titleId}"><header><h2 id="${titleId}">${escapeHtml(title)}</h2><button type="button" aria-label="关闭弹窗">×</button></header><div class="action-dialog-content"></div></section>`
  const background=[...document.body.children].filter(n=>!['SCRIPT','STYLE','LINK'].includes(n.tagName) && !['layout-tuner','spacing-highlight'].includes(n.id)).map(n=>[n,n.inert])
  const focus=document.activeElement
  background.forEach(([node])=>node.inert=true)
  document.body.append(overlay)
  const panel = overlay.querySelector('.action-dialog')
  const motion = animate && !matchMedia('(prefers-reduced-motion: reduce)').matches
  let closing = false
  let finalized = false
  let historyPopped = false
  let onClosed = null
  let exitAnimation = null
  let entrance = motion ? panel.animate([{opacity: 0, transform: 'translateY(20px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 180, easing: 'cubic-bezier(.2,0,0,1)'}) : null
  const finish = () => {
      if(finalized)return
      finalized = true
      entrance?.cancel()
      if(activeActionDialog?.overlay===overlay)activeActionDialog=null
      overlay.remove();background.forEach(([node,inert])=>node.inert=inert)
      if(focus?.isConnected)focus.focus({preventScroll:true})
      if(!historyPopped && window.history.state?.actionDialog){ignoreActionDialogPop=true;afterActionDialogClose=onClosed;window.history.back()}
      else if(onClosed)onClosed()
  }
  const close=(fromHistory=false, afterClose=null, immediate=false)=>{
    if(activeActionDialog?.overlay!==overlay)return
    historyPopped ||= fromHistory
    if (closing) { if(immediate){exitAnimation?.cancel();finish()} return }
    closing = true
    onClosed = afterClose
    if (motion && !immediate) {
      const current = getComputedStyle(panel)
      const start = {opacity: current.opacity, transform: current.transform}
      entrance?.cancel(); entrance = null
      overlay.style.pointerEvents = 'none'
      exitAnimation = panel.animate([start, {opacity: 0, transform: 'translateY(12px)'}], {duration: 120, easing: 'ease-in', fill: 'forwards'})
      exitAnimation.finished.then(finish, finish)
    } else finish()
  }
  activeActionDialog={overlay,close,content:overlay.querySelector('.action-dialog-content')}
  if(!replacing)window.history.pushState({...window.history.state,actionDialog:true},'')
  overlay.querySelector('header button').onclick=()=>close()
  overlay.onclick=e=>{if(e.target===overlay)close()}
  overlay.onkeydown=e=>{
    if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!requestUnsavedExit(()=>close()))close()}
    if(e.key==='Tab'){
      const nodes=[...overlay.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')].filter(node=>!node.hidden&&node.getClientRects().length)
      if(e.shiftKey && document.activeElement===nodes[0]){e.preventDefault();nodes.at(-1)?.focus()}
      else if(!e.shiftKey && document.activeElement===nodes.at(-1)){e.preventDefault();nodes[0]?.focus()}
    }
  }
  overlay.querySelector('header button').focus()
  return activeActionDialog
}

function horizontalNumberHtml(id, value, min, max, label) {
  return `<div class="horizontal-number" data-horizontal-number><input id="${id}" hidden type="number" min="${min}" max="${max}" step="1" value="${value}" aria-label="${label}"><div class="horizontal-number-scroll" tabindex="0" role="slider" aria-label="${label}" aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${value}">${Array.from({length:max-min+1},(_,i)=>`<span class="${i+min===value?'active':''}">${i+min}</span>`).join('')}</div></div>`
}

function initializeHorizontalNumbers(root) {
  root.querySelectorAll('[data-horizontal-number]').forEach(host=>{
    const input=host.querySelector('input');const scroll=host.querySelector('.horizontal-number-scroll');let timer=0;let ready=false;let start=0;let startScroll=0;let dragged=false;let pointerId=null
    const paint=()=>{scroll.setAttribute('aria-valuenow',input.value);[...scroll.children].forEach(e=>e.classList.toggle('active',Number(e.textContent)===Number(input.value)))}
    const position=()=>{scroll.scrollLeft=(Number(input.value)-Number(input.min))*44;paint()}
    requestAnimationFrame(()=>{position();requestAnimationFrame(()=>ready=true)})
    scroll.onscroll=()=>{if(!ready)return;clearTimeout(timer);timer=setTimeout(()=>{if(!scroll.isConnected)return;if(input.disabled){position();return}const next=Math.max(Number(input.min),Math.min(Number(input.max),Math.round(scroll.scrollLeft/44)+Number(input.min)));if(next!==Number(input.value)){input.value=next;paint();input.dispatchEvent(new Event('change',{bubbles:true}))}},180)}
    scroll.onpointerdown=e=>{if(input.disabled||e.button!==0)return;start=e.clientX;startScroll=scroll.scrollLeft;dragged=false;pointerId=e.pointerId;if(e.pointerType==='mouse')scroll.setPointerCapture(e.pointerId)}
    scroll.onpointermove=e=>{if(input.disabled||e.pointerId!==pointerId)return;if(Math.abs(e.clientX-start)>6)dragged=true;if(dragged&&e.pointerType==='mouse'){scroll.classList.add('dragging');scroll.scrollLeft=startScroll+start-e.clientX;e.preventDefault()}}
    const endDrag=e=>{if(e.pointerId!==pointerId)return;pointerId=null;if(e.pointerType==='mouse'){const left=Math.round(scroll.scrollLeft/44)*44;scroll.classList.remove('dragging');if(scroll.hasPointerCapture(e.pointerId))scroll.releasePointerCapture(e.pointerId);if(dragged)scroll.scrollTo({left,behavior:'smooth'})}}
    scroll.onpointerup=endDrag
    scroll.onpointercancel=endDrag
    scroll.onclick=()=>{if(!input.disabled&&!dragged)openNumberKeypad(input,scroll)}
    scroll.onkeydown=e=>{if(input.disabled)return;if(['Enter',' '].includes(e.key)){e.preventDefault();openNumberKeypad(input,scroll)}else if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();scroll.scrollLeft+=(e.key==='ArrowRight'?44:-44)}}
    input.addEventListener('change',position)
  })
}

function openMealTimeDialog(input, label, onSave) {
  const [hours,minutes]=input.value.split(':').map(Number)
  const dialog=openActionDialog(label)
  dialog.content.innerHTML=`<div class="time-dialog-fields"><label>小时<input type="number" aria-label="小时" id="dialog-hours" min="0" max="23" step="1" value="${hours}"></label><b>:</b><label>分钟<input type="number" aria-label="分钟" id="dialog-minutes" min="0" max="59" step="1" value="${minutes}"></label></div><button type="button" class="primary-action" id="save-dialog-time">保存时间</button>`
  enhanceEditorControls(dialog.content)
  dialog.content.querySelector('#save-dialog-time').onclick=()=>{input.value=`${String(dialog.content.querySelector('#dialog-hours').value).padStart(2,'0')}:${String(dialog.content.querySelector('#dialog-minutes').value).padStart(2,'0')}`;onSave(input.value);dialog.close()}
}

function numberInputRules(input) {
  return {
    min: input.min === '' ? 0 : Number(input.min),
    max: input.max === '' ? 99999 : Number(input.max),
    step: input.step === 'any' ? 0.1 : Number(input.step) || 1
  }
}

function validateNumberEntry(text, rules) {
  const precision = rules.step < .1 ? 2 : 1
  if (!new RegExp(`^\\d+(?:\\.\\d{1,${precision}})?$`).test(text)) return { error: rules.step < 1 ? `请输入数字，最多保留${precision}位小数` : '请输入整数' }
  const value = Number(text)
  if (value < rules.min || value > rules.max) return { error: `请输入 ${rules.min}–${rules.max} 之间的数值` }
  if (Math.abs((value - rules.min) / rules.step - Math.round((value - rules.min) / rules.step)) > 0.00001) {
    return { error: rules.step === 1 ? '请输入整数' : `请按 ${rules.step} 的单位输入` }
  }
  return { value }
}

function closeNumberKeypad(fromHistory = false) {
  if (!activeNumberKeypad) return
  const { overlay, input, background, returnFocus } = activeNumberKeypad
  activeNumberKeypad = null
  overlay.remove()
  background.forEach(([node, inert]) => { node.inert = inert })
  if (returnFocus.isConnected) returnFocus.focus({ preventScroll: true })
  if (!fromHistory && window.history.state?.numberKeypad) {
    ignoreNumberKeypadPop = true
    window.history.back()
  }
}

function openNumberKeypad(input, returnFocus = input) {
  if (activeNumberKeypad || input.disabled || !input.isConnected) return
  const rules = numberInputRules(input)
  const label = input.getAttribute('aria-label') || '数值'
  const unit = input.dataset.unit || input.parentElement.querySelector('em')?.textContent || (input.matches('[data-log-amount-input], [data-setlog-amount-input], [data-meal-item-amount], [data-set-item-amount], [data-dish-amount]') ? 'g' : '')
  let value = input.value
  let replace = true
  const overlay = document.createElement('div')
  overlay.className = 'number-keypad-overlay'
  overlay.innerHTML = `<section class="number-keypad" role="dialog" aria-modal="true" aria-labelledby="number-keypad-title">
    <header><button type="button" data-number-cancel>取消</button><strong id="number-keypad-title">${escapeHtml(label)}</strong><button type="button" data-number-confirm>完成</button></header>
    <div class="number-keypad-value"><output aria-live="polite"></output><span>${escapeHtml(unit)}</span><button type="button" data-number-key="clear">清空</button></div>
    <p class="number-keypad-help" role="status">范围 ${rules.min}–${rules.max}${escapeHtml(unit)}${rules.step < 1 ? ' · 支持小数' : ' · 整数'}</p>
    <div class="number-keypad-grid">${['1','2','3','4','5','6','7','8','9','.','0','backspace'].map((key) => `<button type="button" data-number-key="${key}" ${key === '.' && rules.step >= 1 ? 'disabled' : ''} aria-label="${key === 'backspace' ? '退格' : key === '.' ? '小数点' : key}">${key === 'backspace' ? '⌫' : key}</button>`).join('')}</div>
  </section>`
  const background = [...document.body.children].filter((node) => !['SCRIPT', 'STYLE', 'LINK'].includes(node.tagName)).map((node) => [node, node.inert])
  background.forEach(([node]) => { node.inert = true })
  document.body.append(overlay)
  activeNumberKeypad = { overlay, input, background, returnFocus }
  window.history.pushState({ ...window.history.state, numberKeypad: true }, '')
  const output = overlay.querySelector('output')
  const help = overlay.querySelector('.number-keypad-help')
  const originalHelp = help.textContent
  const paint = () => { output.textContent = value || '—'; output.classList.toggle('replace-value', replace); help.textContent = originalHelp; help.classList.remove('invalid') }
  const enterKey = (key) => {
    if (key === 'clear') value = ''
    else if (key === 'backspace') value = value.slice(0, -1)
    else if (key === '.') {
      if (rules.step >= 1) return
      if (replace || !value) value = '0.'
      else if (!value.includes('.')) value += '.'
    } else {
      if (replace || value === '0') value = ''
      const precision = rules.step < .1 ? 2 : 1
      if (value.length >= 8 || (value.includes('.') && value.split('.')[1].length >= precision)) return
      value += key
    }
    replace = false
    paint()
  }
  const commit = () => {
    const result = validateNumberEntry(value, rules)
    if (result.error) { help.textContent = result.error; help.classList.add('invalid'); return }
    closeNumberKeypad()
    input.value = String(result.value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
    input.dispatchEvent(new Event('change', { bubbles: true }))
  }
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay || event.target.closest('[data-number-cancel]')) closeNumberKeypad()
    else if (event.target.closest('[data-number-confirm]')) commit()
    else if (event.target.closest('[data-number-key]')) enterKey(event.target.closest('[data-number-key]').dataset.numberKey)
  })
  overlay.addEventListener('keydown', (event) => {
    if (/^\d$/.test(event.key) || ['.', 'Backspace', 'Delete', 'Enter', 'Escape'].includes(event.key)) {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Enter') commit()
      else if (event.key === 'Escape') closeNumberKeypad()
      else enterKey(event.key === 'Backspace' ? 'backspace' : event.key === 'Delete' ? 'clear' : event.key)
    } else if (event.key === 'Tab') {
      const buttons = [...overlay.querySelectorAll('button:not(:disabled)')]
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus() }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus() }
    }
  })
  paint()
  overlay.querySelector('[data-number-confirm]').focus()
}

function enhanceNumericInput(input) {
  if (input.dataset.keypadReady || input.readOnly || input.disabled) return
  if (!input.step && /height/.test(input.id)) input.step = '0.1'
  input.dataset.keypadReady = 'true'
  input.readOnly = true
  input.inputMode = 'none'
  input.setAttribute('aria-haspopup', 'dialog')
  input.setAttribute('aria-label', input.getAttribute('aria-label') || input.closest('label')?.querySelector('span')?.textContent || (input.closest('.current-amount-panel') ? '食物克重' : '') || input.closest('.meal-item-edit-row')?.querySelector('strong')?.textContent || '数值')
  input.closest('.meal-item-edit-row')?.classList.add('number-edit-row')
  input.addEventListener('click', () => openNumberKeypad(input))
  input.addEventListener('keydown', (event) => {
    if (['Enter', ' '].includes(event.key) || /^\d$/.test(event.key)) { event.preventDefault(); openNumberKeypad(input) }
  })
}

function enhanceSlimeSelect(select) {
  if (select.dataset.slimeReady) return
  select.dataset.slimeReady = 'true'
  const options = [...select.options].filter((option) => !option.disabled && option.value)
  const group = document.createElement('div')
  group.className = 'profile-slime slime-toggle'
  const choiceColors = ['var(--choice-blue)', 'var(--choice-rose)', 'var(--choice-ochre)']
  const colorChoices = Boolean(select.closest('.body-profile-editor, .onboarding-form'))
  if (colorChoices) group.classList.add('profile-colored-options')
  group.setAttribute('role', 'group')
  group.setAttribute('aria-label', select.closest('label')?.querySelector('span')?.textContent || '选择')
  group.style.setProperty('--profile-options', options.length)
  const indicator = document.createElement('i')
  indicator.className = 'choice-slime day-choice-slime'
  indicator.setAttribute('aria-hidden', 'true')
  group.append(indicator)
  select.hidden = true
  select.closest('label')?.classList.add('slime-field')
  const current = options.findIndex((option) => option.value === select.value)
  group.style.cssText += slimeChoiceStyle(slimeChoiceGeometry(options.length, Math.max(0, current), Math.max(0, current), 0, 3))
  indicator.hidden = current < 0
  if (colorChoices) group.style.setProperty('--profile-selected-color', choiceColors[Math.max(0, current) % choiceColors.length])
  options.forEach((option, index) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = option.textContent
    button.className = index === current ? 'active' : ''
    if (colorChoices) button.style.setProperty('--profile-option-color', choiceColors[index % choiceColors.length])
    button.setAttribute('aria-pressed', String(index === current))
    button.addEventListener('click', (event) => {
      event.preventDefault()
      const from = options.findIndex((item) => item.value === select.value)
      if (from === index) return
      select.value = option.value
      indicator.hidden = false
      if (colorChoices) group.style.setProperty('--profile-selected-color', choiceColors[index % choiceColors.length])
      moveSlimeIndicator(group, Math.max(0, from), index, options.length, 0, 3)
      group.querySelectorAll('button').forEach((item) => {
        item.classList.toggle('active', item === button)
        item.setAttribute('aria-pressed', String(item === button))
      })
      select.dispatchEvent(new Event('change', { bubbles: true }))
    })
    group.append(button)
  })
  select.after(group)
}

function enhanceEditorControls(container) {
  container.querySelectorAll('input[type="number"]').forEach(enhanceNumericInput)
  container.querySelectorAll('.body-profile-editor select, .onboarding-form select:not(#onboarding-weight-unit):not(#onboarding-activity)').forEach(enhanceSlimeSelect)
}

function initializeEditorInteractions() {
  appShell.append(sheet)
  sheet.hidden = true
  enhanceEditorControls(document)
  new MutationObserver((records) => {
    const roots = new Set()
    records.forEach((record) => record.addedNodes.forEach((node) => {
      if (node.nodeType === 1 && !node.closest('.number-keypad-overlay, .profile-slime')) roots.add(node)
    }))
    roots.forEach((node) => {
      if (node.matches('input[type="number"]')) enhanceNumericInput(node)
      enhanceEditorControls(node)
    })
  }).observe(document.body, { childList: true, subtree: true })
  window.addEventListener('popstate', (event) => {
    if(typeof unsavedPrompt!=='undefined' && unsavedPrompt){
      window.history.pushState({editor:true,...(activeActionDialog?{actionDialog:true}:{})},'',`#/edit/${encodeURIComponent(editorPageKey || 'settings')}`)
      unsavedPrompt.dismiss();event.stopImmediatePropagation();return
    }
    if (ignoreNumberKeypadPop) { ignoreNumberKeypadPop = false; event.stopImmediatePropagation(); return }
    if (activeNumberKeypad) { closeNumberKeypad(true); event.stopImmediatePropagation() }
    else if(ignoreActionDialogPop){ignoreActionDialogPop=false;event.stopImmediatePropagation();const next=afterActionDialogClose;afterActionDialogClose=null;if(next)next()}
    else if(activeActionDialog){
      if(typeof requestUnsavedExit==='function' && dirtyEdit(currentEditSession())){
        window.history.pushState({...event.state,actionDialog:true},'')
        requestUnsavedExit(()=>activeActionDialog?.close())
      } else activeActionDialog.close(true)
      event.stopImmediatePropagation()
    }
  }, true)
  window.addEventListener('popstate', () => {
    if (ignoreEditorPop) { ignoreEditorPop = false; return }
    if (sheet.getAttribute('aria-hidden') === 'false') {
      if(typeof requestUnsavedExit==='function' && dirtyEdit(currentEditSession())){
        window.history.pushState({editor:true},'',`#/edit/${encodeURIComponent(editorPageKey || 'settings')}`)
        requestUnsavedExit(()=>leaveEditorPage())
      } else leaveEditorPage(true)
    }
  })
  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-log-amount-choice], [data-setlog-amount-choice]')) {
      sheetContent.querySelectorAll('input[type="number"]').forEach((input) => input.dispatchEvent(new Event('input', { bubbles: true })))
    }
  })
}

function calculateDishNutrition(ingredients, yieldWeight = 0) {
  if (!Array.isArray(ingredients) || !ingredients.length) return null
  const total = { calories: 0, carbs: 0, protein: 0, fat: 0 }
  let weight = 0
  for (const ingredient of ingredients) {
    const amount = Number(ingredient.amount)
    if (!Number.isFinite(amount) || amount <= 0 || amount > 3000) return null
    weight += amount
    for (const key of Object.keys(total)) {
      const source=foodById(ingredient.foodId)
      const value = Number(source&&source.kind!=='dish' ? effectiveFoodNutrition(source.id)?.[key] : ingredient[key])
      if (!Number.isFinite(value) || value < 0 || value > (key === 'calories' ? 5000 : 100)) return null
      total[key] += value * amount / 100
    }
  }
  const basis=Number.isFinite(yieldWeight)&&yieldWeight>0?yieldWeight:weight
  const per100 = Object.fromEntries(Object.entries(total).map(([key, value]) => [key, Math.round(value / basis * 1000) / 10]))
  return { weight: Math.round(weight * 10) / 10, total, per100 }
}

function safeRecipeUrl(value) {
  try { const url=new URL(String(value||''));return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href.slice(0,1000):'' } catch { return '' }
}

function normalizeDishRecipe(recipe) {
  if (!recipe || !Array.isArray(recipe.ingredients) || recipe.ingredients.length > 100) return null
  const ingredients = recipe.ingredients.map((item) => ({
    foodId: safeImportedText(item?.foodId, '', 80).replace(/[^a-zA-Z0-9_-]/g, ''),
    name: safeImportedText(item?.name, '食材', 40), amount: Number(item?.amount),
    calories: Number(item?.calories), carbs: Number(item?.carbs), protein: Number(item?.protein), fat: Number(item?.fat)
  }))
  if (!calculateDishNutrition(ingredients)) return null
  const yieldWeight=Number(recipe.yieldWeight??0)
  if(!Number.isFinite(yieldWeight)||yieldWeight<0||yieldWeight>30000)return null
  const preparation=(Array.isArray(recipe.preparation)?recipe.preparation:[]).slice(0,30).filter(item=>Number.isFinite(Number(item?.amount))&&Number(item.amount)>0).map(item=>({name:safeImportedText(item.name,'食材',40),amount:Number(item.amount),unit:safeImportedText(item.unit,'g',4)}))
  return { ingredients, yieldWeight, preparation, sourceName:safeImportedText(recipe.sourceName,'',120), sourceUrl:safeRecipeUrl(recipe.sourceUrl), notes: typeof recipe.notes === 'string' ? recipe.notes.slice(0, 5000) : '' }
}

function dishIngredient(food, amount = 100) {
  const basis=effectiveFoodNutrition(food.id)||food
  return { foodId: food.id, name: food.name, amount, calories: basis.calories, carbs: basis.carbs, protein: basis.protein, fat: basis.fat }
}

// A child page edits only the proposed portion; adding commits to the parent draft.
function openIngredientPicker({ title = '加入套餐', excludeId = '', defaultStage = 'cooked', onAdd }) {
  beginEditorPage('ingredient-picker')
  sheetTitle.textContent = '添加食物或菜肴'; sheetKicker.textContent = ''
  sheetContent.innerHTML = `<div class="ingredient-picker-page"><label class="search-field"><input id="ingredient-search" type="search" placeholder="输入食物名称或拼音"><button type="button" id="ingredient-clear" aria-label="清空搜索">×</button></label>${foodStageSegmentedHtml(defaultStage,{label:'食材默认状态',buttonAttribute:'data-picker-stage'})}<div class="ingredient-portion"><label><input id="ingredient-amount" type="number" value="100" min="0.1" max="3000" step="0.1" aria-label="分量" data-unit="g"><span>g</span></label><button type="button" id="ingredient-add" class="primary-action">${escapeHtml(title)}</button></div><p id="ingredient-selected"></p><div id="ingredient-results"></div></div>`
  const root=sheetContent.querySelector('.ingredient-picker-page')
  let selected='',stage=defaultStage
  const select = food => { const chosen=foodById(foodForState(food.id,stage))||food;selected=chosen.id;root.querySelector('#ingredient-selected').textContent=chosen.name;root.querySelector('#ingredient-add').disabled=false }
  const add = id => {
    const amount=Number(root.querySelector('#ingredient-amount').value), food=foodById(foodForState(id,stage))
    if(!food || !Number.isFinite(amount)||amount<=0||amount>3000){showToast('请填写 0.1–3000g 的分量');return}
    closeSheet(); onAdd(food,Math.max(0.1,Math.round(amount*10)/10)); showToast(`已加入${food.name}`)
  }
  const render = () => {
    const keyword=root.querySelector('#ingredient-search').value.trim()
    const options=sortVisibleFoods(selectableFoods().filter(food=>food.id!==excludeId&&matchesFoodSearch(food,keyword)))
    root.querySelector('#ingredient-results').innerHTML=options.map(food=>`<div class="ingredient-option">${foodIconHtml(food,true)}<button type="button" data-ingredient-select="${food.id}"><strong>${escapeHtml(food.name)}</strong><small>碳 ${rounded(effectiveFoodNutrition(food.id)?.carbs||0)} · 蛋 ${rounded(effectiveFoodNutrition(food.id)?.protein||0)} · 脂 ${rounded(effectiveFoodNutrition(food.id)?.fat||0)}</small></button><button type="button" data-ingredient-add="${food.id}" aria-label="加入${escapeHtml(food.name)}">＋</button></div>`).join('')||'<p>没有找到食物。请先到食物库添加。</p>'
    root.querySelectorAll('[data-ingredient-select]').forEach(button=>button.onclick=()=>select(foodById(button.dataset.ingredientSelect)))
    root.querySelectorAll('[data-ingredient-add]').forEach(button=>button.onclick=()=>add(button.dataset.ingredientAdd))
    root.querySelector('#ingredient-add').disabled=!selected
  }
  root.querySelector('#ingredient-search').addEventListener('input',render)
  root.querySelector('#ingredient-clear').onclick=()=>{root.querySelector('#ingredient-search').value='';render()}
  root.querySelectorAll('[data-picker-stage]').forEach(button=>button.onclick=()=>{
    const next=button.dataset.pickerStage
    if(next===stage)return
    const toggle=root.querySelector('.food-stage-toggle')
    toggle.dataset.stage=next
    toggle.style.setProperty('--slime-to',slimeChoiceGeometry(2,next==='raw'?0:1,next==='raw'?0:1,0,2).to)
    const input=root.querySelector('#ingredient-amount')
    if(selected&&foodStatePair(selected))input.value=oneDecimal(equivalentFoodAmount(selected,Number(input.value),next),0.1,3000)
    stage=next
    if(selected)select(foodById(selected))
    root.querySelectorAll('[data-picker-stage]').forEach(choice=>{const active=choice.dataset.pickerStage===stage;choice.classList.toggle('active',active);choice.setAttribute('aria-pressed',String(active))})
  })
  root.querySelector('#ingredient-add').onclick=()=>add(selected)
  render(); openSheet()
}

function openDishEditorPage(foodId = null, suggestedName = '', afterSave = null) {
  beginEditorPage(`dish-${foodId || 'new'}`)
  const existing = foodById(foodId)
  const editorFoodId=existing?.id||`dish-${crypto.randomUUID()}`
  const recipe = normalizeDishRecipe(existing?.recipe)
  const draft = { name: existing?.name || suggestedName, category: existing?.category || 'other', notes: recipe?.notes || '', ingredients: recipe?.ingredients || [], preparation: recipe?.preparation || [], yieldWeight:recipe?.yieldWeight||0 }
  sheetKicker.textContent = 'DISH RECIPE'
  sheetTitle.textContent = existing ? '编辑菜肴' : '创建菜肴'
  sheetContent.innerHTML = `<div class="dish-editor">
    <div class="dish-identity-row"><label class="form-field"><span>菜肴名称</span><input id="dish-name" value="${escapeHtml(draft.name)}" placeholder="例如：番茄炒蛋" maxlength="40"></label>
    <label class="form-field"><span>归入分类</span><select id="dish-category">${foodCategoryOptions.map((option) => `<option value="${option.id}">${option.name}</option>`).join('')}</select></label></div>
    <div id="dish-text-import"></div>
    <section class="dish-nutrition-card"><div><span>每 100 g · 熟重</span><strong id="dish-total-weight">尚未加入食材</strong></div><div id="dish-nutrition"></div><small id="dish-nutrition-basis">按食材总重量折算，包含加入的油与调味料。</small></section>
    <section><div class="content-heading"><h2>菜肴食材</h2><span id="dish-ingredient-count">0 种</span></div><div class="dish-ingredients" id="dish-ingredients"></div></section>
    <section class="dish-preparation-editor"><div class="content-heading dish-preparation-heading"><h2>辅料 <small>同比换算 · 不计营养</small></h2><button class="add-ingredient-heading" id="add-dish-preparation" type="button" aria-label="添加辅料">＋</button></div><div id="dish-preparation-rows"></div></section>
    <section class="dish-food-picker"><div class="content-heading"><h2>选择食材</h2><small>点击食材加入，点击数字改克重</small></div><label class="search-field"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg><input id="dish-food-search" type="search" placeholder="输入食物名称或拼音"><button id="dish-search-clear" class="search-clear" type="button" aria-label="清空食材搜索">×</button></label><div class="food-grid dish-food-results" id="dish-food-results"></div></section>
    <label class="form-field"><span>原配方成品重量 g · 未称重留 0</span><input id="dish-yield-weight" type="number" min="0" max="30000" step="0.1" value="${draft.yieldWeight}" aria-label="原配方成品重量" data-unit="g"></label>
    <label class="form-field dish-notes"><span>做法备注 · 选填</span><textarea id="dish-notes" rows="4" maxlength="5000" placeholder="记下烹饪步骤、火候或调味…">${escapeHtml(draft.notes)}</textarea></label>
    <div class="dish-source-fields"><label class="form-field"><span>来源</span><input id="dish-source-name" maxlength="120" value="${escapeHtml(recipe?.sourceName||'')}"></label><label class="form-field"><span>链接</span><input id="dish-source-url" type="url" maxlength="1000" value="${escapeHtml(recipe?.sourceUrl||'')}"></label></div>
    <button class="primary-action" id="save-dish" type="button">${existing ? '保存菜肴' : '保存到食物库'}</button>
  </div>`
  document.querySelector('#dish-category').value = draft.category
  const dishDraftSignature=()=>JSON.stringify({draft,fields:['dish-name','dish-category','dish-notes','dish-source-name','dish-source-url'].map(id=>document.getElementById(id).value)})
  const initialDishDraft=dishDraftSignature()
  const renderTotals = () => {
    const result = calculateDishNutrition(draft.ingredients,draft.yieldWeight)
    document.querySelector('#dish-total-weight').textContent = result ? `投料 ${result.weight} g${draft.yieldWeight?` · 成品 ${draft.yieldWeight} g`:''}` : '尚未加入食材'
    document.querySelector('#dish-nutrition-basis').textContent=existing?.nutritionEstimate?`${draft.yieldWeight?'已按所填成品重量折算。':''}${existing.nutritionEstimate}`:(draft.yieldWeight?'按已填写的成品重量折算，含油与调味料。':'成品尚未称重，暂按投料总重量折算。')
    const values = result?.per100 || { calories: 0, carbs: 0, protein: 0, fat: 0 }
    document.querySelector('#dish-nutrition').innerHTML = `<div class="dish-nutrient-values">${['calories', 'carbs', 'protein', 'fat'].map((key) => `<div class="${key}"><strong>${values[key]}</strong><small>${{ calories: 'kcal', carbs: '碳水 g', protein: '蛋白 g', fat: '脂肪 g' }[key]}</small></div>`).join('')}</div>`
    document.querySelector('#dish-ingredient-count').textContent = `${draft.ingredients.length} 种`
  }
  const renderIngredients = () => {
    const container = document.querySelector('#dish-ingredients')
    const macros = item => ['carbs','protein','fat'].map(key => `<b class="${key}">${{carbs:'碳',protein:'蛋',fat:'脂'}[key]} ${Math.round(item[key]*item.amount/10)/10}g</b>`).join('')
    container.innerHTML = draft.ingredients.length ? draft.ingredients.map((item, index) => `<div class="dish-ingredient-swipe"><button class="ingredient-copy-action" type="button" data-copy-dish-ingredient="${index}" aria-label="复制${escapeHtml(item.name)}">复制</button><div class="dish-ingredient-row">${foodIconHtml(foodById(item.foodId) || { name: item.name, category: 'other', useIcon: false }, true)}<span class="dish-item-name"><strong title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</strong>${foodStatePair(item.foodId)?`<button type="button" class="food-stage-mini" data-dish-stage="${index}" aria-label="切换为${foodState(item.foodId)==='raw'?'熟':'生'}重">${foodState(item.foodId)==='raw'?'生':'熟'}</button>`:''}</span><label><input type="number" data-dish-amount="${index}" aria-label="${escapeHtml(item.name)}克重" min="0.1" max="3000" step="0.1" value="${item.amount}"><em>g</em></label><button type="button" data-remove-dish-ingredient="${index}" aria-label="移除${escapeHtml(item.name)}">×</button><small class="dish-item-macros">${macros(item)}</small></div></div>`).join('') : '<p class="empty-editor-note">从下方选择食材，开始组装这道菜。</p>'
    container.querySelectorAll('[data-dish-amount]').forEach((input) => {
      const update = () => { const item=draft.ingredients[Number(input.dataset.dishAmount)]; item.amount = input.value === '' ? 0 : Number(input.value); input.closest('.dish-ingredient-row').querySelector('.dish-item-macros').innerHTML=macros(item); renderTotals() }
      input.addEventListener('input', update)
      input.addEventListener('change', update)
    })
    container.querySelectorAll('[data-dish-stage]').forEach(button=>button.onclick=()=>{
      const item=draft.ingredients[Number(button.dataset.dishStage)],next=foodState(item.foodId)==='raw'?'cooked':'raw'
      const counterpart=foodById(foodForState(item.foodId,next))
      if(!counterpart)return
      const amount=oneDecimal(equivalentFoodAmount(item.foodId,item.amount,next),0.1,3000)
      Object.assign(item,dishIngredient(counterpart,amount))
      renderIngredients();renderTotals()
    })
    container.querySelectorAll('[data-remove-dish-ingredient]').forEach((button) => button.addEventListener('click', () => {
      draft.ingredients.splice(Number(button.dataset.removeDishIngredient), 1)
      renderIngredients()
      renderTotals()
    }))
    bindIngredientCopyGestures(container, index => {
      if (draft.ingredients.length >= 100) { showToast('一道菜最多添加 100 项食材'); return }
      draft.ingredients.splice(index + 1, 0, { ...draft.ingredients[index] })
      renderIngredients(); renderTotals(); showToast('已复制食材，可单独调整克重')
    })
    enhanceEditorControls(container)
  }
  const renderCandidates = () => {
    const keyword = document.querySelector('#dish-food-search').value.trim()
    const candidates = sortVisibleFoods(selectableFoods().filter((food) => food.id !== foodId && matchesFoodSearch(food, keyword)))
    const container = document.querySelector('#dish-food-results')
    container.innerHTML = candidates.length ? candidates.map((food) => `<button class="food-option" type="button" data-dish-food="${food.id}">${foodIconHtml(food, true)}<span class="dish-food-copy"><strong>${escapeHtml(food.name)}</strong><small>${food.calories} kcal / 100g</small></span><b>＋</b></button>`).join('') : '<p class="empty-editor-note">没有找到食材，试试其他名称或拼音。</p>'
    container.querySelectorAll('[data-dish-food]').forEach((button) => button.addEventListener('click', () => {
      const food = foodById(button.dataset.dishFood)
      const item = draft.ingredients.find((item) => item.foodId === food.id)
      if (item) item.amount = Math.min(3000, item.amount + 100)
      else {
        if (draft.ingredients.length >= 100) { showToast('一道菜最多添加 100 种食材'); return }
        draft.ingredients.push(dishIngredient(food))
      }
      renderIngredients()
      renderTotals()
      showToast(`已加入${food.name}`)
    }))
  }
  const renderPreparation = () => {
    const container = sheetContent.querySelector('#dish-preparation-rows')
    container.innerHTML = draft.preparation.map((item, index) => `<div class="dish-preparation-row">
      <input type="text" data-preparation-name="${index}" aria-label="辅料${index + 1}名称" placeholder="辅料名称" maxlength="40" value="${escapeHtml(item.name)}">
      <input type="number" data-preparation-amount="${index}" aria-label="辅料${index + 1}用量" min="0.1" max="30000" step="0.1" data-unit="${escapeHtml(item.unit)}" value="${item.amount}">
      <input type="text" data-preparation-unit="${index}" aria-label="辅料${index + 1}单位" placeholder="单位" maxlength="4" value="${escapeHtml(item.unit)}">
      <button type="button" data-remove-preparation="${index}" aria-label="删除辅料${index + 1}">×</button>
    </div>`).join('')
    for (const [field, key] of [['name', 'preparationName'], ['amount', 'preparationAmount'], ['unit', 'preparationUnit']]) {
      container.querySelectorAll(`[data-preparation-${field}]`).forEach(input => {
        const update = () => {
          const index = Number(input.dataset[key])
          draft.preparation[index][field] = field === 'amount' ? Number(input.value) : input.value
          if (field === 'unit') container.querySelector(`[data-preparation-amount="${index}"]`).dataset.unit = input.value
        }
        input.addEventListener('input', update)
        input.addEventListener('change', update)
      })
    }
    container.querySelectorAll('[data-remove-preparation]').forEach(button => button.onclick = () => {
      draft.preparation.splice(Number(button.dataset.removePreparation), 1)
      renderPreparation()
    })
    enhanceEditorControls(container)
  }
  sheetContent.querySelector('#add-dish-preparation').onclick = () => {
    if (draft.preparation.length >= 30) { showToast('一道菜最多添加 30 项辅料'); return }
    draft.preparation.push({ name: '', amount: 1, unit: 'g' })
    renderPreparation()
    sheetContent.querySelector(`[data-preparation-name="${draft.preparation.length - 1}"]`).focus()
  }
  document.querySelector('#dish-food-search').addEventListener('input', renderCandidates)
  document.querySelector('#dish-yield-weight').addEventListener('change',event=>{draft.yieldWeight=Number(event.target.value);renderTotals()})
  initializeRecipeTextImport(document.querySelector('#dish-text-import'), (ingredients, notes, preparation = []) => {
    if (draft.ingredients.length + ingredients.length > 100) { showToast('一道菜最多添加 100 项食材'); return false }
    if (draft.preparation.length + preparation.length > 30) { showToast('一道菜最多添加 30 项辅料'); return false }
    draft.ingredients.push(...ingredients)
    draft.preparation.push(...preparation.map(item=>({...item})))
    if (notes) {
      const notesInput = document.querySelector('#dish-notes')
      notesInput.value = [notesInput.value, notes].filter(Boolean).join('\n').slice(0, 5000)
    }
    renderIngredients()
    renderPreparation()
    renderTotals()
  }, foodId)
  document.querySelector('#dish-search-clear').addEventListener('click', () => {
    document.querySelector('#dish-food-search').value = ''
    renderCandidates()
  })
  document.querySelector('#save-dish').addEventListener('click', () => {
    const name = safeImportedText(document.querySelector('#dish-name').value, '', 40)
    if (!name) { showToast('请填写菜肴名称'); document.querySelector('#dish-name').focus(); return }
    const result = calculateDishNutrition(draft.ingredients,draft.yieldWeight)
    if (!result) { showToast('请至少加入一种食材，并填写有效克重'); return }
    const invalidPreparation = draft.preparation.findIndex(item => !safeImportedText(item.name, '', 40) || !safeImportedText(item.unit, '', 4) || !Number.isFinite(item.amount) || item.amount < 0.1 || item.amount > 30000)
    if (invalidPreparation !== -1) {
      showToast('请填写辅料名称、单位和 0.1–30000 的用量')
      sheetContent.querySelector(`[data-preparation-name="${invalidPreparation}"]`).focus()
      return
    }
    const preparation = draft.preparation.map(item => ({ name: safeImportedText(item.name, '', 40), amount: Math.round(item.amount * 10) / 10, unit: safeImportedText(item.unit, '', 4) }))
    const sourceUrl=document.querySelector('#dish-source-url').value.trim()
    if(sourceUrl&&!safeRecipeUrl(sourceUrl)){showToast('请填写有效的 http 或 https 链接');return}
    const food = existing&&initialDishDraft===dishDraftSignature()?{...existing}:{ ...(existing || {}), id: editorFoodId, name, symbol: name.slice(0, 2), category: document.querySelector('#dish-category').value, kind: 'dish', custom: true, useIcon: existing?.useIcon ?? false, createdAt: existing?.createdAt || Date.now(), ...result.per100, recipe: { ingredients: draft.ingredients.map((item) => ({ ...item })), yieldWeight:draft.yieldWeight, preparation,sourceName:safeImportedText(document.querySelector('#dish-source-name').value,'',120),sourceUrl:safeRecipeUrl(sourceUrl),notes: document.querySelector('#dish-notes').value.slice(0, 5000) } }
    if(!saveLibraryFoodWithWeightRule(food,existing,{changed:false}))return
    renderFoodLibrary()
    renderMeals()
    updateSummary()
    renderPrep()
    renderTrends()
    closeSheet()
    if (typeof afterSave === 'function') afterSave(food)
    showToast(`已保存菜肴「${name}」`)
  })
  renderIngredients()
  renderPreparation()
  renderCandidates()
  renderTotals()
  sheetContent.querySelector('.dish-food-picker').remove()
  const addIngredient=document.createElement('button')
  addIngredient.type='button'; addIngredient.className='add-ingredient-heading'; addIngredient.id='add-dish-ingredient'
  addIngredient.textContent='＋'; addIngredient.setAttribute('aria-label','添加菜肴食材')
  sheetContent.querySelector('#dish-ingredient-count').after(addIngredient)
  addIngredient.onclick=()=>openIngredientPicker({title:'加入菜肴',excludeId:foodId,defaultStage:'raw',onAdd(food,amount){
    const item=draft.ingredients.find(item=>item.foodId===food.id)
    if(item)item.amount=Math.min(3000,Math.round((item.amount+amount)*10)/10)
    else if(draft.ingredients.length<100)draft.ingredients.push(dishIngredient(food,amount))
    else {showToast('一道菜最多添加 100 种食材');return}
    renderIngredients();renderTotals()
  }})
  const empty=sheetContent.querySelector('#dish-ingredients .empty-editor-note')
  if(empty)empty.textContent='点击右上方 ＋ 添加食材'
  openSheet()
}

function scaleDishRecipe(recipe, mode, amount, ingredientIndex = 0, baseYield = recipe.yieldWeight) {
  const basis=mode==='yield'?Number(baseYield):Number(recipe.ingredients[ingredientIndex]?.amount)
  if(!Number.isFinite(basis)||basis<=0||!Number.isFinite(amount)||amount<=0)return null
  const factor=amount/basis
  const rounded=value=>Math.round(value*10)/10
  return {factor,ingredients:recipe.ingredients.map(item=>({...item,amount:rounded(item.amount*factor)})),preparation:(recipe.preparation||[]).map(item=>({...item,amount:rounded(item.amount*factor)})),inputWeight:rounded(recipe.ingredients.reduce((sum,item)=>sum+item.amount,0)*factor),outputWeight:Number(baseYield)>0?rounded(Number(baseYield)*factor):null}
}

function openDishFollowPage(foodId) {
  const food=foodById(foodId),recipe=normalizeDishRecipe(food?.recipe)
  if(!food||!recipe)return
  beginEditorPage(`cook-${food.id}`)
  sheetTitle.textContent=food.name
  sheetKicker.textContent='COOK'
  let mode='ingredient',ingredientIndex=0,amount=recipe.ingredients[0].amount,baseYield=recipe.yieldWeight
  sheetContent.innerHTML=`<div class="dish-follow"><div class="food-library-tabs cook-mode" role="tablist" aria-label="菜肴用量基准"><button type="button" role="tab" data-cook-mode="ingredient" class="active" aria-selected="true">按食材</button><button type="button" role="tab" data-cook-mode="yield" aria-selected="false">按成品</button></div><div id="cook-controls"></div><p id="cook-scale-summary" class="cook-scale-summary" aria-live="polite"></p><div id="cook-ingredients" class="cook-ingredients"></div><p id="cook-preparation" class="cook-preparation"></p><section class="cook-method"><h3>制作过程</h3><div id="cook-steps"></div></section><div id="cook-source"></div><button class="secondary-action" id="edit-follow-dish" type="button">编辑菜肴</button></div>`
  const paint=()=>{
    const scaled=scaleDishRecipe(recipe,mode,amount,ingredientIndex,baseYield)
    document.querySelector('#cook-scale-summary').textContent=scaled?`投料 ${scaled.inputWeight}g${scaled.outputWeight?` · 成品约 ${scaled.outputWeight}g`:''} · ${Math.round(scaled.factor*100)/100} 倍`:'请先填写原配方实测成品重量'
    const ingredients=scaled?.ingredients||recipe.ingredients
    document.querySelector('#cook-ingredients').innerHTML=ingredients.map((item,index)=>`<button type="button" class="cook-ingredient ${mode==='ingredient'&&index===ingredientIndex?'active':''}" data-cook-ingredient="${index}" aria-label="按${escapeHtml(item.name)}重量换算">${foodIconHtml(foodById(item.foodId),true)}<span>${escapeHtml(item.name)}</span><strong>${item.amount}<small>g</small></strong></button>`).join('')
    document.querySelector('#cook-preparation').textContent=(scaled?.preparation||recipe.preparation).map(item=>`${item.name} ${item.amount}${item.unit}`).join(' · ')
    let notes=recipe.notes
    const water=ingredients.find(item=>item.name==='葱姜水')
    if(food.id==='dish-chicken-meatballs'&&water)notes=notes.replace('过滤留80g',`过滤留${water.amount}g`)
    const lines=notes.split(/\n+/).filter(Boolean),steps=lines.filter(line=>/^\d+[.、]/.test(line)),details=lines.filter(line=>!/^\d+[.、]/.test(line))
    document.querySelector('#cook-steps').innerHTML=steps.length?`<ol>${steps.map(line=>`<li>${escapeHtml(line.replace(/^\d+[.、]\s*/,''))}</li>`).join('')}</ol>${details.length?`<details class="cook-notes"><summary>原配方备注</summary><p>${escapeHtml(details.join('\n'))}</p></details>`:''}`:`<p>${escapeHtml(notes||'尚未填写制作过程')}</p>`
    document.querySelectorAll('[data-cook-ingredient]').forEach(button=>button.onclick=()=>{ingredientIndex=Number(button.dataset.cookIngredient);amount=ingredients[ingredientIndex].amount;mode='ingredient';controls();paint();openNumberKeypad(document.querySelector('#cook-amount'))})
  }
  const controls=()=>{
    document.querySelectorAll('[data-cook-mode]').forEach(button=>{const active=button.dataset.cookMode===mode;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))})
    document.querySelector('#cook-controls').innerHTML=`<div class="cook-scale-row">${mode==='ingredient'?`<select id="cook-anchor" aria-label="换算基准食材">${recipe.ingredients.map((item,index)=>`<option value="${index}" ${index===ingredientIndex?'selected':''}>${escapeHtml(item.name)}</option>`).join('')}</select>`:'<strong>目标成品</strong>'}<label><input id="cook-amount" type="number" min="0.1" max="30000" step="0.1" value="${amount}" aria-label="目标重量" data-unit="g"><em>g</em></label></div>${mode==='yield'?`<div class="cook-scale-row cook-base-yield"><span>原配方成品</span><label><input id="cook-base-yield" type="number" min="0" max="30000" step="0.1" value="${baseYield}" aria-label="原配方实测成品重量" data-unit="g"><em>g</em></label></div>`:''}`
    document.querySelector('#cook-amount').onchange=event=>{amount=Number(event.target.value);paint()}
    const anchor=document.querySelector('#cook-anchor')
    if(anchor)anchor.onchange=event=>{const factor=scaleDishRecipe(recipe,mode,amount,ingredientIndex,baseYield)?.factor||1;ingredientIndex=Number(event.target.value);amount=Math.round(recipe.ingredients[ingredientIndex].amount*factor*10)/10;controls();paint()}
    const yieldInput=document.querySelector('#cook-base-yield')
    if(yieldInput)yieldInput.onchange=event=>{baseYield=Number(event.target.value);paint()}
    enhanceEditorControls(document.querySelector('#cook-controls'))
  }
  document.querySelectorAll('[data-cook-mode]').forEach(button=>button.onclick=()=>{if(button.dataset.cookMode===mode)return;mode=button.dataset.cookMode;amount=mode==='ingredient'?recipe.ingredients[ingredientIndex].amount:baseYield||100;controls();paint()})
  const source=document.querySelector('#cook-source')
  source.innerHTML=(recipe.sourceUrl?`<a class="cook-source-link" href="${escapeHtml(recipe.sourceUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(recipe.sourceName||'查看来源')} ↗</a>`:escapeHtml(recipe.sourceName))+(food.nutritionEstimate?foodSourceHtml(food):'')
  document.querySelector('#edit-follow-dish').onclick=()=>openDishEditorPage(food.id,'',()=>openDishFollowPage(food.id))
  controls();paint();openSheet()
}

function continueLoggingCreatedFood(food) {
  if (foodSheetMode !== 'direct') directFoodDate = dateKey(selectedDate())
  state.selectedFood = food.id
  state.amount = 100
  state.foodSheetSearch = ''
  foodSheetMode = 'direct'
  foodGridScrollTop = 0
  foodSheetScrollTop = 0
  renderFoodSheet(false,false)
  openSheet()
}

function selectCreatedFoodForSet(food) {
  mealSetEditorState.selectedFood = foodForState(food.id,'cooked')
  mealSetEditorState.amount = 100
  mealSetEditorState.search = food.name
  mealSetEditorState.categoryFilters = []
  mealSetEditorState.collapsedSections.foods = false
  renderMealSetPageEditor()
}
