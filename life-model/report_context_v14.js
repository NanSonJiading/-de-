(()=>{
  const $=id=>document.getElementById(id);
  const labels={relation:'对方是谁 / 关系远近',risk:'事情有多重要 / 失败代价',reversibility:'能不能重来 / 是否可逆',publicity:'是否公开 / 会不会被别人看到',responsibility:'责任到底在谁',familiarity:'我对这件事熟不熟',state:'当时状态 / 所处阶段',unknown:'暂时说不清'};
  const reasonLabels={functional:'我的反应更中性、务实',missing_option:'现有选项没有覆盖真实反应',scene_unfamiliar:'场景离真实生活较远',contextual:'反应高度依赖具体情境',no_clear_reaction:'通常没有很明显的第一反应',unknown:'暂时说不清'};
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function normalizeVersion(){
    const body=$('reportBody');if(!body)return;
    body.querySelectorAll('.rchip').forEach(x=>{if(/V1\.2|V1\.3/.test(x.textContent||''))x.textContent='基础生命模型 · V1.4';});
    body.querySelectorAll('*').forEach(x=>{if(x.children.length===0&&/V1\.2/.test(x.textContent||''))x.textContent=x.textContent.replace(/V1\.2/g,'V1.4');});
  }
  function inject(){
    if(!$('report')?.classList.contains('active'))return;normalizeVersion();
    if(document.getElementById('v14ContextCard'))return;
    const api=window.QIDI_V14_CONTEXT;if(!api)return;const a=api.aggregate();if(!a.boundaryCount&&!a.noneCount)return;
    const ranked=Object.entries(a.variableCounts||{}).sort((x,y)=>y[1]-x[1]);
    const reasons=Object.entries(a.noneReasons||{}).sort((x,y)=>y[1]-x[1]);
    const card=document.createElement('div');card.id='v14ContextCard';card.className='card';
    card.innerHTML=`<h3>Z轴入口｜你的反应并不是在所有场景里都一样</h3><div class="sub">V1.4 开始把“看具体情况”当成正式生命信息，而不是无效答案。</div>
      <div class="block"><h4>最可能改变你反应的条件</h4>${ranked.length?`<div class="v14-tags">${ranked.map(([k,n])=>`<span>${esc(labels[k]||k)} · ${n}</span>`).join('')}</div><p>这意味着生命模型不能只写“你通常怎样”，还需要写清楚：<b>在什么关系、风险和现实条件下，这个模式才会启动。</b>这些信息会成为后续 Z轴｜人与自己 / 人与他人 / 人与世界 的场域化证据。</p>`:'<p>本次没有记录明确的场景边界。</p>'}</div>
      ${reasons.length?`<div class="block"><h4>现有选项没有完全覆盖你的地方</h4><ul>${reasons.map(([k,n])=>`<li>${esc(reasonLabels[k]||k)}：${n} 次</li>`).join('')}</ul><p>这些记录不会被强行映射成人格字段，而会进入下一版题库修订。</p></div>`:''}
      <details class="research"><summary>查看场景边界记录</summary><div class="pilot-table">${a.records.map(r=>`<div class="pilot-row"><b>${esc(r.qid)}</b><span>${r.type==='boundary'?esc((r.variables||[]).map(v=>labels[v]||v).join(' · ')):esc(reasonLabels[r.reason]||r.reason)}</span><small>${esc(r.measurementGoal||'')}</small></div>`).join('')}</div></details>
      <div class="racts"><button class="secondary" id="v14ExportContext">导出 V1.4 场景数据</button></div>`;
    $('reportBody')?.appendChild(card);$('v14ExportContext').onclick=()=>api.exportCSV();
  }
  const st=document.createElement('style');st.textContent=`.v14-tags{display:flex;flex-wrap:wrap;gap:7px;margin:9px 0 12px}.v14-tags span{font-size:11px;padding:7px 9px;border-radius:999px;background:linear-gradient(120deg,#e9f9ff,#f0edff,#fff0f8);color:#64718a}`;document.head.appendChild(st);
  const report=$('report');if(report)new MutationObserver(()=>setTimeout(inject,60)).observe(report,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});setInterval(inject,700);
})();