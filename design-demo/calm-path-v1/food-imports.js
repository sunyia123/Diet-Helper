// Local, deterministic imports. Recognition only creates a draft; it never saves food.
function ingredientNameKey(name) {
  return normalizeFoodSearch(String(name).replace(/[（(]\s*[生熟]\s*[）)]/g, '').replace(/\s+[生熟]$/, ''))
}

function ingredientCandidates(name, library) {
  const explicitCooked = /[（(]熟[）)]|^熟|\s熟$/.test(name)
  const query = ingredientNameKey(name).replace(/^[生熟](?=鸡|牛|猪|鸭|鱼|米|土豆|红薯)/, '')
  if (!query) return []
  return library.map((food) => {
    const cooked = /[（(]熟[）)]/.test(food.name)
    if ((!explicitCooked && cooked) || (explicitCooked && !cooked)) return null
    const key = ingredientNameKey(food.name)
    const aliases = String(food.keywords || '').split(/[\s,，、;；/]+/).filter(Boolean).map(ingredientNameKey)
    const pinyin = foodNamePinyin(key)
    let score = key === query ? 100 : aliases.includes(query) ? 90 : /^[a-z]+$/.test(query) && [pinyin.full, pinyin.initials].includes(query) ? 85 : 0
    if (!score && (key.includes(query) || aliases.some((alias) => alias.includes(query)))) score = 40
    if (!score) return null
    return { food, score }
  }).filter(Boolean).sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name, 'zh-CN'))
}

function recipeQuantityRow(name, numericText, unit, text, library) {
  const candidates = ingredientCandidates(name, library)
  const automatic = candidates[0]?.score >= 85 && candidates[0].score > (candidates[1]?.score || 0)
  const food = automatic ? candidates[0].food : null
  const count = numericText === '半' ? .5 : Number(numericText)
  const massFactor = { g: 1, 克: 1, kg: 1000, 千克: 1000, 公斤: 1000, 斤: 500, 两: 50 }[unit]
  const countFactor = food?.unitGrams > 0 && (unit === food.unitLabel || ['个', '颗', '只'].includes(unit) && food.unitLabel === '个') ? food.unitGrams : null
  const factor = massFactor || countFactor
  const grams = numericText !== undefined && factor && !/[-−+]/.test(name) ? Math.round(count * factor * 10) / 10 : null
  const amount = grams > 0 && grams <= 3000 ? grams : null
  const issue = numericText === undefined ? '请确认输入顺序并补充克重' : !factor ? `${unit}不能直接换算克重，请补充 g` : amount === null ? '克重须为 0.1–3000 g' : !massFactor ? `按食物库每${food.unitLabel}${food.unitGrams}g估算为${amount}g，请核对实际重量` : ''
  return { text, name, amount, foodId: food?.id || '', candidates: candidates.map((item) => item.food), issue }
}

function parseRecipeSteps(text, library) {
  const source = text.normalize('NFKC')
  const quantity = '(\\d+(?:\\.\\d+)?|半)\\s*(千克|公斤|kg|克|g|斤|两|毫升|ml|个|颗|只|勺|汤匙|茶匙)'
  const names = '[\\p{Script=Han}a-zA-Z（()）]{1,40}'
  const actions = /(?:搅拌|混合|继续|静置|醒发|倒入|加入|放入|切成|切块|切片|切碎|打散|拌匀|蒸制|煮熟|洗净|沥干|揉成|盖上|翻炒|煎至|炒至|备用)/
  const cleanBefore = (name) => name.split(actions).at(-1).replace(/^(?:然后|再|先|将|把|取|用|和|与|及)+/, '')
  const cleanAfter = (name) => name.split(actions)[0].replace(/^(?:的|和|与|及)+/, '')
  const rows = []
  const used = new Set()
  for (const match of source.matchAll(new RegExp(`(${names})\\s*${quantity}`, 'giu'))) {
    const name = cleanBefore(match[1])
    if (!name || /(?:分钟|小时|容器|模具|体积|温度)$/.test(name)) continue
    const quantityAt = match.index + match[0].indexOf(match[2], match[1].length)
    rows.push({ index: quantityAt, row: recipeQuantityRow(name, match[2], match[3].toLowerCase(), `${name}${match[2]}${match[3]}`, library) })
    used.add(quantityAt)
  }
  for (const match of source.matchAll(new RegExp(`${quantity}\\s*(${names})`, 'giu'))) {
    if (used.has(match.index) || /[-−+\d.]/.test(source[match.index - 1] || '')) continue
    const name = cleanAfter(match[3])
    if (!name || /^(?:容器|模具|体积|步骤|小时|分钟)/.test(name)) continue
    rows.push({ index: match.index, row: recipeQuantityRow(name, match[1], match[2].toLowerCase(), `${match[1]}${match[2]}${name}`, library) })
  }
  if (!rows.length || rows.length > 100) return { error: '未找到带数量的食材，请补充食材和克重（例如：加入200g番茄）' }
  return { rows: rows.sort((a, b) => a.index - b.index).map((item) => item.row), notes: text.slice(0, 2000), fromSteps: true }
}

function recipeImportPrompt() {
  return `将下面的文字转换为食材与烹饪步骤，并单独列出辅料。
只输出以下纯文本格式，不使用表格或代码块，不添加解释。用实际内容替换方括号占位符：

食材：
[食材名称（生／熟状态）] [数字]g
[其他计营养食材名称] [数字]g
辅料：
[不计营养的辅料名称] [数字][单位，如g、ml、片、颗]
烹饪步骤：
1. [第一步的操作、火候和时间]
2. [后续步骤]

要求：
每项单独一行，名称在前、数量在后。食材包括油、糖、淀粉等需要计入营养的用料；辅料用于水、盐、香料等不计营养的备料，仍需保留数量和单位。没有辅料时写“无”。
只整理原文信息，不编造用量、营养值或生熟状态；缺少数量写“待补”，不要把“适量”猜成具体克重。不能确定克重的个数、勺数保留原单位，交由用户核对。
食材清单列出全配方总用量，不要因步骤重复提及而重复累计；步骤仍完整保留。

下面是需要转换的原文：
[请在这里粘贴菜谱、食材清单或烹饪描述]`
}

function parseRecipePreparation(text) {
  const lines=text.normalize('NFKC').split(/[,，、;；\n。]+/).map(line=>line.trim().replace(/^(?:[-*•]\s+|\d+[.)、]\s*)/,'')).filter(line=>line&&!/^(?:无|暂无|无辅料)$/.test(line))
  if(lines.length>30)return {error:'辅料最多 30 项'}
  return {preparation:lines.map(line=>{
    const match=line.match(/^(.+?)\s*[:：]?\s*(\d+(?:\.\d+)?|半)\s*([a-zA-Z\p{Script=Han}]{1,4})?$/u)
    const name=(match?match[1]:line.replace(/(?:适量|少许|待补)$/,'')).trim()
    const amount=match?match[2]==='半'?.5:Number(match[2]):null
    return {name,amount:amount>0&&amount<=30000&&!/[-−+]$/.test(name)?amount:null,unit:match?.[3]||'g'}
  })}
}

function splitRecipeImportSections(text) {
  const sections={ingredients:[],preparation:[],notes:[]};let section='ingredients',found=false
  for(const raw of text.split(/\r?\n/)){
    const line=raw.replace(/^\s*#{1,6}\s*/,'').replace(/\*\*/g,'')
    const heading=line.match(/^\s*(食材|主料|材料|辅料|调料|烹饪步骤|制作步骤|做法|步骤)\s*(?:[:：]\s*(.*)|$)/)
    if(heading){found=true;section=/辅料|调料/.test(heading[1])?'preparation':/步骤|做法/.test(heading[1])?'notes':'ingredients';if(heading[2])sections[section].push(heading[2])}
    else sections[section].push(line)
  }
  return found?sections:null
}

function parseRecipeText(text, order, library) {
  if (typeof text !== 'string' || text.length > 5000) return { error: '文字最多 5000 字' }
  const sections=splitRecipeImportSections(text)
  if(sections && (sections.preparation.length || sections.ingredients.some(line=>line.trim()))){
    const ingredients=sections.ingredients.join('\n').trim()
    const parsed=ingredients?parseRecipeText(ingredients,order,library):{rows:[],notes:''}
    if(parsed.error)return parsed
    const extras=parseRecipePreparation(sections.preparation.join('\n'))
    if(extras.error)return extras
    if(!parsed.rows.length&&!extras.preparation.length)return {error:'请输入食材或辅料和用量'}
    return {...parsed,preparation:extras.preparation,notes:[parsed.notes,sections.notes.join('\n')].filter(Boolean).join('\n').slice(0,5000)}
  }
  if(sections?.notes.length)return parseRecipeSteps(text,library)
  const notesStart = text.search(/(?:做法|步骤)\s*[:：]/)
  const ingredientsText = (notesStart < 0 ? text : text.slice(0, notesStart)).normalize('NFKC').trim().replace(/^(?:食材|材料)\s*[:：]/, '')
  if (/搅拌|醒发|蒸制|加入|放入|倒入|切块|切片|^将|^把/.test(ingredientsText) || notesStart === 0) return parseRecipeSteps(text, library)
  const notes = notesStart < 0 ? '' : text.slice(notesStart).replace(/^(?:做法|步骤)\s*[:：]\s*/, '').slice(0, 2000)
  const segments = ingredientsText.split(/[,，、;；\n。]+/).map((line) => line.trim().replace(/^(?:[-*•]\s+|\d+[.)、]\s*)/, '')).filter(Boolean)
  if (!segments.length || segments.length > 100) return { error: '请输入 1–100 项食材，用逗号或换行分隔' }
  const quantity = '(\\d+(?:\\.\\d+)?|半)\\s*(千克|公斤|kg|克|g|斤|两|毫升|ml|个|颗|只|勺|汤匙|茶匙)?'
  const pattern = order === 'amount-first' ? new RegExp(`^${quantity}\\s*(.+)$`, 'i') : new RegExp(`^(.+?)\\s*${quantity}$`, 'i')
  const rows = segments.map((line) => {
    const match = line.match(pattern)
    const name = (match ? match[order === 'amount-first' ? 3 : 1] : line.replace(/(?:适量|少许|待补)$/, '')).trim()
    const numericText = match?.[order === 'amount-first' ? 1 : 2]
    const unit = (match?.[order === 'amount-first' ? 2 : 3] || 'g').toLowerCase()
    return recipeQuantityRow(name, numericText, unit, line, library)
  })
  return { rows, notes }
}

function initializeRecipeTextImport(host, onApply, excludedFoodId) {
  host.innerHTML = `<details class="local-import-panel"><summary>文字导入食材</summary>
    <p class="sheet-hint">支持食材清单或完整烹饪步骤。默认匹配生食材；熟食请注明“（熟）”。个数换算会标注估算克重。</p>
    <label class="form-field"><span>文字顺序</span><select id="recipe-text-order"><option value="food-first">食材在前</option><option value="amount-first">数字在前</option></select></label>
    <div class="form-field"><div class="recipe-import-heading"><label for="recipe-import-text">食材或烹饪步骤</label><button id="copy-recipe-prompt" type="button" aria-label="复制菜肴整理 Prompt" title="复制大模型 Prompt"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5H6v16h12V5h-3"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 11h6M9 15h6"/></svg></button></div><textarea id="recipe-import-text" rows="5" maxlength="5000" placeholder="食材：\n番茄200g，鸡蛋100g，食用油5g\n辅料：盐2g，水20ml\n烹饪步骤：先炒蛋，再放番茄…"></textarea></div>
    <button class="secondary-action" id="parse-recipe-text" type="button">匹配食材</button><p id="recipe-import-message" role="status"></p><div id="recipe-import-rows"></div><button class="secondary-action" id="apply-recipe-text" type="button" hidden>加入菜肴</button>
  </details>`
  const order = host.querySelector('#recipe-text-order')
  const text = host.querySelector('#recipe-import-text')
  const message = host.querySelector('#recipe-import-message')
  const rowsHost = host.querySelector('#recipe-import-rows')
  const apply = host.querySelector('#apply-recipe-text')
  host.querySelector('#copy-recipe-prompt').onclick=async()=>{
    const prompt=recipeImportPrompt()
    try { await copyBackupText(prompt);showToast('Prompt 已复制，请在末尾插入原文') }
    catch {
      const dialog=openActionDialog('复制整理 Prompt')
      dialog.content.innerHTML='<p class="sheet-hint">未能自动复制，请长按下方文字全选复制，再替换末尾的原文占位符。</p><textarea class="recipe-prompt-fallback" aria-label="菜肴整理 Prompt" rows="8" readonly></textarea>'
      dialog.content.querySelector('textarea').value=prompt
      dialog.content.querySelector('textarea').focus();dialog.content.querySelector('textarea').select()
    }
  }
  let parsed = null
  const invalidate = () => { parsed = null; rowsHost.replaceChildren(); apply.hidden = true; message.textContent = '' }
  order.addEventListener('change', () => {
    text.placeholder = order.value === 'amount-first' ? '200g番茄，100g鸡蛋，5g食用油\n做法：先炒蛋，再放番茄。' : '番茄200g，鸡蛋100g，食用油5g\n做法：先炒蛋，再放番茄。'
    invalidate()
  })
  text.addEventListener('input', invalidate)
  enhanceSlimeSelect(order)
  host.querySelector('#parse-recipe-text').addEventListener('click', () => {
    const library = selectableFoods().filter((food) => food.id !== excludedFoodId)
    parsed = parseRecipeText(text.value, order.value, library)
    if (parsed.error) { message.textContent = parsed.error; rowsHost.replaceChildren(); apply.hidden = true; return }
    rowsHost.innerHTML = parsed.rows.map((row, index) => `<div class="recipe-match-row"><strong>${escapeHtml(row.text)}</strong><label class="form-field"><span>对应食材</span><select data-import-food="${index}" aria-label="第${index + 1}项对应食材"><option value="">请选择食材</option>${[...row.candidates, ...library.filter((food) => !row.candidates.includes(food))].map((food) => `<option value="${escapeHtml(food.id)}" ${food.id === row.foodId ? 'selected' : ''}>${escapeHtml(food.name)}</option>`).join('')}</select></label><label class="form-field"><span>克重 g</span><input type="number" aria-label="第${index + 1}项克重" data-import-amount="${index}" data-unit="g" min="0.1" max="3000" step="0.1" value="${row.amount ?? ''}"></label><small>${escapeHtml(row.issue || (!row.foodId ? '有多个候选或未找到明确匹配，请选择' : '已匹配，可修改'))}</small></div>`).join('')
    rowsHost.querySelectorAll('[data-import-food]').forEach((select) => select.addEventListener('change', () => { parsed.rows[Number(select.dataset.importFood)].foodId = select.value }))
    rowsHost.querySelectorAll('[data-import-amount]').forEach((input) => input.addEventListener('change', () => { parsed.rows[Number(input.dataset.importAmount)].amount = Number(input.value) }))
    const preparation=parsed.preparation||[]
    if(preparation.length)rowsHost.insertAdjacentHTML('beforeend',`<h3 class="recipe-preparation-title">辅料 · 不计营养</h3>${preparation.map((row,index)=>`<div class="recipe-preparation-match"><input type="text" maxlength="40" data-import-preparation-name="${index}" aria-label="导入辅料${index+1}名称" value="${escapeHtml(row.name)}"><input type="number" min="0.1" max="30000" step="0.1" data-import-preparation-amount="${index}" aria-label="导入辅料${index+1}用量" value="${row.amount??''}"><input type="text" maxlength="4" data-import-preparation-unit="${index}" aria-label="导入辅料${index+1}单位" value="${escapeHtml(row.unit)}"></div>`).join('')}`)
    for(const field of ['name','amount','unit'])rowsHost.querySelectorAll(`[data-import-preparation-${field}]`).forEach(input=>{
      const update=()=>{preparation[Number(input.getAttribute(`data-import-preparation-${field}`))][field]=field==='amount'?Number(input.value):input.value.trim()}
      input.addEventListener('input',update);input.addEventListener('change',update)
    })
    enhanceEditorControls(rowsHost)
    message.textContent = `${parsed.fromSteps ? '已从做法中提取' : '共'} ${parsed.rows.length} 项食材${preparation.length?`、${preparation.length} 项辅料`:''}，请核对用量${parsed.notes ? '；烹饪步骤将保留为备注' : ''}`
    parsed.rows.forEach((row, index) => {
      if (row.foodId) return
      const select = rowsHost.querySelector(`[data-import-food="${index}"]`)
      const create = document.createElement('button')
      create.type = 'button'
      create.className = 'quick-create-food'
      create.textContent = `＋ 创建「${row.name}」`
      create.addEventListener('click', () => openFoodEditorSheet(null, row.name, (food) => {
        const option = document.createElement('option')
        option.value = food.id
        option.textContent = food.name
        select.append(option)
        select.value = food.id
        row.foodId = food.id
        create.remove()
      }))
      select.after(create)
    })
    apply.hidden = false
  })
  apply.addEventListener('click', () => {
    if (!parsed?.rows) return
    const ingredients = []
    for (const row of parsed.rows) {
      const food = selectableFoods().find((food) => food.id === row.foodId && food.id !== excludedFoodId)
      if (!food || !Number.isFinite(row.amount) || row.amount <= 0 || row.amount > 3000) { message.textContent = '请为每项选择食材，并填写有效克重'; return }
      const chosen=/熟|蒸|煮|烤/.test(row.name)?food:foodById(foodForState(food.id,'raw'))||food
      ingredients.push(dishIngredient(chosen, row.amount))
    }
    const preparation=parsed.preparation||[]
    if(preparation.some(row=>!row.name||row.name.length>40||!row.unit||row.unit.length>4||!Number.isFinite(row.amount)||row.amount<.1||row.amount>30000)){message.textContent='请补齐辅料名称、单位和 0.1–30000 的用量';return}
    if (onApply(ingredients, parsed.notes, preparation) === false) return
    invalidate()
    text.value = ''
    host.querySelector('details').open = false
    showToast(`已加入 ${ingredients.length} 项食材${preparation.length?`、${preparation.length} 项辅料`:''}`)
  })
}

function nutritionTextFromOCR(data) {
  const words = (data.blocks || []).flatMap((block) => (block.paragraphs || []).flatMap((paragraph) => (paragraph.lines || []).flatMap((line) => line.words || [])))
    .filter((word) => word.text?.trim() && word.bbox)
  if (!words.length) return data.text || ''
  const rows = []
  words.sort((a, b) => (a.bbox.y0 + a.bbox.y1) / 2 - (b.bbox.y0 + b.bbox.y1) / 2).forEach((word) => {
    const center = (word.bbox.y0 + word.bbox.y1) / 2
    const height = word.bbox.y1 - word.bbox.y0
    const row = rows.find((item) => Math.abs(item.center - center) < Math.max(5, Math.min(item.height, height) * .6))
    if (row) row.words.push(word)
    else rows.push({ center, height, words: [word] })
  })
  return rows.map((row) => row.words.sort((a, b) => a.bbox.x0 - b.bbox.x0).map((word) => word.text).join(' ')).join('\n')
}

function parseNutritionLabel(text) {
  const compact = String(text).normalize('NFKC').replace(/[ \t]/g, '').replace(/毫克/g, 'mg').replace(/干焦(?=\(kj\))/gi, '千焦').replace(/千焦/g, 'kJ').replace(/千卡|大卡/g, 'kcal').replace(/克/g, 'g')
  const per100g = /(?:每|\/)(?:100(?:\.0)?)(?:g|公g)/i.test(compact)
  const per100ml = /(?:每|\/)100(?:\.0)?(?:ml|毫升)/i.test(compact)
  const serving = compact.match(/每份[^\n\d]{0,8}(\d+(?:\.\d+)?)g/i)
  const perServing = /每份/.test(compact)
  const basis = Number(per100g) + Number(per100ml) + Number(perServing) !== 1 ? 'unknown' : per100g ? '100g' : per100ml ? '100ml' : 'serving'
  const fields = {}
  const labels = { calories: '能量|热量', carbs: '碳水化合物|碳水', protein: '蛋白质', fat: '脂肪' }
  for (const [key, label] of Object.entries(labels)) {
    const lines = compact.split(/\r?\n/).filter((line) => new RegExp(`^(?:${label})[:：]?`).test(line))
    let ambiguous = false
    const readings = lines.map((line) => {
      const tail = line.replace(new RegExp(`^(?:${label})[:：]?`), '')
      const values = [...tail.matchAll(/([<>≤≥]?)(\d+(?:\.\d+)?)\s*\(?(kcal|kj|mg|g)(?![a-z])/gi)]
      if (values.length > 1 || values.some((match) => match[1])) ambiguous = true
      if (values.length !== 1 || values[0][1] || values[0].index !== 0) return null
      const unit = values[0][3].toLowerCase()
      const number = Number(values[0][2])
      if (key === 'calories' && ['kj', 'kcal'].includes(unit)) return Math.round((unit === 'kj' ? number / 4.184 : number) * 10) / 10
      if (key !== 'calories' && ['mg', 'g'].includes(unit)) return Math.round(number * (unit === 'mg' ? .001 : 1) * 10) / 10
      return null
    }).filter((value) => value !== null)
    const distinct = [...new Set(readings)]
    const value = !ambiguous && distinct.length === 1 ? distinct[0] : null
    fields[key] = { value, source: lines.join('\n'), issue: ambiguous || distinct.length > 1 ? '图片中有不同数值或范围，请框选一张表或手动确认' : value === null ? '未能确定，请对照图片填写' : lines.length > 1 ? '图片含多张表，请确认采用的营养值' : '' }
  }
  return { basis, servingGrams: serving ? Number(serving[1]) : null, fields }
}

function normalizeLabelNutrition(values, basis, mass) {
  if (!['100g', 'serving', '100ml'].includes(basis)) return { error: '请选择包装上的标注方式' }
  const grams = basis === '100g' ? 100 : Number(mass)
  if (!Number.isFinite(grams) || grams <= 0 || grams > 10000) return { error: '请填写该份量实际对应的重量（g）' }
  const result = {}
  for (const key of ['calories', 'carbs', 'protein', 'fat']) {
    if (values[key] === '' || values[key] === null || values[key] === undefined || !Number.isFinite(Number(values[key])) || Number(values[key]) < 0) return { error: '请核对并补齐四项营养数值' }
    const value = Number(values[key]) * 100 / grams
    if (value > (key === 'calories' ? 5000 : 100)) return { error: '折算后的数值超出范围，请检查单位和份量' }
    result[key] = Math.round(value * 10) / 10
  }
  if (result.carbs + result.protein + result.fat > 100.5) return { error: '每100g的碳蛋脂总量超出100g，请核对' }
  return { values: result }
}

let localOcrLoader = null
function loadLocalOcr() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract)
  if (localOcrLoader) return localOcrLoader
  localOcrLoader = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'assets/ocr/tesseract.min.js'
    script.onload = () => resolve(window.Tesseract)
    script.onerror = () => { script.remove(); localOcrLoader = null; reject(new Error('识别组件加载失败，请重试')) }
    document.head.append(script)
  })
  return localOcrLoader
}

function initializeNutritionOCR(host, onApply) {
  host.innerHTML = `<details class="local-import-panel"><summary>识别营养成分表</summary><p class="sheet-hint">照片仅在本机识别。选择图片后，拖动框选营养表，确认数值再填入。</p>
    <div class="ocr-actions"><button type="button" class="secondary-action" data-ocr-pick>选择图片</button><button type="button" class="secondary-action" data-ocr-camera>拍照</button></div>
    <input type="file" accept="image/jpeg,image/png,image/webp" data-ocr-file hidden><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" data-ocr-camera-file hidden>
    <div class="ocr-image-editor" hidden><canvas aria-label="拖动框选营养成分表"></canvas><div class="ocr-actions"><button type="button" class="secondary-action" data-ocr-reset>使用整张</button><button type="button" class="secondary-action" data-ocr-rotate>旋转90°</button><button type="button" class="secondary-action" data-ocr-run>开始识别</button></div></div>
    <p data-ocr-status role="status"></p><div data-ocr-result></div></details>`
  const panel = host.querySelector('details')
  const canvas = host.querySelector('canvas')
  const status = host.querySelector('[data-ocr-status]')
  const resultHost = host.querySelector('[data-ocr-result]')
  const imageEditor = host.querySelector('.ocr-image-editor')
  const source = document.createElement('canvas')
  let crop = null
  let start = null
  let worker = null
  let busy = false
  let operation = 0
  const setBusy = (value) => { busy = value; [host,imageEditor].forEach(root=>root.querySelectorAll('button').forEach(button=>{button.disabled=value})) }
  const draw = () => {
    const ctx = canvas.getContext('2d')
    ctx.drawImage(source, 0, 0)
    if (crop) {
      ctx.strokeStyle = '#3a6351'; ctx.lineWidth = Math.max(3, canvas.width / 150); ctx.setLineDash([14, 8])
      ctx.strokeRect(crop.x, crop.y, crop.width, crop.height)
    }
  }
  const fullImage = () => { crop = { x: 0, y: 0, width: canvas.width, height: canvas.height }; draw() }
  const readImage = async (file) => {
    if (!file || busy) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name) || file.size > 12 * 1024 * 1024) { status.textContent = '请选择12MB以内的 JPG、PNG 或 WebP 图片'; return }
    const current = ++operation
    try {
      const bitmap = await createImageBitmap(file)
      if (current !== operation || !host.isConnected) { bitmap.close(); return }
      if (bitmap.width * bitmap.height > 40000000) { bitmap.close(); throw new Error('图片尺寸过大，请先裁剪') }
      const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height))
      source.width = canvas.width = Math.round(bitmap.width * scale)
      source.height = canvas.height = Math.round(bitmap.height * scale)
      source.getContext('2d').drawImage(bitmap, 0, 0, source.width, source.height)
      bitmap.close()
      fullImage(); imageEditor.hidden = false; resultHost.replaceChildren(); status.textContent = '拖动框选营养表，然后确认裁剪并识别'
      beginEditorPage('nutrition-photo')
      sheetTitle.textContent='裁剪营养成分表';sheetKicker.textContent=''
      sheetContent.replaceChildren(imageEditor,status,resultHost)
      imageEditor.querySelector('[data-ocr-run]').textContent='确认裁剪并识别'
      openSheet()
    } catch (error) { if (current === operation) status.textContent = error.message || '图片无法读取，请换一张图片' }
  }
  for (const [button, field] of [['[data-ocr-pick]', '[data-ocr-file]'], ['[data-ocr-camera]', '[data-ocr-camera-file]']]) {
    const input = host.querySelector(field)
    host.querySelector(button).addEventListener('click', () => { input.value = ''; input.click() })
    input.addEventListener('change', () => readImage(input.files?.[0]))
  }
  const point = (event) => { const rect = canvas.getBoundingClientRect(); return { x: Math.max(0, Math.min(canvas.width, (event.clientX - rect.left) * canvas.width / rect.width)), y: Math.max(0, Math.min(canvas.height, (event.clientY - rect.top) * canvas.height / rect.height)) } }
  canvas.addEventListener('pointerdown', (event) => { if (busy) return; start = point(event); canvas.setPointerCapture(event.pointerId) })
  canvas.addEventListener('pointermove', (event) => {
    if (!start || busy) return
    const end = point(event)
    crop = { x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(start.x - end.x), height: Math.abs(start.y - end.y) }
    draw()
  })
  const finishCrop = () => { if (!start) return; start = null; if (!crop || crop.width < 20 || crop.height < 20) fullImage() }
  canvas.addEventListener('pointerup', finishCrop)
  canvas.addEventListener('pointercancel', finishCrop)
  host.querySelector('[data-ocr-reset]').addEventListener('click', fullImage)
  host.querySelector('[data-ocr-rotate]').addEventListener('click', () => {
    canvas.width = source.height; canvas.height = source.width
    const ctx = canvas.getContext('2d'); ctx.save(); ctx.translate(canvas.width, 0); ctx.rotate(Math.PI / 2); ctx.drawImage(source, 0, 0); ctx.restore()
    source.width = canvas.width; source.height = canvas.height; source.getContext('2d').drawImage(canvas, 0, 0); fullImage()
  })
  const showResult = (text) => {
    const parsed = parseNutritionLabel(text)
    resultHost.innerHTML = `<h3>核对识别结果</h3><details><summary>识别文字</summary><pre class="ocr-source-text"></pre></details><label class="form-field"><span>包装标注方式</span><select data-ocr-basis><option value="unknown">请选择</option><option value="100g">每100克</option><option value="serving">每份</option><option value="100ml">每100毫升</option></select></label><label class="form-field" data-ocr-mass-field><span>该份量实际重量 g</span><input data-ocr-mass type="number" min="0.1" max="10000" step="0.1" value="${parsed.servingGrams || ''}"></label><p class="sheet-hint">以下填写包装该份量的数值；毫升不能直接当作克。</p><div class="form-grid two-column">${Object.entries({ calories: '能量 kcal', carbs: '碳水 g', protein: '蛋白质 g', fat: '脂肪 g' }).map(([key, label]) => `<label class="form-field"><span>${label}</span><input data-ocr-nutrient="${key}" aria-label="识别${label}" type="number" min="0" max="50000" step="0.1" value="${parsed.fields[key].value ?? ''}"><small>${escapeHtml(parsed.fields[key].issue || '请对照原图核对')}</small></label>`).join('')}</div><p role="status" data-ocr-check-message></p><button type="button" class="secondary-action" data-ocr-apply>确认并填入食物</button>`
    resultHost.querySelector('pre').textContent = text.slice(0, 12000)
    const basis = resultHost.querySelector('[data-ocr-basis]')
    basis.value = parsed.basis
    const updateBasis = () => { resultHost.querySelector('[data-ocr-mass-field]').hidden = basis.value === '100g' }
    basis.addEventListener('change', updateBasis); updateBasis()
    enhanceEditorControls(resultHost)
    resultHost.querySelector('[data-ocr-apply]').addEventListener('click', () => {
      const values = Object.fromEntries([...resultHost.querySelectorAll('[data-ocr-nutrient]')].map((input) => [input.dataset.ocrNutrient, input.value]))
      const normalized = normalizeLabelNutrition(values, basis.value, resultHost.querySelector('[data-ocr-mass]').value)
      if (normalized.error) { resultHost.querySelector('[data-ocr-check-message]').textContent = normalized.error; return }
      closeSheet()
      onApply(normalized.values)
      panel.open = false
      status.textContent = '已填入，请确认食物名称后保存'
      showToast('已填入每100g营养数据')
    })
  }
  host.querySelector('[data-ocr-run]').addEventListener('click', async () => {
    if (!crop || busy) return
    const current = ++operation
    const alive = () => current === operation && imageEditor.isConnected && !sheet.hidden
    let runWorker = null
    setBusy(true); status.textContent = '正在加载本机识别组件…'; resultHost.replaceChildren()
    try {
      const engine = await loadLocalOcr()
      if (!alive()) return
      runWorker = await engine.createWorker(['chi_sim', 'eng'], 1, {
        workerPath: new URL('assets/ocr/worker.min.js', document.baseURI).href,
        corePath: new URL('assets/ocr/core/', document.baseURI).href,
        langPath: new URL('assets/ocr/lang/', document.baseURI).href,
        gzip: false, cacheMethod: 'none', workerBlobURL: false,
        logger: (event) => { if (alive()) status.textContent = event.status === 'recognizing text' ? `本机识别中 ${Math.round(event.progress * 100)}%` : '正在准备本机识别…' }
      })
      if (!alive()) return
      worker = runWorker
      await runWorker.setParameters({ preserve_interword_spaces: '1' })
      const left = Math.floor(crop.x), top = Math.floor(crop.y)
      const { data } = await runWorker.recognize(source, { rectangle: { left, top, width: Math.min(source.width - left, Math.round(crop.width)), height: Math.min(source.height - top, Math.round(crop.height)) } }, { text: true, blocks: true })
      if (!alive()) return
      const text = nutritionTextFromOCR(data)
      const parsed=parseNutritionLabel(text)
      if(!Object.values(parsed.fields).some(field=>field.value!==null&&field.value!==undefined))throw new Error('no nutrients')
      showResult(text); imageEditor.hidden=true
      const retry=document.createElement('button');retry.type='button';retry.className='secondary-action';retry.textContent='重新裁剪'
      retry.onclick=()=>{imageEditor.hidden=false;resultHost.replaceChildren();status.textContent='重新框选后识别';sheet.scrollTop=0}
      resultHost.prepend(retry);sheet.scrollTop=0
      status.textContent = '识别完成，请核对数字、单位和标注份量'
    } catch { if (alive()) { imageEditor.hidden=false;resultHost.replaceChildren();sheet.scrollTop=0;status.textContent = '未识别成功，请调整裁剪范围后重试' } }
    finally {
      if (runWorker) await runWorker.terminate()
      if (worker === runWorker) worker = null
      if (current === operation) setBusy(false)
    }
  })
  const cleanup = new MutationObserver(() => {
    if ((!host.isConnected && !imageEditor.isConnected) || sheet.hidden) { operation++; if (worker) { worker.terminate(); worker = null }; setBusy(false); cleanup.disconnect() }
  })
  cleanup.observe(sheet, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] })
}
