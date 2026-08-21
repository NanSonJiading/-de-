(()=>{
  const D=window.QIDI_DATA||{},F=D.fields||{};
  const STATE_KEY='qidi-life-v12-scenario',KEY='qidi-life-bridge-v15';
  const $=id=>document.getElementById(id),iso=()=>new Date().toISOString();
  const fresh=()=>({version:'V1.5',createdAt:iso(),updatedAt:iso(),selectedFields:[],answers:[],completed:false});
  let A;try{A=JSON.parse(localStorage.getItem(KEY))||fresh();}catch(e){A=fresh();}
  function save(){A.updatedAt=iso();localStorage.setItem(KEY,JSON.stringify(A));}
  function getState(){try{return JSON.parse(localStorage.getItem(STATE_KEY))||{};}catch(e){return {};}}
  function fieldScore(st,f){const s=st.states?.[f]||'';const ev=(st.evidence?.[f]||[]).length;return (s==='SUPPORTED'?6:s==='MIXED'?4:s==='CANDIDATE'?3:s==='ROUTED'?1:0)+ev;}
  function pickTop(){const st=getState();return Object.keys(st.states||{}).filter(f=>F[f]&&['SUPPORTED','MIXED','CANDIDATE'].includes(st.states[f])).sort((a,b)=>fieldScore(st,b)-fieldScore(st,a)).slice(0,3);}
  function label(f){return F[f]?.[1]||f;}
  function moduleName(f){return D.mods?.[F[f]?.[0]]||F[f]?.[0]||'';}
  const periods=[
    ['child','小学或更早'],['teen','初高中阶段'],['young','大学 / 刚进入社会'],['adult','进入工作几年以后'],['recent','最近两三年才明显'],['unknown','很难确定最早是什么时候']
  ];
  const origins=[
    ['family','家庭与照顾关系'],['school','学校、成绩或老师评价'],['peer','朋友、同伴与群体关系'],['intimacy','亲密关系'],['work','工作、合作与责任'],['change','一次明显变化、失败或失去'],['none','没有某段经历特别突出'],['unknown','很难对应到某类经历']
  ];
  const trends=[
    ['stronger','比以前更明显了'],['stable','一直差不多'],['weaker','比以前弱了很多'],['reconstructed','我现在的处理方式已经明显变了'],['context','没有统一趋势，非常看场景'],['recent','这是最近才出现的新模式']
  ];
  const mechanisms=[
    ['feedback','现实中的正反馈，让我越来越敢用新的方式'],['role','换了角色 / 环境以后，被迫或主动学会新的方式'],['relationship','一段重要关系改变了我的理解'],['setback','一次明显失败 / 冲击让我重新调整'],['reflection','自己长期反思、练习后逐渐改变'],['support','有人长期支持、肯定或示范了不同做法'],['unknown','很难归到某一个原因']
  ];
  const recent=[
    ['many','最近3个月能想到很多次类似情况'],['some','能想到一两次很清楚的例子'],['rare','偶尔有，但并不常见'],['none','最近基本想不到现实例子'],['opposite','现实里反而经常出现相反的做法']
  ];

  const style=document.createElement('style');style.textContent=`
    .v15-card{background:linear-gradient(145deg,rgba(238,248,255,.92),rgba(249,244,255,.94));border:1px solid rgba(255,255,255,.9)}
    .v15-fields{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 15px}.v15-fields span{padding:7px 9px;border-radius:999px;background:rgba(255,255,255,.8);font-size:11px;color:#65718a}
    .v15-mask{position:fixed;inset:0;z-index:150;background:rgba(28,36,55,.32);backdrop-filter:blur(12px);display:flex;align-items:flex-end;justify-content:center;padding:14px}.v15-sheet{width:min(520px,100%);max-height:88vh;overflow:auto;background:#fbfcff;border-radius:30px 30px 24px 24px;padding:22px;box-shadow:0 30px 90px rgba(35,48,82,.3)}
    .v15-kicker{font-size:11px;letter-spacing:.08em;color:#8994a7;font-weight:760}.v15-sheet h3{font-size:22px;line-height:1.38;margin:8px 0}.v15-sheet p{font-size:13px;line-height:1.72;color:#7e899b;margin:0 0 14px}.v15-progress{height:5px;border-radius:99px;background:#edf1f7;overflow:hidden;margin:12px 0 18px}.v15-progress i{display:block;height:100%;background:linear-gradient(90deg,#55caec,#7d8df5,#c18ee9);border-radius:99px}
    .v15-choices{display:flex;flex-direction:column;gap:8px}.v15-choice{border:1px solid rgba(80,96,135,.1);background:#f7f9fd;border-radius:18px;padding:13px;text-align:left;color:#445066;font-size:13px;line-height:1.5;cursor:pointer}.v15-choice.selected{border-color:transparent;background:linear-gradient(#fff,#fff) padding-box,linear-gradient(105deg,#55cceb,#798bf3,#e2a0da) border-box;box-shadow:0 8px 24px rgba(92,110,208,.11)}
    .v15-summary-block{padding:14px 0;border-top:1px solid rgba(75,91,126,.08)}.v15-summary-block:first-child{border-top:0}.v15-summary-block b{display:block;font-size:14px;margin-bottom:5px}.v15-summary-block p{font-size:13px;line-height:1.75;color:#5f6c80;margin:0}.v15-pill{display:inline-flex;padding:6px 8px;border-radius:999px;background:#edf6ff;color:#61718d;font-size:10px;margin:3px 4px 3px 0}
  `;document.head.appendChild(style);

  function answerFor(f,axis){return A.answers.find(x=>x.field===f&&x.axis===axis);}
  function setAnswer(f,axis,value,labelText){const i=A.answers.findIndex(x=>x.field===f&&x.axis===axis);const rec={field:f,axis,value,label:labelText,at:iso()};if(i>=0)A.answers[i]=rec;else A.answers.push(rec);save();}
  function buildSteps(fields){const steps=[];fields.forEach(f=>{
    steps.push({field:f,axis:'X1',title:`最近现实里，「${label(f)}」这条线索有多常出现？`,desc:'先不解释原因，只看最近3个月真实发生过的行为或反应。',choices:recent});
    steps.push({field:f,axis:'X3',title:`如果往前回想，你最早大概什么时候就见过类似的自己？`,desc:'这里只记录时间线索，不代表那段经历“导致”了这个模式。',choices:periods});
    steps.push({field:f,axis:'X3_CONTEXT',title:`当时最接近哪一类生活环境？`,desc:'仍然只记录经历线索，不直接做因果解释。',choices:origins});
    steps.push({field:f,axis:'Y',title:`和更早的自己相比，「${label(f)}」现在是什么状态？`,desc:'我们想判断它是在形成、稳定运行，还是已经进入重构。',choices:trends});
  });return steps;}
  function runDeepDive(fields){A.selectedFields=[...fields];save();const steps=buildSteps(fields);let idx=0;
    function next(){if(idx>=steps.length){A.completed=true;save();renderDeepReport();return;}const s=steps[idx],mask=document.createElement('div');mask.className='v15-mask';mask.innerHTML=`<div class="v15-sheet"><div class="v15-kicker">三维生命理解 · ${moduleName(s.field)} · ${s.axis.startsWith('X3')?'X3 生命经历':s.axis==='X1'?'X1 外显行为':'Y 生命变化'}</div><div class="v15-progress"><i style="width:${Math.round((idx/steps.length)*100)}%"></i></div><h3>${s.title}</h3><p>${s.desc}</p><div class="v15-choices"></div><div class="racts"><button class="secondary" data-skip>暂时不确定</button><button class="primary" data-next disabled>继续</button></div></div>`;document.body.appendChild(mask);let chosen=null;const box=mask.querySelector('.v15-choices'),done=mask.querySelector('[data-next]');s.choices.forEach(c=>{const b=document.createElement('button');b.className='v15-choice';b.textContent=c[1];b.onclick=()=>{chosen=c;[...box.children].forEach(x=>x.classList.remove('selected'));b.classList.add('selected');done.disabled=false;};box.appendChild(b);});done.onclick=()=>{setAnswer(s.field,s.axis,chosen[0],chosen[1]);mask.remove();idx++;next();};mask.querySelector('[data-skip]').onclick=()=>{setAnswer(s.field,s.axis,'unknown','暂时不确定');mask.remove();idx++;next();};
    }next();
  }

  function deriveY(f){const y=answerFor(f,'Y');if(!y)return null;const map={stronger:'增强中',stable:'稳定运行',weaker:'减弱中',reconstructed:'正在重构',context:'场景化运行',recent:'最近形成'};return map[y.value]||'待判断';}
  function deriveEvidence(f){const x=answerFor(f,'X1');if(!x)return '尚未补充现实行为证据';if(x.value==='many')return '最近现实行为支持度较高';if(x.value==='some')return '已有少量现实行为例证';if(x.value==='rare')return '现实中偶尔出现';if(x.value==='none')return '近期现实行为支持较弱';if(x.value==='opposite')return '现实行为出现明显反例，需要降低原问卷结论置信';return '现实行为证据暂不明确';}
  function deriveHistory(f){const p=answerFor(f,'X3'),c=answerFor(f,'X3_CONTEXT');if(!p&&!c)return '尚未补充经历线索';return `${p?.label||'时间不确定'}${c?` · ${c.label}`:''}`;}
  function renderDeepReport(){document.querySelector('.v15-mask')?.remove();const body=$('reportBody');if(!body)return;document.getElementById('v15DeepResult')?.remove();const div=document.createElement('div');div.id='v15DeepResult';div.className='card';div.innerHTML=`<h3>三维生命模型 · 初步桥接</h3><div class="sub">这里开始把问卷中的 X2 内在模式，与 X1真实行为、X3经历线索和Y生命变化连接起来。经历线索只用于解释假设，不直接视为因果证据。</div>${A.selectedFields.map(f=>`<div class="v15-summary-block"><b>${moduleName(f)}｜${label(f)}</b><span class="v15-pill">X1 ${deriveEvidence(f)}</span><span class="v15-pill">Y ${deriveY(f)||'待判断'}</span><p><strong>X3经历线索：</strong>${deriveHistory(f)}。</p><p><strong>当前解释：</strong>${answerFor(f,'X1')?.value==='opposite'?'问卷内部模式与近期现实行为出现反差，这条结论应保留为待验证，而不是继续强化。':answerFor(f,'Y')?.value==='reconstructed'?'这条模式可能仍能在经历中找到来源，但你现在的实际运行方式已经发生明显变化，应重点进入Y轴“重构”分析。':answerFor(f,'Y')?.value==='context'?'这条模式更可能是场景化存在，不能写成全局人格特征，需要结合Z轴条件理解。':'当前可以把它作为一条生命结构候选继续观察，但仍不应仅凭经历时间线推断形成原因。'}</p></div>`).join('')}<div class="block"><h4>这一步之后，模型多知道了什么？</h4><p>问卷原本主要回答“你内部可能怎样运行”。现在又增加了三个判断：<b>现实里是否真的出现、最早在哪个生命阶段见过类似反应、它今天是在增强/稳定/减弱还是重构。</b></p></div><div class="racts"><button class="secondary" id="v15Export">导出三维桥接数据</button></div>`;body.appendChild(div);$('v15Export').onclick=exportData;div.scrollIntoView({behavior:'smooth',block:'start'});}
  function exportData(){const payload={...A,zAxis:window.QIDI_V14_CONTEXT?.aggregate?.()||null,questionnaireState:getState()};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}),u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='qidi-3d-bridge-v15.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  function inject(){if(!$('report')?.classList.contains('active')||document.getElementById('v15BridgeCard'))return;const fields=pickTop();if(!fields.length)return;const body=$('reportBody');if(!body)return;const card=document.createElement('div');card.id='v15BridgeCard';card.className='card v15-card';card.innerHTML=`<div class="rchip">V1.5 · OPTIONAL</div><h3 style="margin-top:12px">从“内部模式”继续走进你的生命经历</h3><div class="sub">当前报告主要完成 X2 内在模式定位。继续约 6—12 个非常短的问题，可以把最重要的 ${fields.length} 条线索连接到 X1真实行为、X3经历线索和Y生命变化。</div><div class="v15-fields">${fields.map(f=>`<span>${moduleName(f)} · ${label(f)}</span>`).join('')}</div><p style="font-size:13px;line-height:1.75;color:#617087">这一步不会用童年经历“解释一切”，也不会把时间先后当成因果。它只寻找：<b>现实证据、经历线索与变化方向</b>。</p><button class="primary" id="v15Start">继续进入三维生命理解</button><div class="fine">可选，不影响当前基础问卷报告。</div>`;body.appendChild(card);$('v15Start').onclick=()=>runDeepDive(fields);if(A.completed&&A.selectedFields?.length)renderDeepReport();}
  const report=$('report');if(report)new MutationObserver(()=>setTimeout(inject,80)).observe(report,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});setInterval(inject,800);
  window.QIDI_V15_BRIDGE={getData:()=>JSON.parse(JSON.stringify(A)),pickTop,reset:()=>{localStorage.removeItem(KEY);A=fresh();}};
})();