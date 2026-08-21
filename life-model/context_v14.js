(()=>{
  const D=window.QIDI_DATA||{},S=window.QIDI_V14_SCHEMA||{};
  const KEY='qidi-life-context-v14';
  const $=id=>document.getElementById(id);
  const all=[...(D.seeds||[]),...(D.primary||[]),...(D.validation||[]),...(D.disc||[])];
  const byText=new Map(all.map(q=>[q.text,q]));
  const vars=S.variables||{};
  const nowISO=()=>new Date().toISOString();
  const fresh=()=>({version:'V1.4',createdAt:nowISO(),updatedAt:nowISO(),records:[]});
  let A;try{A=JSON.parse(localStorage.getItem(KEY))||fresh();}catch(e){A=fresh();}
  function save(){A.updatedAt=nowISO();localStorage.setItem(KEY,JSON.stringify(A));}
  function activeQuestion(){const t=$('qtext')?.textContent?.trim();return t?byText.get(t):null;}
  function selectedOptions(q){return [...($('opts')?.children||[])].map((n,i)=>n.classList.contains('selected')?q.options?.[i]:null).filter(Boolean);}
  function already(qid,type){return A.records.some(r=>r.qid===qid&&r.type===type&&r.answerIndex===getAnswerIndex(qid));}
  function getAnswerIndex(qid){const state=JSON.parse(localStorage.getItem('qidi-life-v12-scenario')||'{}');const arr=state.answers||[];return arr.filter(x=>x.qid===qid).length;}
  function store(rec){A.records.push({...rec,at:nowISO(),answerIndex:getAnswerIndex(rec.qid)});save();}

  const style=document.createElement('style');style.textContent=`
    .v14-mask{position:fixed;inset:0;background:rgba(25,34,52,.28);backdrop-filter:blur(10px);z-index:100;display:flex;align-items:flex-end;justify-content:center;padding:16px}
    .v14-sheet{width:min(520px,100%);background:rgba(252,253,255,.98);border-radius:30px 30px 24px 24px;padding:22px;box-shadow:0 30px 90px rgba(37,48,78,.28)}
    .v14-kicker{font-size:11px;font-weight:760;letter-spacing:.08em;color:#8793a8}.v14-sheet h3{font-size:22px;line-height:1.35;margin:8px 0 6px}.v14-sheet p{font-size:13px;line-height:1.7;color:#7e899d;margin:0 0 14px}
    .v14-choices{display:flex;flex-direction:column;gap:8px}.v14-choice{border:1px solid rgba(80,97,137,.10);background:#f7f9fd;border-radius:18px;padding:12px 13px;text-align:left;font-size:13px;color:#465269;cursor:pointer}.v14-choice.active{background:linear-gradient(#fff,#fff) padding-box,linear-gradient(105deg,#55cceb,#798bf3,#e2a0da) border-box;border-color:transparent;box-shadow:0 8px 24px rgba(95,112,210,.10)}
    .v14-sheet .racts{margin-top:14px}.v14-note{font-size:10px;color:#a0a9b7;text-align:center;margin-top:8px}
  `;document.head.appendChild(style);

  function modal({title,desc,choices,max=1,onDone}){
    const mask=document.createElement('div');mask.className='v14-mask';
    mask.innerHTML=`<div class="v14-sheet"><div class="v14-kicker">V1.4 · 场景边界</div><h3>${title}</h3><p>${desc}</p><div class="v14-choices"></div><div class="racts"><button class="secondary" data-skip>暂时说不清</button><button class="primary" data-done disabled>记录并继续</button></div><div class="v14-note">这一步不参与人物结论，只帮助判断“什么条件会改变你的反应”。</div></div>`;
    document.body.appendChild(mask);let selected=[];const box=mask.querySelector('.v14-choices'),done=mask.querySelector('[data-done]');
    choices.forEach(c=>{const b=document.createElement('button');b.className='v14-choice';b.textContent=c.label;b.onclick=()=>{if(selected.includes(c.id))selected=selected.filter(x=>x!==c.id);else if(max===1)selected=[c.id];else if(selected.length<max)selected.push(c.id);[...box.children].forEach((x,i)=>x.classList.toggle('active',selected.includes(choices[i].id)));done.disabled=!selected.length;};box.appendChild(b);});
    done.onclick=()=>{mask.remove();onDone(selected);};mask.querySelector('[data-skip]').onclick=()=>{mask.remove();onDone(['unknown']);};
  }

  function askBoundary(q,continueFn){
    const ids=q.metaV14?.boundaryCandidates||Object.keys(vars);
    const choices=ids.map(id=>({id,label:vars[id]||id}));
    modal({title:'刚才你选了「要看具体情况」',desc:'哪两个条件最容易让你的反应变得不一样？不用解释原因，先标记最关键的条件。',choices,max:2,onDone:selected=>{store({qid:q.id,type:'boundary',variables:selected,measurementGoal:q.metaV14?.measurementGoal||''});continueFn();}});
  }
  function askNone(q,continueFn){
    const choices=[
      {id:'functional','label':'我的反应更中性、务实，通常先处理事实或事情本身'},
      {id:'missing_option','label':'我有明确反应，但上面的选项没有覆盖'},
      {id:'scene_unfamiliar','label':'这个场景离我的真实生活比较远，很难代入'},
      {id:'contextual','label':'我的反应确实很看具体人、风险或情境'},
      {id:'no_clear_reaction','label':'我通常没有很明显的第一反应'}
    ];
    modal({title:'刚才你选了「这些都不太像我」',desc:'更接近下面哪一种原因？这能帮助下一版补足真实反应，而不是把你硬塞进现有选项。',choices,max:1,onDone:selected=>{store({qid:q.id,type:'none_reason',reason:selected[0]});if(selected[0]==='contextual')askBoundary(q,continueFn);else continueFn();}});
  }

  const next=$('next');
  if(next){
    const original=next.onclick;
    next.addEventListener('click',e=>{
      const q=activeQuestion();if(!q)return;
      const os=selectedOptions(q);const dep=os.some(o=>o?.special==='boundary'||o?.id==='DEP');const none=os.some(o=>o?.special==='none'||o?.id==='NONE');
      if(!dep&&!none)return;
      const type=dep?'boundary':'none_reason';if(already(q.id,type))return;
      e.preventDefault();e.stopImmediatePropagation();
      const go=()=>{if(typeof original==='function')original.call(next);};
      if(dep)askBoundary(q,go);else askNone(q,go);
    },true);
  }

  function aggregate(){
    const b=A.records.filter(r=>r.type==='boundary');const counts={};b.forEach(r=>(r.variables||[]).forEach(v=>counts[v]=(counts[v]||0)+1));
    const n=A.records.filter(r=>r.type==='none_reason');const reasons={};n.forEach(r=>reasons[r.reason]=(reasons[r.reason]||0)+1);
    return {boundaryCount:b.length,noneCount:n.length,variableCounts:counts,noneReasons:reasons,records:[...A.records]};
  }
  function csv(){
    const rows=[['qid','type','variables_or_reason','measurement_goal','at']];
    A.records.forEach(r=>rows.push([r.qid,r.type,(r.variables||[r.reason]).join('|'),r.measurementGoal||'',r.at]));
    return '\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\n');
  }
  function download(name,type,text){const blob=new Blob([text],{type});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  window.QIDI_V14_CONTEXT={getData:()=>JSON.parse(JSON.stringify(A)),aggregate,exportCSV:()=>download('qidi-v14-context.csv','text/csv;charset=utf-8',csv()),reset:()=>{localStorage.removeItem(KEY);A=fresh();}};
})();