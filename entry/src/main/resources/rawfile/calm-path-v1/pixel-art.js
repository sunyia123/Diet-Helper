// Fixed, versioned palette: saved pixels never depend on the application theme.
const PixelArt = (() => {
  const palette = Object.freeze(['transparent', '#263238', '#52606a', '#89979c', '#c7cecf', '#f8f4e8', '#ffffff', '#563f35', '#85604a', '#b1845b', '#d7b17c', '#edcfa0', '#f2dea9', '#b79543', '#d0ae52', '#e8c46b', '#7d383e', '#ad5054', '#d67c77', '#edaaa0', '#a65e3d', '#cd8655', '#edb47d', '#324f40', '#50734e', '#789258', '#a6b778', '#315964', '#52818b', '#8db3b8', '#514964', '#81738d', '#b6a6b7'])
  const names = ['透明', '墨黑', '石灰', '雾灰', '浅灰', '米白', '白色', '深棕', '栗棕', '麦棕', '浅棕', '杏色', '奶油', '芥末', '麦黄', '淡黄', '酒红', '砖红', '珊瑚', '浅粉', '陶土', '橙棕', '蜜桃', '墨绿', '苔绿', '草绿', '嫩绿', '深蓝', '灰蓝', '浅蓝', '深紫', '灰紫', '浅紫']
  const alphabet = '.0123456789abcdefghijklmnopqrstuv'
  const paletteId = 'shiyouji32-v1'
  const cache = new Map()
  function normalize(value) {
    if (!value || value.version !== 1 || value.palette !== paletteId || ![32, 64].includes(value.size) || typeof value.pixels !== 'string' || value.pixels.length !== value.size ** 2 || [...value.pixels].some(c => !alphabet.includes(c))) return null
    return { version: 1, palette: paletteId, size: value.size, pixels: value.pixels }
  }
  const blank = (size = 32) => ({ version: 1, palette: paletteId, size: size === 64 ? 64 : 32, pixels: '.'.repeat((size === 64 ? 64 : 32) ** 2) })
  function resize(value, size) {
    const art = normalize(value)
    if (!art || ![32, 64].includes(size)) return null
    return { ...art, size, pixels: Array.from({ length: size ** 2 }, (_, i) => art.pixels[Math.floor(Math.floor(i / size) * art.size / size) * art.size + Math.floor(i % size * art.size / size)]).join('') }
  }
  function line(pixels, size, from, to, color) {
    let [x, y] = from
    const [x2, y2] = to, dx = Math.abs(x2 - x), dy = -Math.abs(y2 - y), sx = x < x2 ? 1 : -1, sy = y < y2 ? 1 : -1
    let error = dx + dy
    while (true) {
      if (x >= 0 && y >= 0 && x < size && y < size) pixels[y * size + x] = color
      if (x === x2 && y === y2) break
      const twice = error * 2
      if (twice >= dy) { error += dy; x += sx }
      if (twice <= dx) { error += dx; y += sy }
    }
  }
  function fill(pixels, size, start, color) {
    const old = pixels[start]
    if (old === color) return
    const pending = [start]
    pixels[start] = color
    while (pending.length) {
      const i = pending.pop(), x = i % size
      for (const next of [x > 0 ? i - 1 : -1, x < size - 1 ? i + 1 : -1, i - size, i + size]) {
        if (next >= 0 && next < pixels.length && pixels[next] === old) { pixels[next] = color; pending.push(next) }
      }
    }
  }
  function image(value) {
    const art = normalize(value)
    if (!art) return ''
    const key = `${art.size}:${art.pixels}`
    if (cache.has(key)) return cache.get(key)
    const paths = palette.map(() => '')
    for (let y = 0; y < art.size; y++) for (let x = 0; x < art.size;) {
      const char = art.pixels[y * art.size + x], start = x
      while (x < art.size && art.pixels[y * art.size + x] === char) x++
      if (char !== '.') paths[alphabet.indexOf(char)] += `M${start} ${y}h${x - start}v1h-${x - start}z`
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.size} ${art.size}" shape-rendering="crispEdges">${paths.map((d, i) => d ? `<path fill="${palette[i]}" d="${d}"/>` : '').join('')}</svg>`
    const uri = `data:image/svg+xml,${encodeURIComponent(svg)}`
    if (cache.size >= 100) cache.delete(cache.keys().next().value)
    cache.set(key, uri)
    return uri
  }
  return Object.freeze({ palette, names: Object.freeze(names), alphabet, normalize, blank, resize, line, fill, image })
})()

function openPixelArtEditor(initial, onSave) {
  beginEditorPage('pixel-art')
  sheetKicker.textContent = 'PIXEL STUDIO'
  sheetTitle.textContent = '像素手绘'
  let art = PixelArt.resize(PixelArt.normalize(initial) || PixelArt.blank(), 32), pixels = [...art.pixels], color = 24, tool = 'pen'
  let stroke = null, pointer = null, cursor = [0, 0], clearArmed = false
  const undo = [], redo = []
  const snapshot = () => ({ ...art, pixels: pixels.join('') })
  sheetContent.innerHTML = `<div class="pixel-studio">
    <div class="pixel-tools" role="group" aria-label="绘图工具">${[['pen','画笔','brush'],['eraser','橡皮','eraser'],['fill','填充','fill'],['pick','吸色','pick']].map(([id,name,icon]) => `<button type="button" data-pixel-tool="${id}" aria-label="${name}" title="${name}">${pixelToolSvg(icon)}</button>`).join('')}<button type="button" data-pixel-undo aria-label="撤销" title="撤销">${pixelToolSvg('undo')}</button><button type="button" data-pixel-redo aria-label="重做" title="重做">${pixelToolSvg('redo')}</button><button type="button" data-pixel-clear aria-label="清空" title="清空">${pixelToolSvg('trash')}</button></div>
    <canvas class="pixel-canvas" width="512" height="512" tabindex="0" role="img" aria-label="像素画布，可拖动绘制；键盘方向键移动，空格绘制"></canvas>
    <div class="pixel-palette" role="group" aria-label="固定 32 色色板">${PixelArt.palette.slice(1).map((hex, i) => `<button type="button" data-pixel-color="${i + 1}" style="--swatch:${hex}" aria-label="${PixelArt.names[i + 1]}" title="${PixelArt.names[i + 1]}"><span aria-hidden="true"></span></button>`).join('')}</div>
  </div>`
  const root = sheetContent.querySelector('.pixel-studio'), canvas = root.querySelector('.pixel-canvas')
  const saveButton = document.querySelector('#pixel-header-save')
  function render() {
    canvas.dataset.draftPixels = pixels.join('')
    for (const target of [canvas]) {
      const ctx = target.getContext('2d'), scale = target.width / art.size
      ctx.clearRect(0, 0, target.width, target.height)
      ctx.imageSmoothingEnabled = false
      pixels.forEach((char, i) => { if (char !== '.') { ctx.fillStyle = PixelArt.palette[PixelArt.alphabet.indexOf(char)]; ctx.fillRect(i % art.size * scale, Math.floor(i / art.size) * scale, scale, scale) } })
      if (target === canvas) {
        ctx.strokeStyle = '#52606a28'; ctx.lineWidth = 0.5; ctx.beginPath()
        for (let n = 0; n <= art.size; n++) { ctx.moveTo(n * scale, 0); ctx.lineTo(n * scale, 512); ctx.moveTo(0, n * scale); ctx.lineTo(512, n * scale) }
        ctx.stroke()
        if (document.activeElement === canvas && pointer === null) { ctx.strokeStyle = '#263238'; ctx.lineWidth = 2; ctx.strokeRect(cursor[0] * scale, cursor[1] * scale, scale, scale) }
      }
    }
    root.querySelectorAll('[data-pixel-color]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.pixelColor) === color)))
    root.querySelectorAll('[data-pixel-tool]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pixelTool === tool)))
    root.querySelector('[data-pixel-undo]').disabled = !undo.length
    root.querySelector('[data-pixel-redo]').disabled = !redo.length
    saveButton.disabled = pixels.every(c => c === '.')
  }
  function commit(before) {
    if (before.size === art.size && before.pixels === pixels.join('')) return
    undo.push(before); if (undo.length > 40) undo.shift(); redo.length = 0
  }
  function restore(value) { art = value; pixels = [...value.pixels]; cursor = cursor.map(n => Math.min(n, art.size - 1)); render() }
  function point(event) {
    const box = canvas.getBoundingClientRect()
    return [event.clientX - box.left, event.clientY - box.top].map((n, i) => Math.max(0, Math.min(art.size - 1, Math.floor(n / (i ? box.height : box.width) * art.size))))
  }
  function paint(position, previous = position) {
    cursor = position
    const char = tool === 'eraser' ? '.' : PixelArt.alphabet[color]
    if (tool === 'pick') { const found = PixelArt.alphabet.indexOf(pixels[position[1] * art.size + position[0]]); if (found > 0) { color = found; tool = 'pen' } }
    else if (tool === 'fill') PixelArt.fill(pixels, art.size, position[1] * art.size + position[0], char)
    else PixelArt.line(pixels, art.size, previous, position, char)
    render()
  }
  canvas.addEventListener('pointerdown', event => {
    if (pointer !== null || event.button > 0) return
    event.preventDefault(); canvas.focus({ preventScroll: true }); pointer = event.pointerId
    canvas.setPointerCapture(pointer); stroke = snapshot(); paint(point(event))
  })
  canvas.addEventListener('pointermove', event => { if (event.pointerId === pointer && ['pen','eraser'].includes(tool)) paint(point(event), cursor) })
  const finish = event => { if (event.pointerId !== pointer) return; pointer = null; if (stroke) commit(stroke); stroke = null; render() }
  canvas.addEventListener('pointerup', finish); canvas.addEventListener('pointercancel', finish); canvas.addEventListener('lostpointercapture', finish)
  canvas.addEventListener('keydown', event => {
    const move = { ArrowLeft: [-1,0], ArrowRight: [1,0], ArrowUp: [0,-1], ArrowDown: [0,1] }[event.key]
    if (move) { event.preventDefault(); cursor = cursor.map((n,i) => Math.max(0, Math.min(art.size - 1, n + move[i]))); render() }
    if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); const before = snapshot(); paint(cursor); commit(before); render() }
  })
  root.querySelectorAll('[data-pixel-tool]').forEach(b => b.onclick = () => { tool = b.dataset.pixelTool; render() })
  root.querySelectorAll('[data-pixel-color]').forEach(b => b.onclick = () => { color = Number(b.dataset.pixelColor); if (tool === 'eraser' || tool === 'pick') tool = 'pen'; render() })
  root.querySelector('[data-pixel-undo]').onclick = () => { if (undo.length) { redo.push(snapshot()); restore(undo.pop()) } }
  root.querySelector('[data-pixel-redo]').onclick = () => { if (redo.length) { undo.push(snapshot()); restore(redo.pop()) } }
  root.querySelector('[data-pixel-clear]').onclick = event => {
    if (!clearArmed) { clearArmed = true; event.currentTarget.setAttribute('aria-label', '再次点击确认清空'); event.currentTarget.innerHTML = pixelToolSvg('check'); return }
    const before = snapshot(); pixels.fill('.'); commit(before); clearArmed = false; event.currentTarget.setAttribute('aria-label', '清空'); event.currentTarget.innerHTML = pixelToolSvg('trash'); render()
  }
  saveButton.onclick = () => { if (pixels.every(c => c === '.')) return; const value = snapshot(); closeSheet(); onSave(value) }
  render(); openSheet()
}
