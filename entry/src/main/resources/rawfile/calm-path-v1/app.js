const baseTargets = {
  training: { calories: 1402, protein: 92, carbs: 146, fat: 50 },
  rest: { calories: 1207, protein: 92, carbs: 110, fat: 45 }
}

const methods = [
  { id: 'standard', name: '热量缺口法', note: '基础代谢 × 活动因子 − 每日缺口；按比例分配碳蛋脂' },
  { id: 'song', name: '身高体重配额法', note: '按性别、目标、身高与体重查配额表' },
  { id: 'king', name: '碳循环-热量重分配', note: '先算 7 天总配额，再按可调比例分配高中低碳日' },
  { id: 'king-redistributed', name: '碳循环-体重倍数', note: '按体重倍数直接设置高、中、低碳日' },
  { id: 'dynamic', name: '三月动态调整', note: '按训练量计算起点，定期称重并确认调整', durationMonths: 3 },
  { id: 'fixed', name: '40 天阶段渐降', note: '按第 1–40 天阶段表切换体重倍数', durationDays: 40 }
]

function parseSongQuotaRows(source) {
  return source.trim().split('\n').map((row) => row.trim().split(/\s+/).map((cell, index) => {
    if (index === 0) return Number(cell)
    if (cell === '-') return null
    return cell.split('/').map(Number)
  }))
}

const songQuotaTables = {
  male: {
    cut: {
      heights: [160, 165, 170, 175, 180, 185, 190],
      rows: parseSongQuotaRows(`
        50 - - - - - - -
        55 - - - - - - -
        60 2.6/2.0/1.4 - - - - - -
        65 2.6/1.9/1.4 2.6/2.0/1.4 - - - - -
        70 2.5/1.9/1.3 2.5/2.0/1.4 2.6/2.0/1.4 2.7/2.1/1.4 - - -
        75 2.4/1.9/1.3 2.5/1.9/1.3 2.5/2.0/1.4 2.6/2.1/1.4 2.7/2.1/1.4 - -
        80 2.4/1.9/1.3 2.4/1.9/1.3 2.5/2.0/1.3 2.5/2.0/1.4 2.6/2.1/1.4 2.6/2.1/1.4 -
        85 2.3/1.8/1.2 2.4/1.9/1.3 2.4/1.9/1.3 2.5/2.0/1.3 2.5/2.0/1.4 2.6/2.1/1.4 2.6/2.2/1.4
        90 2.3/1.8/1.2 2.3/1.9/1.3 2.4/1.9/1.3 2.4/2.0/1.3 2.5/2.0/1.3 2.5/2.1/1.4 2.6/2.1/1.4
        95 2.2/1.8/1.2 2.3/1.8/1.2 2.3/1.9/1.2 2.4/1.9/1.3 2.4/2.0/1.3 2.5/2.0/1.3 2.5/2.1/1.3
        100 2.2/1.8/1.2 2.2/1.8/1.2 2.3/1.9/1.2 2.3/1.9/1.2 2.4/2.0/1.3 2.4/2.0/1.3 2.5/2.1/1.3
        105 2.1/1.8/1.2 2.2/1.8/1.2 2.2/1.9/1.2 2.3/1.9/1.2 2.3/1.9/1.2 2.4/2.0/1.3 2.4/2.0/1.3
        110 2.1/1.8/1.1 2.2/1.8/1.2 2.2/1.8/1.2 2.2/1.9/1.2 2.3/1.9/1.2 2.3/2.0/1.3 2.4/2.0/1.3
        115 2.1/1.7/1.1 2.1/1.8/1.1 2.2/1.8/1.2 2.2/1.9/1.2 2.2/1.9/1.2 2.3/1.9/1.2 2.3/2.0/1.3
        120 1.9/1.6/1.0 2.0/1.6/1.1 2.0/1.7/1.1 2.1/1.7/1.1 2.1/1.8/1.1 2.1/1.8/1.1 2.2/1.8/1.2
        125 1.9/1.6/1.0 2.0/1.6/1.1 2.0/1.7/1.1 2.0/1.7/1.1 2.1/1.8/1.1 2.1/1.8/1.1 2.1/1.8/1.2
        130 1.9/1.6/1.0 1.9/1.6/1.0 2.0/1.7/1.1 2.0/1.7/1.1 2.0/1.7/1.1 2.1/1.8/1.1 2.1/1.8/1.1
      `)
    },
    gain: {
      heights: [160, 165, 170, 175, 180, 185, 190],
      rows: parseSongQuotaRows(`
        50 3.7/2.7/2.0 3.9/2.8/2.1 4.0/2.9/2.1 4.1/3.0/2.2 4.2/3.2/2.3 4.3/3.3/2.3 4.5/3.4/2.4
        55 3.6/2.6/1.9 3.7/2.7/2.0 3.8/2.8/2.0 3.9/2.9/2.1 4.0/3.1/2.2 4.1/3.2/2.2 4.2/3.3/2.3
        60 3.4/2.6/1.8 3.5/2.7/1.9 3.6/2.8/2.0 3.7/2.9/2.0 3.8/3.0/2.1 3.9/3.1/2.1 4.0/3.2/2.2
        65 3.3/2.5/1.8 3.4/2.6/1.8 3.5/2.7/1.9 3.6/2.8/1.9 3.7/2.9/2.0 3.8/3.0/2.0 3.9/3.1/2.1
        70 3.2/2.5/1.7 3.3/2.6/1.8 3.4/2.6/1.8 3.5/2.7/1.9 3.6/2.8/1.9 3.7/2.9/2.0 3.7/3.0/2.0
        75 - - 3.3/2.6/1.8 3.4/2.7/1.8 3.5/2.8/1.9 3.5/2.8/1.9 3.6/2.9/2.0
        80 - - - 3.3/2.6/1.8 3.4/2.7/1.9 3.4/2.8/1.9 3.5/2.9/1.9
        85 - - - - 3.3/2.7/1.8 3.4/2.7/1.8 3.4/2.8/1.9
        90 - - - - - 3.3/2.7/1.8 3.3/2.8/1.8
        95 - - - - - - 3.3/2.7/1.8
      `)
    },
    untrained: {
      heights: [160, 165, 170, 175, 180, 185, 190],
      rows: parseSongQuotaRows(`
        50 - - - - - - -
        55 - - - - - - -
        60 2.4/1.0 - - - - - -
        65 2.3/1.0 2.4/1.0 - - - - -
        70 2.3/1.0 2.3/1.0 2.4/1.0 2.5/1.1 - - -
        75 2.2/1.0 2.3/1.0 2.4/1.0 2.4/1.0 2.5/1.1 - -
        80 2.2/0.9 2.2/1.0 2.3/1.0 2.4/1.0 2.4/1.0 2.5/1.1 -
        85 2.1/0.9 2.2/0.9 2.3/1.0 2.3/1.0 2.4/1.0 2.4/1.0 2.5/1.1
        90 2.1/0.9 2.2/0.9 2.2/1.0 2.3/1.0 2.3/1.0 2.4/1.0 2.4/1.0
        95 2.1/0.9 2.1/0.9 2.2/0.9 2.2/1.0 2.3/1.0 2.4/1.0 2.4/1.0
        100 2.1/0.9 2.1/0.9 2.2/0.9 2.2/0.9 2.3/1.0 2.3/1.0 2.4/1.0
        105 2.0/0.9 2.1/0.9 2.1/0.9 2.2/0.9 2.2/1.0 2.3/1.0 2.3/1.0
        110 2.0/0.9 2.1/0.9 2.1/0.9 2.2/0.9 2.2/0.9 2.2/1.0 2.3/1.0
        115 2.0/0.9 2.0/0.9 2.1/0.9 2.1/0.9 2.2/0.9 2.2/1.0 2.3/1.0
        120 1.9/0.8 1.9/0.8 1.9/0.8 2.0/0.8 2.0/0.9 2.1/0.9 2.1/0.9
        125 1.9/0.8 1.9/0.8 1.9/0.8 2.0/0.8 2.0/0.9 2.0/0.9 2.1/0.9
        130 1.9/0.8 1.9/0.8 1.9/0.8 2.0/0.8 2.0/0.9 2.0/0.9 2.1/0.9
      `)
    }
  },
  female: {
    cut: {
      heights: [150, 155, 160, 165, 170, 175, 180],
      rows: parseSongQuotaRows(`
        40 - - - - - - -
        45 2.4/1.8/1.3 - - - - - -
        50 2.3/1.8/1.2 2.4/1.9/1.3 2.5/2.0/1.3 - - - -
        55 2.2/1.8/1.2 2.3/1.9/1.2 2.4/1.9/1.3 2.5/2.0/1.3 - - -
        60 2.1/1.7/1.2 2.2/1.8/1.2 2.3/1.9/1.2 2.4/2.0/1.3 2.5/2.1/1.3 2.5/2.1/1.4 -
        65 2.1/1.7/1.1 2.2/1.8/1.2 2.2/1.9/1.2 2.3/1.9/1.2 2.4/2.0/1.3 2.5/2.1/1.3 2.5/2.2/1.4
        70 2.0/1.7/1.1 2.1/1.8/1.1 2.2/1.8/1.2 2.2/1.9/1.2 2.3/2.0/1.2 2.4/2.0/1.3 2.4/2.1/1.3
        75 2.0/1.7/1.1 2.1/1.8/1.1 2.1/1.8/1.1 2.2/1.9/1.2 2.3/1.9/1.2 2.3/2.0/1.2 2.4/2.1/1.3
        80 2.0/1.7/1.1 2.0/1.7/1.1 2.1/1.8/1.1 2.2/1.9/1.2 2.2/1.9/1.2 2.3/2.0/1.2 2.3/2.0/1.3
        85 1.9/1.7/1.0 2.0/1.7/1.1 2.1/1.8/1.1 2.1/1.8/1.1 2.2/1.9/1.2 2.2/1.9/1.2 2.3/2.0/1.2
        90 1.9/1.7/1.0 2.0/1.8/1.1 2.1/1.8/1.1 2.1/1.8/1.1 2.1/1.9/1.1 2.2/1.9/1.2 2.2/2.0/1.2
        95 1.9/1.6/1.0 1.9/1.7/1.0 2.0/1.7/1.1 2.0/1.8/1.1 2.1/1.8/1.1 2.1/1.9/1.2 2.2/1.9/1.2
        100 1.9/1.6/1.0 1.9/1.7/1.0 2.0/1.7/1.1 2.0/1.8/1.1 2.1/1.8/1.1 2.1/1.9/1.1 2.2/1.9/1.2
        105 1.9/1.6/1.0 1.9/1.7/1.0 1.9/1.7/1.1 2.0/1.8/1.1 2.0/1.8/1.1 2.1/1.8/1.1 2.1/1.9/1.1
        110 1.8/1.6/1.0 1.9/1.7/1.0 1.9/1.7/1.1 2.0/1.8/1.1 2.0/1.8/1.1 2.1/1.8/1.1 2.1/1.9/1.1
        115 1.8/1.6/1.0 1.9/1.7/1.0 1.9/1.7/1.1 1.9/1.7/1.0 2.0/1.8/1.1 2.0/1.8/1.1 2.1/1.9/1.1
        120 1.8/1.6/1.0 1.9/1.7/1.0 1.9/1.7/1.1 1.9/1.7/1.0 2.0/1.8/1.1 2.0/1.8/1.1 2.0/1.8/1.1
      `)
    },
    gain: {
      heights: [150, 155, 160, 165, 170, 175, 180],
      rows: parseSongQuotaRows(`
        40 3.1/2.3/1.3 3.2/2.5/1.4 3.4/2.6/1.5 3.5/2.8/1.5 3.7/2.9/1.6 3.8/3.1/1.6 4.0/3.2/1.7
        45 3.0/2.3/1.3 3.1/2.4/1.3 3.2/2.5/1.4 3.4/2.7/1.4 3.5/2.8/1.5 3.6/2.9/1.6 3.8/3.1/1.6
        50 2.9/2.2/1.2 3.0/2.4/1.3 3.1/2.5/1.3 3.2/2.6/1.4 3.3/2.7/1.4 3.5/2.8/1.5 3.6/3.0/1.5
        55 2.8/2.2/1.2 2.9/2.3/1.2 3.0/2.4/1.3 3.1/2.5/1.3 3.2/2.6/1.4 3.3/2.8/1.4 3.4/2.9/1.5
        60 - - 2.9/2.4/1.2 3.0/2.5/1.3 3.1/2.6/1.3 3.2/2.7/1.4 3.3/2.9/1.4
        65 - - - 2.9/2.4/1.2 3.0/2.5/1.3 3.1/2.6/1.3 3.2/2.7/1.4
        70 - - - - 2.9/2.5/1.2 3.0/2.6/1.3 3.1/2.7/1.3
        75 - - - - - 3.0/2.5/1.2 3.0/2.6/1.3
      `)
    },
    untrained: {
      heights: [150, 155, 160, 165, 170, 175, 180],
      rows: parseSongQuotaRows(`
        40 - - - - - - -
        45 2.2/1.1 - - - - - -
        50 2.1/1.1 2.1/0.9 2.1/1.2 - - - -
        55 2.1/1.0 2.0/0.9 2.1/1.1 2.2/1.2 - - -
        60 2.0/1.0 2.0/0.9 2.0/1.1 2.1/1.1 2.2/1.2 2.3/1.2 -
        65 2.0/1.0 1.9/0.9 2.0/1.1 2.1/1.1 2.1/1.2 2.2/1.2 2.3/1.2
        70 2.0/1.0 1.9/0.9 2.0/1.1 2.0/1.1 2.1/1.1 2.2/1.2 2.2/1.2
        75 1.9/1.0 1.9/0.9 1.9/1.0 2.0/1.1 2.1/1.1 2.1/1.1 2.2/1.2
        80 1.9/1.0 1.8/0.9 1.9/1.0 2.0/1.1 2.0/1.1 2.1/1.1 2.1/1.1
        85 1.9/1.0 1.8/0.8 1.9/1.0 1.9/1.0 2.0/1.1 2.0/1.1 2.1/1.1
        90 1.9/0.9 1.8/0.8 1.9/1.0 1.9/1.0 2.0/1.1 2.0/1.1 2.1/1.1
        95 1.9/0.9 1.8/0.8 1.8/1.0 1.9/1.0 1.9/1.0 2.0/1.1 2.0/1.1
        100 1.9/0.9 1.8/0.8 1.8/1.0 1.9/1.0 1.9/1.0 2.0/1.1 2.0/1.1
        105 1.8/0.9 1.8/0.8 1.8/1.0 1.8/1.0 1.9/1.0 1.9/1.0 2.0/1.1
        110 1.8/0.9 1.7/0.8 1.8/1.0 1.8/1.0 1.9/1.0 1.9/1.0 2.0/1.1
        115 1.8/0.9 1.7/0.8 1.8/1.0 1.8/1.0 1.9/1.0 1.9/1.0 1.9/1.0
        120 1.8/0.9 1.7/0.8 1.8/0.9 1.8/1.0 1.8/1.0 1.9/1.0 1.9/1.0
      `)
    }
  }
}

const initialMethodTargets = {
  standard: { mode: 'percentage', days: {
    training: { calories: 1402, percentages: { carbs: 50, protein: 30, fat: 20 } },
    rest: { calories: 1207, percentages: { carbs: 50, protein: 30, fat: 20 } }
  } }
}

const dayTypeOptions = [
  { id: 'training', name: '训练日' },
  { id: 'rest', name: '休息日' }
]

const carbonDayOptions = [
  { id: 'low', name: '低碳日', shortName: '低碳', dayType: 'rest' },
  { id: 'medium', name: '中碳日', shortName: '中碳', dayType: 'training' },
  { id: 'high', name: '高碳日', shortName: '高碳', dayType: 'training' }
]

const mealTypeOptions = [
  { id: 'breakfast', name: '早餐' },
  { id: 'lunch', name: '中饭' },
  { id: 'dinner', name: '晚饭' },
  { id: 'snack', name: '加餐' }
]

function mealTypeOptionsForDay(dayType) {
  return mealTypeOptions
}

const mealTimingOptions = [
  { id: '', name: '无训练时段' },
  { id: 'preworkout', name: '练前' },
  { id: 'postworkout', name: '练后' }
]

const foodCategoryOptions = [
  { id: 'carbs', name: '碳水' },
  { id: 'protein', name: '蛋白质' },
  { id: 'fiber', name: '膳食纤维' },
  { id: 'fat', name: '脂肪' },
  { id: 'other', name: '其他' }
]

const foodFilterOptions = [...foodCategoryOptions, { id: 'dish', name: '菜肴' }]

function matchesFoodFilters(food, filters) {
  return filters.length === 0 || filters.some((filter) => filter === 'dish' ? food.kind === 'dish' : food.category === filter)
}

const themes = [
  { id: 'calm', name: '鼠尾草', description: '清新叶绿、米白与暖杏', chrome: '#FAFBF6' },
  { id: 'mint-pop', name: '薄荷糖', description: '晴蓝、薄荷与柔莓粉', chrome: '#F5FAFC' },
  { id: 'forest-clay', name: '森林陶土', description: '浅叶绿、奶油白与杏陶', chrome: '#FCFAF5' },
  { id: 'night-spark', name: '夜航霓光', description: '浅雾蓝、藕粉与暖金', chrome: '#F8F9FD' }
]

function themePaletteStyle() {
  const colors = ['--energy-fill', '--carbs', '--protein', '--fat', '--paper']
  const section = 100 / colors.length
  const stops = colors.map((color, index) => `var(${color}) ${index * section}% ${(index + 1) * section}%`)
  return `background:linear-gradient(90deg,${stops.join(',')})`
}

const FOOD_DATA_VERSION = 2
const APP_STATE_VERSION = 6

function neutralizeLegacyMethodName(value) {
  return String(value || '')
    .replace(/好人松松(?:饮食法)?(?:\s*[·•・-]\s*热量法)?/g, '身高体重配额法')
    .replace(/三档碳循环\s*[（(]重新分配版[）)]/g, '碳循环-体重倍数')
    .replace(/三档碳循环\s*[（(]原版[）)]/g, '碳循环-热量重分配')
    .replace(/凯圣王(?:碳循环)?/g, '碳循环-热量重分配')
    .replace(/谭成义(?:碳水渐降)?/g, '反馈式碳水渐降')
    .replace(/橙色碳水渐降法?/g, '反馈式碳水渐降')
}

function isRetiredDietMethod(method) {
  return method?.id === 'orange'
    || method?.baseId === 'orange'
    || /反馈式碳水渐降|谭成义(?:碳水渐降)?|橙色碳水渐降法?/.test(`${method?.name || ''} ${method?.note || ''}`)
}

function migrateLegacyMethodNames(customMethods) {
  if (!Array.isArray(customMethods)) return []
  return customMethods.filter((method) => !isRetiredDietMethod(method)).map((method) => ({
    ...method,
    name: neutralizeLegacyMethodName(method.name),
    note: neutralizeLegacyMethodName(method.note)
  }))
}

function removeRetiredDietMethodState() {
  delete state.methodApplications.orange
  delete state.methodOverrides.orange
  state.customMethods = state.customMethods.filter((method) => !isRetiredDietMethod(method))
  if (state.methodId === 'orange' || !allMethods().some((method) => method.id === state.methodId)) state.methodId = 'standard'
}
const legacyFoodDefaults = [
  ...FOOD_LIBRARY.map((food) => ({
    ...food,
    category: food.category === 'vegetable' ? 'fiber' : food.category,
    ...(FOOD_OVERRIDES[food.id] || {})
  })),
  ...ADDITIONAL_FOODS.map((food) => ({ ...food }))
]
const REMOVED_DEFAULT_FOOD_IDS = new Set(['purple-rice', 'brown-rice', 'red-rice', 'millet'])
const foods = createFoodCatalog(legacyFoodDefaults)
const requestedRecipeDefaults = foods.filter(food=>food.requestedRecipeVersion>0).map(food=>JSON.parse(JSON.stringify(food)))

const FOOD_PINYIN_CHAR_MAP = Object.fromEntries(`三:san|丝:si|亚:ya|仁:ren|全:quan|兰:lan|冬:dong|包:bao|北:bei|南:nan|卜:bo|卷:juan|原:yuan|去:qu|合:he|味:wei|咖:ka|啡:fei|土:tu|圣:sheng|坚:jian|大:da|头:tou|奇:qi|奥:ao|女:nv|奶:nai|姜:jiang|娃:wa|子:zi|小:xiao|尔:er|山:shan|巴:ba|希:xi|带:dai|干:gan|平:ping|心:xin|扁:bian|排:pai|文:wen|无:wu|普:pu|木:mu|杂:za|杏:xing|果:guo|枣:zao|柚:you|桃:tao|梨:li|椒:jiao|榄:lan|橄:gan|橙:cheng|毛:mao|沙:sha|油:you|浆:jiang|海:hai|熟:shu|燕:yan|片:pian|牛:niu|猕:mi|猪:zhu|猴:hou|玉:yu|瓜:gua|甘:gan|甜:tian|生:sheng|用:yong|番:fan|瘦:shou|白:bai|百:bai|皮:pi|秋:qiu|空:kong|竹:zhu|笋:sun|米:mi|籽:zi|粉:fen|粮:liang|粱:liang|糖:tang|糙:cao|紫:zi|红:hong|绿:lv|羽:yu|耳:er|肉:rou|胡:hu|胸:xiong|脂:zhi|腊:la|腐:fu|腿:tui|良:liang|芋:yu|芦:lu|花:hua|芹:qin|芽:ya|苗:miao|苦:ku|苹:ping|茄:qie|茭:jiao|草:cao|荞:qiao|荠:qi|药:yao|荷:he|荸:bi|莓:mei|莲:lian|莴:wo|菇:gu|菜:cai|菠:bo|萝:luo|葫:hu|葵:kui|蒜:suan|蓝:lan|蔬:shu|蕉:jiao|薏:yi|薯:shu|藕:ou|藜:li|蘑:mo|虾:xia|蛋:dan|蛤:ge|蜊:li|衣:yi|裙:qun|西:xi|调:tiao|豆:dou|贝:bei|通:tong|酱:jiang|酸:suan|金:jin|针:zhen|银:yin|面:mian|食:shi|饭:fan|香:xiang|骨:gu|高:gao|鱼:yu|鲍:bao|鲜:xian|鲫:ji|鸡:ji|鸭:ya|麦:mai|麻:ma|黄:huang|黑:hei`.split('|').map((entry) => entry.split(':')))

function normalizeFoodSearch(value) {
  return String(value || '').trim().toLowerCase().replace(/[\s·._\-—（）()\/]+/g, '')
}

function foodNamePinyin(name) {
  if (typeof CATALOG_PINYIN_PHRASES !== 'undefined' && Object.hasOwn(CATALOG_PINYIN_PHRASES, name)) return CATALOG_PINYIN_PHRASES[name]
  const map = typeof CATALOG_PINYIN_CHAR_MAP === 'undefined' ? {} : CATALOG_PINYIN_CHAR_MAP
  const syllables = Array.from(name || '').map((character) => map[character] || FOOD_PINYIN_CHAR_MAP[character] || (/\p{Script=Han}/u.test(character) ? character : '')).filter(Boolean)
  return { full: syllables.join(''), initials: syllables.map((syllable) => syllable[0]).join('') }
}

const foodPinyinCache = new WeakMap()
function foodSearchPinyinForms(food) {
  const signature=`${food.name || ''}\u0000${food.keywords || ''}`
  const cached=foodPinyinCache.get(food)
  if(cached?.signature===signature)return cached.forms
  const forms = [food.name || '', ...String(`${food.name || ''} ${food.keywords || ''}`)
    .split(/[\s,，、;；/]+/)
    .filter(Boolean)]
    .map(foodNamePinyin)
  foodPinyinCache.set(food,{signature,forms})
  return forms
}

function matchesFoodSearch(food, rawQuery) {
  const query = normalizeFoodSearch(rawQuery)
  if (!query) return true
  const directText = normalizeFoodSearch(`${food.name} ${food.keywords || ''}`)
  if (directText.includes(query)) return true
  return foodSearchPinyinForms(food).some((pinyin) => pinyin.full.includes(query) || pinyin.initials.includes(query))
}

const songTrainingMealPresets = {
  morning_early: {
    name: '早饭后练（早起）',
    meals: [
      ['早餐 · 练前', '06:00', 15, 20], ['练后餐', '08:00', 35, 30], ['午餐', '12:00', 20, 20], ['晚餐', '18:00', 20, 30], ['加餐', '21:00', 10, 0]
    ]
  },
  morning_late: {
    name: '早饭后练（晚起）',
    meals: [
      ['早餐 · 练前', '08:00', 20, 20], ['午餐 · 练后', '12:30', 50, 35], ['晚餐', '18:30', 20, 35], ['加餐', '21:00', 10, 10]
    ]
  },
  lunch_before: {
    name: '午饭前练',
    meals: [
      ['早餐', '08:00', 20, 20], ['练前餐', '11:00', 15, 0], ['午餐 · 练后', '13:00', 35, 40], ['晚餐', '18:30', 20, 40], ['加餐', '21:00', 10, 0]
    ]
  },
  lunch_after: {
    name: '午饭后练',
    meals: [
      ['早餐', '08:00', 20, 20], ['午餐 · 练前', '12:00', 15, 0], ['练后餐', '14:00', 35, 40], ['晚餐', '18:30', 20, 40], ['加餐', '21:00', 10, 0]
    ]
  },
  dinner_before: {
    name: '晚饭前练',
    meals: [
      ['早餐', '08:00', 20, 20], ['午餐', '12:00', 20, 40], ['练前餐', '17:00', 15, 0], ['晚餐 · 练后', '20:00', 35, 40], ['加餐', '22:00', 10, 0]
    ]
  },
  dinner_after: {
    name: '晚饭后练',
    meals: [
      ['早餐', '08:00', 20, 20], ['午餐', '12:00', 20, 40], ['晚餐 · 练前', '19:00', 15, 0], ['练后餐', '22:00', 35, 40], ['加餐', '23:00', 10, 0]
    ]
  },
  night: {
    name: '夜里练',
    meals: [
      ['早餐', '08:00', 20, 20], ['午餐', '12:30', 20, 30], ['晚餐', '18:30', 20, 30], ['练后餐', '23:00', 30, 20], ['加餐', '21:00', 10, 0]
    ]
  }
}

function createMealPlan(dayType, presetId = dayType === 'training' ? 'morning_late' : 'rest') {
  const sourceMeals = dayType === 'training'
    ? songTrainingMealPresets[presetId].meals
    : [['早餐', '08:00', 20, 20], ['午餐', '12:30', 40, 40], ['晚餐', '18:30', 40, 40]]
  const fallback = [['补充餐', '21:00', 0, 0], ['补充餐', '22:00', 0, 0], ['补充餐', '23:00', 0, 0]]
  const meals = [...sourceMeals, ...fallback].slice(0, 6).map((meal, index) => {
    const mealType = normalizeMealType('', meal[0])
    const timingType = dayType === 'training' ? normalizeMealTiming('', meal[0]) : ''
    return {
      id: `${dayType}-${index + 1}`,
      mealType,
      timingType,
      name: mealDisplayName(mealType, timingType),
      time: meal[1],
      carbRatio: meal[2],
      proteinRatio: meal[3],
      fatRatio: meal[4] ?? meal[3]
    }
  })
  return {
    presetId,
    count: dayType === 'training' ? Math.min(4, sourceMeals.length) : 3,
    tolerance: 10,
    meals
  }
}

const initialMealPlans = {
  training: createMealPlan('training'),
  rest: createMealPlan('rest')
}

function cloneMealPlans(plans) {
  return Object.fromEntries(['training', 'rest'].map((dayType) => [dayType, {
    ...plans[dayType],
    meals: plans[dayType].meals.map((meal, index) => {
      const mealType = normalizeMealType(meal.mealType, meal.name || mealTypeOptionsForDay(dayType)[Math.min(index, mealTypeOptionsForDay(dayType).length - 1)].name)
      const allowedType = mealTypeOptionsForDay(dayType).some((option) => option.id === mealType) ? mealType : mealTypeOptionsForDay(dayType)[Math.min(index, mealTypeOptionsForDay(dayType).length - 1)].id
      const timingType = dayType === 'training' ? normalizeMealTiming(meal.timingType, meal.name) : ''
      return {
        ...meal,
        mealType: allowedType,
        timingType,
        name: mealDisplayName(allowedType, timingType),
        fatRatio: Number.isFinite(Number(meal.fatRatio)) ? Number(meal.fatRatio) : Number(meal.proteinRatio) || 0
      }
    })
  }]))
}

function mealSlotsFromPlans(dayType, plans) {
  const normalizedType = dayType === 'rest' ? 'rest' : 'training'
  const plan = plans[normalizedType]
  return plan.meals.slice(0, Math.max(2, Math.min(6, plan.count))).map((meal) => ({ ...meal })).sort((left, right) => left.time.localeCompare(right.time))
}

const defaultMealSets = [
  { name: '燕麦牛奶早餐', dayType: 'training', applicableDayTypes: ['training', 'rest'], applicableCarbonLevels: ['low', 'medium', 'high'], applicabilityCustomized: { binary: true, carbon: true }, mealType: 'breakfast', sourceMealId: 'training-1', items: [{ foodId: 'oats', amount: 50 }, { foodId: 'milk', amount: 200 }, { foodId: 'egg', amount: 50, locked: true }] },
  { name: '鸡胸米饭中饭', dayType: 'training', applicableDayTypes: ['training', 'rest'], applicableCarbonLevels: ['low', 'medium', 'high'], applicabilityCustomized: { binary: true, carbon: true }, mealType: 'lunch', sourceMealId: 'training-2', items: [{ foodId: 'rice', amount: 150 }, { foodId: 'chicken', amount: 150 }, { foodId: 'mixed-vegetables', amount: 250 }, { foodId: 'cooking-oil', amount: 10 }] },
  { name: '牛肉红薯晚饭', dayType: 'rest', applicableDayTypes: ['training', 'rest'], applicableCarbonLevels: ['low', 'medium', 'high'], applicabilityCustomized: { binary: true, carbon: true }, mealType: 'dinner', sourceMealId: 'rest-3', items: [{ foodId: 'beef-cooked', amount: 150 }, { foodId: 'sweet-potato-cooked', amount: 180 }, { foodId: 'mixed-vegetables', amount: 200 }, { foodId: 'cooking-oil', amount: 10 }] },
  { name: '训练日练后', dayType: 'training', applicableDayTypes: ['training'], applicableCarbonLevels: ['medium', 'high'], applicabilityCustomized: { binary: true, carbon: true }, mealType: 'snack', sourceMealId: 'training-4', items: [{ foodId: 'banana', amount: 100 }, { foodId: 'protein-powder', amount: 30 }] }
]

function buildMeals(itemGroups = [], dayType = 'training', plans = initialMealPlans) {
  return mealSlotsFromPlans(dayType, plans).map((meal, index) => ({
    ...meal,
    items: (itemGroups[index] || []).map((item) => ({ ...item }))
  }))
}

const APP_TODAY = new Date()
APP_TODAY.setHours(12, 0, 0, 0)
const APP_TODAY_KEY = dateKey(APP_TODAY)
const DIRECT_FOOD_DATE_MIN = dateKey(new Date(APP_TODAY.getFullYear() - 1, APP_TODAY.getMonth(), APP_TODAY.getDate()))
const DIRECT_FOOD_DATE_MAX = dateKey(new Date(APP_TODAY.getFullYear() + 1, APP_TODAY.getMonth(), APP_TODAY.getDate()))
const FOOD_ICON_PACK = ['1f330', '1f33d', '1f33e', '1f344', '1f345', '1f346', '1f347', '1f349', '1f34a', '1f34b', '1f34c', '1f34e', '1f350', '1f351', '1f352', '1f353', '1f357', '1f35a', '1f35c', '1f35e', '1f360', '1f383', '1f41f', '1f951', '1f952', '1f954', '1f955', '1f95a', '1f95b', '1f95c', '1f95d', '1f95f', '1f963', '1f966', '1f969', '1f96c', '1f986', '1f990', '1f9aa', '1f9c4', '1f9c5', '1fad0', '1fad1', '1fad2', '1fad8', '1fada', '1fadb', '2615']
const FOOD_ICON_CATALOG = typeof OPENMOJI_FOOD_ICONS !== 'undefined' ? OPENMOJI_FOOD_ICONS : FOOD_ICON_PACK.map(id => ({ id, name: '食物图标', group: '全部', keywords: '' }))
const FOOD_ICON_IDS = new Set(FOOD_ICON_CATALOG.map(icon => icon.id))

function resolveFoodIconId(icon) {
  if (['1f4a7', '1f37d', '1f9c2', '1f372'].includes(icon)) return icon
  if (FOOD_ICON_IDS.has(icon)) return icon
  // Old backups retain their IDs; render equivalent art without rewriting records.
  if (FOOD_ICON_IDS.has(`openmoji-${icon}`)) return `openmoji-${icon}`
  return FOOD_ICON_PACK.includes(icon) ? icon : ''
}

function foodIconPath(icon) {
  const id = resolveFoodIconId(icon)
  if (!id) return ''
  // Keep historical IDs in records; only the artwork provider changes.
  return `assets/food-icons/twemoji/${id.replace(/^openmoji-/, '')}.svg`
}

function defaultFoodIcon(food) {
  const name = String(food.name || '')
  const matches = [[/奶|乳/,'1f95b'],[/蛋/,'1f95a'],[/鸡|鸭|鹅/,'1f357'],[/牛|猪|羊|肉/,'1f969'],[/鱼/,'1f41f'],[/虾/,'1f990'],[/菇|菌|木耳/,'1f344'],[/番茄|西红柿/,'1f345'],[/黄瓜/,'1f952'],[/胡萝卜/,'1f955'],[/菜|菠菜/,'1f96c'],[/苹果/,'1f34e'],[/香蕉/,'1f34c'],[/梨/,'1f350'],[/橙|橘/,'1f34a'],[/桃/,'1f351'],[/葡萄/,'1f347'],[/米|饭/,'1f35a'],[/面|麦|饼/,'1f33e'],[/薯|土豆/,'1f954'],[/豆|坚果/,'1f95c'],[/油/,'1fad2'],[/盐|调味|酱|醋/,'1f9c2'],[/水/,'1f4a7']]
  const bySource = { '01':'1f33e', '02':'1f954', '03':'1fad8', '04':'1f96c', '05':'1f344', '06':'1f34e', '07':'1f95c', '08':'1f969', '09':'1f357', '10':'1f95b', '11':'1f95a', '19':'1fad2', '20':'1f9c2' }
  return (food.kind === 'dish' ? '1f372' : '') || matches.find(([pattern]) => pattern.test(name))?.[1] || bySource[food.source?.categoryCode] || ({ carbs:'1f33e', protein:'1f969', fiber:'1f96c', fat:'1f95c', other:'1f37d' })[food.category] || '1f37d'
}

function hasAutomaticCatalogIcon(food) {
  return !!(food.source || food.custom || food.kind === 'dish') && !food.iconText && !food.customImage && !food.pixelArt && !food.pixelIcon && !food.icon
}
const dailyRecords = {}

const state = {
  page: 'today',
  day: 'training',
  methodId: 'standard',
  dayOffset: 0,
  dailyRecords,
  categoryFilters: [],
  foodLibraryView: 'ingredients',
  selectedMeal: 2,
  selectedFood: 'chicken',
  selectedPhotoMeal: 0,
  amount: 100,
  pinnedFoodIds: ['chicken', 'rice'],
  foodLibraryStages: {},
  foodPairNutrients: {},
  recentByMeal: {
    'training-1': [{ foodId: 'oats', amount: 50 }, { foodId: 'milk', amount: 200 }, { foodId: 'egg', amount: 50 }],
    'training-2': [{ foodId: 'rice', amount: 150 }, { foodId: 'chicken', amount: 150 }, { foodId: 'mixed-vegetables', amount: 250 }, { foodId: 'cooking-oil', amount: 10 }],
    'training-3': [{ foodId: 'rice', amount: 100 }, { foodId: 'banana', amount: 120 }],
    'training-4': [{ foodId: 'banana', amount: 100 }, { foodId: 'protein-powder', amount: 30 }],
    'rest-1': [{ foodId: 'oats', amount: 50 }, { foodId: 'milk', amount: 200 }, { foodId: 'egg', amount: 50 }],
    'rest-2': [{ foodId: 'chicken', amount: 150 }, { foodId: 'rice', amount: 150 }, { foodId: 'broccoli', amount: 150 }],
    'rest-3': [{ foodId: 'beef-cooked', amount: 150 }, { foodId: 'sweet-potato-cooked', amount: 180 }, { foodId: 'mixed-vegetables', amount: 200 }, { foodId: 'cooking-oil', amount: 10 }]
  },
  amountHistoryByMeal: {
    'training-1': { oats: [50, 60], milk: [250, 200], egg: [100, 50] },
    'training-2': { chicken: [150, 120], rice: [200, 150], broccoli: [100, 150] },
    'training-3': { rice: [100, 150], banana: [120, 100] },
    'training-4': { chicken: [120, 150], 'sweet-potato': [180, 150], broccoli: [150, 100] },
    'rest-1': { oats: [50, 60], milk: [250, 200], egg: [100, 50] },
    'rest-2': { chicken: [150, 120], rice: [150, 120], broccoli: [150, 100] },
    'rest-3': { chicken: [120, 150], 'sweet-potato': [150, 180], broccoli: [150, 100] }
  },
  savedMealSets: [],
  preferredSetByMeal: {
    'training-1': 'default-0',
    'training-2': 'default-1',
    'training-3': 'default-2',
    'training-4': 'default-3',
    'rest-1': 'default-0',
    'rest-2': 'default-1',
    'rest-3': 'default-2'
  },
  meals: buildMeals([], 'training', initialMealPlans),
  mealPlans: cloneMealPlans(initialMealPlans),
  weekPlan: [
    { day: '一', type: '训练日', dayType: 'training', enabled: true },
    { day: '二', type: '休息日', dayType: 'rest', enabled: true },
    { day: '三', type: '训练日', dayType: 'training', enabled: true },
    { day: '四', type: '休息日', dayType: 'rest', enabled: true },
    { day: '五', type: '训练日', dayType: 'training', enabled: true },
    { day: '六', type: '休息日', dayType: 'rest', enabled: true },
    { day: '日', type: '休息日', dayType: 'rest', enabled: true }
  ],
  scheduleMode: 'cycle',
  cycleStartDate: APP_TODAY_KEY,
  prepStartCustomized: false,
  dayCyclePlan: [
    { day: '1', type: '训练日', dayType: 'training', enabled: true },
    { day: '2', type: '休息日', dayType: 'rest', enabled: true },
    { day: '3', type: '训练日', dayType: 'training', enabled: true },
    { day: '4', type: '休息日', dayType: 'rest', enabled: true },
    { day: '5', type: '训练日', dayType: 'training', enabled: true },
    { day: '6', type: '休息日', dayType: 'rest', enabled: true },
    { day: '7', type: '休息日', dayType: 'rest', enabled: true }
  ],
  carbonCyclePlan: null,
  schedulePlanCustomized: { binary: false, carbon: false },
  scheduleMealOverrides: {},
  selectedPrepDay: 0,
  shoppingChecked: [],
  shoppingCompletionResetIds: [],
  shoppingPurchases: [],
  shoppingChannels: defaultShoppingChannels(),
  foodWeightRules: [],
  foodStatePairs: [],
  ledgerEnabled: true,
  prepWeekExpanded: false,
  foodSheetSearch: '',
  deletedFoodIds: [],
  trendView: 'statistics',
  trendPeriod: 'week',
  weightUnit: 'kg',
  calendarMonthOffset: 0,
  selectedCalendarDate: APP_TODAY_KEY,
  weightRecords: [],
  healthAutoSyncEnabled: false,
  bodyProfile: {
    age: 30,
    gender: 'male',
    height: 175,
    weight: 70.8,
    goal: '减脂',
    bodyType: 'ectomorph',
    weeklyTrainingHours: 4,
    activityLevel: 'light',
    strengthMinutes: 45,
    strengthFactor: 8,
    reminderPreference: 'important'
  },
  methodApplications: {},
  standardDeficitSettings: { deficit: 400, percentages: { carbs: 50, protein: 30, fat: 20 }, manualCalories: null, separateDays: false, days: {} },
  reviewSettings: {},
  dietReviews: [],
  legacyProgramOverrides: {},
  methodOverrides: {},
  customMethods: [],
  deletedMethodIds: [],
  methodNames: {},
  theme: 'calm',
  iconStyle: 'classic',
  onboardingCompleted: false,
  tourCompleted: false
}

const mealList = document.querySelector('#meal-list')
const foodLibrary = document.querySelector('#food-library')
const foodSearch = document.querySelector('#food-search')
const sheet = document.querySelector('#bottom-sheet')
const backdrop = document.querySelector('#sheet-backdrop')
const sheetContent = document.querySelector('#sheet-content')
const sheetTitle = document.querySelector('#sheet-title')
const sheetKicker = document.querySelector('#sheet-kicker')
const mealSetPage = document.querySelector('#meal-set-page')
const optionalSettingsPage = document.querySelector('#optional-settings-page')
const mealSetPageContent = document.querySelector('#meal-set-page-content')
const mealSetPageTitle = document.querySelector('#meal-set-page-title')
const mealSetPageKicker = document.querySelector('#meal-set-page-kicker')
const addMealSetButton = document.querySelector('#add-meal-set')
const toast = document.querySelector('#toast')
const appShell = document.querySelector('.app-shell')
const motionLayer = document.querySelector('#motion-layer')
const cameraInput = document.querySelector('#meal-camera-input')
const galleryInput = document.querySelector('#meal-gallery-input')
const foodIconInput = document.querySelector('#food-icon-input')
const onboarding = document.querySelector('#onboarding')
const onboardingContent = document.querySelector('#onboarding-content')
const onboardingProgress = document.querySelector('#onboarding-progress')
const featureTour = document.querySelector('#feature-tour')
const tourSpotlight = document.querySelector('#tour-spotlight')
const tourCard = document.querySelector('#tour-card')
const reducedMotionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false }
let toastTimer = 0
let sheetCloseTimer = 0
let targetDraft = null
let targetEditContext = null
let mealSetEditorState = null
let prepDayArmedIndex = null
let onboardingStep = 0
let tourStep = 0
let onboardingDraft = null
let mealChoiceTransition = null
let foodSheetMode = 'quick'
let directFoodDate = APP_TODAY_KEY
let foodGridScrollTop = 0
let foodSheetScrollTop = 0
let foodLogFilter = 'all'
let foodLogCommonCollapsed = false
let summaryDayTransition = null
let mealPlanDayTransition = null
const pageHistory = []
const STORAGE_KEY = 'shiyouji-app-v1'
const LOCAL_PHOTO_STORAGE_KEY = 'shiyouji-local-meal-photos-v1'
const LOCAL_PHOTO_DB_NAME = 'shiyouji-local-photos'
const LOCAL_PHOTO_STORE_NAME = 'mealPhotos'
const BACKUP_FORMAT = 'shiyouji-json-backup'
const BACKUP_VERSION = 1
const MAX_BACKUP_TEXT_LENGTH = 5 * 1024 * 1024
const backupSectionOptions = [
  { id: 'settings', name: '配置', description: '饮食与采购记录、周期、餐次与界面偏好' },
  { id: 'layout', name: '页面边距', description: '已保存的内外边距、组件间隔与顶部避让' },
  { id: 'userInfo', name: '用户信息', description: '身体参数与体重记录' },
  { id: 'foodLibrary', name: '食物库', description: '食材、分类与常用位置' },
  { id: 'dietPlans', name: '饮食计划', description: '当前方案与自定义模板' },
  { id: 'mealPlans', name: '套餐计划', description: '默认套餐与其他套餐' }
]
let localPhotoDatabasePromise = null
let pendingMealPhotoMigration = {}
let localPhotoMigrationCorrupted = false

function isSupportedLocalMealPhoto(photo) {
  if (typeof photo !== 'string' || !photo.startsWith('data:image/jpeg;base64,')) return false
  const payload = photo.slice('data:image/jpeg;base64,'.length)
  return payload.length > 0 && payload.length <= 2000000 && payload.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(payload)
}

function mealPhotoStore(records = state.dailyRecords) {
  const photos = {}
  Object.entries(records || {}).forEach(([recordDate, record]) => {
    const entries = [...(record.meals || []), ...(record.hiddenMeals || []), ...(record.plannedMeals || [])]
    entries.forEach((meal) => {
      if (!meal?.id || !isSupportedLocalMealPhoto(meal.photo)) return
      if (!photos[recordDate]) photos[recordDate] = {}
      photos[recordDate][meal.id] = meal.photo
    })
  })
  return photos
}

function mergeMealPhotoStores(primary, fallback) {
  const merged = { ...(fallback || {}) }
  Object.entries(primary || {}).forEach(([recordDate, meals]) => {
    merged[recordDate] = { ...(merged[recordDate] || {}), ...meals }
  })
  return merged
}

function readLocalMealPhotos() {
  try {
    const photos = JSON.parse(window.localStorage.getItem(LOCAL_PHOTO_STORAGE_KEY) || '{}')
    return photos && typeof photos === 'object' && !Array.isArray(photos) ? photos : {}
  } catch (error) {
    localPhotoMigrationCorrupted = true
    return {}
  }
}

function localMealPhotoKey(recordDate, mealId) {
  return `${recordDate}:${mealId}`
}

function openLocalPhotoDatabase() {
  if (localPhotoDatabasePromise) return localPhotoDatabasePromise
  localPhotoDatabasePromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('当前设备不支持本机照片库'))
      return
    }
    const request = window.indexedDB.open(LOCAL_PHOTO_DB_NAME, 1)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(LOCAL_PHOTO_STORE_NAME)) {
        database.createObjectStore(LOCAL_PHOTO_STORE_NAME, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('无法打开本机照片库'))
  })
  return localPhotoDatabasePromise
}

async function putLocalMealPhotos(entries) {
  if (!entries.length) return
  const database = await openLocalPhotoDatabase()
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(LOCAL_PHOTO_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(LOCAL_PHOTO_STORE_NAME)
    entries.forEach((entry) => store.put(entry))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(new Error('本机照片空间不足，保存失败'))
    transaction.onabort = () => reject(new Error('本机照片保存已取消'))
  })
}

async function putLocalMealPhoto(recordDate, mealId, photo) {
  await putLocalMealPhotos([{ key: localMealPhotoKey(recordDate, mealId), recordDate, mealId, photo }])
}

async function removeLocalMealPhoto(recordDate, mealId) {
  const database = await openLocalPhotoDatabase()
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(LOCAL_PHOTO_STORE_NAME, 'readwrite')
    transaction.objectStore(LOCAL_PHOTO_STORE_NAME).delete(localMealPhotoKey(recordDate, mealId))
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(new Error('无法删除本机照片'))
    transaction.onabort = () => reject(new Error('本机照片删除已取消'))
  })
}

async function replaceLocalMealPhotosForDate(recordDate, meals) {
  const database = await openLocalPhotoDatabase()
  await new Promise((resolve, reject) => {
    const transaction = database.transaction(LOCAL_PHOTO_STORE_NAME, 'readwrite')
    const store = transaction.objectStore(LOCAL_PHOTO_STORE_NAME)
    meals.forEach((meal) => {
      const key = localMealPhotoKey(recordDate, meal.id)
      store.delete(key)
      if (isSupportedLocalMealPhoto(meal.photo)) store.put({ key, recordDate, mealId: meal.id, photo: meal.photo })
    })
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(new Error('本机照片位置更新失败'))
    transaction.onabort = () => reject(new Error('本机照片位置更新已取消'))
  })
}

async function readIndexedMealPhotos() {
  const database = await openLocalPhotoDatabase()
  return new Promise((resolve, reject) => {
    const request = database.transaction(LOCAL_PHOTO_STORE_NAME, 'readonly').objectStore(LOCAL_PHOTO_STORE_NAME).getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(new Error('无法读取本机照片'))
  })
}

async function restoreLocalMealPhotos() {
  const migrationEntries = []
  Object.entries(pendingMealPhotoMigration).forEach(([recordDate, meals]) => {
    Object.entries(meals || {}).forEach(([mealId, photo]) => {
      if (isSupportedLocalMealPhoto(photo)) migrationEntries.push({ key: localMealPhotoKey(recordDate, mealId), recordDate, mealId, photo })
    })
  })
  await putLocalMealPhotos(migrationEntries)
  const indexedPhotos = await readIndexedMealPhotos()
  if (!localPhotoMigrationCorrupted) window.localStorage.removeItem(LOCAL_PHOTO_STORAGE_KEY)
  const photos = {}
  indexedPhotos.forEach(({ recordDate, mealId, photo }) => {
    if (!recordDate || !mealId || !isSupportedLocalMealPhoto(photo)) return
    if (!photos[recordDate]) photos[recordDate] = {}
    photos[recordDate][mealId] = photo
  })
  applyLocalMealPhotos(state.dailyRecords, photos)
  pendingMealPhotoMigration = {}
  persistState()
  loadSelectedDate()
  if (localPhotoMigrationCorrupted) showToast('照片索引异常，照片记录已保留在本机')
}

function dailyRecordsWithoutPhotos(records = state.dailyRecords) {
  return JSON.parse(JSON.stringify(records || {}, (key, value) => key === 'photo' ? undefined : value))
}

function applyLocalMealPhotos(records, photos) {
  Object.entries(records || {}).forEach(([recordDate, record]) => {
    const photosForDate = photos?.[recordDate]
    if (!photosForDate) return
    ;[...(record.meals || []), ...(record.hiddenMeals || []), ...(record.plannedMeals || [])].forEach((meal) => {
      if (meal?.id && isSupportedLocalMealPhoto(photosForDate[meal.id])) meal.photo = photosForDate[meal.id]
    })
  })
}

function slimeChoiceGeometry(count, fromIndex, toIndex, gap = 0, inset = 0) {
  const occupied = inset * 2 + Math.max(0, count - 1) * gap
  const width = `calc((100% - ${occupied}px) / ${count})`
  const position = (index) => `calc(${inset + index * gap}px + ${index} * ((100% - ${occupied}px) / ${count}))`
  return {
    width,
    from: position(fromIndex),
    mid: position((fromIndex + toIndex) / 2),
    to: position(toIndex),
    inset
  }
}

function slimeChoiceStyle(geometry) {
  return `--slime-width:${geometry.width};--slime-from:${geometry.from};--slime-mid:${geometry.mid};--slime-to:${geometry.to};--slime-inset:${geometry.inset}px`
}

function slimeMotionClass(fromIndex, toIndex) {
  if (fromIndex === toIndex) return ''
  return `shifting ${toIndex > fromIndex ? 'shift-right' : 'shift-left'}`
}

function moveSlimeIndicator(container, fromIndex, toIndex, count, gap = 0, inset = 0) {
  const geometry = slimeChoiceGeometry(count, fromIndex, toIndex, gap, inset)
  Object.entries({
    '--slime-width': geometry.width,
    '--slime-from': geometry.from,
    '--slime-mid': geometry.mid,
    '--slime-to': geometry.to,
    '--slime-inset': `${geometry.inset}px`
  }).forEach(([name, value]) => container.style.setProperty(name, value))
  const indicator = container.querySelector('.choice-slime')
  if (!indicator) return
  indicator.classList.remove('shifting', 'shift-left', 'shift-right')
  indicator.style.left = geometry.from
  void indicator.offsetWidth
  indicator.style.removeProperty('left')
  const classes = slimeMotionClass(fromIndex, toIndex).split(' ').filter(Boolean)
  if (classes.length) indicator.classList.add(...classes)
}

function motionEnabled() {
  return !reducedMotionQuery.matches
}

function animatePageSelection(pageName, direction) {
  if (!motionEnabled()) return
  const page = document.querySelector(`[data-page="${pageName}"]`)
  if (page) {
    page.classList.remove('page-entering')
    page.style.setProperty('--page-enter-x', `${direction * 9}px`)
    void page.offsetWidth
    page.classList.add('page-entering')
    window.setTimeout(() => page.classList.remove('page-entering'), 220)
  }
}

function playCheckInCelebration(anchor) {
  if (!motionEnabled() || !motionLayer || !appShell || !anchor) return
  const anchorRect = anchor.getBoundingClientRect()
  const shellRect = appShell.getBoundingClientRect()
  const burst = document.createElement('span')
  burst.className = 'checkin-burst'
  burst.style.left = `${anchorRect.left - shellRect.left + anchorRect.width / 2}px`
  burst.style.top = `${anchorRect.top - shellRect.top + anchorRect.height / 2}px`
  burst.innerHTML = `<i class="checkin-halo"></i><i class="checkin-core">${completionCheckSvg()}</i>`
  const colors = ['var(--pine)', 'var(--carbs)', 'var(--protein)', 'var(--fat)']
  Array.from({ length: 18 }, (_, index) => {
    const angle = (-165 + index * 20) * Math.PI / 180
    const distance = 42 + index % 4 * 10
    const dx = Math.cos(angle) * distance
    const dy = Math.sin(angle) * distance
    const piece = document.createElement('i')
    piece.className = `confetti-piece shape-${index % 3}`
    piece.style.setProperty('--piece-color', colors[index % colors.length])
    piece.style.setProperty('--piece-x', `${dx.toFixed(1)}px`)
    piece.style.setProperty('--piece-mid-y', `${(dy - 15).toFixed(1)}px`)
    piece.style.setProperty('--piece-end-y', `${(dy + 18).toFixed(1)}px`)
    piece.style.setProperty('--piece-spin', `${index % 2 ? 210 + index * 13 : -190 - index * 11}deg`)
    piece.style.setProperty('--piece-delay', `${index % 5 * 15}ms`)
    burst.appendChild(piece)
  })
  motionLayer.appendChild(burst)
  const summaryCard = document.querySelector('.summary-card')
  summaryCard?.classList.remove('checkin-updated')
  if (summaryCard) {
    void summaryCard.offsetWidth
    summaryCard.classList.add('checkin-updated')
  }
  window.setTimeout(() => {
    burst.remove()
    summaryCard?.classList.remove('checkin-updated')
  }, 980)
}

function animateShoppingChecks(foodIds, checked, stagger = false) {
  if (!motionEnabled()) return
  requestAnimationFrame(() => {
    foodIds.forEach((foodId, index) => {
      const item = document.querySelector(`[data-shopping-row="${foodId}"]`)
      if (!item) return
      item.style.setProperty('--check-delay', `${stagger ? index * 42 : 0}ms`)
      item.classList.add(checked ? 'just-checked' : 'just-unchecked')
    })
  })
}

function mealSlotsForDay(dayType = state.day) {
  return mealSlotsFromPlans(dayType, state.mealPlans)
}

function allMealSlots() {
  return ['training', 'rest'].flatMap((dayType) => state.mealPlans[dayType].meals.map((meal) => ({ ...meal, dayType })))
}

function mealSlotById(mealId) {
  return allMealSlots().find((meal) => meal.id === mealId)
}

function normalizeMealType(mealType, label = '') {
  if (mealTypeOptions.some((option) => option.id === mealType)) return mealType
  const source = String(label)
  if (source.includes('早餐')) return 'breakfast'
  if (source.includes('午餐') || source.includes('中餐') || source.includes('中饭')) return 'lunch'
  if (source.includes('晚餐') || source.includes('晚饭')) return 'dinner'
  if (mealType === 'preworkout' || mealType === 'postworkout') return 'snack'
  if (source.includes('练前') || source.includes('练后') || source.includes('加餐') || source.includes('补充餐')) return 'snack'
  return 'snack'
}

function normalizeMealTiming(timingType, label = '') {
  if (timingType === 'preworkout' || timingType === 'postworkout') return timingType
  const source = String(label)
  if (source.includes('练前')) return 'preworkout'
  if (source.includes('练后')) return 'postworkout'
  return ''
}

function mealTypeForSlot(slot, fallbackIndex = 0) {
  if (!slot) return mealTypeOptions[Math.min(fallbackIndex, mealTypeOptions.length - 1)].id
  return normalizeMealType(slot.mealType, slot.name)
}

function mealTypeForSet(set) {
  return normalizeMealType(set.mealType, mealSlotById(set.sourceMealId)?.name || set.name)
}

function mealTypesForSet(set) {
  const values = Array.isArray(set.mealTypes) ? set.mealTypes : []
  const valid = mealTypeOptions.filter(option => values.includes(option.id)).map(option => option.id)
  return valid.length ? valid : [mealTypeForSet(set)]
}

function mealTypeName(mealType) {
  return mealTypeOptions.find((option) => option.id === normalizeMealType(mealType))?.name || '加餐'
}

function mealTimingName(timingType) {
  return mealTimingOptions.find((option) => option.id === normalizeMealTiming(timingType))?.name || ''
}

function mealDisplayName(mealType, timingType = '') {
  const primary = mealTypeName(mealType)
  const timing = normalizeMealTiming(timingType)
  if (!timing) return primary
  return `${primary} · ${mealTimingName(timing)}`
}

function mealSlotForType(dayType, mealType) {
  const slots = mealSlotsForDay(dayType)
  const allowed = mealTypeOptionsForDay(dayType)
  const normalizedType = allowed.some((option) => option.id === normalizeMealType(mealType)) ? normalizeMealType(mealType) : allowed[0].id
  return slots.find((slot, index) => mealTypeForSlot(slot, index) === normalizedType) || slots[0]
}

function mealKeyFromRef(mealRef) {
  if (typeof mealRef === 'number') return state.meals[mealRef]?.id || mealSlotsForDay()[mealRef]?.id
  return mealRef
}

function recentItemsForMeal(mealRef) {
  const mealId = mealKeyFromRef(mealRef)
  if (!state.recentByMeal[mealId]) state.recentByMeal[mealId] = []
  return state.recentByMeal[mealId]
}

const MEAL_COMMON_SCORING = Object.freeze({
  frequencyHalfLifeDays: 30,
  recencyHalfLifeDays: 7,
  recencyWeight: 2,
  presetBonus: 0.3,
  visibleLimit: 4
})

function mealUsageStats(item = {}, now = Date.now()) {
  const rawCount = Number(item.useCount)
  const rawTime = Number(item.lastUsed)
  const useCount = Number.isFinite(rawCount) ? Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, Math.floor(rawCount))) : 0
  const lastUsed = Number.isFinite(rawTime) && rawTime > 0 ? Math.min(now, rawTime) : 0
  // Undated preset/legacy entries are retained, but never counted as a recent use.
  const ageDays = lastUsed ? Math.max(0, now - lastUsed) / 86400000 : Infinity
  const frequency = Math.log2(1 + useCount) * 2 ** (-ageDays / MEAL_COMMON_SCORING.frequencyHalfLifeDays)
  const recency = MEAL_COMMON_SCORING.recencyWeight * 2 ** (-ageDays / MEAL_COMMON_SCORING.recencyHalfLifeDays)
  return { useCount, lastUsed, score: frequency + recency }
}

function rankedRecentItemsForMeal(mealRef, now = Date.now()) {
  return recentItemsForMeal(mealRef).map((item, index) => ({ item, index, ...mealUsageStats(item, now) }))
    .sort((a, b) => b.score - a.score || b.lastUsed - a.lastUsed || b.useCount - a.useCount || a.index - b.index)
    .map(({ item }) => item)
}

function amountHistoryForMeal(mealRef) {
  const mealId = mealKeyFromRef(mealRef)
  if (!state.amountHistoryByMeal[mealId]) state.amountHistoryByMeal[mealId] = {}
  return state.amountHistoryByMeal[mealId]
}

function allMethods() {
  return [...methods, ...state.customMethods]
}

function methodById(methodId) {
  return allMethods().find((method) => method.id === methodId) || methods[0]
}

function normalizeDayType(dayType) {
  return dayType === 'rest' || dayType === 'low' ? 'rest' : 'training'
}

function isKingMethod(methodId = state.methodId) {
  const method = methodById(methodId)
  return ['king', 'king-redistributed'].includes(method.id) || ['king', 'king-redistributed'].includes(method.baseId)
}

function isHeatRedistributionMethod(methodId = state.methodId) {
  const method = methodById(methodId)
  return method.id === 'king' || method.baseId === 'king'
}

function normalizeCarbonLevel(level, fallbackDayType = 'training') {
  if (carbonDayOptions.some((option) => option.id === level)) return level
  return normalizeDayType(fallbackDayType) === 'rest' ? 'low' : 'medium'
}

function methodDayOptions(methodId = state.methodId) {
  return isKingMethod(methodId) ? carbonDayOptions : dayTypeOptions
}

function nutritionDayType(dayType, methodId = state.methodId) {
  return isKingMethod(methodId) ? normalizeCarbonLevel(dayType, dayType) : normalizeDayType(dayType)
}

function nutritionDayTypeName(dayType, methodId = state.methodId, short = false) {
  if (!isKingMethod(methodId)) return dayTypeName(dayType)
  const option = carbonDayOptions.find((item) => item.id === normalizeCarbonLevel(dayType, dayType)) || carbonDayOptions[1]
  return short ? option.shortName : option.name
}

function mapBinaryPlanToCarbon(plan) {
  let trainingIndex = 0
  return plan.map((day, index) => {
    const binaryType = normalizeDayType(day.dayType)
    const carbonLevel = binaryType === 'rest' ? 'low' : trainingIndex++ % 2 === 0 ? 'high' : 'medium'
    return {
      day: String(index + 1),
      dayType: normalizeDayType(carbonLevel),
      carbonLevel,
      type: nutritionDayTypeName(carbonLevel, 'king'),
      enabled: true
    }
  })
}

function mapCarbonPlanToBinary(plan) {
  return plan.map((day, index) => {
    const dayType = normalizeDayType(day.carbonLevel || day.dayType)
    return { day: String(index + 1), dayType, type: dayTypeName(dayType), enabled: true }
  })
}

function ensureCarbonCyclePlan() {
  if (!state.carbonCyclePlan?.length || !state.schedulePlanCustomized.carbon) state.carbonCyclePlan = defaultCarbonCyclePlan()
  return state.carbonCyclePlan
}

function defaultCarbonCyclePlan() {
  return ['high','low','medium','high','low','medium','medium'].map((carbonLevel,index)=>({
    day:String(index+1), dayType:normalizeDayType(carbonLevel), carbonLevel,
    type:nutritionDayTypeName(carbonLevel,'king'), enabled:true
  }))
}

function scheduleDayValue(day, methodId = state.methodId) {
  return isKingMethod(methodId) ? normalizeCarbonLevel(day?.carbonLevel, day?.dayType) : normalizeDayType(day?.dayType)
}

function scheduleDayName(day, methodId = state.methodId, short = false) {
  return nutritionDayTypeName(scheduleDayValue(day, methodId), methodId, short)
}

function normalizeMethodConfig(config) {
  if (config.days) return config
  if (config.mode === 'percentage') {
    return {
      mode: 'percentage',
      days: {
        training: { calories: config.calories, percentages: { ...config.percentages } },
        rest: { calories: Math.round(config.calories * baseTargets.rest.calories / baseTargets.training.calories), percentages: { ...config.percentages } }
      }
    }
  }
  const restRatios = {
    carbs: baseTargets.rest.carbs / baseTargets.training.carbs,
    protein: baseTargets.rest.protein / baseTargets.training.protein,
    fat: baseTargets.rest.fat / baseTargets.training.fat
  }
  return {
    mode: 'multiplier',
    days: {
      training: { multipliers: { ...config.multipliers } },
      rest: { multipliers: Object.fromEntries(Object.entries(config.multipliers).map(([key, value]) => [key, rounded(value * restRatios[key])])) }
    }
  }
}

function normalizeKingMethodConfig(config) {
  const normalized = normalizeMethodConfig(config)
  if (normalized.days.low && normalized.days.medium && normalized.days.high) return normalized
  const training = normalized.days.training || normalized.days.medium || normalized.days.high
  const rest = normalized.days.rest || normalized.days.low || training
  return {
    ...normalized,
    days: {
      low: JSON.parse(JSON.stringify(rest)),
      medium: JSON.parse(JSON.stringify(training)),
      high: JSON.parse(JSON.stringify(training))
    }
  }
}

function heatDistributionDefaults() {
  return {
    high: { count: 2, carbs: 50, fat: 15 },
    medium: { count: 3, carbs: 35, fat: 35 },
    low: { count: 2, carbs: 15, fat: 50 }
  }
}

function normalizeHeatRedistributionConfig(config) {
  const defaults = heatDistributionDefaults()
  const fallback = {
    mode: 'weekly-distribution',
    baseMultipliers: { ...kingBaseMultipliers() },
    distribution: JSON.parse(JSON.stringify(defaults))
  }
  if (!config || typeof config !== 'object') return fallback
  if (config.mode === 'weekly-distribution') {
    return {
      mode: 'weekly-distribution',
      baseMultipliers: Object.fromEntries(['carbs', 'protein', 'fat'].map((key) => [
        key,
        oneDecimal(config.baseMultipliers?.[key], 0, 10) || fallback.baseMultipliers[key]
      ])),
      distribution: Object.fromEntries(['high', 'medium', 'low'].map((level) => [level, {
        count: defaults[level].count,
        carbs: oneDecimal(config.distribution?.[level]?.carbs ?? defaults[level].carbs, 0, 100),
        fat: oneDecimal(config.distribution?.[level]?.fat ?? defaults[level].fat, 0, 100)
      }]))
    }
  }
  const normalized = normalizeKingMethodConfig(config)
  if (normalized.mode !== 'multiplier') return fallback
  const counts = { high: 2, medium: 3, low: 2 }
  const weeklyCoefficients = Object.fromEntries(['carbs', 'protein', 'fat'].map((key) => [key,
    ['high', 'medium', 'low'].reduce((sum, level) => sum + (Number(normalized.days[level]?.multipliers?.[key]) || 0) * counts[level], 0)
  ]))
  return {
    mode: 'weekly-distribution',
    baseMultipliers: Object.fromEntries(['carbs', 'protein', 'fat'].map((key) => [key,
      oneDecimal(weeklyCoefficients[key] / 7, 0, 10) || fallback.baseMultipliers[key]
    ])),
    distribution: Object.fromEntries(['high', 'medium', 'low'].map((level) => [level, {
      count: counts[level],
      carbs: weeklyCoefficients.carbs > 0
        ? oneDecimal((Number(normalized.days[level]?.multipliers?.carbs) || 0) * counts[level] / weeklyCoefficients.carbs * 100, 0, 100)
        : defaults[level].carbs,
      fat: weeklyCoefficients.fat > 0
        ? oneDecimal((Number(normalized.days[level]?.multipliers?.fat) || 0) * counts[level] / weeklyCoefficients.fat * 100, 0, 100)
        : defaults[level].fat
    }]))
  }
}

function methodConfigForId(methodId) {
  if (methodId === 'standard') {
    const dynamicConfig = standardFormulaConfig()
    const savedOverride = state.methodOverrides[methodId] ? normalizeMethodConfig(state.methodOverrides[methodId]) : null
    if (savedOverride) {
      ;['training', 'rest'].forEach((dayType) => {
        if (savedOverride.days[dayType]?.caloriesCustomized && Number(savedOverride.days[dayType]?.calories) > 0) {
          dynamicConfig.days[dayType].calories = Number(savedOverride.days[dayType].calories)
          dynamicConfig.days[dayType].caloriesCustomized = true
        }
        dynamicConfig.days[dayType].percentages = { ...(savedOverride.days[dayType]?.percentages || dynamicConfig.days[dayType].percentages) }
      })
    }
    return dynamicConfig
  }
  if (state.methodOverrides[methodId]) return isHeatRedistributionMethod(methodId)
    ? normalizeHeatRedistributionConfig(state.methodOverrides[methodId])
    : isKingMethod(methodId) ? normalizeKingMethodConfig(state.methodOverrides[methodId]) : normalizeMethodConfig(state.methodOverrides[methodId])
  const customConfig = state.customMethods.find((method) => method.id === methodId)?.target
  if (customConfig) return isHeatRedistributionMethod(methodId)
    ? normalizeHeatRedistributionConfig(customConfig)
    : isKingMethod(methodId) ? normalizeKingMethodConfig(customConfig) : normalizeMethodConfig(customConfig)
  return formulaEditableConfig(methodId)
}

function installRequestedRecipeSeeds() {
  const installedVersion=Number(state.requestedRecipeVersion)||0
  if(installedVersion>=REQUESTED_RECIPE_VERSION)return
  // One-time additive upgrade. Never overwrite a user recipe or resurrect a deleted entry.
  for(const recipe of requestedRecipeDefaults) {
    if(recipe.requestedRecipeVersion<=installedVersion)continue
    if(state.deletedFoodIds.includes(recipe.id))continue
    const match=foods.find(food=>food.id===recipe.id||((food.kind==='dish')===(recipe.kind==='dish')&&catalogFoodKey(food.name)===catalogFoodKey(recipe.name)))
    if(match) { if(match.id!==recipe.id)foodIdRedirects[recipe.id]=match.id; continue }
    const added=JSON.parse(JSON.stringify(recipe))
    if(added.recipe) {
      added.recipe.ingredients=added.recipe.ingredients.map(item=>{
        const current=foodById(item.foodId)
        return current?{...item,foodId:current.id,...nutrientSnapshot(current)}:item
      })
      Object.assign(added,calculateDishNutrition(added.recipe.ingredients,added.recipe.yieldWeight).per100)
    }
    foods.push(added)
  }
  if(installedVersion<3)upgradeRequestedRecipeDetails()
  state.requestedRecipeVersion=REQUESTED_RECIPE_VERSION
}

function upgradeRequestedRecipeDetails() {
  for(const definition of requestedRecipeDefaults.filter(food=>food.kind==='dish')) {
    const food=foods.find(item=>item.id===definition.id)
    if(!food?.recipe)continue
    food.recipe.notes=conciseRequestedRecipeNotes(food.recipe.notes)
    food.nutritionEstimate=definition.nutritionEstimate
  }
  const chicken=foods.find(food=>food.id==='dish-cunlv-koji-chicken')
  const koji=foodById('dish-cunlv-salt-koji')
  if(!chicken?.recipe||!koji) return
  const recipe=chicken.recipe
  const existing=recipe.ingredients.find(item=>canonicalFoodId(item.foodId)===koji.id||item.name==='盐曲')
  if(!existing) {
    const prepared=recipe.preparation?.find(item=>item.name==='盐曲')
    const meat=recipe.ingredients.find(item=>/鸡胸/.test(item.name))
    const amount=Number(prepared?.amount)||(Number(meat?.amount)||200)*0.1
    recipe.ingredients.push(dishIngredient(koji,Math.round(amount*10)/10))
  }
  recipe.preparation=(recipe.preparation||[]).filter(item=>item.name!=='盐曲')
  recipe.notes=recipe.notes.split('\n').filter(line=>!line.startsWith('盐曲单独制作（固定一罐配方')).join('\n')
  const calculated=calculateDishNutrition(recipe.ingredients,recipe.yieldWeight)
  if(calculated)Object.assign(chicken,calculated.per100)
}

function restorePersistentState() {
  const localPhotos = readLocalMealPhotos()
  pendingMealPhotoMigration = localPhotos
  try {
    const rawSaved = window.localStorage.getItem(STORAGE_KEY)
    const saved = JSON.parse(rawSaved || 'null')
    if (saved && typeof COMPOSITION_CATALOG_VERSION !== 'undefined' && saved.compositionVersion !== COMPOSITION_CATALOG_VERSION && !window.localStorage.getItem(`${STORAGE_KEY}-before-catalog`)) {
      try { window.localStorage.setItem(`${STORAGE_KEY}-before-catalog`, rawSaved) }
      catch { console.warn('本地空间不足，未能额外复制升级前备份；继续读取原记录') }
    }
    if (saved && typeof COMPOSITION_CATALOG_VERSION !== 'undefined' && saved.compositionVersion !== COMPOSITION_CATALOG_VERSION && !window.localStorage.getItem(`${STORAGE_KEY}-before-${COMPOSITION_CATALOG_VERSION}`)) {
      try { window.localStorage.setItem(`${STORAGE_KEY}-before-${COMPOSITION_CATALOG_VERSION}`, rawSaved) }
      catch { console.warn('本地空间不足，未能复制本次目录精简前备份') }
    }
    ;['calm-path-demo-v5', 'calm-path-demo-v4', 'calm-path-demo-v3'].forEach((key) => window.localStorage.removeItem(key))
    if (!saved) { installRequestedRecipeSeeds(); return }
    state.requestedRecipeVersion=Number(saved.requestedRecipeVersion)||0
    if (saved.mealPlans?.training?.meals && saved.mealPlans?.rest?.meals && saved.foodDataVersion >= FOOD_DATA_VERSION) state.mealPlans = cloneMealPlans(saved.mealPlans)
    const legacyPhotos = mealPhotoStore(saved.dailyRecords || {})
    if (saved.dailyRecords) state.dailyRecords = dailyRecordsWithoutPhotos(saved.dailyRecords)
    if (!saved.mealPlans && saved.mealStructure) {
      ;['training', 'rest'].forEach((dayType) => {
        saved.mealStructure.slice(0, state.mealPlans[dayType].count).forEach((meal, index) => {
          Object.assign(state.mealPlans[dayType].meals[index], { name: meal.name, time: meal.time })
        })
      })
    }
    if (saved.methodId) state.methodId = saved.methodId
    if (saved.pinnedFoodIds) state.pinnedFoodIds = saved.pinnedFoodIds
    if (saved.foodLibraryStages && typeof saved.foodLibraryStages === 'object') state.foodLibraryStages = saved.foodLibraryStages
    if (saved.foodPairNutrients && typeof saved.foodPairNutrients === 'object') state.foodPairNutrients = saved.foodPairNutrients
    if (saved.recentByMeal) {
      if (Array.isArray(saved.recentByMeal)) {
        ;['training', 'rest'].forEach((dayType) => mealSlotsForDay(dayType).forEach((meal, index) => {
          if (saved.recentByMeal[index]) state.recentByMeal[meal.id] = saved.recentByMeal[index]
        }))
      } else state.recentByMeal = { ...state.recentByMeal, ...saved.recentByMeal }
    }
    if (saved.amountHistoryByMeal) {
      if (Array.isArray(saved.amountHistoryByMeal)) {
        ;['training', 'rest'].forEach((dayType) => mealSlotsForDay(dayType).forEach((meal, index) => {
          if (saved.amountHistoryByMeal[index]) state.amountHistoryByMeal[meal.id] = saved.amountHistoryByMeal[index]
        }))
      } else state.amountHistoryByMeal = { ...state.amountHistoryByMeal, ...saved.amountHistoryByMeal }
    }
    if (saved.savedMealSets) state.savedMealSets = saved.savedMealSets.map((set) => ({ ...set, items: cloneItems(set.items || []) }))
    if (saved.preferredSetByMeal) state.preferredSetByMeal = { ...state.preferredSetByMeal, ...saved.preferredSetByMeal }
    if (saved.weekPlan) {
      state.weekPlan = saved.weekPlan.map((day) => ({
        ...day,
        dayType: normalizeDayType(day.dayType),
        type: normalizeDayType(day.dayType) === 'training' ? '训练日' : '休息日',
        enabled: true
      }))
    }
    const savedHasPreparedPlan = Object.values(saved.dailyRecords || {}).some((record) =>
      (record.plannedMeals || []).length || [...(record.meals || []), ...(record.hiddenMeals || [])].some((meal) => meal.isPlanned)
    )
    state.prepStartCustomized = saved.prepStartCustomized === true
    if (saved.cycleStartDate && (state.prepStartCustomized || savedHasPreparedPlan)) state.cycleStartDate = saved.cycleStartDate
    else state.cycleStartDate = APP_TODAY_KEY
    const savedCyclePlan = saved.scheduleMode === 'week' && saved.weekPlan?.length
      ? saved.weekPlan
      : saved.dayCyclePlan
    if (savedCyclePlan?.length) {
      state.dayCyclePlan = savedCyclePlan.slice(0, 90).map((day, index) => ({
        day: String(index + 1),
        dayType: normalizeDayType(day.dayType),
        type: normalizeDayType(day.dayType) === 'training' ? '训练日' : '休息日',
        enabled: true
      }))
    }
    if (saved.carbonCyclePlan?.length) {
      state.carbonCyclePlan = saved.carbonCyclePlan.slice(0, 90).map((day, index) => {
        const carbonLevel = normalizeCarbonLevel(day.carbonLevel, day.dayType)
        return {
          day: String(index + 1),
          dayType: normalizeDayType(carbonLevel),
          carbonLevel,
          type: nutritionDayTypeName(carbonLevel, 'king'),
          enabled: true
        }
      })
    }
    if (saved.schedulePlanCustomized) state.schedulePlanCustomized = { ...state.schedulePlanCustomized, ...saved.schedulePlanCustomized }
    else {
      if (saved.dayCyclePlan?.length || saved.weekPlan?.length) state.schedulePlanCustomized.binary = true
      if (saved.carbonCyclePlan?.length) state.schedulePlanCustomized.carbon = true
    }
    state.scheduleMode = 'cycle'
    if (saved.scheduleMealOverrides) state.scheduleMealOverrides = saved.scheduleMealOverrides
    if (saved.shoppingChecked) state.shoppingChecked = saved.shoppingChecked
    state.shoppingCompletionResetIds = normalizeShoppingCompletionResetIds(saved.shoppingCompletionResetIds)
    state.shoppingPurchases = normalizeShoppingPurchases(saved.shoppingPurchases)
    state.shoppingChannels = normalizeShoppingChannels(saved.shoppingChannels)
    state.foodWeightRules = normalizeWeightRules(saved.foodWeightRules)
    state.foodStatePairs = normalizeFoodStatePairs(saved.foodStatePairs)
    state.ledgerEnabled = saved.ledgerEnabled !== false
    if (saved.deletedFoodIds) state.deletedFoodIds = saved.deletedFoodIds
    if (Array.isArray(saved.foods) && typeof COMPOSITION_CATALOG_VERSION !== 'undefined' && saved.compositionVersion === COMPOSITION_CATALOG_VERSION) {
      // Respect an explicit library overwrite after migration; do not resurrect omitted foods.
      foods.splice(0, foods.length, ...saved.foods.map(food => ({ ...food })))
    } else if (saved.foods && saved.foodDataVersion >= FOOD_DATA_VERSION) {
      const defaultIds = new Set(foods.map((food) => food.id))
      const savedById = new Map(saved.foods.map((food) => [food.id, food]))
      const mergedDefaults = foods.map((food) => ({ ...food, ...(savedById.get(food.id) || {}) }))
      const savedCustomFoods = saved.foods.filter((food) => !defaultIds.has(food.id) && !REMOVED_DEFAULT_FOOD_IDS.has(food.id))
      foods.splice(0, foods.length, ...mergedDefaults, ...savedCustomFoods)
    } else if (saved.foods) {
      const defaultIds = new Set(foods.map((food) => food.id))
      foods.push(...saved.foods.filter((food) => !defaultIds.has(food.id) && !REMOVED_DEFAULT_FOOD_IDS.has(food.id)))
    }
    if (saved.bodyProfile) state.bodyProfile = { ...state.bodyProfile, ...saved.bodyProfile }
    state.weightUnit = normalizeWeightUnit(saved.weightUnit)
    state.bodyProfile.activityLevel = saved.activityFactorVersion === 2
      ? normalizeActivityLevel(state.bodyProfile.activityLevel)
      : Number.isFinite(Number(saved.bodyProfile?.weeklyTrainingHours))
        ? activityLevelForTrainingHours(saved.bodyProfile.weeklyTrainingHours)
        : normalizeActivityLevel(state.bodyProfile.activityLevel)
    state.standardDeficitSettings = normalizeStandardDeficitSettings(saved.standardDeficitSettings)
    if (saved.weightRecords) state.weightRecords = normalizeWeightRecords(saved.weightRecords)
    if (!state.weightRecords.length && saved.onboardingCompleted === true && Number.isFinite(Number(state.bodyProfile.weight))) {
      upsertWeightRecord(state.bodyProfile.weight, APP_TODAY.getTime(), 'profile')
    }
    // Health access is unavailable for this developer account. Ignore legacy opt-ins.
    state.healthAutoSyncEnabled = false
    if (saved.methodApplications) state.methodApplications = saved.methodApplications
    if (saved.methodOverrides) state.methodOverrides = saved.methodOverrides
    if (saved.customMethods) state.customMethods = migrateLegacyMethodNames(saved.customMethods)
    state.deletedMethodIds = Array.isArray(saved.deletedMethodIds) ? saved.deletedMethodIds.filter(id=>typeof id==='string') : []
    if(saved.methodNames && typeof saved.methodNames==='object') {
      for(const method of methods)if(typeof saved.methodNames[method.id]==='string'){
        const savedName = saved.methodNames[method.id] === '标准日常目标' && method.id === 'standard' ? '热量缺口法' : saved.methodNames[method.id]
        method.name=safeImportedText(savedName,method.name,24);state.methodNames[method.id]=method.name
      }
    }
    restoreProgramState(saved)
    removeRetiredDietMethodState()
    if (saved.theme) state.theme = saved.theme
    state.iconStyle = saved.iconStyle === 'pixel' ? 'pixel' : 'classic'
    if (!themes.some((theme) => theme.id === state.theme)) state.theme = 'calm'
    state.onboardingCompleted = saved.onboardingCompleted === true
    state.tourCompleted = saved.tourCompleted === true
    if (saved.defaultMealSets && saved.foodDataVersion >= FOOD_DATA_VERSION) {
      saved.defaultMealSets.forEach((set, index) => {
        if (defaultMealSets[index]) {
          defaultMealSets[index].name = set.name
          defaultMealSets[index].category = set.category === 'other' ? 'other' : 'default'
          defaultMealSets[index].archived = set.archived === true
          defaultMealSets[index].items = cloneItems(set.items)
          defaultMealSets[index].dayType = set.dayType || defaultMealSets[index].dayType
          defaultMealSets[index].mealType = set.mealType || mealTypeForSet(defaultMealSets[index])
          defaultMealSets[index].mealTypes = mealTypesForSet(set)
          defaultMealSets[index].sourceMealId = set.sourceMealId || defaultMealSets[index].sourceMealId
          defaultMealSets[index].applicableDayTypes = set.applicableDayTypes
          defaultMealSets[index].applicableCarbonLevels = set.applicableCarbonLevels
          defaultMealSets[index].applicabilityCustomized = set.applicabilityCustomized
          if (Number(saved.appStateVersion || 0) < APP_STATE_VERSION) {
            const universal = index < 3
            defaultMealSets[index].applicableDayTypes = universal ? ['training', 'rest'] : ['training']
            defaultMealSets[index].applicableCarbonLevels = universal ? ['low', 'medium', 'high'] : ['medium', 'high']
            defaultMealSets[index].applicabilityCustomized = { binary: true, carbon: true }
          }
        }
      })
    }
    migrateFoodCatalog(saved)
    installRequestedRecipeSeeds()
    Object.values(state.dailyRecords).forEach(normalizeDailyRecord)
    pendingMealPhotoMigration = mergeMealPhotoStores(localPhotos, legacyPhotos)
    applyLocalMealPhotos(state.dailyRecords, pendingMealPhotoMigration)
    if (!allMethods().some((method) => method.id === state.methodId)) state.methodId = 'standard'
  } catch (error) {
    console.warn('本地数据读取失败，备份仍保留', error?.message)
  }
}

function persistState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
    appStateVersion: APP_STATE_VERSION,
    requestedRecipeVersion: state.requestedRecipeVersion,
    dailyRecords: dailyRecordsWithoutPhotos(),
    methodId: state.methodId,
    pinnedFoodIds: state.pinnedFoodIds,
    foodLibraryStages: state.foodLibraryStages,
    foodPairNutrients: state.foodPairNutrients,
    recentByMeal: state.recentByMeal,
    amountHistoryByMeal: state.amountHistoryByMeal,
    savedMealSets: state.savedMealSets,
    preferredSetByMeal: state.preferredSetByMeal,
    weekPlan: state.weekPlan,
    scheduleMode: state.scheduleMode,
    cycleStartDate: state.cycleStartDate,
    prepStartCustomized: state.prepStartCustomized,
    dayCyclePlan: state.dayCyclePlan,
    carbonCyclePlan: state.carbonCyclePlan,
    schedulePlanCustomized: state.schedulePlanCustomized,
    scheduleMealOverrides: state.scheduleMealOverrides,
    shoppingChecked: state.shoppingChecked,
    shoppingCompletionResetIds: state.shoppingCompletionResetIds,
    shoppingPurchases: state.shoppingPurchases,
    shoppingChannels: state.shoppingChannels,
    foodWeightRules: state.foodWeightRules,
    foodStatePairs: state.foodStatePairs,
    ledgerEnabled: state.ledgerEnabled,
    deletedFoodIds: state.deletedFoodIds,
    foodDataVersion: FOOD_DATA_VERSION,
    compositionVersion: typeof COMPOSITION_CATALOG_VERSION === 'undefined' ? null : COMPOSITION_CATALOG_VERSION,
    foods,
    bodyProfile: state.bodyProfile,
    activityFactorVersion: 2,
    weightUnit: state.weightUnit,
    standardDeficitSettings: state.standardDeficitSettings,
    weightRecords: state.weightRecords,
    healthAutoSyncEnabled: false,
    methodApplications: state.methodApplications,
    programCoefficients: state.programCoefficients || {},
    reviewSettings: state.reviewSettings,
    dietReviews: state.dietReviews,
    legacyProgramOverrides: state.legacyProgramOverrides,
    methodOverrides: state.methodOverrides,
    customMethods: state.customMethods,
    deletedMethodIds: state.deletedMethodIds,
    methodNames: state.methodNames,
    theme: state.theme,
    iconStyle: state.iconStyle,
    mealPlans: state.mealPlans,
    defaultMealSets,
    onboardingCompleted: state.onboardingCompleted,
    tourCompleted: state.tourCompleted
  }))
  publishDailyWidgetSnapshot()
}

function dailyWidgetSnapshot() {
  const date = new Date()
  const key = dateKey(date)
  const record = state.dailyRecords[key]
  const dayType = record?.day || plannedDayTypeForDate(date)
  const nutritionDay = isKingMethod() ? normalizeCarbonLevel(record?.carbonLevel, dayType) : normalizeDayType(dayType)
  const target = targetForDayType(nutritionDay, state.methodId, date)
  const meals = record?.meals?.length ? record.meals : buildMeals([], dayType, state.mealPlans)
  const recordedMeals = [...meals, ...(record?.hiddenMeals || [])].filter(meal => meal.items?.length && !meal.isPlanned)
  const total = nutrientsForItems(recordedMeals.flatMap(meal => meal.items))
  return {
    date: key,
    dateLabel: `${date.getMonth() + 1}月${date.getDate()}日`,
    calories: Math.round(total.calories), targetCalories: Math.round(target.calories),
    carbs: Math.round(total.carbs), protein: Math.round(total.protein), fat: Math.round(total.fat),
    hasRecorded: recordedMeals.length > 0,
    meals: meals.slice(0, 5).map(meal => ({
      id: meal.id, name: meal.name, time: meal.time,
      calories: meal.items?.length && !meal.isPlanned ? Math.round(mealNutrients(meal).calories) : 0,
      status: meal.isPlanned ? '待打卡' : meal.items?.length ? '已记录' : '待记录'
    }))
  }
}

function publishDailyWidgetSnapshot() {
  try { window.dailyWidgetBridge?.updateSnapshot(JSON.stringify(dailyWidgetSnapshot())) } catch (_) { /* Web preview has no native widget bridge. */ }
}

window.publishDailyWidgetSnapshot = publishDailyWidgetSnapshot
window.onNativeAppForeground = publishDailyWidgetSnapshot
window.handleDailyWidgetAction = (request) => {
  if (!state.onboardingCompleted) return
  const action = request?.action === 'meal' ? 'meal' : 'overview'
  if (sheet.getAttribute('aria-hidden') === 'false') closeSheet()
  if (!mealSetPage.hidden) closeMealSetPage()
  if (!optionalSettingsPage.hidden) closeOptionalSettingsPage()
  const today = new Date()
  state.dayOffset = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12) -
    new Date(APP_TODAY.getFullYear(), APP_TODAY.getMonth(), APP_TODAY.getDate(), 12)) / 86400000)
  state.selectedCalendarDate = dateKey(today)
  loadSelectedDate()
  switchPage('today')
  if (action === 'meal') {
    const index = state.meals.findIndex(meal => meal.id === request.mealId)
    if (index < 0) return
    const meal = state.meals[index]
    if (meal.items?.length && !meal.isPlanned) openMealEditorSheet(index)
    else openFoodSheet(index)
  } else if (!state.meals.some(meal => meal.items?.length && !meal.isPlanned)) {
    openFoodSheet(0)
  }
}

function backupStateSnapshot() {
  return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')
}

function backupSectionData(sectionId, snapshot = backupStateSnapshot()) {
  if (sectionId === 'layout') return spacingBackupData()
  if (sectionId === 'settings') {
    return {
      dailyRecords: dailyRecordsWithoutPhotos(snapshot.dailyRecords || {}),
      recentByMeal: snapshot.recentByMeal || {},
      amountHistoryByMeal: snapshot.amountHistoryByMeal || {},
      weekPlan: snapshot.weekPlan || [],
      scheduleMode: snapshot.scheduleMode || 'cycle',
      cycleStartDate: snapshot.cycleStartDate || APP_TODAY_KEY,
      prepStartCustomized: snapshot.prepStartCustomized === true,
      dayCyclePlan: snapshot.dayCyclePlan || [],
      carbonCyclePlan: snapshot.carbonCyclePlan || null,
      schedulePlanCustomized: snapshot.schedulePlanCustomized || {},
      scheduleMealOverrides: snapshot.scheduleMealOverrides || {},
      shoppingChecked: snapshot.shoppingChecked || [],
      shoppingCompletionResetIds: normalizeShoppingCompletionResetIds(snapshot.shoppingCompletionResetIds),
      shoppingPurchases: normalizeShoppingPurchases(snapshot.shoppingPurchases),
      ...(Array.isArray(snapshot.shoppingChannels)?{shoppingChannels:normalizeShoppingChannels(snapshot.shoppingChannels)}:{}),
      ...(Array.isArray(snapshot.foodWeightRules) ? {foodWeightRules: normalizeWeightRules(snapshot.foodWeightRules)} : {}),
      ...(Array.isArray(snapshot.foodStatePairs) ? {foodStatePairs: normalizeFoodStatePairs(snapshot.foodStatePairs)} : {}),
      ...(typeof snapshot.ledgerEnabled === 'boolean' ? {ledgerEnabled: snapshot.ledgerEnabled} : {}),
      weightUnit: normalizeWeightUnit(snapshot.weightUnit),
      theme: snapshot.theme || 'calm',
      iconStyle: snapshot.iconStyle === 'pixel' ? 'pixel' : 'classic',
      mealPlans: snapshot.mealPlans || cloneMealPlans(initialMealPlans),
      healthAutoSyncEnabled: false,
      onboardingCompleted: snapshot.onboardingCompleted === true,
      tourCompleted: snapshot.tourCompleted === true
    }
  }
  if (sectionId === 'userInfo') {
    return {
      activityFactorVersion: snapshot.activityFactorVersion === 2 ? 2 : 1,
      bodyProfile: snapshot.bodyProfile || {},
      weightRecords: snapshot.weightRecords || []
    }
  }
  if (sectionId === 'foodLibrary') {
    return {
      foodDataVersion: snapshot.foodDataVersion || FOOD_DATA_VERSION,
      compositionVersion: snapshot.compositionVersion || null,
      foods: snapshot.foods || foods,
      deletedFoodIds: snapshot.deletedFoodIds || [],
      pinnedFoodIds: snapshot.pinnedFoodIds || [],
      foodLibraryStages: snapshot.foodLibraryStages || {},
      foodPairNutrients: snapshot.foodPairNutrients || {}
    }
  }
  if (sectionId === 'dietPlans') {
    return {
      methodId: snapshot.methodId || 'standard',
      standardDeficitSettings: snapshot.standardDeficitSettings || null,
      methodApplications: snapshot.methodApplications || {},
      programCoefficients: snapshot.programCoefficients || {},
      reviewSettings: snapshot.reviewSettings || {},
      dietReviews: snapshot.dietReviews || [],
      legacyProgramOverrides: snapshot.legacyProgramOverrides || {},
      methodOverrides: snapshot.methodOverrides || {},
      customMethods: snapshot.customMethods || []
    }
  }
  if (sectionId === 'mealPlans') {
    return {
      defaultMealSets: snapshot.defaultMealSets || defaultMealSets,
      savedMealSets: snapshot.savedMealSets || [],
      preferredSetByMeal: snapshot.preferredSetByMeal || {}
    }
  }
  return {}
}

function buildBackupDocument(sectionIds) {
  const selected = backupSectionOptions.map((option) => option.id).filter((id) => sectionIds.includes(id))
  const snapshot = backupStateSnapshot()
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: '食由己',
    exportedAt: new Date().toISOString(),
    sections: selected,
    data: Object.fromEntries(selected.map((id) => [id, backupSectionData(id, snapshot)]))
  }
}

function safeImportedText(value, fallback = '', maxLength = 60) {
  if (typeof value !== 'string') return fallback
  return value.replace(/[<>&'"\u0000-\u001F\u007F]/g, '').trim().slice(0, maxLength) || fallback
}

function validImportedFood(food) {
  if (!food || typeof food !== 'object') return null
  if (!food.recipe && food.kind !== 'dish' && ['calories','carbs','protein','fat'].some(key => !Number.isFinite(Number(food[key])) || Number(food[key]) < 0 || Number(food[key]) > (key === 'calories' ? 5000 : 100))) return null
  const id = safeImportedText(food.id, '', 80).replace(/[^a-zA-Z0-9_-]/g, '')
  const name = safeImportedText(food.name, '', 40)
  if (!id || !name) return null
  const category = ['carbs', 'protein', 'fiber', 'fat', 'other'].includes(food.category) ? food.category : 'other'
  const normalized = {
    ...food,
    id,
    name,
    category,
    symbol: safeImportedText(food.symbol, name.slice(0, 2), 4),
    calories: Math.max(0, Number(food.calories) || 0),
    carbs: Math.max(0, Number(food.carbs) || 0),
    protein: Math.max(0, Number(food.protein) || 0),
    fat: Math.max(0, Number(food.fat) || 0)
  }
  normalized.createdAt = Math.max(0, Number(food.createdAt) || 0)
  if (food.iconText) normalized.iconText = [...safeImportedText(food.iconText, '', 4)].slice(0, 2).join('')
  if (food.icon && /^[a-zA-Z0-9_-]+$/.test(food.icon)) normalized.icon = food.icon
  else delete normalized.icon
  normalized.useIcon = food.useIcon !== false
  if (typeof PixelArt !== 'undefined' && PixelArt.normalize(food.pixelArt)) normalized.pixelArt = PixelArt.normalize(food.pixelArt)
  else delete normalized.pixelArt
  if (typeof pixelIconById === 'function' && pixelIconById(food.pixelIcon)) normalized.pixelIcon = food.pixelIcon
  else delete normalized.pixelIcon
  if (['original', 'pixel-library', 'pixel-art'].includes(food.iconSource)) normalized.iconSource = food.iconSource
  else delete normalized.iconSource
  if (isSupportedLocalMealPhoto(food.customImage)) normalized.customImage = food.customImage
  else delete normalized.customImage
  if (food.kind === 'dish' || food.recipe) {
    const recipe = normalizeDishRecipe(food.recipe)
    if (!recipe) return null
    normalized.kind = 'dish'
    normalized.recipe = recipe
    Object.assign(normalized, calculateDishNutrition(recipe.ingredients,recipe.yieldWeight).per100)
  }
  return normalized
}

function validImportedMethod(method) {
  if (!method || typeof method !== 'object') return null
  const id = safeImportedText(method.id, '', 80).replace(/[^a-zA-Z0-9_-]/g, '')
  const name = safeImportedText(method.name, '', 40)
  if (!id || !name || !method.target || typeof method.target !== 'object') return null
  return {
    ...method,
    id,
    name,
    note: safeImportedText(method.note, '自定义饮食计划', 100),
    baseId: safeImportedText(method.baseId, 'standard', 80).replace(/[^a-zA-Z0-9_-]/g, '') || 'standard'
  }
}

function validImportedMealSet(set) {
  if (!set || typeof set !== 'object') return null
  const name = safeImportedText(set.name, '', 2000)
  const idFallback = `imported-${name.replace(/[^a-zA-Z0-9\u4E00-\u9FFF_-]/g, '').slice(0, 24) || Date.now()}`
  const id = safeImportedText(set.id, idFallback, 80).replace(/[^a-zA-Z0-9\u4E00-\u9FFF_-]/g, '')
  if (!id || !name || !Array.isArray(set.items)) return null
  const items = set.items.slice(0, 80).map((item) => ({
    foodId: safeImportedText(item?.foodId, '', 80).replace(/[^a-zA-Z0-9_-]/g, ''),
    amount: Math.max(0, Math.min(10000, Number(item?.amount) || 0)),
    locked: item?.locked === true
  })).filter((item) => item.foodId && item.amount > 0)
  const applicableDayTypes = Array.isArray(set.applicableDayTypes) ? [...new Set(set.applicableDayTypes.map(normalizeDayType))] : undefined
  const applicableCarbonLevels = Array.isArray(set.applicableCarbonLevels) ? [...new Set(set.applicableCarbonLevels.map((level) => normalizeCarbonLevel(level)))] : undefined
  return {
    ...set,
    id,
    name,
    dayType: normalizeDayType(set.dayType),
    mealType: normalizeMealType(set.mealType, name),
    mealTypes: mealTypesForSet(set),
    sourceMealId: safeImportedText(set.sourceMealId, '', 80).replace(/[^a-zA-Z0-9_-]/g, ''),
    applicableDayTypes,
    applicableCarbonLevels,
    items
  }
}

function validImportedMealPlans(plans) {
  const fallback = cloneMealPlans(initialMealPlans)
  if (!plans || typeof plans !== 'object') return fallback
  ;['training', 'rest'].forEach((dayType) => {
    const source = plans[dayType]
    if (!source || !Array.isArray(source.meals)) return
    fallback[dayType] = {
      presetId: safeImportedText(source.presetId, dayType === 'training' ? 'custom' : 'rest', 40).replace(/[^a-zA-Z0-9_-]/g, ''),
      count: Math.max(2, Math.min(6, Number(source.count) || fallback[dayType].count)),
      tolerance: Math.max(0, Math.min(30, Number(source.tolerance) || 10)),
      meals: source.meals.slice(0, 6).map((meal, index) => ({
        id: safeImportedText(meal?.id, `${dayType}-${index + 1}`, 80).replace(/[^a-zA-Z0-9_-]/g, '') || `${dayType}-${index + 1}`,
        name: safeImportedText(meal?.name, index === 0 ? '早餐' : index === 1 ? '午餐' : index === 2 ? '晚餐' : '加餐', 30),
        time: /^([01]\d|2[0-3]):[0-5]\d$/.test(meal?.time || '') ? meal.time : `${Math.min(23, 8 + index * 4).toString().padStart(2, '0')}:00`,
        mealType: normalizeMealType(meal?.mealType, meal?.name),
        carbRatio: Math.max(0, Math.min(100, Number(meal?.carbRatio) || 0)),
        proteinRatio: Math.max(0, Math.min(100, Number(meal?.proteinRatio) || 0))
      }))
    }
  })
  return fallback
}

function validImportedBodyProfile(profile) {
  const current = state.bodyProfile
  if (!profile || typeof profile !== 'object') return { ...current }
  return {
    ...current,
    age: Math.max(1, Math.min(120, Number(profile.age) || current.age)),
    gender: ['female', 'male'].includes(profile.gender) ? profile.gender : current.gender,
    height: Math.max(50, Math.min(250, Number(profile.height) || current.height)),
    weight: Math.max(0.1, Math.min(500, Number(profile.weight) || current.weight)),
    goal: ['减脂', '增肌', '维持'].includes(profile.goal) ? profile.goal : current.goal,
    bodyType: ['ectomorph', 'mesomorph', 'endomorph'].includes(profile.bodyType) ? profile.bodyType : current.bodyType,
    weeklyTrainingHours: Math.max(0, Math.min(40, Number(profile.weeklyTrainingHours) || 0)),
    strengthMinutes: Math.max(0, Math.min(600, Number(profile.strengthMinutes) || 0)),
    strengthFactor: Math.max(0, Math.min(30, Number(profile.strengthFactor) || current.strengthFactor)),
    activityLevel: normalizeActivityLevel(profile.activityLevel)
  }
}

function backupSectionCount(sectionId, data) {
  if (sectionId === 'layout') return spacingBackupCount(data)
  if (sectionId === 'settings') return Object.keys(data?.dailyRecords || {}).length
  if (sectionId === 'userInfo') return (data?.weightRecords || []).length + (data?.bodyProfile ? 1 : 0)
  if (sectionId === 'foodLibrary') return (data?.foods || []).length
  if (sectionId === 'dietPlans') return methods.length + (data?.customMethods || []).length
  if (sectionId === 'mealPlans') return (data?.defaultMealSets || []).length + (data?.savedMealSets || []).length
  return 0
}

function legacyBackupDocument(parsed) {
  const knownKeys = ['dailyRecords', 'bodyProfile', 'foods', 'customMethods', 'savedMealSets', 'defaultMealSets']
  if (!spacingObject(parsed)) return null
  const hasRecords = knownKeys.some((key) => Object.prototype.hasOwnProperty.call(parsed, key))
  const hasLayout = ownsSpacingField(parsed, 'pageSpacing') || ownsSpacingField(parsed, 'legacySpacing')
  if (!hasRecords && !hasLayout) return null
  // Standalone spacing exports contain no business records. Old app backups
  // contain no layout: never fill their missing section from this device.
  const sections = backupSectionOptions.map((option) => option.id).filter(id => id === 'layout' ? hasLayout : hasRecords)
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    app: '食由己',
    exportedAt: '',
    sections,
    data: Object.fromEntries(sections.map((id) => [id, id === 'layout' ? normalizeSpacingBackup(parsed) : backupSectionData(id, parsed)]))
  }
}

function parseBackupDocument(text) {
  if (typeof text !== 'string' || !text.trim()) throw new Error('JSON 内容为空')
  if (text.length > MAX_BACKUP_TEXT_LENGTH) throw new Error('JSON 超过 5MB，请减少导出内容')
  const parsed = JSON.parse(text)
  const document = parsed?.format === BACKUP_FORMAT ? parsed : legacyBackupDocument(parsed)
  if (!document || document.version !== BACKUP_VERSION || !spacingObject(document.data) || !Array.isArray(document.sections)) {
    throw new Error('不是可识别的食由己 JSON 备份')
  }
  const sections = backupSectionOptions.map((option) => option.id).filter((id) => document.sections.includes(id) && ownsSpacingField(document.data, id) && (id === 'layout' || document.data[id]))
  if (!sections.length) throw new Error('JSON 中没有可导入的数据')
  const data = { ...document.data }
  if (sections.includes('layout')) data.layout = normalizeSpacingBackup(data.layout)
  return { ...document, sections, data }
}

function mergeUniqueStrings(current, imported) {
  return [...new Set([...(Array.isArray(current) ? current : []), ...(Array.isArray(imported) ? imported : [])].filter((item) => typeof item === 'string'))]
}

function mergeNamedItems(current, imported) {
  const existingIds = new Set(current.map((item) => item.id))
  const existingNames = new Set(current.map((item) => item.name))
  const additions = imported.filter((item) => !existingIds.has(item.id) && !existingNames.has(item.name))
  return { merged: [...current, ...additions], additions }
}

function importBackupSections(document, sectionIds, mode) {
  const overwrite = mode === 'overwrite'
  // Validate layout before any selected records are changed. A layout-only
  // transfer must not rewrite, repair or reload unrelated business data.
  const spacingPlan = sectionIds.includes('layout') ? prepareSpacingImport(document.data.layout, overwrite) : null
  if (spacingPlan && sectionIds.length === 1) return [commitSpacingImport(spacingPlan)]
  const results = []
  const localPhotos = mealPhotoStore(state.dailyRecords)
  const beforeFoods = foods.map(food => ({ ...food }))

  sectionIds.forEach((sectionId) => {
    const data = document.data[sectionId] || {}
    if (sectionId === 'settings') {
      const importedRecords = dailyRecordsWithoutPhotos(data.dailyRecords || {})
      const currentDates = new Set(Object.keys(state.dailyRecords))
      const addedDates = Object.keys(importedRecords).filter((date) => !currentDates.has(date))
      state.dailyRecords = overwrite ? importedRecords : { ...importedRecords, ...state.dailyRecords }
      applyLocalMealPhotos(state.dailyRecords, localPhotos)
      const channelMerge=Array.isArray(data.shoppingChannels)?overwrite?{channels:normalizeShoppingChannels(data.shoppingChannels),idMap:new Map()}:mergeShoppingChannels(state.shoppingChannels,data.shoppingChannels):null
      if(channelMerge)state.shoppingChannels=channelMerge.channels
      if (Array.isArray(data.shoppingPurchases)) {
        const incoming = normalizeShoppingPurchases(data.shoppingPurchases).map(row=>{
          const mapped=channelMerge?.idMap.get(row.channelId)||row.channelId
          const known=(state.shoppingChannels||[]).find(channel=>channel.id===mapped)||shoppingChannelForName(row.channelName)
          return known?{...row,channelId:known.id,channelName:known.name}:row
        })
        state.shoppingPurchases = overwrite ? incoming : normalizeShoppingPurchases([...state.shoppingPurchases, ...incoming])
      }
      if (Array.isArray(data.foodWeightRules)) {
        const rules=normalizeWeightRules(data.foodWeightRules)
        state.foodWeightRules=overwrite?rules:normalizeWeightRules([...(state.foodWeightRules||[]),...rules])
      }
      if (Array.isArray(data.foodStatePairs)) {
        const pairs=normalizeFoodStatePairs(data.foodStatePairs)
        state.foodStatePairs=overwrite?pairs:normalizeFoodStatePairs([...(state.foodStatePairs||[]),...pairs])
      }
      if (overwrite || !Object.keys(state.recentByMeal).length) state.recentByMeal = data.recentByMeal || {}
      else state.recentByMeal = { ...(data.recentByMeal || {}), ...state.recentByMeal }
      if (overwrite || !Object.keys(state.amountHistoryByMeal).length) state.amountHistoryByMeal = data.amountHistoryByMeal || {}
      else state.amountHistoryByMeal = { ...(data.amountHistoryByMeal || {}), ...state.amountHistoryByMeal }
      if (overwrite) {
        state.weightUnit = normalizeWeightUnit(data.weightUnit)
        if (typeof data.ledgerEnabled === 'boolean') state.ledgerEnabled = data.ledgerEnabled
        if (Array.isArray(data.weekPlan)) state.weekPlan = data.weekPlan.slice(0, 7).map((day, index) => ({ day: ['一','二','三','四','五','六','日'][index] || String(index + 1), dayType: normalizeDayType(day?.dayType), type: dayTypeName(day?.dayType), enabled: true }))
        if (typeof data.cycleStartDate === 'string') state.cycleStartDate = data.cycleStartDate
        state.prepStartCustomized = data.prepStartCustomized === true
        if (Array.isArray(data.dayCyclePlan) && data.dayCyclePlan.length) state.dayCyclePlan = data.dayCyclePlan.slice(0, 90)
        state.carbonCyclePlan = Array.isArray(data.carbonCyclePlan) ? data.carbonCyclePlan.slice(0, 90) : null
        if (data.schedulePlanCustomized) state.schedulePlanCustomized = { ...state.schedulePlanCustomized, ...data.schedulePlanCustomized }
        if (data.scheduleMealOverrides) state.scheduleMealOverrides = data.scheduleMealOverrides
        if (Array.isArray(data.shoppingChecked)) state.shoppingChecked = data.shoppingChecked
        state.shoppingCompletionResetIds = normalizeShoppingCompletionResetIds(data.shoppingCompletionResetIds)
        if (themes.some((theme) => theme.id === data.theme)) state.theme = data.theme
        state.iconStyle = data.iconStyle === 'pixel' ? 'pixel' : 'classic'
        if (data.mealPlans?.training?.meals && data.mealPlans?.rest?.meals) state.mealPlans = validImportedMealPlans(data.mealPlans)
        state.healthAutoSyncEnabled = false
      }
      results.push({ id: sectionId, name: '配置', count: overwrite ? Object.keys(importedRecords).length : addedDates.length, details: overwrite ? '已替换记录与设备配置' : `新增 ${addedDates.length} 个日期记录，原有配置保留` })
      return
    }

    if (sectionId === 'userInfo') {
      const importedWeights = normalizeWeightRecords(Array.isArray(data.weightRecords) ? data.weightRecords : [])
      const currentWeightKeys = new Set(state.weightRecords.map((record) => `${record.measuredAt || record.date}:${record.weight || record.kg}`))
      const addedWeights = importedWeights.filter((record) => !currentWeightKeys.has(`${record.measuredAt || record.date}:${record.weight || record.kg}`))
      if (overwrite && data.bodyProfile && typeof data.bodyProfile === 'object') {
        state.bodyProfile = validImportedBodyProfile(data.bodyProfile)
        if (data.activityFactorVersion !== 2 && Number.isFinite(Number(data.bodyProfile.weeklyTrainingHours))) {
          state.bodyProfile.activityLevel = activityLevelForTrainingHours(data.bodyProfile.weeklyTrainingHours)
        }
      }
      state.weightRecords = overwrite ? importedWeights : normalizeWeightRecords([...state.weightRecords, ...addedWeights])
      results.push({ id: sectionId, name: '用户信息', count: overwrite ? importedWeights.length : addedWeights.length, details: overwrite ? `身体参数已覆盖，导入 ${importedWeights.length} 条体重` : `新增 ${addedWeights.length} 条体重记录，当前身体参数保留` })
      return
    }

    if (sectionId === 'foodLibrary') {
      const importedFoods = (Array.isArray(data.foods) ? data.foods : []).slice(0, 5000).map(validImportedFood).filter(Boolean)
      const merged = mergeNamedItems(foods, importedFoods)
      foods.splice(0, foods.length, ...(overwrite && importedFoods.length ? importedFoods : merged.merged))
      state.deletedFoodIds = overwrite ? mergeUniqueStrings([], data.deletedFoodIds) : mergeUniqueStrings(state.deletedFoodIds, data.deletedFoodIds)
      state.pinnedFoodIds = overwrite ? mergeUniqueStrings([], data.pinnedFoodIds) : mergeUniqueStrings(state.pinnedFoodIds, data.pinnedFoodIds)
      if(data.foodLibraryStages && typeof data.foodLibraryStages==='object')state.foodLibraryStages={...(overwrite?{}:state.foodLibraryStages),...data.foodLibraryStages}
      if(data.foodPairNutrients && typeof data.foodPairNutrients==='object')state.foodPairNutrients={...(overwrite?{}:state.foodPairNutrients),...data.foodPairNutrients}
      const changed = overwrite ? importedFoods : merged.additions
      results.push({ id: sectionId, name: '食物库', count: changed.length, details: `${overwrite ? '覆盖' : '增加'} ${changed.length} 种食物${changed.length ? `：${changed.slice(0, 6).map((food) => food.name).join('、')}${changed.length > 6 ? '等' : ''}` : ''}` })
      return
    }

    if (sectionId === 'dietPlans') {
      const importedMethods = (Array.isArray(data.customMethods) ? data.customMethods : []).slice(0, 300).map(validImportedMethod).filter((method) => method && !isRetiredDietMethod(method))
      const merged = mergeNamedItems(state.customMethods, importedMethods)
      state.customMethods = overwrite ? importedMethods : merged.merged
      if (overwrite) {
        state.methodApplications = data.methodApplications && typeof data.methodApplications === 'object' ? data.methodApplications : {}
        state.methodOverrides = data.methodOverrides && typeof data.methodOverrides === 'object' ? data.methodOverrides : {}
        state.standardDeficitSettings = normalizeStandardDeficitSettings(data.standardDeficitSettings)
        restoreProgramState(data)
        const requestedMethod = safeImportedText(data.methodId, 'standard', 80).replace(/[^a-zA-Z0-9_-]/g, '')
        state.methodId = allMethods().some((method) => method.id === requestedMethod) ? requestedMethod : 'standard'
        removeRetiredDietMethodState()
      }
      const changed = overwrite ? importedMethods : merged.additions
      results.push({ id: sectionId, name: '饮食计划', count: changed.length, details: `${overwrite ? '覆盖' : '增加'} ${changed.length} 个自定义计划${changed.length ? `：${changed.slice(0, 5).map((method) => method.name).join('、')}${changed.length > 5 ? '等' : ''}` : ''}` })
      return
    }

    if (sectionId === 'mealPlans') {
      const importedSavedSets = (Array.isArray(data.savedMealSets) ? data.savedMealSets : []).slice(0, 500).map(validImportedMealSet).filter(Boolean)
      const importedDefaultSets = (Array.isArray(data.defaultMealSets) ? data.defaultMealSets : []).slice(0, 30).map(validImportedMealSet).filter(Boolean)
      const merged = mergeNamedItems(state.savedMealSets, importedSavedSets)
      state.savedMealSets = overwrite ? importedSavedSets : merged.merged
      if (overwrite && importedDefaultSets.length) defaultMealSets.splice(0, defaultMealSets.length, ...importedDefaultSets)
      if (overwrite) state.preferredSetByMeal = data.preferredSetByMeal && typeof data.preferredSetByMeal === 'object' ? data.preferredSetByMeal : {}
      const changed = overwrite ? [...importedDefaultSets, ...importedSavedSets] : merged.additions
      results.push({ id: sectionId, name: '套餐计划', count: changed.length, details: `${overwrite ? '覆盖' : '增加'} ${changed.length} 个套餐${changed.length ? `：${changed.slice(0, 5).map((set) => set.name).join('、')}${changed.length > 5 ? '等' : ''}` : ''}` })
    }
  })

  if (sectionIds.includes('foodLibrary') || sectionIds.includes('settings') || sectionIds.includes('mealPlans')) {
    // Repair identities before persisting. Preserve foods referenced by non-imported records/sets.
    repairCatalogImport(beforeFoods, document.data.foodLibrary, sectionIds.includes('settings'))
  }
  persistState()
  loadSelectedDate()
  renderFoodLibrary()
  renderPrep()
  renderTrends()
  updateSettingsSummaries()
  if (spacingPlan) {
    try { results.push(commitSpacingImport(spacingPlan)) }
    catch (error) { throw new Error(`其余所选数据已导入，但${error.message}。请单独重试页面边距。`) }
  }
  return results
}

async function nativeDataTransfer(method, ...args) {
  if (!window.dataTransferBridge || typeof window.dataTransferBridge[method] !== 'function') return null
  const raw = await window.dataTransferBridge[method](...args)
  return JSON.parse(raw)
}

async function copyBackupText(text) {
  const nativeResult = await nativeDataTransfer('copyJson', text)
  if (nativeResult) {
    if (!nativeResult.success) throw new Error(nativeResult.message || '复制失败')
    return
  }
  if (!navigator.clipboard?.writeText) throw new Error('当前环境不支持复制到剪贴板')
  await navigator.clipboard.writeText(text)
}

async function saveBackupFile(text) {
  const date = new Date().toISOString().slice(0, 10)
  const nativeResult = await nativeDataTransfer('exportJsonFile', text, `食由己备份-${date}.json`)
  if (nativeResult) {
    if (!nativeResult.success) throw new Error(nativeResult.message || '文件导出失败')
    return
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `食由己备份-${date}.json`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function readBackupFromFile() {
  const nativeResult = await nativeDataTransfer('importJsonFile')
  if (nativeResult) {
    if (!nativeResult.success) throw new Error(nativeResult.message || '文件读取失败')
    return nativeResult.text || ''
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = async () => {
      try {
        const file = input.files?.[0]
        if (!file) throw new Error('未选择 JSON 文件')
        if (file.size > MAX_BACKUP_TEXT_LENGTH) throw new Error('JSON 超过 5MB，请减少导出内容')
        resolve(await file.text())
      } catch (error) {
        reject(error)
      }
    }
    input.click()
  })
}

function rounded(value) {
  return Math.round(value * 10) / 10
}

function normalizeWeightUnit(value) {
  return value === 'jin' ? 'jin' : 'kg'
}

function bodyWeightUnitLabel() {
  return state.weightUnit === 'jin' ? '斤' : 'kg'
}

function bodyWeightDisplayValue(kg) {
  const value = Number(kg) * (state.weightUnit === 'jin' ? 2 : 1)
  return Math.round(value * 100) / 100
}

function bodyWeightFromDisplay(value) {
  return Math.round(Number(value) * (state.weightUnit === 'jin' ? 0.5 : 1) * 100) / 100
}

function formatBodyWeight(kg) {
  return `${bodyWeightDisplayValue(kg)} ${bodyWeightUnitLabel()}`
}

function bodyWeightInputBounds(minKg, maxKg) {
  return { min: bodyWeightDisplayValue(minKg), max: bodyWeightDisplayValue(maxKg) }
}

function oneDecimal(value, minimum = 0, maximum = Number.POSITIVE_INFINITY) {
  const numeric = Number(value)
  return rounded(Math.max(minimum, Math.min(maximum, Number.isFinite(numeric) ? numeric : minimum)))
}

function foodById(foodId) {
  return foods.find((food) => food.id === canonicalFoodId(foodId))
}

function selectableFoods() {
  return foods.filter((food) => !food.catalogArchived && !state.deletedFoodIds.includes(food.id))
}

function cloneItems(items) {
  return items.map((item) => {
    const copy={...item}
    if (item.weightEntries) copy.weightEntries=weightEntriesFor(item)
    return copy
  })
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character])
}

function nutritionGridHtml(nutrition, className = '') {
  if(nutrition?.id)nutrition=effectiveFoodNutrition(nutrition.id)||nutrition
  return `<span class="nutrition-values ${className}">
    <span class="calories"><b>${rounded(nutrition.calories)}</b><small>kcal</small></span>
    <span class="carbs"><b>${rounded(nutrition.carbs)}</b><small>碳</small></span>
    <span class="protein"><b>${rounded(nutrition.protein)}</b><small>蛋</small></span>
    <span class="fat"><b>${rounded(nutrition.fat)}</b><small>脂</small></span>
  </span>`
}

function snapPercentagesToFive(percentages) {
  const keys = ['carbs', 'protein', 'fat']
  return Object.fromEntries(keys.map((key) => [key, Math.max(0, Math.min(100, Math.round((percentages[key] || 0) / 5) * 5))]))
}

function wheelColumnHtml(label, values, currentValue, name, className = '') {
  if (!values.includes(currentValue)) values = [...values, currentValue].sort((left, right) => left - right)
  return `<div class="wheel-column ${className}"><span class="wheel-label">${label}</span><div class="wheel-scroll" data-wheel-scroll="${name}" data-wheel-selected="${currentValue}" role="listbox" aria-label="${label}">
    ${values.map((value) => `<button class="wheel-option ${value === currentValue ? 'active' : ''}" type="button" data-wheel-value="${value}" role="option" aria-selected="${value === currentValue}">${String(value).padStart(label === '小时' || label === '分钟' ? 2 : 1, '0')}</button>`).join('')}
  </div><input class="wheel-manual" hidden tabindex="-1" type="number" aria-label="输入${label}" min="${values[0]}" max="${label === '分钟' ? 59 : values[values.length - 1]}" step="1" value="${currentValue}"></div>`
}

function initializeWheelPickers(container, onChange) {
  container.querySelectorAll('[data-wheel-scroll]').forEach((scroll) => {
    const options = [...scroll.querySelectorAll('[data-wheel-value]')]
    const manual = scroll.parentElement.querySelector('.wheel-manual')
    const label = scroll.parentElement.querySelector('.wheel-label')
    if (label && manual) {
      label.dataset.editWheel = 'true'; label.title = '点击输入精确数值'
      label.onclick = () => openNumberKeypad(manual, scroll)
    }
    let animationFrame = 0
    let initializing = true
    const selectIndex = (index, notify = true) => {
      const safeIndex = Math.max(0, Math.min(options.length - 1, index))
      const selected = options[safeIndex]
      const value = Number(selected.dataset.wheelValue)
      if (String(value) === scroll.dataset.wheelSelected && selected.classList.contains('active')) return
      scroll.dataset.wheelSelected = String(value)
      if (manual) manual.value = value
      options.forEach((option, optionIndex) => {
        const active = optionIndex === safeIndex
        option.classList.toggle('active', active)
        option.setAttribute('aria-selected', String(active))
      })
      if (notify) onChange(scroll.dataset.wheelScroll, value, scroll)
    }
    requestAnimationFrame(() => {
      const selectedIndex = Math.max(0, options.findIndex((option) => option.dataset.wheelValue === scroll.dataset.wheelSelected))
      scroll.style.scrollBehavior = 'auto'
      scroll.scrollTop = selectedIndex * 34
      selectIndex(selectedIndex, false)
      requestAnimationFrame(() => {
        scroll.style.scrollBehavior = ''
        initializing = false
      })
    })
    scroll.addEventListener('scroll', () => {
      if (initializing) return
      cancelAnimationFrame(animationFrame)
      animationFrame = requestAnimationFrame(() => selectIndex(Math.round(scroll.scrollTop / 34)))
    }, { passive: true })
    let pointerStart = null
    scroll.addEventListener('pointerdown', (event) => { pointerStart = { x: event.clientX, y: event.clientY, top: scroll.scrollTop } }, { passive: true })
    scroll.addEventListener('click', (event) => {
      if (pointerStart && (Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 7 || Math.abs(scroll.scrollTop - pointerStart.top) > 7)) return
      if (manual) openNumberKeypad(manual, scroll)
    })
    const commitManualValue = () => {
      if (!manual || manual.value === '') return
      const value = Math.round(oneDecimal(manual.value, Number(manual.min), Number(manual.max)))
      manual.value = value
      let index = options.findIndex((option) => Number(option.dataset.wheelValue) === value)
      if (index < 0) {
        const button = document.createElement('button')
        button.type = 'button'
        button.className = 'wheel-option'
        button.tabIndex = -1
        button.dataset.wheelValue = String(value)
        button.textContent = String(value).padStart(['小时', '分钟'].includes(scroll.getAttribute('aria-label')) ? 2 : 1, '0')
        button.setAttribute('role', 'option')
        index = options.findIndex((option) => Number(option.dataset.wheelValue) > value)
        if (index < 0) index = options.length
        scroll.insertBefore(button, options[index] || null)
        options.splice(index, 0, button)
      }
      initializing = true
      selectIndex(index)
      scroll.style.scrollBehavior = 'auto'
      scroll.scrollTop = index * 34
      requestAnimationFrame(() => { scroll.style.scrollBehavior = ''; initializing = false })
    }
    manual?.addEventListener('input', commitManualValue)
    manual?.addEventListener('change', commitManualValue)
    options.forEach((option) => { option.tabIndex = -1 })
    scroll.tabIndex = 0
    scroll.setAttribute('aria-haspopup', 'dialog')
    scroll.title = '上下滑动调整，点击输入数字'
    scroll.addEventListener('keydown', (event) => {
      if (['Enter', ' '].includes(event.key)) { event.preventDefault(); if (manual) openNumberKeypad(manual, scroll); return }
      if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return
      event.preventDefault()
      const current = options.findIndex((option) => option.dataset.wheelValue === scroll.dataset.wheelSelected)
      const next = Math.max(0, Math.min(options.length - 1, current + (event.key === 'ArrowDown' ? 1 : -1)))
      selectIndex(next)
      // A confirm click must not commit an intermediate value during a smooth scroll.
      initializing = true
      cancelAnimationFrame(animationFrame)
      scroll.style.scrollBehavior = 'auto'
      scroll.scrollTop = next * 34
      requestAnimationFrame(() => { scroll.style.scrollBehavior = ''; initializing = false })
    })
  })
}

function foodLoggingControlsHtml(mealIndex, selectedFoodId, amount, prefix, foodOptions = selectableFoods().slice(0, 6), showPortion = true) {
  return `<div class="food-grid">
    ${foodOptions.map((food) => `<button class="food-option ${selectedFoodId === food.id ? 'selected' : ''}" type="button" data-${prefix}-food-choice="${food.id}">
      ${foodIconHtml(food, true)}<span class="food-option-copy"><strong>${food.name}</strong>${nutritionGridHtml(food, 'food-option-nutrition')}</span><span aria-hidden="true">＋</span>
    </button>`).join('')}
  </div>${showPortion ? `${prefix==='setlog'?foodStageToggleHtml(selectedFoodId):''}${foodPortionControlsHtml(mealIndex, selectedFoodId, amount, prefix)}` : ''}`
}

function foodPortionControlsHtml(mealIndex, selectedFoodId, amount, prefix) {
  const selectedFood = foodById(selectedFoodId)
  const recentAmounts = recentAmountsFor(mealIndex, selectedFoodId)
  return `<div class="quantity-panel">
    <div class="recent-amount-panel"><span>最近分量</span><div class="recent-amounts">${recentAmounts.length ? recentAmounts.map((savedAmount) => `<button class="${savedAmount === amount ? 'active' : ''}" type="button" data-${prefix}-amount-choice="${savedAmount}">${savedAmount}g</button>`).join('') : '<small>暂无</small>'}</div></div>
    <div class="current-amount-panel"><div><strong>${selectedFood.name}</strong><small>本次份量</small></div><div class="stepper amount-input-stepper"><button type="button" data-${prefix}-amount-step="-25" aria-label="减少份量">−</button><label><input data-${prefix}-amount-input type="number" min="0.1" max="3000" step="0.1" inputmode="decimal" value="${oneDecimal(amount, 0.1, 3000)}"><span>g</span></label><button type="button" data-${prefix}-amount-step="25" aria-label="增加份量">＋</button></div></div>
  </div>`
}

function directFoodLoggingControlsHtml(mealIndex, selectedFoodId, amount, prefix) {
  const selectedFood = foodById(selectedFoodId)
  const recentAmounts = recentAmountsFor(mealIndex, selectedFoodId)
  return `<div class="direct-food-record">
    <div class="direct-food-summary">${foodIconHtml(selectedFood, true)}<span><strong>${selectedFood.name}</strong>${nutritionGridHtml(selectedFood, 'food-option-nutrition')}</span></div>
    ${foodStageToggleHtml(selectedFoodId)}
    <div class="recent-amount-panel"><span>历史克重</span><div class="recent-amounts">${recentAmounts.length ? recentAmounts.map((savedAmount) => `<button class="${savedAmount === amount ? 'active' : ''}" type="button" data-${prefix}-amount-choice="${savedAmount}">${savedAmount}g</button>`).join('') : '<small>暂无记录</small>'}</div></div>
    <div class="current-amount-panel"><div><strong>本次份量</strong><small>按克记录</small></div><div class="stepper amount-input-stepper"><button type="button" data-${prefix}-amount-step="-25" aria-label="减少份量">−</button><label><input data-${prefix}-amount-input type="number" min="0.1" max="3000" step="0.1" inputmode="decimal" value="${oneDecimal(amount, 0.1, 3000)}"><span>g</span></label><button type="button" data-${prefix}-amount-step="25" aria-label="增加份量">＋</button></div></div>
  </div>`
}

function attachFoodLoggingControls(container, prefix, handlers) {
  container.querySelectorAll(`[data-${prefix}-food-choice]`).forEach((button) => button.addEventListener('click', () => handlers.selectFood(button.dataset[`${prefix}FoodChoice`])))
  container.querySelectorAll(`[data-${prefix}-amount-choice]`).forEach((button) => button.addEventListener('click', () => handlers.setAmount(Number(button.dataset[`${prefix}AmountChoice`]))))
  container.querySelectorAll(`[data-${prefix}-amount-input]`).forEach((input) => {
    const commit = () => {
      const nextAmount = oneDecimal(input.value, 0.1, 3000)
      input.value = nextAmount
      handlers.setAmount(nextAmount, false)
      container.querySelectorAll(`[data-${prefix}-amount-choice]`).forEach((choice) => choice.classList.toggle('active', Number(choice.dataset[`${prefix}AmountChoice`]) === nextAmount))
    }
    input.addEventListener('input', () => {
      const match = String(input.value).match(/^(\d*)(?:\.(\d*))?$/)
      if (match?.[2]?.length > 1) input.value = `${match[1]}.${match[2].slice(0, 1)}`
      const numeric = Number(input.value)
      if (Number.isFinite(numeric) && numeric > 0) handlers.setAmount(oneDecimal(numeric, 0.1, 3000), false)
    })
    input.addEventListener('change', commit)
    input.addEventListener('blur', commit)
  })
  container.querySelectorAll(`[data-${prefix}-amount-step]`).forEach((button) => button.addEventListener('click', () => {
    const nextAmount = oneDecimal(handlers.getAmount() + Number(button.dataset[`${prefix}AmountStep`]), 0.1, 3000)
    handlers.setAmount(nextAmount, false)
    const value = container.querySelector(`[data-${prefix}-amount-input]`)
    if (value) value.value = nextAmount
    container.querySelectorAll(`[data-${prefix}-amount-choice]`).forEach((choice) => choice.classList.toggle('active', Number(choice.dataset[`${prefix}AmountChoice`]) === nextAmount))
  }))
}

function addAmountToItems(items, foodId, amount, weightEntry = null) {
  const existing = items.find((item) => item.foodId === foodId)
  if (weightEntry) {
    const entry=normalizeWeightEntry(weightEntry,foodId)
    if (!entry || Math.abs(entry.amount-amount)>0.001 || (existing?.amount||0)+amount>3000 || weightEntriesFor(existing||{foodId,amount:0}).length>=200) throw new Error('换算后本餐同食物不能超过3000g或200次记录')
    if (existing) {
      existing.weightEntries=[...weightEntriesFor(existing),entry];existing.amount+=amount
      existing.nutritionSnapshot=validNutrientSnapshot(existing.nutritionSnapshot)||nutrientSnapshot(effectiveFoodNutrition(foodId))
    } else items.push({foodId,amount,weightEntries:[entry],nutritionSnapshot:nutrientSnapshot(effectiveFoodNutrition(foodId))})
  } else if (existing) existing.amount = existing.weightEntries?.length ? Math.min(3000,existing.amount+oneDecimal(amount,0.1,3000)) : oneDecimal(existing.amount + amount, 0.1, 3000)
  else items.push({ foodId, amount: oneDecimal(amount, 0.1, 3000),nutritionSnapshot:nutrientSnapshot(effectiveFoodNutrition(foodId)) })
}

function binaryApplicationsForSet(set) {
  if (set.applicableDayTypes?.length) return [...new Set(set.applicableDayTypes.map(normalizeDayType))]
  return [normalizeDayType(set.dayType)]
}

function carbonApplicationsFromBinary(dayTypes) {
  const result = []
  if (dayTypes.some((dayType) => normalizeDayType(dayType) === 'rest')) result.push('low')
  if (dayTypes.some((dayType) => normalizeDayType(dayType) === 'training')) result.push('medium', 'high')
  return result
}

function binaryApplicationsFromCarbon(levels) {
  const result = []
  if (levels.some((level) => normalizeCarbonLevel(level, level) === 'low')) result.push('rest')
  if (levels.some((level) => ['medium', 'high'].includes(normalizeCarbonLevel(level, level)))) result.push('training')
  return result
}

function carbonApplicationsForSet(set) {
  if (set.applicableCarbonLevels?.length) return [...new Set(set.applicableCarbonLevels.map((level) => normalizeCarbonLevel(level, set.dayType)))]
  return carbonApplicationsFromBinary(binaryApplicationsForSet(set))
}

function setApplicationValues(set, methodId = state.methodId) {
  return isKingMethod(methodId) ? carbonApplicationsForSet(set) : binaryApplicationsForSet(set)
}

function setAppliesTo(set, dayType, methodId = state.methodId) {
  const target = nutritionDayType(dayType, methodId)
  return setApplicationValues(set, methodId).includes(target)
}

function updateSetApplications(set, values, mode = isKingMethod() ? 'carbon' : 'binary') {
  const normalizedValues = mode === 'carbon'
    ? [...new Set(values.map((value) => normalizeCarbonLevel(value, value)))]
    : [...new Set(values.map(normalizeDayType))]
  const customized = { binary: false, carbon: false, ...(set.applicabilityCustomized || {}) }
  if (mode === 'carbon') {
    set.applicableCarbonLevels = normalizedValues
    customized.carbon = true
    if (!customized.binary) set.applicableDayTypes = binaryApplicationsFromCarbon(normalizedValues)
  } else {
    set.applicableDayTypes = normalizedValues
    customized.binary = true
    if (!customized.carbon) set.applicableCarbonLevels = carbonApplicationsFromBinary(normalizedValues)
  }
  set.applicabilityCustomized = customized
  set.dayType = normalizeDayType(normalizedValues[0])
}

function setApplicationLabel(set, methodId = state.methodId) {
  return setApplicationValues(set, methodId).map((value) => nutritionDayTypeName(value, methodId, isKingMethod(methodId))).join('、')
}

function availableMealSets() {
  return [
    ...defaultMealSets.map((set, index) => ({ ...set, category: set.category === 'other' ? 'other' : 'default', mealType: mealTypeForSet(set), id: `default-${index}`, source: '预设' })),
    ...state.savedMealSets.map((set) => ({ ...set, category: set.category === 'default' ? 'default' : 'other', mealType: mealTypeForSet(set), source: '其他套餐' }))
  ].filter(set => !set.archived).map(set => ({ ...set, source: set.category === 'default' ? '默认套餐' : '其他套餐' }))
}

function compatibleMealSets(dayType, mealType) {
  const normalizedMeal = normalizeMealType(mealType)
  return availableMealSets().filter((set) => setAppliesTo(set, dayType) && mealTypesForSet(set).includes(normalizedMeal))
}

function mealSetById(setId) {
  return availableMealSets().find((set) => set.id === setId)
}

function preferredMealSet(mealIndex) {
  const mealId = state.meals[mealIndex]?.id
  return mealSetById(state.preferredSetByMeal[mealId]) || mealSetById(`default-${mealIndex}`)
}

function preferredMealSetForSlot(mealId, fallbackIndex = 0) {
  const slot = mealSlotById(mealId)
  const dayType = normalizeDayType(slot?.dayType || String(mealId).split('-')[0])
  const mealType = mealTypeForSlot(slot, fallbackIndex)
  const preferred = mealSetById(state.preferredSetByMeal[mealId])
  if (preferred && setAppliesTo(preferred, dayType) && mealTypesForSet(preferred).includes(mealType)) return preferred
  return compatibleMealSets(dayType, mealType).find(set => set.category === 'default')
}

function recentAmountsFor(mealRef, foodId) {
  return (amountHistoryForMeal(mealRef)[foodId] || []).slice(0, 2)
}

function normalizeDailyRecord(record) {
  record.day = normalizeDayType(record.day)
  if (record.carbonLevel) record.carbonLevel = normalizeCarbonLevel(record.carbonLevel, record.day)
  if (Array.isArray(record.mealSlots)) {
    const ids = new Set()
    record.mealSlots = record.mealSlots.filter(slot => slot && typeof slot.id === 'string' && !ids.has(slot.id) && ids.add(slot.id)).map(slot => ({
      ...slot, name: safeImportedText(slot.name,'加餐',30),
      time: /^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time || '') ? slot.time : '12:00',
      mealType: normalizeMealType(slot.mealType,slot.name), timingType: normalizeMealTiming(slot.timingType,slot.name)
    }))
    if (!record.mealSlots.length) delete record.mealSlots
  }
  const savedMeals = [...(Array.isArray(record.meals) ? record.meals : []), ...(Array.isArray(record.hiddenMeals) ? record.hiddenMeals : [])]
  const mealsById = new Map(savedMeals.filter((meal) => meal.id).map((meal) => [meal.id, meal]))
  const plannedById = new Map((record.plannedMeals || []).filter((meal) => meal.id).map((meal) => [meal.id, meal]))
  const activeSlots = Array.isArray(record.mealSlots) && record.mealSlots.length
    ? record.mealSlots : mealSlotsForDay(record.day)
  const activeIds = new Set(activeSlots.map((slot) => slot.id))
  record.hiddenMeals = savedMeals.filter((meal) => meal.id && !activeIds.has(meal.id)).map((meal) => ({ ...meal, items: cloneItems(meal.items || []) }))
  record.meals = activeSlots.map((slot, index) => {
    const savedMeal = mealsById.get(slot.id) || (record.mealSlots ? null : savedMeals[index])
    const plannedMeal = plannedById.get(slot.id)
    const hasActualRecord = Boolean(savedMeal?.items?.length && !savedMeal.isPlanned)
    const normalized = {
      ...slot,
      items: cloneItems(hasActualRecord ? savedMeal.items : plannedMeal?.items || savedMeal?.items || [])
    }
    if (savedMeal?.photo) normalized.photo = savedMeal.photo
    if (!hasActualRecord && normalized.items.length && (plannedMeal || savedMeal?.isPlanned)) normalized.isPlanned = true
    return normalized
  })
}

function markMealAsRecorded(mealIndex) {
  const meal = state.meals[mealIndex]
  if (!meal) return
  delete meal.isPlanned
  stampMealCostBasis(meal,dateKey(selectedDate()))
  const record = ensureSelectedDateRecord()
  record.meals = state.meals
  record.plannedMeals = (record.plannedMeals || []).filter((planned) => planned.id !== meal.id)
}

function completionCheckSvg() {
  return '<svg class="completion-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 12 4 4 8-8"/></svg>'
}

function checkInPlannedMeal(mealIndex, originElement) {
  const meal = state.meals[mealIndex]
  if (!meal?.isPlanned) return
  const row = originElement?.closest?.('[data-meal-row]')
  delete meal.isPlanned
  stampMealCostBasis(meal,dateKey(selectedDate()))
  const record = ensureSelectedDateRecord()
  record.plannedMeals = (record.plannedMeals || []).filter((planned) => planned.id !== meal.id)
  record.meals = state.meals
  // Empty meal slots are not pending check-ins; hidden planned meals still are.
  const plannedMealsComplete = ![...state.meals, ...(record.hiddenMeals || [])].some(item => item.isPlanned)
    && !record.plannedMeals.length
  if (plannedMealsComplete) playCheckInCelebration(originElement)
  row?.classList.remove('planned-meal')
  const overlay = row?.querySelector('.planned-checkin-overlay')
  if (overlay && motionEnabled()) {
    overlay.disabled = true
    overlay.setAttribute('aria-hidden', 'true')
    overlay.classList.add('checkin-leaving')
    row.classList.add('meal-checked-in')
    window.setTimeout(() => { overlay.remove(); row.classList.remove('meal-checked-in') }, 320)
  } else overlay?.remove()
  updateSummary()
  renderTrends()
  persistState()
  if (plannedMealsComplete) {
    const shareData = dailyShareData()
    showToast(shareData.complete ? '当日打卡完成' : '预定餐打卡完成', () => openDailySharePage(shareData), '分享')
  } else showToast(`${meal.name}已打卡并计入当日记录`)
}

function nutrientsForItems(items) {
  return items.reduce((total, item) => {
    const food = validNutrientSnapshot(item.nutritionSnapshot) || effectiveFoodNutrition(item.foodId)
    if (!food) return total
    const ratio = item.amount / 100
    total.calories += food.calories * ratio
    total.protein += food.protein * ratio
    total.carbs += food.carbs * ratio
    total.fat += food.fat * ratio
    return total
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
}

function mealNutrients(meal) {
  return nutrientsForItems(meal.items)
}

function totals() {
  return state.meals.filter((meal) => !meal.isPlanned).reduce((sum, meal) => {
    const mealTotal = mealNutrients(meal)
    return {
      calories: sum.calories + mealTotal.calories,
      protein: sum.protein + mealTotal.protein,
      carbs: sum.carbs + mealTotal.carbs,
      fat: sum.fat + mealTotal.fat
    }
  }, { calories: 0, protein: 0, carbs: 0, fat: 0 })
}

function bmrForProfile() {
  const profile = state.bodyProfile
  return profile.weight * 9.99 + profile.height * 6.25 - profile.age * 4.92 + (profile.gender === 'female' ? -161 : 5)
}

const activityFactorOptions = [
  { id: 'sedentary', label: '久坐型', detail: '久坐，每天走路 <5000 步，无额外运动', hours: '≤ 3 小时', factor: 1.2 },
  { id: 'light', label: '轻活动', detail: '每天走路 5000–8000 步，久坐为主，或每周 1–3 次轻度运动', hours: '≤ 5 小时', factor: 1.35 },
  { id: 'moderate', label: '中活动', detail: '每天走路 8000–12000 步，或每周 3–5 次中度运动（如慢跑 30 分钟、瑜伽、通勤骑车）', hours: '≤ 7 小时', factor: 1.55 },
  { id: 'high', label: '高活动', detail: '每天走路 >12000 步，或每周 6–7 次中度运动，或 3–5 次高强度运动（如快跑、力量训练）', hours: '＞ 7 小时', factor: 1.75 }
]

function activityLevelForTrainingHours(hours) {
  const value = Number(hours) || 0
  return value <= 3 ? 'sedentary' : value <= 5 ? 'light' : value <= 7 ? 'moderate' : 'high'
}

function activityIndexForProfile() {
  return Math.max(0, activityFactorOptions.findIndex(option => option.id === normalizeActivityLevel(state.bodyProfile.activityLevel)))
}

function normalizeActivityLevel(value) {
  return activityFactorOptions.some(option => option.id === value) ? value : 'light'
}

function activityFactorForProfile() {
  return activityFactorOptions.find(option => option.id === normalizeActivityLevel(state.bodyProfile.activityLevel)) || activityFactorOptions[1]
}

function normalizeStandardDeficitSettings(value) {
  const raw = value && typeof value === 'object' ? value : {}
  const defaults = { carbs: 50, protein: 30, fat: 20 }
  const normalizePercentages = (source, fallback) => {
    const percentages = Object.fromEntries(['carbs', 'protein', 'fat'].map(key => [key, Math.round(Number(source?.[key]))]))
    return Object.values(percentages).every(number => Number.isFinite(number) && number >= 5) && Object.values(percentages).reduce((sum, number) => sum + number, 0) === 100 ? percentages : { ...fallback }
  }
  const manualCalories = value => value === null || value === undefined || value === '' ? null : Number.isFinite(Number(value)) ? Math.max(500, Math.min(5000, Math.round(Number(value)))) : null
  const percentages = normalizePercentages(raw.percentages, defaults)
  return {
    deficit: Math.max(300, Math.min(500, Math.round(Number(raw.deficit) || 400))),
    percentages,
    manualCalories: manualCalories(raw.manualCalories),
    separateDays: raw.separateDays === true,
    days: Object.fromEntries(['training', 'rest'].map(day => [day, {
      calories: manualCalories(raw.days?.[day]?.calories),
      percentages: normalizePercentages(raw.days?.[day]?.percentages, percentages)
    }]))
  }
}

function standardFormulaConfig() {
  const bmr = bmrForProfile()
  const factor = activityFactorForProfile().factor
  const settings = normalizeStandardDeficitSettings(state.standardDeficitSettings)
  const suggestedCalories = Math.max(500, Math.round(bmr * factor - settings.deficit))
  return {
    mode: 'percentage',
    days: Object.fromEntries(['training', 'rest'].map(day => [day, settings.separateDays
      ? { calories: settings.days[day].calories ?? suggestedCalories, percentages: { ...settings.days[day].percentages } }
      : { calories: settings.manualCalories ?? suggestedCalories, percentages: { ...settings.percentages } }
    ]))
  }
}

function macroTarget(carbs, protein, fat, calories = null) {
  return {
    calories: Math.round(calories ?? (carbs * 4 + protein * 4 + fat * 9)),
    carbs: Math.round(carbs),
    protein: Math.round(protein),
    fat: Math.round(fat)
  }
}

function songQuotaForProfile(profile = state.bodyProfile) {
  const gender = profile.gender === 'female' ? 'female' : 'male'
  const tableKey = profile.goal === '增肌'
    ? 'gain'
    : normalizeActivityLevel(profile.activityLevel) === 'sedentary' ? 'untrained' : 'cut'
  const table = songQuotaTables[gender][tableKey]
  let matched = null

  table.rows.forEach(([weight, ...cells]) => {
    cells.forEach((values, columnIndex) => {
      if (!values) return
      const height = table.heights[columnIndex]
      const score = ((Number(profile.weight) - weight) / 5) ** 2 + ((Number(profile.height) - height) / 5) ** 2
      if (!matched || score < matched.score) matched = { values, weight, height, score }
    })
  })

  const [trainingCarbs, secondValue, thirdValue] = matched.values
  return {
    tableKey,
    matchedWeight: matched.weight,
    matchedHeight: matched.height,
    trainingCarbs,
    restCarbs: tableKey === 'untrained' ? trainingCarbs : secondValue,
    protein: tableKey === 'untrained' ? secondValue : thirdValue
  }
}

function kingBaseMultipliers() {
  const profile = state.bodyProfile
  return profile.bodyType === 'endomorph'
    ? { carbs: 2, protein: 1.5, fat: 0.8 }
    : { carbs: 3, protein: 1.5, fat: 1 }
}

function kingDistribution(dayType, config = null) {
  const level = normalizeCarbonLevel(dayType, dayType)
  const defaults = heatDistributionDefaults()[level]
  const saved = config?.distribution?.[level]
  return {
    level,
    count: defaults.count,
    carbs: oneDecimal(saved?.carbs ?? defaults.carbs, 0, 100) / 100,
    fat: oneDecimal(saved?.fat ?? defaults.fat, 0, 100) / 100
  }
}

function heatDistributionTotals(config) {
  return {
    carbs: oneDecimal(['high', 'medium', 'low'].reduce((sum, level) => sum + Number(config.distribution[level].carbs || 0), 0), 0, 300),
    fat: oneDecimal(['high', 'medium', 'low'].reduce((sum, level) => sum + Number(config.distribution[level].fat || 0), 0), 0, 300)
  }
}

function kingOriginalTarget(dayType, config = null) {
  const weight = state.bodyProfile.weight
  const normalizedConfig = config ? normalizeHeatRedistributionConfig(config) : null
  const base = normalizedConfig?.baseMultipliers || kingBaseMultipliers()
  const distribution = kingDistribution(dayType, normalizedConfig)
  return macroTarget(
    weight * base.carbs * 7 * distribution.carbs / distribution.count,
    weight * base.protein,
    weight * base.fat * 7 * distribution.fat / distribution.count
  )
}

function kingRedistributedMultipliers(dayType) {
  const base = kingBaseMultipliers()
  const distribution = kingDistribution(dayType)
  return {
    carbs: Math.round(base.carbs * 7 * distribution.carbs / distribution.count * 1000) / 1000,
    protein: base.protein,
    fat: Math.round(base.fat * 7 * distribution.fat / distribution.count * 1000) / 1000
  }
}

function tanDynamicMultipliers() {
  const index = activityIndexForProfile()
  const male = [
    { carbs: 2.2, protein: 1.4, fat: 0.8 },
    { carbs: 2.5, protein: 1.6, fat: 0.9 },
    { carbs: 3, protein: 1.7, fat: 1 },
    { carbs: 3.5, protein: 1.8, fat: 1 }
  ]
  const female = [
    { carbs: 2, protein: 1.4, fat: 1 },
    { carbs: 2.2, protein: 1.6, fat: 1.05 },
    { carbs: 2.5, protein: 1.7, fat: 1.1 },
    { carbs: 3, protein: 1.8, fat: 1.15 }
  ]
  return { ...(state.bodyProfile.gender === 'female' ? female[index] : male[index]) }
}

function parseLocalDate(value) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function normalizeDirectFoodDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return APP_TODAY_KEY
  if (value < DIRECT_FOOD_DATE_MIN) return DIRECT_FOOD_DATE_MIN
  if (value > DIRECT_FOOD_DATE_MAX) return DIRECT_FOOD_DATE_MAX
  return value
}

function programDay(methodId, date = selectedDate()) {
  const start = state.methodApplications[methodId]?.start
  if (!start) return 1
  const difference = Math.floor((date.setHours(12, 0, 0, 0) - parseLocalDate(start).setHours(12, 0, 0, 0)) / 86400000)
  return Math.max(1, difference + 1)
}

function tanFixedMultipliers(date = selectedDate(), methodId = 'fixed') {
  const day = Math.min(40, programDay(methodId, new Date(date)))
  const female = state.bodyProfile.gender === 'female'
  if (day <= 11) return { carbs: 3, protein: 1.4, fat: female ? 0.5 : 0.4, stage: '第 1–11 天' }
  if (day === 12) return { carbs: 5, protein: 1, fat: female ? 0.5 : 0.4, stage: '第 12 天高碳' }
  if (day <= 23) return { carbs: 2.5, protein: 1.6, fat: female ? 0.6 : 0.4, stage: '第 13–23 天' }
  if (day === 24) return { carbs: 6, protein: 1.2, fat: female ? 0.6 : 0.5, stage: '第 24 天高碳' }
  if (day <= 35) return { carbs: 2, protein: 1.8, fat: female ? 0.6 : 0.5, stage: '第 25–35 天' }
  if (day === 36) return { carbs: 6, protein: 1.2, fat: female ? 0.6 : 0.5, stage: '第 36 天高碳' }
  return { carbs: 2, protein: 1.8, fat: female ? 0.6 : 0.5, stage: '第 37–40 天' }
}

function formulaMultipliers(methodId, dayType) {
  if (methodId === 'king' || methodId === 'king-redistributed') return kingRedistributedMultipliers(dayType)
  if (methodId === 'dynamic') return tanDynamicMultipliers()
  if (methodId === 'fixed') return tanFixedMultipliers()
  return null
}

function formulaTarget(dayType, methodId) {
  const targetType = nutritionDayType(dayType, methodId)
  const normalizedType = normalizeDayType(targetType)
  const profile = state.bodyProfile
  const weight = profile.weight
  if (methodId === 'standard') {
    const dayConfig = standardFormulaConfig().days[normalizedType]
    const calories = dayConfig.calories
    return {
      calories,
      carbs: Math.round(calories * dayConfig.percentages.carbs / 100 / 4),
      protein: Math.round(calories * dayConfig.percentages.protein / 100 / 4),
      fat: Math.round(calories * dayConfig.percentages.fat / 100 / 9)
    }
  }
  if (methodId === 'song') {
    const gaining = profile.goal === '增肌'
    const quota = songQuotaForProfile(profile)
    const training = normalizedType === 'training' && quota.tableKey !== 'untrained'
    const carbs = weight * (training ? quota.trainingCarbs : quota.restCarbs)
    const protein = weight * quota.protein
    const fat = profile.gender === 'female' ? (gaining ? 70 : 50) : (gaining ? 80 : weight >= 120 ? 70 : 60)
    return macroTarget(carbs, protein, fat)
  }
  if (methodId === 'king') return kingOriginalTarget(targetType)
  const multipliers = formulaMultipliers(methodId, targetType)
  return macroTarget(weight * multipliers.carbs, weight * multipliers.protein, weight * multipliers.fat)
}

function formulaEditableConfig(methodId) {
  if (isHeatRedistributionMethod(methodId)) return normalizeHeatRedistributionConfig(null)
  const options = methodDayOptions(methodId)
  return {
    mode: 'multiplier',
    days: Object.fromEntries(options.map((option) => {
      const target = formulaTarget(option.id, methodId)
      return [option.id, { multipliers: {
        carbs: rounded(target.carbs / state.bodyProfile.weight),
        protein: rounded(target.protein / state.bodyProfile.weight),
        fat: rounded(target.fat / state.bodyProfile.weight)
      } }]
    }))
  }
}

function methodTargetValues(dayType = state.day, methodId = state.methodId, configOverride = null, date = selectedDate()) {
  if (isDatedProgram(methodId)) return datedProgramTarget(methodId, date)
  return applyReviewAdjustment(baseMethodTargetValues(dayType, methodId, configOverride), methodId, date)
}

function baseMethodTargetValues(dayType = state.day, methodId = state.methodId, configOverride = null) {
  const targetType = nutritionDayType(dayType, methodId)
  const isFormulaMethod = ['standard', 'song', 'king', 'king-redistributed', 'dynamic', 'fixed'].includes(methodId)
  const storedOverride = state.methodOverrides[methodId]
  const resolvedOverride = configOverride || storedOverride
  if (methodId === 'standard') {
    const defaultConfig = standardFormulaConfig()
    const overrideConfig = resolvedOverride ? normalizeMethodConfig(resolvedOverride) : null
    const dayConfig = defaultConfig.days[targetType]
    const percentages = overrideConfig?.days[targetType]?.percentages || dayConfig.percentages
    const calories = overrideConfig?.days[targetType]?.caloriesCustomized && Number(overrideConfig.days[targetType].calories) > 0
      ? Math.round(overrideConfig.days[targetType].calories)
      : dayConfig.calories
    return {
      calories,
      carbs: Math.round(calories * percentages.carbs / 100 / 4),
      protein: Math.round(calories * percentages.protein / 100 / 4),
      fat: Math.round(calories * percentages.fat / 100 / 9)
    }
  }
  if (isHeatRedistributionMethod(methodId)) {
    const customConfig = state.customMethods.find((method) => method.id === methodId)?.target
    const config = normalizeHeatRedistributionConfig(resolvedOverride || customConfig)
    return kingOriginalTarget(targetType, config)
  }
  if (!resolvedOverride && isFormulaMethod && !state.customMethods.some((method) => method.id === methodId)) {
    return formulaTarget(targetType, methodId)
  }
  const rawConfig = resolvedOverride ? normalizeMethodConfig(resolvedOverride) : methodConfigForId(methodId)
  const config = isKingMethod(methodId) ? normalizeKingMethodConfig(rawConfig) : rawConfig
  const dayConfig = config.days[targetType] || config.days[normalizeDayType(targetType)] || config.days.rest
  if (config.mode === 'multiplier') {
    const weight = state.bodyProfile.weight
    return macroTarget(
      weight * dayConfig.multipliers.carbs,
      weight * dayConfig.multipliers.protein,
      weight * dayConfig.multipliers.fat
    )
  }
  const calories = Math.round(dayConfig.calories)
  return {
    calories,
    carbs: Math.round(calories * dayConfig.percentages.carbs / 100 / 4),
    protein: Math.round(calories * dayConfig.percentages.protein / 100 / 4),
    fat: Math.round(calories * dayConfig.percentages.fat / 100 / 9)
  }
}

function dayTypeName(dayType) {
  return normalizeDayType(dayType) === 'training' ? '训练日' : '休息日'
}

function methodSettingLabel(dayType, methodId = state.methodId, configOverride = null) {
  const targetType = nutritionDayType(dayType, methodId)
  const hasOverride = Boolean(state.methodOverrides[methodId])
  if (isHeatRedistributionMethod(methodId)) {
    const distribution = kingDistribution(targetType, configOverride || methodConfigForId(methodId))
    return `周碳 ${oneDecimal(distribution.carbs * 100)}%÷${distribution.count} · 周脂 ${oneDecimal(distribution.fat * 100)}%÷${distribution.count} · 蛋固定`
  }
  if (!configOverride && !hasOverride && methodId === 'song') {
    const gaining = state.bodyProfile.goal === '增肌'
    const quota = songQuotaForProfile()
    const carbs = normalizeDayType(targetType) === 'training' ? quota.trainingCarbs : quota.restCarbs
    const protein = quota.protein
    const fat = state.bodyProfile.gender === 'female' ? (gaining ? 70 : 50) : (gaining ? 80 : state.bodyProfile.weight >= 120 ? 70 : 60)
    return `碳 ${carbs}× · 蛋 ${protein}× · 脂 ${fat}g`
  }
  if (!configOverride && !hasOverride && methodId === 'standard') {
    const settings = normalizeStandardDeficitSettings(state.standardDeficitSettings)
    const day = normalizeDayType(targetType)
    const parts = settings.separateDays ? settings.days[day].percentages : settings.percentages
    const manualCalories = settings.separateDays ? settings.days[day].calories : settings.manualCalories
    return `${manualCalories === null ? `基础代谢×${activityFactorForProfile().factor}−${settings.deficit} kcal` : `手动 ${manualCalories} kcal`} · 碳${parts.carbs}% 蛋${parts.protein}% 脂${parts.fat}%`
  }
  if (!configOverride && !hasOverride && ['king-redistributed', 'dynamic', 'fixed'].includes(methodId)) {
    const values = formulaMultipliers(methodId, targetType)
    return `碳 ${values.carbs}× · 蛋 ${values.protein}× · 脂 ${values.fat}×`
  }
  const rawConfig = configOverride ? normalizeMethodConfig(configOverride) : methodConfigForId(methodId)
  const config = isKingMethod(methodId) ? normalizeKingMethodConfig(rawConfig) : rawConfig
  const dayConfig = config.days[targetType] || config.days[normalizeDayType(targetType)]
  if (config.mode === 'percentage') {
    const values = dayConfig.percentages
    return `碳 ${values.carbs}% · 蛋 ${values.protein}% · 脂 ${values.fat}%`
  }
  const values = dayConfig.multipliers
  return `碳 ${values.carbs}× · 蛋 ${values.protein}× · 脂 ${values.fat}×`
}

function compactMethodSettingLabel(dayType, methodId) {
  return methodSettingLabel(dayType, methodId)
    .replaceAll('碳 ', '碳')
    .replaceAll('蛋 ', '蛋')
    .replaceAll('脂 ', '脂')
    .replaceAll(' · ', '  ')
}

function methodModeLabel(methodId, config = methodConfigForId(methodId)) {
  if (methodId === 'standard') return '热量缺口法'
  if (isHeatRedistributionMethod(methodId)) return '7 天热量重分配'
  if (state.methodOverrides[methodId]) return config.mode === 'percentage' ? '百分比' : '体重倍数'
  if (methodId === 'song') return '身高体重配额表'
  if (methodId === 'king-redistributed') return '每日体重倍数'
  if (methodId === 'dynamic') return '训练时长倍数'
  if (methodId === 'fixed') return tanFixedMultipliers().stage
  return config.mode === 'percentage' ? '百分比' : '体重倍数'
}

function targetForDayType(dayType, methodId = state.methodId, date = selectedDate()) {
  return methodTargetValues(dayType, methodId, null, date)
}

function normalizedMealRatios(dayType, key, plans = state.mealPlans) {
  const slots = mealSlotsFromPlans(dayType, plans)
  const raw = slots.map((meal) => Math.max(0, Number(meal[key]) || 0))
  const total = raw.reduce((sum, value) => sum + value, 0)
  if (total <= 0) return slots.map(() => 1 / Math.max(1, slots.length))
  return raw.map((value) => value / total)
}

function mealTargetsForDay(dayType, plans = state.mealPlans, date = selectedDate()) {
  const normalizedType = normalizeDayType(dayType)
  const slots = mealSlotsFromPlans(normalizedType, plans)
  const daily = targetForDayType(dayType, state.methodId, date)
  const carbRatios = normalizedMealRatios(normalizedType, 'carbRatio', plans)
  const proteinRatios = normalizedMealRatios(normalizedType, 'proteinRatio', plans)
  const fatRatios = normalizedMealRatios(normalizedType, 'fatRatio', plans)
  return slots.map((meal, index) => {
    const carbs = daily.carbs * carbRatios[index]
    const protein = daily.protein * proteinRatios[index]
    const fat = daily.fat * fatRatios[index]
    return {
      mealId: meal.id,
      dayType: normalizedType,
      name: meal.name,
      time: meal.time,
      carbs: rounded(carbs),
      protein: rounded(protein),
      fat: rounded(fat),
      calories: rounded(carbs * 4 + protein * 4 + fat * 9)
    }
  })
}

function mealTargetForSlot(dayType, mealId, plans = state.mealPlans, date = selectedDate()) {
  const targets = mealTargetsForDay(dayType, plans, date)
  return targets.find((target) => target.mealId === mealId) || targets[0]
}

function nutritionErrorRatio(actual, target, key) {
  if (target[key] <= 0) return actual[key] <= 1 ? 0 : actual[key] / 5
  return (actual[key] - target[key]) / target[key]
}

function mealSolutionScore(items, target, originalAmounts) {
  const nutrition = nutrientsForItems(items)
  const macroError = ['carbs', 'protein', 'fat'].reduce((sum, key) => sum + nutritionErrorRatio(nutrition, target, key) ** 2, 0)
  const calorieError = nutritionErrorRatio(nutrition, target, 'calories') ** 2
  const amountPenalty = items.reduce((sum, item) => {
    const original = originalAmounts[item.foodId] || 100
    return sum + ((item.amount - original) / Math.max(100, original)) ** 2
  }, 0)
  return macroError + calorieError * 0.2 + amountPenalty * 0.002
}

function autoCalculateMealSet(items, target, tolerance = 10) {
  const originalAmounts = Object.fromEntries(items.map((item) => [item.foodId, Math.max(5, Number(item.amount) || 100)]))
  const seedNutrition = nutrientsForItems(items)
  const calorieScale = seedNutrition.calories > 0 ? Math.max(0.25, Math.min(4, target.calories / seedNutrition.calories)) : 1
  let result = items.map((item) => {
    const food = foodById(item.foodId)
    const step = food?.unitStep || 5
    const amount = item.locked ? originalAmounts[item.foodId] : originalAmounts[item.foodId] * calorieScale
    return { ...item, amount: Math.max(step, Math.round(amount / step) * step) }
  })
  const boundsFor = (foodId) => {
    const food = foodById(foodId)
    if (food?.category === 'fiber') return [20, 600]
    if (food?.category === 'fat') return [5, 300]
    return [5, 1000]
  }
  let bestScore = mealSolutionScore(result, target, originalAmounts)
  ;[100, 50, 25, 10, 5].forEach((step) => {
    for (let pass = 0; pass < 8; pass += 1) {
      let improved = false
      for (let index = 0; index < result.length; index += 1) {
        const currentItem = result[index]
        if (currentItem.locked) continue
        const currentAmount = currentItem.amount
        const [minimum, maximum] = boundsFor(currentItem.foodId)
        const unitStep = foodById(currentItem.foodId)?.unitStep || 5
        const effectiveStep = Math.max(step, unitStep)
        let localResult = result
        let localScore = bestScore
        ;[-effectiveStep, effectiveStep].forEach((change) => {
          const rawAmount = Math.max(minimum, Math.min(maximum, currentAmount + change))
          const candidateAmount = Math.max(unitStep, Math.round(rawAmount / unitStep) * unitStep)
          if (candidateAmount === currentAmount) return
          const candidate = result.map((entry, entryIndex) => entryIndex === index ? { ...entry, amount: candidateAmount } : { ...entry })
          const score = mealSolutionScore(candidate, target, originalAmounts)
          if (score + 1e-8 < localScore) {
            localResult = candidate
            localScore = score
          }
        })
        if (localScore + 1e-8 < bestScore) {
          result = localResult
          bestScore = localScore
          improved = true
        }
      }
      if (!improved) break
    }
  })
  const nutrition = nutrientsForItems(result)
  const differences = Object.fromEntries(['calories', 'carbs', 'protein', 'fat'].map((key) => [key, target[key] > 0 ? Math.round((nutrition[key] - target[key]) / target[key] * 100) : 0]))
  const withinTolerance = ['carbs', 'protein', 'fat'].every((key) => Math.abs(differences[key]) <= tolerance)
  return { items: result, nutrition, differences, withinTolerance, tolerance }
}

function currentTarget() {
  return targetForDayType(currentNutritionDayType())
}

function percentage(value, target) {
  return Math.min(100, Math.max(0, Math.round(value / target * 100)))
}

function overflowPercentage(value, target, minimumVisible = 0) {
  if (!target || value <= target) return 0
  return Math.min(100, Math.max(minimumVisible, (value - target) / target * 100))
}

function updateSummary() {
  const current = totals()
  const target = currentTarget()
  document.querySelector('#current-calories').textContent = Math.round(current.calories).toLocaleString('zh-CN')
  document.querySelector('#target-calories-display').textContent = `/ ${Math.round(target.calories).toLocaleString('zh-CN')}`
  const energyRing = document.querySelector('#energy-ring')
  const energyProgress = percentage(current.calories, target.calories)
  const energyOverflow = overflowPercentage(current.calories, target.calories, 2)
  energyRing.dataset.digits = String(Math.max(0, Math.round(current.calories))).length
  energyRing.style.setProperty('--energy-progress', String(energyProgress))
  energyRing.style.setProperty('--energy-overflow', String(energyOverflow))
  energyRing.classList.toggle('over', energyOverflow > 0)
  energyRing.classList.toggle('empty', energyProgress === 0)
  energyRing.setAttribute('aria-label', `已摄入 ${Math.round(current.calories)}，今日目标 ${Math.round(target.calories)}${energyOverflow > 0 ? `，超出 ${Math.round(current.calories - target.calories)} 千卡` : ''}`)
  const costButton=document.querySelector('#summary-consumption')
  if(costButton){
    costButton.hidden=!shoppingLedgerEnabled()
    if(!costButton.hidden){
      const cost=dailyConsumptionCost(dateKey(selectedDate()))
      costButton.textContent=cost.foodCount&&cost.missing&&cost.cents<0.001?'￥—':`￥${(cost.cents/100).toFixed(1)}`
      costButton.onclick=()=>{
        const date=dateKey(selectedDate()),summary=dailyConsumptionCost(date),dialog=openActionDialog('饮食花费')
        const categories=[['carbs','碳水'],['protein','蛋白质'],['fat','脂肪'],['other','未归类']]
        dialog.content.innerHTML=`<p>按已记录食物的碳水、蛋白质和脂肪供能比例分摊成本；备餐计划与当天采购付款不计入。</p><div class="consumption-detail">${summary.foodCount?categories.filter(([key])=>key!=='other'||summary.macros.other>0).map(([key,label])=>`<div><span>${label}</span><strong>￥${(summary.macros[key]/100).toFixed(1)}</strong></div>`).join(''):'<p>暂无已记录餐次</p>'}${summary.missing?`<small>${summary.missing}项待补价</small>`:''}</div>`
      }
    }
  }

  ;['protein', 'carbs', 'fat'].forEach((macro) => {
    const currentValue = rounded(current[macro])
    const overflow = overflowPercentage(currentValue, target[macro], 2)
    document.querySelector(`#${macro}-text`).textContent = `${currentValue} / ${target[macro]}g`
    document.querySelector(`#${macro}-bar`).style.width = `${percentage(currentValue, target[macro])}%`
    const overflowLayer = document.querySelector(`#${macro}-overflow`)
    overflowLayer.style.width = `${overflow}%`
    overflowLayer.hidden = overflow === 0
    overflowLayer.closest('.macro-item').classList.toggle('over', overflow > 0)
  })
}

function foodIconHtml(food, compact = false) {
  if (!food) return ''
  const useIcon = food.useIcon !== false || hasAutomaticCatalogIcon(food)
  const drawing = useIcon && food.iconSource === 'pixel-art' && typeof PixelArt !== 'undefined' ? PixelArt.image(food.pixelArt) : ''
  const pixelIcon = useIcon && typeof pixelFoodIcon === 'function' ? pixelFoodIcon({ ...food, useIcon }, state.iconStyle) : null
  const icon = useIcon ? foodIconPath(food.icon) || foodIconPath(defaultFoodIcon(food)) : ''
  const content = drawing ? `<img src="${drawing}" alt="" loading="lazy">`
    : pixelIcon ? `<img src="${escapeHtml(pixelIcon.path)}" alt="" loading="lazy">`
    : useIcon && isSupportedLocalMealPhoto(food.customImage)
    ? `<img src="${escapeHtml(food.customImage)}" alt="" loading="lazy">`
    : icon
    ? `<img src="${icon}" alt="" loading="lazy">`
    : `<span>${escapeHtml([...(food.iconText || food.symbol || food.name)].slice(0, 2).join(''))}</span>`
  return `<span class="food-mini ${food.category} ${compact ? 'compact' : ''} ${drawing || pixelIcon ? 'pixel-art-icon' : ''}" title="${escapeHtml(food.name)}">${content}</span>`
}

function foodAmountLabel(item, includeGrams = true) {
  const food = foodById(item.foodId)
  const amount = rounded(item.amount)
  if (!food?.unitStep || !food.unitLabel || !food.unitGrams) return `${amount}g`
  const units = rounded(amount / food.unitGrams)
  return includeGrams ? `${units}${food.unitLabel} · ${amount}g` : `${amount}g`
}

function mealDetailsHtml(meal) {
  const checkIn = meal.isPlanned ? `<button type="button" class="planned-checkin-overlay" aria-label="打卡${escapeHtml(meal.name)}"><strong>打卡</strong></button>` : ''
  if (typeof foodIconsHidden === 'function' && foodIconsHidden()) {
    return `<div class="meal-food-items text-food-items">${meal.items.map(item => `<span class="meal-food-text"><span>${escapeHtml(foodById(item.foodId)?.name || '食物')}</span><small>${foodAmountLabel(item, false)}</small></span>`).join('')}${checkIn}</div>`
  }
  const visibleLimit = 8
  const visibleItems = meal.items.slice(0, meal.items.length > visibleLimit ? visibleLimit - 1 : visibleLimit)
  const overflowCount = meal.items.length - visibleItems.length
  const items = visibleItems.map((item) => `<span class="meal-food-item">${foodIconHtml(foodById(item.foodId), true)}<small>${foodAmountLabel(item, false)}</small></span>`).join('')
  const overflow = overflowCount > 0
    ? `<span class="meal-food-overflow" aria-label="另有${overflowCount}种食材已折叠"><strong>+${overflowCount}</strong><small>更多</small></span>`
    : ''
  return `<div class="meal-food-items">${items}${overflow}${checkIn}</div>`
}

function mealPhotoButtonHtml(meal, mealIndex) {
  const photoContent = meal.photo
    ? `<img src="${meal.photo}" alt="${meal.name}照片">`
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h4l1.5-2h5L16 8h4v10H4z"/><circle cx="12" cy="13" r="3"/></svg>'
  return `<button class="meal-photo-button ${meal.photo ? 'has-photo' : ''}" type="button" data-meal-photo="${mealIndex}" aria-label="拍照或选择${meal.name}图片">${photoContent}</button>`
}

function renderMeals() {
  mealList.innerHTML = state.meals.map((meal, index) => {
    const nutrition = mealNutrients(meal)
    const hasFood = meal.items.length > 0
    return `
      <li class="meal-row ${hasFood ? 'has-food' : ''} ${meal.isPlanned ? 'planned-meal' : ''}" data-meal-row="${index}">
        <button class="meal-clear-menu" type="button" data-clear-meal="${index}" aria-label="清空${escapeHtml(meal.name)}的食物" ${hasFood ? '' : 'disabled'}>清空本餐</button>
        <div class="meal-swipe-menu" aria-label="${meal.name}套餐菜单">
          <button type="button" data-swipe-apply="${index}"><span>↳</span><strong>套用套餐</strong></button>
          <button type="button" data-swipe-save="${index}"><span>＋</span><strong>保存套餐</strong></button>
        </div>
        <div class="meal-row-content">
          <div class="meal-main">
            <span class="meal-marker drag-handle" data-drag-handle="${index}" aria-label="按住调整${meal.name}内容位置">${index + 1}</span>
            <div class="meal-copy">
              <strong><button class="meal-title-button" type="button" data-edit-meal-title="${index}" aria-label="修改${escapeHtml(meal.name)}餐次">${escapeHtml(meal.name.replace(/\s*·\s*/g, '·'))}</button> <small>${meal.time}</small></strong>
              <div class="meal-food-line">${mealPhotoButtonHtml(meal, index)}</div>
            </div>
          </div>
          ${mealDetailsHtml(meal)}
          <div class="meal-stats">
            <div>
              <strong>${hasFood ? `${Math.round(nutrition.calories)} kcal` : '待记录'}</strong>
              <div class="meal-macros" aria-label="碳水蛋白质脂肪">
                <span class="carbs">碳 ${Math.round(nutrition.carbs)}</span>
                <span class="protein">蛋 ${Math.round(nutrition.protein)}</span>
                <span class="fat">脂 ${Math.round(nutrition.fat)}</span>
              </div>
            </div>
            <div class="meal-actions">
              <button class="add-meal-button" type="button" data-meal="${index}" aria-label="记录${meal.name}">＋</button>
            </div>
          </div>
        </div>
      </li>`
  }).join('')

  installDailyMealActions()
  mealList.querySelectorAll('[data-meal]').forEach((button) => {
    button.addEventListener('click', () => openFoodSheet(Number(button.dataset.meal)))
  })
  mealList.querySelectorAll('[data-swipe-apply]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation()
    button.closest('[data-meal-row]').classList.remove('swipe-open')
    openMealSetPicker(Number(button.dataset.swipeApply))
  }))
  mealList.querySelectorAll('[data-swipe-save]').forEach((button) => button.addEventListener('click', (event) => {
    event.stopPropagation()
    button.closest('[data-meal-row]').classList.remove('swipe-open')
    openSaveMealSetSheet(Number(button.dataset.swipeSave))
  }))
  mealList.querySelectorAll('[data-meal-photo]').forEach((button) => {
    button.addEventListener('click', (event) => {
      event.stopPropagation()
      openMealPhotoSheet(Number(button.dataset.mealPhoto))
    })
  })
  mealList.querySelectorAll('[data-meal-row]').forEach((row) => {
    row.querySelector('.planned-checkin-overlay')?.addEventListener('click', (event) => {
      event.stopPropagation()
      checkInPlannedMeal(Number(row.dataset.mealRow), event.currentTarget)
    })
    row.addEventListener('click', (event) => {
      if (event.target.closest('button, [data-drag-handle]')) return
      if (row.dataset.suppressClick === 'true') {
        row.dataset.suppressClick = 'false'
        return
      }
      if (row.classList.contains('swipe-open') || row.classList.contains('clear-open')) {
        row.classList.remove('swipe-open', 'clear-open')
        return
      }
      if (state.meals[Number(row.dataset.mealRow)]?.isPlanned) {
        checkInPlannedMeal(Number(row.dataset.mealRow), row.querySelector('.planned-checkin-overlay') || row)
        return
      }
      openMealEditorSheet(Number(row.dataset.mealRow))
    })
  })
  attachMealSwipeGestures()
  mealList.querySelectorAll('[data-clear-meal]').forEach(button => button.onclick = () => clearMealFoods(Number(button.dataset.clearMeal)))
  attachMealReorderGestures()
}

function attachMealSwipeGestures() {
  const menuWidth = 144
  mealList.querySelectorAll('.meal-row-content').forEach((content) => {
    const row = content.closest('[data-meal-row]')
    content.addEventListener('pointerdown', (event) => {
      if (event.isPrimary === false || event.button !== 0 || event.target.closest('[data-drag-handle]')) return
      const startX = event.clientX
      const startY = event.clientY
      const startOffset = row.classList.contains('swipe-open') ? -menuWidth : row.classList.contains('clear-open') ? 100 : 0
      let currentOffset = startOffset
      let horizontal = false

      const cleanup = () => {
        content.style.transform = ''
        row.classList.remove('clear-swiping')
        if (content.hasPointerCapture(event.pointerId)) content.releasePointerCapture(event.pointerId)
        content.removeEventListener('pointermove', onMove)
        content.removeEventListener('pointerup', onEnd)
        content.removeEventListener('pointercancel', onCancel)
      }

      const onMove = (moveEvent) => {
        if (moveEvent.pointerId !== event.pointerId) return
        const distanceX = moveEvent.clientX - startX
        const distanceY = moveEvent.clientY - startY
        if (!horizontal && Math.abs(distanceY) > 10 && Math.abs(distanceY) >= Math.abs(distanceX)) { cleanup(); return }
        if (!horizontal && Math.abs(distanceX) > 10 && Math.abs(distanceX) > Math.abs(distanceY) * 1.2) {
          horizontal = true
          content.setPointerCapture(event.pointerId)
        }
        if (!horizontal) return
        moveEvent.preventDefault()
        currentOffset = Math.max(-menuWidth, Math.min(startOffset < 0 ? 0 : 100, startOffset + distanceX))
        row.classList.toggle('clear-swiping', currentOffset > 0)
        content.style.transform = `translateX(${currentOffset}px)`
      }

      const onEnd = (endEvent) => {
        if (endEvent.pointerId !== event.pointerId) return
        if (horizontal) {
          mealList.querySelectorAll('.meal-row.swipe-open,.meal-row.clear-open').forEach((openRow) => {
            if (openRow !== row) openRow.classList.remove('swipe-open', 'clear-open')
          })
          row.classList.toggle('swipe-open', currentOffset < -menuWidth / 2)
          row.classList.toggle('clear-open', currentOffset > 32)
          row.dataset.suppressClick = 'true'
          window.setTimeout(() => { row.dataset.suppressClick = 'false' }, 350)
        }
        cleanup()
      }

      const onCancel = (cancelEvent) => { if (cancelEvent.pointerId === event.pointerId) cleanup() }
      content.addEventListener('pointermove', onMove)
      content.addEventListener('pointerup', onEnd)
      content.addEventListener('pointercancel', onCancel)
    })
    content.addEventListener('click', event => {
      if (row.dataset.suppressClick === 'true') { event.preventDefault(); event.stopImmediatePropagation() }
    }, true)
  })
}

function moveArrayItem(items, fromIndex, toIndex) {
  const [item] = items.splice(fromIndex, 1)
  items.splice(toIndex, 0, item)
}

function animateMealContentMove(fromIndex, toIndex) {
  const rows = [...mealList.querySelectorAll('[data-meal-row]')]
  const firstIndex = Math.min(fromIndex, toIndex)
  const lastIndex = Math.max(fromIndex, toIndex)
  rows.forEach((row, index) => {
    if (index >= firstIndex && index <= lastIndex) row.classList.add('content-shifted')
  })
  rows[toIndex]?.classList.add('content-landed')
  window.setTimeout(() => {
    rows.forEach((row) => row.classList.remove('content-shifted', 'content-landed'))
  }, 680)
}

let mealContentMovePending = false

async function moveMealContent(fromIndex, toIndex) {
  if (mealContentMovePending || fromIndex === toIndex || !Number.isInteger(fromIndex) || !Number.isInteger(toIndex) || fromIndex < 0 || toIndex < 0 || fromIndex >= state.meals.length || toIndex >= state.meals.length) return
  mealContentMovePending = true
  const recordDate = dateKey(selectedDate())
  const meals = state.meals
  const contents = meals.map((meal) => ({
    items: cloneItems(meal.items),
    photo: meal.photo,
    isPlanned: meal.isPlanned
  }))
  const previousContents = contents.map((content) => ({ ...content, items: cloneItems(content.items) }))
  const contentSignature = (list) => JSON.stringify(list.map(meal => ({ items: meal.items, photo: meal.photo, isPlanned: meal.isPlanned })))
  const beforeSignature = contentSignature(meals)
  const applyContents = (list, nextContents) => list.forEach((meal, index) => {
    meal.items = cloneItems(nextContents[index].items)
    for (const key of ['photo', 'isPlanned']) {
      if (nextContents[index][key] === undefined) delete meal[key]
      else meal[key] = nextContents[index][key]
    }
  })
  moveArrayItem(contents, fromIndex, toIndex)
  const stagedMeals = meals.map(meal => ({ ...meal }))
  applyContents(stagedMeals, contents)
  let photoUpdateCommitted = false
  let contentsApplied = false
  try {
    await replaceLocalMealPhotosForDate(recordDate, stagedMeals)
    photoUpdateCommitted = true
    // A date switch or another edit during IndexedDB work must not overwrite newer data.
    if (state.meals !== meals || dateKey(selectedDate()) !== recordDate || contentSignature(meals) !== beforeSignature) throw new Error('餐食已变化，请重新拖动')
    applyContents(meals, contents)
    contentsApplied = true
    persistState()
  } catch (error) {
    if (contentsApplied) applyContents(meals, previousContents)
    if (photoUpdateCommitted) {
      try {
        await replaceLocalMealPhotosForDate(recordDate, meals)
      } catch (rollbackError) {
        showToast('餐食与照片位置恢复失败，请重新打开应用')
        if (state.meals === meals) renderMeals()
        return
      }
    }
    if (state.meals === meals) renderMeals()
    showToast(error.message)
    return
  } finally {
    mealContentMovePending = false
  }
  renderMeals()
  updateSummary()
  renderTrends()
  renderPrep()
  requestAnimationFrame(() => animateMealContentMove(fromIndex, toIndex))
  showToast('已调整当天餐食内容')
}

function closestMealDropIndex(centers, position) {
  let result = 0
  centers.forEach((center, index) => {
    if (Math.abs(position - center) < Math.abs(position - centers[result])) result = index
  })
  return result
}

function attachMealReorderGestures() {
  mealList.querySelectorAll('[data-drag-handle]').forEach((handle) => {
    const row = handle.closest('[data-meal-row]')
    handle.addEventListener('contextmenu', (event) => event.preventDefault())
    handle.addEventListener('pointerdown', (event) => {
      if (mealContentMovePending || event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return
      event.stopPropagation()
      const startIndex = Number(handle.dataset.dragHandle)
      const startX = event.clientX
      const startY = event.clientY
      const pointerId = event.pointerId
      const startingMeals = state.meals
      const rows = [...mealList.querySelectorAll('[data-meal-row]')]
      const centers = rows.map(candidate => { const rect = candidate.getBoundingClientRect(); return rect.top + rect.height / 2 })
      let active = false
      let targetIndex = startIndex
      let finished = false
      let activateTimer

      const activate = () => {
        if (finished || !row.isConnected || state.meals !== startingMeals) return
        active = true
        window.clearTimeout(activateTimer)
        // The date entrance owns transform while its filled animation remains attached.
        mealList.classList.remove('date-refresh')
        rows.forEach(candidate => candidate.classList.remove('swipe-open', 'clear-open'))
        row.classList.add('dragging')
        handle.classList.add('active')
        document.body.classList.add('meal-reordering')
        if (navigator.vibrate) navigator.vibrate(24)
      }

      const cleanup = () => {
        finished = true
        window.clearTimeout(activateTimer)
        row.classList.remove('dragging')
        handle.classList.remove('active')
        row.style.transform = ''
        document.body.classList.remove('meal-reordering')
        mealList.querySelectorAll('.drop-target').forEach((item) => item.classList.remove('drop-target'))
        handle.removeEventListener('pointermove', onMove)
        handle.removeEventListener('pointerup', onEnd)
        handle.removeEventListener('pointercancel', onCancel)
        handle.removeEventListener('lostpointercapture', onCancel)
        window.removeEventListener('blur', onCancel)
        try { if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId) } catch (error) {}
      }

      const onMove = (moveEvent) => {
        if (moveEvent.pointerId !== pointerId || finished) return
        if (!row.isConnected || state.meals !== startingMeals) { cleanup(); return }
        const distance = moveEvent.clientY - startY
        if (!active) {
          if (event.pointerType === 'mouse' && Math.abs(distance) > 6) activate()
          else if (Math.hypot(distance, moveEvent.clientX - startX) > 9) { cleanup(); return }
        }
        if (!active) return
        moveEvent.preventDefault()
        const shiftedCenter = Math.max(centers[0], Math.min(centers[centers.length - 1], centers[startIndex] + distance))
        row.style.transform = `translateY(${shiftedCenter - centers[startIndex]}px)`
        // Include the original slot so jitter and dragging back are genuine no-ops.
        const bounds = mealList.getBoundingClientRect()
        targetIndex = moveEvent.clientX < bounds.left - 40 || moveEvent.clientX > bounds.right + 40 ? startIndex : closestMealDropIndex(centers, shiftedCenter)
        rows.forEach((candidate, candidateIndex) => candidate.classList.toggle('drop-target', candidateIndex === targetIndex && candidateIndex !== startIndex))
      }

      const onEnd = (endEvent) => {
        if (endEvent.pointerId !== pointerId || finished) return
        if (active) { endEvent.preventDefault(); endEvent.stopPropagation() }
        const shouldMove = active && targetIndex !== startIndex && row.isConnected && state.meals === startingMeals
        cleanup()
        if (shouldMove) moveMealContent(startIndex, targetIndex)
      }

      const onCancel = (cancelEvent) => {
        if (cancelEvent?.pointerId !== undefined && cancelEvent.pointerId !== pointerId) return
        cleanup()
      }

      // Capture immediately, including the long-press wait, so release outside cannot leave a timer alive.
      try { handle.setPointerCapture(pointerId) } catch (error) {}
      handle.addEventListener('pointermove', onMove)
      handle.addEventListener('pointerup', onEnd)
      handle.addEventListener('pointercancel', onCancel)
      handle.addEventListener('lostpointercapture', onCancel)
      window.addEventListener('blur', onCancel)
      activateTimer = window.setTimeout(activate, 350)
    })
  })
}

function applyMealSet(mealIndex, setId, autoScale = false) {
  const set = mealSetById(setId) || preferredMealSet(mealIndex)
  if (!set) return
  const target = mealTargetForSlot(currentNutritionDayType(), state.meals[mealIndex].id)
  const calculation = autoScale
    ? autoCalculateMealSet(set.items, target, state.mealPlans[state.day].tolerance)
    : null
  state.meals[mealIndex].items = cloneItems(calculation?.items || set.items)
  markMealAsRecorded(mealIndex)
  state.preferredSetByMeal[state.meals[mealIndex].id] = set.id
  state.meals[mealIndex].items.forEach((item) => rememberRecent(mealIndex, item.foodId, item.amount))
  renderMeals()
  updateSummary()
  renderTrends()
  renderPrep()
  persistState()
  closeSheet()
  if (!calculation) {
    showToast(`已按原份量套用「${set.name}」`)
    return
  }
  showToast(calculation.withinTolerance
    ? `已按${state.meals[mealIndex].name}额度计算并套用`
    : `已套用当前食材的最接近克重`)
}

function openMealSetPicker(mealIndex) {
  const meal = state.meals[mealIndex]
  const preferredId = state.preferredSetByMeal[meal.id]
  const mealType = mealTypeForSlot(meal, mealIndex)
  const currentDayType = currentNutritionDayType()
  const matchingSets = compatibleMealSets(currentDayType, mealType)
  sheetKicker.textContent = 'MEAL SET'
  sheetTitle.textContent = `套用到${mealTypeName(mealType)}`
  sheetContent.innerHTML = `
    <p class="sheet-hint">只展示适用于${nutritionDayTypeName(currentDayType)} · ${mealTypeName(mealType)}的套餐；上次使用的套餐会排在前面。</p>
    <div class="meal-set-picker">
      ${matchingSets.length ? matchingSets.sort((left, right) => left.id === preferredId ? -1 : right.id === preferredId ? 1 : 0).map((set) => {
        const nutrition = nutrientsForItems(set.items)
        const items = set.items.map((item) => `${foodById(item.foodId).name} ${item.amount}g`).join(' · ')
        return `<article class="meal-set-option ${set.id === preferredId ? 'preferred' : ''}">
          <span><small>${set.source}${set.id === preferredId ? ' · 上次使用' : ''}</small><strong>${escapeHtml(set.name)}</strong><em>${escapeHtml(items)}</em></span>
          <div class="meal-set-pick-actions">${nutritionGridHtml(nutrition, 'compact')}<div><button type="button" data-select-meal-set="${set.id}">原份量</button><button class="primary" type="button" data-auto-meal-set="${set.id}">自动克重</button></div></div>
        </article>`
      }).join('') : '<p class="empty-editor-note">还没有适合当前日期与餐次的套餐，可前往“套餐设置”新增。</p>'}
    </div>`
  sheetContent.querySelectorAll('[data-select-meal-set]').forEach((button) => button.addEventListener('click', () => applyMealSet(mealIndex, button.dataset.selectMealSet)))
  sheetContent.querySelectorAll('[data-auto-meal-set]').forEach((button) => button.addEventListener('click', () => applyMealSet(mealIndex, button.dataset.autoMealSet, true)))
  openSheet()
}

function openSaveMealSetSheet(mealIndex) {
  const meal = state.meals[mealIndex]
  if (!meal.items.length) {
    showToast(`${meal.name}还没有食物，暂时不能保存套餐`)
    return
  }
  const nutrition = mealNutrients(meal)
  const mealType = mealTypeForSlot(meal, mealIndex)
  const suggestedName = mealSetAutomaticName(meal.items)
  sheetKicker.textContent = 'SAVE SET'
  sheetTitle.textContent = `保存${meal.name}`
  sheetContent.innerHTML = `
    <label class="form-field"><span>套餐名称</span><input id="saved-meal-set-name" value="" placeholder="留空使用食材名称" maxlength="2000"></label>
    <div class="saved-set-preview">
      <strong>${meal.items.map((item) => `${foodById(item.foodId).name} ${item.amount}g`).join(' · ')}</strong>
      ${nutritionGridHtml(nutrition)}
    </div>
    <button class="primary-action" id="save-current-meal-set" type="button">保存为其他套餐</button>`
  document.querySelector('#save-current-meal-set').addEventListener('click', () => {
    const name = document.querySelector('#saved-meal-set-name').value.trim() || suggestedName
    const id = `saved-${Date.now()}`
    const savedSet = { id, name, dayType: state.day, mealType, sourceMealId: meal.id, items: cloneItems(meal.items) }
    updateSetApplications(savedSet, [currentNutritionDayType()])
    state.savedMealSets.push(savedSet)
    state.preferredSetByMeal[meal.id] = id
    renderMeals()
    renderPrep()
    persistState()
    closeSheet()
    showToast(`已保存「${name}」，并记为${meal.name}常用套餐`)
  })
  openSheet()
}

function rememberRecent(mealIndex, foodId, amount) {
  const mealId = mealKeyFromRef(mealIndex)
  const recent = recentItemsForMeal(mealId)
  const existing = recent.find((item) => item.foodId === foodId)
  const nextItem = { ...existing, foodId, amount, useCount: Math.min(Number.MAX_SAFE_INTEGER, mealUsageStats(existing).useCount + 1), lastUsed: Date.now() }
  state.recentByMeal[mealId] = [nextItem, ...recent.filter((item) => item.foodId !== foodId)]
  // Retain this observation even when the cache is full so a new habit can learn.
  // This is cache retention only; the visible four still compete on the same score.
  state.recentByMeal[mealId] = [nextItem, ...rankedRecentItemsForMeal(mealId).filter(item => item.foodId !== foodId).slice(0, 23)]
  const mealHistory = amountHistoryForMeal(mealId)
  const amounts = mealHistory[foodId] || []
  mealHistory[foodId] = [amount, ...amounts.filter((savedAmount) => savedAmount !== amount)].slice(0, 2)
}

function addFoodToMeal(mealIndex, foodId, amount, weightEntry = null) {
  const meal = state.meals[mealIndex]
  addAmountToItems(meal.items, foodId, amount, weightEntry)
  markMealAsRecorded(mealIndex)
  rememberRecent(mealIndex, foodId, amount)
  renderMeals()
  updateSummary()
  renderTrends()
  persistState()
}

const foodNameCollator = new Intl.Collator('zh-CN-u-co-pinyin', { sensitivity:'base' })
function sortVisibleFoods(items) {
  const pinnedIds=new Set(state.pinnedFoodIds)
  return [...items].sort((left, right) => {
      const leftPinned = foodFamilyIds(left.id).some(id=>pinnedIds.has(id))
      const rightPinned = foodFamilyIds(right.id).some(id=>pinnedIds.has(id))
      if (leftPinned !== rightPinned) return leftPinned ? -1 : 1
      // Sort a family by its raw entry, not the currently displayed state.
      const leftAnchor=foodById(foodFamilyId(left.id))||left,rightAnchor=foodById(foodFamilyId(right.id))||right
      const leftCreatedAt = Math.max(0, Number(leftAnchor.createdAt) || 0)
      const rightCreatedAt = Math.max(0, Number(rightAnchor.createdAt) || 0)
      if (leftCreatedAt !== rightCreatedAt) return rightCreatedAt - leftCreatedAt
      const pinyinOrder = foodNameCollator.compare(leftAnchor.name,rightAnchor.name)
      return pinyinOrder || foods.indexOf(leftAnchor) - foods.indexOf(rightAnchor)
    })
}

function visibleFoods() {
  const keyword = foodSearch.value.trim()
  const seen=new Set()
  return sortVisibleFoods(selectableFoods().filter(food=>{
    if((food.kind==='dish')!==(state.foodLibraryView==='dishes'))return false
    const family=foodFamilyId(food.id)
    if(seen.has(family))return false
    const members=foodFamilyIds(food.id).map(foodById).filter(Boolean)
    const matches=members.some(member=>matchesFoodFilters(member,state.categoryFilters)&&matchesFoodSearch(member,keyword))
    if(matches)seen.add(family)
    return matches
  }).map(food=>{
    const pair=foodStatePair(food.id),stage=state.foodLibraryStages?.[foodFamilyId(food.id)]||'cooked'
    return pair?foodById(stage==='raw'?pair.rawFoodId:pair.cookedFoodId)||food:food
  }))
}

function foodLibraryRowHtml(food) {
  const pair=foodStatePair(food.id),family=foodFamilyId(food.id)
  const pinned = foodFamilyIds(food.id).some(id=>state.pinnedFoodIds.includes(id))
  const rawName=pair?(foodById(pair.rawFoodId)?.name||food.name).replace(/[（(]生[）)]$/,''):food.name,cookedName=foodById(pair?.cookedFoodId)?.name.replace(/[（(]熟[）)]$/,'')
  const name=escapeHtml(pair&&cookedName&&rawName!==cookedName?`${rawName}／${cookedName}`:rawName),id=escapeHtml(food.id)
  return `<div class="library-food-row" data-library-row="${id}">
    <div class="library-swipe-actions"><button class="library-swipe-edit" type="button" data-edit-food="${id}" tabindex="-1" aria-hidden="true" aria-label="编辑${name}">编辑</button>${shoppingLedgerEnabled()?`<button class="library-swipe-cost" type="button" data-account-food="${id}" tabindex="-1" aria-hidden="true" aria-label="${food.kind==='dish'?'查看':'记账'}${name}">${food.kind==='dish'?'成本':'记账'}</button>`:''}<button class="library-delete-action" type="button" data-delete-food="${id}" tabindex="-1" aria-hidden="true" aria-label="删除${name}">删除</button></div>
    <article class="library-food ${pinned ? 'pinned' : ''}">
      <div class="library-food-main">
        ${foodIconHtml(food)}
        <div class="library-food-copy">${food.kind === 'dish' ? `<button class="dish-open-button" type="button" data-follow-dish="${id}" aria-label="跟做${name}"><strong>${name}</strong><span>跟做 ${uiIcon('forward')}</span></button>` : `<span class="library-food-title"><strong>${name}</strong>${pair?foodStageSegmentedHtml(food.id===pair.rawFoodId?'raw':'cooked',{label:`${rawName}生熟状态`,buttonAttribute:'data-library-stage',family,className:'library-stage-toggle'}):''}</span>`}${nutritionGridHtml(food, 'library-nutrition')}</div>
      </div>
      <div class="library-actions">
        <button class="pin-food ${pinned ? 'active' : ''}" type="button" data-pin-food="${id}" aria-pressed="${pinned}" aria-label="${pinned ? '取消置顶' : '置顶'}${name}">${uiIcon('star')}</button>
        <button class="library-add" type="button" data-library-food="${id}" aria-label="记录${name}">${uiIcon('add')}</button>
      </div>
    </article>
  </div>`
}

let libraryPageItems = [], libraryPageOffset = 0, libraryLoadObserver = null, librarySearchTimer = 0
const LIBRARY_PAGE_SIZE = 40
function appendFoodLibraryPage() {
  const more = foodLibrary.querySelector('[data-library-more]')
  const chunk = libraryPageItems.slice(libraryPageOffset, libraryPageOffset + LIBRARY_PAGE_SIZE)
  const html = chunk.map(entry => entry.supplement ? `<div class="library-search-supplement"><strong>全体食物库中还找到 ${entry.count} 项</strong><span>以下结果不属于当前标签</span></div>` : foodLibraryRowHtml(entry)).join('')
  if(more)more.insertAdjacentHTML('beforebegin',html)
  else foodLibrary.insertAdjacentHTML('beforeend',html)
  libraryPageOffset += chunk.length
  if(more){
    more.hidden=libraryPageOffset>=libraryPageItems.length
    const total=libraryPageItems.filter(entry=>!entry.supplement).length
    const shown=libraryPageItems.slice(0,libraryPageOffset).filter(entry=>!entry.supplement).length
    more.textContent=`继续显示（${shown} / ${total}）`
    if(more.hidden)libraryLoadObserver?.disconnect()
  }
}
function renderFoodLibrary() {
  window.clearTimeout(librarySearchTimer)
  libraryLoadObserver?.disconnect()
  document.querySelectorAll('[data-library-view]').forEach(button=>{const active=button.dataset.libraryView===state.foodLibraryView;button.classList.toggle('active',active);button.setAttribute('aria-selected',String(active))})
  document.querySelector('#create-library-food').hidden=state.foodLibraryView==='dishes'
  document.querySelector('#create-library-dish').hidden=state.foodLibraryView!=='dishes'
  const filtered = visibleFoods()
  const keyword = foodSearch.value.trim()
  const filteredFamilies = new Set(filtered.map(food=>foodFamilyId(food.id))),supplementalSeen=new Set()
  const supplemental = keyword && state.categoryFilters.length === 1
    ? sortVisibleFoods(selectableFoods().filter(food=>{
      if((food.kind==='dish')!==(state.foodLibraryView==='dishes'))return false
      const family=foodFamilyId(food.id)
      if(filteredFamilies.has(family)||supplementalSeen.has(family))return false
      const matches=foodFamilyIds(food.id).some(id=>matchesFoodSearch(foodById(id),keyword))
      if(matches)supplementalSeen.add(family)
      return matches
    }).map(food=>foodById(foodForState(food.id,state.foodLibraryStages?.[foodFamilyId(food.id)]||'cooked'))||food)) : []
  document.querySelector('#food-count').textContent = `${filtered.length + supplemental.length} 种`
  libraryPageItems = [...filtered, ...(supplemental.length ? [{supplement:true,count:supplemental.length}, ...supplemental] : [])]
  libraryPageOffset = 0
  foodLibrary.innerHTML = filtered.length || supplemental.length
    ? '<button type="button" class="secondary-action library-load-more" data-library-more>继续显示</button>'
    : `<div class="food-empty-state"><strong>没有找到“${escapeHtml(keyword || '当前筛选')}”</strong><span>${state.foodLibraryView === 'dishes' ? '选择食材和用量，保存自己的菜肴。' : '可以直接建立一条按每 100g 记录的食物数据。'}</span><button type="button" id="create-food-from-library">${state.foodLibraryView === 'dishes' ? '＋ 创建菜肴' : '＋ 增加食物'}</button></div>`
  appendFoodLibraryPage()
  foodLibrary.scrollTop = 0
  const more=foodLibrary.querySelector('[data-library-more]')
  if(more&&!more.hidden&&typeof IntersectionObserver!=='undefined'){
    libraryLoadObserver=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))appendFoodLibraryPage()},{root:foodLibrary,rootMargin:'160px'})
    libraryLoadObserver.observe(more)
  }
  if(!foodLibrary.dataset.actionsReady){
    foodLibrary.dataset.actionsReady='true'
    foodLibrary.addEventListener('click',event=>{
      const button=event.target.closest('button');if(!button||!foodLibrary.contains(button))return
      const d=button.dataset
      if('libraryMore' in d)appendFoodLibraryPage()
      else if(d.followDish)openDishFollowPage(d.followDish)
      else if(d.foodPrice)openFoodPriceOverview(d.foodPrice)
      else if(d.libraryFood)openFoodSheet(2,d.libraryFood)
      else if(d.pinFood){
        togglePinnedFood(d.pinFood)
        // Unpinning can move the food beyond the first chunk; keep a visible keyboard anchor.
        const anchor=foodLibrary.querySelector(`[data-pin-food="${CSS.escape(d.pinFood)}"]`)||foodLibrary.querySelector('[data-pin-food]')
        anchor?.focus({preventScroll:true})
      }
      else if(d.libraryStage){
        const pair=foodStatePair(d.family),next=pair&&foodById(d.libraryStage==='raw'?pair.rawFoodId:pair.cookedFoodId)
        if(!next||button.getAttribute('aria-pressed')==='true')return
        const previous=state.foodLibraryStages[d.family]
        state.foodLibraryStages[d.family]=d.libraryStage
        try{persistState()}catch{if(previous===undefined)delete state.foodLibraryStages[d.family];else state.foodLibraryStages[d.family]=previous;showToast('生熟选择未保存');return}
        const row=button.closest('.library-food-row')
        const toggle=button.closest('.food-stage-toggle'),toIndex=d.libraryStage==='raw'?0:1
        row.foodStageCleanup?.()
        const indicator=toggle.querySelector('.choice-slime')
        void indicator.offsetLeft
        toggle.dataset.stage=d.libraryStage
        toggle.style.setProperty('--slime-to',slimeChoiceGeometry(2,toIndex,toIndex,0,2).to)
        toggle.querySelectorAll('[data-library-stage]').forEach(choice=>{
          const active=choice.dataset.libraryStage===d.libraryStage
          choice.classList.toggle('active',active)
          choice.setAttribute('aria-pressed',String(active))
        })
        button.focus({preventScroll:true})
        const finish=()=>{
          row.foodStageCleanup?.()
          if(!row.isConnected)return
          const finalStage=state.foodLibraryStages[d.family]
          const finalFood=foodById(finalStage==='raw'?pair.rawFoodId:pair.cookedFoodId)
          if(!finalFood)return
          const keepFocus=row.contains(document.activeElement),scrollTop=foodLibrary.scrollTop
          row.outerHTML=foodLibraryRowHtml(finalFood)
          if(keepFocus)foodLibrary.querySelector(`[data-library-row="${CSS.escape(finalFood.id)}"] [data-library-stage="${finalStage}"]`)?.focus({preventScroll:true})
          foodLibrary.scrollTop=scrollTop
        }
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)finish()
        else{
          const onEnd=event=>{if(event.target===indicator&&event.propertyName==='left')finish()}
          indicator.addEventListener('transitionend',onEnd)
          row.foodStageTimer=setTimeout(finish,2500)
          row.foodStageCleanup=()=>{indicator.removeEventListener('transitionend',onEnd);clearTimeout(row.foodStageTimer);row.foodStageCleanup=null}
          requestAnimationFrame(()=>{if(row.isConnected&&!indicator.getAnimations().length)finish()})
        }
      }
      else if(d.editFood)openFoodEditorSheet(d.editFood)
      else if(d.accountFood)foodById(d.accountFood)?.kind==='dish'?openDishCostDetail(d.accountFood,100):openShoppingPurchaseEditor(d.accountFood,state.cycleStartDate,foodById(d.accountFood)?.name||'食材',false,true)
      else if(d.deleteFood)deleteFoodFromLibrary(d.deleteFood)
      else if(button.id==='create-food-from-library')state.foodLibraryView==='dishes'?openDishEditorPage(null,foodSearch.value.trim()):openFoodEditorSheet(null,foodSearch.value.trim())
    })
  }
  attachFoodLibrarySwipeGestures()
}

function deleteFoodFromLibrary(foodId) {
  const food = foodById(foodId)
  if (!food) return
  const familyIds=foodFamilyIds(foodId),wasPinned=familyIds.some(id=>state.pinnedFoodIds.includes(id))
  state.deletedFoodIds = [...new Set([...state.deletedFoodIds,...familyIds])]
  state.pinnedFoodIds = state.pinnedFoodIds.filter((id) => !familyIds.includes(id))
  if (state.selectedFood === foodId) state.selectedFood = selectableFoods()[0]?.id || ''
  renderFoodLibrary()
  persistState()
  showToast(`已删除${food.name}`,()=>{
    state.deletedFoodIds=state.deletedFoodIds.filter(id=>!familyIds.includes(id))
    if(wasPinned&&!state.pinnedFoodIds.includes(foodId))state.pinnedFoodIds.push(foodId)
    renderFoodLibrary();persistState();showToast(`已恢复${food.name}`)
  })
}

function attachFoodLibrarySwipeGestures() {
  if(foodLibrary.dataset.swipeReady)return
  foodLibrary.dataset.swipeReady='true'
  const menuWidth = () => shoppingLedgerEnabled()?216:144
    let cancelGesture = null
    let observedContent = null
    // The outer row can have user-edited padding/margins. Keep the action within
    // the actual moving surface without adding wrappers or changing saved paths.
    const alignAction = () => {
      const content = observedContent
      if (!content?.isConnected) return
      const action = content.parentElement.querySelector('.library-swipe-actions')
      action.style.top = `${content.offsetTop}px`
      action.style.bottom = 'auto'
      action.style.height = `${content.offsetHeight}px`
      action.style.left = `${content.offsetLeft + content.offsetWidth - menuWidth()}px`
      action.style.right = 'auto'
    }
    const actionResize = typeof ResizeObserver === 'function' ? new ResizeObserver(alignAction) : null
    let suppressClick = false
    let suppressTimer = 0
    foodLibrary.addEventListener('click', (event) => {
      if (!suppressClick || event.target.closest('.library-swipe-actions')) return
      event.preventDefault()
      event.stopImmediatePropagation()
      suppressClick = false
    }, true)
    foodLibrary.addEventListener('pointerdown', (event) => {
      const content=event.target.closest('.library-food')
      if(!content)return
      const row=content.closest('[data-library-row]')
      if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
      cancelGesture?.()
      window.clearTimeout(suppressTimer)
      suppressClick = false
      observedContent = content
      actionResize?.disconnect()
      alignAction()
      actionResize?.observe(row)
      actionResize?.observe(content)
      const startX = event.clientX
      const startY = event.clientY
      const wasOpen = row.classList.contains('swipe-open')
      // Resume at the visible position, including an interrupted snap animation.
      const startOffset = Math.max(-menuWidth(), Math.min(0, new DOMMatrixReadOnly(getComputedStyle(content).transform).m41))
      let currentOffset = startOffset
      let axis = ''
      content.classList.add('swipe-dragging')
      row.style.setProperty('--library-swipe-x', `${startOffset}px`)
      const cleanup = () => {
        // Commit the final drag frame before transitioning to the resting state.
        getComputedStyle(content).transform
        content.classList.remove('swipe-dragging')
        row.style.removeProperty('--library-swipe-x')
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onEnd)
        window.removeEventListener('pointercancel', onCancel)
        content.removeEventListener('lostpointercapture', onCancel)
        cancelGesture = null
        if (content.hasPointerCapture(event.pointerId)) content.releasePointerCapture(event.pointerId)
        window.clearTimeout(suppressTimer)
        suppressTimer = window.setTimeout(() => { suppressClick = false }, 250)
      }
      const onMove = (moveEvent) => {
        if (moveEvent.pointerId !== event.pointerId) return
        if (!row.isConnected) { cleanup(); return }
        const distanceX = moveEvent.clientX - startX
        const distanceY = moveEvent.clientY - startY
        if (!axis && Math.max(Math.abs(distanceX), Math.abs(distanceY)) > 7) {
          axis = Math.abs(distanceX) > Math.abs(distanceY) ? 'x' : 'y'
          if (axis === 'x') {
            content.setPointerCapture(event.pointerId)
            suppressClick = true
          }
        }
        if (axis !== 'x') return
        moveEvent.preventDefault()
        currentOffset = Math.max(-menuWidth(), Math.min(0, startOffset + distanceX))
        row.style.setProperty('--library-swipe-x', `${currentOffset}px`)
      }
      const onEnd = (endEvent) => {
        if (endEvent.pointerId !== event.pointerId) return
        if (axis === 'x') {
          foodLibrary.querySelectorAll('.library-food-row.swipe-open').forEach((openRow) => {
            if (openRow !== row) openRow.classList.remove('swipe-open')
          })
          row.style.setProperty('--library-menu-width',`${menuWidth()}px`)
          row.classList.toggle('swipe-open', wasOpen ? currentOffset < -menuWidth()/3 : currentOffset <= -menuWidth()/3)
          syncFoodSwipeAccessibility()
        }
        cleanup()
      }
      const onCancel = (cancelEvent) => {
        // Touch starts with implicit capture on a child button. Its capture-loss
        // bubbles when ownership transfers to the row; that is not cancellation.
        if (cancelEvent.type === 'lostpointercapture' && cancelEvent.target !== content) return
        if (cancelEvent.pointerId === event.pointerId) cleanup()
      }
      cancelGesture = cleanup
      window.addEventListener('pointermove', onMove, { passive: false })
      window.addEventListener('pointerup', onEnd)
      window.addEventListener('pointercancel', onCancel)
      content.addEventListener('lostpointercapture', onCancel)
    })
}

function syncFoodSwipeAccessibility(){
  foodLibrary.querySelectorAll('.library-swipe-actions button').forEach(button=>{
    const open=button.closest('.library-food-row').classList.contains('swipe-open')
    button.tabIndex=open?0:-1;button.setAttribute('aria-hidden',String(!open))
  })
}

function closeOpenFoodSwipeRows(exceptRow = null) {
  foodLibrary.querySelectorAll('.library-food-row.swipe-open').forEach((row) => {
    if (row !== exceptRow) row.classList.remove('swipe-open')
  })
  syncFoodSwipeAccessibility()
}

function togglePinnedFood(foodId) {
  const ids=foodFamilyIds(foodId),key=foodFamilyId(foodId)
  if (ids.some(id=>state.pinnedFoodIds.includes(id))) state.pinnedFoodIds = state.pinnedFoodIds.filter(id=>!ids.includes(id))
  else state.pinnedFoodIds.push(key)
  renderFoodLibrary()
  persistState()
  showToast(state.pinnedFoodIds.includes(key) ? '已固定到食物库前列' : '已取消固定')
}

function openFoodEditorSheet(foodId = null, suggestedName = '', afterSave = null) {
  if (foodById(foodId)?.kind === 'dish') return openDishEditorPage(foodId, suggestedName, afterSave)
  if(foodId)foodId=foodStatePair(foodId)?.rawFoodId||foodId
  beginEditorPage(`food-${foodId || 'new'}`)
  const isNew = !foodId
  let useLabelCalories = false
  const food = foodById(foodId) || { id: `custom-${Date.now()}`, name: suggestedName.trim(), symbol: suggestedName.trim().slice(0, 2), category: 'other', calories: 0, carbs: 0, protein: 0, fat: 0, custom: true, useIcon: false, createdAt: Date.now() }
  const pair=isNew?null:foodStatePair(food.id),ratio=pair?foodPairRatio(pair):null
  const candidates=isNew?[]:selectableFoods().filter(item=>item.id!==food.id&&item.kind!=='dish'&&matchingFoodStagePair(food,item)&&(!foodStatePair(item.id)||foodStatePair(item.id)?.rawFoodId===food.id))
  const sampleRules=isNew?[]:(state.foodWeightRules||[]).filter(rule=>canonicalFoodId(rule.foodId)===food.id&&rule.bought>0).slice(0,12)
  const selectedNutrient=state.foodPairNutrients?.[food.id]||'auto'
  const conversionHtml=isNew?'':`<details class="food-edit-conversion"><summary>生熟与称重</summary><div class="food-edit-conversion-body"><p class="sheet-hint">${pair?`生可食 100g ≈ 熟可食 ${rounded(ratio.ratio*100)}g · ${ratio.source}${ratio.sampleCount?` · ${ratio.sampleCount} 次完整实测`:''}`:'仅名称前缀相同、只差（生）／（熟）后缀的食材会关联；未关联时可单独记录可食重量。'}</p><label class="form-field"><span>关联熟态资料</span><select id="edit-food-pair">${pair?'':'<option value="">尚未关联</option>'}${candidates.map(item=>`<option value="${escapeHtml(item.id)}" ${item.id===pair?.cookedFoodId?'selected':''}>${escapeHtml(item.name)}</option>`).join('')}${pair&&!candidates.some(item=>item.id===pair.cookedFoodId)?`<option value="${escapeHtml(pair.cookedFoodId)}" selected>${escapeHtml(foodById(pair.cookedFoodId)?.name||'当前熟态')}</option>`:''}</select></label><label class="form-field"><span>无实测时按哪项营养估算</span><select id="edit-food-pair-nutrient"><option value="auto" ${selectedNutrient==='auto'?'selected':''}>自动选择主成分</option><option value="carbs" ${selectedNutrient==='carbs'?'selected':''}>碳水</option><option value="protein" ${selectedNutrient==='protein'?'selected':''}>蛋白质</option><option value="fat" ${selectedNutrient==='fat'?'selected':''}>脂肪</option></select></label><div class="weight-pair-measure"><strong>补记一批实测 · 保存食物时一并保存</strong><div class="weight-measurements"><label class="form-field"><span>买来总重 g</span><input id="edit-food-bought" type="number" min="0.1" max="1000000" step="0.1"></label><label class="form-field"><span>熟可食重 g · 可留空</span><input id="edit-food-cooked" type="number" min="0.1" max="1000000" step="0.1"></label></div><label class="form-field"><span>去皮瓤后的生可食重 g · 可留空</span><input id="edit-food-edible" type="number" min="0.1" max="1000000" step="0.1" placeholder="未称重默认等于买来重量"></label></div>${sampleRules.length?`<div class="food-edit-samples"><small>独立称重样本</small>${sampleRules.map(rule=>`<span>${shoppingWeightLabel(rule.bought)} 买来 → ${rule.cooked?`${shoppingWeightLabel(rule.cooked)} 熟可食`:`${shoppingWeightLabel(rule.edible)} 生可食`}</span>`).join('')}</div>`:''}</div></details>`
  sheetKicker.textContent = 'FOOD DATA'
  sheetTitle.textContent = isNew ? '添加食物' : `编辑${food.name}`
  sheetContent.innerHTML = `<div class="form-grid two-column"><label class="form-field wide"><span>食物名称</span><input id="edit-food-name" value="${escapeHtml(food.name)}" maxlength="20"></label><label class="form-field wide"><span>分类</span><select id="edit-food-category"><option value="carbs">碳水</option><option value="protein">蛋白质</option><option value="fiber">膳食纤维</option><option value="fat">脂肪</option><option value="other">其他</option></select></label><label class="form-field"><span>热量 kcal${isNew ? ' · 自动计算' : ''}</span><input id="edit-food-calories" type="number" value="${food.calories}" min="0" max="5000" step="0.1" inputmode="decimal" ${isNew ? 'readonly aria-readonly="true"' : ''}></label><label class="form-field"><span>碳水 g</span><input id="edit-food-carbs" type="number" value="${food.carbs}" min="0" max="100" step="0.1" inputmode="decimal"></label><label class="form-field"><span>蛋白质 g</span><input id="edit-food-protein" type="number" value="${food.protein}" min="0" max="100" step="0.1" inputmode="decimal"></label><label class="form-field"><span>脂肪 g</span><input id="edit-food-fat" type="number" value="${food.fat}" min="0" max="100" step="0.1" inputmode="decimal"></label></div>
    <p class="sheet-hint">营养数值均按每 100g 生可食部分计算；关联熟态会按实测或营养资料推导。</p>${conversionHtml}${isNew?'':'<button type="button" class="secondary-action" id="edit-food-icon">修改食物图标</button>'}<button class="primary-action" id="save-food-editor" type="button">${isNew ? '添加食物' : '保存食物'}</button>`
  sheetContent.querySelector('#edit-food-icon')?.addEventListener('click',()=>openFoodIconSheet(food.id))
  const ocrHost = document.createElement('div')
  sheetContent.insertAdjacentHTML('beforeend', foodSourceHtml(food))
  ocrHost.id = 'food-nutrition-import'
  sheetContent.prepend(ocrHost)
  initializeNutritionOCR(ocrHost, (values) => {
    useLabelCalories = true
    nutritionInputs.forEach((input) => { input.value = values[input.id.replace('edit-food-', '')] })
    const caloriesInput = document.querySelector('#edit-food-calories')
    if (!caloriesInput.dataset.keypadReady) caloriesInput.readOnly = false
    caloriesInput.removeAttribute('aria-readonly')
    caloriesInput.closest('label').querySelector('span').textContent = '热量 kcal · 包装标注'
    enhanceNumericInput(caloriesInput)
  })
  document.querySelector('#edit-food-category').value = food.category
  const nutritionInputs = ['calories', 'carbs', 'protein', 'fat'].map((key) => document.querySelector(`#edit-food-${key}`))
  const enforceOneDecimal = (input) => {
    const match = String(input.value).match(/^(\d*)(?:\.(\d*))?$/)
    if (match?.[2]?.length > 1) input.value = `${match[1]}.${match[2].slice(0, 1)}`
  }
  const updateCalculatedCalories = () => {
    if (!isNew || useLabelCalories) return
    const carbs = oneDecimal(document.querySelector('#edit-food-carbs').value, 0, 100)
    const protein = oneDecimal(document.querySelector('#edit-food-protein').value, 0, 100)
    const fat = oneDecimal(document.querySelector('#edit-food-fat').value, 0, 100)
    document.querySelector('#edit-food-calories').value = oneDecimal(carbs * 4 + protein * 4 + fat * 9, 0, 5000)
  }
  nutritionInputs.forEach((input) => {
    input.addEventListener('input', () => {
      enforceOneDecimal(input)
      updateCalculatedCalories()
    })
    input.addEventListener('change', () => {
      input.value = oneDecimal(input.value, 0, Number(input.max) || 5000)
      updateCalculatedCalories()
    })
  })
  updateCalculatedCalories()
  document.querySelector('#save-food-editor').addEventListener('click', () => {
    const newName = safeImportedText(document.querySelector('#edit-food-name').value, food.name, 40)
    if(!newName){showToast('请填写食物名称');document.querySelector('#edit-food-name').focus();return}
    const duplicate = foods.find(other => other.id !== food.id && other.kind !== 'dish' && catalogFoodKey(other.name) === catalogFoodKey(newName))
    if (duplicate) { showToast(`食物库已有「${duplicate.name}」，请直接编辑已有食物`); return }
    const updated={...food,name:newName,category:document.querySelector('#edit-food-category').value}
    if(isNew||newName!==food.name)updated.symbol=newName.slice(0,2)
    ;['calories', 'carbs', 'protein', 'fat'].forEach((key) => {
      const value=document.querySelector(`#edit-food-${key}`).value
      updated[key]=value===String(food[key])?food[key]:oneDecimal(value,0,key==='calories'?5000:100)
    })
    if(isNew||['calories','carbs','protein','fat'].some(key=>updated[key]!==food[key]))updated.nutritionCustomized=true
    const pairId=sheetContent.querySelector('#edit-food-pair')?.value||''
    if(pairId&&!matchingFoodStagePair(updated,foodById(pairId))){showToast('仅能关联前缀完全相同、只差生熟后缀的食材');return}
    const nutrientKey=sheetContent.querySelector('#edit-food-pair-nutrient')?.value||'auto'
    const boughtText=sheetContent.querySelector('#edit-food-bought')?.value.trim()||''
    const cookedText=sheetContent.querySelector('#edit-food-cooked')?.value.trim()||''
    const edibleText=sheetContent.querySelector('#edit-food-edible')?.value.trim()||''
    if(pair&&!pairId){showToast('请先选择关联的熟态食物');return}
    if((boughtText||cookedText||edibleText)&&(!boughtText||!cookedText&&!edibleText)){
      showToast('补记实测需填写买来总重及至少一种可食重量');return
    }
    const sampleRule=boughtText?normalizeWeightRule({id:`weight-${crypto.randomUUID()}`,foodId:food.id,name:'独立加工实测',mode:cookedText?'direct':'trim',bought:Number(boughtText),edible:edibleText?Number(edibleText):Number(boughtText),cooked:cookedText?Number(cookedText):null,basis:'edible',portionStage:'edible',edibleMeasured:Boolean(edibleText)}):null
    if(boughtText&&!sampleRule){showToast('请填写有效的同一批实测重量');return}
    if(cookedText&&!pairId){showToast('记录熟可食重量前，请先关联熟态食物');return}
    const weightUpdate={changed:false,...(!isNew&&pairId?{pair:{rawFoodId:food.id,cookedFoodId:pairId}}:{}),...(!isNew?{nutrientKey}:{}),...(sampleRule?{sampleRule}:{})}
    if(!saveLibraryFoodWithWeightRule(updated,isNew?null:food,weightUpdate))return
    if (isNew) {
      state.selectedFood = food.id
      state.foodSheetSearch = ''
    }
    renderFoodLibrary()
    renderMeals()
    updateSummary()
    renderPrep()
    renderTrends()
    closeSheet()
    if (typeof afterSave === 'function') afterSave(foodById(food.id))
    showToast('食物数据已更新')
  })
  openSheet()
}

function openFoodIconSheet(foodId) {
  const food = foodById(foodId)
  if (!food) return
  beginEditorPage(`food-icon-${food.id}`)
  let iconChoice = food.useIcon === false ? 'text' : isSupportedLocalMealPhoto(food.customImage) ? 'custom' : resolveFoodIconId(food.icon) || 'text'
  if (hasAutomaticCatalogIcon(food)) iconChoice = resolveFoodIconId(defaultFoodIcon(food))
  let pixelDrawing = typeof PixelArt !== 'undefined' ? PixelArt.normalize(food.pixelArt) : null
  if (food.useIcon !== false && food.iconSource === 'pixel-art' && pixelDrawing) iconChoice = 'handdrawn'
  if (food.useIcon !== false && food.iconSource === 'pixel-library' && typeof pixelIconById === 'function' && pixelIconById(food.pixelIcon)) iconChoice = food.pixelIcon
  const pixelCatalog = typeof PIXEL_FOOD_ICONS !== 'undefined' ? PIXEL_FOOD_ICONS : []
  const allIcons = [...FOOD_ICON_CATALOG, ...pixelCatalog]
  let customIconImage = isSupportedLocalMealPhoto(food.customImage) ? food.customImage : ''
  let iconText = [...(food.iconText || food.symbol || food.name)].slice(0, 2).join('')
  const previewFood = () => ({ ...food, iconText, useIcon: iconChoice !== 'text', icon: resolveFoodIconId(iconChoice), customImage: iconChoice === 'custom' ? customIconImage : '', pixelArt: pixelDrawing, pixelIcon: iconChoice.startsWith('pixel-') ? iconChoice : '', iconSource: iconChoice === 'handdrawn' ? 'pixel-art' : iconChoice.startsWith('pixel-') ? 'pixel-library' : 'original' })
  const renderChoice = () => {
    const preview = document.querySelector('#food-icon-picker-preview')
    if (preview) preview.innerHTML = foodIconHtml(previewFood())
    sheetContent.querySelectorAll('[data-food-icon-choice]').forEach((button) => {
      button.classList.toggle('active', button.dataset.foodIconChoice === iconChoice)
      button.setAttribute('aria-pressed', String(button.dataset.foodIconChoice === iconChoice))
    })
    document.querySelector('#upload-food-icon')?.classList.toggle('active', iconChoice === 'custom')
    document.querySelector('#draw-food-icon')?.classList.toggle('active', iconChoice === 'handdrawn')
    const textInput=document.querySelector('#food-icon-text')
    if(textInput)textInput.hidden=iconChoice!=='text'
    const textChoice=sheetContent.querySelector('[data-food-icon-choice="text"] > span')
    if(textChoice)textChoice.textContent=iconText
  }

  sheetKicker.textContent = 'FOOD ICON'
  sheetTitle.textContent = `修改${food.name}图标`
  sheetContent.innerHTML = `<div class="food-icon-picker">
    <div class="food-icon-picker-summary"><span class="food-icon-preview" id="food-icon-picker-preview">${foodIconHtml(previewFood())}</span><strong>${escapeHtml(food.name)}</strong><input id="food-icon-text" type="text" maxlength="2" aria-label="图标文字" value="${escapeHtml(iconText)}" ${iconChoice==='text'?'':'hidden'}></div>
    <div class="food-icon-source-options">
      <button class="food-icon-option ${iconChoice === 'text' ? 'active' : ''}" type="button" data-food-icon-choice="text"><span>${escapeHtml(food.name.slice(0, 2))}</span><small>文字</small></button>
      <button class="food-icon-option upload ${iconChoice === 'custom' ? 'active' : ''}" type="button" id="upload-food-icon">${customIconImage ? '<span>替换</span>' : '<span>＋</span>'}<small>本地图片</small></button>
      <button class="food-icon-option" type="button" id="draw-food-icon"><span>▦</span><small>像素手绘</small></button>
    </div>
    <div class="food-icon-browser-controls"><label class="form-field"><span>查找图标</span><input id="food-icon-search" type="search" placeholder="如蘑菇、牛奶" aria-label="搜索食物图标"></label><label class="form-field"><span>图标分类</span><select id="food-icon-group"><option value="">全部分类</option>${[...new Set(allIcons.map(icon=>icon.group))].map(group=>`<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join('')}</select></label></div>
    <small class="food-icon-count" id="food-icon-count" role="status">${FOOD_ICON_CATALOG.length} 个图标 · 可离线使用</small>
    <div class="food-icon-pack" aria-label="食物图标包">${allIcons.map((icon) => `<button class="food-icon-option ${iconChoice === icon.id ? 'active' : ''}" type="button" data-food-icon-choice="${icon.id}" aria-label="${escapeHtml(icon.name)}" title="${escapeHtml(icon.name)}"><img class="${icon.path ? 'pixel-image' : ''}" src="${escapeHtml(icon.path || foodIconPath(icon.id))}" alt="" loading="lazy"><small>${escapeHtml(icon.name)}</small></button>`).join('')}</div>
    <button class="primary-action" id="save-food-icon" type="button">保存图标</button>
  </div>`

  sheetContent.querySelectorAll('[data-food-icon-choice]').forEach((button) => button.addEventListener('click', () => {
    iconChoice = button.dataset.foodIconChoice
    renderChoice()
  }))
  document.querySelector('#food-icon-text').addEventListener('input',event=>{iconText=[...event.target.value].slice(0,2).join('');event.target.value=iconText;renderChoice()})
  const filterIcons = () => {
    const query = document.querySelector('#food-icon-search').value.trim().toLowerCase()
    const group = document.querySelector('#food-icon-group').value
    const matching = new Set(allIcons.filter(icon => (!group || icon.group === group) && `${icon.name} ${icon.keywords}`.toLowerCase().includes(query)).map(icon=>icon.id))
    sheetContent.querySelectorAll('.food-icon-pack [data-food-icon-choice]').forEach(button => { button.hidden = !matching.has(button.dataset.foodIconChoice) })
    document.querySelector('#food-icon-count').textContent = matching.size ? `${matching.size} 个图标 · 可离线使用` : '没有匹配图标，可换个关键词或使用文字 / 本地图片'
  }
  document.querySelector('#food-icon-search').addEventListener('input', filterIcons)
  document.querySelector('#food-icon-group').addEventListener('change', filterIcons)
  document.querySelector('#draw-food-icon').addEventListener('click', () => openPixelArtEditor(pixelDrawing, value => { pixelDrawing = value; iconChoice = 'handdrawn'; renderChoice() }))
  filterIcons()
  renderChoice()
  document.querySelector('#upload-food-icon').addEventListener('click', () => {
    foodIconInput.value = ''
    foodIconInput.click()
  })
  foodIconInput.onchange = async () => {
    const file = foodIconInput.files?.[0]
    if (!file) return
    try {
      customIconImage = await resizeMealPhoto(file)
      iconChoice = 'custom'
      renderChoice()
    } catch (error) {
      showToast(error.message || '图片读取失败')
    }
  }
  document.querySelector('#save-food-icon').addEventListener('click', () => {
    if (iconChoice === 'handdrawn') {
      food.pixelArt = pixelDrawing
      food.iconSource = 'pixel-art'
      food.useIcon = true
    } else if (iconChoice.startsWith('pixel-')) {
      food.pixelIcon = iconChoice
      food.iconSource = 'pixel-library'
      food.useIcon = true
    } else if (iconChoice === 'text') {
      food.iconText = iconText.trim() || [...food.name].slice(0,2).join('')
      food.useIcon = false
      delete food.icon
      delete food.customImage
    } else if (iconChoice === 'custom') {
      if (!customIconImage) {
        showToast('请先选择本地图片')
        return
      }
      food.useIcon = true
      food.customImage = customIconImage
      delete food.icon
    } else {
      food.useIcon = true
      food.icon = iconChoice
      delete food.customImage
    }
    if (iconChoice !== 'handdrawn' && !iconChoice.startsWith('pixel-')) food.iconSource = 'original'
    if (pixelDrawing) food.pixelArt = pixelDrawing
    renderFoodLibrary()
    renderMeals()
    updateSummary()
    renderPrep()
    persistState()
    foodIconInput.onchange = null
    closeSheet()
    showToast(`${food.name}图标已更新`)
  })
  openSheet()
}

function normalizeWeightRecords(records) {
  const latestByDate = new Map()
  ;(Array.isArray(records) ? records : []).forEach((record) => {
    const weight = Number(record?.weight)
    const measuredAt = Number(record?.measuredAt)
    const date = /^\d{4}-\d{2}-\d{2}$/.test(record?.date || '') ? record.date : dateKey(new Date(measuredAt))
    if (!Number.isFinite(weight) || weight < 0.1 || weight > 500 || !Number.isFinite(measuredAt)) return
    const normalized = { id: record.id || `weight-${date}-${measuredAt}`, date, weight: Math.round(weight * 100) / 100, measuredAt, source: record.source || 'manual' }
    const current = latestByDate.get(date)
    if (!current || normalized.measuredAt >= current.measuredAt) latestByDate.set(date, normalized)
  })
  return [...latestByDate.values()].sort((a, b) => a.measuredAt - b.measuredAt)
}

function upsertWeightRecord(weightValue, measuredAt = Date.now(), source = 'manual') {
  const weight = Math.round(Number(weightValue) * 100) / 100
  const timestamp = Number(measuredAt) || Date.now()
  if (!Number.isFinite(weight) || weight < 0.1 || weight > 500) return false
  const date = dateKey(new Date(timestamp))
  const existing = state.weightRecords.find((record) => record.date === date)
  if (existing && existing.measuredAt > timestamp) return false
  const record = { id: existing?.id || `weight-${date}-${timestamp}`, date, weight, measuredAt: timestamp, source }
  state.weightRecords = normalizeWeightRecords([...state.weightRecords.filter((item) => item.date !== date), record])
  const latest = state.weightRecords[state.weightRecords.length - 1]
  if (latest) state.bodyProfile.weight = latest.weight
  return true
}

function weightRecordForDate(year, month, day) {
  const key = dateKey(new Date(year, month, day))
  return state.weightRecords.find((record) => record.date === key)
}

function openWeightRecordSheet() {
  const targetDate = selectedDate() > APP_TODAY ? APP_TODAY_KEY : dateKey(selectedDate())
  const existing = state.weightRecords.find((record) => record.date === targetDate)
  sheetKicker.textContent = 'WEIGHT'
  sheetTitle.textContent = '记录体重'
  sheetContent.innerHTML = `<div class="weight-record-editor">
    <label class="form-field weight-record-value"><span>体重</span><input id="weight-record-value" type="number" min="${bodyWeightInputBounds(20,500).min}" max="${bodyWeightInputBounds(20,500).max}" step="${state.weightUnit === 'jin' ? '0.1' : '0.01'}" value="${bodyWeightDisplayValue(existing?.weight || state.bodyProfile.weight || '')}" inputmode="decimal"><em>${bodyWeightUnitLabel()}</em></label>
    <label class="form-field"><span>测量日期</span><input id="weight-record-date" type="date" max="${APP_TODAY_KEY}" value="${targetDate}"></label>
    <p class="sheet-hint">每天保留最近一次体重。数据只存储在本机，并用于体重趋势和当前体重参数。</p>
    <button class="primary-action" id="save-weight-record" type="button">保存体重</button>
  </div>`
  document.querySelector('#save-weight-record').addEventListener('click', () => {
    const displayValue = document.querySelector('#weight-record-value').value
    const weight = bodyWeightFromDisplay(displayValue)
    const dateValue = document.querySelector('#weight-record-date').value
    if (!displayValue || !Number.isFinite(weight) || weight < 20 || weight > 500 || !dateValue) {
      showToast('请填写有效的体重和日期')
      return
    }
    const existingAt = state.weightRecords.find((record) => record.date === dateValue)?.measuredAt || 0
    const measuredAt = Math.max(dateValue === APP_TODAY_KEY ? Date.now() : new Date(`${dateValue}T12:00:00`).getTime(), existingAt)
    upsertWeightRecord(weight, measuredAt, 'manual')
    persistState()
    updateSettingsSummaries()
    renderTrends()
    closeSheet()
    showToast(`已记录 ${formatBodyWeight(weight)}`)
  })
  openSheet()
}

let lastHealthSyncAttemptAt = 0
let healthWeightReadPending = null
let healthHistoryReading = false

function parseHealthWeightResult(rawResult) {
  const result = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult
  if (!result || typeof result.success !== 'boolean') {
    throw new Error('Invalid native weight response')
  }
  if (result.success && (typeof result.kg !== 'number' || !Number.isFinite(result.kg) || result.kg < 0.1 || result.kg > 500 ||
      typeof result.measuredAt !== 'number' || !Number.isFinite(result.measuredAt) || result.measuredAt <= 0 || result.measuredAt > Date.now())) {
    return { success: false, code: 'INVALID_WEIGHT', message: '体重或测量时间无效，请检查运动健康中的记录' }
  }
  return result
}

async function readHealthWeight(bridge, interactive = true) {
  if (healthHistoryReading) return { success: false, code: 'BUSY', message: '历史体重正在读取，请稍后同步' }
  // Share repeated taps; an explicit tap after a background check may still request authorization.
  if (healthWeightReadPending) {
    const pending = healthWeightReadPending
    if (!interactive || pending.interactive) return pending.promise
    await pending.promise
    return readHealthWeight(bridge, interactive)
  }
  const promise = (async () => {
    let timeout
    try {
      const operation = interactive ? bridge.importLatestWeight()
        : typeof bridge.readLatestWeightIfAuthorized === 'function' ? bridge.readLatestWeightIfAuthorized()
          : JSON.stringify({ success: false, code: 0, message: '' })
      const rawResult = await Promise.race([operation, new Promise((resolve) => {
        timeout = setTimeout(() => resolve({ success: false, code: 'TIMEOUT', message: '等待同步超时，请完成授权后重试' }), interactive ? 120000 : 30000)
      })])
      return parseHealthWeightResult(rawResult)
    } catch (error) {
      return { success: false, code: 'BRIDGE_RESPONSE', message: '未收到原生体重接口的有效返回，请更新应用后重试' }
    } finally {
      clearTimeout(timeout)
    }
  })()
  const pending = { interactive, promise }
  healthWeightReadPending = pending
  try {
    return await promise
  } finally {
    if (healthWeightReadPending === pending) healthWeightReadPending = null
  }
}

function healthWeightFailureMessage(result) {
  return `${result.message || '体重读取未完成，请重试'}${result.code ? `（${result.code}）` : ''}`
}

function healthWeightBridgeStatus() {
  const bridge = window.healthWeightBridge
  if (!bridge || typeof bridge.importLatestWeight !== 'function') {
    const preview=['127.0.0.1','localhost'].includes(location.hostname)
    return { bridge: null, available: false, message: preview ? '当前是 Web 试用版，体重同步需在鸿蒙应用中使用' : '原生体重接口未连接，请关闭并重新打开应用；若仍失败需检查安装版本' }
  }
  try {
    if (typeof bridge.isAvailable === 'function' && bridge.isAvailable() !== true) {
      return { bridge, available: false, message: '当前设备不支持华为运动健康，请使用华为真机' }
    }
  } catch (error) {
    return { bridge: null, available: false, message: '原生同步服务未就绪，请重新打开应用' }
  }
  return { bridge, available: true, message: '' }
}

function updateHealthAccountSummary() {
  const summary = document.querySelector('#health-account-summary')
  const action = document.querySelector('#health-account-action')
  if (!summary || !action) return
  const status = healthWeightBridgeStatus()
  const lastHealthWeight = [...state.weightRecords].reverse().find((record) => record.source === 'huawei-health')
  if (lastHealthWeight) summary.textContent = `最近同步 ${formatBodyWeight(lastHealthWeight.weight)}`
  else summary.textContent = status.available ? '点击后由系统登录并授权' : status.message
  action.firstChild.textContent = status.available ? '同步 ' : '说明 '
}

async function syncLatestHealthWeight(interactive = true) {
  const status = healthWeightBridgeStatus()
  if (!status.bridge || !status.available) {
    if (interactive) showToast(status.message)
    return false
  }
  const bridge = status.bridge
  const button = document.querySelector('#health-sync-button')
  const originalText = button?.querySelector('span')?.textContent || '同步体重'
  if (interactive && button) {
    button.disabled = true
    button.querySelector('span').textContent = '同步中'
  }
  lastHealthSyncAttemptAt = Date.now()
  try {
    const result = await readHealthWeight(bridge, interactive)
    if (!result.success) {
      if (interactive) {
        const message = healthWeightFailureMessage(result)
        showToast(message)
        const summary=document.querySelector('#health-account-summary');if(summary)summary.textContent=message
      }
      return false
    }
    const changed = upsertWeightRecord(result.kg, result.measuredAt, 'huawei-health')
    persistState()
    updateSettingsSummaries()
    renderTrends()
    if (interactive) showToast(changed ? `已同步 ${formatBodyWeight(result.kg)}` : '已是最新体重')
    return true
  } catch (error) {
    if (interactive) showToast('体重已读取，但本地保存或页面更新失败，请重试')
    return false
  } finally {
    if (interactive && button) {
      button.disabled = false
      button.querySelector('span').textContent = originalText
    }
  }
}

function autoSyncHealthWeight() {
  if (!state.onboardingCompleted || !state.healthAutoSyncEnabled || Date.now() - lastHealthSyncAttemptAt < 30000) return
  void syncLatestHealthWeight(false)
}

function parseHealthWeightHistory(rawResult) {
  const result = typeof rawResult === 'string' ? JSON.parse(rawResult) : rawResult
  if (!result || typeof result.success !== 'boolean') throw new Error('Invalid history response')
  if (!result.success) return result
  const oldest = new Date()
  const month = oldest.getUTCMonth()
  oldest.setUTCFullYear(oldest.getUTCFullYear() - 1)
  if (oldest.getUTCMonth() !== month) oldest.setUTCDate(0)
  // Native records are already range-filtered. Allow for query duration at the year boundary.
  if (!Number.isFinite(result.startTime) || !Number.isFinite(result.endTime) || result.startTime < oldest.getTime() - 300000 ||
      result.endTime > Date.now() || result.endTime <= result.startTime || !Array.isArray(result.records) || result.records.length > 100000) {
    throw new Error('Invalid history range')
  }
  for (const record of result.records) {
    if (typeof record.kg !== 'number' || !Number.isFinite(record.kg) || record.kg < 0.1 || record.kg > 500 ||
        !Number.isFinite(record.measuredAt) || record.measuredAt < result.startTime || record.measuredAt > result.endTime) {
      throw new Error('Invalid historical weight')
    }
  }
  return result
}

function planHealthWeightHistory(records, existingRecords = state.weightRecords) {
  const incoming = normalizeWeightRecords(records.map((record) => ({ weight: record.kg, measuredAt: record.measuredAt, source: 'huawei-health' })))
  const byDate = new Map(existingRecords.map((record) => [record.date, record]))
  let added = 0, updated = 0, kept = 0
  for (const record of incoming) {
    const existing = byDate.get(record.date)
    // Manual/other-source records are never overwritten by a batch import.
    if (existing && (existing.source !== 'huawei-health' || existing.measuredAt >= record.measuredAt)) {
      kept++
      continue
    }
    byDate.set(record.date, existing ? { ...record, id: existing.id } : record)
    if (existing) updated++
    else added++
  }
  return { records: [...byDate.values()].sort((a, b) => a.measuredAt - b.measuredAt), added, updated, kept, days: incoming.length }
}

function openHealthWeightHistorySheet() {
  beginEditorPage('health-weight-history')
  sheetKicker.textContent = 'WEIGHT HISTORY'
  sheetTitle.textContent = '导入历史体重'
  sheetContent.innerHTML = `<div class="weight-record-editor">
    <p class="sheet-hint">读取华为运动健康近一年体重，按测量日期归入趋势，每天保留最后一次测量。同日手工记录保留，不修改当前身体参数和营养目标。</p>
    <p id="health-history-status" role="status">确认授权后读取，预览后再导入。</p>
    <button class="primary-action" id="read-health-history" type="button">读取近一年体重</button>
    <button class="primary-action" id="apply-health-history" type="button" hidden>确认导入</button>
  </div>`
  const readButton = sheetContent.querySelector('#read-health-history')
  const saveButton = sheetContent.querySelector('#apply-health-history')
  const statusText = sheetContent.querySelector('#health-history-status')
  let preview = null
  readButton.addEventListener('click', async () => {
    const status = healthWeightBridgeStatus()
    if (!status.available) { showToast(status.message); return }
    if (typeof status.bridge.importWeightHistory !== 'function') { showToast('当前安装版本不支持历史导入，请更新鸿蒙应用'); return }
    if (healthHistoryReading) { showToast('历史体重正在读取，请稍后重试'); return }
    healthHistoryReading = true
    readButton.disabled = true
    statusText.textContent = '正在读取近一年体重…'
    let timeout
    try {
      // Do not open competing authorization dialogs during an ongoing latest-weight request.
      if (healthWeightReadPending) await healthWeightReadPending.promise
      if (!readButton.isConnected || document.querySelector('#bottom-sheet').hidden) return
      const raw = await Promise.race([status.bridge.importWeightHistory(), new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('TIMEOUT')), 120000)
      })])
      if (!readButton.isConnected || document.querySelector('#bottom-sheet').hidden) return
      const result = parseHealthWeightHistory(raw)
      if (!result.success) { statusText.textContent = healthWeightFailureMessage(result); return }
      preview = result.records
      const plan = planHealthWeightHistory(preview)
      if (!preview.length) { statusText.textContent = '近一年暂无可导入的体重'; return }
      const first = preview.reduce((time, item) => Math.min(time, item.measuredAt), Infinity)
      const last = preview.reduce((time, item) => Math.max(time, item.measuredAt), 0)
      statusText.textContent = `${dateKey(new Date(first))} — ${dateKey(new Date(last))} · ${plan.days} 天\n新增 ${plan.added} 天 · 更新 ${plan.updated} 天 · 保留 ${plan.kept} 天`
      statusText.style.whiteSpace = 'pre-line'
      saveButton.hidden = plan.added + plan.updated === 0
      readButton.hidden = !saveButton.hidden
    } catch (error) {
      if (readButton.isConnected) statusText.textContent = error.message === 'TIMEOUT' ? '读取超时，请稍后重试；本地记录未改动' : '未收到有效的历史体重数据，本地记录未改动，请重试'
    } finally {
      clearTimeout(timeout)
      healthHistoryReading = false
      readButton.disabled = false
    }
  })
  saveButton.addEventListener('click', () => {
    if (!preview || saveButton.disabled) return
    saveButton.disabled = true
    // Recompute against current records in case a latest-weight sync finished during preview.
    const plan = planHealthWeightHistory(preview)
    const previous = state.weightRecords
    state.weightRecords = plan.records
    try {
      persistState()
    } catch (error) {
      state.weightRecords = previous
      saveButton.disabled = false
      showToast('本地保存失败，已有记录未改动，请检查存储空间后重试')
      return
    }
    updateSettingsSummaries()
    renderTrends()
    closeSheet()
    showToast(`已导入 ${plan.added + plan.updated} 天体重，保留 ${plan.kept} 天已有记录`)
  })
  openSheet()
}

function trendEntryForDate(year, month, day) {
  const weightRecord = weightRecordForDate(year, month, day)
  const record = state.dailyRecords[dateKey(new Date(year, month, day))]
  const recordedMeals = [...(record?.meals || []), ...(record?.hiddenMeals || [])]
    .filter((meal) => meal.items?.length > 0 && !meal.isPlanned)
  const cost=dailyConsumptionCost(dateKey(new Date(year,month,day)))
  if (!recordedMeals.length) {
    return { year, month, day, calories: 0, carbs: 0, protein: 0, fat: 0, weight: weightRecord?.weight || 0,cost }
  }
  const nutrition = recordedMeals.reduce((sum, meal) => {
    const mealTotal = nutrientsForItems(meal.items)
    sum.calories += mealTotal.calories
    sum.carbs += mealTotal.carbs
    sum.protein += mealTotal.protein
    sum.fat += mealTotal.fat
    return sum
  }, { calories: 0, carbs: 0, protein: 0, fat: 0 })
  return {
    year,
    month,
    day,
    calories: Math.round(nutrition.calories),
    carbs: Math.round(nutrition.carbs),
    protein: Math.round(nutrition.protein),
    fat: Math.round(nutrition.fat),
    weight: weightRecord?.weight || 0,cost
  }
}

function trendAnchorDate() {
  return new Date(APP_TODAY.getFullYear(), APP_TODAY.getMonth(), APP_TODAY.getDate())
}

function currentTrendData() {
  const end = trendAnchorDate()
  const start = state.trendPeriod === 'halfyear' ? new Date(end.getFullYear(), end.getMonth() - 5, 1) : state.trendPeriod === 'month'
    ? new Date(end.getFullYear(), end.getMonth(), end.getDate() - 29)
    : new Date(end.getFullYear(), end.getMonth(), end.getDate() - 6)
  const dayCount = Math.round((end - start) / 86400000) + 1
  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    return trendEntryForDate(date.getFullYear(), date.getMonth(), date.getDate())
  })
}

function trendDayLabel(entry) {
  return `${entry.month + 1}月${entry.day}日`
}

function showChartTooltip(chartName, dateValue) {
  const data = currentTrendData()
  const entry = data.find((item) => dateKey(new Date(item.year, item.month, item.day)) === dateValue)
  if (!entry) return
  const chart = document.querySelector(`#${chartName}-chart`)
  chart.querySelectorAll('.chart-day').forEach((button) => button.classList.toggle('selected', button.dataset.trendDate === dateValue))
  const tooltip = document.querySelector(`#${chartName}-tooltip`)
  tooltip.innerHTML = `<strong>${trendDayLabel(entry)}</strong><span>热量 ${entry.calories} kcal</span><span>碳 ${entry.carbs}g · 蛋 ${entry.protein}g · 脂 ${entry.fat}g</span>`
  tooltip.hidden = false
}

function renderWeightTrend(data) {
  const records = data.map((entry, index) => ({ ...entry, index })).filter((entry) => entry.weight > 0)
  const averageWeight = records.length ? records.reduce((sum, entry) => sum + entry.weight, 0) / records.length : 0
  document.querySelector('#average-weight').textContent = records.length ? formatBodyWeight(averageWeight) : '—'
  if (records.length > 1) {
    const change = records[records.length - 1].weight - records[0].weight
    document.querySelector('#weight-change').textContent = `${change > 0 ? '+' : change < 0 ? '−' : ''}${formatBodyWeight(Math.abs(change))}`
  } else document.querySelector('#weight-change').textContent = records.length ? '单次记录' : '暂无记录'

  const chart = document.querySelector('#weight-chart')
  const labels = document.querySelector('#weight-chart-labels')
  if (!records.length) {
    chart.innerHTML = '<title id="weight-title">体重变化趋势</title><path class="chart-grid" d="M8 24H322M8 64H322M8 104H322"/><text class="chart-empty-text" x="165" y="68">记录体重后显示趋势</text>'
    labels.innerHTML = ''
    return
  }

  const weights = records.map((entry) => entry.weight)
  const minimum = Math.min(...weights)
  const maximum = Math.max(...weights)
  const padding = Math.max(0.3, (maximum - minimum) * 0.2)
  const low = minimum - padding
  const high = maximum + padding
  const range = Math.max(0.6, high - low)
  const xFor = (index) => data.length <= 1 ? 165 : 8 + index / (data.length - 1) * 314
  const yFor = (weight) => 108 - (weight - low) / range * 84
  const points = records.map((entry) => ({ ...entry, x: rounded(xFor(entry.index)), y: rounded(yFor(entry.weight)) }))
  const pointList = points.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPath = points.length > 1 ? `M${points[0].x} ${points[0].y} L${points.slice(1).map((point) => `${point.x} ${point.y}`).join(' L')} L${points[points.length - 1].x} 120 L${points[0].x} 120Z` : ''
  chart.innerHTML = `<title id="weight-title">体重变化趋势</title><path class="chart-grid" d="M8 24H322M8 64H322M8 104H322"/>${areaPath ? `<path class="chart-area" d="${areaPath}"/>` : ''}${points.length > 1 ? `<polyline class="chart-line" points="${pointList}"/>` : ''}<g class="chart-points">${points.map((point) => `<circle cx="${point.x}" cy="${point.y}" r="4"><title>${trendDayLabel(point)} ${formatBodyWeight(point.weight)}</title></circle>`).join('')}</g>`
  const labelPoints = records.length <= 3 ? records : [records[0], records[Math.floor((records.length - 1) / 2)], records[records.length - 1]]
  labels.innerHTML = labelPoints.map((entry) => `<span>${String(entry.month + 1).padStart(2, '0')}.${String(entry.day).padStart(2, '0')}</span>`).join('')
}

function renderTrendStatistics() {
  const data = currentTrendData()
  const recorded = data.filter((entry) => entry.calories > 0)
  const average = (key) => recorded.length ? Math.round(recorded.reduce((sum, entry) => sum + entry[key], 0) / recorded.length) : 0
  document.querySelector('#average-calories').textContent = average('calories').toLocaleString('zh-CN')
  document.querySelector('#average-carbs').textContent = average('carbs')
  document.querySelector('#average-protein').textContent = average('protein')
  document.querySelector('#average-fat').textContent = average('fat')
  const first = data[0]
  const last = data[data.length - 1]
  document.querySelector('#trend-period-label').textContent = `${first.month + 1}月${first.day}–${last.month + 1 === first.month + 1 ? '' : `${last.month + 1}月`}${last.day}日`
  renderWeightTrend(data)

  renderMonthlyTrendChart('calorie', data)
  renderMonthlyTrendChart('macro', data)
  renderConsumptionTrend(data)
  applyTrendCardPreferences()
}

function showCalendarDay(dateValue) {
  const [year, month, day] = dateValue.split('-').map(Number)
  const entry = trendEntryForDate(year, month - 1, day)
  state.selectedCalendarDate = dateValue
  document.querySelectorAll('.calendar-day').forEach((button) => button.classList.toggle('selected', button.dataset.calendarDate === dateValue))
  const hasNutrition = ['calories', 'carbs', 'protein', 'fat'].some(key => entry[key] > 0)
  document.querySelector('#calendar-day-detail').innerHTML = `<strong>${month}月${day}日</strong>${hasNutrition ? `<span>热量 ${entry.calories} kcal</span><span>碳 ${entry.carbs}g</span><span>蛋 ${entry.protein}g</span><span>脂 ${entry.fat}g</span>` : '<span>暂无饮食记录</span>'}`
}

function renderNutritionCalendar() {
  const anchor = trendAnchorDate()
  const monthDate = new Date(anchor.getFullYear(), anchor.getMonth() + state.calendarMonthOffset, 1)
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  document.querySelector('#calendar-title').textContent = `${year}年${month + 1}月`
  const firstCellDate = new Date(year, month, 1 - monthDate.getDay())
  const calendar = document.querySelector('#nutrition-calendar')
  const cellCount = Math.ceil((monthDate.getDay() + new Date(year, month + 1, 0).getDate()) / 7) * 7
  const cells = Array.from({ length: cellCount }, (_, index) => {
    const cellDate = new Date(firstCellDate.getFullYear(), firstCellDate.getMonth(), firstCellDate.getDate() + index)
    const entry = trendEntryForDate(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate())
    const outside = cellDate.getMonth() !== month
    const today = dateKey(cellDate) === APP_TODAY_KEY
    const target = targetForDayType(plannedNutritionDayTypeForDate(cellDate), state.methodId, cellDate)
    const widths = Object.fromEntries(['calories', 'carbs', 'protein', 'fat'].map((key) => [key, entry[key] ? Math.max(8, percentage(entry[key], target[key])) : 0]))
    const overflowWidths = Object.fromEntries(['calories', 'carbs', 'protein', 'fat'].map((key) => [key, overflowPercentage(entry[key], target[key], 10)]))
    const hasNutrition = ['calories', 'carbs', 'protein', 'fat'].some(key => entry[key] > 0)
    const metric = (key) => `<span class="calendar-metric ${key} ${overflowWidths[key] ? 'over' : ''}"><i style="--value-width:${widths[key]}%;--overflow-width:${overflowWidths[key]}%"></i><em>${hasNutrition ? Math.round(entry[key]) : ''}</em></span>`
    return `<button class="calendar-day ${outside ? 'outside' : ''} ${today ? 'today' : ''} ${hasNutrition ? 'has-nutrition' : 'empty-day'}" type="button" data-calendar-date="${dateKey(cellDate)}" aria-label="查看${cellDate.getMonth() + 1}月${cellDate.getDate()}日营养"><strong>${cellDate.getDate()}</strong><span class="calendar-day-metrics">${metric('calories')}${metric('carbs')}${metric('protein')}${metric('fat')}</span></button>`
  })
  calendar.innerHTML = Array.from({ length: cellCount / 7 }, (_, weekIndex) => `<div class="calendar-week"><div class="calendar-week-labels" aria-hidden="true"><b class="calories">卡</b><b class="carbs">碳</b><b class="protein">蛋</b><b class="fat">脂</b></div><div class="calendar-week-days">${cells.slice(weekIndex * 7, weekIndex * 7 + 7).join('')}</div></div>`).join('')
  calendar.querySelectorAll('[data-calendar-date]').forEach((button) => {
    button.addEventListener('click', () => {
      if (calendar.dataset.suppressSwipeClick === 'true') return
      showCalendarDay(button.dataset.calendarDate)
    })
  })
  attachCalendarSwipeGesture()
  const selectedButton = calendar.querySelector(`[data-calendar-date="${state.selectedCalendarDate}"]`)
  if (selectedButton) showCalendarDay(state.selectedCalendarDate)
  else document.querySelector('#calendar-day-detail').textContent = '点击日期查看当日营养'
}

function attachCalendarSwipeGesture() {
  const calendarCard = document.querySelector('.calendar-card')
  if (!calendarCard || calendarCard.dataset.swipeBound === 'true') return
  calendarCard.dataset.swipeBound = 'true'
  let startPoint = null
  let horizontal = false
  const reset = () => {
    startPoint = null
    horizontal = false
  }
  calendarCard.addEventListener('click', (event) => {
    if (calendarCard.dataset.suppressSwipeClick !== 'true') return
    event.preventDefault()
    event.stopPropagation()
    calendarCard.dataset.suppressSwipeClick = 'false'
  }, true)
  calendarCard.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    startPoint = { x: event.clientX, y: event.clientY }
    horizontal = false
  })
  calendarCard.addEventListener('pointermove', (event) => {
    if (!startPoint) return
    const distanceX = event.clientX - startPoint.x
    const distanceY = event.clientY - startPoint.y
    if (!horizontal && Math.abs(distanceX) > 8 && Math.abs(distanceX) > Math.abs(distanceY)) horizontal = true
    if (horizontal) event.preventDefault()
  })
  calendarCard.addEventListener('pointerup', (event) => {
    if (!startPoint) return
    const distanceX = event.clientX - startPoint.x
    const distanceY = event.clientY - startPoint.y
    if (horizontal && Math.abs(distanceX) >= 48 && Math.abs(distanceX) > Math.abs(distanceY) * 1.2) {
      calendarCard.dataset.suppressSwipeClick = 'true'
      window.setTimeout(() => { calendarCard.dataset.suppressSwipeClick = 'false' }, 120)
      state.calendarMonthOffset += distanceX < 0 ? 1 : -1
      renderNutritionCalendar()
    }
    reset()
  })
  calendarCard.addEventListener('pointercancel', reset)
}

function renderTrends() {
  const statistics = document.querySelector('#trend-statistics')
  const calendar = document.querySelector('#trend-calendar')
  const isCalendar = state.trendView === 'calendar'
  statistics.hidden = isCalendar
  calendar.hidden = !isCalendar
  document.querySelectorAll('[data-trend-view]').forEach((button) => {
    const selected = button.dataset.trendView === state.trendView
    button.classList.toggle('active', selected)
    button.setAttribute('aria-selected', String(selected))
  })
  if (isCalendar) renderNutritionCalendar()
  else renderTrendStatistics()
  const periodTools = document.querySelector('.standalone-trend-period')
  if (periodTools) periodTools.hidden = isCalendar
}

function switchPage(pageName, options = {}) {
  if (optionalSettingsPage && !optionalSettingsPage.hidden) closeOptionalSettingsPage()
  if (state.page === pageName) return
  const previousPage = state.page
  if (options.pushHistory !== false && previousPage !== pageName) {
    pageHistory.push(previousPage)
    if (pageHistory.length > 20) pageHistory.shift()
  }
  const pageOrder = ['today', 'foods', 'prep', 'insights', 'profile']
  const direction = pageOrder.indexOf(pageName) >= pageOrder.indexOf(state.page) ? 1 : -1
  document.querySelectorAll('[data-page]').forEach((page) => {
    const selected = page.dataset.page === pageName
    page.classList.toggle('active', selected)
    page.hidden = !selected
    if (selected && page.classList.contains('scroll-page')) page.scrollTop = 0
    if (selected && pageName === 'foods') foodLibrary.scrollTop = 0
  })
  document.querySelectorAll('[data-nav]').forEach((button) => button.classList.toggle('active', button.dataset.nav === pageName))
  state.page = pageName
  if (pageName === 'prep') renderPrep()
  if (pageName === 'insights') renderTrends()
  animatePageSelection(pageName, direction)
}

function openSheet() {
  showEditorPage()
}

function closeSheet() {
  leaveEditorPage()
}

function handleNativeBack() {
  if(typeof unsavedPrompt!=='undefined' && unsavedPrompt){unsavedPrompt.dismiss();return true}
  if(typeof activeNumberKeypad!=='undefined' && activeNumberKeypad){closeNumberKeypad();return true}
  if(typeof requestUnsavedExit==='function' && requestUnsavedExit(handleNativeBack))return true
  if(typeof activeActionDialog!=='undefined' && activeActionDialog){activeActionDialog.close();return true}
  if (sheet.getAttribute('aria-hidden') === 'false') {
    closeSheet()
    return true
  }
  if (!mealSetPage.hidden) {
    if (mealSetEditorState?.kind === 'schedule') {
      closeMealSetPage()
      switchPage('prep', { pushHistory: false })
    } else if (mealSetEditorState) {
      mealSetEditorState = null
      renderMealSetPageList()
      mealSetPageContent.scrollTop = 0
    } else closeMealSetPage()
    return true
  }
  if (optionalSettingsPage && !optionalSettingsPage.hidden) {
    closeOptionalSettingsPage()
    return true
  }
  if (!featureTour.hidden) {
    finishFeatureTour()
    return true
  }
  if (!onboarding.hidden) return true
  if (pageHistory.length) {
    switchPage(pageHistory.pop(), { pushHistory: false })
    return true
  }
  if (state.page !== 'today') {
    switchPage('today', { pushHistory: false })
    return true
  }
  return false
}

window.handleNativeBack = handleNativeBack

function mealCommonItems(mealRef, now = Date.now()) {
  const mealId = mealKeyFromRef(mealRef)
  const dayType = normalizeDayType(mealId?.split('-')[0])
  const mealIndex = Math.max(0, mealSlotsForDay(dayType).findIndex((meal) => meal.id === mealId))
  const presets = new Map()
  for (const item of preferredMealSetForSlot(mealId, mealIndex)?.items || []) {
    const id = canonicalFoodId(item.foodId)
    if (!presets.has(id)) presets.set(id, item)
  }
  const behaviors = new Map()
  for (const item of rankedRecentItemsForMeal(mealRef, now)) {
    const id = canonicalFoodId(item.foodId)
    if (!behaviors.has(id)) behaviors.set(id, item)
  }
  const deleted = new Set(state.deletedFoodIds.map(canonicalFoodId))
  const candidates = [...new Set([...behaviors.keys(), ...presets.keys()])]
    .filter(id => foodById(id) && !deleted.has(id))
    .map((foodId, index) => {
      const behavior = behaviors.get(foodId)
      const preset = presets.get(foodId)
      const usage = mealUsageStats(behavior, now)
      const recentAmount = Number(behavior?.amount)
      const presetAmount = Number(preset?.amount)
      const amount = Number.isFinite(recentAmount) && recentAmount > 0 ? recentAmount : Number.isFinite(presetAmount) && presetAmount > 0 ? presetAmount : 100
      return { foodId, amount, index, ...usage, score: usage.score + (presets.has(foodId) ? MEAL_COMMON_SCORING.presetBonus : 0) }
    })
  return candidates.sort((a, b) => b.score - a.score || b.lastUsed - a.lastUsed || b.useCount - a.useCount || a.index - b.index)
    .slice(0, MEAL_COMMON_SCORING.visibleLimit).map(({ foodId, amount }) => ({ foodId, amount }))
}

function matchesFoodLogFilter(food, filter) {
  if (filter === 'ingredients') return food.kind !== 'dish'
  return filter === 'all' || matchesFoodFilters(food, [filter])
}

function foodLogCandidates(mealRef, keyword = '', filter = 'all', includeCommon = false) {
  const commonIds = new Set(includeCommon ? [] : mealCommonItems(mealRef).map(item=>foodFamilyId(item.foodId)))
  const seen=new Set()
  return sortVisibleFoods(selectableFoods().filter(food=>{
    const family=foodFamilyId(food.id)
    if(commonIds.has(family)||seen.has(family))return false
    const matches=matchesFoodLogFilter(food,filter)&&foodFamilyIds(food.id).some(id=>matchesFoodSearch(foodById(id),keyword))
    if(matches)seen.add(family)
    return matches
  }).map(food=>foodById(foodForState(food.id,'cooked'))||food))
}

function recentButtonsHtml(mealRef, keyword = '', filter = 'all') {
  return mealCommonItems(mealRef).filter((item) => matchesFoodSearch(foodById(item.foodId), keyword) && matchesFoodLogFilter(foodById(item.foodId), filter)).map((item) => {
    const food = foodById(item.foodId)
    if (!food) return ''
    return `<button class="recent-option" type="button" data-recent-food="${food.id}" data-recent-amount="${item.amount}">${foodIconHtml(food, true)}<span><strong>${food.name}</strong><small>${item.amount}g</small></span></button>`
  }).join('')
}

let mealPhotoTarget = null
function openMealPhotoSheet(mealIndex) {
  state.selectedPhotoMeal = mealIndex
  const meal = state.meals[mealIndex]
  if (!meal) return
  const dialog = openActionDialog(`${meal.name}照片`, {animate:true,className:'meal-photo-options'})
  const target = {date:dateKey(selectedDate()),id:meal.id,name:meal.name,dialog}
  mealPhotoTarget=target
  dialog.content.innerHTML = `<div class="photo-action-list">
    <button type="button" id="take-meal-photo">拍照</button>
    <button type="button" id="choose-meal-photo">从相册选择</button>
    ${meal.photo ? `<button type="button" id="remove-meal-photo">删除本餐图片</button>` : ''}
    </div>`
  // Pickers must be opened within the user's click, not after async history work.
  dialog.content.querySelector('#take-meal-photo').onclick = () => { mealPhotoTarget=target; cameraInput.click() }
  dialog.content.querySelector('#choose-meal-photo').onclick = () => { mealPhotoTarget=target; galleryInput.click() }
  dialog.content.querySelector('#remove-meal-photo')?.addEventListener('click', async (event) => {
    event.currentTarget.disabled = true
    try {
      await removeLocalMealPhoto(target.date, target.id)
      const meals = target.date===dateKey(selectedDate()) ? state.meals : state.dailyRecords[target.date]?.meals || []
      const mealToClear=meals.find(item=>item.id===target.id)
      if(mealToClear)delete mealToClear.photo
      renderMeals()
      persistState()
      if(activeActionDialog===dialog)dialog.close()
      showToast('本餐图片已从本机删除')
    } catch (error) {
      showToast(error.message)
      dialog.content.querySelector('#remove-meal-photo').disabled = false
    }
  })
}

function resizeMealPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('无法读取图片'))
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('无法解析图片'))
      image.onload = () => {
        const limit = 560
        const scale = Math.min(1, limit / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.78))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

async function saveMealPhoto(file) {
  if (!file) return
  const target=mealPhotoTarget
  if(!target)return
  try {
    const photo = await resizeMealPhoto(file)
    await putLocalMealPhoto(target.date, target.id, photo)
    const meals=target.date===dateKey(selectedDate())?state.meals:state.dailyRecords[target.date]?.meals || []
    const mealToSave=meals.find(item=>item.id===target.id)
    if(mealToSave)mealToSave.photo = photo
    renderMeals()
    persistState()
    if(activeActionDialog===target.dialog)target.dialog.close()
    showToast(`已仅在本机保存${target.name}图片`)
  } catch (error) {
    showToast(error.message)
  } finally {
    cameraInput.value = ''
    galleryInput.value = ''
  }
}

function commitMealEditor(mealIndex) {
  const meal = state.meals[mealIndex]
  const before=cloneItems(meal.items),beforeRules=state.foodWeightRules
  const record=ensureSelectedDateRecord(),beforePlans=record.plannedMeals,beforePlanned=meal.isPlanned
  let changed = false
  sheetContent.querySelectorAll('[data-meal-item-amount]').forEach((input) => {
    const item = meal.items.find((candidate) => candidate.foodId === input.dataset.mealItemAmount)
    if (!item) return
    const sourceAmount=input.weightResult?.amount??item.amount
    const nextAmount = input.value===String(oneDecimal(sourceAmount,0.1,3000)) ? sourceAmount : oneDecimal(input.value || sourceAmount, 0.1, 3000)
    if (nextAmount !== item.amount) changed = true
    if(input.weightResult) {
      const result=input.weightResult;changed=true
      item.weightEntries=result.entry?scaleWeightEntries({foodId:item.foodId,amount:result.amount,weightEntries:[result.entry]},nextAmount):[]
      if(result.entry)item.nutritionSnapshot=validNutrientSnapshot(item.nutritionSnapshot)||nutrientSnapshot(effectiveFoodNutrition(item.foodId))
      if(result.saveRule)state.foodWeightRules=stageWeightRule(result.saveRule)
    } else if (item.weightEntries) item.weightEntries=scaleWeightEntries(item,nextAmount)
    item.amount = nextAmount
  })
  if (changed) markMealAsRecorded(mealIndex)
  renderMeals()
  updateSummary()
  renderTrends()
  try {persistState()}catch{meal.items=before;if(beforePlanned===undefined)delete meal.isPlanned;else meal.isPlanned=beforePlanned;record.plannedMeals=beforePlans;state.foodWeightRules=beforeRules;renderMeals();updateSummary();renderTrends();showToast('保存失败，原分量已保留');return false}
  renderPrep();return true
}

function openMealEditorSheet(mealIndex) {
  beginEditorPage(`meal-${mealIndex}`)
  const meal = state.meals[mealIndex]
  const nutrition = mealNutrients(meal)
  sheetKicker.textContent = 'EDIT MEAL'
  sheetTitle.innerHTML = `<button type="button" class="editor-meal-title">${escapeHtml(meal.name)} · ${meal.time}</button>`
  sheetTitle.querySelector('button').onclick = () => openDailyMealDetails(mealIndex)
  sheetContent.innerHTML = `<div class="meal-edit-summary"><strong>${meal.items.length ? `${Math.round(nutrition.calories)} kcal` : '尚未记录食物'}</strong><span>碳 ${Math.round(nutrition.carbs)}g · 蛋 ${Math.round(nutrition.protein)}g · 脂 ${Math.round(nutrition.fat)}g</span></div>
    <div class="meal-item-editor">${meal.items.length ? meal.items.map((item) => {
      const food = foodById(item.foodId)
      return `<div class="meal-item-edit-row compact-meal-item">${foodIconHtml(food, true)}<span><strong>${escapeHtml(food.name)}</strong>${foodStatePair(food.id)?`<button type="button" class="food-stage-mini" data-meal-item-stage="${food.id}" aria-label="切换为${foodState(food.id)==='raw'?'熟':'生'}重">${foodState(food.id)==='raw'?'生':'熟'}</button>`:''}<small class="meal-item-macros">${mealItemMacroHtml(item)}</small></span><label><input data-meal-item-amount="${food.id}" aria-label="${escapeHtml(food.name)}克重" type="number" value="${oneDecimal(item.amount, 0.1, 3000)}" min="0.1" max="3000" step="0.1" inputmode="decimal"><em>g</em></label><button type="button" data-remove-meal-food="${food.id}" aria-label="删除${escapeHtml(food.name)}">×</button></div>`
    }).join('') : '<p class="empty-editor-note">点击“添加食物”开始记录本餐。</p>'}</div>
    <div class="meal-edit-actions"><button class="secondary-action" id="add-food-from-meal" type="button">＋ 添加食物</button><button class="primary-action" id="save-meal-editor" type="button">完成</button></div>`
  sheetContent.querySelectorAll('[data-meal-item-amount]').forEach(input => input.addEventListener('input', () => {
    const item = meal.items.find(item => item.foodId === input.dataset.mealItemAmount)
    input.closest('.compact-meal-item').querySelector('.meal-item-macros').innerHTML = mealItemMacroHtml({ ...item, amount: Number(input.value) || 0 })
    const draftItems = meal.items.map(item => ({...item, amount: Number(sheetContent.querySelector(`[data-meal-item-amount="${CSS.escape(item.foodId)}"]`)?.value) || 0}))
    const values = nutrientsForItems(draftItems)
    sheetContent.querySelector('.meal-edit-summary').innerHTML = `<strong>${Math.round(values.calories)} kcal</strong><span>碳 ${rounded(values.carbs)}g · 蛋 ${rounded(values.protein)}g · 脂 ${rounded(values.fat)}g</span>`
  }))
  sheetContent.querySelectorAll('[data-remove-meal-food]').forEach((button) => button.addEventListener('click', () => {
    if(!commitMealEditor(mealIndex))return
    meal.items = meal.items.filter((item) => item.foodId !== button.dataset.removeMealFood)
    markMealAsRecorded(mealIndex)
    renderMeals()
    updateSummary()
    renderTrends()
    persistState()
    openMealEditorSheet(mealIndex)
  }))
  sheetContent.querySelectorAll('[data-meal-item-stage]').forEach(button=>button.onclick=()=>{
    if(!commitMealEditor(mealIndex))return
    const item=meal.items.find(candidate=>candidate.foodId===button.dataset.mealItemStage)
    if(!item)return
    const previous=cloneItems(meal.items),target=foodState(item.foodId)==='raw'?'cooked':'raw'
    const nextId=foodForState(item.foodId,target),amount=oneDecimal(equivalentFoodAmount(item.foodId,item.amount,target),0.1,3000)
    const existing=meal.items.find(candidate=>candidate!==item&&candidate.foodId===nextId)
    if(existing){existing.amount=oneDecimal(existing.amount+amount,0.1,3000);meal.items=meal.items.filter(candidate=>candidate!==item)}
    else {item.foodId=nextId;item.amount=amount;item.nutritionSnapshot=nutrientSnapshot(effectiveFoodNutrition(nextId));delete item.weightEntries;delete item.costSnapshot}
    markMealAsRecorded(mealIndex)
    try{persistState()}catch{meal.items=previous;showToast('切换未保存，原记录保留');return}
    renderMeals();updateSummary();renderTrends();renderPrep();openMealEditorSheet(mealIndex)
  })
  document.querySelector('#add-food-from-meal').addEventListener('click', () => {
    if(!commitMealEditor(mealIndex))return
    openFoodSheet(mealIndex)
  })
  document.querySelector('#save-meal-editor').addEventListener('click', () => {
    if(!commitMealEditor(mealIndex))return
    closeSheet()
    showToast(`${meal.name}已更新`)
  })
  sheetContent.editDraftReader={saveId:'save-meal-editor',read:()=>[...sheetContent.querySelectorAll('[data-meal-item-amount]')].map(input=>({id:input.dataset.mealItemAmount,value:input.value,weight:input.weightResult||null}))}
  openSheet()
}

function renderFoodSheet(searchRefresh = false, preserveWeight = true) {
  if (sheet.classList.contains('open')) foodSheetScrollTop = sheet.scrollTop
  const directEntry = foodSheetMode === 'direct'
  const directDateLabel = directFoodDate === APP_TODAY_KEY ? '今日' : `${Number(directFoodDate.slice(5, 7))}月${Number(directFoodDate.slice(8, 10))}日`
  const keyword = state.foodSheetSearch.trim()
  const candidates = directEntry ? [] : foodLogCandidates(state.selectedMeal, keyword, foodLogFilter, foodLogCommonCollapsed)
  const commonButtons = directEntry ? '' : recentButtonsHtml(state.selectedMeal, keyword, foodLogFilter)
  if (!directEntry && candidates.length && !candidates.some((food) => food.id === state.selectedFood)) {
    state.selectedFood = candidates[0].id
    state.amount = recentAmountsFor(state.selectedMeal, state.selectedFood)[0] || recentItemsForMeal(state.selectedMeal).find((item) => item.foodId === state.selectedFood)?.amount || 100
  }
  sheetKicker.textContent = directEntry ? 'ADD FOOD' : 'QUICK LOG'
  sheetTitle.textContent = directEntry ? `记录${foodById(state.selectedFood).name}到${directDateLabel}` : `记录到${state.meals[state.selectedMeal].name}`
  const choiceCount = state.meals.length
  const choiceFrom = mealChoiceTransition?.from ?? state.selectedMeal
  const choiceTo = state.selectedMeal
  const choiceGeometry = slimeChoiceGeometry(choiceCount, choiceFrom, choiceTo, 5)
  const choiceMotionClass = slimeMotionClass(choiceFrom, choiceTo)
  const markup = `
    ${directEntry ? '' : '<div class="meal-log-layout">'}
    <div class="meal-picker log-meal-picker slime-toggle" aria-label="选择餐次" style="--choice-count:${choiceCount};${slimeChoiceStyle(choiceGeometry)}">
      <i class="choice-slime meal-choice-slime ${choiceMotionClass}" aria-hidden="true"></i>
      ${state.meals.map((meal, index) => `<button class="meal-choice ${index === state.selectedMeal ? 'selected' : ''}" type="button" data-sheet-meal="${index}">${meal.name}</button>`).join('')}
    </div>
    ${directEntry
      ? `<label class="form-field direct-food-date-field"><span>记录日期（过去一年至未来一年）</span><input id="direct-food-date" type="date" min="${DIRECT_FOOD_DATE_MIN}" max="${DIRECT_FOOD_DATE_MAX}" value="${directFoodDate}"></label>${directFoodLoggingControlsHtml(state.selectedMeal, state.selectedFood, state.amount, 'log')}<button class="primary-action" id="save-food" type="button">记录${foodById(state.selectedFood).name}到${directDateLabel}</button>`
      : `<div class="food-log-toolbar"><label class="search-field compact-set-search food-log-search-only"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg><input id="food-log-search" type="search" value="${escapeHtml(state.foodSheetSearch)}" placeholder="输入食物名称或拼音" aria-label="搜索食物或拼音"><button class="search-clear" id="food-log-search-clear" type="button" aria-label="清空搜索">×</button></label>
        <select id="food-log-filter" aria-label="筛选食物">${[{id:'all',name:'全部食物'},{id:'ingredients',name:'食材'},...foodFilterOptions].map(option => `<option value="${option.id}" ${foodLogFilter === option.id ? 'selected' : ''}>${option.name}</option>`).join('')}</select></div>
        <section class="log-common-section"><button id="food-log-common-toggle" class="sheet-section-heading" type="button" aria-expanded="${!foodLogCommonCollapsed}" aria-controls="food-log-common-items"><strong>本餐常用</strong><span>${foodLogCommonCollapsed ? '展开' : '收起'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${foodLogCommonCollapsed ? 'm7 10 5 5 5-5' : 'm7 14 5-5 5 5'}"/></svg></span></button><div id="food-log-common-items" class="recent-grid" ${foodLogCommonCollapsed ? 'hidden' : ''}>${commonButtons || '<p class="log-empty-note">暂无匹配的常用食物</p>'}</div></section>
        <section class="log-library-section" aria-label="可选食物">
        ${candidates.length ? foodLoggingControlsHtml(state.selectedMeal, state.selectedFood, state.amount, 'log', candidates, false) : `<div class="food-empty-inline"><span>${commonButtons && !foodLogCommonCollapsed ? '匹配食物已显示在本餐常用中' : keyword ? `没有找到“${escapeHtml(keyword)}”，可到食物库添加` : '当前分类没有可选食物'}</span></div>`}</section></div>`}`

  if (searchRefresh && sheetContent.querySelector('.meal-log-layout')) {
    const template = document.createElement('template')
    template.innerHTML = markup
    for (const selector of ['#food-log-common-items', '.log-library-section']) {
      sheetContent.querySelector(selector).replaceChildren(...template.content.querySelector(selector).childNodes)
    }
  } else sheetContent.innerHTML = markup
  const foodGrid = sheetContent.querySelector('.food-grid')
  sheet.scrollTop = foodSheetScrollTop
  if (foodGrid) {
    foodGrid.setAttribute('role', 'region')
    foodGrid.setAttribute('aria-label', '食物列表')
    foodGrid.tabIndex = 0
    foodGrid.scrollTop = foodGridScrollTop
    foodGrid.addEventListener('scroll', () => { foodGridScrollTop = foodGrid.scrollTop }, { passive: true })
  }

  if (!searchRefresh) {
  document.querySelector('#food-log-common-toggle')?.addEventListener('click', () => {
    foodLogCommonCollapsed = !foodLogCommonCollapsed
    renderFoodSheet()
    document.querySelector('#food-log-common-toggle')?.focus({ preventScroll: true })
  })
  document.querySelector('#food-log-filter')?.addEventListener('change', (event) => {
    foodLogFilter = event.target.value
    foodGridScrollTop = 0
    renderFoodSheet()
    document.querySelector('#food-log-filter')?.focus({ preventScroll: true })
  })

  sheetContent.querySelectorAll('[data-sheet-meal]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextMeal = Number(button.dataset.sheetMeal)
      if (nextMeal === state.selectedMeal) return
      mealChoiceTransition = { from: state.selectedMeal, to: nextMeal }
      state.selectedMeal = nextMeal
      foodGridScrollTop = 0
      const amounts = recentAmountsFor(state.selectedMeal, state.selectedFood)
      if(!directEntry)state.amount = amounts[0] || recentItemsForMeal(state.selectedMeal).find((item) => item.foodId === state.selectedFood)?.amount || 100
      renderFoodSheet()
    })
  })
  mealChoiceTransition = null
  document.querySelector('#food-log-search')?.addEventListener('input', (event) => {
    if (event.isComposing) return
    state.foodSheetSearch = event.target.value
    foodGridScrollTop = 0
    foodSheetScrollTop = 0
    sheet.scrollTop = 0
    renderFoodSheet(true)
  })
  document.querySelector('#food-log-search-clear')?.addEventListener('click', () => {
    state.foodSheetSearch = ''
    foodGridScrollTop = 0
    foodSheetScrollTop = 0
    document.querySelector('#food-log-search').value = ''
    renderFoodSheet(true)
    document.querySelector('#food-log-search')?.focus()
  })
  sheetContent.querySelector('[data-create-log-dish]')?.addEventListener('click', () => openDishEditorPage(null, state.foodSheetSearch.trim(), continueLoggingCreatedFood))
  document.querySelector('#direct-food-date')?.addEventListener('change', (event) => {
    directFoodDate = normalizeDirectFoodDate(event.target.value)
    renderFoodSheet()
  })
  }
  sheetContent.querySelectorAll('[data-quick-create-food="food-log"]').forEach(button => button.onclick = () => openFoodEditorSheet(null, state.foodSheetSearch.trim(), continueLoggingCreatedFood))
  sheetContent.querySelectorAll('[data-recent-food]').forEach(button => button.onclick = () => openFoodPortionDialog(button.dataset.recentFood, Number(button.dataset.recentAmount)))
  attachFoodLoggingControls(sheetContent, 'log', {
    selectFood(foodId) {
      foodGridScrollTop = sheetContent.querySelector('.food-grid')?.scrollTop || foodGridScrollTop
      state.selectedFood = foodId
      const amounts = recentAmountsFor(state.selectedMeal, state.selectedFood)
      state.amount = amounts[0] || recentItemsForMeal(state.selectedMeal).find((item) => item.foodId === state.selectedFood)?.amount || 100
      renderFoodSheet()
      openFoodPortionDialog(foodId, state.amount)
    },
    setAmount(amount, rerender = true) {
      state.amount = amount
      if (rerender) renderFoodSheet()
    },
    getAmount() {
      return state.amount
    }
  })
  if (directEntry) {
    state.amount=applySavedWeightLoggingContext(sheetContent,state.selectedFood,'log',state.amount,!preserveWeight)
    sheetContent.querySelectorAll('[data-food-stage-choice]').forEach(button=>button.onclick=()=>{
      const target=button.dataset.foodStageChoice
      if(target===foodState(state.selectedFood))return
      const input=sheetContent.querySelector('[data-log-amount-input]')
      state.amount=oneDecimal(equivalentFoodAmount(state.selectedFood,Number(input.value),target),0.1,3000)
      state.selectedFood=foodForState(state.selectedFood,target)
      renderFoodSheet()
    })
    document.querySelector('#save-food').onclick=()=>{const result=readSavedWeightPortion(state.selectedFood,Number(sheetContent.querySelector('[data-log-amount-input]').value));if(result)addSelectedFood(result)}
  }
  if (!directEntry && !searchRefresh) {
    const add = document.createElement('button'); add.type='button'; add.className='add-daily-meal'; add.id='add-log-meal'; add.textContent='＋ 添加餐次'
    add.onclick=()=>openDailyMealDetails(); sheetContent.querySelector('.meal-log-layout').append(add)
  }
  if (!directEntry) {
    sheetTitle.innerHTML=`<button type="button" class="editor-meal-title">记录到${escapeHtml(state.meals[state.selectedMeal].name)}</button>`
    sheetTitle.querySelector('button').onclick=()=>openDailyMealDetails(state.selectedMeal)
  }
}

function openFoodSheet(mealIndex = 2, foodId = null, mode = foodId ? 'direct' : 'quick') {
  beginEditorPage(`log-${mealIndex}`)
  mealIndex = Math.max(0, Math.min(state.meals.length - 1, mealIndex))
  state.selectedMeal = mealIndex
  mealChoiceTransition = null
  foodSheetMode = mode
  foodLogFilter = 'all'
  foodLogCommonCollapsed = false
  foodGridScrollTop = 0
  foodSheetScrollTop = 0
  sheet.scrollTop = 0
  if (mode === 'direct') directFoodDate = normalizeDirectFoodDate(APP_TODAY_KEY)
  state.foodSheetSearch = ''
  state.selectedFood = foodForState(foodId || recentItemsForMeal(mealIndex)[0]?.foodId || 'chicken','cooked')
  state.amount = mode === 'direct' ? recentAmountsFor(mealIndex, state.selectedFood)[0] || (state.selectedFood === 'egg' ? 50 : 100) : recentAmountsFor(mealIndex, state.selectedFood)[0] || recentItemsForMeal(mealIndex).find((item) => item.foodId === state.selectedFood)?.amount || 100
  renderFoodSheet(false,false)
  openSheet()
}

function openFoodPortionDialog(foodId, initialAmount) {
  const mealIndex = state.selectedMeal
  let selectedId=foodForState(foodId,'cooked')
  let amount = oneDecimal(initialAmount, 0.1, 3000)
  let committed = false
  const dialog = openActionDialog(foodById(selectedId).name, {animate: true, className: 'food-portion-overlay'})
  const paint=()=>{
    dialog.overlay.querySelector('header h2').textContent=foodById(selectedId).name
    dialog.content.innerHTML = `${foodStageToggleHtml(selectedId)}${foodPortionControlsHtml(mealIndex, selectedId, amount, 'portion')}<button type="button" class="primary-action" id="save-food-portion">确认加入</button>`
    dialog.content.querySelector('.current-amount-panel strong').textContent = '本次分量'
    const input = dialog.content.querySelector('[data-portion-amount-input]')
    input.setAttribute('aria-label', '本次分量')
    input.dataset.unit = 'g'
    amount=applySavedWeightLoggingContext(dialog.content,selectedId,'portion',amount)
    attachFoodLoggingControls(dialog.content, 'portion', {
      setAmount(next) {
        amount = next
        input.value = next
        dialog.content.querySelectorAll('[data-portion-amount-choice]').forEach(button => button.classList.toggle('active', Number(button.dataset.portionAmountChoice) === next))
      },
      getAmount() { return amount }
    })
    dialog.content.querySelectorAll('[data-food-stage-choice]').forEach(button=>button.onclick=()=>{
      const target=button.dataset.foodStageChoice
      if(target===foodState(selectedId))return
      amount=oneDecimal(equivalentFoodAmount(selectedId,Number(input.value),target),0.1,3000)
      selectedId=foodForState(selectedId,target)
      paint()
    })
    enhanceEditorControls(dialog.content)
    dialog.content.querySelector('#save-food-portion').onclick = (event) => {
      if (committed) return
      const result=readSavedWeightPortion(selectedId,Number(input.value));if(!result)return
      state.selectedMeal=mealIndex;state.selectedFood=selectedId
      if (!addSelectedFood(result,true)) return
      committed = true
      event.currentTarget.disabled = true
      dialog.close(false, () => closeSheet())
    }
  }
  paint()
}

function addSelectedFood(weightResult = null, deferClose = false) {
  const food = foodById(state.selectedFood)
  const recordedAmount = weightResult?.amount ?? state.amount, entry=weightResult?.entry || null
  const targetDate=foodSheetMode==='direct'?normalizeDirectFoodDate(directFoodDate):dateKey(selectedDate())
  const before={record:state.dailyRecords[targetDate]?structuredClone(state.dailyRecords[targetDate]):null,meals:state.meals.map(meal=>({...meal,items:cloneItems(meal.items)})),rules:state.foodWeightRules,recent:structuredClone(state.recentByMeal),history:structuredClone(state.amountHistoryByMeal)}
  try {
  if(weightResult?.saveRule)state.foodWeightRules=stageWeightRule(weightResult.saveRule)
  if (foodSheetMode === 'direct') {
    const result = addFoodToDailyRecord(targetDate, state.selectedMeal, state.selectedFood, recordedAmount, entry)
    if (targetDate === dateKey(selectedDate())) {
      state.meals = result.record.meals
      state.selectedMeal = result.targetIndex
      renderMeals()
      updateSummary()
    }
    renderTrends()
    persistState()
    if(!deferClose)closeSheet()
    showToast(`已记录 ${food.name} ${rounded(recordedAmount)}g 到${targetDate === APP_TODAY_KEY ? '今日' : targetDate}`)
    renderPrep();return true
  }
  addFoodToMeal(state.selectedMeal, state.selectedFood, recordedAmount, entry)
  const meal = state.meals[state.selectedMeal]
  if(!deferClose)closeSheet()
  renderPrep();showToast(`已把 ${food.name} ${rounded(recordedAmount)}g 加入${meal.name}`)
  return true
  } catch(error) {
    if(before.record)state.dailyRecords[targetDate]=before.record;else delete state.dailyRecords[targetDate]
    state.meals=before.meals;state.foodWeightRules=before.rules;state.recentByMeal=before.recent;state.amountHistoryByMeal=before.history
    renderMeals();updateSummary();renderTrends();showToast(error.message.includes('3000')?error.message:'保存失败，原记录保留，请检查本机存储');return false
  }
}

function applyMethod(methodId) {
  const wasKingMethod = isKingMethod()
  const nextIsKingMethod = isKingMethod(methodId)
  if (nextIsKingMethod && !state.schedulePlanCustomized.carbon) state.carbonCyclePlan = defaultCarbonCyclePlan()
  if (!nextIsKingMethod && wasKingMethod && !state.schedulePlanCustomized.binary) state.dayCyclePlan = mapCarbonPlanToBinary(ensureCarbonCyclePlan())
  state.methodId = methodId
  if (isKingMethod()) ensureCarbonCyclePlan()
  syncWeekPlanToDailyRecords()
  loadSelectedDate()
  updateSettingsSummaries()
  renderTrends()
  renderPrep()
  persistState()
  closeSheet()
  showToast(`已使用${methodById(methodId).name}`)
}

function rangeEndDate(startValue, method) {
  const end = parseLocalDate(startValue)
  if (method.durationMonths) end.setMonth(end.getMonth() + method.durationMonths)
  else end.setDate(end.getDate() + method.durationDays)
  end.setDate(end.getDate() - 1)
  return dateKey(end)
}

function openMethodRangeSheet(methodId) {
  const method = methodById(methodId)
  const currentRange = state.methodApplications[methodId]
  const start = currentRange?.start || dateKey(selectedDate())
  const durationText = method.durationMonths ? '3 个月' : `${method.durationDays} 天`
  sheetKicker.textContent = 'APPLICATION RANGE'
  sheetTitle.textContent = `应用${method.name}`
  sheetContent.innerHTML = `<p class="sheet-hint">${method.durationMonths ? '按当前体重与运动档位计算起始目标；应用后默认每7天显示复盘提醒，可在设置中修改间隔和调整量。' : '日期决定一般阶段或高碳日，不能临时切换；训练与休息仅用于安排餐次。'}到期显示完成，不循环重启；暂保留最后目标供参考，请选择后续方法。</p>
    <div class="range-editor"><label class="form-field"><span>开始日期</span><input id="method-range-start" type="date" value="${start}"></label><label class="form-field"><span>结束日期</span><input id="method-range-end" type="date" value="${rangeEndDate(start, method)}" readonly></label></div>
    <div class="range-confirmation"><small>应用时长</small><strong>${durationText}</strong><span>${method.note}</span></div>
    <button class="primary-action" id="confirm-method-range" type="button">确认并应用</button>`
  const startInput = document.querySelector('#method-range-start')
  const endInput = document.querySelector('#method-range-end')
  startInput.addEventListener('input', () => {
    if (startInput.value) endInput.value = rangeEndDate(startInput.value, method)
  })
  document.querySelector('#confirm-method-range').addEventListener('click', () => {
    if (!startInput.value) {
      showToast('请选择开始日期')
      return
    }
    state.methodApplications[methodId] = {
      start: startInput.value,
      end: endInput.value,
      durationDays: method.durationDays || null,
      durationMonths: method.durationMonths || null
    }
    if (programBaseId(methodId) === 'dynamic') state.reviewSettings[methodId] = { ...reviewConfig(methodId), enabled: true, start: startInput.value }
    applyMethod(methodId)
  })
  openSheet()
}

function openMethodSheet() {
  sheetKicker.textContent = 'DIET METHOD'
  sheetTitle.textContent = '选择饮食方法'
  sheetContent.innerHTML = `<div class="template-list">
    ${allMethods().filter(method=>!state.deletedMethodIds.includes(method.id)).map((method) => {
      const range = state.methodApplications[method.id]
      const options = methodDayOptions(method.id)
      return `
      <article class="template-option ${method.id === state.methodId ? 'active' : ''}">
        <button class="template-select" type="button" data-method="${method.id}">
          <span class="template-copy"><span>${method.name}</span><small>${method.note}${range ? ` · ${range.start} 至 ${range.end}` : ''}</small></span>
          <span class="template-side ${options.length === 3 ? 'three-days' : ''}">${options.map((option) => `<em>${isKingMethod(method.id) ? option.shortName : option.name.slice(0, 1)} ${compactMethodSettingLabel(option.id, method.id)}</em>`).join('')}<b>${method.id === state.methodId ? '✓' : '›'}</b></span>
        </button>
        <div class="method-management">${isDatedProgram(method.id) ? `<button type="button" class="method-coefficient-link" data-program-coefficients="${method.id}" aria-label="编辑${escapeHtml(method.name)}的营养倍数">编辑倍数</button>` : ''}<details class="method-actions"><summary aria-label="管理${escapeHtml(method.name)}">${uiIcon('more')}</summary><div><button class="template-settings" type="button" data-edit-method="${method.id}" aria-label="设置${method.name}">${uiIcon('edit')}编辑</button><button class="template-delete" type="button" data-delete-method="${method.id}" aria-label="删除${method.name}">${uiIcon('trash')}删除</button></div></details></div>
      </article>`
    }).join('')}
  </div>`
  sheetContent.querySelectorAll('[data-method]').forEach((button) => {
    button.addEventListener('click', () => {
      const method = methodById(button.dataset.method)
      if (method.durationDays || method.durationMonths) openMethodRangeSheet(method.id)
      else applyMethod(method.id)
    })
  })
  sheetContent.querySelectorAll('[data-edit-method]').forEach((button) => {
    button.addEventListener('click', () => openMethodDayEditor(button.dataset.editMethod, methodDayOptions(button.dataset.editMethod)[0].id, 'overwrite', true))
  })
  sheetContent.querySelectorAll('[data-program-coefficients]').forEach(button => {
    button.onclick = () => openProgramCoefficientEditor(button.dataset.programCoefficients)
  })
  sheetContent.querySelectorAll('[data-delete-method]').forEach(button=>button.onclick=()=>{
    const remaining=allMethods().filter(method=>!state.deletedMethodIds.includes(method.id)&&method.id!==button.dataset.deleteMethod)
    if(!remaining.length){showToast('至少保留一个饮食方法');return}
    const dialog=openActionDialog('删除饮食方法')
    dialog.content.innerHTML='<p>从方法列表删除，已有饮食记录保留。</p><button type="button" class="primary-action" id="confirm-delete-method">删除</button>'
    dialog.content.querySelector('button').onclick=()=>dialog.close(false,()=>{
      state.deletedMethodIds.push(button.dataset.deleteMethod)
      if(state.methodId===button.dataset.deleteMethod){state.methodId=remaining[0].id;loadSelectedDate()}
      persistState();updateSettingsSummaries();updateSummary();renderPrep();renderTrends();openMethodSheet()
    })
  })
  openSheet()
}

function readTargetDayInput(dayType) {
  const dayConfig = targetDraft.days[dayType]
  if (targetDraft.mode === 'percentage') {
    dayConfig.calories = Math.max(500, Number(document.querySelector(`#target-calories-${dayType}`)?.value) || dayConfig.calories)
    ;['carbs', 'protein', 'fat'].forEach((key) => {
      dayConfig.percentages[key] = Math.max(0, Number(document.querySelector(`#target-percent-${dayType}-${key}`)?.value) || 0)
    })
  } else {
    ;['carbs', 'protein', 'fat'].forEach((key) => {
      dayConfig.multipliers[key] = Math.max(0, Number(document.querySelector(`#target-multiplier-${dayType}-${key}`)?.value) || 0)
    })
  }
}

function updateTargetDayPreview(dayType, methodId) {
  const target = methodTargetValues(dayType, methodId, targetDraft)
  const output = document.querySelector(`#target-output-${dayType}`)
  if (output) output.textContent = `${target.calories} kcal · 碳 ${target.carbs}g · 蛋 ${target.protein}g · 脂 ${target.fat}g`
  if (targetDraft.mode === 'percentage') {
    const total = Object.values(targetDraft.days[dayType].percentages).reduce((sum, value) => sum + value, 0)
    const totalElement = document.querySelector(`#percentage-total-${dayType}`)
    totalElement.textContent = `${total}%`
    totalElement.classList.toggle('invalid', total !== 100)
  }
}

function readHeatRedistributionInputs() {
  ;['carbs', 'protein', 'fat'].forEach((key) => {
    targetDraft.baseMultipliers[key] = oneDecimal(document.querySelector(`#heat-base-${key}`)?.value, 0, 10)
  })
  ;['high', 'medium', 'low'].forEach((level) => {
    ;['carbs', 'fat'].forEach((key) => {
      targetDraft.distribution[level][key] = oneDecimal(document.querySelector(`#heat-share-${level}-${key}`)?.value, 0, 100)
    })
  })
}

function updateHeatRedistributionPreview(methodId) {
  const weight = state.bodyProfile.weight
  const weeklyCarbs = Math.round(weight * targetDraft.baseMultipliers.carbs * 7)
  const dailyProtein = Math.round(weight * targetDraft.baseMultipliers.protein)
  const weeklyFat = Math.round(weight * targetDraft.baseMultipliers.fat * 7)
  document.querySelector('#heat-weekly-carbs').textContent = `${weeklyCarbs}g`
  document.querySelector('#heat-daily-protein').textContent = `${dailyProtein}g`
  document.querySelector('#heat-weekly-fat').textContent = `${weeklyFat}g`
  const totals = heatDistributionTotals(targetDraft)
  ;['carbs', 'fat'].forEach((key) => {
    const output = document.querySelector(`#heat-total-${key}`)
    output.textContent = `${totals[key]}%`
    output.classList.toggle('invalid', Math.abs(totals[key] - 100) > 0.01)
  })
  ;['high', 'medium', 'low'].forEach((level) => {
    const target = methodTargetValues(level, methodId, targetDraft)
    document.querySelector(`#heat-output-${level}`).textContent = `${target.calories} kcal · 碳 ${target.carbs}g · 蛋 ${target.protein}g · 脂 ${target.fat}g`
  })
}

function renderHeatRedistributionEditor() {
  const { methodId, saveMode } = targetEditContext
  const method = methodById(methodId)
  const levels = ['high', 'medium', 'low']
  targetDraft = normalizeHeatRedistributionConfig(targetDraft)
  sheetKicker.textContent = saveMode === 'overwrite' ? 'EDIT TEMPLATE' : 'METHOD TARGET'
  sheetTitle.textContent = '编辑热量重分配'
  sheetContent.innerHTML = `
    <div class="method-calculation-mode"><small>${saveMode === 'overwrite' ? '编辑模板' : '基于模板另存'}</small><strong>${method.name} · 周总量比例</strong></div>
    <p class="sheet-hint">先用当前体重与基础日配额计算 7 天周总量，再按可调整比例分给高中低碳日；三个碳日不再分别设置体重倍数。</p>
    <section class="target-day-editor heat-redistribution-editor"><div class="target-day-heading"><strong>周总量计算基准</strong><small>基础日配额，仅用于计算周总量</small></div>
      <div class="target-macro-grid">${['carbs', 'protein', 'fat'].map((key) => `<label class="form-field ${key}"><span>${{ carbs: '碳水基准', protein: '蛋白固定', fat: '脂肪基准' }[key]}</span><input id="heat-base-${key}" type="number" value="${targetDraft.baseMultipliers[key]}" min="0" max="10" step="0.1"><em>g/kg</em></label>`).join('')}</div>
      <div class="heat-weekly-summary"><span>周碳水<strong id="heat-weekly-carbs"></strong></span><span>每日蛋白<strong id="heat-daily-protein"></strong></span><span>周脂肪<strong id="heat-weekly-fat"></strong></span></div>
    </section>
    <section class="target-day-editor heat-distribution-editor"><div class="target-day-heading"><strong>高中低碳日分配</strong><small>碳水与脂肪分别合计 100%</small></div>
      <div class="heat-distribution-grid"><div class="heat-distribution-head"><span>日类型</span><span>周碳水</span><span>周脂肪</span></div>${levels.map((level) => {
        const row = targetDraft.distribution[level]
        return `<div class="heat-distribution-row ${level}"><span><b>${nutritionDayTypeName(level, methodId)}</b><small>${row.count} 天</small></span><label><input id="heat-share-${level}-carbs" type="number" value="${row.carbs}" min="0" max="100" step="0.1"><em>%</em></label><label><input id="heat-share-${level}-fat" type="number" value="${row.fat}" min="0" max="100" step="0.1"><em>%</em></label></div>`
      }).join('')}</div>
      <div class="heat-distribution-total"><span>比例总计</span><strong class="carbs" id="heat-total-carbs"></strong><strong class="fat" id="heat-total-fat"></strong></div>
      <div class="heat-target-preview">${levels.map((level) => `<article><span>${nutritionDayTypeName(level, methodId)}</span><strong id="heat-output-${level}"></strong></article>`).join('')}</div>
    </section>
    <button class="primary-action" id="continue-method-save" type="button">继续命名与保存</button>`
  sheetContent.querySelectorAll('.heat-redistribution-editor input, .heat-distribution-editor input').forEach((input) => input.addEventListener('input', () => {
    readHeatRedistributionInputs()
    updateHeatRedistributionPreview(methodId)
  }))
  updateHeatRedistributionPreview(methodId)
  sheetContent.editDraftReader={saveId:'continue-method-save',read:()=>{readHeatRedistributionInputs();return targetDraft}}
  document.querySelector('#continue-method-save').addEventListener('click', () => {
    readHeatRedistributionInputs()
    const totals = heatDistributionTotals(targetDraft)
    if (Math.abs(totals.carbs - 100) > 0.01 || Math.abs(totals.fat - 100) > 0.01) {
      updateHeatRedistributionPreview(methodId)
      showToast('碳水和脂肪的周分配比例都必须合计为 100%')
      return
    }
    openMethodSaveConfirmation()
  })
}

function renderMethodDayEditor() {
  const { methodId, dayType, saveMode, allowSwitch } = targetEditContext
  if (isHeatRedistributionMethod(methodId)) {
    renderHeatRedistributionEditor()
    return
  }
  const method = methodById(methodId)
  const dayConfig = targetDraft.days[dayType]
  const percentMode = targetDraft.mode === 'percentage'
  const dynamicStandard = methodId === 'standard'
  sheetKicker.textContent = saveMode === 'overwrite' ? 'EDIT TEMPLATE' : 'METHOD TARGET'
  sheetTitle.textContent = `编辑${nutritionDayTypeName(dayType, methodId)}`
  sheetContent.innerHTML = `
    ${allowSwitch ? `<div class="target-day-switch ${methodDayOptions(methodId).length === 3 ? 'three-options' : ''}" aria-label="选择日期类型">${methodDayOptions(methodId).map((option) => `<button class="${option.id === dayType ? 'active' : ''}" type="button" data-target-day-switch="${option.id}">${option.name}</button>`).join('')}</div>` : ''}
    <div class="method-calculation-mode"><small>${saveMode === 'overwrite' ? '编辑模板' : '基于模板另存'}</small><strong>${method.name} · ${dynamicStandard ? '基础代谢建议热量' : percentMode ? '总热量百分比' : '体重倍数'}</strong></div>
    ${dynamicStandard ? `<p class="sheet-hint">默认建议：休息日＝基础代谢，训练日＝基础代谢 × 1.2；手工修改并保存后，将使用你的固定热量。</p>` : !percentMode ? `<p class="sheet-hint">当前体重 ${formatBodyWeight(state.bodyProfile.weight)}；本页只修改${nutritionDayTypeName(dayType, methodId)}，克数＝公斤体重 × 对应倍数（g/kg）。</p>` : ''}
    <section class="target-day-editor single"><div class="target-day-heading"><strong>${nutritionDayTypeName(dayType, methodId)}</strong><small>${percentMode ? '热量与碳蛋脂比例' : '每公斤体重倍数'}</small></div>
      ${percentMode ? `<label class="form-field target-calories-field"><span>目标热量</span><input id="target-calories-${dayType}" type="number" value="${dayConfig.calories}" min="500" max="5000"><em>kcal</em></label><div class="macro-wheel-picker" aria-label="按百分比分配营养素">${['carbs', 'protein', 'fat'].map((key) => `<input id="target-percent-${dayType}-${key}" type="hidden" value="${dayConfig.percentages[key]}">${wheelColumnHtml({ carbs: '碳水 %', protein: '蛋白 %', fat: '脂肪 %' }[key], Array.from({ length: 21 }, (_, index) => index * 5), dayConfig.percentages[key], `target-percent-${dayType}-${key}`, key)}`).join('')}</div><div class="target-total"><span>比例总计</span><strong id="percentage-total-${dayType}">${Object.values(dayConfig.percentages).reduce((sum, value) => sum + value, 0)}%</strong></div>` : `<div class="target-macro-grid">${['carbs', 'protein', 'fat'].map((key) => `<label class="form-field ${key}"><span>${{ carbs: '碳水', protein: '蛋白质', fat: '脂肪' }[key]}</span><input id="target-multiplier-${dayType}-${key}" type="number" value="${dayConfig.multipliers[key]}" min="0" max="10" step="0.1"><em>g/kg</em></label>`).join('')}</div>`}
      <p class="target-day-output" id="target-output-${dayType}"></p>
    </section>
    <button class="primary-action" id="continue-method-save" type="button">继续命名与保存</button>`
  sheetContent.querySelectorAll('[id^="target-"]').forEach((input) => input.addEventListener('input', () => {
    readTargetDayInput(dayType)
    updateTargetDayPreview(dayType, methodId)
  }))
  document.querySelector(`#target-calories-${dayType}`)?.addEventListener('input', () => {
    targetDraft.days[dayType].caloriesCustomized = true
  })
  sheetContent.querySelectorAll('[data-target-day-switch]').forEach((button) => button.addEventListener('click', () => {
    readTargetDayInput(dayType)
    const previousDayType = targetEditContext.dayType
    const nextDayType = button.dataset.targetDaySwitch
    if (previousDayType === nextDayType) return
    targetEditContext.dayType = nextDayType
    renderMethodDayEditor()
    sheetContent.querySelector(`[data-target-day-switch="${previousDayType}"]`)?.classList.add('choice-exit')
    sheetContent.querySelector(`[data-target-day-switch="${nextDayType}"]`)?.classList.add('choice-enter')
  }))
  initializeWheelPickers(sheetContent, (name, value) => {
    const input = document.querySelector(`#${name}`)
    if (!input) return
    input.value = value
    readTargetDayInput(dayType)
    updateTargetDayPreview(dayType, methodId)
  })
  updateTargetDayPreview(dayType, methodId)
  sheetContent.editDraftReader={saveId:'continue-method-save',read:()=>{readTargetDayInput(dayType);return targetDraft}}
  document.querySelector('#continue-method-save').addEventListener('click', () => {
    readTargetDayInput(dayType)
    const invalidDay = percentMode && methodDayOptions(methodId).find(option => Math.abs(Object.values(targetDraft.days[option.id].percentages).reduce((sum,value)=>sum+value,0)-100) > .01)
    if (invalidDay) {
      document.querySelector(`#percentage-total-${dayType}`).classList.add('invalid')
       showToast(`${invalidDay.name}的碳、蛋、脂比例必须为 100%`)
      return
    }
    openMethodSaveConfirmation()
  })
}

function openMethodSaveConfirmation() {
  beginEditorPage('method-save-confirmation')
  const { methodId, dayType, saveMode } = targetEditContext
  const method = methodById(methodId)
  const suggestedName = saveMode === 'overwrite' ? method.name : `${method.name} · 自定义${state.customMethods.length + 1}`
  const target = methodTargetValues(dayType, methodId, targetDraft)
  const heatRedistribution = isHeatRedistributionMethod(methodId)
  sheetKicker.textContent = 'NAME & SAVE'
  sheetTitle.textContent = '命名并保存'
  sheetContent.innerHTML = `
    <label class="form-field"><span>模板名称</span><input id="method-save-name" value="${escapeHtml(suggestedName)}" maxlength="24"></label>
    ${heatRedistribution ? `<div class="save-method-summary heat-save-summary"><small>新的周总量分配</small>${['high', 'medium', 'low'].map((level) => { const value = methodTargetValues(level, methodId, targetDraft); return `<span><b>${nutritionDayTypeName(level, methodId)}</b> ${value.calories} kcal · 碳 ${value.carbs}g · 蛋 ${value.protein}g · 脂 ${value.fat}g</span>` }).join('')}</div>` : `<div class="save-method-summary"><small>${nutritionDayTypeName(dayType, methodId)}的新目标</small><strong>${target.calories} kcal</strong><span>碳 ${target.carbs}g · 蛋 ${target.protein}g · 脂 ${target.fat}g</span></div>`}
    <p class="sheet-hint">${heatRedistribution ? '保存后高中低碳日都会按新的周分配比例更新。' : saveMode === 'overwrite' ? '保存后会直接更新这个模板；其他日期类型保持不变。' : '原模板不会被覆盖，将新建并立即使用自定义模板。'}</p>
    <button class="primary-action" id="confirm-method-save" type="button">${saveMode === 'overwrite' ? '保存到当前模板' : '另存并使用新模板'}</button>`
  document.querySelector('#confirm-method-save').addEventListener('click', () => {
    const name = document.querySelector('#method-save-name').value.trim() || suggestedName
    if (saveMode === 'overwrite') {
      const customMethod = state.customMethods.find((item) => item.id === methodId)
      if (customMethod) {
        customMethod.name = name
        customMethod.target = JSON.parse(JSON.stringify(targetDraft))
      } else {
        method.name = name
        state.methodNames[methodId] = name
        state.methodOverrides[methodId] = JSON.parse(JSON.stringify(targetDraft))
      }
      state.methodId = methodId
    } else {
      const customId = `custom-${Date.now()}`
      state.customMethods.push({
        id: customId,
        name,
        note: `基于${method.name}创建`,
        baseId: method.baseId || method.id,
        target: JSON.parse(JSON.stringify(targetDraft))
      })
      state.methodId = customId
    }
    updateSettingsSummaries()
    updateSummary()
    renderTrends()
    renderPrep()
    persistState()
    closeSheet()
    showToast(saveMode === 'overwrite' ? `已更新「${name}」` : `已创建并使用「${name}」`)
    if (sheetEditSession) sheetEditSession.initial = editSignature(sheetContent)
  })
  const saveCopy=document.createElement('button');saveCopy.type='button';saveCopy.className='secondary-action';saveCopy.id='method-save-copy';saveCopy.textContent=saveMode==='overwrite'?'另存为新方法':'覆盖当前方法'
  saveCopy.onclick=()=>{targetEditContext.saveMode=saveMode==='overwrite'?'copy':'overwrite';openMethodSaveConfirmation()}
  sheetContent.append(saveCopy)
  openSheet()
}

function openMethodDayEditor(methodId, dayType, saveMode = 'overwrite', allowSwitch = false) {
  if (isDatedProgram(methodId)) { openProgramOverview(methodId); return }
  if (methodId === 'standard' && saveMode === 'overwrite') { openStandardDeficitEditor(dayType); return }
  beginEditorPage(`method-target-${methodId}`)
  targetDraft = JSON.parse(JSON.stringify(methodConfigForId(methodId)))
  targetEditContext = { methodId, dayType: nutritionDayType(dayType, methodId), saveMode, allowSwitch }
  renderMethodDayEditor()
  openSheet()
}

function openStandardDeficitEditor(initialDayType = 'training') {
  beginEditorPage('standard-deficit')
  sheetKicker.textContent = 'CALORIE DEFICIT'
  sheetTitle.textContent = '热量缺口法'
  const draft = normalizeStandardDeficitSettings(state.standardDeficitSettings)
  const legacy = state.methodOverrides.standard ? normalizeMethodConfig(state.methodOverrides.standard) : null
  if (legacy?.days) {
    draft.separateDays = true
    for (const day of ['training', 'rest']) {
      const previous = legacy.days[day]
      if (!previous) continue
      if (previous.percentages) draft.days[day].percentages = { ...previous.percentages }
      if (previous.caloriesCustomized && Number(previous.calories) > 0) draft.days[day].calories = Number(previous.calories)
    }
  }
  let activityLevel = normalizeActivityLevel(state.bodyProfile.activityLevel)
  let activeDay = normalizeDayType(initialDayType)
  const names = { carbs: '碳水', protein: '蛋白质', fat: '脂肪' }
  const keys = ['carbs', 'protein', 'fat']
  sheetContent.innerHTML = `<p class="sheet-hint">基础代谢沿用身体参数公式。活动系数为全局设置；其他配额或体重倍数方案仍按各自规则计算。</p>
    <div class="form-grid two-column"><label class="form-field"><span>活动系数（全局）</span><select id="standard-activity">${activityFactorOptions.map(option => `<option value="${option.id}">${option.label} ×${option.factor}</option>`).join('')}</select></label><label class="form-field"><span>每日热量缺口</span><input id="standard-deficit" type="number" min="300" max="500" step="10" value="${draft.deficit}" inputmode="numeric"><em>kcal</em></label></div>
    <p id="standard-activity-detail" class="sheet-hint"></p><div id="standard-calculation" class="standard-calculation" aria-live="polite"></div>
    <label class="standard-day-mode"><input id="standard-separate-days" type="checkbox" ${draft.separateDays ? 'checked' : ''}>训练日与休息日分别设置</label>
    <div class="standard-day-tabs" id="standard-day-tabs" role="group" aria-label="选择营养目标日期类型"><button type="button" data-standard-day="training">训练日</button><button type="button" data-standard-day="rest">休息日</button></div>
    <div class="standard-calorie-editor"><label class="form-field"><span id="standard-calorie-label">每日目标热量</span><input id="standard-calories" type="number" min="500" max="5000" step="1" inputmode="numeric" data-unit="kcal"><em>kcal</em></label><button class="secondary-action" id="standard-reset-calories" type="button">恢复公式建议</button></div>
    <section class="standard-ratio-section"><strong id="standard-ratio-label">每日营养素比例</strong><div class="standard-ratio-cards">${keys.map(key => `<button type="button" class="standard-ratio-card ${key}" data-ratio-card="${key}" aria-label="设置${names[key]}比例"><span>${names[key]}</span><strong data-ratio-percent="${key}"></strong><small data-ratio-grams="${key}"></small></button>`).join('')}</div>
    <div class="standard-ratio-bar" id="standard-ratio-bar" aria-label="拖动调整营养素比例"><span class="ratio-carbs"></span><span class="ratio-protein"></span><span class="ratio-fat"></span><button type="button" role="slider" class="standard-ratio-thumb" data-ratio-boundary="carbs" aria-label="碳水与蛋白质分界" aria-valuemin="5" aria-valuemax="90"></button><button type="button" role="slider" class="standard-ratio-thumb" data-ratio-boundary="protein" aria-label="蛋白质与脂肪分界" aria-valuemin="10" aria-valuemax="95"></button></div><p class="sheet-hint">拖动两处圆点，或点上方卡片精确输入。三项合计始终为 100%。</p></section>
    <button class="primary-action" id="save-standard-deficit" type="button">保存热量缺口法</button>`
  const activity = sheetContent.querySelector('#standard-activity')
  const deficit = sheetContent.querySelector('#standard-deficit')
  const caloriesInput = sheetContent.querySelector('#standard-calories')
  const dayTabs = sheetContent.querySelector('#standard-day-tabs')
  const bar = sheetContent.querySelector('#standard-ratio-bar')
  activity.value = activityLevel
  const activePercentages = () => draft.separateDays ? draft.days[activeDay].percentages : draft.percentages
  const suggestedCalories = () => Math.max(500, Math.round(bmrForProfile() * (activityFactorOptions.find(item => item.id === activityLevel)?.factor || 1.35) - draft.deficit))
  const currentCalories = () => (draft.separateDays ? draft.days[activeDay].calories : draft.manualCalories) ?? suggestedCalories()
  const hasManualCalories = () => (draft.separateDays ? draft.days[activeDay].calories : draft.manualCalories) !== null
  const paint = () => {
    const option = activityFactorOptions.find(item => item.id === activityLevel)
    const bmr = bmrForProfile(), tdee = bmr * option.factor
    const calories = currentCalories(), parts = activePercentages()
    sheetContent.querySelector('#standard-activity-detail').textContent = `${option.detail}；总运动时长 ${option.hours}`
    sheetContent.querySelector('#standard-calculation').innerHTML = `<span>基础代谢 ${Math.round(bmr)} kcal</span><span>× ${option.factor} = 总消耗 ${Math.round(tdee)} kcal</span><strong>− ${draft.deficit} = 公式建议 ${suggestedCalories()} kcal/日</strong>`
    dayTabs.hidden = !draft.separateDays
    dayTabs.querySelectorAll('[data-standard-day]').forEach(button => {
      button.classList.toggle('active', button.dataset.standardDay === activeDay)
      button.setAttribute('aria-pressed', String(button.dataset.standardDay === activeDay))
    })
    caloriesInput.value = calories
    sheetContent.querySelector('#standard-calorie-label').textContent = draft.separateDays ? `${dayTypeName(activeDay)}目标热量` : '每日目标热量'
    sheetContent.querySelector('#standard-ratio-label').textContent = draft.separateDays ? `${dayTypeName(activeDay)}营养素比例` : '每日营养素比例'
    sheetContent.querySelector('#standard-reset-calories').hidden = !hasManualCalories()
    keys.forEach(key => {
      sheetContent.querySelector(`[data-ratio-percent="${key}"]`).textContent = `${parts[key]}%`
      sheetContent.querySelector(`[data-ratio-grams="${key}"]`).textContent = `${Math.round(calories * parts[key] / 100 / (key === 'fat' ? 9 : 4))}g/日`
    })
    const first = parts.carbs, second = first + parts.protein
    bar.style.setProperty('--ratio-first', `${first}%`)
    bar.style.setProperty('--ratio-second', `${second}%`)
    bar.querySelectorAll('[data-ratio-boundary]').forEach(thumb => {
      const value = thumb.dataset.ratioBoundary === 'carbs' ? first : second
      thumb.style.left = `${value}%`
      thumb.setAttribute('aria-valuenow', String(value))
      thumb.setAttribute('aria-valuetext', thumb.dataset.ratioBoundary === 'carbs' ? `碳水${first}%，蛋白质${parts.protein}%` : `蛋白质${parts.protein}%，脂肪${parts.fat}%`)
    })
  }
  const setBoundary = (which, value) => {
    const parts = activePercentages()
    const first = parts.carbs, second = first + parts.protein
    if (which === 'carbs') {
      parts.carbs = Math.max(5, Math.min(second - 5, Math.round(value)))
      parts.protein = second - parts.carbs
    } else {
      const next = Math.max(first + 5, Math.min(95, Math.round(value)))
      parts.protein = next - first
      parts.fat = 100 - next
    }
    paint()
  }
  let separateTouched = draft.separateDays
  sheetContent.querySelector('#standard-separate-days').onchange = event => {
    if (event.target.checked && !separateTouched) {
      for (const day of ['training', 'rest']) {
        draft.days[day].calories = draft.manualCalories
        draft.days[day].percentages = { ...draft.percentages }
      }
      separateTouched = true
    }
    draft.separateDays = event.target.checked
    paint()
  }
  dayTabs.querySelectorAll('[data-standard-day]').forEach(button => button.onclick = () => {
    activeDay = button.dataset.standardDay
    paint()
  })
  caloriesInput.oninput = () => {
    const value = Number(caloriesInput.value)
    if (!caloriesInput.value || !Number.isInteger(value) || value < 500 || value > 5000) return
    if (draft.separateDays) draft.days[activeDay].calories = value
    else draft.manualCalories = value
    paint()
  }
  caloriesInput.onchange = () => {
    const value = Number(caloriesInput.value)
    if (caloriesInput.value && Number.isFinite(value)) {
      const normalized = Math.max(500, Math.min(5000, Math.round(value)))
      if (draft.separateDays) draft.days[activeDay].calories = normalized
      else draft.manualCalories = normalized
    }
    paint()
  }
  sheetContent.querySelector('#standard-reset-calories').onclick = () => {
    if (draft.separateDays) draft.days[activeDay].calories = null
    else draft.manualCalories = null
    paint()
  }
  activity.onchange = () => { activityLevel = normalizeActivityLevel(activity.value); paint() }
  deficit.oninput = () => { if (Number(deficit.value) >= 300 && Number(deficit.value) <= 500) { draft.deficit = Number(deficit.value); paint() } }
  deficit.onchange = () => { draft.deficit = Math.max(300, Math.min(500, Math.round(Number(deficit.value) || 400))); deficit.value = draft.deficit; paint() }
  bar.querySelectorAll('[data-ratio-boundary]').forEach(thumb => {
    const which = thumb.dataset.ratioBoundary
    thumb.onpointerdown = event => {
      thumb.setPointerCapture(event.pointerId)
      setBoundary(which, (event.clientX - bar.getBoundingClientRect().left) / bar.getBoundingClientRect().width * 100)
    }
    thumb.onpointermove = event => {
      if (thumb.hasPointerCapture(event.pointerId)) setBoundary(which, (event.clientX - bar.getBoundingClientRect().left) / bar.getBoundingClientRect().width * 100)
    }
    thumb.onkeydown = event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const parts = activePercentages()
      const current = which === 'carbs' ? parts.carbs : parts.carbs + parts.protein
      setBoundary(which, event.key === 'Home' ? 5 : event.key === 'End' ? 95 : current + (event.key === 'ArrowRight' ? 1 : -1))
    }
  })
  sheetContent.querySelectorAll('[data-ratio-card]').forEach(card => card.onclick = () => {
    const key = card.dataset.ratioCard
    const parts = activePercentages()
    const dialog = openActionDialog(`设置${names[key]}比例`)
    dialog.content.innerHTML = `<label class="form-field"><span>${names[key]}占目标热量</span><input id="ratio-manual-value" type="number" min="5" max="90" step="1" inputmode="numeric" value="${parts[key]}"><em>%</em></label><p class="sheet-hint">其余两项按当前比例分配剩余份额。</p><button class="primary-action" type="button" id="ratio-manual-save">应用比例</button>`
    dialog.content.querySelector('#ratio-manual-save').onclick = () => {
      const value = Number(dialog.content.querySelector('#ratio-manual-value').value)
      if (!Number.isInteger(value) || value < 5 || value > 90) { showToast('请输入 5%–90% 的整数比例'); return }
      const others = keys.filter(item => item !== key), remaining = 100 - value
      const total = parts[others[0]] + parts[others[1]]
      const first = Math.max(5, Math.min(remaining - 5, Math.round(remaining * parts[others[0]] / total)))
      Object.assign(parts, { [key]: value, [others[0]]: first, [others[1]]: remaining - first })
      dialog.close(); paint()
    }
  })
  sheetContent.querySelector('#save-standard-deficit').onclick = () => {
    if (state.methodOverrides.standard) {
      state.legacyProgramOverrides.standard ||= state.methodOverrides.standard
      delete state.methodOverrides.standard
    }
    state.standardDeficitSettings = normalizeStandardDeficitSettings(draft)
    state.bodyProfile.activityLevel = activityLevel
    persistState(); updateSettingsSummaries(); updateSummary(); renderPrep(); renderTrends(); closeSheet(); showToast('热量缺口与碳蛋脂比例已更新')
  }
  paint(); openSheet()
}

function openMethodTargetSheet(dayType = currentNutritionDayType()) {
  openMethodDayEditor(state.methodId, dayType, 'overwrite', false)
}

function setDetails(set) {
  return set.items.map((item) => `${foodById(item.foodId).name} ${item.amount}g`).join(' · ')
}

function openDefaultSetsSheet() {
  closeSheet()
  mealSetEditorState = null
  mealSetPage.hidden = false
  renderMealSetPageList()
  mealSetPageContent.scrollTop = 0
}

function closeMealSetPage() {
  mealSetPage.hidden = true
  mealSetEditorState = null
  document.querySelector('.page-stack').inert = false
  document.querySelector('.bottom-nav').inert = false
}

function mealSetListCard(set, source, editValue) {
  const nutrition = nutrientsForItems(set.items)
  return `<article class="set-page-card"><div class="set-page-icons">${set.items.slice(0, 4).map((item) => foodIconHtml(foodById(item.foodId), true)).join('')}</div><div class="set-copy"><small>${source}</small><strong>${escapeHtml(set.name)}</strong><span>${escapeHtml(setDetails(set)) || '尚未添加食物'}</span>${nutritionGridHtml(nutrition, 'compact')}</div><div class="set-card-actions"><button class="set-copy-icon" type="button" data-copy-meal-set="${editValue}" aria-label="复制${escapeHtml(set.name)}">${uiIcon('copy')}</button><button class="set-edit-icon" type="button" data-open-set-editor="${editValue}" aria-label="编辑${escapeHtml(set.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1 10-10a2.1 2.1 0 0 0-3-3l-10 10L4 20Z"/><path d="m13.8 7.8 2.4 2.4"/></svg></button></div></article>`
}

function copyMealSet(reference) {
  const sourceSet = reference.startsWith('default:')
    ? defaultMealSets[Number(reference.split(':')[1])]
    : state.savedMealSets.find((set) => set.id === reference.slice(6))
  if (!sourceSet) return
  const copy = {
    ...sourceSet,
    id: `saved-${Date.now()}`,
    name: `${sourceSet.name} 副本`,
    items: cloneItems(sourceSet.items || []),
    mealTypes: mealTypesForSet(sourceSet),
    applicableDayTypes: [...binaryApplicationsForSet(sourceSet)],
    applicableCarbonLevels: [...carbonApplicationsForSet(sourceSet)],
    applicabilityCustomized: { ...(sourceSet.applicabilityCustomized || {}) }
  }
  state.savedMealSets.push(copy)
  persistState()
  renderMealSetPageList()
  showToast(`已复制「${sourceSet.name}」`)
}

function syncMealSetToPrep(setId, set) {
  const targetMealTypes = mealTypesForSet(set)
  activeSchedulePlan().forEach((day, scheduleIndex) => {
    if (!setAppliesTo(set, scheduleDayValue(day))) return
    mealSlotsForDay(day.dayType).forEach((meal, mealIndex) => {
      if (!targetMealTypes.includes(mealTypeForSlot(meal, mealIndex))) return
      state.preferredSetByMeal[meal.id] = setId
      state.scheduleMealOverrides[scheduleMealOverrideKey(scheduleIndex, meal.id)] = cloneItems(set.items)
    })
  })
}

function renderMealSetPageList() {
  renderMealSetGroups()
}

function makeMealSetEditorState(reference = 'new') {
  if (reference.startsWith('default:')) {
    const setIndex = Number(reference.split(':')[1])
    const set = defaultMealSets[setIndex]
    const applicableDayTypes = binaryApplicationsForSet(set)
    const applicableCarbonLevels = carbonApplicationsForSet(set)
    const applicationDay = setApplicationValues(set)[0]
    const dayType = normalizeDayType(applicationDay)
    const mealType = mealTypeForSet(set)
    return { kind: 'default', setIndex, dayType, applicationDay, applicableDayTypes, applicableCarbonLevels, applicabilityCustomized: { ...(set.applicabilityCustomized || {}) }, mealType, mealTypes: mealTypesForSet(set), mealId: mealSlotForType(dayType, mealType).id, name: set.name, items: cloneItems(set.items), tolerance: state.mealPlans[dayType].tolerance }
  }
  if (reference.startsWith('saved:')) {
    const setId = reference.slice(6)
    const set = state.savedMealSets.find((candidate) => candidate.id === setId)
    const applicableDayTypes = binaryApplicationsForSet(set)
    const applicableCarbonLevels = carbonApplicationsForSet(set)
    const applicationDay = setApplicationValues(set)[0]
    const dayType = normalizeDayType(applicationDay || set.dayType || set.sourceMealId?.split('-')[0])
    const mealType = mealTypeForSet(set)
    return { kind: 'saved', setId, dayType, applicationDay, applicableDayTypes, applicableCarbonLevels, applicabilityCustomized: { ...(set.applicabilityCustomized || {}) }, mealType, mealTypes: mealTypesForSet(set), mealId: mealSlotForType(dayType, mealType).id, name: set.name, items: cloneItems(set.items), tolerance: state.mealPlans[dayType].tolerance }
  }
  const applicationDay = currentNutritionDayType()
  const dayType = normalizeDayType(applicationDay)
  const mealType = 'breakfast'
  return { kind: 'new', dayType, applicationDay, applicableDayTypes: isKingMethod() ? binaryApplicationsFromCarbon([applicationDay]) : [dayType], applicableCarbonLevels: isKingMethod() ? [applicationDay] : carbonApplicationsFromBinary([dayType]), applicabilityCustomized: { binary: !isKingMethod(), carbon: isKingMethod() }, mealType, mealTypes: [mealType], mealId: mealSlotForType(dayType, mealType).id, name: '', items: [], tolerance: state.mealPlans[dayType].tolerance }
}

function mealSetEditorApplicationValues(editor) {
  return isKingMethod() ? editor.applicableCarbonLevels : editor.applicableDayTypes
}

function setMealSetEditorApplicationValues(editor, values) {
  if (isKingMethod()) {
    editor.applicableCarbonLevels = values
    editor.applicabilityCustomized.carbon = true
    if (!editor.applicabilityCustomized.binary) editor.applicableDayTypes = binaryApplicationsFromCarbon(values)
  } else {
    editor.applicableDayTypes = values
    editor.applicabilityCustomized.binary = true
    if (!editor.applicabilityCustomized.carbon) editor.applicableCarbonLevels = carbonApplicationsFromBinary(values)
  }
}

function mealSetEditorMeal() {
  return mealSlotForType(mealSetEditorState.dayType, mealSetEditorState.mealType)
}

function commitMealSetEditorInputs() {
  const nameInput = mealSetPageContent.querySelector('#meal-set-name-input')
  if (nameInput) mealSetEditorState.name = nameInput.value
  mealSetPageContent.querySelectorAll('[data-set-item-amount]').forEach((input) => {
    const item = mealSetEditorState.items.find((candidate) => candidate.foodId === input.dataset.setItemAmount)
    if (item) item.amount = oneDecimal(input.value || item.amount, 0.1, 3000)
  })
}

function renderMealSetPageEditor() {
  const editor = mealSetEditorState
  const pageScrollTop = mealSetPageContent.scrollTop
  if (!Array.isArray(editor.categoryFilters)) editor.categoryFilters = []
  if (!editor.collapsedSections) editor.collapsedSections = { auto: false, recent: false, foods: false }
  if (!Number.isFinite(editor.foodGridScrollTop)) editor.foodGridScrollTop = 0
  const applicationOptions = methodDayOptions()
  const selectedApplications = mealSetEditorApplicationValues(editor)
  if (!selectedApplications.includes(editor.applicationDay)) editor.applicationDay = selectedApplications[0] || applicationOptions[0].id
  editor.dayType = normalizeDayType(editor.applicationDay)
  editor.mealType = normalizeMealType(editor.mealType, mealSlotById(editor.mealId)?.name)
  editor.mealTypes = mealTypesForSet(editor)
  if (!editor.mealTypes.includes(editor.mealType)) editor.mealType = editor.mealTypes[0]
  if (!mealTypeOptionsForDay(editor.dayType).some((option) => option.id === editor.mealType)) editor.mealType = mealTypeOptionsForDay(editor.dayType)[0].id
  const meal = mealSetEditorMeal()
  editor.mealId = meal.id
  const target = mealTargetForSlot(editor.applicationDay, editor.mealId, state.mealPlans, editor.kind === 'schedule' ? scheduleDateForIndex(editor.scheduleIndex) : selectedDate())
  let selectedFood = foodById(editor.selectedFood)
  const nutrition = nutrientsForItems(editor.items)
  const searchKeyword = (editor.search || '').trim()
  const commonFoodIds = [editor.selectedFood, ...recentItemsForMeal(editor.mealId).map((item) => item.foodId), ...state.pinnedFoodIds, ...selectableFoods().map((food) => food.id)]
  const commonFoodOptions = [...new Set(commonFoodIds)].map(foodById).filter((food) => food && !state.deletedFoodIds.includes(food.id))
  const foodOptions = (searchKeyword ? selectableFoods().filter((food) => matchesFoodSearch(food, searchKeyword)) : commonFoodOptions)
    .filter((food) => matchesFoodFilters(food, editor.categoryFilters))
    .slice(0, 6)
  if (foodOptions.length && !foodOptions.some((food) => food.id === editor.selectedFood || foodForState(food.id,foodState(editor.selectedFood))===editor.selectedFood)) {
    editor.selectedFood = foodForState(foodOptions[0].id,'cooked')
    editor.amount = recentAmountsFor(editor.mealId, editor.selectedFood)[0]
      || editor.items.find((item) => item.foodId === editor.selectedFood)?.amount
      || 100
    selectedFood = foodById(editor.selectedFood)
  }
  const autoResult = editor.autoResult
  const autoResultHtml = autoResult ? `<div class="auto-calc-result ${autoResult.withinTolerance ? 'matched' : 'closest'}"><strong>${autoResult.withinTolerance ? `已进入 ±${autoResult.tolerance}%` : '当前食材的最接近结果'}</strong><span>碳 ${autoResult.differences.carbs >= 0 ? '+' : ''}${autoResult.differences.carbs}% · 蛋 ${autoResult.differences.protein >= 0 ? '+' : ''}${autoResult.differences.protein}% · 脂 ${autoResult.differences.fat >= 0 ? '+' : ''}${autoResult.differences.fat}%</span></div>` : ''
  const collapseIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>'
  mealSetPageKicker.textContent = editor.kind === 'new' ? 'NEW MEAL SET' : 'EDIT MEAL SET'
  mealSetPageTitle.textContent = editor.kind === 'new' ? '增加套餐' : '编辑套餐'
  addMealSetButton.hidden = true
  mealSetPageContent.innerHTML = `<div class="meal-set-editor-form"><label class="form-field"><span>套餐名称</span><input id="meal-set-name-input" value="${escapeHtml(editor.name)}" placeholder="留空使用食材名称" maxlength="2000"></label>
    <div class="set-meal-context"><span>${editor.kind === 'schedule' ? '当前日期与餐次' : '适用日期与餐次 · 可多选'}</span><div class="day-type-toggle set-day-type-toggle ${applicationOptions.length === 3 ? 'three-options' : ''}">${applicationOptions.map((option) => `<button class="${selectedApplications.includes(option.id) ? 'active' : ''}" type="button" data-set-application-day="${option.id}" aria-pressed="${selectedApplications.includes(option.id)}" data-day-type="${option.id}" ${editor.kind === 'schedule' ? 'disabled' : ''}>${option.name}</button>`).join('')}</div><div class="meal-picker" style="--meal-choice-count:${mealTypeOptionsForDay(editor.dayType).length}">${mealTypeOptionsForDay(editor.dayType).map((option) => `<button class="meal-choice ${editor.mealTypes.includes(option.id) ? 'selected' : ''}" type="button" data-set-meal-type="${option.id}" aria-pressed="${editor.mealTypes.includes(option.id)}" ${editor.kind === 'schedule' ? 'disabled' : ''}>${option.name}</button>`).join('')}</div></div>
    <section class="auto-calc-panel set-collapsible ${editor.collapsedSections.auto ? 'collapsed' : ''}"><div class="auto-calc-heading"><span><small class="set-calculation-context">${nutritionDayTypeName(editor.applicationDay)} · ${editor.mealTypes.length > 1 ? `<select id="set-calculation-meal" aria-label="计算餐次">${editor.mealTypes.map(type => `<option value="${type}" ${type === editor.mealType ? 'selected' : ''}>${mealTypeName(type)}</option>`).join('')}</select>` : mealTypeName(editor.mealType)}</small><strong>按本餐额度计算克重</strong></span>${nutritionGridHtml(target, 'compact')}<button class="section-collapse-toggle" type="button" data-toggle-set-section="auto" aria-expanded="${!editor.collapsedSections.auto}" aria-label="${editor.collapsedSections.auto ? '展开' : '收起'}自动计算克重">${collapseIcon}</button></div><div class="collapsible-body"><div class="auto-calc-controls"><label class="tolerance-picker form-field"><span>允许差值 ±%</span><input id="set-auto-tolerance" type="number" min="5" max="15" step="1" data-slide-step="5" data-unit="%" value="${editor.tolerance}"></label><button class="auto-calc-action" id="auto-calculate-set" type="button" aria-describedby="auto-calc-note"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M14 12h2M8 16h2M14 16h2"/></svg><strong>自动计算克重</strong></button></div><p class="auto-calc-note" id="auto-calc-note">保留食材组合，只调整每样原型食物的克重</p>${autoResultHtml}</div></section>
    <section class="set-editor-summary"><div class="content-heading"><h2>套餐内容</h2><span>${editor.items.length} 种</span></div>${editor.items.length ? `<div class="meal-item-editor">${editor.items.map((item) => { const food = foodById(item.foodId); return `<div class="meal-item-edit-row">${foodIconHtml(food, true)}<span><strong>${food.name}</strong>${foodStatePair(food.id)?`<button type="button" class="food-stage-mini" data-set-item-stage="${food.id}" aria-label="切换为${foodState(food.id)==='raw'?'熟':'生'}重">${foodState(food.id)==='raw'?'生':'熟'}</button>`:''}<small>${food.calories} kcal · 碳 ${food.carbs} · 蛋 ${food.protein} · 脂 ${food.fat}${food.unitStep ? ` · ${foodAmountLabel(item)}` : ''}</small></span><label class="set-item-amount"><input data-set-item-amount="${food.id}" type="number" value="${oneDecimal(item.amount, 0.1, 3000)}" min="0.1" max="3000" step="0.1" inputmode="decimal" aria-label="${escapeHtml(food.name)}克重"><em>g</em></label><button class="lock-food ${item.locked ? 'active' : ''}" type="button" data-lock-set-food="${food.id}" aria-label="${item.locked ? '取消锁定' : '锁定'}${food.name}"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="10" width="12" height="10" rx="2"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/></svg></button><button class="remove-food" type="button" data-remove-set-food="${food.id}" aria-label="删除${food.name}">×</button></div>` }).join('')}</div>${nutritionGridHtml(nutrition)}` : '<p class="empty-editor-note">从下方选择食物并设置本次份量。</p>'}</section>
    <section class="set-collapsible ${editor.collapsedSections.recent ? 'collapsed' : ''}"><button class="sheet-section-heading collapsible-heading" type="button" data-toggle-set-section="recent" aria-expanded="${!editor.collapsedSections.recent}"><span><strong>本餐常用</strong><small>${mealTypeName(editor.mealType)}的最近记录</small></span>${collapseIcon}</button><div class="collapsible-body"><div class="recent-grid">${recentButtonsHtml(editor.mealId)}</div></div></section>
    <section class="set-collapsible ${editor.collapsedSections.foods ? 'collapsed' : ''}"><button class="sheet-section-heading collapsible-heading" type="button" data-toggle-set-section="foods" aria-expanded="${!editor.collapsedSections.foods}"><span><strong>选择食物</strong><small>含热量与碳蛋脂</small></span>${collapseIcon}</button><div class="collapsible-body"><div class="category-row set-food-category-row" aria-label="筛选套餐食物分类">${foodFilterOptions.map((option) => { const active = editor.categoryFilters.includes(option.id); return `<button class="category-chip ${active ? 'active' : ''}" type="button" data-set-food-category="${option.id}" aria-pressed="${active}">${option.name}</button>` }).join('')}</div><label class="search-field compact-set-search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/></svg><input id="meal-set-food-search" type="search" value="${escapeHtml(editor.search || '')}" placeholder="输入食物名称或拼音"><button class="search-clear" id="meal-set-food-search-clear" type="button" aria-label="清空搜索">×</button></label>${foodOptions.length ? foodLoggingControlsHtml(editor.mealId, editor.selectedFood, editor.amount, 'setlog', foodOptions) : `<div class="food-empty-inline"><span>${searchKeyword ? `没有找到“${escapeHtml(searchKeyword)}”` : '当前分类没有可选食材'}</span><button type="button" data-quick-create-food="meal-set">＋ 直接创建</button></div>`}<button class="secondary-action set-add-food" id="add-food-to-set" type="button" ${foodOptions.length ? '' : 'disabled'}>＋ 加入套餐</button></div></section><button class="primary-action" id="save-meal-set-editor" type="button">保存套餐并同步备餐</button></div>`
  mealSetPageContent.scrollTop = pageScrollTop
  const setFoodGrid = mealSetPageContent.querySelector('.food-grid')
  if (setFoodGrid) {
    setFoodGrid.scrollTop = editor.foodGridScrollTop
    setFoodGrid.addEventListener('scroll', () => { editor.foodGridScrollTop = setFoodGrid.scrollTop }, { passive: true })
  }
  mealSetPageContent.querySelectorAll('[data-toggle-set-section]').forEach((button) => button.addEventListener('click', () => {
    commitMealSetEditorInputs()
    const section = button.dataset.toggleSetSection
    editor.collapsedSections[section] = !editor.collapsedSections[section]
    renderMealSetPageEditor()
  }))
  mealSetPageContent.querySelectorAll('[data-set-application-day]').forEach((button) => button.addEventListener('click', () => {
    commitMealSetEditorInputs()
    const chosen = button.dataset.setApplicationDay
    const current = mealSetEditorApplicationValues(editor)
    const wasAdded = !current.includes(chosen)
    const next = current.includes(chosen) ? (current.length > 1 ? current.filter((value) => value !== chosen) : current) : [...current, chosen]
    const wasRemoved = current.includes(chosen) && !next.includes(chosen)
    setMealSetEditorApplicationValues(editor, next)
    editor.applicationDay = next.includes(chosen) ? chosen : next[0]
    editor.dayType = normalizeDayType(editor.applicationDay)
    editor.mealId = mealSlotForType(editor.dayType, editor.mealType).id
    editor.tolerance = state.mealPlans[editor.dayType].tolerance
    editor.autoResult = null
    editor.amount = recentAmountsFor(editor.mealId, editor.selectedFood)[0] || 100
    editor.foodGridScrollTop = 0
    renderMealSetPageEditor()
    if (wasAdded) mealSetPageContent.querySelector(`[data-set-application-day="${chosen}"]`)?.classList.add('choice-enter')
    if (wasRemoved) mealSetPageContent.querySelector(`[data-set-application-day="${chosen}"]`)?.classList.add('choice-exit')
  }))
  mealSetPageContent.querySelectorAll('[data-set-meal-type]').forEach((button) => button.addEventListener('click', () => {
    commitMealSetEditorInputs()
    if (editor.kind === 'schedule') return
    const chosen = button.dataset.setMealType
    const removing = editor.mealTypes.includes(chosen)
    if (removing && editor.mealTypes.length === 1) return
    editor.mealTypes = removing ? editor.mealTypes.filter((type) => type !== chosen) : [...editor.mealTypes, chosen]
    editor.mealType = removing ? (editor.mealTypes.includes(editor.mealType) ? editor.mealType : editor.mealTypes[0]) : chosen
    editor.mealId = mealSlotForType(editor.dayType, editor.mealType).id
    editor.autoResult = null
    editor.amount = recentAmountsFor(editor.mealId, editor.selectedFood)[0] || 100
    editor.foodGridScrollTop = 0
    renderMealSetPageEditor()
    mealSetPageContent.querySelector(`[data-set-meal-type="${chosen}"]`)?.classList.add(removing ? 'choice-exit' : 'choice-enter')
  }))
  mealSetPageContent.querySelector('#set-calculation-meal')?.addEventListener('change', (event) => {
    commitMealSetEditorInputs()
    editor.mealType = event.target.value
    editor.autoResult = null
    renderMealSetPageEditor()
  })
  mealSetPageContent.querySelector('#set-auto-tolerance').addEventListener('input', (event) => {
    editor.tolerance = Math.max(5, Math.min(15, Math.round(Number(event.target.value) || 5)))
    editor.autoResult = null
    mealSetPageContent.querySelector('.auto-calc-result')?.remove()
  })
  mealSetPageContent.querySelector('#auto-calculate-set')?.addEventListener('click', () => {
    commitMealSetEditorInputs()
    if (!editor.items.length) {
      showToast('先加入需要计算的原型食物')
      return
    }
    const result = autoCalculateMealSet(editor.items, target, editor.tolerance)
    editor.items = cloneItems(result.items)
    editor.autoResult = result
    renderMealSetPageEditor()
    showToast(result.withinTolerance ? `已计算到 ±${editor.tolerance}% 范围` : '已给出当前食材的最接近克重')
  })
  mealSetPageContent.querySelectorAll('[data-remove-set-food]').forEach((button) => button.addEventListener('click', () => {
    commitMealSetEditorInputs()
    editor.items = editor.items.filter((item) => item.foodId !== button.dataset.removeSetFood)
    editor.autoResult = null
    renderMealSetPageEditor()
  }))
  mealSetPageContent.querySelectorAll('[data-lock-set-food]').forEach((button) => button.addEventListener('click', () => {
    commitMealSetEditorInputs()
    const item = editor.items.find((candidate) => candidate.foodId === button.dataset.lockSetFood)
    if (item) item.locked = !item.locked
    editor.autoResult = null
    renderMealSetPageEditor()
  }))
  mealSetPageContent.querySelectorAll('[data-set-item-stage]').forEach(button=>button.onclick=()=>{
    commitMealSetEditorInputs()
    const item=editor.items.find(candidate=>candidate.foodId===button.dataset.setItemStage)
    if(!item)return
    const target=foodState(item.foodId)==='raw'?'cooked':'raw',nextId=foodForState(item.foodId,target)
    const amount=oneDecimal(equivalentFoodAmount(item.foodId,item.amount,target),0.1,3000)
    const existing=editor.items.find(candidate=>candidate!==item&&candidate.foodId===nextId)
    if(existing){existing.amount=oneDecimal(existing.amount+amount,0.1,3000);editor.items=editor.items.filter(candidate=>candidate!==item)}
    else {item.foodId=nextId;item.amount=amount;delete item.nutritionSnapshot;delete item.weightEntries}
    editor.autoResult=null;renderMealSetPageEditor()
  })
  mealSetPageContent.querySelectorAll('[data-recent-food]').forEach((button) => button.addEventListener('click', () => {
    commitMealSetEditorInputs()
    const id=button.dataset.recentFood,nextId=foodForState(id,'cooked')
    addAmountToItems(editor.items,nextId,nextId===id?Number(button.dataset.recentAmount):equivalentFoodAmount(id,Number(button.dataset.recentAmount),'cooked'))
    editor.autoResult = null
    renderMealSetPageEditor()
  }))
  mealSetPageContent.querySelectorAll('[data-set-food-category]').forEach((button) => button.addEventListener('click', () => {
    commitMealSetEditorInputs()
    const category = button.dataset.setFoodCategory
    editor.categoryFilters = editor.categoryFilters.includes(category)
      ? editor.categoryFilters.filter((item) => item !== category)
      : [...editor.categoryFilters, category]
    editor.foodGridScrollTop = 0
    renderMealSetPageEditor()
  }))
  mealSetPageContent.querySelector('#meal-set-food-search')?.addEventListener('input', (event) => {
    commitMealSetEditorInputs()
    const cursor = event.target.selectionStart
    editor.search = event.target.value
    editor.foodGridScrollTop = 0
    renderMealSetPageEditor()
    const nextInput = mealSetPageContent.querySelector('#meal-set-food-search')
    nextInput.focus()
    nextInput.setSelectionRange(cursor, cursor)
  })
  mealSetPageContent.querySelector('#meal-set-food-search-clear')?.addEventListener('click', () => {
    commitMealSetEditorInputs()
    editor.search = ''
    editor.foodGridScrollTop = 0
    renderMealSetPageEditor()
    mealSetPageContent.querySelector('#meal-set-food-search')?.focus()
  })
  mealSetPageContent.querySelectorAll('[data-quick-create-food="meal-set"]').forEach((button) => button.addEventListener('click', () => {
    commitMealSetEditorInputs()
    openFoodEditorSheet(null, (editor.search || '').trim(), selectCreatedFoodForSet)
  }))
  mealSetPageContent.querySelector('[data-create-set-dish]')?.addEventListener('click', () => {
    commitMealSetEditorInputs()
    openDishEditorPage(null, (editor.search || '').trim(), selectCreatedFoodForSet)
  })
  attachFoodLoggingControls(mealSetPageContent, 'setlog', {
    selectFood(foodId) {
      commitMealSetEditorInputs()
      editor.foodGridScrollTop = mealSetPageContent.querySelector('.food-grid')?.scrollTop || editor.foodGridScrollTop
      editor.selectedFood = foodForState(foodId,'cooked')
      editor.amount = recentAmountsFor(editor.mealId, editor.selectedFood)[0] || editor.items.find((item) => item.foodId === editor.selectedFood)?.amount || 100
      renderMealSetPageEditor()
    },
    setAmount(amount, rerender = true) {
      editor.amount = amount
      if (rerender) renderMealSetPageEditor()
    },
    getAmount() {
      return editor.amount
    }
  })
  mealSetPageContent.querySelectorAll('[data-food-stage-choice]').forEach(button=>button.onclick=()=>{
    const target=button.dataset.foodStageChoice
    if(target===foodState(editor.selectedFood))return
    commitMealSetEditorInputs()
    const input=mealSetPageContent.querySelector('[data-setlog-amount-input]')
    editor.amount=oneDecimal(equivalentFoodAmount(editor.selectedFood,Number(input?.value||editor.amount),target),0.1,3000)
    editor.selectedFood=foodForState(editor.selectedFood,target)
    renderMealSetPageEditor()
  })
  mealSetPageContent.querySelector('#add-food-to-set')?.addEventListener('click', () => {
    commitMealSetEditorInputs()
    addAmountToItems(editor.items, editor.selectedFood, editor.amount)
    editor.autoResult = null
    renderMealSetPageEditor()
    showToast(`已加入 ${selectedFood.name} ${editor.amount}g`)
  })
  if (editor.kind !== 'schedule') {
    const category = editor.category || (editor.kind === 'default' ? defaultMealSets[editor.setIndex]?.category || 'default' : state.savedMealSets.find(set => set.id === editor.setId)?.category || 'other')
    document.querySelector('#save-meal-set-editor').textContent = category === 'default' ? '保存默认套餐' : '保存其他套餐'
  }
  document.querySelector('#save-meal-set-editor').addEventListener('click', () => {
    commitMealSetEditorInputs()
    if (!editor.items.length) {
      showToast('套餐至少需要一种食物')
      return
    }
    const name = editor.name.trim() || mealSetAutomaticName(editor.items)
    let savedSetId = ''
    let savedSet = null
    if (editor.kind === 'schedule') {
      openScheduleMealSaveChoice(editor, name)
      return
    } else if (editor.kind === 'default') {
      const set = defaultMealSets[editor.setIndex]
      Object.assign(set, { name, dayType: editor.dayType, mealType: editor.mealType, mealTypes: [...editor.mealTypes], sourceMealId: editor.mealId, items: cloneItems(editor.items), applicableDayTypes: [...editor.applicableDayTypes], applicableCarbonLevels: [...editor.applicableCarbonLevels], applicabilityCustomized: { ...editor.applicabilityCustomized } })
      savedSetId = `default-${editor.setIndex}`
      savedSet = set
    } else if (editor.kind === 'saved') {
      const set = state.savedMealSets.find((candidate) => candidate.id === editor.setId)
      Object.assign(set, { name, dayType: editor.dayType, mealType: editor.mealType, mealTypes: [...editor.mealTypes], sourceMealId: editor.mealId, items: cloneItems(editor.items), applicableDayTypes: [...editor.applicableDayTypes], applicableCarbonLevels: [...editor.applicableCarbonLevels], applicabilityCustomized: { ...editor.applicabilityCustomized } })
      savedSetId = set.id
      savedSet = set
    } else {
      savedSetId = `saved-${Date.now()}`
      savedSet = { id: savedSetId, name, dayType: editor.dayType, mealType: editor.mealType, mealTypes: [...editor.mealTypes], sourceMealId: editor.mealId, items: cloneItems(editor.items), applicableDayTypes: [...editor.applicableDayTypes], applicableCarbonLevels: [...editor.applicableCarbonLevels], applicabilityCustomized: { ...editor.applicabilityCustomized } }
      state.savedMealSets.push(savedSet)
    }
    if (editor.kind === 'new') savedSet.category = editor.category === 'default' ? 'default' : 'other'
    if (savedSetId && savedSet && availableMealSets().find(set => set.id === savedSetId)?.category === 'default') syncMealSetToPrep(savedSetId, savedSet)
    state.mealPlans[editor.dayType].tolerance = editor.tolerance
    renderMeals()
    renderPrep()
    updateSettingsSummaries()
    persistState()
    mealSetEditorState = null
    renderMealSetPageList()
    mealSetPageContent.scrollTop = 0
    showToast(`已保存「${name}」`)
  })
  mealSetPageContent.querySelector('[data-toggle-set-section="recent"]')?.closest('section').remove()
  mealSetPageContent.querySelector('[data-toggle-set-section="foods"]')?.closest('section').remove()
  const addIngredient=document.createElement('button')
  addIngredient.type='button';addIngredient.id='add-set-ingredient';addIngredient.className='add-ingredient-heading'
  addIngredient.textContent='＋';addIngredient.setAttribute('aria-label','添加套餐食物或菜肴')
  mealSetPageContent.querySelector('.set-editor-summary .content-heading').append(addIngredient)
  addIngredient.onclick=()=>{
    commitMealSetEditorInputs()
    openIngredientPicker({title:'加入套餐',onAdd(food,amount){
      addAmountToItems(editor.items,food.id,amount);editor.autoResult=null;renderMealSetPageEditor()
    }})
  }
  const empty=mealSetPageContent.querySelector('.empty-editor-note')
  if(empty)empty.textContent='点击套餐内容右侧 ＋ 添加食物或菜肴'
  if(typeof trackSetEdit==='function')trackSetEdit()
}

function openMealSetPageEditor(reference = 'new') {
  mealSetEditorState = makeMealSetEditorState(reference)
  mealSetEditorState.selectedFood = foodForState(mealSetEditorState.items[0]?.foodId || recentItemsForMeal(mealSetEditorState.mealId)[0]?.foodId || 'chicken','cooked')
  mealSetEditorState.amount = recentAmountsFor(mealSetEditorState.mealId, mealSetEditorState.selectedFood)[0] || mealSetEditorState.items.find((item) => item.foodId === mealSetEditorState.selectedFood)?.amount || 100
  renderMealSetPageEditor()
  mealSetPageContent.scrollTop = 0
}

function makeCycleDay(index, dayType = index % 2 === 0 ? 'training' : 'rest', mode = 'binary') {
  if (mode === 'carbon') {
    const carbonLevel = carbonDayOptions[index % carbonDayOptions.length].id
    return {
      day: String(index + 1),
      dayType: normalizeDayType(carbonLevel),
      carbonLevel,
      type: nutritionDayTypeName(carbonLevel, 'king'),
      enabled: true
    }
  }
  return {
    day: String(index + 1),
    dayType,
    type: dayTypeName(dayType),
    enabled: true
  }
}

function resizeCyclePlan(draft, requestedLength) {
  const nextLength = Math.max(1, Math.min(90, Math.round(Number(requestedLength) || draft.dayCyclePlan.length)))
  if (nextLength > draft.dayCyclePlan.length) {
    while (draft.dayCyclePlan.length < nextLength) draft.dayCyclePlan.push(makeCycleDay(draft.dayCyclePlan.length, undefined, draft.mode))
  } else draft.dayCyclePlan = draft.dayCyclePlan.slice(0, nextLength)
}

function renderSchedulePlanDraft(draft) {
  const activePlan = draft.dayCyclePlan
  const options = draft.mode === 'carbon' ? carbonDayOptions : dayTypeOptions
  sheetKicker.textContent = 'PLAN CYCLE'
  sheetTitle.textContent = '周期安排'
  sheetContent.innerHTML = `<div class="cycle-length-control">
      <span><small>周期天数</small><strong>${activePlan.length} 天循环</strong></span>
      <label class="form-field cycle-number-field"><input class="cycle-length-value" aria-label="周期天数" type="number" min="1" max="90" step="1" data-unit="天" value="${activePlan.length}"></label>
    </div>
    <label class="cycle-start-field"><span><small>周期起点</small><strong>第 1 天从这里开始</strong></span><input id="cycle-start-date" type="date" value="${draft.cycleStartDate}"></label>
    <p class="schedule-mode-note">依次执行下面的安排，第 ${activePlan.length} 天结束后回到第 1 天。${draft.mode === 'carbon' ? '每一天可独立切换低、中、高碳；中、高碳使用训练日餐序，低碳使用休息日餐序。' : '每一天都可独立设为训练日或休息日。'}</p>
    <div class="week-editor">
      ${activePlan.map((day, index) => {
        const selected = draft.mode === 'carbon' ? normalizeCarbonLevel(day.carbonLevel, day.dayType) : normalizeDayType(day.dayType)
        const selectedIndex = Math.max(0, options.findIndex((option) => option.id === selected))
        const geometry = slimeChoiceGeometry(options.length, selectedIndex, selectedIndex, 0, 3)
        return `<div class="week-editor-row"><strong>第 ${index + 1} 天</strong><div class="day-type-toggle slime-toggle ${options.length === 3 ? 'three-options' : ''}" data-week-toggle="${index}" data-selected-day="${selected}" style="${slimeChoiceStyle(geometry)}"><i class="choice-slime day-choice-slime" aria-hidden="true"></i>${options.map((option) => `<button type="button" data-week-choice="${index}" data-day-type="${option.id}" class="${option.id === selected ? 'active' : ''}">${option.name}</button>`).join('')}</div></div>`
      }).join('')}
    </div><button class="primary-action" id="save-week-plan" type="button">保存并同步周期安排</button>`

  sheetContent.querySelectorAll('[data-cycle-length-step]').forEach((button) => button.addEventListener('click', () => {
    const startInput = document.querySelector('#cycle-start-date')
    if (startInput) draft.cycleStartDate = startInput.value || draft.cycleStartDate
    resizeCyclePlan(draft, activePlan.length + Number(button.dataset.cycleLengthStep))
    renderSchedulePlanDraft(draft)
  }))
  document.querySelector('.cycle-length-value').addEventListener('change', (event) => {
    const startInput = document.querySelector('#cycle-start-date')
    if (startInput) draft.cycleStartDate = startInput.value || draft.cycleStartDate
    resizeCyclePlan(draft, event.target.value)
    renderSchedulePlanDraft(draft)
  })
  sheetContent.querySelectorAll('[data-week-choice]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.weekChoice)
    const option = options.find((item) => item.id === button.dataset.dayType)
    const toggle = button.closest('[data-week-toggle]')
    const current = [...toggle.querySelectorAll('[data-week-choice]')].findIndex((choice) => choice.classList.contains('active'))
    const next = options.findIndex((item) => item.id === option.id)
    if (draft.mode === 'carbon') Object.assign(draft.dayCyclePlan[index], { dayType: option.dayType, carbonLevel: option.id, type: option.name, enabled: true })
    else Object.assign(draft.dayCyclePlan[index], { dayType: option.id, type: option.name, enabled: true })
    toggle.dataset.selectedDay = option.id
    moveSlimeIndicator(toggle, Math.max(0, current), next, options.length, 0, 3)
    sheetContent.querySelectorAll(`[data-week-choice="${index}"]`).forEach((choice) => choice.classList.toggle('active', choice === button))
  }))
  document.querySelector('#save-week-plan').addEventListener('click', () => {
    const startInput = document.querySelector('#cycle-start-date')
    if (startInput) draft.cycleStartDate = startInput.value || draft.cycleStartDate
    requestPrepScheduleChange(draft, {
      closeCurrentSheet: true,
      message: `${draft.dayCyclePlan.length} 天${draft.mode === 'carbon' ? '碳循环' : '训休'}周期已同步到日期与备餐`,
      description: '保存新的周期日期、天数或每日类型将替换当前安排。'
    })
  })
}

function openWeeklyPlanSheet() {
  if (programBaseId() === 'fixed') { openProgramOverview(); return }
  const mode = isKingMethod() ? 'carbon' : 'binary'
  const draft = {
    mode,
    cycleStartDate: state.cycleStartDate,
    dayCyclePlan: activeSchedulePlan().map((day) => ({ ...day }))
  }
  renderSchedulePlanDraft(draft)
  openSheet()
}

function scheduleMealOverrideKey(scheduleIndex, mealId, mode = state.scheduleMode) {
  return `${mode}:${scheduleIndex}:${mealId}`
}

function scheduleMealItems(day, scheduleIndex, meal, mealIndex) {
  const override = state.scheduleMealOverrides[scheduleMealOverrideKey(scheduleIndex, meal.id)]
  if (override?.length) return cloneItems(override)
  const set = preferredMealSetForSlot(meal.id, mealIndex)
  if (!set?.items?.length) return []
  return cloneItems(set.items)
}

function plannedMealsForScheduleDay(day, scheduleIndex) {
  return mealSlotsForDay(day.dayType).map((meal, mealIndex) => ({
    ...meal,
    items: scheduleMealItems(day, scheduleIndex, meal, mealIndex)
  }))
}

function randomizeScheduleDay(scheduleIndex) {
  const day = activeSchedulePlan()[scheduleIndex]
  if (!day) return
  const usedSetIds = new Set()
  let updatedMeals = 0
  mealSlotsForDay(day.dayType).forEach((meal, mealIndex) => {
    const mealType = mealTypeForSlot(meal, mealIndex)
    const candidates = compatibleMealSets(scheduleDayValue(day), mealType).filter(set => set.category === 'default')
    if (!candidates.length) return
    const currentId = state.preferredSetByMeal[meal.id]
    let pool = candidates.filter((set) => !usedSetIds.has(set.id) && set.id !== currentId)
    if (!pool.length) pool = candidates.filter((set) => set.id !== currentId)
    if (!pool.length) pool = candidates
    const selectedSet = pool[Math.floor(Math.random() * pool.length)]
    state.scheduleMealOverrides[scheduleMealOverrideKey(scheduleIndex, meal.id)] = cloneItems(selectedSet.items)
    state.preferredSetByMeal[meal.id] = selectedSet.id
    usedSetIds.add(selectedSet.id)
    updatedMeals += 1
  })
  if (!updatedMeals) {
    showToast(`没有适用于${scheduleDayName(day)}的套餐`)
    return
  }
  renderPrep()
  persistState()
  showToast(`已按日期类型与餐次随机搭配 ${updatedMeals} 餐`)
}

function scheduleDateForIndex(scheduleIndex) {
  const start = parseLocalDate(state.cycleStartDate || APP_TODAY_KEY)
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + scheduleIndex)
}

function openScheduleMealEditor(scheduleIndex, mealId) {
  const day = activeSchedulePlan()[scheduleIndex]
  const meals = plannedMealsForScheduleDay(day, scheduleIndex)
  const meal = meals.find((candidate) => candidate.id === mealId) || meals[0]
  const mealIndex = Math.max(0, meals.findIndex((candidate) => candidate.id === meal.id))
  const sourceSet = preferredMealSetForSlot(meal.id, mealIndex)
  const mealType = mealTypeForSlot(meal, mealIndex)
  const applicationDay = scheduleDayValue(day)
  const applicableDayTypes = sourceSet ? binaryApplicationsForSet(sourceSet) : [normalizeDayType(applicationDay)]
  const applicableCarbonLevels = sourceSet ? carbonApplicationsForSet(sourceSet) : (isKingMethod() ? [applicationDay] : carbonApplicationsFromBinary([day.dayType]))
  closeSheet()
  mealSetPage.hidden = false
  mealSetEditorState = {
    kind: 'schedule',
    scheduleIndex,
    dayType: day.dayType,
    applicationDay,
    applicableDayTypes,
    applicableCarbonLevels,
    applicabilityCustomized: { ...(sourceSet?.applicabilityCustomized || {}) },
    mealType,
    mealId: meal.id,
    name: sourceSet?.name || `${dayTypeName(day.dayType)}${mealTypeName(mealType)}套餐`,
    items: cloneItems(meal.items),
    tolerance: state.mealPlans[day.dayType].tolerance,
    selectedFood: meal.items[0]?.foodId || 'chicken',
    amount: meal.items[0]?.amount || 100,
    search: ''
  }
  renderMealSetPageEditor()
  mealSetPageContent.scrollTop = 0
}

function sameNameMealSet(name) {
  const normalizedName = name.trim()
  const saved = state.savedMealSets.find((set) => !set.archived && set.name.trim() === normalizedName)
  if (saved) return { kind: 'saved', set: saved }
  const defaultIndex = defaultMealSets.findIndex((set) => !set.archived && set.name.trim() === normalizedName)
  return defaultIndex >= 0 ? { kind: 'default', set: defaultMealSets[defaultIndex], index: defaultIndex } : null
}

function finalizeScheduleMealSave(editor, name, mode) {
  const mealDefinition = {
    name,
    dayType: editor.dayType,
    mealType: editor.mealType,
    sourceMealId: editor.mealId,
    applicableDayTypes: [...editor.applicableDayTypes],
    applicableCarbonLevels: [...editor.applicableCarbonLevels],
    applicabilityCustomized: { ...editor.applicabilityCustomized },
    items: cloneItems(editor.items)
  }
  let savedId = null
  if (mode === 'update') {
    const match = sameNameMealSet(name)
    if (!match) {
      showToast('没有找到同名套餐，请选择新增套餐')
      return
    }
    Object.assign(match.set, mealDefinition)
    savedId = match.kind === 'default' ? `default-${match.index}` : match.set.id
  } else {
    savedId = `saved-${Date.now()}`
    state.savedMealSets.push({ id: savedId, ...mealDefinition })
  }
  state.scheduleMealOverrides[scheduleMealOverrideKey(editor.scheduleIndex, editor.mealId)] = cloneItems(editor.items)
  state.preferredSetByMeal[editor.mealId] = savedId
  state.mealPlans[editor.dayType].tolerance = editor.tolerance
  renderMeals()
  renderPrep()
  updateSettingsSummaries()
  persistState()
  closeSheet()
  closeMealSetPage()
  switchPage('prep')
  showToast(mode === 'update' ? `已更新同名套餐「${name}」` : `已新增套餐「${name}」`)
}

function openScheduleMealSaveChoice(editor, name) {
  const match = sameNameMealSet(name)
  sheetKicker.textContent = 'SAVE MEAL SET'
  sheetTitle.textContent = '保存本次备餐'
  sheetContent.innerHTML = `<div class="schedule-save-summary"><span>${nutritionDayTypeName(editor.applicationDay)} · ${mealTypeName(editor.mealType)}</span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(setDetails({ items: editor.items }))}</small></div>
    <p class="sheet-hint">本次备餐设置完成。可以覆盖名称完全相同的套餐，也可以保留原套餐并新增一份。</p>
    <div class="schedule-save-actions">
      <button type="button" id="update-same-name-set" ${match ? '' : 'disabled'}><strong>更新同名套餐</strong><small>${match ? `覆盖${(match.set.category || (match.kind === 'default' ? 'default' : 'other')) === 'default' ? '默认套餐' : '其他套餐'}「${escapeHtml(name)}」` : '当前没有名称完全相同的套餐'}</small></button>
      <button class="primary" type="button" id="add-new-schedule-set"><strong>新增套餐</strong><small>保留已有套餐，直接新增保存</small></button>
    </div>`
  document.querySelector('#update-same-name-set').addEventListener('click', () => finalizeScheduleMealSave(editor, name, 'update'))
  document.querySelector('#add-new-schedule-set').addEventListener('click', () => finalizeScheduleMealSave(editor, name, 'new'))
  openSheet()
}

function openScheduleDaySheet(scheduleIndex) {
  const day = activeSchedulePlan()[scheduleIndex]
  const date = scheduleDateForIndex(scheduleIndex)
  const meals = plannedMealsForScheduleDay(day, scheduleIndex)
  sheetKicker.textContent = `DAY ${scheduleIndex + 1}`
  sheetTitle.textContent = `${date.getMonth() + 1}月${date.getDate()}日 · ${scheduleDayName(day)}`
  sheetContent.innerHTML = `<div class="schedule-meal-list">${meals.map((meal, mealIndex) => `<button type="button" data-edit-schedule-meal="${meal.id}"><span class="schedule-meal-icons">${meal.items.slice(0, 4).map((item) => foodIconHtml(foodById(item.foodId), true)).join('')}</span><span><strong>${mealTypeName(mealTypeForSlot(meal, mealIndex))}</strong><small>${meal.items.map((item) => `${foodById(item.foodId)?.name || ''} ${foodAmountLabel(item, false)}`).join(' · ')}</small></span><b>编辑 ›</b></button>`).join('')}</div>`
  sheetContent.querySelectorAll('[data-edit-schedule-meal]').forEach((button) => button.addEventListener('click', () => openScheduleMealEditor(scheduleIndex, button.dataset.editScheduleMeal)))
  openSheet()
}

function applyPreparedPlanToCurrentCycle() {
  activeSchedulePlan().forEach((day, scheduleIndex) => {
    const date = scheduleDateForIndex(scheduleIndex)
    const key = dateKey(date)
    const existing = state.dailyRecords[key] || { day: day.dayType, meals: buildMeals([], day.dayType, state.mealPlans) }
    existing.day = day.dayType
    existing.plannedMeals = plannedMealsForScheduleDay(day, scheduleIndex).map((meal) => ({ id: meal.id, items: cloneItems(meal.items) }))
    state.dailyRecords[key] = existing
    normalizeDailyRecord(existing)
  })
  loadSelectedDate()
}

function preparedPlanDateKeys(currentCycleOnly = false) {
  const cycleDates = currentCycleOnly ? new Set(activeSchedulePlan().map((_, index) => dateKey(scheduleDateForIndex(index)))) : null
  return Object.entries(state.dailyRecords).filter(([key, record]) =>
    (!cycleDates || cycleDates.has(key)) && ((record.plannedMeals || []).length || [...(record.meals || []), ...(record.hiddenMeals || [])].some((meal) => meal.isPlanned))
  ).map(([key]) => key)
}

function clearPreparedPlans(dateKeys) {
  dateKeys.forEach((key) => {
    const record = state.dailyRecords[key]
    if (!record) return
    record.plannedMeals = []
    ;['meals', 'hiddenMeals'].forEach((field) => {
      record[field] = (record[field] || []).map((meal) => {
        if (!meal.isPlanned) return meal
        const cleared = { ...meal, items: [] }
        delete cleared.isPlanned
        return cleared
      })
    })
    normalizeDailyRecord(record)
  })
}

function openPreparedPlanOverwriteConfirmation(dateKeys, onConfirm, description) {
  sheetKicker.textContent = 'REPLACE PREP PLAN'
  sheetTitle.textContent = '覆盖当前备餐计划？'
  sheetContent.innerHTML = `<p class="sheet-hint">检测到已有 ${dateKeys.length} 天预定餐食。${description}覆盖后，未打卡的预定餐食会清除；已经手动记录或打卡的内容会保留。</p>
    <div class="schedule-save-actions">
      <button type="button" id="keep-current-prep-plan"><strong>保留当前计划</strong><small>不修改现有备餐日期与预定餐食</small></button>
      <button class="primary" type="button" id="replace-current-prep-plan"><strong>确认覆盖</strong><small>清除未打卡预定餐食并应用新设置</small></button>
    </div>`
  document.querySelector('#keep-current-prep-plan').addEventListener('click', () => {
    prepDayArmedIndex = null
    closeSheet()
    renderPrep()
  })
  document.querySelector('#replace-current-prep-plan').addEventListener('click', () => {
    clearPreparedPlans(dateKeys)
    closeSheet()
    onConfirm()
  })
  openSheet()
}

function applyPrepScheduleDraft(draft, closeCurrentSheet, message) {
  // Snapshot/clear the OLD cycle before replacing its start or duration.
  // Actual meals and receipt history are not part of preparation completion.
  clearPreparedPlans(preparedPlanDateKeys(true))
  state.scheduleMode = 'cycle'
  state.cycleStartDate = draft.cycleStartDate
  resetShoppingPreparation()
  state.prepStartCustomized = true
  if (draft.mode === 'carbon') state.carbonCyclePlan = draft.dayCyclePlan.map((day) => ({ ...day }))
  else state.dayCyclePlan = draft.dayCyclePlan.map((day) => ({ ...day }))
  state.schedulePlanCustomized[draft.mode] = true
  state.selectedPrepDay = Math.min(state.selectedPrepDay, activeSchedulePlan().length - 1)
  prepDayArmedIndex = null
  syncWeekPlanToDailyRecords()
  loadSelectedDate()
  updateSettingsSummaries()
  renderPrep()
  persistState()
  if (closeCurrentSheet) closeSheet()
  showToast(`${message}；上一周期未打卡的预备餐已清除，清单已重置为待准备`)
}

function requestPrepScheduleChange(draft, options = {}) {
  const normalizedDraft = {
    mode: draft.mode,
    cycleStartDate: /^\d{4}-\d{2}-\d{2}$/.test(draft.cycleStartDate || '') ? draft.cycleStartDate : APP_TODAY_KEY,
    dayCyclePlan: draft.dayCyclePlan.map((day) => ({ ...day }))
  }
  if (normalizedDraft.cycleStartDate === state.cycleStartDate && JSON.stringify(normalizedDraft.dayCyclePlan) === JSON.stringify(activeSchedulePlan())) return
  const message = options.message || `备餐周期已调整为 ${normalizedDraft.dayCyclePlan.length} 天`
  const apply = () => applyPrepScheduleDraft(normalizedDraft, options.closeCurrentSheet === true, message)
  const existingDates = preparedPlanDateKeys(true)
  if (!existingDates.length) {
    apply()
    return
  }
  openPreparedPlanOverwriteConfirmation(existingDates, apply, `${options.description || '调整本周期日期或天数将替换当前安排。'}备餐清单将重置为待准备，采购账目保留。`)
}

function finishPreparingCurrentCycle() {
  const foodIds = Object.keys(weeklyFoodTotals(prepMaterialView))
  const newlyChecked = foodIds.filter((foodId) => !state.shoppingChecked.includes(foodId))
  state.shoppingChecked = foodIds
  applyPreparedPlanToCurrentCycle()
  renderPrep()
  animateShoppingChecks(newlyChecked, true, true)
  persistState()
  showToast('已生成本周期预定饮食，点击餐次即可打卡')
}

function requestPreparedPlanApplication() {
  const existingDates = preparedPlanDateKeys()
  if (!existingDates.length) {
    finishPreparingCurrentCycle()
    return
  }
  openPreparedPlanOverwriteConfirmation(existingDates, finishPreparingCurrentCycle, '重新生成本周期预定餐食将替换当前安排。')
}

function weeklyFoodTotals(rawMaterials = false) {
  const totalsByFood = {}
  activeSchedulePlan().forEach((day, scheduleIndex) => {
    if (!day.enabled) return
    plannedMealsForScheduleDay(day, scheduleIndex).forEach((meal) => {
      meal.items.forEach((item) => {
        totalsByFood[item.foodId] = (totalsByFood[item.foodId] || 0) + item.amount
      })
    })
  })
  return rawMaterials ? Object.fromEntries(expandPrepIngredients(Object.entries(totalsByFood).map(([foodId, amount]) => ({foodId, amount}))).map(item => [item.foodId, item.amount])) : totalsByFood
}

function weeklyNutrition() {
  const activeDays = activeSchedulePlan().filter((day) => day.enabled)
  let portions = 0
  const weekly = activeDays.reduce((sum, day) => {
    const scheduleIndex = activeSchedulePlan().indexOf(day)
    const meals = plannedMealsForScheduleDay(day, scheduleIndex)
    portions += meals.length
    const dayNutrition = nutrientsForItems(meals.flatMap((meal) => meal.items))
    return {
      calories: sum.calories + dayNutrition.calories,
      protein: sum.protein + dayNutrition.protein
    }
  }, { calories: 0, protein: 0 })
  return {
    activeDays: activeDays.length,
    calories: Math.round(weekly.calories),
    protein: Math.round(weekly.protein),
    portions
  }
}

function updatePrepCycleLength(step) {
  const mode = isKingMethod() ? 'carbon' : 'binary'
  const currentPlan = activeSchedulePlan()
  const draft = { mode, cycleStartDate: state.cycleStartDate, dayCyclePlan: currentPlan.map((day) => ({ ...day })) }
  resizeCyclePlan(draft, currentPlan.length + step)
  requestPrepScheduleChange(draft)
}

function cycleScheduleDayType(index) {
  const mode = isKingMethod() ? 'carbon' : 'binary'
  const draft = { mode, cycleStartDate: state.cycleStartDate, dayCyclePlan: activeSchedulePlan().map((day) => ({ ...day })) }
  const day = draft.dayCyclePlan[index]
  if (!day) return
  const options = methodDayOptions()
  const current = scheduleDayValue(day)
  const next = options[(Math.max(0, options.findIndex((option) => option.id === current)) + 1) % options.length]
  if (isKingMethod()) Object.assign(day, { carbonLevel: next.id, dayType: next.dayType, type: next.name })
  else Object.assign(day, { dayType: next.id, type: next.name })
  requestPrepScheduleChange(draft, { message: `第 ${index + 1} 天已切换为${next.name}` })
}

function renderPrep() {
  const summary = weeklyNutrition()
  const schedulePlan = activeSchedulePlan()
  const rangeStart = scheduleDateForIndex(0)
  const rangeEnd = scheduleDateForIndex(schedulePlan.length - 1)
  document.querySelector('.prep-week').innerHTML = `<label class="prep-date-edit"><span>本周期</span><strong>${String(rangeStart.getMonth() + 1).padStart(2, '0')}.${String(rangeStart.getDate()).padStart(2, '0')} — ${String(rangeEnd.getMonth() + 1).padStart(2, '0')}.${String(rangeEnd.getDate()).padStart(2, '0')}</strong><input id="prep-cycle-start-date" type="date" value="${state.cycleStartDate}" aria-label="调整本周期起始日期"></label>`
  document.querySelector('#prep-summary').innerHTML = `
    <label class="prep-days-edit"><input id="prep-cycle-days" type="number" min="1" max="90" step="1" data-unit="天" value="${schedulePlan.length}" aria-label="计划天数"><span>计划天数</span></label>
    <div><strong>${summary.portions}</strong><span>餐次份数</span></div>
    <div><strong>${summary.calories.toLocaleString('zh-CN')}</strong><span>总热量 kcal</span></div>`

  const weekPlan = document.querySelector('#week-plan')
  const weekPlanCard = document.querySelector('#week-plan-card')
  const weekPlanToggle = document.querySelector('#week-plan-toggle')
  weekPlanCard.classList.toggle('expanded', state.prepWeekExpanded)
  weekPlanToggle.setAttribute('aria-expanded', String(state.prepWeekExpanded))
  weekPlan.hidden = !state.prepWeekExpanded
  document.querySelector('#week-plan-summary-line').textContent = `${schedulePlan.length} 天 · ${schedulePlan.map((day, index) => `${index + 1}${isKingMethod() ? scheduleDayName(day, state.methodId, true) : day.dayType === 'training' ? '训' : '休'}`).join('　')}`
  state.selectedPrepDay = Math.max(0, Math.min(schedulePlan.length - 1, state.selectedPrepDay))
  weekPlan.innerHTML = `<div class="week-day-strip" style="--cycle-count:${schedulePlan.length}">${schedulePlan.map((day, index) => `
    <button class="week-day ${index === state.selectedPrepDay ? 'selected' : ''} ${scheduleDayValue(day)}" type="button" data-week-index="${index}" aria-label="第${index + 1}天 ${scheduleDayName(day)}">
      <span>第${index + 1}天</span><strong>${isKingMethod() ? scheduleDayName(day, state.methodId, true) : day.dayType === 'training' ? '训' : '休'}</strong>
    </button>`).join('')}</div>
    <div class="daily-set-heading"><strong>每日套餐</strong><div class="daily-set-tools"><span>左右滑动 · 点击编辑</span><button type="button" id="randomize-daily-sets" aria-label="随机搭配当前日期套餐"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3c4 0 5 10 10 10h3M17 4l3 3-3 3M4 17h3c1.8 0 3-1.3 4-3M17 14l3 3-3 3M13 9c1-1.2 2.2-2 4-2h3"/></svg><span>随机搭配</span></button></div></div>
    <div class="daily-set-carousel">${schedulePlan.map((day, index) => {
      const date = scheduleDateForIndex(index)
      const meals = plannedMealsForScheduleDay(day, index).map(meal => ({...meal}))
      const nutrition = nutrientsForItems(meals.flatMap((meal) => meal.items))
      if (prepMaterialView) meals.forEach(meal => { meal.items = expandPrepIngredients(meal.items) })
      return `<button class="daily-set-card ${index === state.selectedPrepDay ? 'selected' : ''}" type="button" data-daily-set-card="${index}"><span class="daily-set-date"><small>第${index + 1}天</small><strong>${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')}</strong><em>${scheduleDayName(day)}</em><span class="daily-set-nutrition"><b class="calories">${Math.round(nutrition.calories)} <small>kcal</small></b><b class="carbs">碳 ${Math.round(nutrition.carbs)}</b><b class="protein">蛋 ${Math.round(nutrition.protein)}</b><b class="fat">脂 ${Math.round(nutrition.fat)}</b></span></span><span class="daily-set-meals">${meals.map((meal, mealIndex) => `<span><b>${mealTypeName(mealTypeForSlot(meal, mealIndex))}</b><i>${meal.items.slice(0, 4).map((item) => `<span>${foodIconHtml(foodById(item.foodId), true)}<small>${foodAmountLabel(item, false)}</small></span>`).join('')}</i></span>`).join('')}</span></button>`
    }).join('')}</div>`

  document.querySelector('#prep-cycle-days').addEventListener('change', (event) => updatePrepCycleLength(Math.max(1, Math.min(90, Math.round(Number(event.target.value) || 1))) - activeSchedulePlan().length))
  document.querySelector('#prep-cycle-start-date')?.addEventListener('change', (event) => {
    const mode = isKingMethod() ? 'carbon' : 'binary'
    const nextStartDate = event.target.value || APP_TODAY_KEY
    requestPrepScheduleChange({ mode, cycleStartDate: nextStartDate, dayCyclePlan: activeSchedulePlan().map((day) => ({ ...day })) }, {
      message: `本周期已调整为 ${nextStartDate} 起的 ${activeSchedulePlan().length} 天`,
      description: '调整本周期起始日期将替换当前安排。'
    })
  })
  weekPlan.querySelectorAll('[data-week-index]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.weekIndex)
    if (prepDayArmedIndex === index) {
      cycleScheduleDayType(index)
      return
    }
    prepDayArmedIndex = index
    state.selectedPrepDay = index
    renderPrep()
  }))
  weekPlan.querySelectorAll('[data-daily-set-card]').forEach((button) => button.addEventListener('click', () => openScheduleDaySheet(Number(button.dataset.dailySetCard))))
  document.querySelector('#randomize-daily-sets')?.addEventListener('click', () => randomizeScheduleDay(state.selectedPrepDay))
  requestAnimationFrame(() => {
    const carousel = weekPlan.querySelector('.daily-set-carousel')
    const selectedCard = weekPlan.querySelector('.daily-set-card.selected')
    if (carousel && selectedCard) carousel.scrollTo({ left: Math.max(0, selectedCard.offsetLeft - 10), behavior: 'smooth' })
  })

  const shopping = Object.entries(weeklyFoodTotals(prepMaterialView)).sort((left, right) => right[1] - left[1])
  document.querySelector('#shopping-progress').textContent = `${shopping.filter(([id,amount])=>shoppingIsComplete(id,amount)).length}/${shopping.length}`
  document.querySelector('#shopping-list').innerHTML = shopping.map(([foodId, amount]) => {
    const pair=foodStatePair(foodId),family=pair?foodFamilyId(foodId):''
    const stage=pair?(state.foodLibraryStages?.[family]||foodState(foodId)):''
    const displayId=pair?foodForState(foodId,stage):foodId
    const displayAmount=pair?equivalentFoodAmount(foodId,amount,stage):amount
    const food = foodById(displayId) || {id: foodId, name: prepIngredientName(foodId), category: 'other'}
    const displayName=pair?food.name.replace(/[（(][生熟][）)]$/,''):food.name
    const checked = shoppingIsComplete(foodId,amount)
    const purchase = shoppingPurchaseStats(shoppingLedgerEnabled() ? state.shoppingPurchases : [], displayId, state.cycleStartDate, displayAmount)
    const progress = checked ? 100 : displayAmount > 0 ? Math.max(0, Math.min(100, purchase.grams / displayAmount * 100)) : 0
    return `
      <div class="shopping-item ${checked ? 'checked' : ''}" data-shopping-row="${foodId}" style="--shopping-progress:${progress}%">
        <span class="shopping-row-progress" role="progressbar" aria-label="${escapeHtml(food.name)}备齐进度" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${checked ? 100 : Math.floor(progress)}"><span></span></span>
        <button type="button" class="shopping-check" data-shopping-food="${foodId}" aria-label="${checked ? '已完成' : '标记备好'}${escapeHtml(displayName)}" aria-pressed="${checked}" ${shoppingAutoComplete(foodId,amount)?'disabled title="已购足，调整采购数量后自动更新"':''}>${completionCheckSvg()}</button>
        ${foodIconHtml(food, true)}
        <span class="shopping-copy"><strong>${escapeHtml(displayName)}</strong>${pair?foodStageSegmentedHtml(stage,{label:`${displayName}生熟状态`,buttonAttribute:'data-prep-stage',family,className:'shopping-stage-toggle'}):`<small>${checked ? '已完成' : '待准备'}</small>`}</span>
        ${shoppingPriceHtml(displayId, displayAmount)}
        <button type="button" class="shopping-required" data-shopping-weight="${displayId}" data-required="${displayAmount}" aria-label="查看${escapeHtml(food.name)}重量换算"><small>${commonWeightRule(displayId)?'建议购买':'计划用量'}</small>${shoppingWeightLabel(weightSuggestedPurchase(displayId,displayAmount))}</button>
      </div>`
  }).join('')

  bindShoppingLedger()
  bindPrepMaterialControls()
  document.querySelectorAll('[data-prep-stage]').forEach(button=>button.addEventListener('click',()=>{
    const family=button.dataset.family,stage=button.dataset.prepStage
    if(state.foodLibraryStages?.[family]===stage||button.getAttribute('aria-pressed')==='true')return
    const previous=state.foodLibraryStages?.[family]
    state.foodLibraryStages[family]=stage
    try{persistState()}catch{if(previous===undefined)delete state.foodLibraryStages[family];else state.foodLibraryStages[family]=previous;showToast('生熟选择未保存');return}
    const row=button.closest('[data-shopping-row]'),foodId=row.dataset.shoppingRow
    const toggle=button.closest('.food-stage-toggle'),toIndex=stage==='raw'?0:1
    row.foodStageCleanup?.()
    const indicator=toggle.querySelector('.choice-slime')
    void indicator.offsetLeft
    toggle.dataset.stage=stage
    toggle.style.setProperty('--slime-to',slimeChoiceGeometry(2,toIndex,toIndex,0,2).to)
    toggle.querySelectorAll('[data-prep-stage]').forEach(choice=>{
      const active=choice.dataset.prepStage===stage
      choice.classList.toggle('active',active)
      choice.setAttribute('aria-pressed',String(active))
    })
    button.focus({preventScroll:true})
    const finish=()=>{
      row.foodStageCleanup?.()
      if(!row.isConnected)return
      const finalStage=state.foodLibraryStages[family]
      const keepFocus=row.contains(document.activeElement)
      const prepPage=document.querySelector('[data-page="prep"]'),scrollTop=prepPage.scrollTop
      renderPrep();renderFoodLibrary()
      prepPage.scrollTop=scrollTop
      if(keepFocus)document.querySelector(`#shopping-list [data-shopping-row="${CSS.escape(foodId)}"] [data-prep-stage="${finalStage}"]`)?.focus({preventScroll:true})
    }
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)finish()
    else{
      const onEnd=event=>{if(event.target===indicator&&event.propertyName==='left')finish()}
      indicator.addEventListener('transitionend',onEnd)
      row.foodStageTimer=setTimeout(finish,2500)
      row.foodStageCleanup=()=>{indicator.removeEventListener('transitionend',onEnd);clearTimeout(row.foodStageTimer);row.foodStageCleanup=null}
      requestAnimationFrame(()=>{if(row.isConnected&&!indicator.getAnimations().length)finish()})
    }
  }))

  document.querySelectorAll('[data-shopping-food]').forEach((button) => {
    button.addEventListener('click', () => {
      const foodId = button.dataset.shoppingFood
      const checked = !state.shoppingChecked.includes(foodId)
      if (checked) state.shoppingChecked.push(foodId)
      else state.shoppingChecked = state.shoppingChecked.filter((id) => id !== foodId)
      renderPrep()
      animateShoppingChecks([foodId], checked)
      persistState()
    })
  })
}

function compactScheduleSummary(plan = activeSchedulePlan()) {
  const counts = plan.reduce((summary, day) => {
    const key = scheduleDayValue(day)
    summary[key] = (summary[key] || 0) + 1
    return summary
  }, {})
  if (isKingMethod()) return `高${counts.high || 0}天 · 中${counts.medium || 0}天 · 低${counts.low || 0}天`
  return `训练${counts.training || 0}天 · 休息${counts.rest || 0}天`
}

function updateSettingsSummaries() {
  updateLedgerPreferenceUI()
  const method = methodById(state.methodId)
  document.querySelector('#method-name').textContent = method.name
  const range = state.methodApplications[state.methodId]
  const rangeNote = document.querySelector('#method-range-note')
  rangeNote.hidden = !range
  rangeNote.textContent = range ? `应用范围 ${range.start} — ${range.end}` : ''
  document.querySelector('#method-day-targets').classList.toggle('three-days', methodDayOptions().length === 3)
  document.querySelector('#method-day-targets').innerHTML = methodDayOptions().map((option) => {
    const dayType = option.id
    const dayTarget = methodTargetValues(dayType)
    return `<button class="${dayType}" type="button" title="${escapeHtml(methodSettingLabel(dayType))}" data-edit-current-day-target="${dayType}"><span>${nutritionDayTypeName(dayType)}</span><strong class="method-target-energy">${dayTarget.calories}<em> kcal</em></strong><div class="method-target-macros"><span class="carbs">碳 ${dayTarget.carbs}g</span><span class="protein">蛋 ${dayTarget.protein}g</span><span class="fat">脂 ${dayTarget.fat}g</span></div><b>编辑 ›</b></button>`
  }).join('')
  document.querySelectorAll('[data-edit-current-day-target]').forEach((button) => button.addEventListener('click', () => openMethodDayEditor(state.methodId, button.dataset.editCurrentDayTarget, 'overwrite', false)))
  document.querySelector('#weekly-plan-summary').textContent = compactScheduleSummary()
  document.querySelector('#body-profile-summary').textContent = `${state.bodyProfile.gender === 'female' ? '女' : '男'} · ${state.bodyProfile.age}岁 · ${state.bodyProfile.height}cm · ${formatBodyWeight(state.bodyProfile.weight)} · ${activityFactorForProfile().label}×${activityFactorForProfile().factor} · ${state.bodyProfile.goal}`
  document.querySelector('#weight-unit-select').value = normalizeWeightUnit(state.weightUnit)
  document.querySelector('#meal-settings-summary').textContent = `训练 ${state.mealPlans.training.count} 餐 · 休息 ${state.mealPlans.rest.count} 餐`
  document.querySelector('#default-sets-summary').textContent = `${availableMealSets().filter(set => set.category === 'default').length} 个默认 · ${availableMealSets().filter(set => set.category === 'other').length} 个其他`
  const activeTheme = themes.find((theme) => theme.id === state.theme) || themes[0]
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', activeTheme.chrome)
  try { window.appearanceBridge?.setColor(activeTheme.chrome) } catch (_) { /* Browser preview has no native shell. */ }
  document.body.dataset.theme = state.theme
  document.body.dataset.iconStyle = state.iconStyle || 'classic'
  updateProgramSettingsDisplay()
  renderReviewBanner()
}

function openBodySettingsSheet() {
  beginEditorPage('body-profile')
  sheetKicker.textContent = 'BODY PROFILE'
  sheetTitle.textContent = '身体参数'
  sheetContent.innerHTML = `<div class="body-profile-editor"><div class="form-grid two-column"><label class="form-field"><span>年龄</span><input id="profile-age" type="number" value="${state.bodyProfile.age}" min="14" max="100"><em>岁</em></label><label class="form-field"><span>性别</span><select id="profile-gender"><option value="male">男</option><option value="female">女</option></select></label><label class="form-field"><span>身高</span><input id="profile-height" type="number" value="${state.bodyProfile.height}" min="120" max="230"><em>cm</em></label><label class="form-field"><span>体重</span><input id="profile-weight" type="number" value="${bodyWeightDisplayValue(state.bodyProfile.weight)}" min="${bodyWeightInputBounds(30,300).min}" max="${bodyWeightInputBounds(30,300).max}" step="${state.weightUnit === 'jin' ? '0.1' : '0.01'}"><em>${bodyWeightUnitLabel()}</em></label><label class="form-field wide"><span>当前目标</span><select id="profile-goal"><option>减脂</option><option>维持</option><option>增肌</option></select></label></div>
    <div class="profile-formula-fields"><small>公式所需参数</small><div class="form-grid two-column"><label class="form-field"><span>体型倾向</span><select id="profile-body-type"><option value="ectomorph">偏瘦 / 外胚</option><option value="endomorph">易胖 / 内胚</option></select></label><label class="form-field wide"><span>活动系数</span><select id="profile-activity-level">${activityFactorOptions.map(option => `<option value="${option.id}">${option.label} ×${option.factor}</option>`).join('')}</select></label></div><p id="profile-activity-detail" class="sheet-hint" aria-live="polite"></p></div>
    <button class="primary-action" id="save-body-profile" type="button">保存身体参数</button></div>`
  document.querySelector('#profile-gender').value = state.bodyProfile.gender
  document.querySelector('#profile-goal').value = state.bodyProfile.goal
  document.querySelector('#profile-body-type').value = state.bodyProfile.bodyType
  document.querySelector('#profile-activity-level').value = normalizeActivityLevel(state.bodyProfile.activityLevel)
  const paintActivityDetail = () => {
    const option = activityFactorOptions.find(item => item.id === document.querySelector('#profile-activity-level').value) || activityFactorOptions[1]
    document.querySelector('#profile-activity-detail').textContent = `${option.detail}；总运动时长 ${option.hours}`
  }
  document.querySelector('#profile-activity-level').addEventListener('change', paintActivityDetail)
  paintActivityDetail()
  document.querySelector('#save-body-profile').addEventListener('click', () => {
    const enteredWeight = Number(document.querySelector('#profile-weight').value)
    const updatedWeight = bodyWeightFromDisplay(enteredWeight)
    if (!document.querySelector('#profile-weight').value || !Number.isFinite(updatedWeight) || updatedWeight < 30 || updatedWeight > 300) { showToast(`请输入有效体重（${bodyWeightUnitLabel()}）`); return }
    state.bodyProfile.age = Math.max(14, Number(document.querySelector('#profile-age').value) || state.bodyProfile.age)
    state.bodyProfile.gender = document.querySelector('#profile-gender').value
    state.bodyProfile.height = Math.max(120, Number(document.querySelector('#profile-height').value) || state.bodyProfile.height)
    state.bodyProfile.weight = updatedWeight
    upsertWeightRecord(updatedWeight, Date.now(), 'profile')
    state.bodyProfile.goal = document.querySelector('#profile-goal').value
    state.bodyProfile.bodyType = document.querySelector('#profile-body-type').value
    state.bodyProfile.activityLevel = normalizeActivityLevel(document.querySelector('#profile-activity-level').value)
    updateSettingsSummaries()
    updateSummary()
    renderTrends()
    renderPrep()
    persistState()
    closeSheet()
    showToast('身体参数和目标计算已更新')
  })
  openSheet()
}

function commitMealPlanDraftInputs(draft, dayType) {
  draft[dayType].meals.slice(0, draft[dayType].count).forEach((meal, index) => {
    const typeInput = sheetContent.querySelector(`[data-plan-meal-type-select="${dayType}:${index}"]`)
    const timingInput = sheetContent.querySelector(`[data-plan-meal-timing-select="${dayType}:${index}"]`)
    const timeInput = sheetContent.querySelector(`[data-plan-meal-time="${dayType}:${index}"]`)
    if (typeInput) {
      meal.mealType = typeInput.value
      meal.timingType = timingInput?.value || ''
      meal.name = mealDisplayName(typeInput.value, meal.timingType)
    }
    if (timeInput) meal.time = timeInput.value || meal.time
    ;['carbRatio','proteinRatio','fatRatio'].forEach(key=>{
      const input=sheetContent.querySelector(`[data-plan-ratio="${index}:${key}"]`)
      if(input)meal[key]=Math.max(0,Math.min(100,Number(input.value)||0))
    })
  })
}

function adjustMealPlanCount(plan, nextCount) {
  const previousCount = plan.count
  plan.count = Math.max(2, Math.min(6, nextCount))
  if (plan.count <= previousCount) return
  const added = plan.meals[plan.count - 1]
  ;['carbRatio', 'proteinRatio', 'fatRatio'].forEach((key) => {
    if (added[key] > 0) return
    const activeBefore = plan.meals.slice(0, plan.count - 1)
    const largest = activeBefore.reduce((best, meal) => meal[key] > best[key] ? meal : best, activeBefore[0])
    const allocation = Math.min(10, largest[key])
    largest[key] -= allocation
    added[key] = allocation
  })
}

function updateMealPlanDraftPreview(draft, dayType) {
  const plan = draft[dayType]
  const slots = mealSlotsFromPlans(dayType, draft)
  const carbTotal = slots.reduce((sum, meal) => sum + meal.carbRatio, 0)
  const proteinTotal = slots.reduce((sum, meal) => sum + meal.proteinRatio, 0)
  const fatTotal = slots.reduce((sum, meal) => sum + meal.fatRatio, 0)
  const totalElement = sheetContent.querySelector('#meal-plan-ratio-total')
  if (totalElement) totalElement.textContent = `碳 ${carbTotal}% · 蛋 ${proteinTotal}% · 脂 ${fatTotal}%${carbTotal === 100 && proteinTotal === 100 && fatTotal === 100 ? '' : ' · 自动归一化'}`
  const targets = mealTargetsForDay(dayType, draft)
  const daily = targetForDayType(dayType)
  plan.meals.slice(0, plan.count).forEach((meal, index) => {
    const target = targets.find((candidate) => candidate.mealId === meal.id)
    ;['carbs','protein','fat'].forEach(key => {
      const grams=sheetContent.querySelector(`[data-plan-grams="${index}:${key}"]`)
      if(grams)grams.textContent=`${Math.round((target?.[key]||0)*10)/10}g`
    })
    const output = sheetContent.querySelector(`[data-plan-fat-share="${dayType}:${index}"]`)
    if (output) output.textContent = `${Math.round(target.fat / Math.max(1, daily.fat) * 100)}%`
  })
  const countElement = sheetContent.querySelector('#meal-plan-count')
  if (countElement) countElement.textContent = `${plan.count} 餐`
}

function renderMealPlanSettingsDraft(draft, dayType, editing = false) {
  const plan = draft[dayType]
  const slots = plan.meals.slice(0, plan.count)
  const dayFrom = mealPlanDayTransition?.from || dayType
  const dayTo = dayType
  const dayFromIndex = Math.max(0, dayTypeOptions.findIndex((option) => option.id === dayFrom))
  const dayToIndex = Math.max(0, dayTypeOptions.findIndex((option) => option.id === dayTo))
  const dayGeometry = slimeChoiceGeometry(dayTypeOptions.length, dayFromIndex, dayToIndex, 0, 3)
  sheetKicker.textContent = 'MEAL STRUCTURE'
  sheetTitle.textContent = '餐次设置'
  sheetContent.innerHTML = `<div class="day-type-toggle meal-plan-day-toggle slime-toggle" data-selected-day="${dayType}" style="${slimeChoiceStyle(dayGeometry)}"><i class="choice-slime day-choice-slime ${slimeMotionClass(dayFromIndex, dayToIndex)}" aria-hidden="true"></i>${dayTypeOptions.map((option) => `<button class="${option.id === dayType ? 'active' : ''}" type="button" data-plan-day="${option.id}" data-day-type="${option.id}">${option.name}</button>`).join('')}</div>
    <div class="meal-plan-toolbar"><span>当日餐数</span>${horizontalNumberHtml('plan-meal-count', plan.count, 2, 6, '当日餐数')}</div>
    ${dayType === 'training' ? `<label class="form-field meal-plan-preset"><span>餐序预设</span><select id="meal-plan-preset">${plan.presetId === 'custom' ? '<option value="custom" selected>自定义餐序</option>' : ''}${Object.entries(songTrainingMealPresets).map(([id, preset]) => `<option value="${id}" ${id === plan.presetId ? 'selected' : ''}>${preset.name}</option>`).join('')}</select></label>` : ''}
    <div class="meal-plan-ratio-summary"><span>各餐占全天营养目标的份额</span><strong id="meal-plan-ratio-total"></strong></div>
    <p class="meal-plan-ratio-hint">分别安排每餐占全天碳水、蛋白质和脂肪目标的比例，三个比例互不联动。</p>
    <div class="meal-plan-editor">${slots.map((meal, index) => {
      const [hour, minute] = meal.time.split(':').map(Number)
      return `<article class="meal-plan-card"><div class="meal-plan-row"><span>${String(index + 1).padStart(2, '0')}</span><div class="meal-type-pickers ${dayType === 'training' ? 'with-timing' : ''}"><select class="meal-name-input" data-plan-meal-type-select="${dayType}:${index}" aria-label="第${index + 1}餐餐次类型">${mealTypeOptionsForDay(dayType).map((option) => `<option value="${option.id}" ${option.id === mealTypeForSlot(meal, index) ? 'selected' : ''}>${option.name}</option>`).join('')}</select>${dayType === 'training' ? `<select class="meal-timing-input" data-plan-meal-timing-select="${dayType}:${index}" aria-label="第${index + 1}餐训练时段">${mealTimingOptions.map((option) => `<option value="${option.id}" ${option.id === normalizeMealTiming(meal.timingType, meal.name) ? 'selected' : ''}>${option.name}</option>`).join('')}</select>` : ''}</div><div class="meal-time-picker"><input type="hidden" data-plan-meal-time="${dayType}:${index}" value="${meal.time}"><button class="meal-time-button" type="button" data-plan-time-open="${dayType}:${index}" aria-label="第${index+1}餐时间">${meal.time}</button></div></div><div class="meal-plan-controls"><div class="meal-ratio-row"><div class="meal-ratio-control carbs"><span><b>碳水</b><small>占全天</small></span>${wheelColumnHtml('碳水占全天', Array.from({ length: 21 }, (_, value) => value * 5), meal.carbRatio, `plan:${dayType}:${index}:carbRatio`, 'carbs')}</div><div class="meal-ratio-control protein"><span><b>蛋白</b><small>占全天</small></span>${wheelColumnHtml('蛋白占全天', Array.from({ length: 21 }, (_, value) => value * 5), meal.proteinRatio, `plan:${dayType}:${index}:proteinRatio`, 'protein')}</div><div class="meal-ratio-control fat"><span><b>脂肪</b><small>占全天</small></span>${wheelColumnHtml('脂肪占全天', Array.from({ length: 21 }, (_, value) => value * 5), meal.fatRatio, `plan:${dayType}:${index}:fatRatio`, 'fat')}</div></div></div></article>`
    }).join('')}</div><button class="primary-action" id="save-meal-settings" type="button">保存训练与休息日餐次</button>`

  sheetContent.querySelectorAll('[data-plan-day]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.planDay === dayType) return
    commitMealPlanDraftInputs(draft, dayType)
    mealPlanDayTransition = { from: dayType, to: button.dataset.planDay }
    renderMealPlanSettingsDraft(draft, button.dataset.planDay, editing)
  }))
  mealPlanDayTransition = null
  initializeHorizontalNumbers(sheetContent)
  sheetContent.querySelectorAll('[data-plan-time-open]').forEach(button => button.addEventListener('click', () => {
    const input = sheetContent.querySelector(`[data-plan-meal-time="${button.dataset.planTimeOpen}"]`)
    openMealTimeDialog(input, '修改餐次时间', value => { button.textContent = value; commitMealPlanDraftInputs(draft, dayType) })
  }))
  sheetContent.querySelector('.meal-plan-toolbar').remove()
  sheetContent.querySelector('.meal-plan-ratio-hint').remove()
  sheetContent.querySelector('.meal-plan-ratio-summary > span').remove()
  const editButton = document.createElement('button')
  editButton.type = 'button'; editButton.id = 'edit-meal-structure'
  editButton.textContent = editing ? '完成排序' : '编辑餐次'
  editButton.onclick = () => { commitMealPlanDraftInputs(draft, dayType); renderMealPlanSettingsDraft(draft, dayType, !editing) }
  sheetContent.querySelector('.meal-plan-ratio-summary').append(editButton)
  const presetRow = sheetContent.querySelector('.meal-plan-preset')
  if (presetRow) sheetContent.querySelector('.meal-plan-ratio-summary').after(presetRow)
  sheetContent.querySelector('#save-meal-settings').textContent = '保存并返回'
  const presetSelect=sheetContent.querySelector('#meal-plan-preset')
  if(presetSelect)presetSelect.disabled=!editing
  sheetContent.querySelectorAll('.meal-plan-card').forEach((card, index) => {
    card.querySelector('.meal-plan-controls').innerHTML = `<div class="meal-ratio-compact">${[['carbRatio','碳','carbs'],['proteinRatio','蛋','protein'],['fatRatio','脂','fat']].map(([key,label,color]) => `<label class="${color}"><span>${label}</span><input type="number" min="0" max="100" step="1" value="${slots[index][key]}" data-plan-ratio="${index}:${key}" aria-label="第${index+1}餐${label}比例"><span>%</span><output data-plan-grams="${index}:${color}"></output></label>`).join('')}</div>`
    if (editing) {
      const actions = document.createElement('div'); actions.className = 'meal-structure-actions'
      actions.innerHTML = `<button type="button" data-move="-1" aria-label="上移第${index+1}餐" ${index===0?'disabled':''}>↑</button><button type="button" data-move="1" aria-label="下移第${index+1}餐" ${index===slots.length-1?'disabled':''}>↓</button><button type="button" data-delete-meal aria-label="删除第${index+1}餐" ${plan.count<=2?'disabled':''}>×</button>`
      actions.querySelectorAll('[data-move]').forEach(button => button.onclick = () => {
        commitMealPlanDraftInputs(draft,dayType)
        const next=index+Number(button.dataset.move)
        ;[plan.meals[index],plan.meals[next]]=[plan.meals[next],plan.meals[index]]
        plan.presetId='custom'; renderMealPlanSettingsDraft(draft,dayType,true)
      })
      actions.querySelector('[data-delete-meal]').onclick = () => {
        commitMealPlanDraftInputs(draft,dayType)
        // Retain the inactive slot ID so existing records stay associated.
        plan.meals.push(...plan.meals.splice(index,1)); plan.count--
        plan.presetId='custom'; renderMealPlanSettingsDraft(draft,dayType,true)
      }
      card.append(actions)
    }
  })
  sheetContent.querySelectorAll('[data-plan-ratio]').forEach(input => input.addEventListener('change', () => {
    const [index,key]=input.dataset.planRatio.split(':')
    plan.meals[Number(index)][key]=Math.max(0,Math.min(100,Number(input.value)||0))
    input.value=plan.meals[Number(index)][key]; plan.presetId='custom'
    updateMealPlanDraftPreview(draft,dayType)
  }))
  if (editing) {
    const add=document.createElement('button'); add.type='button'; add.id='add-plan-meal'; add.className='add-ingredient-heading'
    add.textContent='＋'; add.setAttribute('aria-label','增加餐次'); add.disabled=plan.count>=6
    add.onclick=()=>{commitMealPlanDraftInputs(draft,dayType);adjustMealPlanCount(plan,plan.count+1);plan.presetId='custom';renderMealPlanSettingsDraft(draft,dayType,true)}
    sheetContent.querySelector('#save-meal-settings').before(add)
  }
  enhanceEditorControls(sheetContent)
  document.querySelector('#meal-plan-preset')?.addEventListener('change', (event) => {
    if (event.target.value === 'custom') return
    const tolerance = plan.tolerance
    draft.training = createMealPlan('training', event.target.value)
    draft.training.tolerance = tolerance
    renderMealPlanSettingsDraft(draft, 'training', editing)
  })
  sheetContent.querySelectorAll('[data-plan-meal-type-select]').forEach((select) => select.addEventListener('change', () => {
    plan.presetId = dayType === 'rest' ? 'rest' : 'custom'
  }))
  initializeWheelPickers(sheetContent, (name, value) => {
    const [, targetDayType, rawIndex, part] = name.split(':')
    const index = Number(rawIndex)
    if (part === 'hour' || part === 'minute') {
      const hour = Number(sheetContent.querySelector(`[data-wheel-scroll="plan:${targetDayType}:${index}:hour"]`).dataset.wheelSelected)
      const minute = Number(sheetContent.querySelector(`[data-wheel-scroll="plan:${targetDayType}:${index}:minute"]`).dataset.wheelSelected)
      const timeInput = sheetContent.querySelector(`[data-plan-meal-time="${targetDayType}:${index}"]`)
      timeInput.value = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      draft[targetDayType].meals[index].time = timeInput.value
    } else {
      draft[targetDayType].meals[index][part] = value
      draft[targetDayType].presetId = targetDayType === 'rest' ? 'rest' : 'custom'
    }
    updateMealPlanDraftPreview(draft, targetDayType)
  })
  updateMealPlanDraftPreview(draft, dayType)
  document.querySelector('#save-meal-settings').addEventListener('click', () => {
    commitMealPlanDraftInputs(draft, dayType)
    const invalidDay = ['training', 'rest'].find((type) => {
      const active = draft[type].meals.slice(0, draft[type].count)
      return ['carbRatio', 'proteinRatio', 'fatRatio'].some((key) => active.reduce((sum, meal) => sum + meal[key], 0) <= 0)
    })
    if (invalidDay) {
      showToast(`${dayTypeName(invalidDay)}至少要分配碳水、蛋白和脂肪比例`)
      return
    }
    const selectedMealId = state.meals[state.selectedMeal]?.id
    state.mealPlans = cloneMealPlans(draft)
    Object.values(state.dailyRecords).forEach(normalizeDailyRecord)
    loadSelectedDate()
    state.selectedMeal = Math.max(0, state.meals.findIndex((meal) => meal.id === selectedMealId))
    updateSettingsSummaries()
    renderPrep()
    persistState()
    closeSheet()
    showToast(`已保存：训练 ${state.mealPlans.training.count} 餐，休息 ${state.mealPlans.rest.count} 餐`)
  })
  sheetContent.editDraftReader={saveId:'save-meal-settings',read:()=>{commitMealPlanDraftInputs(draft,dayType);return draft}}
}

function openMealSettingsSheet() {
  const draft = cloneMealPlans(state.mealPlans)
  renderMealPlanSettingsDraft(draft, normalizeDayType(state.day))
  openSheet()
}

function openThemeSettingsSheet() {
  sheetKicker.textContent = 'APPEARANCE'
  sheetTitle.textContent = '界面样式'
  sheetContent.innerHTML = `<section class="icon-style-settings"><h3>图标风格</h3><div class="icon-style-options" role="group" aria-label="图标风格"><button type="button" data-icon-style="classic" aria-pressed="${state.iconStyle !== 'pixel'}">常规图标</button><button type="button" data-icon-style="pixel" aria-pressed="${state.iconStyle === 'pixel'}">像素风</button></div></section><div class="theme-list">${themes.map((theme) => `<button class="theme-option ${theme.id === state.theme ? 'active' : ''}" type="button" data-theme-option="${theme.id}"><i aria-hidden="true" data-palette="${theme.id}" style="${themePaletteStyle()}"></i><span><strong>${theme.name}</strong><small>${theme.description}</small></span><b>${theme.id === state.theme ? '✓' : '›'}</b></button>`).join('')}</div>`
  sheetContent.querySelectorAll('[data-icon-style]').forEach(button => button.onclick = () => {
    state.iconStyle = button.dataset.iconStyle
    updateSettingsSummaries(); renderFoodLibrary(); renderMeals(); renderPrep(); persistState(); openThemeSettingsSheet()
    showToast('图标风格已切换')
  })
  sheetContent.querySelectorAll('[data-theme-option]').forEach((button) => button.addEventListener('click', () => {
    state.theme = button.dataset.themeOption
    updateSettingsSummaries()
    persistState()
    openThemeSettingsSheet()
    showToast('界面样式已切换')
  }))
  openSheet()
}

function openDataSettingsSheet() {
  const recordCount = Object.keys(state.dailyRecords).length
  sheetKicker.textContent = 'LOCAL DATA'
  sheetTitle.textContent = '数据与备份'
  sheetContent.innerHTML = `<div class="data-summary"><div><strong>${recordCount}</strong><span>日期记录</span></div><div><strong>${foods.length}</strong><span>食物</span></div><div><strong>${availableMealSets().length}</strong><span>套餐</span></div></div>
    <p class="sheet-hint data-privacy-note">所有数据只保存在当前设备。餐食照片不会进入 JSON，也不会被导入覆盖。</p>
    <div class="data-action-grid">
      <button class="data-action-card" id="open-data-export" type="button"><span class="data-action-icon" aria-hidden="true">↑</span><span><strong>导出 JSON</strong><small>选择内容，保存文件或复制</small></span><b>›</b></button>
      <button class="data-action-card" id="open-data-import" type="button"><span class="data-action-icon" aria-hidden="true">↓</span><span><strong>导入 JSON</strong><small>选择文件或读取剪贴板</small></span><b>›</b></button>
    </div><button class="danger-action" id="clear-local-data" type="button">清除本机数据</button>`
  document.querySelector('#open-data-export').addEventListener('click', renderDataExportSheet)
  document.querySelector('#open-data-import').addEventListener('click', renderDataImportSourceSheet)
  document.querySelector('#clear-local-data').addEventListener('click', renderClearDataConfirmation)
  openSheet()
}

function renderClearDataConfirmation() {
  sheetKicker.textContent = 'CLEAR LOCAL DATA'
  sheetTitle.textContent = '确认清除数据'
  sheetContent.innerHTML = `<div class="danger-confirmation"><strong>此操作无法撤销</strong>将删除本机内的用户信息、食物库修改、饮食计划、套餐、每日记录、体重记录和本地照片。建议先导出 JSON 备份需要保留的数据。</div><div class="data-transfer-actions"><button class="secondary-action" id="cancel-clear-data" type="button">取消</button><button class="danger-action filled" id="confirm-clear-data" type="button">确认清除</button></div>`
  document.querySelector('#cancel-clear-data').addEventListener('click', openDataSettingsSheet)
  document.querySelector('#confirm-clear-data').addEventListener('click', clearAllLocalData)
}

async function clearAllLocalData() {
  const button = document.querySelector('#confirm-clear-data')
  button.disabled = true
  button.textContent = '正在清除…'
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(`${STORAGE_KEY}-before-catalog`)
    Object.keys(window.localStorage).filter((key) => key.startsWith(`${STORAGE_KEY}-before-`)).forEach((key) => window.localStorage.removeItem(key))
    window.localStorage.removeItem(LOCAL_PHOTO_STORAGE_KEY)
    ;['calm-path-demo-v3', 'calm-path-demo-v4', 'calm-path-demo-v5'].forEach((key) => window.localStorage.removeItem(key))
    if (window.indexedDB) {
      await new Promise((resolve) => {
        const request = window.indexedDB.deleteDatabase(LOCAL_PHOTO_DB_NAME)
        request.onsuccess = resolve
        request.onerror = resolve
        request.onblocked = resolve
      })
    }
    window.location.reload()
  } catch (error) {
    button.disabled = false
    button.textContent = '确认清除'
    showToast('清除失败，请重试')
  }
}

function backupSectionChoices(selectedIds, prefix, availableIds = backupSectionOptions.map((option) => option.id), sourceData = null) {
  return `<div class="backup-section-list">${backupSectionOptions.filter((option) => availableIds.includes(option.id)).map((option) => {
    const count = backupSectionCount(option.id, sourceData?.[option.id] || backupSectionData(option.id))
    return `<label class="backup-section-choice"><input type="checkbox" data-${prefix}-section="${option.id}" ${selectedIds.includes(option.id) ? 'checked' : ''}><span class="backup-check" aria-hidden="true">✓</span><span><strong>${option.name}</strong><small>${option.description}</small></span><em>${count}</em></label>`
  }).join('')}</div>`
}

function selectedBackupSections(prefix) {
  return [...sheetContent.querySelectorAll(`[data-${prefix}-section]:checked`)].map((input) => input.dataset[`${prefix}Section`])
}

function renderDataExportSheet() {
  const selected = backupSectionOptions.map((option) => option.id)
  sheetKicker.textContent = 'EXPORT JSON'
  sheetTitle.textContent = '选择导出内容'
  sheetContent.innerHTML = `<p class="sheet-hint">只导出勾选的数据。页面边距仅包含已保存的调整；照片始终留在原设备。</p>
    ${backupSectionChoices(selected, 'export')}
    <div class="data-transfer-actions"><button class="secondary-action" id="export-json-copy" type="button">复制到剪贴板</button><button class="primary-action" id="export-json-file" type="button">导出为文件</button></div>`
  const performExport = async (destination, button) => {
    const sections = selectedBackupSections('export')
    if (!sections.length) {
      showToast('请至少选择一项导出内容')
      return
    }
    const original = button.textContent
    button.disabled = true
    button.textContent = destination === 'file' ? '正在导出…' : '正在复制…'
    try {
      const text = JSON.stringify(buildBackupDocument(sections), null, 2)
      if (destination === 'file') await saveBackupFile(text)
      else await copyBackupText(text)
      showToast(destination === 'file' ? 'JSON 文件已导出' : 'JSON 已复制到剪贴板')
    } catch (error) {
      showToast(error?.message || '导出失败，请重试')
    } finally {
      button.disabled = false
      button.textContent = original
    }
  }
  document.querySelector('#export-json-copy').addEventListener('click', (event) => performExport('copy', event.currentTarget))
  document.querySelector('#export-json-file').addEventListener('click', (event) => performExport('file', event.currentTarget))
}

function renderDataImportSourceSheet() {
  sheetKicker.textContent = 'IMPORT JSON'
  sheetTitle.textContent = '导入数据'
  sheetContent.innerHTML = `<p class="sheet-hint">选择食由己导出的 JSON。读取后会先展示内容，你可以再选择新增或覆盖。</p>
    <div class="data-action-grid import-source-grid">
      <button class="data-action-card" id="import-json-file" type="button"><span class="data-action-icon" aria-hidden="true">▤</span><span><strong>选择 JSON 文件</strong><small>从本机文件中读取</small></span><b>›</b></button>
      <button class="data-action-card" id="import-json-clipboard" type="button"><span class="data-action-icon" aria-hidden="true">⌘</span><span><strong>粘贴剪贴板 JSON</strong><small>长按粘贴此前复制的内容</small></span><b>›</b></button>
    </div>`
  const loadSource = async (source, button) => {
    const original = button.querySelector('strong').textContent
    button.disabled = true
    button.querySelector('strong').textContent = '正在读取…'
    try {
      const text = await readBackupFromFile()
      renderDataImportPreview(parseBackupDocument(text))
    } catch (error) {
      showToast(error?.message || '无法读取 JSON')
      button.disabled = false
      button.querySelector('strong').textContent = original
    }
  }
  document.querySelector('#import-json-file').addEventListener('click', (event) => loadSource('file', event.currentTarget))
  document.querySelector('#import-json-clipboard').addEventListener('click', renderClipboardJsonEditor)
}

function renderClipboardJsonEditor() {
  sheetKicker.textContent = 'PASTE JSON'
  sheetTitle.textContent = '从剪贴板导入'
  sheetContent.innerHTML = `<p class="sheet-hint">在下方输入框中长按并选择“粘贴”。内容只在本机解析，不会上传。</p>
    <label class="json-paste-field"><span>JSON 内容</span><textarea id="json-paste-input" maxlength="${MAX_BACKUP_TEXT_LENGTH}" placeholder="在这里长按粘贴 JSON"></textarea></label>
    <button class="primary-action" id="read-pasted-json" type="button">读取并预览</button>`
  const input = document.querySelector('#json-paste-input')
  input.focus()
  document.querySelector('#read-pasted-json').addEventListener('click', () => {
    try {
      renderDataImportPreview(parseBackupDocument(input.value))
    } catch (error) {
      showToast(error?.message || '无法解析粘贴的 JSON')
    }
  })
}

function renderDataImportPreview(backupDocument) {
  const selected = [...backupDocument.sections]
  const addWarning = '同名食物、计划和套餐会保留本机版本，只加入新内容。' + (selected.includes('layout') ? '页面边距补入缺少的配置项，本机已有值保留。' : '')
  const overwriteWarning = '覆盖只作用于勾选类别；本机照片始终保留。' + (selected.includes('layout') ? '页面边距替换文件包含的设置，未包含的设置保留。' : '') + '此操作无法自动撤销。'
  sheetKicker.textContent = 'IMPORT PREVIEW'
  sheetTitle.textContent = '确认导入内容'
  sheetContent.innerHTML = `<div class="import-preview-heading"><span><small>来源</small><strong>${escapeHtml(backupDocument.app || '食由己')} JSON</strong></span><em>${backupDocument.exportedAt ? escapeHtml(backupDocument.exportedAt.slice(0, 10)) : '未标注导出日期'}</em></div>
    ${backupSectionChoices(selected, 'import', backupDocument.sections, backupDocument.data)}
    <div class="import-mode-heading"><strong>导入方式</strong><small>适用于本次勾选的全部内容</small></div>
    <div class="import-mode-toggle" role="group" aria-label="导入方式"><button class="active" type="button" data-import-mode="add"><strong>新增</strong><small>保留本机已有内容</small></button><button type="button" data-import-mode="overwrite"><strong>覆盖</strong><small>用 JSON 替换所选内容</small></button></div>
    <p class="import-warning" id="import-mode-warning">${addWarning}</p>
    <button class="primary-action" id="confirm-json-import" type="button">开始导入</button>`
  let mode = 'add'
  sheetContent.querySelectorAll('[data-import-mode]').forEach((button) => button.addEventListener('click', () => {
    mode = button.dataset.importMode
    sheetContent.querySelectorAll('[data-import-mode]').forEach((item) => item.classList.toggle('active', item === button))
    document.querySelector('#import-mode-warning').textContent = mode === 'overwrite'
      ? overwriteWarning : addWarning
  }))
  document.querySelector('#confirm-json-import').addEventListener('click', (event) => {
    const sections = selectedBackupSections('import')
    if (!sections.length) {
      showToast('请至少选择一项导入内容')
      return
    }
    const button = event.currentTarget
    button.disabled = true
    button.textContent = '正在导入…'
    try {
      const results = importBackupSections(backupDocument, sections, mode)
      renderDataImportResult(results, mode)
    } catch (error) {
      button.disabled = false
      button.textContent = '开始导入'
      showToast(error?.message || '导入失败，原有数据未改变')
    }
  })
}

function renderDataImportResult(results, mode) {
  sheetKicker.textContent = 'IMPORT COMPLETE'
  sheetTitle.textContent = '导入完成'
  sheetContent.innerHTML = `<div class="import-complete-mark" aria-hidden="true">✓</div><p class="import-complete-title">已${mode === 'overwrite' ? '覆盖' : '新增'} ${results.length} 类数据</p>
    <div class="import-result-list">${results.map((result) => `<div><span class="result-dot ${result.id}"></span><span><strong>${result.name}</strong><small>${escapeHtml(result.details)}</small></span><b>${result.count}</b></div>`).join('')}</div>
    <p class="sheet-hint">餐食照片仍保存在本机，没有写入或覆盖。</p><button class="primary-action" id="finish-json-import" type="button">完成</button>`
  document.querySelector('#finish-json-import').addEventListener('click', () => {
    closeSheet()
    showToast('数据已导入')
  })
}

function openInfoSheet(title, message) {
  sheetKicker.textContent = 'SETTINGS'
  sheetTitle.textContent = title
  sheetContent.innerHTML = `<p class="sheet-message">${message}</p>`
  openSheet()
}

function showToast(message, undo = null, actionLabel = '撤销') {
  window.clearTimeout(toastTimer)
  toast.textContent = message
  toast.classList.toggle('has-action',Boolean(undo))
  if(undo){const button=document.createElement('button');button.type='button';button.textContent=actionLabel;button.onclick=undo;toast.append(button)}
  toast.classList.add('show')
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), undo?7000:2200)
}

function createOnboardingDraft() {
  const profile = state.onboardingCompleted
    ? { ...state.bodyProfile }
    : { ...state.bodyProfile, gender: '', age: '', height: '', weight: '' }
  return {
    profile,
    methodId: state.methodId,
    trainingDays: [0, 2, 4],
    trainingMeals: state.mealPlans.training.count,
    restMeals: state.mealPlans.rest.count
  }
}

function onboardingActions(label = '继续') {
  return `<div class="onboarding-actions">${onboardingStep ? '<button class="onboarding-back" id="onboarding-back" type="button">上一步</button>' : '<span></span>'}<button class="onboarding-next" id="onboarding-next" type="button">${label}</button></div>`
}

function onboardingTargets(methodId) {
  const savedProfile = state.bodyProfile
  const savedMethodId = state.methodId
  state.bodyProfile = { ...onboardingDraft.profile }
  state.methodId = methodId
  const options = methodDayOptions(methodId)
  const targets = options.map((option) => ({ option, target: targetForDayType(option.id, methodId) }))
  state.bodyProfile = savedProfile
  state.methodId = savedMethodId
  return targets
}

function renderOnboarding() {
  if (!onboardingDraft) onboardingDraft = createOnboardingDraft()
  onboardingProgress.innerHTML = Array.from({ length: 4 }, (_, index) => `<i class="${index <= onboardingStep ? 'active' : ''}"></i>`).join('')
  if (onboardingStep === 0) {
    const profile = onboardingDraft.profile
    onboardingContent.innerHTML = `<div class="onboarding-heading"><small>01 · 基础信息</small><h1>先建立你的计算基准</h1><p>这些数据只用于生成营养目标，之后可以在设置中修改。</p></div>
      <div class="onboarding-form"><label><span>性别</span><select id="onboarding-gender"><option value="" disabled>请选择</option><option value="male">男</option><option value="female">女</option></select></label><label><span>年龄</span><input id="onboarding-age" type="number" min="14" max="100" value="${profile.age}"><em>岁</em></label><label><span>身高</span><input id="onboarding-height" type="number" min="120" max="230" value="${profile.height}"><em>cm</em></label><label><span class="onboarding-weight-heading">当前体重 <select id="onboarding-weight-unit" aria-label="体重单位"><option value="kg" ${state.weightUnit === 'kg' ? 'selected' : ''}>kg</option><option value="jin" ${state.weightUnit === 'jin' ? 'selected' : ''}>斤</option></select></span><input id="onboarding-weight" type="number" aria-label="当前体重" min="${bodyWeightInputBounds(30,300).min}" max="${bodyWeightInputBounds(30,300).max}" step="${state.weightUnit === 'jin' ? '0.1' : '0.01'}" value="${profile.weight === '' ? '' : bodyWeightDisplayValue(profile.weight)}"><em>${bodyWeightUnitLabel()}</em></label><label class="wide"><span>目标</span><select id="onboarding-goal"><option>减脂</option><option>维持</option><option>增肌</option></select></label><label class="wide"><span>活动系数</span><select id="onboarding-activity">${activityFactorOptions.map(option => `<option value="${option.id}">${option.label} ×${option.factor}</option>`).join('')}</select></label><p class="onboarding-activity-detail" id="onboarding-activity-detail"></p></div>${onboardingActions()}`
    document.querySelector('#onboarding-gender').value = profile.gender
    document.querySelector('#onboarding-goal').value = profile.goal
    document.querySelector('#onboarding-activity').value = normalizeActivityLevel(profile.activityLevel)
    const paintOnboardingActivity = () => {
      const option = activityFactorOptions.find(item => item.id === document.querySelector('#onboarding-activity').value) || activityFactorOptions[1]
      document.querySelector('#onboarding-activity-detail').textContent = `${option.detail}；总运动时长 ${option.hours}`
    }
    document.querySelector('#onboarding-activity').addEventListener('change', paintOnboardingActivity)
    paintOnboardingActivity()
    document.querySelector('#onboarding-weight-unit').addEventListener('change', event => {
      const input = document.querySelector('#onboarding-weight')
      const entered = input.value.trim()
      const weightKg = entered ? bodyWeightFromDisplay(entered) : ''
      state.weightUnit = normalizeWeightUnit(event.target.value)
      profile.weight = weightKg
      input.value = weightKg === '' ? '' : bodyWeightDisplayValue(weightKg)
      input.min = bodyWeightInputBounds(30,300).min
      input.max = bodyWeightInputBounds(30,300).max
      input.step = state.weightUnit === 'jin' ? '0.1' : '0.01'
      input.parentElement.querySelector('em').textContent = bodyWeightUnitLabel()
      persistState()
    })
  } else if (onboardingStep === 1) {
    onboardingContent.innerHTML = `<div class="onboarding-heading"><small>02 · 饮食计划</small><h1>选择一个起点</h1><p>模板不会被修改；日后调整会另存为自定义模板。</p></div><div class="onboarding-methods">${methods.map((method) => `<button class="${method.id === onboardingDraft.methodId ? 'active' : ''}" type="button" data-onboarding-method="${method.id}"><span><strong>${method.name}</strong><small>${method.note}</small></span><i>${method.id === onboardingDraft.methodId ? '✓' : ''}</i></button>`).join('')}</div>${onboardingActions()}`
  } else if (onboardingStep === 2) {
    const weekdays = ['一', '二', '三', '四', '五', '六', '日']
    onboardingContent.innerHTML = `<div class="onboarding-heading"><small>03 · 训练节奏</small><h1>设置一周的训练与餐次</h1><p>点亮训练日；未点亮的日期自动作为休息日。</p></div><div class="onboarding-weekdays">${weekdays.map((day, index) => `<button class="${onboardingDraft.trainingDays.includes(index) ? 'active' : ''}" type="button" data-onboarding-weekday="${index}"><small>周</small><strong>${day}</strong><span>${onboardingDraft.trainingDays.includes(index) ? '训' : '休'}</span></button>`).join('')}</div><div class="onboarding-meal-counts"><div><span><small>训练日</small><strong>每日餐数</strong></span><label class="form-field"><input type="number" data-onboarding-count-value="training" aria-label="训练日餐数" min="2" max="6" step="1" data-unit="餐" value="${onboardingDraft.trainingMeals}"></label></div><div><span><small>休息日</small><strong>每日餐数</strong></span><label class="form-field"><input type="number" data-onboarding-count-value="rest" aria-label="休息日餐数" min="2" max="6" step="1" data-unit="餐" value="${onboardingDraft.restMeals}"></label></div></div>${onboardingActions()}`
  } else {
    const targetRows = onboardingTargets(onboardingDraft.methodId)
    onboardingContent.innerHTML = `<div class="onboarding-heading"><small>04 · 确认方案</small><h1>从今天开始</h1><p>${methodById(onboardingDraft.methodId).name} · 训练 ${onboardingDraft.trainingDays.length} 天</p></div><div class="onboarding-targets">${targetRows.map(({ option, target }) => `<article><span>${nutritionDayTypeName(option.id, onboardingDraft.methodId)}</span><strong>${Math.round(target.calories)} kcal</strong><small><b class="carbs">碳 ${Math.round(target.carbs)}g</b><b class="protein">蛋 ${Math.round(target.protein)}g</b><b class="fat">脂 ${Math.round(target.fat)}g</b></small></article>`).join('')}</div><div class="onboarding-confirm-note">完成后进入空白记录页，并用不超过 8 步介绍最常用功能。</div>${onboardingActions('完成配置')}`
  }

  document.querySelector('#onboarding-back')?.addEventListener('click', () => {
    onboardingStep = Math.max(0, onboardingStep - 1)
    renderOnboarding()
  })
  document.querySelectorAll('[data-onboarding-method]').forEach((button) => button.addEventListener('click', () => {
    onboardingDraft.methodId = button.dataset.onboardingMethod
    renderOnboarding()
  }))
  document.querySelectorAll('[data-onboarding-weekday]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.onboardingWeekday)
    onboardingDraft.trainingDays = onboardingDraft.trainingDays.includes(index)
      ? onboardingDraft.trainingDays.filter((day) => day !== index)
      : [...onboardingDraft.trainingDays, index].sort((left, right) => left - right)
    renderOnboarding()
  }))
  document.querySelectorAll('[data-onboarding-count-value]').forEach((input) => input.addEventListener('input', () => {
    const key = input.dataset.onboardingCountValue === 'training' ? 'trainingMeals' : 'restMeals'
    onboardingDraft[key] = Math.max(2, Math.min(6, Math.round(Number(input.value) || 2)))
  }))
  document.querySelector('#onboarding-next').addEventListener('click', advanceOnboarding)
}

function advanceOnboarding() {
  if (onboardingStep === 0) {
    const profile = onboardingDraft.profile
    profile.gender = document.querySelector('#onboarding-gender').value
    profile.age = Number(document.querySelector('#onboarding-age').value)
    profile.height = Number(document.querySelector('#onboarding-height').value)
    profile.weight = bodyWeightFromDisplay(document.querySelector('#onboarding-weight').value)
    profile.goal = document.querySelector('#onboarding-goal').value
    profile.activityLevel = normalizeActivityLevel(document.querySelector('#onboarding-activity').value)
    if (!profile.gender) {
      showToast('请选择性别')
      return
    }
    if (profile.age < 14 || profile.height < 120 || profile.weight < 30 || profile.weight > 300) {
      showToast('请填写有效的年龄、身高和体重')
      return
    }
  }
  if (onboardingStep === 2 && !onboardingDraft.trainingDays.length) {
    showToast('请至少选择一个训练日')
    return
  }
  if (onboardingStep < 3) {
    onboardingStep += 1
    renderOnboarding()
    return
  }
  completeOnboarding()
}

function completeOnboarding() {
  state.bodyProfile = { ...onboardingDraft.profile }
  state.methodId = onboardingDraft.methodId
  state.mealPlans.training.count = onboardingDraft.trainingMeals
  state.mealPlans.rest.count = onboardingDraft.restMeals
  const weekdays = ['一', '二', '三', '四', '五', '六', '日']
  state.dayCyclePlan = weekdays.map((day, index) => {
    const dayType = onboardingDraft.trainingDays.includes(index) ? 'training' : 'rest'
    return { day: String(index + 1), type: dayTypeName(dayType), dayType, enabled: true }
  })
  state.weekPlan = state.dayCyclePlan.map((day, index) => ({ ...day, day: weekdays[index] }))
  state.schedulePlanCustomized.binary = true
  state.cycleStartDate = APP_TODAY_KEY
  state.prepStartCustomized = false
  if (isKingMethod()) state.carbonCyclePlan = defaultCarbonCyclePlan()
  const method = methodById(state.methodId)
  if (method.durationMonths || method.durationDays) state.methodApplications[state.methodId] = { start: APP_TODAY_KEY, end: rangeEndDate(APP_TODAY_KEY, method) }
  state.dailyRecords = {}
  state.weightRecords = []
  upsertWeightRecord(state.bodyProfile.weight, APP_TODAY.getTime(), 'onboarding')
  state.dayOffset = 0
  state.selectedCalendarDate = APP_TODAY_KEY
  state.calendarMonthOffset = 0
  state.onboardingCompleted = true
  state.tourCompleted = false
  onboarding.hidden = true
  loadSelectedDate()
  renderFoodLibrary()
  renderPrep()
  renderTrends()
  persistState()
  startFeatureTour()
}

const tourSteps = [
  { page: 'today', selector: '.summary-card', title: '营养目标与日期', copy: '点击上方日期跳转到某天，左右箭头逐日切换；右侧圆环和碳蛋脂进度显示当天摄入。' },
  { page: 'today', selector: '.summary-day-toggle', title: '临时切换日期类型', copy: '只改变当天：普通计划切换训练/休息，碳循环计划切换低/中/高碳。' },
  { page: 'today', selector: '.meal-row:first-child', title: '餐次与食物', copy: '点餐次名称修改当日名称、时间与练前练后标记；点＋选食物并确认分量，点内容编辑克重。底部＋可新增当日餐次。' },
  { page: 'today', selector: '.meal-row:first-child', title: '滑动与打卡', copy: '左滑套用或保存套餐，右滑清空本餐并可撤销；长按序号移动餐食内容，预定餐食点击打卡。' },
  { page: 'today', selector: '#daily-share-open', title: '分享每日记录', copy: '将已记录的餐食和营养汇总生成分享图，可以保存图片或使用系统分享。' },
  { page: 'foods', selector: '#food-search', title: '搜索与管理食材', copy: '支持中文和拼音搜索，数量显示在搜索栏内；使用分类筛选。点食物可查看历史采购与均价。创建菜肴可导入文字、添加辅料，食材左滑可复制。' },
  { page: 'prep', selector: '#week-plan-card', title: '安排备餐周期', copy: '展开周期查看每天类型与套餐，并按实际训练节奏调整。' },
  { page: 'prep', selector: '#complete-shopping', title: '生成预定饮食', copy: '食材备齐后生成本周期预定餐食，到当天点击遮罩即可打卡。' },
  { page: 'insights', selector: '.trend-view-switch', title: '查看月趋势', copy: '热量用柱图、碳蛋脂用分组柱图显示，点击柱子可查看详情；近半年按月显示有记录日的日均值。设置→基础设置可调整趋势卡片顺序和显示；体重可手动记录。' },
  { page: 'profile', selector: '#method-button', title: '编辑方法与精确目标', copy: '点击饮食方法，动态与40天方案旁可直接“编辑倍数”；滚轮数字可点击输入，命名时返回保留上一步。' },
  { page: 'profile', selector: '#review-settings-summary', title: '复盘怎样决定调整？', copy: '设置每周下降目标，复盘时用两次体重计算周变化。达标保持、停滞可减碳、下降过快可加碳；只有确认后才从该日期起生效。' }
]

function positionTour() {
  if (featureTour.hidden) return
  const step = tourSteps[tourStep]
  const target = document.querySelector(step.selector)
  if (!target) return
  const rect = target.getBoundingClientRect()
  const padding = 7
  tourSpotlight.style.left = `${Math.max(5, rect.left - padding)}px`
  tourSpotlight.style.top = `${Math.max(5, rect.top - padding)}px`
  tourSpotlight.style.width = `${Math.min(window.innerWidth - 10, rect.width + padding * 2)}px`
  tourSpotlight.style.height = `${rect.height + padding * 2}px`
  tourCard.classList.toggle('place-top', rect.top > window.innerHeight * .52)
}

function renderTourStep() {
  const step = tourSteps[tourStep]
  switchPage(step.page, { pushHistory: false })
  document.querySelector('#tour-step-label').textContent = `${tourStep + 1} / ${tourSteps.length}`
  document.querySelector('#tour-title').textContent = step.title
  document.querySelector('#tour-copy').textContent = step.copy
  document.querySelector('#tour-next').textContent = tourStep === tourSteps.length - 1 ? '完成' : '下一步'
  const target = document.querySelector(step.selector)
  const group = target?.closest('[data-settings-section]')
  if (group?.querySelector('[data-settings-collapse]')?.getAttribute('aria-expanded') === 'false') group.querySelector('[data-settings-collapse]').click()
  target?.scrollIntoView({block:'center',behavior:'instant'})
  requestAnimationFrame(() => requestAnimationFrame(positionTour))
}

function startFeatureTour() {
  tourStep = 0
  featureTour.hidden = false
  renderTourStep()
}

function finishFeatureTour() {
  featureTour.hidden = true
  state.tourCompleted = true
  persistState()
  switchPage('today', { pushHistory: false })
}

function startFirstUseExperience() {
  if (!state.onboardingCompleted) {
    onboardingStep = 0
    onboardingDraft = createOnboardingDraft()
    onboarding.hidden = false
    renderOnboarding()
  } else if (!state.tourCompleted) startFeatureTour()
}

function selectedDate() {
  return new Date(APP_TODAY.getFullYear(), APP_TODAY.getMonth(), APP_TODAY.getDate() + state.dayOffset)
}

function activeSchedulePlan() {
  return isKingMethod() ? ensureCarbonCyclePlan() : state.dayCyclePlan
}

function weekPlanIndexForDate(date) {
  return date.getDay() === 0 ? 6 : date.getDay() - 1
}

function cyclePlanIndexForDate(date) {
  const start = parseLocalDate(state.cycleStartDate)
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const difference = Math.round((target.setHours(12, 0, 0, 0) - start.setHours(12, 0, 0, 0)) / 86400000)
  const cycleLength = Math.max(1, activeSchedulePlan().length)
  return ((difference % cycleLength) + cycleLength) % cycleLength
}

function schedulePlanIndexForDate(date) {
  return cyclePlanIndexForDate(date)
}

function plannedDayTypeForDate(date) {
  const plan = activeSchedulePlan()[schedulePlanIndexForDate(date)]
  return normalizeDayType(plan?.dayType)
}

function plannedNutritionDayTypeForDate(date) {
  const plan = activeSchedulePlan()[schedulePlanIndexForDate(date)]
  return scheduleDayValue(plan)
}

function syncWeekPlanToDailyRecords() {
  Object.entries(state.dailyRecords).forEach(([key, record]) => {
    const hasActualRecord = [...(record.meals || []), ...(record.hiddenMeals || [])]
      .some((meal) => meal.items?.length > 0 && !meal.isPlanned)
    if (hasActualRecord) return
    const [year, month, day] = key.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    record.day = plannedDayTypeForDate(date)
    if (isKingMethod()) record.carbonLevel = plannedNutritionDayTypeForDate(date)
  })
}

function dateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function ensureDailyRecordForDate(dateValue) {
  const safeDateValue = /^\d{4}-\d{2}-\d{2}$/.test(dateValue || '') ? dateValue : APP_TODAY_KEY
  const date = parseLocalDate(safeDateValue)
  const key = dateKey(date)
  if (!state.dailyRecords[key]) {
    const dayType = plannedDayTypeForDate(date)
    state.dailyRecords[key] = {
      day: dayType,
      carbonLevel: isKingMethod() ? plannedNutritionDayTypeForDate(date) : undefined,
      meals: buildMeals([], dayType, state.mealPlans)
    }
  }
  if (isKingMethod() && !state.dailyRecords[key].carbonLevel) state.dailyRecords[key].carbonLevel = plannedNutritionDayTypeForDate(date)
  normalizeDailyRecord(state.dailyRecords[key])
  return state.dailyRecords[key]
}

function ensureSelectedDateRecord() {
  return ensureDailyRecordForDate(dateKey(selectedDate()))
}

function addFoodToDailyRecord(dateValue, mealIndex, foodId, amount, weightEntry = null) {
  const record = ensureDailyRecordForDate(dateValue)
  const targetIndex = Math.max(0, Math.min(Number(mealIndex) || 0, record.meals.length - 1))
  const meal = record.meals[targetIndex]
  addAmountToItems(meal.items, foodId, amount, weightEntry)
  delete meal.isPlanned
  stampMealCostBasis(meal,dateValue)
  record.plannedMeals = (record.plannedMeals || []).filter((planned) => planned.id !== meal.id)
  rememberRecent(meal.id, foodId, amount)
  return { record, meal, targetIndex }
}

function currentNutritionDayType() {
  const record = ensureSelectedDateRecord()
  return isKingMethod() ? normalizeCarbonLevel(record.carbonLevel, record.day) : normalizeDayType(record.day)
}

function syncDaySetting() {
  const current = currentNutritionDayType()
  const summaryToggle = document.querySelector('.summary-day-toggle')
  const options = methodDayOptions()
  const fromDay = summaryDayTransition?.from || current
  const fromIndex = Math.max(0, options.findIndex((option) => option.id === fromDay))
  const toIndex = Math.max(0, options.findIndex((option) => option.id === current))
  const geometry = slimeChoiceGeometry(options.length, fromIndex, toIndex, 0, 2)
  summaryToggle.classList.toggle('three-options', options.length === 3)
  summaryToggle.classList.add('slime-toggle')
  summaryToggle.dataset.selectedDay = current
  summaryToggle.setAttribute('style', slimeChoiceStyle(geometry))
  summaryToggle.setAttribute('aria-label', isKingMethod() ? '临时切换低中高碳日' : '临时切换训练休息日')
  summaryToggle.innerHTML = `<i class="choice-slime day-choice-slime ${slimeMotionClass(fromIndex, toIndex)}" aria-hidden="true"></i>${options.map((option) => `<button class="${option.id === current ? 'active' : ''}" type="button" data-summary-day="${option.id}" aria-label="${option.name}" aria-pressed="${option.id === current}">${option.id === 'training' ? '训' : option.id === 'rest' ? '休' : option.id === 'high' ? '高' : option.id === 'medium' ? '中' : '低'}</button>`).join('')}`
  summaryToggle.querySelectorAll('[data-summary-day]').forEach((button) => button.addEventListener('click', () => {
    if (button.dataset.summaryDay === current) return
    summaryDayTransition = { from: current, to: button.dataset.summaryDay }
    setSelectedDateDayType(button.dataset.summaryDay)
  }))
  summaryDayTransition = null
  updateProgramDayDisplay()
  document.querySelectorAll('[data-setting-day]').forEach((button) => {
    const active = button.dataset.settingDay === current
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

function setSelectedDateDayType(dayType) {
  const nextNutritionDay = nutritionDayType(dayType)
  const record = ensureSelectedDateRecord()
  const nextDay = normalizeDayType(nextNutritionDay)
  if (nextDay === state.day && (!isKingMethod() || nextNutritionDay === record.carbonLevel)) return
  state.day = nextDay
  record.day = nextDay
  if (isKingMethod()) record.carbonLevel = nextNutritionDay
  normalizeDailyRecord(record)
  state.meals = record.meals
  state.selectedMeal = Math.min(state.selectedMeal, Math.max(0, state.meals.length - 1))
  state.selectedPhotoMeal = Math.min(state.selectedPhotoMeal, Math.max(0, state.meals.length - 1))
  renderMeals()
  syncDaySetting()
  updateSummary()
  updateSettingsSummaries()
  persistState()
  showToast(`当日已临时切换为${nutritionDayTypeName(nextNutritionDay)} · ${state.meals.length}餐`)
}

function loadSelectedDate() {
  const record = ensureSelectedDateRecord()
  state.day = record.day
  state.meals = record.meals
  state.selectedMeal = Math.min(state.selectedMeal, Math.max(0, state.meals.length - 1))
  state.selectedPhotoMeal = Math.min(state.selectedPhotoMeal, Math.max(0, state.meals.length - 1))
  renderDate()
  renderMeals()
  updateSummary()
  updateSettingsSummaries()
  syncDaySetting()
  mealList.classList.remove('date-refresh')
  void mealList.offsetWidth
  mealList.classList.add('date-refresh')
}

function attachTodayDateSwipe() {
  const todayPage = document.querySelector('[data-page="today"]')
  if (!todayPage || todayPage.dataset.dateSwipeBound === 'true') return
  todayPage.dataset.dateSwipeBound = 'true'
  let startPoint = null
  let horizontal = false
  const reset = () => {
    startPoint = null
    horizontal = false
  }
  todayPage.addEventListener('click', (event) => {
    if (todayPage.dataset.suppressSwipeClick !== 'true') return
    event.preventDefault()
    event.stopPropagation()
    todayPage.dataset.suppressSwipeClick = 'false'
  }, true)
  todayPage.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (event.target.closest('.meal-row,button,input,select,textarea,a,[data-wheel-scroll],.horizontal-number-scroll')) return
    startPoint = { x: event.clientX, y: event.clientY }
    horizontal = false
    todayPage.setPointerCapture(event.pointerId)
  })
  todayPage.addEventListener('pointermove', (event) => {
    if (!startPoint) return
    const distanceX = event.clientX - startPoint.x
    const distanceY = event.clientY - startPoint.y
    if (!horizontal && Math.abs(distanceX) > 8 && Math.abs(distanceX) > Math.abs(distanceY)) horizontal = true
    if (horizontal) event.preventDefault()
  })
  todayPage.addEventListener('pointerup', (event) => {
    if (!startPoint) return
    const distanceX = event.clientX - startPoint.x
    const distanceY = event.clientY - startPoint.y
    if (horizontal && Math.abs(distanceX) >= 48 && Math.abs(distanceX) > Math.abs(distanceY) * 1.2) {
      todayPage.dataset.suppressSwipeClick = 'true'
      window.setTimeout(() => { todayPage.dataset.suppressSwipeClick = 'false' }, 120)
      changeDate(distanceX < 0 ? 1 : -1)
    }
    reset()
  })
  todayPage.addEventListener('pointercancel', reset)
}

function changeDate(offset) {
  state.dayOffset += offset
  if (sheet.getAttribute('aria-hidden') === 'false') closeSheet()
  loadSelectedDate()
}

function renderDate() {
  const date = selectedDate()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const month = date.getMonth() + 1
  const day = date.getDate()
  document.querySelector('#current-weekday').textContent = `${weekdays[date.getDay()]} ${month}月${day}日`
  document.querySelector('#date-button').setAttribute('aria-label', `${weekdays[date.getDay()]} ${month}月${day}日，选择日期`)
  const summaryLabel = state.dayOffset === 0 ? '今日' : state.dayOffset === -1 ? '昨日' : state.dayOffset === 1 ? '明日' : '当日'
  document.querySelector('#meal-title').textContent = `${summaryLabel}餐次`
}

document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => switchPage(button.dataset.nav)))

document.addEventListener('pointerdown', (event) => {
  const row = event.target.closest?.('.library-food-row') || null
  closeOpenFoodSwipeRows(row)
})

document.querySelectorAll('[data-category]').forEach((button) => {
  button.addEventListener('click', () => {
    const category = button.dataset.category
    if (state.categoryFilters.includes(category)) state.categoryFilters = state.categoryFilters.filter((item) => item !== category)
    else state.categoryFilters = [...state.categoryFilters, category]
    button.classList.toggle('active', state.categoryFilters.includes(category))
    button.setAttribute('aria-pressed', String(state.categoryFilters.includes(category)))
    renderFoodLibrary()
  })
})

document.querySelectorAll('[data-setting-day]').forEach((button) => {
  button.addEventListener('click', () => setSelectedDateDayType(button.dataset.settingDay))
})

document.querySelector('#trend-period-select').addEventListener('change', event => {
  state.trendPeriod = event.target.value
  renderTrendStatistics()
})

document.querySelectorAll('[data-trend-view]').forEach((button) => {
  button.addEventListener('click', () => {
    state.trendView = button.dataset.trendView
    renderTrends()
    document.querySelector("[data-page='insights']").scrollTop = 0
  })
})

document.querySelectorAll('[data-calendar-shift]').forEach((button) => {
  button.addEventListener('click', () => {
    state.calendarMonthOffset += Number(button.dataset.calendarShift)
    renderNutritionCalendar()
  })
})

foodSearch.addEventListener('input', () => {window.clearTimeout(librarySearchTimer);librarySearchTimer=window.setTimeout(renderFoodLibrary,120)})
document.querySelector('#create-library-food').addEventListener('click', () => openFoodEditorSheet(null, document.querySelector('#food-search').value.trim()))
document.querySelector('#create-library-dish').addEventListener('click', () => openDishEditorPage(null, document.querySelector('#food-search').value.trim()))
document.querySelectorAll('[data-library-view]').forEach(button=>button.addEventListener('click',()=>{state.foodLibraryView=button.dataset.libraryView;state.categoryFilters=[];foodSearch.value='';document.querySelectorAll('[data-category]').forEach(chip=>{chip.classList.remove('active');chip.setAttribute('aria-pressed','false')});renderFoodLibrary()}))
document.querySelector('#food-search-clear').addEventListener('click', () => {
  foodSearch.value = ''
  renderFoodLibrary()
  foodSearch.focus()
})
document.querySelector('#manual-weight-button').addEventListener('click', openWeightRecordSheet)
document.querySelector('#review-settings-button')?.addEventListener('click', openReviewSettings)
document.querySelector('#quick-add-button').addEventListener('click', () => openFoodSheet(2))
document.querySelector('#trend-weight-button').addEventListener('click', openWeightRecordSheet)
document.querySelector('#summary-target-button').addEventListener('click', () => openMethodTargetSheet(state.day))
document.querySelectorAll('[data-settings-collapse]').forEach((button) => button.addEventListener('click', () => {
  const section = button.dataset.settingsCollapse
  const body = document.querySelector(`[data-settings-body="${section}"]`)
  const expanded = button.getAttribute('aria-expanded') === 'true'
  button.setAttribute('aria-expanded', String(!expanded))
  button.setAttribute('aria-label', `${expanded ? '展开' : '收起'}${{method: '饮食方法', schedule: '周期安排', basic: '基础设置'}[section]}`)
  body.hidden = expanded
}))
document.querySelector('#method-button').addEventListener('click', openMethodSheet)
document.querySelector('#weekly-plan-button').addEventListener('click', openWeeklyPlanSheet)
document.querySelector('#body-settings-button').addEventListener('click', openBodySettingsSheet)
function openOptionalSettingsPage() {
  optionalSettingsPage.hidden = false
  optionalSettingsPage.inert = false
  document.querySelector('.page-stack').inert = true
  document.querySelector('.bottom-nav').inert = true
  optionalSettingsPage.querySelector('.optional-settings-content').scrollTop = 0
}
function closeOptionalSettingsPage() {
  optionalSettingsPage.hidden = true
  optionalSettingsPage.inert = false
  if (sheet.getAttribute('aria-hidden') !== 'false') {
    document.querySelector('.page-stack').inert = !mealSetPage.hidden
    document.querySelector('.bottom-nav').inert = !mealSetPage.hidden
  }
}
document.querySelector('#optional-settings-open').addEventListener('click', openOptionalSettingsPage)
document.querySelector('#optional-settings-back').addEventListener('click', closeOptionalSettingsPage)
document.querySelector('#weight-unit-select').addEventListener('change', event => {
  state.weightUnit = normalizeWeightUnit(event.target.value)
  updateSettingsSummaries()
  updateHealthAccountSummary()
  renderTrends()
  persistState()
  showToast(`体重单位已设为${bodyWeightUnitLabel()}`)
})
document.querySelector('#meal-settings-button').addEventListener('click', openMealSettingsSheet)
document.querySelector('#default-sets-button').addEventListener('click', openDefaultSetsSheet)
document.querySelector('#theme-settings-button').addEventListener('click', openThemeSettingsSheet)
document.querySelector('#tutorial-button').addEventListener('click', startFeatureTour)
document.querySelector('#data-settings-button').addEventListener('click', openDataSettingsSheet)
document.querySelector('#manage-sets').addEventListener('click', openDefaultSetsSheet)
document.querySelector('#week-plan-toggle').addEventListener('click', () => {
  state.prepWeekExpanded = !state.prepWeekExpanded
  renderPrep()
})
document.querySelector('#meal-set-page-back').addEventListener('click', () => {
  if (mealSetEditorState?.kind === 'schedule') {
    closeMealSetPage()
    switchPage('prep')
  } else if (mealSetEditorState) {
    mealSetEditorState = null
    renderMealSetPageList()
    mealSetPageContent.scrollTop = 0
  } else closeMealSetPage()
})
addMealSetButton.addEventListener('click', () => { mealSetGroupsEditing = !mealSetGroupsEditing; renderMealSetPageList() })
document.querySelector('#close-sheet').addEventListener('click', closeSheet)
document.querySelector('#previous-day').addEventListener('click', () => changeDate(-1))
document.querySelector('#next-day').addEventListener('click', () => changeDate(1))
document.querySelector('#date-button').addEventListener('click', openRecordDateCalendar)
cameraInput.addEventListener('change', () => saveMealPhoto(cameraInput.files[0]))
galleryInput.addEventListener('change', () => saveMealPhoto(galleryInput.files[0]))
document.querySelector('#complete-shopping').addEventListener('click', () => {
  requestPreparedPlanApplication()
})
backdrop.addEventListener('click', closeSheet)
document.querySelector('#tour-skip').addEventListener('click', finishFeatureTour)
document.querySelector('#tour-next').addEventListener('click', () => {
  if (tourStep >= tourSteps.length - 1) finishFeatureTour()
  else {
    tourStep += 1
    renderTourStep()
  }
})
window.addEventListener('resize', positionTour)
document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return
  handleNativeBack()
})

restorePersistentState()
syncWeekPlanToDailyRecords()
updateSettingsSummaries()
renderFoodLibrary()
renderPrep()
loadSelectedDate()
attachTodayDateSwipe()
restoreLocalMealPhotos().catch((error) => showToast(error.message))
startFirstUseExperience()
initializeEditorInteractions()
// No startup/foreground health reads; manual weight records remain local.
