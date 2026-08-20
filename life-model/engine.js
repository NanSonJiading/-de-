(()=>{
  const D=window.QIDI_DATA;
  const F=D.fields;
  const MODS=['A','B','C','D','E','F','G','H'];
  const KEY='qidi-life-v12-scenario';
  const $=id=>document.getElementById(id);
  const show=id=>{
    ['start','question','processing','report'].forEach(x=>$(x).classList.toggle('active',x===id));
    window.scrollTo(0,0);
  };

  const v12Style=document.createElement('style');
  v12Style.textContent=`
    .optcopy{display:flex;flex-direction:column;gap:4px;flex:1;min-width:0}
    .opttitle{font-size:14px;line-height:1.45;color:#303a4d;font-weight:760}
    .optdetail{display:block;font-size:12px;line-height:1.55;color:#8a95a8;font-weight:450}
    .rank{flex:0 0 auto;font-size:10px;font-weight:760;color:#7888a6;background:#edf2fb;padding:4px 7px;border-radius:999px;min-width:0}
    .rank:empty{display:none}
    .opt.selected .rank{display:inline-block;background:linear-gradient(110deg,#e5faff,#eeeaff,#ffeafa);color:#6f6fb2}
    .specialopt{background:rgba(247,249,253,.66);border-style:dashed}
    .specialopt .opttitle{color:#657186}
    .specialopt .optdetail{color:#9aa3b1}
  `;
  document.head.appendChild(v12Style);

  const qmap={};
  [...D.seeds,...D.primary,...D.validation,...D.disc].forEach(q=>qmap[q.id]=q);
  const primByMod=Object.fromEntries(MODS.map(m=>[m,D.primary.filter(q=>q.module===m)]));
  const valByMod=Object.fromEntries(MODS.map(m=>[m,D.validation.filter(q=>q.module===m)]));

  const fresh=()=>({answers:[],route:{},evidence:{},states:{},anchor:{},asked:[],current:null,finished:false,boundaries:[],disconfirmed:[],created:Date.now()});
  let S=fresh();
  let sel=[];

  function save(){ localStorage.setItem(KEY,JSON.stringify(S)); }
  function load(){
    try{ const x=JSON.parse(localStorage.getItem(KEY)); if(x&&Array.isArray(x.answers)){ S=x; return true; } }catch(e){}
    return false;
  }
  function toast(t){ $('toast').textContent=t; $('toast').classList.add('show'); setTimeout(()=>$('toast').classList.remove('show'),1500); }
  function displayText(o){ return [o.title||o.text,o.detail].filter(Boolean).join('｜'); }
  function addRoute(f,w=1){ if(F[f]) S.route[f]=(S.route[f]||0)+w; }
  function addEv(f,qid,w=1,kind='support'){
    if(!F[f])return;
    S.evidence[f]=S.evidence[f]||[];
    S.evidence[f].push({qid,w,kind});
    updateField(f);
  }
  function updateField(f){
    const a=S.evidence[f]||[];
    const sup=a.filter(x=>x.kind==='support').length;
    const ref=a.filter(x=>x.kind==='refute').length;
    let st=S.states[f]||((S.route[f]||0)>0?'ROUTED':'UNSEEN');
    if(ref&&sup===0) st='DISCONFIRMED';
    else if(ref&&sup) st='MIXED';
    else if(sup>=2) st='SUPPORTED';
    else if(sup===1) st='CANDIDATE';
    else if((S.route[f]||0)>0) st='ROUTED';
    S.states[f]=st;
    if(st==='DISCONFIRMED'&&!S.disconfirmed.includes(f)) S.disconfirmed.push(f);
  }

  function apply(q,ids,persist=true){
    const os=ids.map(id=>q.options.find(o=>o.id===id)).filter(Boolean);
    S.asked.push(q.id);
    S.answers.push({qid:q.id,selected:[...ids],texts:os.map(displayText),stage:q.stage,module:q.module});

    const boundary=os.find(o=>o.special==='boundary');
    if(boundary) S.boundaries.push({qid:q.id,module:q.module,text:displayText(boundary)});

    if(q.stage==='seed'){
      const rankWeights=[1,.5,.25];
      os.forEach((o,idx)=>{
        if(o.special)return;
        const w=rankWeights[idx]??.25;
        (o.routes||[]).forEach(f=>addRoute(f,w));
      });
    }else{
      os.forEach(o=>{ if(!o.special)(o.routes||[]).forEach(f=>addEv(f,q.id,1,'support')); });
      if(q.stage==='primary') S.anchor[q.module]=true;
      if(q.stage==='validation'){
        const targets=new Set(q.options.flatMap(o=>o.routes||[]));
        const chosen=new Set(os.flatMap(o=>o.routes||[]));
        targets.forEach(f=>{ if(!chosen.has(f)&&S.states[f]==='CANDIDATE') addEv(f,q.id,1,'refute'); });
      }
      if(q.stage==='discriminator'){
        const all=new Set(q.options.flatMap(o=>o.routes||[]));
        const chosen=new Set(os.flatMap(o=>o.routes||[]));
        all.forEach(f=>{ if(!chosen.has(f)&&['CANDIDATE','ROUTED'].includes(S.states[f])) addEv(f,q.id,1,'refute'); });
      }
    }
    if(persist) save();
  }

  function replay(){ const ans=[...S.answers]; S=fresh(); ans.forEach(a=>apply(qmap[a.qid],a.selected,false)); S.current=nextQuestion()?.id||null; save(); }
  function unanswered(list){ return list.filter(q=>!S.asked.includes(q.id)); }
  function scoreQ(q){ const routes=new Set(q.options.flatMap(o=>o.routes||[])); let s=0; routes.forEach(f=>s+=(S.route[f]||0)+(S.states[f]==='ROUTED'?1:0)); return s; }
  function bestPrimary(m){ const list=unanswered(primByMod[m]); if(!list.length)return null; return list.sort((a,b)=>scoreQ(b)-scoreQ(a))[0]; }
  function hasSignal(tag){
    const text=Object.entries(S.route).filter(([,v])=>v>0).map(([f])=>f).join(' ')+' '+Object.keys(S.states).join(' ');
    const rules={auto:/E2\.1|F1\.1|G7\.5/,identity:/G3\.7|G5\.2|G7\.1|G8\.3|G8\.7/,info:/H2\.1|C7\.2/,responsibility:/D7\.|F9\.7|G7\.7|H9\.5/,cooperation:/A4\.|D4\.3|F2\.5|H8\.4/,ethics:/F8\.5|F9\.7/,recognition:/E6\.3|D1\.1|F8\.5|G5\.2/,control:/E1\.5|H9\.1|C2\.2|D3\.2/,decision:/C7\.|D2\.2|E1\.5|H2\.1|H9\.1/,dependence:/D3\.2|D4\.5|E2\.1|G7\.5/,work:/F4\.1|E5\.3|G5\.2|G7\.7|H9\.4/,prove:/D1\.1|E6\.3|G8\.5|H9\.4/};
    return (rules[tag]||/$^/).test(text);
  }
  function unresolvedCompetition(){ return D.disc.find(q=>!S.asked.includes(q.id)&&q.tags.some(hasSignal))||null; }
  function supported(){ return Object.keys(S.states).filter(f=>S.states[f]==='SUPPORTED'); }
  function candidates(){ return Object.keys(S.states).filter(f=>['CANDIDATE','MIXED'].includes(S.states[f])); }

  function nextQuestion(){
    if(S.finished)return null;
    const i=S.answers.length;
    if(i<D.seeds.length) return D.seeds[i];
    for(const m of MODS) if(!S.anchor[m]) return bestPrimary(m)||unanswered(primByMod[m])[0];
    const disc=unresolvedCompetition();
    if(disc&&i<36)return disc;
    for(const f of candidates()){
      const m=F[f]?.[0];
      const v=unanswered(valByMod[m]||[]).find(q=>q.options.some(o=>(o.routes||[]).includes(f)));
      if(v)return v;
    }
    if(i<28){
      const v=MODS.flatMap(m=>unanswered(valByMod[m]||[]))[0];
      if(v)return v;
      const p=MODS.flatMap(m=>unanswered(primByMod[m]||[])).sort((a,b)=>scoreQ(b)-scoreQ(a))[0];
      if(p)return p;
    }
    if(i>=28){
      const sup=supported().length,unres=!!unresolvedCompetition();
      if(sup>=4&&!unres)return null;
      if(i>=34&&!unres)return null;
      if(i>=40)return null;
    }
    return MODS.flatMap(m=>unanswered(valByMod[m]||[])).find(Boolean)||unanswered(D.disc)[0]||null;
  }

  function progress(){ const n=S.answers.length; if(n<16)return 5+n/16*38; if(n<24)return 43+(n-16)/8*27; return Math.min(96,70+(n-24)*2.2); }
  function optionMarkup(o,i){
    const title=o.title||o.text,detail=o.detail||'';
    return `<span class="badge">${String.fromCharCode(65+i)}</span><span class="optcopy"><strong class="opttitle">${title}</strong>${detail?`<small class="optdetail">${detail}</small>`:''}</span><span class="rank"></span>`;
  }
  function refreshSelection(q){
    [...$('opts').children].forEach((node,j)=>{
      const id=q.options[j].id,idx=sel.indexOf(id);
      node.classList.toggle('selected',idx>=0);
      const r=node.querySelector('.rank');
      if(r)r.textContent=idx<0?'':idx===0?'最像':idx===1?'其次':'也像';
    });
    $('next').disabled=sel.length===0;
  }

  function render(q){
    S.current=q.id; save(); sel=[];
    $('stage').textContent=q.stage==='seed'?`生活场景 · ${D.mods[q.module]}`:q.stage==='primary'?`深入理解 · ${D.mods[q.module]}`:q.stage==='validation'?`换个场景再看看 · ${D.mods[q.module]}`:'区分可能原因';
    $('qtext').textContent=q.text;
    $('hint').textContent=q.stage==='seed'&&q.selectionMode==='ranked'?'先选最像你的一个；如果还有，也可以再选 1—2 个。选择顺序会体现“最像 / 其次 / 也像”。':q.maxSelect>1?`最多选择 ${q.maxSelect} 项。选更接近真实反应的，不需要选“更好的答案”。`:'请选择最接近你真实反应的一项。';
    $('pcount').textContent=`已完成 ${S.answers.length} 题`;
    $('bar').style.width=progress()+'%';
    const est=S.answers.length<16?'先完成生活场景扫描':S.answers.length<24?'约还需 10–16 题':S.answers.length<28?'约还需 5–10 题':'正在判断信息是否已经足够';
    $('ptext').textContent=`正在形成你的基础模型 · ${est}`;
    $('opts').innerHTML='';
    q.options.forEach((o,i)=>{
      const b=document.createElement('button');
      b.className='opt'+(o.special?' specialopt':'');
      b.innerHTML=optionMarkup(o,i);
      b.onclick=()=>{
        if(sel.includes(o.id)){ sel=sel.filter(x=>x!==o.id); refreshSelection(q); return; }
        if(o.special){ sel=[o.id]; refreshSelection(q); return; }
        sel=sel.filter(id=>!q.options.find(x=>x.id===id)?.special);
        if(q.maxSelect===1) sel=[o.id];
        else if(sel.length<q.maxSelect) sel.push(o.id);
        else return toast(`这题最多记录 ${q.maxSelect} 个反应，请保留最像你的几个`);
        refreshSelection(q);
      };
      $('opts').appendChild(b);
    });
    $('next').disabled=true;
    show('question');
  }

  function goNext(){ const q=qmap[S.current]; if(!q||!sel.length)return; apply(q,sel); const n=nextQuestion(); if(n)render(n); else finish(); }
  function back(){
    if(!S.answers.length){show('start');return;}
    const a=S.answers.pop(),target=qmap[a.qid];
    replay(); S.current=target.id; sel=[...a.selected]; save(); render(target);
    setTimeout(()=>{sel=[...a.selected];refreshSelection(target);},0);
  }
  function start(){ S=fresh();save();render(D.seeds[0]); }
  function resume(){ if(!load())return start(); if(S.finished){showReport();return;} const q=nextQuestion(); if(q)render(q); else finish(); }

  function topFields(m,n=3){ return Object.keys(S.states).filter(f=>F[f]?.[0]===m&&['SUPPORTED','CANDIDATE','MIXED'].includes(S.states[f])).sort((a,b)=>((S.states[b]==='SUPPORTED'?3:1)+(S.evidence[b]?.length||0))-((S.states[a]==='SUPPORTED'?3:1)+(S.evidence[a]?.length||0))).slice(0,n); }
  const label=f=>F[f]?F[f][1]:f;
  function stateChip(f){ const st=S.states[f]; return st==='SUPPORTED'?['较稳定候选','ok']:st==='MIXED'?['存在差异，需看场景','pending']:['仍需验证','pending']; }
  function chainCandidates(){
    const a=[],has=x=>x.some(f=>['SUPPORTED','CANDIDATE'].includes(S.states[f]));
    if(has(['C7.2','C7.3','C8.5','D2.2','E1.5','H2.1','H9.1']))a.push(['遇到不确定','比较 / 形成判断','可能出现不安或挫败','搜集信息 / 开始行动','根据反馈继续调整']);
    if(has(['A4.2','D4.3','E3.2','F2.5','B5.1','H7.1','H8.4']))a.push(['关系出现分歧','理解双方 / 判断关系影响','关系受伤或失落','合作整合 / 寻求支持','必要时重新协商']);
    if(has(['F4.1','E5.3','G5.2','G7.7','H9.4']))a.push(['目标或事业受阻','效能 / 成就 / 贡献被触发','可能出现挫败','增加投入或工作','通过结果重新获得稳定']);
    if(has(['E2.1','F1.1','G7.5']))a.push(['重要选择出现','判断自主是否值得保护','现实收益与自主发生交换','保留或让出部分选择权','形成自己的取舍边界']);
    if(has(['G7.1','G8.3','G8.7']))a.push(['外部角色发生变化','回到原则 / 成长 / 连续性','重新确认“我是谁”','继续创造和选择','维持身份连续性']);
    while(a.length<3)a.push(['遇到重要事件','先形成当前理解','情绪被激活','调用熟悉的应对方式','根据结果再次更新']);
    return a.slice(0,3);
  }
  function escapeHtml(s){return String(s).replace(/[&<>]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[x]));}

  function reportHTML(){
    const sup=supported(),cand=candidates(),strongest=MODS.map(m=>topFields(m,2)[0]).filter(Boolean),intro=strongest.slice(0,4).map(label).join('、')||'目前仍在形成中的若干线索';
    const modules=MODS.map(m=>{const fs=topFields(m);if(!fs.length)return `<div class="mtile"><b>${m} · ${D.mods[m]}</b><small>当前证据</small><div class="finding">暂未形成稳定结论</div><span class="status pending">继续观察</span></div>`;const f=fs[0],c=stateChip(f);return `<div class="mtile"><b>${m} · ${D.mods[m]}</b><small>${F[f][2]}</small><div class="finding">${fs.map(label).join(' · ')}</div><span class="status ${c[1]}">${c[0]}</span></div>`;}).join('');
    const chains=chainCandidates().map((c,i)=>`<div class="chain"><b>运行链 ${i+1}</b><div class="steps">${c.map((x,j)=>`<span class="step">${x}</span>${j<c.length-1?'<span class="arr">→</span>':''}`).join('')}</div></div>`).join('');
    const needs=topFields('E').map(label),values=topFields('F').map(label),ids=topFields('G').map(label),emos=topFields('B').map(label),cop=topFields('H').map(label),dis=S.disconfirmed.map(f=>`${f} ${label(f)}`).join('、')||'暂无明确撤销假设';
    const boundaryText=S.boundaries.length?S.boundaries.map(x=>x.text).join('；'):'本轮尚未明确记录强场景边界。';
    const evidence=Object.entries(S.evidence).map(([f,a])=>`${f} ${label(f)}｜${S.states[f]}｜证据 ${a.map(x=>x.qid).join(', ')}`).join('\n');
    return `<div class="rhero"><span class="rchip">生活场景问卷 V1.2 · 模型引擎 V1.1</span><h1>你的生命结构，<br>正在呈现出自己的连接方式。</h1><p>本次共完成 ${S.answers.length} 道动态问题。结果不会把你归入固定类型，而是保留当前证据最支持的结构、场景边界与仍待验证的部分。</p></div><div class="card"><h3>当前总览</h3><div class="sub">不是“你是什么人”，而是当前哪些机制更值得继续理解。</div><div class="block"><p>目前较有解释力的线索集中在 <b>${intro}</b>。前16道生活场景题只决定后面问什么，不直接作为人物结论。</p><p>如果同一个行为可以由不同原因解释，系统会保留并存或待验证，而不是为了得到一个简单标签强行归因。</p></div></div><div class="card"><h3>A—H 八个基础系统</h3><div class="sub">每个模块只显示当前真正有证据的节点。</div><div class="modules">${modules}</div></div><div class="card"><h3>三条更值得关注的运行链</h3><div class="sub">把内部结构还原成“事情怎样一步步进入反应和行为”的过程。</div>${chains}</div><div class="card"><h3>核心需求与价值取舍</h3><div class="block"><h4>什么更容易影响你的状态</h4><p>${needs.length?needs.join('、'):'目前还没有足够证据确定核心需求排序。'}</p></div><div class="block"><h4>冲突时更愿意保护什么</h4><p>${values.length?values.join('、'):'目前还没有足够证据确定价值排序。'}。需求回答“缺什么会影响状态”，价值回答“冲突时愿意为谁承担代价”。</p></div></div><div class="card"><h3>自我认同与身份连续性</h3><div class="block"><p>${ids.length?`当前身份候选更集中在：${ids.join('、')}。`:'当前尚不足以判断哪些内容真正进入了你的核心自我定义。'}</p></div></div><div class="card"><h3>情绪与调节应对</h3><div class="block"><h4>更容易被激活的情绪节点</h4><p>${emos.length?emos.join('、'):'当前尚未形成稳定的高显著情绪结论。'}</p></div><div class="block"><h4>状态失衡后常调用的方式</h4><p>${cop.length?cop.join('、'):'当前尚未形成稳定的调节应对结论。'}。应对不会简单被分成“好 / 坏”，更重要的是它在什么场景有用、长期是否产生代价。</p></div></div><div class="card"><h3>场域差异与稳定资源</h3><div class="block"><h4>本轮出现的“要看情况”</h4><p>${boundaryText}</p></div><div class="block"><h4>已经存在的资源</h4><ul>${sup.length?sup.slice(0,6).map(f=>`<li>${label(f)}：当前已有至少两条独立问卷证据支持。</li>`).join(''):'<li>本次问卷尚不足以把某一节点提升为较稳定候选。</li>'}</ul></div></div><div class="card"><h3>待验证与被撤销的假设</h3><div class="block"><h4>仍需继续验证</h4><p>${cand.length?cand.slice(0,8).map(f=>label(f)).join('、'):'目前主要候选已基本收敛。'}</p></div><div class="block"><h4>系统已经主动撤销</h4><p>${dis}</p></div></div><div class="card research"><h3>研究模式</h3><div class="sub">用于内部复盘：题目、回答、字段状态与撤销记录。</div><details><summary>展开证据记录</summary><pre>${escapeHtml(evidence)}\n\n被撤销：${escapeHtml(dis)}\n\n场景边界：${escapeHtml(boundaryText)}\n\n答题记录：\n${escapeHtml(S.answers.map((a,i)=>`${i+1}. ${a.qid} → ${a.texts.join(' / ')}`).join('\n'))}</pre></details></div><div class="racts"><button class="secondary" onclick="window.print()">保存 / 打印</button><button class="primary" id="again">重新测试</button></div><div class="fine">本结果是基于自述问卷形成的基础模型候选，不是临床诊断。仅问卷证据最高记为 Medium；更高置信需要真实行为、生命经历与长期资料交叉验证。</div>`;
  }

  function showReport(){ $('reportBody').innerHTML=reportHTML(); show('report'); $('again').onclick=()=>{if(confirm('确定清空本次记录并重新开始吗？')){localStorage.removeItem(KEY);S=fresh();show('start')}}; }
  function finish(){ S.finished=true;save();show('processing');setTimeout(showReport,650); }

  $('startBtn').onclick=start;
  $('resume').onclick=resume;
  $('next').onclick=goNext;
  $('back').onclick=back;
  $('restartTop').onclick=()=>{if(confirm('确定重新开始吗？当前进度会清空。')){localStorage.removeItem(KEY);S=fresh();show('start')}};
  $('printTop').onclick=()=>window.print();
  if(load()&&S.answers.length){$('resume').style.display='block';if(S.finished){$('resume').textContent='查看上次结果';$('resume').onclick=()=>{load();showReport();}}}
})();