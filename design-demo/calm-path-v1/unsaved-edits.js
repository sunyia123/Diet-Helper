// Editing-session guards. Navigation/search is not a data change; persistence
// still uses each editor's existing validation and save handler.
let sheetEditSession = null
let setEditSession = null
let unsavedPrompt = null
const dialogEditSessions = new WeakMap()
const editorSaveSelector = 'button[id^="save-"], #continue-method-save, #confirm-method-save, #confirm-method-range, #confirm-diet-review'

function editSaveButton(root) {
  if (root === sheetContent && editorPageKey === 'pixel-art') return document.querySelector('#pixel-header-save')
  return [...root.querySelectorAll(editorSaveSelector)].find(button=>!button.textContent.includes('关闭预览')) || null
}

function editSignature(root) {
  if(root.editDraftReader && root.editDraftReader.saveId === editSaveButton(root)?.id)return JSON.stringify(root.editDraftReader.read())
  if(root === mealSetPageContent && mealSetEditorState) {
    const editor=mealSetEditorState
    const items=editor.items.map(item=>({...item,amount:root.querySelector(`[data-set-item-amount="${CSS.escape(item.foodId)}"]`)?.value ?? item.amount}))
    return JSON.stringify({name:root.querySelector('#meal-set-name-input')?.value ?? editor.name,items,dayType:editor.dayType,mealType:editor.mealType,mealTypes:editor.mealTypes,applicableDayTypes:editor.applicableDayTypes,applicableCarbonLevels:editor.applicableCarbonLevels,tolerance:editor.tolerance})
  }
  const fields = [...root.querySelectorAll('input,select,textarea')].filter(el =>
    !['search','file'].includes(el.type) && !/search|filter|food-icon-group/.test(el.id) && !el.closest('[hidden]'))
  const values = fields.map(el => [el.id || JSON.stringify(el.dataset), el.type === 'checkbox' ? el.checked : el.value])
  const choices = [...root.querySelectorAll('button.active,button.selected,button[aria-pressed="true"]')]
    .filter(el => !el.matches('.category-chip,[data-pixel-tool],[data-pixel-color],.search-clear') && !el.closest('.food-icon-browser-controls'))
    .map(el => [el.id,JSON.stringify(el.dataset)])
  const rows = [...root.querySelectorAll('.dish-ingredient-row strong,.meal-item-edit-row strong,[data-cycle-day],.cycle-day')].map(el=>[el.textContent,el.className])
  const art = root.querySelector('.pixel-canvas')?.dataset.draftPixels || ''
  const preview = root.querySelector('#food-icon-picker-preview img')?.getAttribute('src') || ''
  return JSON.stringify({values,choices,rows,art,preview})
}

function makeEditSession(root, token) {
  const session = {root, token, initial:editSignature(root), rollback:null}
  // Legacy meal editing updates the current record eagerly. Roll back only this
  // meal, never the whole food library or unrelated records saved by children.
  if (root === sheetContent && /^meal-\d+$/.test(editorPageKey)) {
    const index=Number(editorPageKey.slice(5)), original=structuredClone(state.meals[index]), day=dateKey(selectedDate())
    session.rollback=()=>{
      if(dateKey(selectedDate())!==day)return
      state.meals[index]=structuredClone(original)
      const record=state.dailyRecords[day]
      if(record)record.meals=state.meals
      renderMeals();updateSummary();renderTrends();persistState()
    }
  }
  return session
}

function trackSheetEdit() {
  const save=editSaveButton(sheetContent)
  if(!save){sheetEditSession=null;return}
  const token=/method-save/.test(save.id)?'method-save':save.id
  if(!sheetEditSession || sheetEditSession.token!==token) sheetEditSession=makeEditSession(sheetContent,token)
}
function trackSetEdit() {
  if(!mealSetEditorState){setEditSession=null;return}
  if(!setEditSession || setEditSession.token!==mealSetEditorState) setEditSession=makeEditSession(mealSetPageContent,mealSetEditorState)
}
function dirtyEdit(session) { return !!session && session.initial!==(session.suspendedSignature ?? editSignature(session.root)) }
function currentEditSession() {
  if(activeActionDialog) return dialogEditSessions.get(activeActionDialog.overlay) || null
  if(sheet.getAttribute('aria-hidden')==='false')return sheetEditSession
  return !mealSetPage.hidden && mealSetEditorState ? setEditSession : null
}

function requestUnsavedExit(proceed) {
  if(unsavedPrompt)return true
  const session=currentEditSession()
  if(!dirtyEdit(session))return false
  const overlay=document.createElement('div')
  overlay.className='unsaved-edit-overlay'
  overlay.innerHTML='<section class="unsaved-edit-dialog" role="dialog" aria-modal="true" aria-labelledby="unsaved-edit-title"><h2 id="unsaved-edit-title">保存这次修改？</h2><p>你有尚未保存的修改。</p><button type="button" data-unsaved-save>保存并退出</button><button type="button" data-unsaved-discard>放弃修改</button><button type="button" data-unsaved-continue>继续编辑</button></section>'
  const focus=document.activeElement
  const background=[...document.body.children].map(node=>[node,node.inert])
  background.forEach(([node])=>node.inert=true)
  document.body.append(overlay)
  const dismiss=()=>{overlay.remove();background.forEach(([node,inert])=>node.inert=inert);unsavedPrompt=null;if(focus?.isConnected)focus.focus({preventScroll:true})}
  unsavedPrompt={dismiss}
  overlay.querySelector('[data-unsaved-continue]').onclick=dismiss
  overlay.querySelector('[data-unsaved-discard]').onclick=()=>{dismiss();session.rollback?.();session.initial=editSignature(session.root);proceed()}
  overlay.querySelector('[data-unsaved-save]').onclick=()=>{
    dismiss()
    const save=editSaveButton(session.root)
    if(!save || save.disabled){showToast('请先完成有效内容，再保存');return}
    // Invalid fields or required follow-up choices keep the editor open.
    save.click()
  }
  overlay.onkeydown=event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();dismiss()}
    if(event.key==='Tab'){
      const buttons=[...overlay.querySelectorAll('button')],i=buttons.indexOf(document.activeElement)
      event.preventDefault();buttons[(i+(event.shiftKey?-1:1)+buttons.length)%buttons.length].focus()
    }
  }
  overlay.querySelector('[data-unsaved-continue]').focus()
  return true
}

function installUnsavedEditGuards() {
  document.addEventListener('click',event=>{
    const back=event.target.closest('#close-sheet,#meal-set-page-back,#sheet-backdrop')
    const dialogClose=activeActionDialog && (event.target===activeActionDialog.overlay || event.target.closest('.action-dialog header button'))
    if(!back && !dialogClose)return
    const proceed=()=>{if(dialogClose)activeActionDialog?.close();else back.click()}
    if(requestUnsavedExit(proceed)){event.preventDefault();event.stopImmediatePropagation()}
  },true)
  new MutationObserver(()=>{
    if(activeActionDialog && !dialogEditSessions.has(activeActionDialog.overlay) && editSaveButton(activeActionDialog.content))
      dialogEditSessions.set(activeActionDialog.overlay,makeEditSession(activeActionDialog.content,activeActionDialog.overlay))
  }).observe(document.body,{childList:true,subtree:true})
  window.addEventListener('beforeunload',event=>{
    if([currentEditSession(),...editorPageStack.map(entry=>entry.editSession),mealSetEditorState?setEditSession:null].some(dirtyEdit)) {event.preventDefault();event.returnValue=''}
  })
}
window.addEventListener('DOMContentLoaded',installUnsavedEditGuards,{once:true})
