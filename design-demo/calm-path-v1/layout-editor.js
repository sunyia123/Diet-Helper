// Page-scoped spacing overrides. Layout transfers are separate from nutrition
// and user records. Persist structured paths, not user-provided CSS.
const pageSpacingKey = 'shiyouji-page-spacing-v2'
const spacingProps = [...layoutProperties, 'row-gap', 'column-gap']
const spacingNames = [...layoutLabels, '行间隔', '列间隔']
// Semantic families, never state classes (selected/checked) or arbitrary imported CSS.
// A relative child path also supports labels/amounts inside repeated components.
const spacingFamilies = Object.fromEntries([
  ['meal-marker', '餐次序号'], ['meal-title-button', '餐次标题'], ['meal-photo-button', '餐次拍照'],
  ['meal-copy', '餐次名称与时间'], ['meal-main', '餐次左栏'], ['meal-macros', '餐次营养标签'],
  ['meal-stats', '餐次统计'], ['meal-actions', '餐次操作'], ['add-meal-button', '餐次添加按钮'],
  ['meal-row-content', '餐次内容'], ['meal-row', '餐次行'], ['meal-food-item', '餐次食物'], ['meal-food-text', '文字食物行'],
  ['meal-item-edit-row', '编辑食物行'],
  ['dish-ingredient-row', '菜肴食材行'],
  ['library-food-copy', '食物信息'], ['library-food-main', '食物主内容'], ['library-food', '食物库条目'],
  ['library-food-row', '食物库整行'],
  ['food-option-copy', '待选食物信息'], ['food-option', '待选食物'], ['recent-option', '常用食物'],
  ['shopping-check', '备餐勾选'], ['shopping-copy', '备餐名称'], ['shopping-price', '备餐记账'],
  ['shopping-required', '计划用量'], ['shopping-item', '备餐清单行'],
  ['price-receipt', '购物记录行'], ['price-food-row', '采购总览行'], ['purchase-line', '记账编辑记录行'], ['price-summary', '价格采购摘要'],
  ['daily-set-card', '每日套餐'], ['meal-set-option', '候选套餐'],
  ['setting-row', '设置项'], ['settings-heading', '设置分组标题'], ['settings-number', '设置分组序号'],
  ['settings-section-body', '设置分组内容'], ['settings-card', '设置分组卡片'], ['nav-item', '底部导航项'],
  ['form-field', '表单项'], ['calendar-day', '日历日期'], ['calendar-metric', '日历指标']
].map(([key, name]) => [key, {name, selector: `.${key}`}]))
function validSpacingFamily(rule) {
  return rule.group === undefined || typeof rule.group === 'string' && Object.prototype.hasOwnProperty.call(spacingFamilies, rule.group) && rule.path.every(step => step.id === undefined)
}
function sanitizePageSpacing(value) {
  const result = { version: 2, safeTop: 24, rules: [] }
  if (!value || typeof value !== 'object') return result
  if (Number.isFinite(value.safeTop)) result.safeTop = Math.max(0, Math.min(96, value.safeTop))
  for (const rule of (Array.isArray(value.rules) ? value.rules : []).slice(0, 2000)) {
    if (typeof rule?.scope !== 'string' || rule.scope.length > 200 || !Array.isArray(rule.path) || rule.path.length > 30) continue
    if (!rule.path.every(step => /^[a-z][a-z0-9-]*$/.test(step?.tag) && (step.id === undefined || typeof step.id === 'string' && step.id.length < 200) && Number.isInteger(step.index) && step.index > 0 && step.index < 10000)) continue
    if (!validSpacingFamily(rule)) continue
    const values = {}
    for (const prop of spacingProps) {
      const number = rule.values?.[prop]
      if (Number.isFinite(number) && number >= (prop.startsWith('margin') ? -64 : 0) && number <= 320) values[prop] = number
    }
    result.rules.push({ scope: rule.scope, ...(rule.group ? {group: rule.group} : {}), path: rule.path.map(({tag, id, index}) => ({tag, id, index})), values })
  }
  return result
}
let savedPageSpacing
try { const stored=localStorage.getItem(pageSpacingKey);savedPageSpacing = sanitizePageSpacing(stored===null&&typeof bundledSpacingDefaults==='object'?bundledSpacingDefaults.pageSpacing:JSON.parse(stored)) } catch { savedPageSpacing = sanitizePageSpacing(null) }

function spacingObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value) }
function ownsSpacingField(value, key) { return spacingObject(value) && Object.prototype.hasOwnProperty.call(value, key) }
function sanitizeLegacySpacing(value) {
  const result = {}
  for (const key of Object.keys(layoutTargets)) {
    if (!ownsSpacingField(value, key) || !spacingObject(value[key])) continue
    const values = {}
    for (const prop of layoutProperties) {
      if (ownsSpacingField(value[key], prop) && Number.isFinite(value[key][prop]) && value[key][prop] >= 0 && value[key][prop] <= 48) values[prop] = value[key][prop]
    }
    if (Object.keys(values).length) result[key] = values
  }
  return result
}
function storedSpacingValue(key, fallback) {
  const raw = localStorage.getItem(key)
  if (raw === null) return fallback
  try { return JSON.parse(raw) } catch { throw new Error('本机边距数据无法读取，请先在边距编辑中检查并保存') }
}
function spacingBackupData() {
  // Export saved settings, never an unsaved live-editor preview.
  return {
    pageSpacing: sanitizePageSpacing(storedSpacingValue(pageSpacingKey, savedPageSpacing)),
    legacySpacing: sanitizeLegacySpacing(storedSpacingValue(layoutStorageKey, savedLayout))
  }
}
function normalizeSpacingBackup(value) {
  const hasPage = ownsSpacingField(value, 'pageSpacing'), hasLegacy = ownsSpacingField(value, 'legacySpacing')
  const invalid = () => { throw new Error('页面边距数据格式或数值无效，尚未导入') }
  if (!hasPage && !hasLegacy) invalid()
  const result = {}
  if (hasPage) {
    const page = value.pageSpacing
    if (!spacingObject(page) || page.version !== 2 || !Number.isFinite(page.safeTop) || page.safeTop < 0 || page.safeTop > 96 || !Array.isArray(page.rules) || page.rules.length > 2000) invalid()
    for (const rule of page.rules) {
      if (!spacingObject(rule) || typeof rule.scope !== 'string' || !rule.scope.length || rule.scope.length > 200 || !Array.isArray(rule.path) || rule.path.length > 30 || !spacingObject(rule.values)) invalid()
      for (const step of rule.path) {
        if (!spacingObject(step) || typeof step.tag !== 'string' || !/^[a-z][a-z0-9-]*$/.test(step.tag) || (step.id !== undefined && (typeof step.id !== 'string' || step.id.length >= 200)) || !Number.isInteger(step.index) || step.index < 1 || step.index >= 10000) invalid()
      }
      if (!validSpacingFamily(rule)) invalid()
      for (const [prop, number] of Object.entries(rule.values)) {
        if (!spacingProps.includes(prop) || !Number.isFinite(number) || number < (prop.startsWith('margin') ? -64 : 0) || number > 320) invalid()
      }
    }
    result.pageSpacing = sanitizePageSpacing(page)
  }
  if (hasLegacy) {
    if (!spacingObject(value.legacySpacing)) invalid()
    for (const [key, values] of Object.entries(value.legacySpacing)) {
      if (!Object.prototype.hasOwnProperty.call(layoutTargets, key) || !spacingObject(values)) invalid()
      for (const [prop, number] of Object.entries(values)) {
        if (!layoutProperties.includes(prop) || !Number.isFinite(number) || number < 0 || number > 48) invalid()
      }
    }
    result.legacySpacing = sanitizeLegacySpacing(value.legacySpacing)
  }
  return result
}
function spacingBackupCount(value) {
  return (value.pageSpacing ? value.pageSpacing.rules.length + 1 : 0) + Object.keys(value.legacySpacing || {}).length
}
function prepareSpacingImport(value, overwrite) {
  const incoming = normalizeSpacingBackup(value)
  if (document.querySelector('#layout-tuner')) throw new Error('请先保存并关闭边距编辑面板，再导入页面边距')
  const next = {}
  if (incoming.legacySpacing) {
    const current = sanitizeLegacySpacing(storedSpacingValue(layoutStorageKey, savedLayout))
    next.legacySpacing = overwrite ? incoming.legacySpacing : structuredClone(incoming.legacySpacing)
    if (!overwrite) for (const [key, values] of Object.entries(current)) next.legacySpacing[key] = {...next.legacySpacing[key], ...values}
  }
  if (incoming.pageSpacing) {
    const stored = storedSpacingValue(pageSpacingKey, null), current = sanitizePageSpacing(stored || savedPageSpacing)
    next.pageSpacing = incoming.pageSpacing
    if (!overwrite) {
      const rules = new Map()
      // Local values win per property; selector identity also resolves legacy arrow paths.
      for (const rule of [...incoming.pageSpacing.rules, ...current.rules]) {
        const key = spacingSelector(rule)
        rules.set(key, {...rule, values: {...rules.get(key)?.values, ...rule.values}})
      }
      if (rules.size > 2000) throw new Error('合并后的边距组件超过2000项，请减少内容或选择覆盖')
      next.pageSpacing = {version: 2, safeTop: Number.isFinite(stored?.safeTop) ? current.safeTop : incoming.pageSpacing.safeTop, rules: [...rules.values()]}
    }
  }
  return {next, result: {id: 'layout', name: '页面边距', count: spacingBackupCount(next), details: overwrite ? '已恢复文件中的边距与顶部避让；未包含的设置保留' : '已补入缺少的边距；同一配置项保留本机值'}}
}
function commitSpacingImport(plan) {
  const entries = []
  if (plan.next.legacySpacing) entries.push([layoutStorageKey, plan.next.legacySpacing])
  if (plan.next.pageSpacing) entries.push([pageSpacingKey, plan.next.pageSpacing])
  const previous = new Map(entries.map(([key]) => [key, localStorage.getItem(key)])), written = []
  try {
    for (const [key, value] of entries) { localStorage.setItem(key, JSON.stringify(value)); written.push(key) }
  } catch {
    let restored = true
    for (const key of written.reverse()) {
      try { const raw = previous.get(key); if (raw === null) localStorage.removeItem(key); else localStorage.setItem(key, raw) } catch { restored = false }
    }
    throw new Error(restored ? '页面边距保存失败，原边距已保留，请检查本机存储后重试' : '页面边距保存失败且无法完整还原，请保留备份并检查本机存储')
  }
  if (plan.next.legacySpacing) { savedLayout = structuredClone(plan.next.legacySpacing); applyLayoutSettings(savedLayout) }
  if (plan.next.pageSpacing) { savedPageSpacing = structuredClone(plan.next.pageSpacing); applyPageSpacing(savedPageSpacing) }
  markSpacingSurfaces()
  return plan.result
}
// Only these two editor templates share spacing across food IDs / cycles.
// Exact editor scopes still represent intentional single-component exceptions.
function ledgerSpacingFamily(scope) {
  if (scope === 'editor-family:food-price' || scope.startsWith('editor:food-price-')) return 'food-price'
  if (scope === 'editor-family:purchase' || /^editor:purchase-.+-\d{4}-\d{2}-\d{2}$/.test(scope)) return 'purchase'
  return null
}
function isSharedLedgerSpacing(scope) { return scope === 'editor-family:food-price' || scope === 'editor-family:purchase' }
function spacingSelector(rule) {
  const root = isSharedLedgerSpacing(rule.scope) ? `[data-spacing-family="${ledgerSpacingFamily(rule.scope)}"]` : `[data-spacing-scope="${CSS.escape(rule.scope)}"]`
  if (rule.group) return `${root} ${spacingFamilies[rule.group].selector}` + rule.path.map(step => ` > ${step.tag}:nth-of-type(${step.index})`).join('')
  if (isSharedLedgerSpacing(rule.scope)) {
    // Template sections can insert hints / totals depending on purchase history.
    // Anchor named fields directly rather than retaining unstable ancestor indexes.
    const anchor = rule.path.findLastIndex(step => step.id)
    if (anchor >= 0 && rule.path[anchor].id !== 'sheet-content') {
      const step = rule.path[anchor]
      return `${root} ${step.tag}#${CSS.escape(step.id)}` + rule.path.slice(anchor + 1).map(child => ` > ${child.tag}:nth-of-type(${child.index})`).join('')
    }
  }
  // The old top-level arrow row now lives inside the summary card. Resolve old
  // paths in place, without rewriting the user's saved spacing configuration.
  const path = rule.scope === 'page:today' && rule.path[0]?.tag === 'div' && rule.path[0]?.index === 1 && !rule.path[0]?.id
    ? [{tag: 'section', index: 1}, {tag: 'div', index: 2}, ...rule.path.slice(1)] : rule.path
  const steps = path.map(step => ` > ${step.tag}${step.id ? `#${CSS.escape(step.id)}` : `:nth-of-type(${step.index})`}`)
  // Receipt buttons gained swipe wrappers. Resolve legacy per-row spacing paths
  // in place; keep saved/unsaved settings and their backups untouched.
  if (ledgerSpacingFamily(rule.scope) === 'food-price' && path[0]?.id === 'sheet-content' && path[1]?.tag === 'div' && path[1].index === 1 && path[2]?.tag === 'div' && path[2].index === 3 && path[3]?.tag === 'button' && !path[3].id) {
    steps[3] = ` > .price-receipt-row:nth-of-type(${path[3].index}) > button.price-receipt`
  }
  return root + steps.join('')
}
function applyPageSpacing(settings) {
  let style = document.querySelector('#page-spacing-style')
  if (!style) { style = document.createElement('style'); style.id = 'page-spacing-style'; document.head.append(style) }
  document.documentElement.style.setProperty('--web-safe-top', `${settings.safeTop}px`)
  // Important declarations in the first layer also override older component
  // !important margins; otherwise some page controls would remain uneditable.
  // Group defaults have zero specificity; an explicit single-component exception
  // wins regardless of path depth or the order of rules in an imported backup.
  style.textContent = `@layer user-spacing {${settings.rules.map(rule => `${rule.group || isSharedLedgerSpacing(rule.scope) ? `:where(${spacingSelector(rule)})` : spacingSelector(rule)}{${Object.entries(rule.values).map(([prop, value]) => `${prop}:${value}px!important`).join(';')}}`).join('\n')}}`
}
function markSpacingSurfaces() {
  document.querySelectorAll('.app-page[data-page]').forEach(node => { node.dataset.spacingScope = `page:${node.dataset.page}` })
  const editor = document.querySelector('#bottom-sheet')
  if (editor) {
    editor.dataset.spacingScope = `editor:${editor.dataset.editor || 'default'}`
    const family = ledgerSpacingFamily(editor.dataset.spacingScope)
    if (family) editor.dataset.spacingFamily = family
    else delete editor.dataset.spacingFamily
  }
  const sets = document.querySelector('#meal-set-page')
  if (sets) sets.dataset.spacingScope = `sets:${typeof mealSetPageMode === 'string' ? mealSetPageMode : 'page'}`
  const nav = document.querySelector('.bottom-nav'); if (nav) nav.dataset.spacingScope = 'navigation'
  const shell = document.querySelector('.app-shell'); if (shell) shell.dataset.spacingScope = 'shell'
  document.querySelectorAll('.action-dialog').forEach(node => { node.dataset.spacingScope = `dialog:${node.querySelector('h2,h3,strong')?.textContent.slice(0, 100) || 'dialog'}` })
}
function currentSpacingSurface() {
  return [...document.querySelectorAll('.action-dialog')].reverse().find(node => node.getClientRects().length)
    || [...document.querySelectorAll('#bottom-sheet,#meal-set-page')].find(node => !node.hidden && node.getAttribute('aria-hidden') !== 'true')
    || document.querySelector('.app-page.active')
}
function spacingPath(element, root) {
  const path = []
  for (let node = element; node && node !== root; node = node.parentElement) {
    path.unshift({tag: node.localName, id: node.id || undefined, index: [...node.parentElement.children].filter(sibling => sibling.localName === node.localName).indexOf(node) + 1})
  }
  return path
}
function spacingFamily(element) {
  const root = element?.closest('[data-spacing-scope]')
  if (!root) return null
  const ledgerFamily = ledgerSpacingFamily(root.dataset.spacingScope)
  const scope = ledgerFamily ? `editor-family:${ledgerFamily}` : root.dataset.spacingScope
  for (let node = element; node && node !== root; node = node.parentElement) {
    const group = Object.keys(spacingFamilies).find(key => node.matches(spacingFamilies[key].selector))
    if (group) return {scope, group, path: spacingPath(element, node).map(({tag, index}) => ({tag, index}))}
    // Unique named controls are not assumed to be interchangeable form fields.
    if (node.id) break
  }
  return ledgerFamily ? {scope, path: spacingPath(element, root)} : null
}
function openPageSpacingEditor() {
  if (document.querySelector('#layout-tuner')) return
  let draft = structuredClone(savedPageSpacing), selected = null, picking = false, surface = null, sameType = true
  const panel = document.createElement('aside'); panel.id = 'layout-tuner'; panel.setAttribute('aria-label', '当前页面边距编辑')
  panel.innerHTML = `<header><strong>实时边距 · px</strong><button type="button" data-layout-minimize aria-label="收起编辑面板">收起</button><button type="button" data-layout-close aria-label="关闭边距编辑">×</button></header>
    <div class="layout-body"><div class="layout-pick-tools"><button type="button" data-layout-pick>点选页面组件</button><button type="button" data-layout-parent>选父容器</button></div>
    <select data-layout-elements aria-label="当前页面全部组件"></select>
    <div class="layout-target-mode" role="group" aria-label="边距调整范围"><button type="button" data-layout-mode="group" aria-pressed="true">同类组件</button><button type="button" data-layout-mode="single" aria-pressed="false">仅此组件</button></div>
    <small class="layout-scope-note" data-layout-impact role="status"></small>
    <div class="layout-sliders"></div><label class="layout-safe-label">顶部避让<input data-layout-safe type="text" inputmode="numeric" aria-label="顶部安全留白" value="${draft.safeTop}"><span>px</span></label>
    <small class="layout-scope-note">系统安全区与此数值取较大值。未手动指定的间距随可用宽高调整。</small><small class="layout-scope-note" data-layout-viewport></small><footer><button type="button" data-layout-reset>还原本组件</button><button type="button" data-layout-export>导出</button><button type="button" data-layout-save>保存</button></footer>
    <div data-layout-unsaved hidden><p>保存本次边距调整？</p><button type="button" data-layout-keep>继续</button><button type="button" data-layout-discard>不保存</button><button type="button" data-layout-confirm>保存并关闭</button></div></div>`
  const outline = document.createElement('div'); outline.id = 'spacing-highlight'; outline.setAttribute('aria-hidden', 'true')
  document.body.append(panel, outline)
  const select = panel.querySelector('[data-layout-elements]'), controls = panel.querySelector('.layout-sliders')
  let elements = []
  const label = node => `${node.localName}${node.id ? ` #${node.id}` : node.classList.length ? ` .${node.classList[0]}` : ''} · ${(node.getAttribute('aria-label') || node.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24)}`
  const descriptor = () => {
    const root = selected?.closest('[data-spacing-scope]')
    return root ? sameType && spacingFamily(selected) || {scope: root.dataset.spacingScope, path: spacingPath(selected, root)} : null
  }
  const ruleFor = descriptor => draft.rules.find(rule => spacingSelector(rule) === spacingSelector(descriptor))
  const affected = () => {
    const desc = descriptor()
    return desc?.group || desc && isSharedLedgerSpacing(desc.scope) ? [...document.querySelectorAll(spacingSelector(desc))] : selected ? [selected] : []
  }
  const updateImpact = () => {
    const family = spacingFamily(selected), grouped = sameType && !!family, peers = affected()
    panel.querySelector('[data-layout-mode="group"]').disabled = !family
    panel.querySelectorAll('[data-layout-mode]').forEach(button => button.setAttribute('aria-pressed', String((button.dataset.layoutMode === 'group') === grouped)))
    const shared = family && isSharedLedgerSpacing(family.scope)
    const impact = grouped
      ? shared ? `${family.group ? spacingFamilies[family.group].name : '同位置组件'} · 所有${ledgerSpacingFamily(family.scope) === 'food-price' ? '食物价格与采购页' : '食物、周期的采购编辑页'}一起调整；当前页 ${peers.length} 个。`
      : `${spacingFamilies[family.group].name}${family.path.length ? '内同位置组件' : ''} · 当前页 ${peers.length} 个一起调整；新增同类也沿用。单项例外仅在调整对应间距时统一。`
      : `仅调整当前组件${family ? '；可切换为同类一起调整' : '（独立组件）'}。收起面板可切页。`
    const note = panel.querySelector('[data-layout-impact]')
    if (note.textContent !== impact) note.textContent = impact
    panel.querySelector('[data-layout-reset]').textContent = grouped ? '还原同类' : '还原本组件'
    return peers
  }
  const highlight = () => {
    const shell = document.querySelector('.app-shell').getBoundingClientRect()
    panel.querySelector('[data-layout-viewport]').textContent = `逻辑视口 ${window.innerWidth} × ${window.innerHeight} CSS px · 内容 ${Math.round(shell.width)} × ${Math.round(shell.height)} · DPR ${window.devicePixelRatio} · 缩放 ${window.visualViewport?.scale || 1}`
    outline.hidden = !selected?.isConnected || panel.classList.contains('minimized') || picking
    const peers = updateImpact()
    outline.replaceChildren()
    if (outline.hidden) return
    const rect = selected.getBoundingClientRect()
    Object.assign(outline.style, {left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`})
    for (const peer of peers) {
      if (peer === selected || !peer.getClientRects().length) continue
      const box = peer.getBoundingClientRect()
      if (box.bottom < 0 || box.top > innerHeight || box.right < 0 || box.left > innerWidth) continue
      const mark = document.createElement('div'); mark.className = 'spacing-peer-highlight'
      Object.assign(mark.style, {left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px`})
      outline.append(mark)
    }
  }
  const drawControls = () => {
    const desc = descriptor(); if (!desc) { controls.replaceChildren(); return }
    const computed = getComputedStyle(selected), peers = affected(), styles = peers.map(node => getComputedStyle(node))
    controls.innerHTML = spacingProps.map((prop, i) => {
      const number = parseFloat(computed.getPropertyValue(prop)) || 0
      const mixed = styles.some(style => style.getPropertyValue(prop) !== computed.getPropertyValue(prop))
      return `<label><span>${spacingNames[i]}</span><input type="range" min="${prop.startsWith('margin') ? -64 : 0}" max="160" value="${number}" data-layout-prop="${prop}" aria-label="${spacingNames[i]}"><input type="text" inputmode="decimal" value="${mixed ? '' : number}" placeholder="不同" title="${mixed ? '当前同类值不同，输入后统一' : spacingNames[i]}" data-layout-value="${prop}" aria-label="${spacingNames[i]}精确值"></label>`
    }).join('')
    panel.querySelector('[data-layout-parent]').disabled = selected === selected.closest('[data-spacing-scope]')
    highlight()
  }
  const choose = element => {
    selected = element; sameType = true; select.value = String(elements.indexOf(element))
    if (element !== element.closest('[data-spacing-scope]')) element.scrollIntoView({block: 'nearest', inline: 'nearest', behavior: 'instant'})
    drawControls()
  }
  const refresh = () => {
    markSpacingSurfaces()
    const root = currentSpacingSurface(); if (!root) return
    const changed = surface !== root || panel.dataset.scope !== root.dataset.spacingScope
    surface = root; panel.dataset.scope = root.dataset.spacingScope
    elements = [root, ...root.querySelectorAll('*')].filter(node => node instanceof HTMLElement && !node.matches('script,style,option,input[type="hidden"]') && node.getClientRects().length && getComputedStyle(node).display !== 'none')
    select.replaceChildren(...elements.map((node, i) => new Option(label(node), String(i))))
    if (changed || !elements.includes(selected)) choose(root)
    else { select.value = String(elements.indexOf(selected)); highlight() }
  }
  const stopPick = () => { picking = false; panel.classList.remove('picking'); panel.querySelector('[data-layout-pick]').textContent = '点选页面组件'; highlight() }
  const cleanup = () => {
    observer.disconnect(); clearTimeout(refreshTimer)
    document.removeEventListener('pointerdown', blockPick, true); document.removeEventListener('click', pick, true)
    document.removeEventListener('keydown', keydown, true); document.removeEventListener('scroll', highlight, true); window.removeEventListener('resize', highlight)
    panel.remove(); outline.remove()
  }
  const save = () => {
    try { localStorage.setItem(pageSpacingKey, JSON.stringify(draft)); savedPageSpacing = structuredClone(draft); panel.querySelector('[data-layout-unsaved]').hidden = true; showToast('当前页面边距已保存'); return true }
    catch { showToast('保存失败，调整仍保留在预览中'); return false }
  }
  const blockPick = event => {
    if (picking && !panel.contains(event.target)) { event.preventDefault(); event.stopImmediatePropagation() }
  }
  const pick = event => {
    if (!picking || panel.contains(event.target)) return
    event.preventDefault(); event.stopImmediatePropagation()
    const element = event.target instanceof HTMLElement ? event.target : event.target.closest('svg')?.parentElement
    if (!element?.closest('[data-spacing-scope]')) return
    if (!elements.includes(element)) { elements.push(element); select.add(new Option(label(element), String(elements.length - 1))) }
    stopPick(); choose(element)
  }
  const keydown = event => { if (event.key === 'Escape' && picking) { event.stopImmediatePropagation(); stopPick() } }
  panel.querySelector('[data-layout-pick]').onclick = () => {
    picking = !picking; panel.classList.toggle('picking', picking)
    panel.querySelector('[data-layout-pick]').textContent = picking ? '取消点选（或 Esc）' : '点选页面组件'; highlight()
  }
  panel.querySelector('[data-layout-minimize]').onclick = event => {
    stopPick(); const minimized = panel.classList.toggle('minimized'); event.target.textContent = minimized ? '展开' : '收起'; highlight()
  }
  panel.querySelector('[data-layout-parent]').onclick = () => { if (selected?.parentElement && selected !== selected.closest('[data-spacing-scope]')) choose(selected.parentElement) }
  select.onchange = () => choose(elements[Number(select.value)])
  panel.querySelectorAll('[data-layout-mode]').forEach(button => { button.onclick = () => { sameType = button.dataset.layoutMode === 'group'; drawControls() } })
  controls.oninput = event => {
    const prop = event.target.dataset.layoutProp || event.target.dataset.layoutValue
    if (!spacingProps.includes(prop) || event.target.value.trim() === '') return
    const value = Number(event.target.value), desc = descriptor()
    if (!desc || !Number.isFinite(value) || value < (prop.startsWith('margin') ? -64 : 0) || value > 320) return
    if (!ruleFor(desc) && draft.rules.length >= 2000) { showToast('边距配置已达2000项，请先还原不需要的组件'); return }
    if (desc.group || isSharedLedgerSpacing(desc.scope)) {
      // A deliberate group edit unifies this property only, keeping unrelated
      // per-instance spacing. Merely selecting the group never changes saved values.
      const peers = new Set(affected())
      for (const item of draft.rules) {
        // Inspect another instance against the current template without opening it.
        // This unifies the edited property even on currently unmounted food pages.
        const shared = isSharedLedgerSpacing(desc.scope) && ledgerSpacingFamily(item.scope) === ledgerSpacingFamily(desc.scope)
        const target = shared ? {...item, scope: desc.scope} : item
        if (spacingSelector(item) !== spacingSelector(desc) && (shared || !item.group && item.scope === desc.scope) && [...document.querySelectorAll(spacingSelector(target))].some(node => peers.has(node))) delete item.values[prop]
      }
      draft.rules = draft.rules.filter(item => Object.keys(item.values).length)
    }
    let rule = ruleFor(desc); if (!rule) { rule = {...desc, values: {}}; draft.rules.push(rule) }
    rule.values[prop] = value
    controls.querySelectorAll(`[data-layout-prop="${prop}"],[data-layout-value="${prop}"]`).forEach(input => { if (input !== event.target) input.value = value; input.removeAttribute('placeholder'); input.removeAttribute('title') })
    applyPageSpacing(draft); highlight()
  }
  panel.querySelector('[data-layout-safe]').oninput = event => {
    const value = Number(event.target.value)
    if (event.target.value !== '' && Number.isFinite(value) && value >= 0 && value <= 96) { draft.safeTop = value; applyPageSpacing(draft); highlight() }
  }
  panel.querySelector('[data-layout-reset]').onclick = () => {
    const desc = descriptor(); if (!desc) return
    const rule = ruleFor(desc); draft.rules = draft.rules.filter(item => item !== rule)
    applyPageSpacing(draft); drawControls(); showToast(desc.group || isSharedLedgerSpacing(desc.scope) ? '已移除同类边距；单项例外与默认边距保留' : '已移除此组件边距；同类设置与默认边距保留')
  }
  panel.querySelector('[data-layout-save]').onclick = save
  panel.querySelector('[data-layout-close]').onclick = () => {
    stopPick(); panel.classList.remove('minimized')
    panel.querySelector('[data-layout-minimize]').textContent = '收起'
    if (JSON.stringify(draft) === JSON.stringify(savedPageSpacing)) cleanup()
    else panel.querySelector('[data-layout-unsaved]').hidden = false
  }
  panel.querySelector('[data-layout-keep]').onclick = () => { panel.querySelector('[data-layout-unsaved]').hidden = true }
  panel.querySelector('[data-layout-discard]').onclick = () => { applyPageSpacing(savedPageSpacing); cleanup() }
  panel.querySelector('[data-layout-confirm]').onclick = () => { if (save()) cleanup() }
  panel.querySelector('[data-layout-export]').onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({pageSpacing: draft, legacySpacing: savedLayout}, null, 2)], {type: 'application/json'}))
    const link = document.createElement('a'); link.href = url; link.download = '食由己-网页边距.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  let refreshTimer
  const observer = new MutationObserver(records => {
    if (!records.some(record => !panel.contains(record.target) && !outline.contains(record.target))) return
    clearTimeout(refreshTimer); refreshTimer = setTimeout(refresh, 100)
  })
  observer.observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['hidden', 'data-editor', 'aria-hidden']})
  document.addEventListener('pointerdown', blockPick, true); document.addEventListener('click', pick, true)
  document.addEventListener('keydown', keydown, true); document.addEventListener('scroll', highlight, true); window.addEventListener('resize', highlight)
  refresh()
}
// Keep packaged defaults beneath user edits so reset returns to this release's
// baseline. Existing device overrides and local storage remain untouched.
if(typeof bundledSpacingDefaults==='object'){
  const defaults=normalizeSpacingBackup(bundledSpacingDefaults),style=document.createElement('style');style.id='bundled-spacing-style'
  style.textContent=`@layer default-spacing {${defaults.pageSpacing.rules.map(rule=>`${rule.group||isSharedLedgerSpacing(rule.scope)?`:where(${spacingSelector(rule)})`:spacingSelector(rule)}{${Object.entries(rule.values).map(([prop,value])=>`${prop}:${value}px!important`).join(';')}}`).join('\n')}}\n@layer default-legacy-spacing {${Object.entries(layoutTargets).map(([key,[,selector]])=>`${selector}{${Object.entries(defaults.legacySpacing[key]||{}).map(([prop,value])=>`${prop}:${value}px!important`).join(';')}}`).join('\n')}}`
  document.head.append(style)
}
applyPageSpacing(savedPageSpacing)
document.addEventListener('DOMContentLoaded', () => {
  markSpacingSurfaces()
  document.querySelector('#layout-tuner-open').onclick = openLayoutTuner
  // Apply stored page rules to newly opened editors even when the panel is closed.
  new MutationObserver(markSpacingSurfaces).observe(document.body, {childList: true, subtree: true, attributes: true, attributeFilter: ['data-editor']})
})
