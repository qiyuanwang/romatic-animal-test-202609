(()=>{
  'use strict';

  const dims=['E','X','F','B','O','D'];
  const dimLabels={E:'显露度',X:'探索度',F:'共振度',B:'边界度',O:'结构度',D:'深潜度'};
  const quizChapterLabels=['第一幕 · 初见','第二幕 · 靠近','第三幕 · 选择','第四幕 · 深潜'];
  const reportTabs=['身份档案','灵魂图谱','别人眼中','内心世界','天赋能力','阴影成长','专属卡片'];
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));
  const screens=$$('.screen');

  let qIndex=0;
  let answers=[];
  let resultState=null;
  let choiceLocked=false;
  let reportPageIndex=0;
  let touchStartX=0;
  const storeKey='fantasySoulAtlas_v2';

  function show(id){
    screens.forEach(s=>s.classList.remove('active'));
    const el=$(id); if(el) el.classList.add('active');
    window.scrollTo({top:0,behavior:'auto'});
  }
  function saveProgress(){try{localStorage.setItem(storeKey,JSON.stringify({qIndex,answers,ts:Date.now()}))}catch(e){}}
  function loadProgress(){try{return JSON.parse(localStorage.getItem(storeKey)||'null')}catch{return null}}
  function clearProgress(){try{localStorage.removeItem(storeKey)}catch(e){}}
  function checkResume(){
    const p=loadProgress();
    if(p&&Array.isArray(p.answers)&&p.answers.some(v=>v!==null&&v!==undefined)) $('#resume-btn')?.classList.remove('hidden');
  }

  function renderQuestion(){
    choiceLocked=false;
    const q=window.QUESTIONS[qIndex];
    $('#question-num').textContent=`${qIndex+1} / ${window.QUESTIONS.length}`;
    $('#chapter-label').textContent=quizChapterLabels[Math.min(3,Math.floor(qIndex/9))];
    $('#progress-bar').style.width=`${((qIndex+1)/window.QUESTIONS.length)*100}%`;
    $('#question-text').textContent=q.prompt;
    const wrap=$('#options'); wrap.innerHTML='';
    q.options.forEach((opt,i)=>{
      const b=document.createElement('button');
      b.className='option'+(answers[qIndex]===i?' selected':'');
      b.innerHTML=`<span class="option-letter">${String.fromCharCode(65+i)}</span>${opt.text}`;
      b.addEventListener('click',()=>choose(i,b));
      wrap.appendChild(b);
    });
    $('#quiz-back').style.visibility=qIndex===0?'hidden':'visible';
  }

  function choose(i,button){
    if(choiceLocked)return;
    choiceLocked=true;
    answers[qIndex]=i;
    $$('.option').forEach(x=>{x.classList.remove('selected');x.disabled=true});
    button.classList.add('selected');
    saveProgress();
    setTimeout(()=>{
      if(qIndex<window.QUESTIONS.length-1){qIndex++;saveProgress();renderQuestion();}
      else finishQuiz();
    },220);
  }
  function backQuestion(){if(choiceLocked)return;if(qIndex>0){qIndex--;saveProgress();renderQuestion()}}

  function calculate(){
    const raw=Object.fromEntries(dims.map(d=>[d,[]]));
    window.QUESTIONS.forEach((q,i)=>{const a=q.options[answers[i]];if(a)raw[q.dim].push(a.score)});
    const scores={};
    dims.forEach(d=>{const sum=raw[d].reduce((a,b)=>a+b,0);scores[d]=Math.round(sum/(raw[d].length*2)*100)});
    const u=dims.map(d=>scores[d]);
    const uNorm=Math.sqrt(u.reduce((a,b)=>a+b*b,0))||1;
    const ranked=window.RESULTS.map(p=>{
      const c=window.CENTERS[p.id];
      const cNorm=Math.sqrt(c.reduce((a,b)=>a+b*b,0))||1;
      const cosine=u.reduce((acc,v,idx)=>acc+v*c[idx],0)/(uNorm*cNorm);
      const magnitude=1-Math.abs(uNorm-cNorm)/Math.max(uNorm,cNorm,1);
      return {p,fit:.85*cosine+.15*magnitude};
    }).sort((a,b)=>b.fit-a.fit);
    const sim=fit=>Math.max(58,Math.min(96,Math.round(70+((fit+1)/2)*26)));
    const split=[];
    dims.forEach(d=>{
      const arr=raw[d],a=arr.slice(0,3),b=arr.slice(3,6);
      const ma=a.reduce((x,y)=>x+y,0)/(a.length||1),mb=b.reduce((x,y)=>x+y,0)/(b.length||1);
      split.push(Math.max(0,100-Math.abs(ma-mb)*23));
    });
    const consistency=Math.round(split.reduce((a,b)=>a+b,0)/split.length);
    return {scores,primary:ranked[0].p,companion:ranked[1].p,similarity:sim(ranked[0].fit),companionSimilarity:sim(ranked[1].fit),consistency};
  }

  function finishQuiz(){choiceLocked=false;resultState=calculate();clearProgress();show('#screen-analysis');runAnalysis()}
  function runAnalysis(){
    const bar=$('#analysis-bar'),pct=$('#analysis-percent'),status=$('#analysis-status');
    let p=10;
    const t=setInterval(()=>{
      p+=Math.ceil(Math.random()*9);if(p>100)p=100;bar.style.width=p+'%';pct.textContent=p+'%';
      if(p>28){$('#a-step-2').classList.add('done');$('#a-step-2 span').textContent='✓';status.textContent='正在与24种灵兽原型逐一比对……'}
      if(p>55){$('#a-step-3').classList.add('done');$('#a-step-3 span').textContent='✓';status.textContent='正在寻找与你第二接近的伴生人格……'}
      if(p>80){$('#a-step-4').classList.add('done');$('#a-step-4 span').textContent='✓';status.textContent='正在生成分页专属图鉴……'}
      if(p===100){clearInterval(t);setTimeout(revealResult,500)}
    },210);
  }

  function thumbPath(p){return `assets/results/${p.id}.webp`}
  function heroPath(p){return `assets/heroes/${p.id}.webp`}

  function revealResult(){
    const r=resultState,p=r.primary;
    $('#reveal-image').src=heroPath(p);
    $('#reveal-image').onerror=()=>{$('#reveal-image').src=thumbPath(p)};
    $('#reveal-name').textContent=p.name;
    $('#reveal-subtitle').textContent=p.subtitle;
    $('#reveal-keywords').innerHTML=p.keywords.map(k=>`<span>${k}</span>`).join('');
    $('#reveal-quote').textContent='“'+p.quote+'”';
    $('#reveal-similarity').textContent=r.similarity+'%';
    $('#reveal-consistency').textContent=r.consistency+'%';
    show('#screen-reveal');
  }

  function insights(scores){
    const map={
      E:{pos:'你更容易通过互动与表达获得能量，很多想法是在交流中逐渐清晰的。',neg:'你需要先在心里完成一轮消化，再决定向谁、以什么方式表达自己。'},
      X:{pos:'新鲜、变化和未知会明显激活你；看不到新可能时，你的能量容易下降。',neg:'你更信任可积累、可预期的路径；熟悉不是无聊，而是让你把力量用在更深处。'},
      F:{pos:'你对语气、氛围和他人的情绪变化接收得很快，关系信息对你的判断影响不小。',neg:'你更习惯先区分事实、责任和解决办法，不会因为情绪强烈就自动改变判断。'},
      B:{pos:'自主权对你非常重要。关系越亲密，你越希望亲密建立在尊重选择而不是控制之上。',neg:'共同参与和持续连接会让你更有安全感，你往往通过“我们一起”确认关系。'},
      O:{pos:'清晰计划、确定节点和可预期节奏能显著降低你的内耗。',neg:'你更相信现场反馈和动态调整，过早把路径锁死反而会让你失去灵活性。'},
      D:{pos:'你很难只停在“发生了什么”，会继续追问原因、意义与隐藏联系。',neg:'你更相信真实体验和行动反馈，不会要求所有事情都先在脑内解释完整。'}
    };
    return Object.entries(scores).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])).slice(0,3).map(([d,v])=>map[d][v>=0?'pos':'neg']);
  }

  function openReport(){
    reportPageIndex=0;
    renderReportTabs();
    renderReportPage(false);
    show('#screen-report');
  }

  function renderReportTabs(){
    const nav=$('#report-pager-tabs');
    nav.innerHTML=reportTabs.map((t,i)=>`<button class="report-v2-tab ${i===reportPageIndex?'active':''}" data-page="${i}"><span>${String(i+1).padStart(2,'0')}</span>${t}</button>`).join('');
    nav.querySelectorAll('button').forEach(b=>b.onclick=()=>goReportPage(+b.dataset.page));
  }

  function reportHeroHTML(p){
    return `<section class="v2-hero-card">
      <div class="v2-hero-art"><img src="${heroPath(p)}" alt="${p.name}奇幻插画" onerror="this.src='${thumbPath(p)}'" /></div>
      <div class="v2-hero-overlay"></div>
      <div class="v2-hero-copy">
        <span class="v2-family">${p.family} · YOUR SOUL ARCHETYPE</span>
        <h1>${p.name}</h1>
        <p>${p.subtitle}</p>
        <div class="v2-hero-chips">${p.keywords.map(k=>`<span>${k}</span>`).join('')}</div>
      </div>
    </section>`;
  }

  function identityPage(){
    const r=resultState,p=r.primary;
    return `<div class="report-page v2-page-identity">
      ${reportHeroHTML(p)}
      <section class="v2-content-card identity-card-v2">
        <div class="v2-section-title"><span>01</span><div><small>SOUL PROFILE</small><h2>你的灵兽身份档案</h2></div></div>
        <div class="identity-grid-v2">
          <div><span>关键词</span><b>${p.keywords.join(' · ')}</b></div>
          <div><span>代表元素</span><b>${p.element}</b></div>
          <div><span>灵魂颜色</span><b>${p.color}</b></div>
          <div><span>幸运物</span><b>${p.lucky}</b></div>
          <div class="wide"><span>隐藏能力</span><b>${p.ability}</b></div>
        </div>
      </section>
      <section class="v2-insight-card">
        <div class="v2-insight-title">图鉴先看见了这三件事</div>
        ${insights(r.scores).map((t,i)=>`<div class="v2-insight-line"><i>${i+1}</i><p>${t}</p></div>`).join('')}
      </section>
      <blockquote class="v2-pullquote">“${p.quote}”</blockquote>
    </div>`;
  }

  function mapPage(){
    const r=resultState,p=r.primary,c=r.companion;
    return `<div class="report-page v2-page-map">
      <section class="v2-page-heading">
        <span>02 / 07</span><small>SOUL MAP</small><h2>你的灵魂图谱</h2><p>这不是好坏分数，而是你在36个生活场景里更自然的反应方向。</p>
      </section>
      <section class="v2-content-card radar-card-v2">
        <canvas id="radar" width="720" height="610"></canvas>
        <div class="axis-legend-v2"><span>向内蓄能 ↔ 向外显露</span><span>建立熟悉 ↔ 探索未知</span><span>客观切分 ↔ 情绪共振</span><span>高度联结 ↔ 高度自主</span><span>动态适应 ↔ 秩序建构</span><span>即时体验 ↔ 深度加工</span></div>
        <button id="radar-help" class="v2-link-btn">怎么看六条人格轴？</button>
      </section>
      <section class="v2-companion-card">
        <div class="v2-companion-art"><img src="${heroPath(c)}" alt="${c.name}" onerror="this.src='${thumbPath(c)}'" /></div>
        <div class="v2-companion-copy"><small>伴生人格 · SECONDARY ARCHETYPE</small><h3>${c.name}</h3><p>${c.subtitle}</p><div class="v2-match">共鸣 ${r.companionSimilarity}%</div></div>
      </section>
      <section class="v2-metric-grid"><div><small>主人格共鸣</small><strong>${r.similarity}%</strong></div><div><small>回答一致度</small><strong>${r.consistency}%</strong></div></section>
    </div>`;
  }

  function chapterPage(chapterIdx){
    const p=resultState.primary,pg=p.pages[chapterIdx];
    const pageNum=chapterIdx+3;
    const tags=[['FIRST IMPRESSION','别人眼中的你'],['INNER WORLD','你的内心世界'],['GIFT & WORK','你的天赋能力'],['SHADOW & GROWTH','你的阴影与成长']][chapterIdx];
    const paras=pg.text.split(/\n\n+/).map(x=>`<p>${x}</p>`).join('');
    return `<div class="report-page v2-page-chapter">
      <section class="v2-chapter-banner">
        <img src="${heroPath(p)}" alt="${p.name}" onerror="this.src='${thumbPath(p)}'" />
        <div class="v2-chapter-shade"></div>
        <div class="v2-chapter-banner-copy"><span>${String(pageNum).padStart(2,'0')} / 07 · ${tags[0]}</span><h2>${tags[1]}</h2><p>${pg.kicker}</p></div>
      </section>
      <article class="v2-reading-card">
        <div class="v2-dropcap">${String(chapterIdx+1).padStart(2,'0')}</div>
        <div class="v2-reading-text">${paras}</div>
      </article>
      ${chapterIdx===3?`<section class="v2-action-card"><small>本章行动提醒</small><h3>${p.growth}</h3><ol>${p.actions.map(x=>`<li>${x}</li>`).join('')}</ol></section>`:''}
    </div>`;
  }

  function sharePage(){
    const p=resultState.primary;
    return `<div class="report-page v2-page-share">
      <section class="v2-page-heading"><span>07 / 07</span><small>KEEP YOUR SOUL CARD</small><h2>把这一页留给未来的自己</h2><p>金句适合截图，身份卡可以直接保存或分享。</p></section>
      <section class="v2-quotes-grid">${p.shareQuotes.map(q=>`<blockquote>“${q}”</blockquote>`).join('')}</section>
      <section class="v2-poster-wrap"><canvas id="poster" width="900" height="1200"></canvas><div class="poster-actions"><button id="save-poster" class="btn primary dark">保存身份卡</button><button id="share-poster" class="btn ghost dark-outline">分享给朋友</button></div></section>
      <section class="v2-restart"><p>人格是倾向，不是牢笼。不同阶段重新作答，结果也可能变化。</p><button id="restart-btn" class="v2-link-btn strong">重新测试一次</button></section>
    </div>`;
  }

  function renderReportPage(animate=true){
    if(!resultState)return;
    const c=$('#report-page-container');
    const oldHeight=c.offsetHeight;
    if(oldHeight)c.style.minHeight=oldHeight+'px';
    let html='';
    if(reportPageIndex===0)html=identityPage();
    else if(reportPageIndex===1)html=mapPage();
    else if(reportPageIndex>=2&&reportPageIndex<=5)html=chapterPage(reportPageIndex-2);
    else html=sharePage();
    c.innerHTML=html;
    if(animate){c.classList.remove('page-enter');void c.offsetWidth;c.classList.add('page-enter')}
    c.style.minHeight='';

    $('#report-page-title').textContent=reportTabs[reportPageIndex];
    $('#report-page-count').textContent=`${reportPageIndex+1} / ${reportTabs.length}`;
    $('#report-page-progress').style.width=`${((reportPageIndex+1)/reportTabs.length)*100}%`;
    renderReportTabs();
    $('#report-page-dots').innerHTML=reportTabs.map((_,i)=>`<i class="${i===reportPageIndex?'active':''}"></i>`).join('');
    $('#report-prev-page').disabled=reportPageIndex===0;
    $('#report-next-page').textContent=reportPageIndex===reportTabs.length-1?'回到封面':'下一页 →';

    if(reportPageIndex===1){setTimeout(drawRadar,30);$('#radar-help').onclick=()=>$('#modal').classList.remove('hidden')}
    if(reportPageIndex===6){setTimeout(drawPoster,80);$('#save-poster').onclick=savePoster;$('#share-poster').onclick=sharePoster;$('#restart-btn').onclick=restart}
  }

  function goReportPage(next){
    if(next<0)return;
    if(next>=reportTabs.length){show('#screen-cover');return}
    reportPageIndex=next;
    renderReportPage(true);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function drawRadar(){
    const c=$('#radar');if(!c)return;
    const ctx=c.getContext('2d'),w=c.width,h=c.height,cx=w/2,cy=h/2+14,R=190,n=6;
    ctx.clearRect(0,0,w,h);ctx.lineWidth=1;ctx.strokeStyle='rgba(30,57,87,.14)';
    for(let ring=1;ring<=5;ring++){ctx.beginPath();for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n,r=R*ring/5,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.closePath();ctx.stroke()}
    for(let i=0;i<n;i++){const a=-Math.PI/2+i*2*Math.PI/n;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R);ctx.stroke()}
    const vals=dims.map(d=>(resultState.scores[d]+100)/200);
    ctx.beginPath();vals.forEach((v,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=R*(.18+.82*v),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.fillStyle='rgba(48,84,129,.23)';ctx.strokeStyle='#274e7a';ctx.lineWidth=3;ctx.fill();ctx.stroke();
    vals.forEach((v,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=R*(.18+.82*v),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.fillStyle='#d3a953';ctx.fill()});
    ctx.fillStyle='#243a59';ctx.font='600 23px system-ui,-apple-system,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    dims.forEach((d,i)=>{const a=-Math.PI/2+i*2*Math.PI/n,r=R+58,x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;ctx.fillText(dimLabels[d],x,y)});
  }

  function wrapText(ctx,text,x,y,maxWidth,lineHeight,maxLines=99){
    let line='',lines=[];for(const ch of [...text]){const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=ch}else line=test}if(line)lines.push(line);lines=lines.slice(0,maxLines);lines.forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));return y+lines.length*lineHeight;
  }

  async function drawPoster(){
    if(!resultState)return;
    const p=resultState.primary,c=$('#poster');if(!c)return;
    const ctx=c.getContext('2d'),W=c.width,H=c.height;
    const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#07152d');grad.addColorStop(.62,'#142b4b');grad.addColorStop(1,'#081326');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
    let seed=17;for(let i=0;i<110;i++){seed=(seed*9301+49297)%233280;const x=(seed/233280)*W;seed=(seed*9301+49297)%233280;const y=(seed/233280)*H*.75;const rr=.6+(seed/233280)*1.8;ctx.globalAlpha=.18+(seed/233280)*.6;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x,y,rr,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
    const img=new Image();img.src=heroPath(p);await new Promise(res=>{img.onload=res;img.onerror=res});
    ctx.save();ctx.beginPath();ctx.roundRect(70,100,760,400,38);ctx.clip();if(img.complete&&img.naturalWidth>0){const sw=img.naturalWidth,sh=img.naturalHeight,target=760/400;let sx=0,sy=0,sww=sw,shh=sh;if(sw/sh>target){sww=sh*target;sx=(sw-sww)/2}else{shh=sw/target;sy=(sh-shh)/2}ctx.drawImage(img,sx,sy,sww,shh,70,100,760,400)}ctx.restore();
    const shade=ctx.createLinearGradient(0,260,0,520);shade.addColorStop(0,'rgba(7,21,45,0)');shade.addColorStop(1,'rgba(7,21,45,.92)');ctx.fillStyle=shade;ctx.fillRect(70,230,760,290);
    ctx.textAlign='center';ctx.fillStyle='#d4def0';ctx.font='600 20px system-ui';ctx.fillText('奇 幻 灵 兽 图 鉴 · YOUR SOUL ARCHETYPE',W/2,70);
    ctx.fillStyle='#f5e4b7';ctx.font='700 64px serif';ctx.fillText(p.name,W/2,585);
    ctx.fillStyle='#d9e2ef';ctx.font='400 28px system-ui';ctx.fillText(p.subtitle,W/2,632);
    ctx.fillStyle='#adbed4';ctx.font='600 20px system-ui';ctx.fillText(p.keywords.join('  ·  '),W/2,680);
    ctx.strokeStyle='rgba(234,211,158,.33)';ctx.beginPath();ctx.moveTo(120,730);ctx.lineTo(780,730);ctx.stroke();
    ctx.fillStyle='#f0deb2';ctx.font='400 31px serif';ctx.textAlign='left';wrapText(ctx,'“'+p.quote+'”',120,810,660,46,3);
    ctx.fillStyle='#9badc5';ctx.font='400 20px system-ui';ctx.fillText(`伴生人格：${resultState.companion.name}`,120,1000);ctx.fillText(`主人格共鸣 ${resultState.similarity}%  ·  回答一致 ${resultState.consistency}%`,120,1040);
    ctx.strokeStyle='rgba(255,255,255,.09)';ctx.beginPath();ctx.moveTo(120,1080);ctx.lineTo(780,1080);ctx.stroke();
    ctx.fillStyle='#8295b0';ctx.textAlign='center';ctx.font='400 17px system-ui';ctx.fillText('人格是倾向，不是牢笼。把这张卡留给正在认识自己的你。',W/2,1130);ctx.fillStyle='#d3ae63';ctx.font='700 18px system-ui';ctx.fillText('YOUR SOUL · YOUR STORY',W/2,1173);
  }

  function canvasBlob(){return new Promise((res,rej)=>{const c=$('#poster');if(!c)return rej(new Error('海报尚未生成'));c.toBlob(blob=>blob?res(blob):rej(new Error('海报生成失败')),'image/png',.95)})}
  async function savePoster(){const blob=await canvasBlob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${resultState.primary.name}-灵兽身份卡.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500)}
  async function sharePoster(){
    const blob=await canvasBlob(),file=new File([blob],`${resultState.primary.name}-灵兽身份卡.png`,{type:'image/png'});
    if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){try{await navigator.share({title:'我的奇幻灵兽人格',text:`我是${resultState.primary.name}，你是哪一种？`,files:[file]});return}catch(e){if(e.name==='AbortError')return}}
    await savePoster();alert('当前浏览器不支持直接分享图片，已保存身份卡，可从相册或下载目录分享。');
  }

  function restart(){if(confirm('要清空本次结果并重新测试吗？')){answers=[];qIndex=0;resultState=null;clearProgress();show('#screen-cover');checkResume()}}

  $('#start-btn').onclick=()=>{answers=new Array(window.QUESTIONS.length).fill(null);qIndex=0;show('#screen-intro')};
  $('#resume-btn').onclick=()=>{const p=loadProgress();answers=p?.answers||new Array(window.QUESTIONS.length).fill(null);qIndex=Math.min(p?.qIndex||0,window.QUESTIONS.length-1);show('#screen-quiz');renderQuestion()};
  $('#enter-quiz-btn').onclick=()=>{show('#screen-quiz');renderQuestion()};
  $('#quiz-back').onclick=backQuestion;
  $('#open-report-btn').onclick=openReport;
  $('#report-home').onclick=()=>show('#screen-cover');
  $('#report-prev-page').onclick=()=>goReportPage(reportPageIndex-1);
  $('#report-next-page').onclick=()=>goReportPage(reportPageIndex+1);
  $('#modal-close').onclick=()=>$('#modal').classList.add('hidden');
  $('#modal').onclick=e=>{if(e.target.id==='modal')$('#modal').classList.add('hidden')};

  const reportScreen=$('#screen-report');
  reportScreen.addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0].clientX},{passive:true});
  reportScreen.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-touchStartX;if(Math.abs(dx)>70){if(dx<0)goReportPage(reportPageIndex+1);else goReportPage(reportPageIndex-1)}},{passive:true});

  if(window.APP_CONFIG?.accessCodeEnabled){
    const ok=sessionStorage.getItem('soul_access')==='ok'||new URLSearchParams(location.search).get('code')===window.APP_CONFIG.accessCode;
    if(!ok){const code=prompt('请输入购买后获得的访问码');if(code!==window.APP_CONFIG.accessCode){document.body.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;background:#0c1730;color:#fff;font-family:system-ui;padding:30px;text-align:center"><div><h2>访问码不正确</h2><p style="color:#9fb0c8">请使用购买后获得的正确链接或访问码。</p></div></div>';return}else sessionStorage.setItem('soul_access','ok')}
  }

  // 本地验收用：?demo=moon_fox 可直接查看任意结果分页，不影响普通用户。
  const demoId=new URLSearchParams(location.search).get('demo');
  if(demoId){
    const p=window.RESULTS.find(x=>x.id===demoId)||window.RESULTS[1];
    const c=window.RESULTS.find(x=>x.id!==(p?.id))||window.RESULTS[0];
    resultState={scores:Object.fromEntries(dims.map((d,i)=>[d,window.CENTERS[p.id][i]])),primary:p,companion:c,similarity:91,companionSimilarity:78,consistency:88};
    reportPageIndex=Math.min(6,Math.max(0,Number(new URLSearchParams(location.search).get('page')||0)));
    renderReportTabs();renderReportPage(false);show('#screen-report');
  }else checkResume();
})();
