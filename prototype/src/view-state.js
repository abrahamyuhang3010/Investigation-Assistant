export const VIEW_STATE_OPTIONS=['正常','加载中','空状态','加载失败','部分数据','无权限','数据过期'];

const STATE_KEYS={
  正常:'normal',
  加载中:'loading',
  空状态:'empty',
  加载失败:'error',
  部分数据:'partial',
  无权限:'permission',
  数据过期:'stale'
};

export function normalizeViewState(value){
  const label=VIEW_STATE_OPTIONS.includes(value)?value:'加载失败';
  return {label,key:STATE_KEYS[label],fallback:label!==value};
}

const action=(name,label)=>({name,label});

export function viewStateModel(route,value,context={}){
  const normalized=normalizeViewState(value);
  if(normalized.key==='normal')return null;
  const label=context.label||route||'当前页面';
  const identity=context.identity||'当前业务上下文';
  const source=context.source||'本地合成状态 fixture（非真实接口）';
  const common={
    ...normalized,
    route,
    contextLabel:label,
    identity,
    source,
    preserveContent:false,
    tone:'neutral',
    icon:'info'
  };
  if(normalized.fallback)return {
    ...common,
    title:'页面状态无法识别',
    description:'状态演示值不在当前支持范围内，已按加载失败处理；业务上下文未被清除。',
    facts:[`当前上下文：${identity}`,`状态来源：${source}`],
    action:action('view-state-recover-unknown','恢复正常页面状态')
  };
  if(normalized.key==='loading')return {
    ...common,
    title:'正在加载当前页面数据',
    description:'保留当前业务上下文，加载演示不会重新发起采集、调证或研判任务。',
    facts:[`当前上下文：${identity}`,`数据来源：${source}`],
    action:action('view-state-loading-complete','完成加载演示')
  };
  if(normalized.key==='empty')return {
    ...common,
    title:'首次进入暂无数据',
    description:`${label}当前没有可展示记录。这是首次无数据演示；筛选无结果仍由列表内部空状态和“清空筛选”处理。`,
    facts:[`当前上下文：${identity}`,`数据来源：${source}`],
    action:action('view-state-load-demo','载入本地演示数据')
  };
  if(normalized.key==='error')return {
    ...common,
    tone:'danger',
    icon:'shield',
    title:'页面数据加载失败',
    description:'当前内容未完成加载，已保留案件或任务上下文。可以重试本地演示加载；不会重复触发采集或调证。',
    facts:[`当前上下文：${identity}`,`失败范围：${context.failure||'当前页面数据读取'}`,`数据来源：${source}`],
    action:action('view-state-retry','重试加载')
  };
  if(normalized.key==='partial')return {
    ...common,
    tone:'warning',
    icon:'database',
    preserveContent:true,
    title:'部分数据可用',
    description:'已成功加载的内容继续保留；未完成范围单独披露，不将部分结果误写为过期快照。',
    facts:[`当前上下文：${identity}`,`已保留：${context.available||'当前已加载的页面内容'}`,`未完成：${context.missing||'补充数据范围未提供'}`,`相关来源：${source}`],
    action:action('view-state-retry-missing','重试缺失范围')
  };
  if(normalized.key==='permission')return {
    ...common,
    tone:'danger',
    icon:'shield',
    title:'当前范围无访问权限',
    description:'当前角色不能查看该范围的数据。原型没有可执行的权限申请能力，因此不提供无效申请入口。',
    facts:[`受限上下文：${identity}`,`功能限制：${context.permission||'当前页面业务数据不可查看'}`,`权限来源：本地角色与范围演示`],
    action:action('view-state-exit-permission-demo','退出无权限演示')
  };
  return {
    ...common,
    tone:'warning',
    icon:'clock',
    preserveContent:true,
    title:'数据快照已过期',
    description:'当前可获得的旧内容继续展示，但不应视为最新结果。刷新只恢复本地演示快照，不请求真实服务。',
    facts:[`当前上下文：${identity}`,context.timestamp||'数据更新时间：未提供',`数据来源：${source}`],
    action:action('view-state-refresh','刷新本地快照')
  };
}
