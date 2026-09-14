(()=>{
  'use strict';
  const DIMS=['E','X','F','B','O','D'];
  const DIM_INFO={
    E:{name:'能量方式',left:'独处蓄能',right:'互动充电',neg:'你通常先独处消化，再选择性表达；安静会帮你恢复电量。',pos:'互动、表达和即时反馈会给你充电，很多想法是在交流里变清楚的。'},
    X:{name:'新鲜偏好',left:'熟悉深耕',right:'探索未知',neg:'你更愿意把时间投进可积累的路径，熟悉感会给你安全和深度。',pos:'新鲜感和未知会明显激活你，看到新的可能性时更容易兴奋起来。'},
    F:{name:'判断入口',left:'事实切分',right:'情绪共振',neg:'你更习惯先区分事实、责任和解决办法，再处理情绪。',pos:'你对语气、氛围和人的感受接收很快，关系信息会自然进入你的判断。'},
    B:{name:'关系边界',left:'共同联结',right:'独立自主',neg:'共同参与和持续连接会让你更有安全感，你常通过“我们一起”确认关系。',pos:'自主权对你很重要，即使关系亲密，你也需要保留自己的选择空间。'},
    O:{name:'行动节奏',left:'灵活应变',right:'计划建构',neg:'你更相信现场反馈和动态调整，过早锁死路径反而会让你失去灵活性。',pos:'清晰计划、节点和可预期节奏能显著降低你的内耗。'},
    D:{name:'思考深度',left:'即时体验',right:'深度加工',neg:'你更相信真实体验和行动反馈，不要求所有事情都先在脑内解释完整。',pos:'你很难只停在“发生了什么”，会继续追问原因、意义和隐藏联系。'}
  };
  const BIAS={mist_deer:.0191,moon_fox:.0482,amber_bear:-.0769,moss_lynx:.0237,aurora_leopard:.0353,frost_wolf:.0130,cloud_hare:-.0429,morning_crane:-.0056,galaxy_whale:.0441,tide_dolphin:-.0542,moon_jelly:.0249,narwhal:.0728,albatross:.0386,falcon:-.0483,hummingbird:.015,swift:-.0371,phoenix:.0542,gold_lion:-.020,red_panda:.0159,peacock:-.0048,owl:.0085,butterfly:.0602,black_cat:.0182,crystal_swan:.0251};
  const CHAPTERS=[['身份档案','WHO YOU ARE'],['六维图谱','YOUR PATTERN'],['别人眼中','FIRST IMPRESSION'],['内心与关系','INNER WORLD'],['天赋能力','GIFT & WORK'],['阴影成长','GROWTH']];
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const screens=$$('.screen');
  let qIndex=0,answers=[],resultState=null,choiceLocked=false,currentChapter=0,observer=null;
  const storeKey='fantasySoulAtlas_v3';

  // Interleave dimensions so six similar questions never appear consecutively.
  const originalQuestions=[...window.QUESTIONS];
  const groups=Object.fromEntries(DIMS.map(d=>[d,originalQuestions.filter(q=>q.dim===d)]));
  window.QUESTIONS=[];
  for(let round=0;round<6;round++) DIMS.forEach(d=>{if(groups[d][round])window.QUESTIONS.push(groups[d][round])});

  function show(id){screens.forEach(s=>s.classList.remove('active'));$(id)?.classList.add('active');window.scrollTo(0,0)}
  function saveProgress(){try{localStorage.setItem(storeKey,JSON.stringify({qIndex,answers,ts:Date.now()}))}catch(e){}}
  function loadProgress(){try{return JSON.parse(localStorage.getItem(storeKey)||'null')}catch{return null}}
  function clearProgress(){try{localStorage.removeItem(storeKey)}catch(e){}}
  function checkResume(){const p=loadProgress();if(p&&Array.isArray(p.answers)&&p.answers.some(x=>x!==null&&x!==undefined))$('#resume-btn')?.classList.remove('hidden')}
  function heroPath(p){return `assets/heroes/${p.id}.webp?v=3.0`}
  function resultThumb(p){return `assets/results/${p.id}.webp?v=3.0`}
  function collectorPath(p){return `assets/collector/${p.id}.webp?v=3.0`}

  function renderQuestion(){
    choiceLocked=false; const q=window.QUESTIONS[qIndex];
    $('#question-num').textContent=`${qIndex+1} / ${window.QUESTIONS.length}`;
    $('#chapter-label').textContent=['第一幕 · 初见','第二幕 · 靠近','第三幕 · 选择','第四幕 · 深潜'][Math.min(3,Math.floor(qIndex/9))];
    $('#progress-bar').style.width=`${((qIndex+1)/window.QUESTIONS.length)*100}%`;$('#question-text').textContent=q.prompt;
    const box=$('#options');box.innerHTML='';
    q.options.forEach((o,i)=>{const b=document.createElement('button');b.className='option'+(answers[qIndex]===i?' selected':'');b.innerHTML=`<span class="option-letter">${String.fromCharCode(65+i)}</span>${o.text}`;b.onclick=()=>choose(i,b);box.appendChild(b)});
    $('#quiz-back').style.visibility=qIndex===0?'hidden':'visible';
  }
  function choose(i,b){if(choiceLocked)return;choiceLocked=true;answers[qIndex]=i;$$('.option').forEach(x=>{x.disabled=true;x.classList.remove('selected')});b.classList.add('selected');saveProgress();setTimeout(()=>{if(qIndex<window.QUESTIONS.length-1){qIndex++;renderQuestion();saveProgress()}else finishQuiz()},180)}
  function backQuestion(){if(choiceLocked||qIndex===0)return;qIndex--;renderQuestion();saveProgress()}

  function profileFromAnswers(){
    const raw=Object.fromEntries(DIMS.map(d=>[d,[]]));
    window.QUESTIONS.forEach((q,i)=>{const a=q.options[answers[i]];if(a)raw[q.dim].push(a.score)});
    const scores={};DIMS.forEach(d=>{const arr=raw[d],sum=arr.reduce((a,b)=>a+b,0);scores[d]=Math.round(sum/(Math.max(1,arr.length)*2)*100)});
    return {scores,raw};
  }
  function archetypeFit(u,p){
    const c=window.CENTERS[p.id],un=Math.hypot(...u)||1,cn=Math.hypot(...c)||1;
    const cos01=(u.reduce((s,v,i)=>s+v*c[i],0)/(un*cn)+1)/2;
    const closeness=1-c.reduce((s,v,i)=>s+Math.abs(v-u[i]),0)/1200;
    return .65*cos01+.35*closeness+.5*(BIAS[p.id]||0);
  }
  function relationshipMatch(primary){
    const a=window.CENTERS[primary.id],sim=(x,y)=>1-Math.abs(x-y)/200,comp=(x,y)=>1-Math.abs(x+y)/200;
    return window.RESULTS.filter(p=>p.id!==primary.id).map(p=>{const b=window.CENTERS[p.id];const fit=.25*sim(a[2],b[2])+.25*sim(a[3],b[3])+.15*sim(a[4],b[4])+.15*comp(a[0],b[0])+.10*comp(a[1],b[1])+.10*sim(a[5],b[5]);return {p,fit}}).sort((x,y)=>y.fit-x.fit)[0].p;
  }
  function stabilityInfo(raw){
    const sds=DIMS.map(d=>{const a=raw[d],m=a.reduce((x,y)=>x+y,0)/a.length;return Math.sqrt(a.reduce((s,v)=>s+(v-m)**2,0)/a.length)});
    const avg=sds.reduce((a,b)=>a+b,0)/sds.length;
    if(avg<1.05)return {label:'较稳定',note:'不同场景里的选择方向比较一致。'};
    if(avg<1.42)return {label:'有情境变化',note:'你会随场景调整，不属于单一固定反应。'};
    return {label:'高度情境型',note:'你的反应很依赖关系、任务和当下环境。'};
  }
  function clarityInfo(ranked){const gap=ranked[0].fit-ranked[1].fit;if(gap>.055)return {label:'非常清晰',note:'第一原型与其他原型拉开了明显距离。'};if(gap>.025)return {label:'较清晰',note:'主人格突出，同时保留明显的第二原型。'};return {label:'混合型',note:'前两种原型很接近，你本身就带有混合特征。'}}
  function calculate(){
    const {scores,raw}=profileFromAnswers(),u=DIMS.map(d=>scores[d]);
    const ranked=window.RESULTS.map(p=>({p,fit:archetypeFit(u,p)})).sort((a,b)=>b.fit-a.fit);
    return {scores,raw,ranked,primary:ranked[0].p,secondary:ranked[1].p,partner:relationshipMatch(ranked[0].p),clarity:clarityInfo(ranked),stability:stabilityInfo(raw)};
  }

  function tendencyText(d,v){
    const strong=Math.abs(v)>=58,mid=Math.abs(v)>=25;
    const map={E:['独处会帮你充电','互动会帮你充电'],X:['更愿意深耕熟悉事物','未知和新鲜感会激活你'],F:['先分清事实再处理情绪','很容易感受到氛围变化'],B:['通过共同参与确认关系','很重视自己的选择空间'],O:['现场调整比计划更自然','清晰计划会让你安心'],D:['做了再理解更适合你','习惯把事情想深一层']};
    const txt=map[d][v>=0?1:0];return strong?txt:mid?txt:`${DIM_INFO[d].name}相对均衡`;
  }
  function topTendencies(scores){return Object.entries(scores).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3).map(([d,v])=>tendencyText(d,v))}

  function finishQuiz(){choiceLocked=false;resultState=calculate();clearProgress();show('#screen-analysis');runAnalysis()}
  function runAnalysis(){let n=10;const t=setInterval(()=>{n=Math.min(100,n+Math.ceil(Math.random()*9));$('#analysis-bar').style.width=n+'%';$('#analysis-percent').textContent=n+'%';if(n>30){$('#a-step-2').classList.add('done');$('#a-step-2 span').textContent='✓';$('#analysis-status').textContent='正在计算方向相似度与六维距离……'}if(n>57){$('#a-step-3').classList.add('done');$('#a-step-3 span').textContent='✓';$('#analysis-status').textContent='正在检查前两种原型是否接近……'}if(n>82){$('#a-step-4').classList.add('done');$('#a-step-4 span').textContent='✓';$('#analysis-status').textContent='正在生成你的完整图鉴……'}if(n===100){clearInterval(t);setTimeout(revealResult,400)}},170)}
  function revealResult(){const r=resultState,p=r.primary;$('#reveal-image').src=heroPath(p);$('#reveal-image').onerror=()=>{$('#reveal-image').src=resultThumb(p)};$('#reveal-name').textContent=p.name;$('#reveal-subtitle').textContent=p.subtitle;$('#reveal-keywords').innerHTML=p.keywords.map(k=>`<span>${k}</span>`).join('');$('#reveal-quote').textContent='“'+p.quote+'”';$('#reveal-clarity').textContent=r.clarity.label;$('#reveal-clarity-note').textContent=r.clarity.note;$('#reveal-stability').textContent=r.stability.label;$('#reveal-stability-note').textContent=r.stability.note;$('#reveal-tendencies').innerHTML=topTendencies(r.scores).map(x=>`<span>${x}</span>`).join('');show('#screen-reveal')}

  function readingHTML(text){return text.split(/\n\n+/).map(p=>`<p>${p}</p>`).join('')}
  function chapterHead(i,title,eng){return `<div class="chapter-head"><div class="chapter-num">${String(i+1).padStart(2,'0')}</div><div><small>${eng}</small><h2>${title}</h2></div></div>`}
  function nextBtn(i){return i<CHAPTERS.length-1?`<div class="chapter-nav-inline"><button data-next="${i+1}">下一章 · ${CHAPTERS[i+1][0]} →</button></div>`:''}
  function axisLevel(v){if(v>58)return '明显偏右';if(v>22)return '略偏右';if(v<-58)return '明显偏左';if(v<-22)return '略偏左';return '两侧均衡'}
  function axisRows(scores){return DIMS.map(d=>{const inf=DIM_INFO[d],v=scores[d],pos=Math.max(4,Math.min(96,(v+100)/2));return `<div class="axis-row"><div class="axis-top"><div class="axis-name"><b>${inf.name}</b><small>${inf.left} ↔ ${inf.right}</small></div><div class="axis-result">${axisLevel(v)} · ${v>=0?inf.right:inf.left}</div></div><div class="axis-bar"><i class="axis-marker" style="left:${pos}%"></i></div><p>${v>=0?inf.pos:inf.neg}</p></div>`}).join('')}
  function renderReport(){
    const r=resultState,p=r.primary,s=r.secondary,partner=r.partner;
    const html=`
      <section class="report-section" data-chapter="0" id="chapter-0"><div class="section-art"><img src="${heroPath(p)}" alt="${p.name}奇幻图鉴"></div><div class="section-body">${chapterHead(0,'你的灵兽身份档案','SOUL PROFILE')}<div class="profile-name"><h1>${p.name}</h1><p>${p.subtitle}</p><div class="chips">${p.keywords.map(k=>`<span>${k}</span>`).join('')}</div></div><blockquote class="profile-quote">“${p.quote}”</blockquote><div class="identity-list"><div><span>代表元素</span><b>${p.element}</b></div><div><span>灵魂颜色</span><b>${p.color}</b></div><div><span>幸运物</span><b>${p.lucky}</b></div><div><span>结果清晰度</span><b>${r.clarity.label}</b></div><div class="wide"><span>隐藏能力</span><b>${p.ability}</b></div></div><div class="insight-box"><small>为什么图鉴会把你匹配到这里</small>${topTendencies(r.scores).map(x=>`<div>✦ ${x}</div>`).join('')}<div>✦ ${r.clarity.note}</div></div>${nextBtn(0)}</div></section>
      <section class="report-section" data-chapter="1" id="chapter-1"><div class="section-body">${chapterHead(1,'六条维度，翻译成你看得懂的话','YOUR PATTERN')}<p class="axis-intro">这里不再用“92%共鸣”这种没有直观意义的数字。每一条只告诉你：在两种反应方式之间，你更自然地靠近哪一边。</p><div class="axis-list">${axisRows(r.scores)}</div><button class="axis-more" id="axis-more">六条轴为什么这样命名？</button><div class="secondary-card"><img src="${heroPath(s)}" alt="${s.name}"><div><small>第二原型 · 你身上也明显存在的一面</small><h3>${s.name}</h3><p>${s.subtitle}</p><span class="why">它不是“第二名”，而是当环境、关系或压力变化时，你更容易显露出的另一套反应方式。</span></div></div>${nextBtn(1)}</div></section>
      <section class="report-section" data-chapter="2" id="chapter-2"><div class="section-body">${chapterHead(2,'别人眼中的你','FIRST IMPRESSION')}<div class="reading-text">${readingHTML(p.pages[0].text)}</div>${nextBtn(2)}</div></section>
      <section class="report-section" data-chapter="3" id="chapter-3"><div class="section-body">${chapterHead(3,'你的内心世界与关系密码','INNER WORLD & RELATIONSHIP')}<div class="reading-text">${readingHTML(p.pages[1].text)}</div><div class="partner-card"><img src="${heroPath(partner)}" alt="${partner.name}"><div><small>关系彩蛋 · 更容易和你合拍的灵兽</small><h3>${partner.name}</h3><p>${partner.subtitle}</p><span class="why">这个推荐只参考互动节奏、边界和情绪处理方式，是趣味关系提示，不是恋爱预测或“命定伴侣”。</span></div></div>${nextBtn(3)}</div></section>
      <section class="report-section" data-chapter="4" id="chapter-4"><div class="section-body">${chapterHead(4,'你的天赋能力与工作能量','GIFT & WORK')}<div class="reading-text">${readingHTML(p.pages[2].text)}</div>${nextBtn(4)}</div></section>
      <section class="report-section" data-chapter="5" id="chapter-5"><div class="section-body">${chapterHead(5,'你的阴影与成长路线','SHADOW & GROWTH')}<div class="reading-text">${readingHTML(p.pages[3].text)}</div><div class="actions-card"><b>接下来真正可以做的三件事</b><ol>${p.actions.map(x=>`<li>${x}</li>`).join('')}</ol></div><div class="quotes">${p.shareQuotes.slice(0,4).map(q=>`<blockquote>“${q}”</blockquote>`).join('')}</div><div class="collector-box" id="collector-box"><button class="collector-toggle" id="collector-toggle">展开「收藏长图版」 · 用上本次生成的完整美术稿</button><img class="collector-img" src="${collectorPath(p)}" loading="lazy" alt="${p.name}收藏长图"><p class="collector-note">主报告用清晰 HTML 阅读；这张长图作为收藏视觉稿保留，不再拿它承担正文阅读，所以不会因为缩放而影响主体验。</p></div><div class="final-note">人格是倾向，不是牢笼。不同阶段重新作答，结果也可能变化。</div></div></section>`;
    $('#report-content').innerHTML=html;
    $('#axis-more').onclick=()=>$('#axis-modal').classList.remove('hidden');
    $('#collector-toggle').onclick=()=>$('#collector-box').classList.toggle('open');
    $$('[data-next]').forEach(b=>b.onclick=()=>goChapter(+b.dataset.next));
    buildToc(); setupObserver(); setCurrentChapter(0);
  }
  function buildToc(){const list=$('#toc-list');list.innerHTML=CHAPTERS.map((c,i)=>`<button class="toc-item" data-goto="${i}"><div><span>${String(i+1).padStart(2,'0')}</span>${c[0]}</div><small>${c[1]}</small></button>`).join('');list.querySelectorAll('button').forEach(b=>b.onclick=()=>{closeToc();goChapter(+b.dataset.goto)})}
  function setCurrentChapter(i){currentChapter=Math.max(0,Math.min(CHAPTERS.length-1,i));$('#current-chapter').textContent=CHAPTERS[currentChapter][0];$('#chapter-count').textContent=`${currentChapter+1} / ${CHAPTERS.length}`;$('#report-progress').style.width=`${((currentChapter+1)/CHAPTERS.length)*100}%`;$('#chapter-dots').innerHTML=CHAPTERS.map((_,j)=>`<i class="${j===currentChapter?'active':''}"></i>`).join('');$('#prev-chapter').disabled=currentChapter===0;$('#next-chapter').disabled=currentChapter===CHAPTERS.length-1}
  function setupObserver(){if(observer)observer.disconnect();observer=new IntersectionObserver(entries=>{const visible=entries.filter(x=>x.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(visible)setCurrentChapter(+visible.target.dataset.chapter)},{root:null,threshold:[.18,.38,.6]});$$('.report-section').forEach(s=>observer.observe(s))}
  function goChapter(i){const el=$(`#chapter-${i}`);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
  function openReport(){renderReport();show('#screen-report');setTimeout(()=>goChapter(0),20)}
  function closeToc(){$('#toc-sheet').classList.add('hidden')}

  function restart(){answers=new Array(window.QUESTIONS.length).fill(null);qIndex=0;resultState=null;clearProgress();show('#screen-cover')}
  $('#start-btn').onclick=()=>{answers=new Array(window.QUESTIONS.length).fill(null);qIndex=0;show('#screen-intro')};
  $('#resume-btn').onclick=()=>{const p=loadProgress();answers=p?.answers||new Array(window.QUESTIONS.length).fill(null);qIndex=Math.min(p?.qIndex||0,window.QUESTIONS.length-1);show('#screen-quiz');renderQuestion()};
  $('#enter-quiz-btn').onclick=()=>{show('#screen-quiz');renderQuestion()};$('#quiz-back').onclick=backQuestion;$('#open-report-btn').onclick=openReport;$('#reveal-home').onclick=()=>show('#screen-cover');$('#report-home').onclick=()=>show('#screen-cover');
  $('#open-toc').onclick=()=>$('#toc-sheet').classList.remove('hidden');$('#close-toc').onclick=closeToc;$('#toc-sheet').onclick=e=>{if(e.target.id==='toc-sheet')closeToc()};$('#close-axis').onclick=()=>$('#axis-modal').classList.add('hidden');$('#axis-modal').onclick=e=>{if(e.target.id==='axis-modal')$('#axis-modal').classList.add('hidden')};
  $('#prev-chapter').onclick=()=>goChapter(currentChapter-1);$('#next-chapter').onclick=()=>goChapter(currentChapter+1);

  if(window.APP_CONFIG?.accessCodeEnabled){const ok=sessionStorage.getItem('soul_access')==='ok'||new URLSearchParams(location.search).get('code')===window.APP_CONFIG.accessCode;if(!ok){const code=prompt('请输入购买后获得的访问码');if(code!==window.APP_CONFIG.accessCode){document.body.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;background:#07162c;color:white;font-family:system-ui;padding:30px;text-align:center"><div><h2>访问码不正确</h2><p>请使用购买后获得的正确链接或访问码。</p></div></div>';return}else sessionStorage.setItem('soul_access','ok')}}

  const params=new URLSearchParams(location.search),demoId=params.get('demo'),revealId=params.get('reveal');
  if(demoId||revealId){const p=window.RESULTS.find(x=>x.id===(demoId||revealId))||window.RESULTS[0],u=window.CENTERS[p.id];const ranked=window.RESULTS.map(x=>({p:x,fit:archetypeFit(u,x)})).sort((a,b)=>b.fit-a.fit);const raw=Object.fromEntries(DIMS.map(d=>[d,[1,1,1,1,1,1]]));resultState={scores:Object.fromEntries(DIMS.map((d,i)=>[d,u[i]])),raw,ranked,primary:p,secondary:ranked.find(x=>x.p.id!==p.id).p,partner:relationshipMatch(p),clarity:{label:'较清晰',note:'主人格突出，同时保留明显的第二原型。'},stability:{label:'较稳定',note:'不同场景里的选择方向比较一致。'}};if(revealId)revealResult();else openReport()}else checkResume();
})();
