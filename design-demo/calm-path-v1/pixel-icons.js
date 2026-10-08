// Additive mapping only: never rewrite an existing food icon or a user's image.
function pixelIconById(id) { return typeof PIXEL_FOOD_ICONS === 'undefined' ? null : PIXEL_FOOD_ICONS.find(icon => icon.id === id) || null }
const pixelLegacyMap = Object.freeze({
  '1f33d':'caio-corn', '1f344':'darina-mushrooms', '1f345':'caio-tomato', '1f346':'caio-eggplant', '1f347':'caio-grapes', '1f349':'caio-watermelon-piece', '1f34a':'caio-orange', '1f34b':'caio-lemon', '1f34c':'caio-banana', '1f34e':'caio-apple', '1f34f':'caio-apple', '1f350':'caio-pear', '1f351':'caio-peach', '1f352':'caio-cherry', '1f353':'caio-strawberry', '1f357':'caio-chicken-drumstick', '1f35a':'darina-bowl-of-rice', '1f35e':'darina-bread', '1f360':'caio-sweet-potato', '1f383':'caio-pumpkin', '1f41f':'caio-trout', '1f951':'caio-avocado', '1f952':'caio-cucumber', '1f954':'caio-potato', '1f955':'caio-carrot', '1f95b':'caio-milk-bottle', '1f95d':'caio-kiwi', '1f966':'caio-broccoli', '1f969':'caio-filet-mignon', '1f96c':'caio-lettuce', '1f986':'caio-duck-drumstick', '1f990':'caio-shrimp', '1f9aa':'caio-oyster', '1f9c4':'caio-garlic', '1f9c5':'caio-onion', '1fad0':'caio-blueberry', '1fad1':'caio-bell-pepper-red', '2615':'darina-coffee-mug', '1f9c0':'darina-cheese', '1f34d':'caio-pineapple', '1f965':'caio-coconut', '1f96d':'caio-mango', '1f354':'darina-hamburger', '1f355':'darina-pizza', '1f32d':'darina-hot-dog', '1f32e':'darina-taco', '1f96a':'darina-sandwich', '1f369':'darina-donut', '1f35f':'darina-fries'
})
function pixelFoodIcon(food, style) {
  if (food.iconSource === 'pixel-library') return pixelIconById(food.pixelIcon)
  if (food.iconSource === 'original' || food.iconSource === 'pixel-art' || style !== 'pixel' || food.customImage || food.useIcon === false) return null
  if (/鸡胸/.test(food.name)) return pixelIconById('pixel-caio-chicken-breast')
  const legacy = String(food.icon || (typeof defaultFoodIcon === 'function' ? defaultFoodIcon(food) : '')).replace(/^openmoji-/, '')
  return pixelIconById(`pixel-${pixelLegacyMap[legacy] || ''}`) || null
}

// Decorate semantic icon locations. Keep old DOM/SVG and never touch data charts.
function installPixelUiIcons() {
  const targets = [
    ['[data-nav="today"]','home'], ['[data-nav="foods"]','notebook'], ['[data-nav="prep"]','briefcase'], ['[data-nav="insights"]','chart'], ['[data-nav="profile"]','user'],
    ['#previous-day, #close-sheet, .sub-page-back','chevron-left'], ['#next-day','chevron-right'],
    ['.search-field, .dish-search-field','search'], ['.search-clear, .remove-food, [data-remove-dish-ingredient], [data-remove-meal-food]','close'],
    ['.food-edit-button, .food-edit, .set-edit-icon','pencil'], ['.set-copy-icon','copy'], ['.lock-food','lock'],
    ['.settings-collapse-toggle, .week-plan-toggle','chevron-down'], ['[data-action="camera"], .meal-camera','camera'],
    ['[data-delete-food]','trash'], ['[data-pixel-undo]','undo'], ['[data-pixel-redo]','redo'], ['#draw-food-icon','brush']
  ]
  function decorate() {
    for (const [selector,name] of targets) for (const node of document.querySelectorAll(selector)) {
      if (node.querySelector(':scope > .pixel-ui-icon')) continue
      if (typeof PIXEL_UI_ART === 'undefined' || !PIXEL_UI_ART[name]) continue
      // Labels with no existing decorative SVG must not gain an unrelated icon.
      if (node.matches('.search-field, .dish-search-field') && !node.querySelector(':scope > svg')) continue
      node.classList.add('has-pixel-icon')
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3 && /^[\s‹›×＋+−-]+$/.test(child.textContent) && child.textContent.trim()) {
          const old = document.createElement('span'); old.className = 'classic-icon-text'; old.textContent = child.textContent; child.replaceWith(old)
        }
      }
      const icon = document.createElement('span'); icon.className = 'pixel-ui-icon'; icon.setAttribute('aria-hidden','true')
      icon.innerHTML = PIXEL_UI_ART[name]
      node.prepend(icon)
    }
  }
  decorate()
  let scheduled = false
  const observer = new MutationObserver(() => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => { scheduled = false; decorate() })
  })
  observer.observe(document.body,{ childList:true, subtree:true })
}
// UI controls now use ui-icons.js in every theme. Keep the legacy mapping available
// for old packages, but do not decorate the current Web DOM with pixel controls.

// One shortcut follows the visible vertical scroller, including nested editor lists.
function installScrollToTop() {
  const button = document.createElement('button')
  button.type = 'button'; button.className = 'scroll-to-top'; button.hidden = true
  button.setAttribute('aria-label', '回到顶部'); button.title = '回到顶部'
  button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 5h14M6 13l6-6 6 6M12 7v13"/></svg>'
  document.body.append(button)
  let target = null, scheduled = false
  const scrollTargets = '.app-page.active[data-page="foods"] #food-library, .app-page.active[data-page="prep"]'
  const visible = el => {
    if (!el?.isConnected || el.closest('[hidden], [inert], [aria-hidden="true"]') || !el.getClientRects().length) return false
    if (document.querySelector('.editor-page[aria-hidden="false"], .meal-set-page:not([hidden])')) return false
    return el.matches(scrollTargets)
  }
  function refresh() {
    scheduled = false
    if (document.querySelector('.number-keypad-overlay, .action-dialog-overlay')) { button.hidden = true; return }
    if (!visible(target) || target.scrollTop < 180) {
      const scrollers = [...document.querySelectorAll(scrollTargets)]
      target = scrollers.find(el => visible(el) && el.scrollTop >= 180) || null
    }
    button.hidden = !target
  }
  document.addEventListener('scroll', event => {
    const el = event.target === document ? document.scrollingElement : event.target
    if (el?.scrollTop >= 180 && visible(el)) target = el
    if (!scheduled) { scheduled = true; requestAnimationFrame(refresh) }
  }, true)
  new MutationObserver(() => { if (!scheduled) { scheduled = true; requestAnimationFrame(refresh) } }).observe(document.querySelector('.app-shell'), {subtree:true, attributes:true, attributeFilter:['hidden','aria-hidden','inert']})
  button.onclick = () => target?.scrollTo({ top:0, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}
if (typeof window !== 'undefined' && typeof MutationObserver !== 'undefined') window.addEventListener('DOMContentLoaded', installScrollToTop, {once:true})
