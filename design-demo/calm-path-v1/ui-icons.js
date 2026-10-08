// One UI drawing vocabulary. Food artwork and custom icon text are content, not controls.
const UI_ICON_PATHS = Object.freeze({
  back:'m14 6-6 6 6 6', forward:'m9 6 6 6-6 6', down:'m6 9 6 6 6-6',
  up:'m6 15 6-6 6 6', add:'M12 5v14M5 12h14', close:'m6 6 12 12M6 18 18 6',
  minus:'M5 12h14', check:'m5 12 4 4L19 6',
  star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z',
  edit:'m4 20 1-5L16 4a2.1 2.1 0 0 1 3 3L8 18ZM14 6l4 4',
  trash:'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 10v6M14 10v6',
  more:'M5 12h.01M12 12h.01M19 12h.01', arrowUp:'M12 20V4m-6 6 6-6 6 6',
  arrowDown:'M12 4v16m-6-6 6 6 6-6',
  copy:'M9 8h11v13H9ZM5 16H3V3h11v2', search:'M16 16l5 5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  camera:'M3 7h4l2-3h6l2 3h4v13H3ZM16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  home:'M3 11 12 4l9 7M5 10v11h14V10M9 21v-7h6v7',
  notebook:'M5 3h14v18H5ZM8 7h8M8 11h8M8 15h5',
  briefcase:'M3 7h18v14H3ZM8 7V3h8v4M3 12h18',
  chart:'M5 20V10M12 20V4M19 20V8', user:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21a8 8 0 0 1 16 0',
  lock:'M5 10h14v11H5ZM8 10V7a4 4 0 0 1 8 0v3',
  brush:'M14 4 5 16l3 3L20 7a2.2 2.2 0 0 0-6-3ZM5 16c-3 0-3 4-3 5 2 0 5 0 6-2',
  eraser:'m4 13 9-10 8 7-9 11H7l-5-5ZM9 8l8 7M11 21h10',
  fill:'m4 10 7-7 9 9-7 7ZM3 21h14M20 16s-2 3-2 4a2 2 0 0 0 4 0c0-1-2-4-2-4',
  pick:'m14 3 7 7M16 5 5 16v3H2l3 3v-3h3L19 8',
  undo:'M9 5 4 10l5 5M4 10h10a6 6 0 0 1 6 6v3', redo:'m15 5 5 5-5 5M20 10H10a6 6 0 0 0-6 6v3'
})
function uiIcon(name) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${UI_ICON_PATHS[name] || UI_ICON_PATHS.forward}"/></svg>`
}
function installUiIcons() {
  const symbolNames={'‹':'back','›':'forward','×':'close','＋':'add','+':'add','−':'minus','↑':'arrowUp','↓':'arrowDown','✓':'check','☆':'star','★':'star','⌘':'copy','▤':'notebook'}
  const nav={today:'home',foods:'notebook',prep:'briefcase',insights:'chart',profile:'user'}
  const locations='button,summary,.row-value b,.classic-icon-text,button > b,button > span[aria-hidden="true"],.search-field'
  function decorate(root) {
    if(!(root instanceof Element))return
    for(const button of [root,...root.querySelectorAll(locations)]) {
      if(!button.matches(locations)||button.closest('.pixel-palette,.food-icon-pack,.number-keypad-keys'))continue
      if(button.dataset.nav && !button.dataset.uiReady){
        button.querySelectorAll(':scope > svg').forEach(svg=>svg.remove())
        button.insertAdjacentHTML('afterbegin',uiIcon(nav[button.dataset.nav]));button.dataset.uiReady='true'
      }
      for(const svg of button.querySelectorAll(':scope > svg[viewBox="0 0 24 24"]')){
        svg.setAttribute('stroke-width','2');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round')
        svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false')
      }
      for(const node of [...button.childNodes]){
        if(node.nodeType!==Node.TEXT_NODE)continue
        const text=node.textContent.trim(),name=symbolNames[text]
        if(name){const holder=document.createElement('span');holder.innerHTML=uiIcon(name);node.replaceWith(holder.firstChild)}
        else if(/^[＋↑↓]\s*[^\s]/.test(text)){
          const holder=document.createElement('span');holder.innerHTML=uiIcon(symbolNames[text[0]])
          node.textContent=text.slice(1).trimStart();button.insertBefore(holder.firstChild,node)
        }
      }
    }
  }
  decorate(document.body)
  document.addEventListener('pointerdown',event=>{
    document.querySelectorAll('details.method-actions[open]').forEach(menu=>{if(!menu.contains(event.target))menu.open=false})
  })
  window.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||document.querySelector('.action-dialog-overlay,.number-keypad-overlay'))return
    const menus=[...document.querySelectorAll('details.method-actions[open]')].filter(menu=>menu.getClientRects().length&&!menu.closest('[hidden],[inert]'))
    if(!menus.length)return
    // Dismiss the innermost menu before the editor's own Escape/back handler.
    event.preventDefault();event.stopImmediatePropagation()
    menus.forEach(menu=>{menu.open=false;menu.querySelector('summary')?.focus()})
  },true)
  // Inspect only changed subtrees; do not walk the entire food library after each mutation.
  const pending=new Set();let scheduled=false
  new MutationObserver(records=>{
    for(const record of records)for(const node of record.addedNodes){
      if(node.nodeType===1&&!node.matches('svg,.ui-icon,path'))pending.add(node)
      else if(node.nodeType===3&&record.target instanceof Element)pending.add(record.target)
    }
    if(!scheduled&&pending.size){scheduled=true;requestAnimationFrame(()=>{scheduled=false;for(const node of pending)if(node.isConnected)decorate(node);pending.clear()})}
  }).observe(document.body,{childList:true,subtree:true})
}
document.addEventListener('DOMContentLoaded',installUiIcons,{once:true})
