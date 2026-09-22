import {state} from './state.js';
import {esc,btn,tag} from './ui.js';
import {fitEntityGraphs} from './entity-node.js';
import {renderSuperSearchWorkspace,renderSuperSearchSidebar,toggleSuperSearchList} from './super-search.js';
import {ensureSuperSearchState,ensureSuperSearchLayout,getSuperSearchArtifact,getSuperSearchEntity,getSuperSearchTool,selectSuperQuery,startSuperQuery,approveSuperSearchPermission,cancelSuperSearchPermission,reopenSuperPermission,controlSuperTool,tickSuperSearch} from './super-search-model.js';
import {artifactPreview,downloadSuperArtifact,uploadSuperFile} from './super-search-files.js';

/** Capture only this page's local UI. No global shell or other route is altered. */
export function captureSuperSearchView(){
 if(!document.querySelector('.super-search-page'))return null;
 const focused=document.activeElement,root=focused?.closest('.ss-center,.ss-workspace,.ss-sidebar');
 return {scroll:[...document.querySelectorAll('.ss-right-content,.ss-messages,.ss-session-list')].map(e=>({className:(e.closest('#overlay')?'#overlay ':'.super-search-page ')+(e.classList.contains('ss-messages')?'.ss-messages':e.classList.contains('ss-session-list')?'.ss-session-list':'.ss-right-content'),top:e.scrollTop})),focus:root?{overlay:!!focused.closest('#overlay'),id:focused.id,action:focused.dataset.action,key:focused.dataset.id,tab:focused.dataset.tab,pane:focused.dataset.pane,control:focused.dataset.control,start:focused.selectionStart,end:focused.selectionEnd}:null};
}
export function restoreSuperSearchView(view){
 if(!document.querySelector('.super-search-page'))return;
 growComposer();
 if(view){for(const s of view.scroll)document.querySelector(s.className)?.scrollTo({top:s.top});const f=view.focus;let el;const scope=document.querySelector(f?.overlay?'#overlay':'.super-search-page');if(f?.id)el=scope?.querySelector('#'+CSS.escape(f.id));else if(f?.action)el=[...scope.querySelectorAll('[data-action]')].find(e=>e.dataset.action===f.action&&e.dataset.id===f.key&&e.dataset.tab===f.tab&&e.dataset.pane===f.pane&&e.dataset.control===f.control&&e.getClientRects().length);el?.focus({preventScroll:true});if(el?.setSelectionRange&&f.start!=null)el.setSelectionRange(f.start,f.end);}
}
function growComposer(){const el=document.querySelector('#super-search-prompt');if(el){el.style.height='auto';el.style.height=Math.min(144,Math.max(26,el.scrollHeight))+'px';}}
export function installSuperSearch({actions,forms,commit,render,persist,toast,modal,route}){
 const ss=ensureSuperSearchState,layout=ensureSuperSearchLayout;
 // CSS selector lists follow DOM order, not selector order. Explicitly prefer the drawer.
 const surface=selector=>document.querySelector('#overlay '+selector)||document.querySelector('.super-search-page '+selector);
 const scrollToSource=selector=>requestAnimationFrame(()=>surface(selector)?.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'}));
 function openWorkspace(){layout().rightCollapsed=false;update();if(matchMedia('(max-width:1199px)').matches&&!document.querySelector('#overlay .ss-workspace'))modal('研判空间',renderSuperSearchWorkspace(),{drawer:true});}
 function closeSessionMenu(){if(!layout().sessionMenuId)return;layout().sessionMenuId=null;persist();document.querySelectorAll('.ss-session-menu').forEach(el=>el.remove());document.querySelectorAll('[data-action="super-session-menu"]').forEach(el=>el.setAttribute('aria-expanded','false'));}

 const update=message=>{
  const view=captureSuperSearchView(),focused=document.activeElement,permission=focused?.dataset.superPermission;
  commit(message);
  const drawer=document.querySelector('#overlay .ss-workspace');
  if(drawer){drawer.outerHTML=renderSuperSearchWorkspace();fitEntityGraphs(document.querySelector('#overlay'));restoreSuperSearchView(view);if(permission)document.querySelector(`#overlay [data-super-permission="${permission}"]`)?.focus({preventScroll:true});}
 };
 function locate(toolId){const tool=getSuperSearchTool(toolId);if(!tool)throw Error('来源工具不可用。');selectSuperQuery(tool.queryId);const s=ss();s.activeTab='工作空间';if(!s.ui.expandedAgents.includes(tool.agentId))s.ui.expandedAgents.push(tool.agentId);if(!s.ui.expandedTools.includes(tool.id))s.ui.expandedTools.push(tool.id);s.ui.highlightTool=tool.id;s.ui.highlightUntil=Date.now()+1800;openWorkspace();scrollToSource(`[data-tool-id="${tool.id}"]`);setTimeout(()=>{document.querySelectorAll(`[data-tool-id="${tool.id}"]`).forEach(e=>e.classList.remove('is-highlighted'));if(s.ui.highlightTool===tool.id)s.ui.highlightTool=null;},1850);const panel=document.querySelector('.super-search-page .ss-workspace');if(panel&&!panel.getClientRects().length&&!document.querySelector('#overlay .ss-workspace'))modal('研判空间',renderSuperSearchWorkspace(),{drawer:true});}
 Object.assign(actions,{
  'super-pane-collapse':el=>{layout()[el.dataset.pane+'Collapsed']=true;if(el.closest('#overlay'))actions.close();update();document.querySelector(`.ss-expand-${el.dataset.pane}`)?.focus();},
  'super-pane-expand':el=>{const pane=el.dataset.pane;layout()[pane+'Collapsed']=false;update();if(pane==='right')openWorkspace();else if(matchMedia('(max-width:900px)').matches)modal('任务列表',renderSuperSearchSidebar(),{drawer:true});requestAnimationFrame(()=>surface(`[data-action="super-pane-collapse"][data-pane="${pane}"]`)?.focus());},
  'super-session-open':el=>{closeSessionMenu();if(el.closest('#overlay'))actions.close();actions['open-session'](el);},
  'super-session-menu':el=>{layout().sessionMenuId=layout().sessionMenuId===el.dataset.id?null:el.dataset.id;update();const drawer=document.querySelector('#overlay .ss-sidebar');if(drawer)drawer.outerHTML=renderSuperSearchSidebar();surface('.ss-session-menu button')?.focus();},
  'super-session-pin':el=>{toggleSuperSearchList(layout().pinnedSessions,el.dataset.id);closeSessionMenu();update();const drawer=document.querySelector('#overlay .ss-sidebar');if(drawer)drawer.outerHTML=renderSuperSearchSidebar();},
  'super-session-rename':el=>{closeSessionMenu();actions['rename-session'](el);},
  'super-session-archive':el=>{closeSessionMenu();actions['archive-session'](el);},
  'super-workspace-tab':el=>{ss().activeTab=el.dataset.tab;update();},
  'super-query-select':el=>{selectSuperQuery(el.dataset.id);update();},
  'super-permission-toggle':()=>{ss().ui.permissionExpanded=!ss().ui.permissionExpanded;update();},
  'super-permission-apply':el=>{if(approveSuperSearchPermission(el.dataset.id||'all'))update('模拟授权已批准；关联工具和子任务自动恢复。');},
  'super-permission-cancel':el=>{if(cancelSuperSearchPermission(el.dataset.id||'all'))update('已取消选中的权限申请，可在对应子任务下重新申请。');},
  'super-permission-reopen':el=>{reopenSuperPermission(el.dataset.id);update('已重新创建待处理申请。');},
  'super-agent-toggle':el=>{toggleSuperSearchList(ss().ui.expandedAgents,el.dataset.id);update();},
  'super-tool-toggle':el=>{toggleSuperSearchList(ss().ui.expandedTools,el.dataset.id);update();},
  'super-folder-toggle':el=>{toggleSuperSearchList(ss().ui.expandedFolders,el.dataset.id);update();},
  'super-tool-control':el=>{controlSuperTool(el.dataset.id,el.dataset.control);update();},
  'super-task-source':el=>{const tool=ss().agents.flatMap(a=>a.toolCalls).find(t=>t.subtaskId===el.dataset.id&&t.status!=='done')||ss().agents.flatMap(a=>a.toolCalls).find(t=>t.subtaskId===el.dataset.id);if(tool)locate(tool.id);},
  'super-file-locate':el=>{const a=getSuperSearchArtifact(el.dataset.id);if(a?.toolCallId)locate(a.toolCallId);},
  'super-artifact-focus':el=>{const a=getSuperSearchArtifact(el.dataset.id);if(!a)return;const s=ss();s.activeTab='文档空间';if(!s.ui.expandedFolders.includes(a.queryId))s.ui.expandedFolders.push(a.queryId);s.ui.highlightArtifact=a.id;openWorkspace();scrollToSource(`[data-artifact-id="${a.id}"]`);setTimeout(()=>{s.ui.highlightArtifact=null;document.querySelectorAll(`[data-artifact-id="${a.id}"]`).forEach(row=>row.classList.remove('is-highlighted'));},1800);},
  'super-file-preview':el=>{const a=getSuperSearchArtifact(el.dataset.id);if(!a)throw Error('未找到文件。');const t=a.toolCallId?getSuperSearchTool(a.toolCallId):null;modal(a.name,`<div class="ss-preview"><div class="ss-preview-meta">${tag(a.type)}${tag(a.sourceType==='user_upload'?'用户上传':'合成示例')}${btn('下载文件','super-file-download',`data-id="${a.id}"`,'small')}</div>${artifactPreview(a)}<dl class="ss-preview-source"><div><dt>查询 / 子任务</dt><dd>${esc(a.queryId||'用户上传')} / ${esc(a.subtaskId||'—')}</dd></div><div><dt>执行来源</dt><dd>${esc(t?`${t.agentId==='data-analysis-agent'?'数据分析 Agent':'信息获取 Agent'} → ${t.toolId}`:'用户上传原始材料')}</dd></div></dl></div>`,{wide:true});},
  'super-file-download':async el=>{await downloadSuperArtifact(getSuperSearchArtifact(el.dataset.id));},
  'super-entity-detail':el=>{if(!getSuperSearchEntity(el.dataset.id))return;ss().graph.selected=el.dataset.id;ss().ui.selectedEntityId=el.dataset.id;update();},
  'super-entity-source':el=>{if(el.dataset.toolId)locate(el.dataset.toolId);},
  'super-recommend':el=>{ss().draft=el.dataset.query;update();document.querySelector('#super-search-prompt')?.focus();},
  'super-upload':()=>{modal('上传会话材料',`<form id="super-search-upload"><p class="muted">材料仅保存在本地浏览器，不上传至服务器。单文件上限 1 MB。</p><label class="field"><span>选择文件</span><input name="file" type="file" accept=".txt,.md,.json,.csv,.xlsx,.pdf,.zip,.png,.jpg,.jpeg,.webp,.gif" required></label><div class="form-error" role="alert"></div><div class="form-actions">${btn('取消','close')}<button class="btn primary" type="submit">添加到文档空间</button></div></form>`);}
 });
 for(const name of ['node-select','node-more','node-execution','node-zoom','node-fit']){const original=actions[name];actions[name]=el=>{if(el.dataset.graphId!=='superSearch'&&el.closest('[data-graph]')?.dataset.graph!=='superSearch')return original(el);if(name==='node-zoom'||name==='node-fit'){const graph=el.closest('.ss-workspace').querySelector('[data-graph]');ss().graph.zoom=name==='node-fit'?'fit':Math.max(.35,Math.min(1.5,Number(graph?.dataset.scale||1)+Number(el.dataset.delta)));update();}else if(name==='node-execution'){const entity=getSuperSearchEntity(el.dataset.id);if(entity?.sourceRefs[0]?.toolCallId)locate(entity.sourceRefs[0].toolCallId);}else actions['super-entity-detail'](el);};}
 forms['super-search-composer']=data=>{if(!state.permission||!state.loggedIn)throw Error('当前账号不能发起研判任务。');const text=String(data.get('prompt')||'').trim();if(!text||text.length>2000)throw Error('请输入 1–2000 字的研判问题。');startSuperQuery(text);update('已新增一轮查询，使用张三合成样本演示执行。');document.querySelector('.ss-messages')?.scrollTo({top:0});};
 forms['super-search-upload']=async data=>{const a=await uploadSuperFile(data.get('file'),ss());if(a){actions.close();update('文件已加入本会话的用户上传目录。');}};
 document.addEventListener('input',e=>{if(e.target.id==='super-history-search'){layout().historySearch=e.target.value;closeSessionMenu();const root=e.target.closest('.ss-sidebar'),query=e.target.value.toLocaleLowerCase();let count=0;root.querySelectorAll('.ss-session-row').forEach(row=>{const session=state.sessions.find(s=>s.id===row.dataset.sessionId);row.hidden=!session?.title.toLocaleLowerCase().includes(query);if(!row.hidden)count++;});root.querySelector('.ss-history-empty').hidden=!!count;persist();return;}if(e.target.id!=='super-search-prompt')return;growComposer();ss().draft=e.target.value;const send=document.querySelector('#super-search-composer [type=submit]');if(send)send.disabled=!e.target.value.trim();persist();});
 document.addEventListener('change',e=>{const id=e.target.dataset.superPermission;if(!id)return;const list=ss().ui.selectedPermissions;const index=list.indexOf(id);if(e.target.checked&&index<0)list.push(id);if(!e.target.checked&&index>=0)list.splice(index,1);update();});
 document.addEventListener('focusin',e=>{if(route()==='PG05'&&layout().sessionMenuId&&!e.target.closest('.ss-session-row'))closeSessionMenu();});
 document.addEventListener('click',e=>{if(route()==='PG05'&&!e.target.closest('.ss-session-row'))closeSessionMenu();});
 document.addEventListener('keydown',e=>{
  if(route()==='PG05'&&e.key==='Escape'&&layout().sessionMenuId){const id=layout().sessionMenuId;closeSessionMenu();surface(`[data-action="super-session-menu"][data-id="${id}"]`)?.focus();}
  if(e.target.closest('.ss-session-menu')&&['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const items=[...e.target.closest('.ss-session-menu').querySelectorAll('button')],index=items.indexOf(e.target);items[e.key==='Home'?0:e.key==='End'?items.length-1:(index+(e.key==='ArrowDown'?1:items.length-1))%items.length].focus();}

  if(e.target.id==='super-search-prompt'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&e.keyCode!==229){e.preventDefault();e.target.form.requestSubmit();}
  if(e.target.matches('.ss-workspace [role=tab]')&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tabs=[...e.target.parentElement.children];const index=e.key==='Home'?0:e.key==='End'?2:(tabs.indexOf(e.target)+(e.key==='ArrowRight'?1:2))%3;const tab=tabs[index].dataset.tab,inDrawer=!!e.target.closest('#overlay');ss().activeTab=tab;update();document.querySelector(`${inDrawer?'#overlay ':'.super-search-page '}.ss-workspace [data-tab="${tab}"]`)?.focus();}
 });
 // Native pan/zoom stays isolated to the entity canvas, never the conversation scroll.
 let pan=null;
 document.addEventListener('pointerdown',e=>{const viewport=e.target.closest('.ss-graph-canvas .entity-viewport');if(!viewport||e.target.closest('.entity-node')||e.button!==0)return;pan={viewport,x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};viewport.setPointerCapture(e.pointerId);viewport.classList.add('is-panning');});
 document.addEventListener('pointermove',e=>{if(!pan)return;pan.viewport.scrollLeft=pan.left-(e.clientX-pan.x);pan.viewport.scrollTop=pan.top-(e.clientY-pan.y);});
 for(const name of ['pointerup','pointercancel'])document.addEventListener(name,()=>{pan?.viewport.classList.remove('is-panning');pan=null;});
 const hover=(e,on)=>{const node=e.target.closest('.ss-graph-canvas .entity-node');if(!node||node.contains(e.relatedTarget))return;const s=ss(),edges=node.closest('.entity-graph').querySelectorAll('.entity-edges path');node.closest('.entity-graph').classList.toggle('ss-graph-hover',on);s.relations.forEach((r,i)=>edges[i]?.classList.toggle('ss-edge-active',on&&(r.from===node.dataset.nodeId||r.to===node.dataset.nodeId)));};
 document.addEventListener('mouseover',e=>hover(e,true));document.addEventListener('mouseout',e=>hover(e,false));
 setInterval(()=>{if(!state.loggedIn||!state.permission)return;if(tickSuperSearch()){persist();if(route()==='PG05'){const overlay=document.querySelector('#overlay');if(!overlay.children.length||overlay.querySelector('.ss-workspace'))update();}}},450);
}
