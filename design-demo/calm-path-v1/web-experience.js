// Presentation preferences are separate from food records and nutrition snapshots.
const foodIconsPreferenceKey = 'shiyouji-hide-food-icons-v1'
function foodIconsHidden() {
  return document.body.classList.contains('hide-food-icons')
}
try { document.body.classList.toggle('hide-food-icons', localStorage.getItem(foodIconsPreferenceKey) === 'true') } catch {}

function trendChartBuckets(data) {
  if (state.trendPeriod !== 'halfyear') return data.map(entry => ({...entry, count: entry.calories > 0 ? 1 : 0, label: `${entry.month + 1}月${entry.day}日`, tick: `${entry.day}日`}))
  const buckets = new Map()
  data.forEach(entry => {
    const id = `${entry.year}-${entry.month}`
    if (!buckets.has(id)) buckets.set(id, {year:entry.year, month:entry.month, day:1, count:0, calories:0, carbs:0, protein:0, fat:0, label:`${entry.year}年${entry.month + 1}月`, tick:`${entry.month + 1}月`})
    if (entry.calories <= 0) return
    const bucket = buckets.get(id); bucket.count++
    for (const key of ['calories','carbs','protein','fat']) bucket[key] += entry[key]
  })
  return [...buckets.values()].map(bucket => {
    for (const key of ['calories','carbs','protein','fat']) bucket[key] = bucket.count ? Math.round(bucket[key] / bucket.count * 10) / 10 : 0
    return bucket
  })
}

function renderInteractiveTrendChart(kind, dailyData) {
  const chart = document.querySelector(`#${kind}-chart`), detail = document.querySelector(`#${kind}-tooltip`)
  chart.trendResizeObserver?.disconnect()
  const monthly = state.trendPeriod === 'halfyear', data = trendChartBuckets(dailyData)
  const keys = kind === 'macro' ? ['carbs','protein','fat'] : ['calories']
  const labels = {calories:'热量',carbs:'碳水',protein:'蛋白质',fat:'脂肪'}
  const units = kind === 'macro' ? 'g' : 'kcal'
  const peak = Math.max(0, ...data.flatMap(entry => keys.map(key => entry[key]))) || (kind === 'macro' ? 200 : 2000)
  const magnitude = 10 ** Math.floor(Math.log10(peak / 4))
  const step = [1,2,2.5,5,10].map(n => n * magnitude).find(n => n >= peak / 4) || magnitude * 10
  const ceiling = step * 4, left = 42, top = 14, bottom = 170, plotWidth = 270
  // Daily month bars stay slender when a large phone now uses its full width.
  const stride = plotWidth / data.length, barWidth = Math.min(kind === 'macro' ? 12 : 27, stride * (kind === 'macro' ? .23 : data.length > 10 ? .48 : .65))
  const y = value => bottom - value / ceiling * (bottom - top)
  const x = index => left + stride * (index + .5)
  const format = value => Number(value.toFixed(1)).toLocaleString('zh-CN')
  const grid = Array.from({length:5}, (_,i) => `<g class="trend-grid"><path d="M${left} ${y(i*step)}H312"/><text x="35" y="${y(i*step)+3}">${format(i*step)}</text></g>`).join('')
  const series = data.map((entry,i) => `<g class="trend-column" data-column="${i}">${keys.map((key,k) => {
    const bx=x(i)+(k-keys.length/2)*barWidth, by=y(entry[key]), width=Math.max(.8,barWidth-(data.length>10?.4:1.5))
    const radius=Math.min(4,width/2,Math.max(0,bottom-by))
    // Only the two top corners curve; the baseline stays square, even for tiny bars.
    return `<path class="trend-bar ${key}" d="M${bx} ${bottom}V${by+radius}Q${bx} ${by} ${bx+radius} ${by}H${bx+width-radius}Q${bx+width} ${by} ${bx+width} ${by+radius}V${bottom}Z"/>`
  }).join('')}<rect class="trend-hit" x="${left+stride*i}" y="${top}" width="${stride}" height="${bottom-top}" role="button" tabindex="${i===0?'0':'-1'}" aria-label="${escapeHtml(entry.label)}${monthly?'日均':''}，${entry.count ? keys.map(key=>`${labels[key]} ${format(entry[key])}${units}`).join('，') : '暂无记录'}" aria-pressed="false"/></g>`).join('')
  const spacing = Math.ceil(data.length / 6)
  const ticks = data.map((entry,i) => i % spacing === 0 || i === data.length - 1 ? `<text class="trend-x-label" x="${x(i)}" y="190">${entry.tick}</text>` : '').join('')
  chart.classList.add('monthly-chart','reference-chart'); chart.classList.remove('dense'); chart.removeAttribute('role')
  chart.setAttribute('aria-label', kind === 'macro' ? '碳水、蛋白质和脂肪分组柱图，共用克数刻度' : '热量柱状图')
  chart.innerHTML = `${data.some(entry=>entry.count)?'':'<p class="trend-chart-note">此期间暂无饮食记录</p>'}${monthly?'<div class="trend-unit">每月有记录日的日均值</div>':''}<svg viewBox="0 0 320 202" class="reference-plot" aria-label="${chart.getAttribute('aria-label')}">${grid}${series}${ticks}</svg>`
  detail.hidden = true; detail.textContent = ''; detail.classList.add('trend-bar-detail'); detail.setAttribute('aria-live','polite')
  chart.classList.remove('has-selection')
  const columns = [...chart.querySelectorAll('.trend-column')]
  const card = chart.closest('.chart-card')
  let selectedIndex = -1
  function positionDetail() {
    if(detail.hidden || selectedIndex < 0 || !card.clientWidth) return
    const bounds=card.getBoundingClientRect(), hit=columns[selectedIndex].querySelector('.trend-hit').getBoundingClientRect()
    const barTop=Math.min(...[...columns[selectedIndex].querySelectorAll('.trend-bar')].map(bar=>bar.getBoundingClientRect().top))
    const anchor=hit.left+hit.width/2-bounds.left-card.clientLeft, pad=12
    const left=Math.max(pad,Math.min(anchor-detail.offsetWidth/2,card.clientWidth-detail.offsetWidth-pad))
    const top=Math.max(pad,Math.min(barTop-bounds.top-card.clientTop-detail.offsetHeight-8,card.clientHeight-detail.offsetHeight-pad))
    detail.style.left=`${left}px`; detail.style.top=`${top}px`
    detail.style.setProperty('--tooltip-anchor',`${Math.max(12,Math.min(anchor-left,detail.offsetWidth-12))}px`)
  }
  function clearSelection() {
    selectedIndex=-1; detail.hidden=true; chart.classList.remove('has-selection')
    columns.forEach(column=>{column.classList.remove('selected');column.querySelector('.trend-hit').setAttribute('aria-pressed','false')})
  }
  function select(index, focus = false) {
    const entry = data[index]
    selectedIndex=index; chart.classList.add('has-selection')
    columns.forEach((column,i) => { column.classList.toggle('selected',i===index); const hit=column.querySelector('.trend-hit'); hit.setAttribute('aria-pressed',String(i===index)); hit.setAttribute('tabindex',i===index?'0':'-1') })
    if (focus) columns[index].querySelector('.trend-hit').focus({preventScroll:true})
    detail.innerHTML = `<strong>${entry.label}${monthly?' · 日均':''}</strong><div class="trend-tooltip-values">${entry.count ? keys.map(key=>`<span class="${key}">${labels[key]} <b>${format(entry[key])}</b> ${units}</span>`).join('') : '<span>暂无饮食记录</span>'}</div>${monthly?`<small>按 ${entry.count} 个有记录日计算</small>`:''}`
    detail.hidden=false; positionDetail()
  }
  columns.forEach((column,i) => {
    column.addEventListener('click',()=>select(i))
    column.addEventListener('keydown',event=>{
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();clearSelection();return}
      let index = i
      if(event.key==='ArrowRight') index=Math.min(data.length-1,i+1)
      else if(event.key==='ArrowLeft') index=Math.max(0,i-1)
      else if(event.key==='Home') index=0
      else if(event.key==='End') index=data.length-1
      else if(!['Enter',' '].includes(event.key)) return
      event.preventDefault(); select(index,true)
    })
  })
  // Reposition on viewport/font/spacing changes, without accumulating observers on rerender.
  chart.trendResizeObserver=new ResizeObserver(positionDetail)
  chart.trendResizeObserver.observe(card); chart.trendResizeObserver.observe(detail)
  const period = document.querySelector('#trend-period-select'); if(period)period.value=state.trendPeriod
}

function renderConsumptionTrend(dailyData) {
  const chart=document.querySelector('#consumption-chart'),detail=document.querySelector('#consumption-tooltip'),card=chart?.closest('.consumption-card')
  if(!chart||!card)return
  card.hidden=!shoppingLedgerEnabled()
  if(card.hidden)return
  const monthly=state.trendPeriod==='halfyear', buckets=new Map()
  const categories=[['carbs','碳水','var(--carbs)'],['protein','蛋白质','var(--protein)'],['fat','脂肪','var(--fat)'],['other','未归类','var(--muted)']]
  for(const entry of dailyData){
    const id=monthly?`${entry.year}-${entry.month}`:`${entry.year}-${entry.month}-${entry.day}`
    if(!buckets.has(id))buckets.set(id,{id,label:monthly?`${entry.year}年${entry.month+1}月`:`${entry.month+1}月${entry.day}日`,tick:monthly?`${entry.month+1}月`:`${entry.day}日`,macros:{carbs:0,protein:0,fat:0,other:0},missing:0})
    const bucket=buckets.get(id)
    for(const [key] of categories)bucket.macros[key]+=Number(entry.cost?.macros?.[key]||0)
    bucket.missing+=entry.cost.missing
  }
  const data=[...buckets.values()],total=bucket=>categories.reduce((sum,[key])=>sum+bucket.macros[key],0)
  const peak=Math.max(1,...data.map(total)),ceiling=peak*1.12,plotTop=14,plotBottom=170,left=38,width=274,stride=width/Math.max(1,data.length),barWidth=Math.min(25,stride*(data.length>10?.56:.68))
  document.querySelector('#consumption-chart-unit').textContent=monthly?'单位：元 · 每月合计':'单位：元'
  const visibleCategories=categories.filter(([key])=>key!=='other'||data.some(bucket=>bucket.macros.other>0))
  document.querySelector('#consumption-legend').innerHTML=visibleCategories.map(([,name,color])=>`<span><i style="background:${color}"></i>${name}</span>`).join('')
  const lines=[0,.25,.5,.75,1].map(frac=>{const y=plotBottom-frac*(plotBottom-plotTop);return `<g class="trend-grid"><path d="M${left} ${y}H312"/><text x="34" y="${y+3}">${Number((peak*frac/100).toFixed(peak<1000?1:0))}</text></g>`}).join('')
  const columns=data.map((bucket,index)=>{
    const x=left+stride*(index+.5)-barWidth/2,all=visibleCategories.filter(([key])=>bucket.macros[key]>0),height=plotBottom-plotTop
    let accumulated=0
    const segments=all.map(([key,,color],segmentIndex)=>{
      const cents=bucket.macros[key]
      const h=Math.max(.8,cents/ceiling*height),y=plotBottom-accumulated-h;accumulated+=h
      const radius=segmentIndex===all.length-1?Math.min(4,barWidth/2,h):0
      return `<path d="M${x} ${y+h}V${y+radius}Q${x} ${y} ${x+radius} ${y}H${x+barWidth-radius}Q${x+barWidth} ${y} ${x+barWidth} ${y+radius}V${y+h}Z" style="fill:${color}"/>`
    }).join('')
    const tick=index%Math.max(1,Math.ceil(data.length/6))===0||index===data.length-1?`<text class="trend-x-label" x="${x+barWidth/2}" y="190">${bucket.tick}</text>`:''
    const breakdown=visibleCategories.map(([key,name])=>`${name}${(bucket.macros[key]/100).toFixed(1)}元`).join('，')
    return `<g class="consumption-column" data-cost-index="${index}">${segments}<rect class="trend-hit" x="${left+stride*index}" y="${plotTop}" width="${stride}" height="${plotBottom-plotTop}" role="button" tabindex="${index===0?0:-1}" aria-label="${bucket.label} 饮食花费 ${(total(bucket)/100).toFixed(1)}元，${breakdown}${bucket.missing?`，${bucket.missing}项待补价`:''}"/>${tick}</g>`
  }).join('')
  chart.innerHTML=`${data.some(bucket=>total(bucket)>0)?'':'<p class="trend-chart-note">此期间暂无已计价的饮食记录</p>'}<svg viewBox="0 0 320 202" class="reference-plot" aria-label="按碳水蛋白质脂肪堆叠的饮食花费">${lines}${columns}</svg>`
  detail.hidden=true;detail.classList.add('trend-bar-detail');detail.setAttribute('aria-live','polite')
  const select=index=>{
    const bucket=data[index],hit=chart.querySelector(`[data-cost-index="${index}"] .trend-hit`)
    chart.querySelectorAll('.consumption-column').forEach((col,i)=>col.classList.toggle('selected',i===index))
    detail.innerHTML=`<strong>${bucket.label} · ￥${(total(bucket)/100).toFixed(1)}</strong><div class="trend-tooltip-values">${visibleCategories.map(([key,name,color])=>`<span><i style="background:${color}"></i>${name} ￥${(bucket.macros[key]/100).toFixed(1)}</span>`).join('')}</div>${bucket.missing?`<small>${bucket.missing}项待补价</small>`:''}`
    detail.hidden=false
    const bounds=card.getBoundingClientRect(),anchor=hit.getBoundingClientRect(),pad=12
    detail.style.left=`${Math.max(pad,Math.min(anchor.left+anchor.width/2-bounds.left-detail.offsetWidth/2,card.clientWidth-detail.offsetWidth-pad))}px`
    detail.style.top=`${Math.max(pad,Math.min(anchor.top-bounds.top-detail.offsetHeight-8,card.clientHeight-detail.offsetHeight-pad))}px`
    detail.style.setProperty('--tooltip-anchor',`${Math.max(12,Math.min(anchor.left+anchor.width/2-bounds.left-parseFloat(detail.style.left),detail.offsetWidth-12))}px`)
  }
  chart.querySelectorAll('[data-cost-index]').forEach(col=>{
    const index=Number(col.dataset.costIndex),hit=col.querySelector('.trend-hit')
    col.onclick=()=>select(index)
    hit.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();select(index)}else if(event.key==='Escape'){detail.hidden=true}}
  })
}

let mealSetGroupsEditing = false
function mealSetGroupEntries() {
  // Never splice built-in arrays: default-N references must remain stable.
  return [...defaultMealSets.map((set,index)=>({set,reference:`default:${index}`,category:set.category==='other'?'other':'default'})), ...state.savedMealSets.map(set=>({set,reference:`saved:${set.id}`,category:set.category==='default'?'default':'other'}))].filter(entry=>!entry.set.archived)
}
function renderMealSetGroups() {
  mealSetPageKicker.textContent='MEAL SETS'; mealSetPageTitle.textContent='套餐管理'
  addMealSetButton.hidden=false; addMealSetButton.textContent=mealSetGroupsEditing?'完成':'编辑套餐'
  addMealSetButton.setAttribute('aria-pressed',String(mealSetGroupsEditing))
  const entries=mealSetGroupEntries()
  mealSetPageContent.innerHTML=`<p class="sub-page-note">默认套餐是备餐随机选取范围，其他套餐仅手动套用。左滑切换分类或删除，不影响已有记录与备餐。</p>${[['default','默认套餐'],['other','其他套餐']].map(([category,title])=>{
    const group=entries.filter(entry=>entry.category===category)
    return `<section class="set-page-section"><div class="content-heading"><h2>${title}</h2>${mealSetGroupsEditing?`<button class="set-group-add" type="button" data-new-set-group="${category}" aria-label="添加${title}">＋</button>`:`<span>${group.length} 个套餐</span>`}</div><div class="set-list">${group.length?group.map(entry=>`<div class="set-swipe-row ${mealSetGroupsEditing?'editing':''}" data-set-reference="${escapeHtml(entry.reference)}"><div class="set-swipe-actions"><button type="button" data-set-move aria-label="移到${category==='default'?'其他':'默认'}套餐">移到${category==='default'?'其他':'默认'}</button><button type="button" data-set-delete>删除</button></div><div class="set-swipe-content">${mealSetListCard(entry.set,`${setApplicationLabel(entry.set)} · ${mealTypesForSet(entry.set).map(mealTypeName).join('、')}`,entry.reference)}</div></div>`).join(''):'<p class="empty-editor-note">暂无套餐，点击“编辑套餐”后使用分组右侧 ＋ 添加。</p>'}</div></section>`
  }).join('')}`
  mealSetPageContent.querySelectorAll('[data-new-set-group]').forEach(button=>button.onclick=()=>{openMealSetPageEditor('new');mealSetEditorState.category=button.dataset.newSetGroup; const save=mealSetPageContent.querySelector('#save-meal-set-editor');if(save)save.textContent=mealSetEditorState.category==='default'?'保存默认套餐':'保存其他套餐'})
  mealSetPageContent.querySelectorAll('[data-open-set-editor]').forEach(button=>button.onclick=()=>openMealSetPageEditor(button.dataset.openSetEditor))
  mealSetPageContent.querySelectorAll('[data-copy-meal-set]').forEach(button=>button.onclick=()=>copyMealSet(button.dataset.copyMealSet))
  mealSetPageContent.querySelectorAll('.set-swipe-row').forEach(row=>{
    const entry=entries.find(entry=>entry.reference===row.dataset.setReference)
    row.querySelector('[data-set-move]').onclick=()=>changeMealSetGroup(entry,false)
    row.querySelector('[data-set-delete]').onclick=()=>changeMealSetGroup(entry,true)
    let gesture=null
    row.addEventListener('pointerdown',event=>{if(event.isPrimary&&event.button===0&&!event.target.closest('button'))gesture={x:event.clientX,y:event.clientY,id:event.pointerId}})
    row.addEventListener('pointermove',event=>{
      if(!gesture||event.pointerId!==gesture.id)return
      const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y
      if(Math.abs(dy)>Math.abs(dx)+8){gesture=null;return}
      if(Math.abs(dx)>24){row.setPointerCapture(event.pointerId);if(event.cancelable)event.preventDefault();row.classList.toggle('revealed',dx<0)}
    })
    row.addEventListener('pointerup',()=>{gesture=null})
    row.addEventListener('pointercancel',()=>{gesture=null})
  })
}
function changeMealSetGroup(entry, remove) {
  const previous={category:entry.set.category,archived:entry.set.archived}
  const commit=()=>{
    const id=entry.reference.startsWith('default:')?entry.reference.replace(':','-'):entry.reference.slice(6)
    const frozen=[]
    // A previously implicit selection becomes an explicit snapshot before its pool changes.
    activeSchedulePlan().forEach((day,index)=>mealSlotsForDay(day.dayType).forEach((meal,mealIndex)=>{
      const key=scheduleMealOverrideKey(index,meal.id)
      if(state.scheduleMealOverrides[key]?.length || preferredMealSetForSlot(meal.id,mealIndex)?.id!==id)return
      const before=state.scheduleMealOverrides[key],items=scheduleMealItems(day,index,meal,mealIndex)
      state.scheduleMealOverrides[key]=cloneItems(items);frozen.push({key,before,value:JSON.stringify(items)})
    }))
    const thaw=()=>frozen.forEach(({key,before,value})=>{if(JSON.stringify(state.scheduleMealOverrides[key])!==value)return;if(before===undefined)delete state.scheduleMealOverrides[key];else state.scheduleMealOverrides[key]=before})
    if(remove)entry.set.archived=true
    else entry.set.category=entry.category==='default'?'other':'default'
    try { persistState() } catch { Object.assign(entry.set,previous);thaw();showToast('未保存，请检查本机存储空间');return }
    renderMealSetPageList();updateSettingsSummaries()
    showToast(remove?'已删除套餐':'已切换套餐分类',()=>{
      const current={category:entry.set.category,archived:entry.set.archived},overrides=frozen.map(({key})=>[key,state.scheduleMealOverrides[key]])
      Object.assign(entry.set,previous);thaw()
      try { persistState() } catch {
        Object.assign(entry.set,current);overrides.forEach(([key,value])=>{if(value===undefined)delete state.scheduleMealOverrides[key];else state.scheduleMealOverrides[key]=value})
        showToast('撤销未保存，请检查本机存储空间');return
      }
      if(!mealSetPage.hidden&&!mealSetEditorState)renderMealSetPageList();updateSettingsSummaries()
    })
  }
  if(!remove){commit();return}
  const dialog=openActionDialog('删除套餐')
  dialog.content.innerHTML=`<p>删除「${escapeHtml(entry.set.name)}」？已记录的餐食和已有备餐安排会保留。</p><button class="primary-action" type="button" data-confirm-set-delete>删除套餐</button>`
  dialog.content.querySelector('[data-confirm-set-delete]').onclick=()=>dialog.close(false,commit)
}

function installEdgeElasticity() {
  const reduced=matchMedia('(prefers-reduced-motion: reduce)')
  let gesture=null, moving=[], animations=[], wheelTimer=0
  const ignored='input,textarea,select,[data-wheel-scroll],.horizontal-number-scroll,#layout-tuner,.set-swipe-row'
  function findSurface(target) {
    if(target.closest(ignored))return null
    let scroller=target
    while(scroller&&scroller!==document.body){
      if(/auto|scroll/.test(getComputedStyle(scroller).overflowY)&&scroller.scrollHeight>scroller.clientHeight+2)break
      scroller=scroller.parentElement
    }
    if(!scroller||scroller===document.body)return null
    const wrapper=scroller.matches('.today-page')?scroller.querySelector('.meal-section'):scroller.querySelector(':scope > .page-content')
    const contents=wrapper?[wrapper]:[...scroller.children].filter(el=>el instanceof HTMLElement&&!el.hidden&&!['sticky','fixed'].includes(getComputedStyle(el).position))
    return contents.length?{scroller,contents}:null
  }
  function reset() {
    gesture=null;clearTimeout(wheelTimer)
    if(!moving.length){if(reduced.matches)animations.forEach(a=>a.cancel());return}
    animations.forEach(a=>a.cancel());animations=[]
    moving.forEach(({target,translate,scale})=>{
      const from=target.style.translate, stretch=target.style.scale
      target.style.translate=translate;target.style.scale=scale
      if(!reduced.matches)animations.push(target.animate([{translate:from,scale:stretch},{translate:translate||'0 0',scale:scale||'1 1'}],{duration:260,easing:'cubic-bezier(.2,.8,.25,1)'}))
    });moving=[]
  }
  function pull(surface,distance) {
    animations.forEach(a=>a.cancel());animations=[]
    if(!moving.length)moving=surface.contents.map(target=>({target,translate:target.style.translate,scale:target.style.scale}))
    moving.forEach(({target})=>{target.style.translate=`0 ${distance}px`;target.style.scale=`1 ${1+Math.abs(distance)/6000}`})
  }
  document.addEventListener('touchstart',event=>{
    reset()
    if(reduced.matches||event.touches.length!==1||event.target.closest('button,a,[role="button"],.drag-handle'))return
    const surface=findSurface(event.target)
    if(surface)gesture={...surface,x:event.touches[0].clientX,y:event.touches[0].clientY}
  },{passive:true})
  document.addEventListener('touchmove',event=>{
    if(!gesture)return
    if(event.touches.length!==1||reduced.matches){reset();return}
    const dx=event.touches[0].clientX-gesture.x,dy=event.touches[0].clientY-gesture.y,{scroller}=gesture
    if(Math.abs(dx)>Math.abs(dy)){reset();return}
    const atTop=scroller.scrollTop<=0&&dy>0,atBottom=scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-1&&dy<0
    if(!atTop&&!atBottom)return
    if(event.cancelable)event.preventDefault()
    pull(gesture,Math.sign(dy)*Math.min(26,Math.abs(dy)*.18))
  },{passive:false})
  document.addEventListener('wheel',event=>{
    if(reduced.matches||gesture||event.ctrlKey||Math.abs(event.deltaX)>Math.abs(event.deltaY))return
    const surface=findSurface(event.target);if(!surface)return
    const {scroller}=surface,atTop=scroller.scrollTop<=0&&event.deltaY<0,atBottom=scroller.scrollTop+scroller.clientHeight>=scroller.scrollHeight-1&&event.deltaY>0
    if(!atTop&&!atBottom)return
    if(moving.length&&moving[0].target!==surface.contents[0])reset()
    pull(surface,-Math.sign(event.deltaY)*Math.min(14,Math.abs(event.deltaY)*.1))
    clearTimeout(wheelTimer);wheelTimer=setTimeout(reset,90)
  },{passive:true})
  document.addEventListener('touchend',reset,{passive:true});document.addEventListener('touchcancel',reset,{passive:true})
  document.addEventListener('visibilitychange',reset);reduced.addEventListener('change',reset)
}

window.addEventListener('DOMContentLoaded',()=>{
  const row=document.createElement('label');row.className='setting-row food-icons-setting'
  row.innerHTML='<span><strong>食物图标</strong></span><input id="food-icons-enabled" type="checkbox" role="switch" aria-label="食物图标" checked>'
  document.querySelector('#theme-settings-button').after(row)
  const toggle=row.querySelector('input');toggle.checked=!foodIconsHidden()
  toggle.onchange=()=>{
    // Keep the existing stored "hidden" preference; only the switch is positive.
    const hidden=!toggle.checked
    try{localStorage.setItem(foodIconsPreferenceKey,String(hidden))}catch{toggle.checked=!foodIconsHidden();showToast('设置未保存，请检查本机存储空间');return}
    document.body.classList.toggle('hide-food-icons',hidden);renderMeals()
  }
  installEdgeElasticity()
},{once:true})
