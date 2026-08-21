(()=>{
  const D=window.QIDI_DATA||{};
  const all=[...(D.seeds||[]),...(D.primary||[]),...(D.validation||[]),...(D.disc||[])];
  const V=['relation','risk','reversibility','publicity','responsibility','familiarity','state'];
  const M={
    'S-A1':{goal:'无外部要求时的自然活动密度与结构偏好',domain:'self',actor:'自己',stakes:'low',rev:'high',pub:'private',resp:'self',fam:'high',layer:'behavior',vars:['state','familiarity']},
    'S-A2':{goal:'陌生团队中的合作、表达与冲突姿态',domain:'work',actor:'陌生团队',stakes:'medium',rev:'medium',pub:'group',resp:'shared',fam:'low',layer:'behavior',vars:['relation','publicity','familiarity','risk']},
    'S-B1':{goal:'重要事情受阻时最先激活的情绪家族',domain:'general',actor:'事件',stakes:'high',rev:'unknown',pub:'unknown',resp:'unknown',fam:'unknown',layer:'emotion',vars:['responsibility','risk','relation','reversibility']},
    'S-B2':{goal:'最主要的正向情绪资源',domain:'general',actor:'生活事件',stakes:'medium',rev:'na',pub:'na',resp:'na',fam:'na',layer:'emotion',vars:['state','relation']},
    'S-C1':{goal:'处理复杂陌生信息时的首要加工方式',domain:'work',actor:'陌生项目',stakes:'medium',rev:'high',pub:'private',resp:'self',fam:'low',layer:'cognition',vars:['familiarity','risk','responsibility']},
    'S-C2':{goal:'不完整信息下的决策整合与停止方式',domain:'decision',actor:'自己',stakes:'high',rev:'unknown',pub:'private',resp:'self',fam:'unknown',layer:'decision',vars:['reversibility','risk','familiarity','publicity']},
    'S-D1':{goal:'结果未达预期后的默认解释框架',domain:'work',actor:'评价方',stakes:'medium',rev:'medium',pub:'limited',resp:'mixed',fam:'medium',layer:'appraisal',vars:['responsibility','publicity','risk','relation']},
    'S-D2':{goal:'关系与角色中的自动规范规则',domain:'relationship',actor:'重要他人',stakes:'medium',rev:'medium',pub:'private',resp:'mixed',fam:'high',layer:'belief',vars:['relation','responsibility','risk']},
    'S-E1':{goal:'长期缺失最容易造成的需求张力',domain:'life',actor:'长期生活状态',stakes:'high',rev:'low',pub:'na',resp:'na',fam:'na',layer:'need',vars:['state','relation','risk']},
    'S-E2':{goal:'外部稳定后仍不可替代的核心需要',domain:'life',actor:'长期生活状态',stakes:'high',rev:'low',pub:'na',resp:'na',fam:'na',layer:'need',vars:['state','relation']},
    'S-F1':{goal:'未来三年最不愿持续牺牲的价值',domain:'life',actor:'长期选择',stakes:'high',rev:'low',pub:'na',resp:'self',fam:'na',layer:'value',vars:['risk','state']},
    'S-F2':{goal:'个人利益与外部标准冲突时的价值保护',domain:'ethics',actor:'社会/关系标准',stakes:'high',rev:'medium',pub:'unknown',resp:'self',fam:'na',layer:'value',vars:['risk','publicity','responsibility']},
    'S-G1':{goal:'外部变化后维持身份连续性的核心来源',domain:'identity',actor:'未来自己',stakes:'high',rev:'low',pub:'na',resp:'self',fam:'na',layer:'identity',vars:['state','relation']},
    'S-G2':{goal:'哪些损失会直接动摇“我是谁”',domain:'identity',actor:'未来自己',stakes:'high',rev:'low',pub:'na',resp:'self',fam:'na',layer:'identity',vars:['state','relation','publicity']},
    'S-H1':{goal:'失控出现后最先调用的调节路径',domain:'stress',actor:'问题事件',stakes:'high',rev:'unknown',pub:'unknown',resp:'self',fam:'unknown',layer:'coping',vars:['risk','familiarity','responsibility']},
    'S-H2':{goal:'问题暂时无解时最常用的恢复方式',domain:'stress',actor:'自己',stakes:'medium',rev:'unknown',pub:'private',resp:'self',fam:'na',layer:'coping',vars:['state','relation']},

    'P-A-COOP':{goal:'合作整合倾向',domain:'work',actor:'同事',stakes:'medium',rev:'medium',pub:'group',resp:'shared',fam:'medium',layer:'behavior',vars:['relation','publicity','risk']},
    'P-A-STRUCT':{goal:'自然活动密度与结构偏好',domain:'self',actor:'自己',stakes:'low',rev:'high',pub:'private',resp:'self',fam:'high',layer:'behavior',vars:['state']},
    'P-A-EVAL':{goal:'评价环境下的表达姿态',domain:'work',actor:'陌生团队',stakes:'medium',rev:'medium',pub:'group',resp:'self',fam:'low',layer:'behavior',vars:['publicity','relation','familiarity','risk']},
    'P-B-BLOCK':{goal:'纯受阻情境下挫败与愤怒区分',domain:'work',actor:'任务',stakes:'high',rev:'medium',pub:'private',resp:'self',fam:'medium',layer:'emotion',vars:['responsibility','risk','familiarity']},
    'P-B-THREAT':{goal:'结果悬而未决时的不确定警觉',domain:'uncertainty',actor:'结果',stakes:'high',rev:'unknown',pub:'private',resp:'unknown',fam:'unknown',layer:'emotion',vars:['risk','reversibility','responsibility']},
    'P-B-CONNECT':{goal:'重要关系不回应时的情绪反应',domain:'relationship',actor:'重要他人',stakes:'high',rev:'medium',pub:'private',resp:'shared',fam:'high',layer:'emotion',vars:['relation','state']},
    'P-C-UPDATE':{goal:'新证据出现后的认知更新速度',domain:'decision',actor:'自己',stakes:'medium',rev:'high',pub:'private',resp:'self',fam:'medium',layer:'cognition',vars:['publicity','risk','responsibility']},
    'P-C-SEARCH':{goal:'信息已够用时的搜索停止规则',domain:'decision',actor:'自己',stakes:'high',rev:'unknown',pub:'private',resp:'self',fam:'unknown',layer:'decision',vars:['risk','reversibility','familiarity']},
    'P-C-CAUSE':{goal:'结果偏差后的因果解释方式',domain:'work',actor:'项目',stakes:'medium',rev:'medium',pub:'private',resp:'mixed',fam:'medium',layer:'cognition',vars:['responsibility','familiarity','risk']},
    'P-D-ROLE':{goal:'角色身份是否自动生成服从/义务',domain:'family',actor:'父母',stakes:'high',rev:'low',pub:'private',resp:'self',fam:'high',layer:'belief',vars:['relation','responsibility','risk']},
    'P-D-RECIP':{goal:'帮助是否自动生成偿还义务',domain:'relationship',actor:'朋友',stakes:'medium',rev:'high',pub:'private',resp:'shared',fam:'high',layer:'belief',vars:['relation','risk']},
    'P-D-EFFICACY':{goal:'无标准答案时的决策自我效能',domain:'decision',actor:'自己',stakes:'high',rev:'unknown',pub:'private',resp:'self',fam:'unknown',layer:'belief',vars:['familiarity','risk','publicity']},
    'P-E-AUTO':{goal:'个人决定权本身是否构成状态需要',domain:'decision',actor:'自己/他人',stakes:'high',rev:'medium',pub:'private',resp:'self',fam:'unknown',layer:'need',vars:['risk','familiarity','reversibility']},
    'P-E-CONNECT':{goal:'被理解与被认可的需求优先级',domain:'relationship',actor:'重要他人/外部评价',stakes:'high',rev:'low',pub:'mixed',resp:'na',fam:'high',layer:'need',vars:['relation','state','publicity']},
    'P-E-EFFICACY':{goal:'长期缺少掌握/成长是否消耗状态',domain:'life',actor:'长期自己',stakes:'high',rev:'low',pub:'private',resp:'self',fam:'high',layer:'need',vars:['state','risk']},
    'P-F-AUTO':{goal:'自主价值是否值得现实成本',domain:'career',actor:'公司/自己',stakes:'high',rev:'low',pub:'na',resp:'self',fam:'medium',layer:'value',vars:['risk','reversibility','state']},
    'P-F-ETHICS':{goal:'伦理原则与长期影响力的取舍',domain:'ethics',actor:'组织',stakes:'high',rev:'medium',pub:'public',resp:'self',fam:'medium',layer:'value',vars:['publicity','risk','responsibility']},
    'P-F-LIFE':{goal:'长期价值资源优先级',domain:'life',actor:'长期自己',stakes:'high',rev:'low',pub:'na',resp:'self',fam:'na',layer:'value',vars:['state','risk']},
    'P-G-CONT':{goal:'身份连续性的最核心来源',domain:'identity',actor:'未来自己',stakes:'high',rev:'low',pub:'na',resp:'self',fam:'na',layer:'identity',vars:['state','relation']},
    'P-G-ROLE':{goal:'事业角色本身是否进入核心身份',domain:'identity',actor:'未来自己',stakes:'high',rev:'low',pub:'na',resp:'self',fam:'na',layer:'identity',vars:['state','publicity']},
    'P-G-ABILITY':{goal:'能力是否进入核心身份',domain:'identity',actor:'未来自己',stakes:'high',rev:'low',pub:'na',resp:'self',fam:'na',layer:'identity',vars:['state','publicity']},
    'P-H-INFO':{goal:'无法行动时是否通过信息调节不确定',domain:'uncertainty',actor:'自己',stakes:'high',rev:'unknown',pub:'private',resp:'self',fam:'unknown',layer:'coping',vars:['risk','familiarity','reversibility']},
    'P-H-PROBLEM':{goal:'可行动问题出现后的首要调节路径',domain:'stress',actor:'现实问题',stakes:'high',rev:'medium',pub:'private',resp:'self',fam:'medium',layer:'coping',vars:['risk','familiarity','responsibility']},
    'P-H-RECOVER':{goal:'问题无解时的恢复方式',domain:'stress',actor:'自己',stakes:'medium',rev:'unknown',pub:'private',resp:'self',fam:'na',layer:'coping',vars:['state','relation']},

    'D-AUTO':{goal:'自主需求/自主价值/独立身份的竞争解释',domain:'decision',actor:'可信任专业者',stakes:'high',rev:'high',pub:'private',resp:'self',fam:'high',layer:'mechanism',vars:['risk','familiarity','reversibility']},
    'D-IDENTITY':{goal:'事业身份/能力身份/原则与成长叙事的竞争解释',domain:'identity',actor:'未来自己',stakes:'high',rev:'low',pub:'na',resp:'self',fam:'na',layer:'mechanism',vars:['state','publicity']},
    'D-INFO':{goal:'压力性信息调节与普遍认知偏好的区分',domain:'information',actor:'无风险未知',stakes:'low',rev:'high',pub:'private',resp:'self',fam:'unknown',layer:'mechanism',vars:['risk','familiarity']},
    'D-RESP':{goal:'责任义务/责任价值/责任身份/控制补偿的区分',domain:'work',actor:'团队任务',stakes:'medium',rev:'medium',pub:'group',resp:'other',fam:'medium',layer:'mechanism',vars:['responsibility','publicity','risk']},
    'D-COOP':{goal:'合作倾向/和谐价值/冲突规则/撤离应对的区分',domain:'relationship',actor:'关系对象',stakes:'medium',rev:'high',pub:'private',resp:'shared',fam:'medium',layer:'mechanism',vars:['relation','risk','publicity']},
    'D-ETHICS':{goal:'原则与长期影响力的机制区分',domain:'ethics',actor:'组织',stakes:'high',rev:'medium',pub:'public',resp:'self',fam:'medium',layer:'mechanism',vars:['risk','publicity','responsibility']},
    'D-RECOG':{goal:'认可需求/价值资格/影响力/身份确认的区分',domain:'recognition',actor:'重要他人/社会',stakes:'medium',rev:'high',pub:'mixed',resp:'na',fam:'high',layer:'mechanism',vars:['relation','publicity','state']},
    'D-CONTROL':{goal:'风险可控需求/结构化认知/控制补偿/可靠性信念的区分',domain:'uncertainty',actor:'过程',stakes:'low',rev:'high',pub:'private',resp:'self',fam:'unknown',layer:'mechanism',vars:['risk','familiarity','responsibility']},
    'D-DECIDE':{goal:'最优搜索/决策效能/风险需求/确认调节的区分',domain:'decision',actor:'自己',stakes:'medium',rev:'high',pub:'private',resp:'self',fam:'unknown',layer:'mechanism',vars:['risk','reversibility','familiarity']},
    'D-DEPEND':{goal:'可靠性/依赖规则/自主需求/独立身份的区分',domain:'relationship',actor:'可靠他人',stakes:'medium',rev:'high',pub:'private',resp:'shared',fam:'high',layer:'mechanism',vars:['relation','responsibility','risk']},
    'D-WORK':{goal:'成就价值/胜任需求/事业身份/工作补偿的区分',domain:'career',actor:'自己',stakes:'medium',rev:'high',pub:'private',resp:'self',fam:'high',layer:'mechanism',vars:['state','publicity','risk']},
    'D-PROVE':{goal:'价值资格/认可需求/证明叙事/工作补偿的区分',domain:'identity',actor:'自己/重要他人',stakes:'medium',rev:'high',pub:'mixed',resp:'self',fam:'high',layer:'mechanism',vars:['state','publicity','relation']},

    'V-A-COOP':{goal:'在关系成本被移除后验证合作是否仍稳定',domain:'low_relation_cost',actor:'临时合作方',stakes:'medium',rev:'medium',pub:'limited',resp:'shared',fam:'medium',layer:'behavior',vars:['relation','publicity','risk']},
    'V-B-BLOCK':{goal:'在纯任务受阻场景复验挫败/愤怒/担忧',domain:'task',actor:'任务',stakes:'high',rev:'medium',pub:'private',resp:'self',fam:'medium',layer:'emotion',vars:['risk','responsibility','familiarity']},
    'V-C-UPDATE':{goal:'加入公开承诺成本后验证认知更新',domain:'decision',actor:'自己/他人',stakes:'medium',rev:'high',pub:'public',resp:'self',fam:'medium',layer:'cognition',vars:['publicity','risk','responsibility']},
    'V-D-ROLE':{goal:'移除他人评价后验证内部责任义务',domain:'responsibility',actor:'团队',stakes:'medium',rev:'medium',pub:'private',resp:'other',fam:'medium',layer:'belief',vars:['responsibility','publicity','relation']},
    'V-E-CONNECT':{goal:'在外部认可与亲密理解分离时验证需要排序',domain:'relationship',actor:'重要他人/外部',stakes:'high',rev:'low',pub:'mixed',resp:'na',fam:'high',layer:'need',vars:['relation','publicity','state']},
    'V-F-AUTO':{goal:'加入现实成本后验证自主价值强度',domain:'decision',actor:'自己',stakes:'high',rev:'medium',pub:'private',resp:'self',fam:'medium',layer:'value',vars:['risk','reversibility','state']},
    'V-G-CONT':{goal:'保留原则/创造/连续性后验证角色与能力是否仍是身份核心',domain:'identity',actor:'未来自己',stakes:'high',rev:'low',pub:'na',resp:'self',fam:'na',layer:'identity',vars:['state','publicity']},
    'V-H-INFO':{goal:'信息已足够时验证信息调节的停止边界',domain:'uncertainty',actor:'自己',stakes:'medium',rev:'high',pub:'private',resp:'self',fam:'medium',layer:'coping',vars:['risk','familiarity','reversibility']}
  };
  const layerLabels={behavior:'行为选择',emotion:'情绪体验',cognition:'认知加工',decision:'决策方式',appraisal:'解释判断',belief:'默认规则/信念',need:'需求感受',value:'价值取舍',identity:'自我认同',coping:'调节应对',mechanism:'机制原因'};
  all.forEach(q=>{
    const x=M[q.id]||{};
    q.metaV14={version:'V1.4',measurementGoal:x.goal||q.purpose||'',scenario:{domain:x.domain||'general',actor:x.actor||'未限定',stakes:x.stakes||'unknown',reversibility:x.rev||'unknown',publicity:x.pub||'unknown',responsibility:x.resp||'unknown',familiarity:x.fam||'unknown'},optionLayer:x.layer||'unknown',optionLayerLabel:layerLabels[x.layer]||'未定义',boundaryCandidates:x.vars||V,reviewStatus:'v1.4-reviewed',balanceRule:'功能性 / 中性 / 风险反应不得被预设为单一方向'};
  });
  const missing=all.filter(q=>!M[q.id]).map(q=>q.id);
  window.QIDI_V14_SCHEMA={version:'V1.4',questionCount:all.length,expectedCount:60,missing,variables:{relation:'对方是谁 / 关系远近',risk:'事情有多重要 / 失败代价',reversibility:'能不能重来 / 是否可逆',publicity:'是否公开 / 会不会被别人看到',responsibility:'责任到底在谁',familiarity:'我对这件事熟不熟',state:'当时状态 / 所处阶段'},getQuestionMeta:id=>all.find(q=>q.id===id)?.metaV14||null,questions:all.map(q=>({id:q.id,module:q.module,stage:q.stage,text:q.text,meta:q.metaV14,optionCount:q.options?.length||0}))};
  if(all.length!==60||missing.length)console.warn('[QIDI V1.4] question schema audit', {count:all.length,missing});
})();