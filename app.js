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
  const CHAPTERS=[['身份档案','WHO YOU ARE'],['日常偏好','YOUR PATTERN'],['别人眼中','FIRST IMPRESSION'],['内心与伴侣','INNER WORLD & LOVE'],['天赋能力','GIFT & WORK'],['成长与分享','GROWTH & SHARE']];
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const screens=$$('.screen');
  let qIndex=0,answers=[],resultState=null,choiceLocked=false,currentChapter=0,observer=null;
  const storeKey='fantasySoulAtlas_v4';

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
  function heroPath(p){return `assets/heroes/${p.id}.webp?v=4.0`}
  function shareArtPath(p){return `assets/share_art/${p.id}.webp?v=4.0`}
  function resultThumb(p){return `assets/results/${p.id}.webp?v=4.0`}

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
  function clarityInfo(ranked){const gap=ranked[0].fit-ranked[1].fit;if(gap>.055)return {label:'非常清晰',note:'主人格特征很集中，和其他人格拉开了明显距离。'};if(gap>.025)return {label:'较清晰',note:'主人格很鲜明，同时也能看见清楚的第二人格。'};return {label:'双面型',note:'主人格和第二人格都很鲜明，你会随情境切换不同的一面。'}}
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
  function runAnalysis(){let n=10;const t=setInterval(()=>{n=Math.min(100,n+Math.ceil(Math.random()*9));$('#analysis-bar').style.width=n+'%';$('#analysis-percent').textContent=n+'%';if(n>30){$('#a-step-2').classList.add('done');$('#a-step-2 span').textContent='✓';$('#analysis-status').textContent='正在计算方向相似度与六维距离……'}if(n>57){$('#a-step-3').classList.add('done');$('#a-step-3 span').textContent='✓';$('#analysis-status').textContent='正在寻找你隐藏的另一面……'}if(n>82){$('#a-step-4').classList.add('done');$('#a-step-4 span').textContent='✓';$('#analysis-status').textContent='正在生成你的完整图鉴……'}if(n===100){clearInterval(t);setTimeout(revealResult,400)}},170)}
  function revealResult(){const r=resultState,p=r.primary;$('#reveal-image').src=shareArtPath(p);$('#reveal-image').onerror=()=>{$('#reveal-image').src=resultThumb(p)};$('#reveal-name').textContent=p.name;$('#reveal-subtitle').textContent=p.subtitle;$('#reveal-keywords').innerHTML=p.keywords.map(k=>`<span>${k}</span>`).join('');$('#reveal-quote').textContent='“'+p.quote+'”';$('#reveal-clarity').textContent=r.clarity.label;$('#reveal-clarity-note').textContent=r.clarity.note;$('#reveal-stability').textContent=r.stability.label;$('#reveal-stability-note').textContent=r.stability.note;$('#reveal-tendencies').innerHTML=topTendencies(r.scores).map(x=>`<span>${x}</span>`).join('');show('#screen-reveal')}

  function readingHTML(text){return text.split(/\n\n+/).map(p=>`<p>${p}</p>`).join('')}
  function chapterHead(i,title,eng){return `<div class="chapter-head"><div class="chapter-num">${String(i+1).padStart(2,'0')}</div><div><small>${eng}</small><h2>${title}</h2></div></div>`}
  function nextBtn(i){return i<CHAPTERS.length-1?`<div class="chapter-nav-inline"><button data-next="${i+1}">下一章 · ${CHAPTERS[i+1][0]} →</button></div>`:''}
  function axisLevel(v,inf){if(v>58)return `明显偏向 ${inf.right}`;if(v>22)return `略偏向 ${inf.right}`;if(v<-58)return `明显偏向 ${inf.left}`;if(v<-22)return `略偏向 ${inf.left}`;return '两种方式都常用'}
  function axisRows(scores){return DIMS.map(d=>{const inf=DIM_INFO[d],v=scores[d],pos=Math.max(4,Math.min(96,(v+100)/2));return `<div class="axis-row"><div class="axis-top"><div class="axis-name"><b>${inf.name}</b><small>${inf.left} ↔ ${inf.right}</small></div><div class="axis-result">${axisLevel(v,inf)}</div></div><div class="axis-bar"><i class="axis-marker" style="left:${pos}%"></i></div><p>${v>=0?inf.pos:inf.neg}</p></div>`}).join('')}
  function excerpt(text,max=150){const clean=(text||'').replace(/\s+/g,' ').trim();return clean.length>max?clean.slice(0,max-1)+'…':clean}
  function relationshipInsights(primary,partner){
    const a=window.CENTERS[primary.id],b=window.CENTERS[partner.id],out=[];
    const af=a[2],bf=b[2],ab=a[3],bb=b[3],ao=a[4],bo=b[4];
    if(af>20&&bf>20)out.push('你们都很看重情绪回应，容易察觉对方语气和状态的变化。');
    else if(af<-20&&bf<-20)out.push('你们都偏向把事情讲清楚，遇到问题更愿意一起找解决办法。');
    else out.push(af>bf?'你更重感受，TA更擅长把问题理清，彼此能补上对方容易忽略的一面。':'TA更重感受，你更擅长把问题理清，关系里容易形成温度与清晰度的互补。');
    if(Math.abs(ab-bb)<45)out.push(ab>15?'你们对个人空间的需求接近，亲密也不必牺牲各自的自由。':'你们都重视陪伴和共同参与，关系容易通过“我们一起”逐渐变深。');
    else out.push(ab>bb?'你更需要空间，TA更擅长主动连接；把边界说清后，这种差异反而会形成稳定节奏。':'TA更需要空间，你更擅长主动连接；给彼此可预期的靠近与独处，会更舒服。');
    if(Math.abs(ao-bo)<45)out.push(ao>15?'你们都喜欢有计划的相处，承诺、时间和安排说清楚会很安心。':'你们都比较灵活，临时起意和共同探索会给关系带来很多活力。');
    else out.push(ao>bo?'你更喜欢确定感，TA更灵活；一个稳住节奏，一个带来新鲜感。':'TA更喜欢确定感，你更灵活；一个提供稳定，一个让关系保持流动。');
    return out;
  }
  function shareCardHTML(p,s){return `<div class="share-card-preview" id="share-card-preview"><div class="share-card-art"><img src="${shareArtPath(p)}" alt="${p.name}无文字奇幻插画"></div><div class="share-card-body"><small>奇幻灵兽图鉴 · MY SOUL ARCHETYPE</small><h3>${p.name}</h3><p class="share-sub">${p.subtitle}</p><div class="share-keywords">${p.keywords.slice(0,4).map(k=>`<span>${k}</span>`).join('')}</div><blockquote>“${p.quote}”</blockquote><div class="share-second"><span>我的另一面</span><b>${s.name}</b><em>${s.keywords.slice(0,3).join(' · ')}</em></div><div class="share-footer">36 个生活场景生成 · 结果仅用于趣味自我探索</div></div></div><button id="generate-share-card" class="share-generate-btn">生成高清人格卡并保存</button>`}
  function roundedRect(ctx,x,y,w,h,r){const rr=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+rr,y);ctx.arcTo(x+w,y,x+w,y+h,rr);ctx.arcTo(x+w,y+h,x,y+h,rr);ctx.arcTo(x,y+h,x,y,rr);ctx.arcTo(x,y,x+w,y,rr);ctx.closePath()}
  function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines=4){const chars=[...text];let line='',lines=[];for(const ch of chars){const test=line+ch;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=ch;if(lines.length===maxLines-1)break}else line=test}if(line&&lines.length<maxLines)lines.push(line);if(lines.join('').length<text.length)lines[lines.length-1]=lines[lines.length-1].replace(/…?$/,'…');lines.forEach((ln,i)=>ctx.fillText(ln,x,y+i*lineHeight));return y+lines.length*lineHeight}
  function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
  async function generateShareCard(){
    const {primary:p,secondary:s}=resultState;if(!p)return;
    const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;const ctx=canvas.getContext('2d');
    const bg=ctx.createLinearGradient(0,0,0,1920);bg.addColorStop(0,'#07162c');bg.addColorStop(.56,'#102947');bg.addColorStop(1,'#f3e9d7');ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);
    for(let i=0;i<50;i++){ctx.fillStyle=`rgba(244,217,155,${0.08+(i%5)*0.025})`;ctx.beginPath();ctx.arc((i*137)%1080,(i*83)%720,1+(i%3),0,Math.PI*2);ctx.fill()}
    const img=await loadImage(shareArtPath(p));const x=54,y=70,w=972,h=720;ctx.save();roundedRect(ctx,x,y,w,h,48);ctx.clip();const scale=Math.max(w/img.width,h/img.height),dw=img.width*scale,dh=img.height*scale;ctx.drawImage(img,x+(w-dw)/2,y+(h-dh)/2,dw,dh);const ov=ctx.createLinearGradient(0,y+360,0,y+h);ov.addColorStop(0,'rgba(7,22,44,0)');ov.addColorStop(1,'rgba(7,22,44,.84)');ctx.fillStyle=ov;ctx.fillRect(x,y,w,h);ctx.restore();
    ctx.fillStyle='#f0d69c';ctx.font='600 27px "Microsoft YaHei","PingFang SC",sans-serif';ctx.fillText('奇幻灵兽图鉴 · MY SOUL ARCHETYPE',82,850);
    ctx.fillStyle='#ffffff';ctx.font='700 92px "Noto Serif SC","Songti SC","SimSun",serif';ctx.fillText(p.name,82,970);
    ctx.fillStyle='#c8d5e6';ctx.font='36px "Microsoft YaHei","PingFang SC",sans-serif';wrapCanvasText(ctx,p.subtitle,82,1035,910,52,2);
    let chipX=82,chipY=1138;ctx.font='30px "Microsoft YaHei","PingFang SC",sans-serif';for(const k of p.keywords.slice(0,4)){const tw=ctx.measureText(k).width+54;ctx.fillStyle='rgba(255,255,255,.08)';roundedRect(ctx,chipX,chipY,tw,58,29);ctx.fill();ctx.strokeStyle='rgba(239,211,151,.45)';ctx.stroke();ctx.fillStyle='#f7ead0';ctx.fillText(k,chipX+27,chipY+39);chipX+=tw+18}
    ctx.fillStyle='#f0d69c';ctx.font='italic 41px "Noto Serif SC","Songti SC","SimSun",serif';const qEnd=wrapCanvasText(ctx,'“'+p.quote+'”',82,1280,910,62,3);
    const boxY=Math.max(qEnd+55,1480);ctx.fillStyle='rgba(7,22,44,.88)';roundedRect(ctx,70,boxY,940,245,36);ctx.fill();ctx.fillStyle='#91a8c6';ctx.font='28px "Microsoft YaHei","PingFang SC",sans-serif';ctx.fillText('我的另一面',105,boxY+58);ctx.fillStyle='#ffffff';ctx.font='700 55px "Noto Serif SC","Songti SC","SimSun",serif';ctx.fillText(s.name,105,boxY+126);ctx.fillStyle='#e5c984';ctx.font='29px "Microsoft YaHei","PingFang SC",sans-serif';ctx.fillText(s.keywords.slice(0,3).join(' · '),105,boxY+182);
    ctx.fillStyle='#635c50';ctx.font='25px "Microsoft YaHei","PingFang SC",sans-serif';ctx.fillText('36 个生活场景生成 · 结果仅用于趣味自我探索',82,1850);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png',1));const url=URL.createObjectURL(blob);const out=$('#share-generated-image'),link=$('#share-download-link');out.src=url;link.href=url;link.download=`奇幻灵兽图鉴_${p.name}.png`;$('#share-modal').classList.remove('hidden');
  }
  function renderReport(){
    const r=resultState,p=r.primary,s=r.secondary,partner=r.partner,matchNotes=relationshipInsights(p,partner);
    const html=`
      <section class="report-section" data-chapter="0" id="chapter-0"><div class="section-art"><img src="${shareArtPath(p)}" alt="${p.name}奇幻插画"></div><div class="section-body">${chapterHead(0,'你的灵兽身份档案','SOUL PROFILE')}<div class="profile-name"><h1>${p.name}</h1><p>${p.subtitle}</p><div class="chips">${p.keywords.map(k=>`<span>${k}</span>`).join('')}</div></div><blockquote class="profile-quote">“${p.quote}”</blockquote><div class="identity-list"><div><span>代表元素</span><b>${p.element}</b></div><div><span>灵魂颜色</span><b>${p.color}</b></div><div><span>幸运物</span><b>${p.lucky}</b></div><div><span>人格轮廓</span><b>${r.clarity.label}</b></div><div class="wide"><span>隐藏能力</span><b>${p.ability}</b></div></div><div class="insight-box"><small>你身上最鲜明的三种倾向</small>${topTendencies(r.scores).map(x=>`<div>✦ ${x}</div>`).join('')}</div>${nextBtn(0)}</div></section>
      <section class="report-section" data-chapter="1" id="chapter-1"><div class="section-body">${chapterHead(1,'你的六种日常反应偏好','YOUR PATTERN')}<p class="axis-intro">这六项没有高低好坏，只是在描述你更顺手的反应方式。圆点靠近哪一端，表示你在多数情境里更自然地使用那种方式；靠近中间，则说明两种方式你都会用。</p><div class="axis-list">${axisRows(r.scores)}</div><div class="secondary-card"><img src="${shareArtPath(s)}" alt="${s.name}无文字奇幻插画"><div><small>第二人格 · 你的另一面</small><h3>${s.name}</h3><p>${s.subtitle}</p><div class="mini-chips">${s.keywords.slice(0,4).map(k=>`<span>${k}</span>`).join('')}</div><span class="why">${excerpt(s.core,150)}</span></div></div>${nextBtn(1)}</div></section>
      <section class="report-section" data-chapter="2" id="chapter-2"><div class="section-body">${chapterHead(2,'别人眼中的你','FIRST IMPRESSION')}<div class="reading-text">${readingHTML(p.pages[0].text)}</div>${nextBtn(2)}</div></section>
      <section class="report-section" data-chapter="3" id="chapter-3"><div class="section-body">${chapterHead(3,'你的内心世界与亲密关系','INNER WORLD & LOVE')}<div class="reading-text">${readingHTML(p.pages[1].text)}</div><div class="partner-card partner-rich"><img src="${shareArtPath(partner)}" alt="${partner.name}无文字奇幻插画"><div class="partner-main"><small>与你更容易合拍的伴侣人格</small><h3>${partner.name}</h3><p class="partner-sub">${partner.subtitle}</p><div class="mini-chips">${partner.keywords.slice(0,4).map(k=>`<span>${k}</span>`).join('')}</div></div><div class="partner-detail"><b>TA 是怎样的人</b><p>${excerpt(partner.core,170)}</p></div><div class="partner-detail"><b>TA 在关系里的样子</b><p>${excerpt(partner.relation,150)}</p></div><div class="partner-detail"><b>你们更容易合拍的地方</b><ul>${matchNotes.map(x=>`<li>${x}</li>`).join('')}</ul></div></div>${nextBtn(3)}</div></section>
      <section class="report-section" data-chapter="4" id="chapter-4"><div class="section-body">${chapterHead(4,'你的天赋能力与工作能量','GIFT & WORK')}<div class="reading-text">${readingHTML(p.pages[2].text)}</div>${nextBtn(4)}</div></section>
      <section class="report-section" data-chapter="5" id="chapter-5"><div class="section-body">${chapterHead(5,'你的成长路线与专属卡片','GROWTH & SHARE')}<div class="reading-text">${readingHTML(p.pages[3].text)}</div><div class="actions-card"><b>接下来可以尝试的三件事</b><ol>${p.actions.map(x=>`<li>${x}</li>`).join('')}</ol></div><div class="quotes">${p.shareQuotes.slice(0,4).map(q=>`<blockquote>“${q}”</blockquote>`).join('')}</div><div class="share-zone"><div class="share-zone-title"><small>MY SOUL CARD</small><h3>把你的灵兽人格收藏下来</h3><p>卡片采用无文字奇幻插画，名称、关键词和判词由网页清晰排版，可生成一张手机屏幕比例的高清 PNG。</p></div>${shareCardHTML(p,s)}</div><div class="final-note">人格是倾向，不是牢笼。不同阶段重新作答，也可能看见新的自己。</div></div></section>`;
    $('#report-content').innerHTML=html;
    $$('[data-next]').forEach(b=>b.onclick=()=>goChapter(+b.dataset.next));
    $('#generate-share-card').onclick=generateShareCard;
    buildToc();setupObserver();setCurrentChapter(0);
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
  $('#open-toc').onclick=()=>$('#toc-sheet').classList.remove('hidden');$('#close-toc').onclick=closeToc;$('#toc-sheet').onclick=e=>{if(e.target.id==='toc-sheet')closeToc()};
  $('#prev-chapter').onclick=()=>goChapter(currentChapter-1);$('#next-chapter').onclick=()=>goChapter(currentChapter+1);
  $('#close-share').onclick=()=>$('#share-modal').classList.add('hidden');$('#share-modal').onclick=e=>{if(e.target.id==='share-modal')$('#share-modal').classList.add('hidden')};

  if(window.APP_CONFIG?.accessCodeEnabled){const ok=sessionStorage.getItem('soul_access')==='ok'||new URLSearchParams(location.search).get('code')===window.APP_CONFIG.accessCode;if(!ok){const code=prompt('请输入购买后获得的访问码');if(code!==window.APP_CONFIG.accessCode){document.body.innerHTML='<div style="min-height:100vh;display:grid;place-items:center;background:#07162c;color:white;font-family:system-ui;padding:30px;text-align:center"><div><h2>访问码不正确</h2><p>请使用购买后获得的正确链接或访问码。</p></div></div>';return}else sessionStorage.setItem('soul_access','ok')}}

  const params=new URLSearchParams(location.search),demoId=params.get('demo'),revealId=params.get('reveal');
  if(demoId||revealId){const p=window.RESULTS.find(x=>x.id===(demoId||revealId))||window.RESULTS[0],u=window.CENTERS[p.id];const ranked=window.RESULTS.map(x=>({p:x,fit:archetypeFit(u,x)})).sort((a,b)=>b.fit-a.fit);const raw=Object.fromEntries(DIMS.map(d=>[d,[1,1,1,1,1,1]]));resultState={scores:Object.fromEntries(DIMS.map((d,i)=>[d,u[i]])),raw,ranked,primary:p,secondary:ranked.find(x=>x.p.id!==p.id).p,partner:relationshipMatch(p),clarity:{label:'较清晰',note:'主人格很鲜明，同时也能看见清楚的第二人格。'},stability:{label:'较稳定',note:'不同场景里的选择方向比较一致。'}};if(revealId)revealResult();else openReport()}else checkResume();
})();
