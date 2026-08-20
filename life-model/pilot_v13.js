(()=>{
  const D=window.QIDI_DATA||{};
  const KEY='qidi-life-pilot-v13';
  const SESSION_KEY='qidi-life-pilot-session-v13';
  const allQuestions=[...(D.seeds||[]),...(D.primary||[]),...(D.validation||[]),...(D.disc||[])];
  const byText=new Map(allQuestions.map(q=>[q.text,q]));
  const $=id=>document.getElementById(id);
  const now=()=>performance.now();
  const iso=()=>new Date().toISOString();
  const sid=()=>{
    let x=localStorage.getItem(SESSION_KEY);
    if(!x){x=(crypto.randomUUID?crypto.randomUUID():'s-'+Date.now()+'-'+Math.random().toString(36).slice(2));localStorage.setItem(SESSION_KEY,x);}
    return x;
  };
  const fresh=()=>({version:'V1.3-pilot',sessionId:sid(),createdAt:iso(),updatedAt:iso(),questionMetrics:{},events:[],backPresses:0});
  let A;
  try{A=JSON.parse(localStorage.getItem(KEY))||fresh();}catch(e){A=fresh();}
  let current=null;

  function save(){A.updatedAt=iso();localStorage.setItem(KEY,JSON.stringify(A));}
  function metric(q){
    if(!q)return null;
    A.questionMetrics[q.id]=A.questionMetrics[q.id]||{
      qid:q.id,module:q.module,stage:q.stage,purpose:q.purpose||'',
      visits:0,shownAtMs:null,firstSelectMs:null,totalMs:null,selectionChanges:0,
      selectedIds:[],selectedCount:0,usedNone:false,usedBoundary:false,
      feedback:[],backRevisited:false,lastSeenAt:null
    };
    return A.questionMetrics[q.id];
  }
  function activeQuestion(){
    const text=$('qtext')?.textContent?.trim();
    return text?byText.get(text):null;
  }
  function onQuestionShown(){
    const q=activeQuestion();
    if(!q)return;
    current=q;
    const m=metric(q);
    m.visits+=1;
    if(m.visits>1)m.backRevisited=true;
    m.shownAtMs=now();
    m.firstSelectMs=null;
    m.lastSeenAt=iso();
    A.events.push({type:'question_shown',qid:q.id,at:iso(),visit:m.visits});
    save();
    mountFeedback(q);
  }
  function optionIndexFromNode(node){
    const opt=node.closest?.('.opt');
    if(!opt)return -1;
    return [...($('opts')?.children||[])].indexOf(opt);
  }
  function captureOptionClick(e){
    const q=current||activeQuestion();
    if(!q)return;
    const idx=optionIndexFromNode(e.target);
    if(idx<0||!q.options?.[idx])return;
    const m=metric(q);
    if(m.firstSelectMs==null&&m.shownAtMs!=null)m.firstSelectMs=now()-m.shownAtMs;
    else m.selectionChanges+=1;
    A.events.push({type:'option_click',qid:q.id,optionId:q.options[idx].id,at:iso()});
    save();
  }
  function captureNext(){
    const q=current||activeQuestion();
    if(!q)return;
    const m=metric(q);
    if(m.shownAtMs!=null)m.totalMs=now()-m.shownAtMs;
    const selected=[...($('opts')?.children||[])].map((n,i)=>n.classList.contains('selected')?q.options?.[i]:null).filter(Boolean);
    m.selectedIds=selected.map(o=>o.id);
    m.selectedCount=selected.length;
    m.usedNone=selected.some(o=>o.special==='none'||o.id==='NONE');
    m.usedBoundary=selected.some(o=>o.special==='boundary'||o.id==='DEP');
    A.events.push({type:'question_submit',qid:q.id,selectedIds:m.selectedIds,at:iso(),totalMs:m.totalMs});
    save();
  }
  function captureBack(){
    A.backPresses=(A.backPresses||0)+1;
    A.events.push({type:'back',qid:(current||activeQuestion())?.id||null,at:iso()});
    save();
  }

  const reasons=[
    ['unclear','没太看懂','需要读第二遍，或者不确定题目到底在问什么。'],
    ['too_many_fit','好几个都很像','很难只选最接近的一项。'],
    ['none_fit','选项都不像','真实反应没有被这些选项覆盖。'],
    ['scene_far','场景离我有点远','我需要先脑补，才能知道自己会怎么反应。'],
    ['too_slow','需要想太久','不是难理解，但很难快速匹配自己的真实反应。']
  ];
  function mountFeedback(q){
    const hint=$('hint');
    if(!hint)return;
    document.getElementById('pilotFeedback')?.remove();
    const box=document.createElement('div');box.id='pilotFeedback';box.className='pilot-feedback';
    box.innerHTML=`<button type="button" class="pilot-feedback-toggle">这题有点难答？</button><div class="pilot-feedback-panel" hidden><div class="pilot-feedback-title">哪里让你觉得难答？可多选，不影响测试结果。</div><div class="pilot-feedback-chips">${reasons.map(([id,label,desc])=>`<button type="button" class="pilot-chip" data-reason="${id}" title="${desc}">${label}</button>`).join('')}</div></div>`;
    hint.insertAdjacentElement('afterend',box);
    const panel=box.querySelector('.pilot-feedback-panel');
    box.querySelector('.pilot-feedback-toggle').onclick=()=>{panel.hidden=!panel.hidden;};
    const m=metric(q);
    box.querySelectorAll('.pilot-chip').forEach(btn=>{
      const id=btn.dataset.reason;
      btn.classList.toggle('active',m.feedback.includes(id));
      btn.onclick=()=>{
        const x=new Set(m.feedback);
        x.has(id)?x.delete(id):x.add(id);
        m.feedback=[...x];
        btn.classList.toggle('active',x.has(id));
        A.events.push({type:'question_feedback',qid:q.id,reason:id,active:x.has(id),at:iso()});
        save();
      };
    });
  }

  function qualityFlags(m){
    const f=[];
    if((m.firstSelectMs||0)>15000)f.push('首次选择>15秒');
    if((m.totalMs||0)>25000)f.push('整题>25秒');
    if((m.selectionChanges||0)>=3)f.push('改选≥3次');
    if(m.selectedCount>=3)f.push('多项高度匹配');
    if(m.usedNone)f.push('都不太像');
    if(m.usedBoundary)f.push('看具体情况');
    if(m.backRevisited)f.push('返回修改');
    if(m.feedback?.length)f.push('用户主动反馈');
    return f;
  }
  function rows(){return Object.values(A.questionMetrics).filter(m=>m.totalMs!=null||m.feedback?.length).map(m=>({...m,flags:qualityFlags(m)}));}
  function summarize(){
    const r=rows();
    const flagged=r.filter(x=>x.flags.length);
    const count=k=>r.filter(x=>x.feedback?.includes(k)).length;
    return {answered:r.length,flagged:flagged.length,unclear:count('unclear'),tooMany:count('too_many_fit'),noneFit:r.filter(x=>x.usedNone||x.feedback?.includes('none_fit')).length,boundary:r.filter(x=>x.usedBoundary).length,sceneFar:count('scene_far'),slow:r.filter(x=>(x.totalMs||0)>25000||x.feedback?.includes('too_slow')).length,back:A.backPresses||0};
  }
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function injectReportPanel(){
    if(!$('report')?.classList.contains('active')||document.getElementById('pilotQualityCard'))return;
    const body=$('reportBody');if(!body)return;
    const s=summarize();
    const problemRows=rows().filter(x=>x.flags.length).sort((a,b)=>b.flags.length-a.flags.length).slice(0,12);
    const div=document.createElement('div');div.id='pilotQualityCard';div.className='card research';
    div.innerHTML=`<h3>Pilot · 题目质量记录</h3><div class="sub">这一部分不参与生命模型结论，只用于优化下一版问卷。</div>
      <div class="pilot-summary-grid">
        <div><b>${s.answered}</b><span>记录题目</span></div><div><b>${s.flagged}</b><span>值得复盘</span></div><div><b>${s.unclear}</b><span>看不懂</span></div><div><b>${s.noneFit}</b><span>没有合适选项</span></div>
      </div>
      <details><summary>查看本次值得复盘的题目</summary><div class="pilot-table">${problemRows.length?problemRows.map(x=>`<div class="pilot-row"><b>${esc(x.qid)}</b><span>${esc(x.flags.join(' · '))}</span><small>${x.totalMs!=null?(x.totalMs/1000).toFixed(1)+'秒':''}${x.feedback?.length?' · '+x.feedback.map(id=>reasons.find(r=>r[0]===id)?.[1]||id).join(' / '):''}</small></div>`).join(''):'<p>本次没有明显的题目体验异常。</p>'}</div></details>
      <div class="racts"><button class="secondary" id="pilotCsv">导出题目质量 CSV</button><button class="secondary" id="pilotJson">导出完整研究数据</button></div>
      <div class="fine">导出文件只包含本次答题过程与题目质量指标，不包含姓名、手机号等身份信息。</div>`;
    body.appendChild(div);
    $('pilotCsv').onclick=exportCSV;
    $('pilotJson').onclick=exportJSON;
  }
  function download(name,type,text){const blob=new Blob([text],{type});const u=URL.createObjectURL(blob);const a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
  function csvCell(v){const s=String(v??'');return '"'+s.replace(/"/g,'""')+'"';}
  function exportCSV(){
    const header=['session_id','qid','module','stage','visits','first_select_sec','total_sec','selection_changes','selected_count','selected_ids','used_none','used_boundary','back_revisited','feedback','quality_flags'];
    const body=rows().map(m=>[A.sessionId,m.qid,m.module,m.stage,m.visits,m.firstSelectMs==null?'':(m.firstSelectMs/1000).toFixed(2),m.totalMs==null?'':(m.totalMs/1000).toFixed(2),m.selectionChanges,m.selectedCount,m.selectedIds.join('|'),m.usedNone,m.usedBoundary,m.backRevisited,m.feedback.join('|'),m.flags.join('|')]);
    download(`qidi-pilot-${A.sessionId.slice(0,8)}.csv`,'text/csv;charset=utf-8','\ufeff'+[header,...body].map(r=>r.map(csvCell).join(',')).join('\n'));
  }
  function exportJSON(){download(`qidi-pilot-${A.sessionId.slice(0,8)}.json`,'application/json;charset=utf-8',JSON.stringify({...A,summary:summarize(),rows:rows()},null,2));}

  const style=document.createElement('style');
  style.textContent=`
    .pilot-feedback{margin-top:11px}.pilot-feedback-toggle{border:0;background:transparent;padding:5px 0;color:#9aa5b8;font-size:11px;cursor:pointer}
    .pilot-feedback-panel{margin-top:7px;padding:12px;border-radius:18px;background:rgba(255,255,255,.55);border:1px dashed rgba(89,107,147,.14)}
    .pilot-feedback-title{font-size:11px;color:#8691a4;margin-bottom:8px}.pilot-feedback-chips{display:flex;flex-wrap:wrap;gap:7px}
    .pilot-chip{border:1px solid rgba(86,102,141,.11);background:#f5f7fb;color:#7b8799;border-radius:999px;padding:7px 10px;font-size:11px;cursor:pointer}
    .pilot-chip.active{background:linear-gradient(120deg,#e3faff,#eeeaff,#ffeaf7);color:#666bb1;border-color:#b8b8ef}
    .pilot-summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:12px 0}.pilot-summary-grid>div{padding:12px 7px;border-radius:16px;background:#f5f8fd;text-align:center}
    .pilot-summary-grid b{display:block;font-size:20px}.pilot-summary-grid span{display:block;font-size:10px;color:#8a96a9;margin-top:3px}.pilot-table{margin-top:10px}.pilot-row{padding:10px 0;border-top:1px solid rgba(75,91,126,.08)}
    .pilot-row b,.pilot-row span,.pilot-row small{display:block}.pilot-row b{font-size:12px}.pilot-row span{font-size:12px;color:#566276;margin-top:3px}.pilot-row small{font-size:10px;color:#9aa4b5;margin-top:3px}
    @media(max-width:390px){.pilot-summary-grid{grid-template-columns:1fr 1fr}}
  `;
  document.head.appendChild(style);

  $('opts')?.addEventListener('click',captureOptionClick,true);
  $('next')?.addEventListener('click',captureNext,true);
  $('back')?.addEventListener('click',captureBack,true);
  const qtext=$('qtext');
  if(qtext){new MutationObserver(()=>setTimeout(onQuestionShown,0)).observe(qtext,{childList:true,characterData:true,subtree:true});}
  const report=$('report');
  if(report){new MutationObserver(()=>setTimeout(injectReportPanel,50)).observe(report,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});}
  setInterval(injectReportPanel,700);

  window.QIDI_PILOT={getData:()=>JSON.parse(JSON.stringify(A)),summary:summarize,exportCSV,exportJSON,reset:()=>{localStorage.removeItem(KEY);localStorage.removeItem(SESSION_KEY);}};
})();