import {eventTemplate} from './event-workflow-template.js';
import {caseWorkbenchHeading} from './case-workbench.js';
import {investigationCardBody, investigationCardModel, investigationIconFor} from './entity-node.js';
import {formatDateTime, formatMoney} from './formatters.js';

let eventHost, controller, eventStyleSheetPromise;

function createEventStyleSheet() {
  if (!('adoptedStyleSheets' in Document.prototype) || !('replace' in CSSStyleSheet.prototype)) return null;
  eventStyleSheetPromise ||= Promise.all([
    fetch('/src/event-workflow-tokens.css').then(response => {
      if (!response.ok) throw new Error('Failed to load event workflow tokens');
      return response.text();
    }),
    fetch('/src/event-workflow.css').then(response => {
      if (!response.ok) throw new Error('Failed to load event workflow styles');
      return response.text();
    })
  ]).then(async ([tokens, styles]) => {
    const sheet = new CSSStyleSheet();
    await sheet.replace(tokens + '\n' + styles.replace(/^@import\s+url\([^)]*event-workflow-tokens\.css[^)]*\);?\s*/m, ''));
    return sheet;
  });
  return eventStyleSheetPromise;
}

function installEventStyles(host, root) {
  const sheetPromise = createEventStyleSheet();
  if (!sheetPromise) {
    root.insertAdjacentHTML('afterbegin', '<link rel="stylesheet" href="/src/event-workflow.css">');
    return;
  }
  host.style.display = 'none';
  sheetPromise.then(sheet => {
    root.adoptedStyleSheets = [sheet];
    host.style.removeProperty('display');
  }).catch(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/src/event-workflow.css';
    link.addEventListener('load', () => host.style.removeProperty('display'), {once:true});
    link.addEventListener('error', () => host.style.removeProperty('display'), {once:true});
    root.prepend(link);
  });
}
export function eventWorkflowContext() {
  return controller?.context?.() || {page:'list',taskId:'',taskName:'未选择任务',rootEntityId:'',rootLabel:'初始实体未选择',created:''};
}
export function renderEventWorkflow() {
  return '<div id="event-workflow-heading">' + caseWorkbenchHeading('event') + '</div><div id="event-workflow-slot"></div>';
}
export function mountEventWorkflow() {
  const slot = document.getElementById('event-workflow-slot');
  if (!slot) { controller?.suspend(); return; }
  if (!eventHost) {
    eventHost = document.createElement('event-workflow');
    const root = eventHost.attachShadow({mode:'open'});
    root.innerHTML = eventTemplate;
    installEventStyles(eventHost, root);
    slot.append(eventHost);
    controller = initializeEventWorkflow(root);
  } else slot.append(eventHost);
  eventHost.dataset.theme = document.documentElement.dataset.theme || 'light';
  controller.restore();
}

function initializeEventWorkflow(root) {
  'use strict';

  const $ = function (id) { return root.getElementById(id); };
  const all = function (selector) { return Array.from(root.querySelectorAll(selector)); };
  const esc = function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  };
  const icon = function (name) { return '<svg class="icon"><use href="#i-' + name + '"></use></svg>'; };
  const identifierCopy = {
    '网络账号': {label:'网络账号', placeholder:'请输入网络账号标识', missing:'请填写网络账号标识', invalid:'请输入有效的网络账号标识'},
    '银行卡': {label:'银行卡号', placeholder:'请输入银行卡号', missing:'请填写银行卡号', invalid:'银行卡号应为 8–30 位数字'},
    '人': {label:'身份证号', placeholder:'请输入身份证号', missing:'请填写身份证号', invalid:'身份证号应为 6–30 位数字或 X'},
  };
  function setFieldError(control, message) {
    if (!control) return false;
    const errorId = control.getAttribute('aria-describedby')?.split(/\s+/).find(function (id) { return id.endsWith('-error'); });
    const error = errorId ? $(errorId) : null;
    if (error) error.textContent = message || '';
    if (message) control.setAttribute('aria-invalid', 'true'); else control.removeAttribute('aria-invalid');
    return !message;
  }
  function clearFieldError(control) { return setFieldError(control, ''); }
  function clearDialogErrors(dialog) {
    dialog.querySelectorAll('[aria-invalid=true]').forEach(function (control) { control.removeAttribute('aria-invalid'); });
    dialog.querySelectorAll('.field-error').forEach(function (error) { error.textContent = ''; });
  }
  function requireField(control, message) {
    const missing = !String(control?.value || '').trim();
    setFieldError(control, missing ? message : '');
    if (missing) control?.focus();
    return !missing;
  }
  function updateIdentifierControl(label, control, type) {
    const copy = identifierCopy[type] || identifierCopy['网络账号'];
    if (label?.firstChild) label.firstChild.textContent = copy.label;
    if (control) {
      control.placeholder = copy.placeholder;
      control.setAttribute('aria-label', copy.label);
    }
    return copy;
  }
  const entities = [
    { id: 'network-wxid-zs001', type: 'network', cardType: 'net-account', kind: '网络账号', title: '网络账号', platform: '微信账号', account: 'wxid_zs001', name: '微信账号 wxid_zs001', identifier: '▣ 微信账号  wxid_zs001', stat: '范围待核验', detail: '账号与任务 Task2026090001 通过稳定实体ID关联', tags: '初始实体', pos: 'node-network' },
    { id: 'network-abmen', type: 'network', cardType: 'net-account', kind: '网络账号', title: '网络账号', platform: '微信账号', account: 'AbMen', name: '微信账号 AbMen', identifier: '▣ 微信账号  AbMen', stat: '总计转出：250000.00元', detail: '首次 2025-08-18 · ¥250000.00\n最后 2025-08-18 · ¥250000.00', tags: '活跃账号', pos: 'node-network' },
    { id: 'bank1', type: 'bank', cardType: 'fund-bank-l1', kind: '银行卡', title: '一级 · 银行卡', name: '李四', owner: '李四', cardNumber: '621700001064789359', bank: '建设银行', identifier: '▣ 621700001064789359　李四\n   建设银行', stat: '共收 ¥200000.00 · 可疑 ¥0.00', detail: '2025-08-18 转入 ¥250000.00\n2025-09-01 转出 ¥250000.00', tags: '已冻结　快捷转出', footer: '查人员位置　››', pos: 'node-bank-one', parentId: 'network-wxid-zs001' },
    { id: 'bank2', type: 'bank', cardType: 'fund-bank-l1', kind: '银行卡', title: '一级 · 银行卡', name: '王五', owner: '王五', cardNumber: '6228270457000050000', bank: '建设银行', identifier: '▣ 6228270457000050000　王五\n   建设银行', stat: '共收 ¥200000.00 · 可疑 ¥0.00', detail: '2025-08-18 转入 ¥250000.00\n2025-09-01 转出 ¥250000.00', tags: '已冻结　快捷转出', footer: '查人员位置　››', pos: 'node-bank-one', parentId: 'network-abmen' },
    { id: 'person', type: 'person', cardType: 'person', kind: '人', title: '高传真', name: '高传真', nationalId: '32058320250001234', identifier: '◉ 32058320250001234', tags: '关联受害人', inferred: true, pos: 'node-person', parentId: 'network-wxid-zs001' },
    { id: 'person-abmen', type: 'person', cardType: 'person', kind: '人', title: '唐利岩', name: '唐利岩', nationalId: '320583199001010018', identifier: '◉ 320583199001010018', tags: '主体待核验', inferred: true, pos: 'node-person', parentId: 'network-abmen' }
  ];
  const entityTransactions = {
    bank1: {
      source: '本地合成任务夹具 · Task2026090001',
      updatedAt: '2026-09-29 10:20:00',
      rows: [
        { id: 'EVT-0001-A', time: '2026-09-29 09:46:00', direction: '出账', amount: '30000.00', name: '陈六', account: '622827045700000001', source: '合成银行卡流水片段' },
        { id: 'EVT-0001-B', time: '2026-09-29 10:08:00', direction: '出账', amount: '12000.00', name: '周七', account: '621700001064780006', source: '合成银行卡流水片段' },
      ],
    },
    bank2: {
      source: '本地合成任务夹具 · Task2026090002',
      updatedAt: '2026-09-28 11:05:00',
      rows: [
        { id: 'EVT-0002-A', time: '2026-09-28 10:42:00', direction: '出账', amount: '50000.00', name: '陈六', account: '622827045700000002', source: '合成银行卡流水片段' },
      ],
    },
  };
  const tasks = [
    { id: 'event-task-2026090001', name: 'Task2026090001', rootEntityId: 'network-wxid-zs001', graphEntityIds: ['network-wxid-zs001','bank1','person'], status: '进行中', updated: true, creator: '王建国', unit: '演示研判一组', created: '2026-09-29 09:30:00', iso: '2026-09-29', note: '无备注' },
    { id: 'event-task-2026090002', name: 'Task2026090002', rootEntityId: 'network-abmen', graphEntityIds: ['network-abmen','bank2','person-abmen'], status: '已完成', updated: true, creator: '王建国', unit: '演示研判一组', created: '2026-09-28 09:30:00', iso: '2026-09-28', note: '无备注' },
    { id: 'event-task-2026090003', name: 'Task2026090003', rootEntityId: 'network-wxid-zs001', graphEntityIds: ['network-wxid-zs001','bank1','person'], status: '任务失败', updated: true, creator: '王建国', unit: '演示研判一组', created: '2026-09-27 09:30:00', iso: '2026-09-27', note: '无备注' },
    { id: 'event-task-2026090004', name: 'Task2026090004', rootEntityId: 'network-abmen', graphEntityIds: ['network-abmen','bank2','person-abmen'], status: '待开始', updated: false, creator: '王建国', unit: '演示研判一组', created: '2026-09-26 09:30:00', iso: '2026-09-26', note: '无备注' },
    { id: 'event-task-2026090005', name: 'Task2026090005', rootEntityId: 'network-wxid-zs001', graphEntityIds: ['network-wxid-zs001','bank1','person'], status: '已完成', updated: false, creator: '王建国', unit: '演示研判一组', created: '2026-09-25 09:30:00', iso: '2026-09-25', note: '无备注' },
    { id: 'event-task-2026090006', name: 'Task2026090006', rootEntityId: 'network-abmen', graphEntityIds: ['network-abmen','bank2','person-abmen'], status: '已完成', updated: false, creator: '王建国', unit: '演示研判一组', created: '2026-09-24 09:30:00', iso: '2026-09-24', note: '无备注' },
    { id: 'event-task-2026090007', name: 'Task2026090007', rootEntityId: 'network-wxid-zs001', graphEntityIds: ['network-wxid-zs001','bank1','person'], status: '进行中', updated: false, creator: '王建国', unit: '演示研判一组', created: '2026-09-23 09:30:00', iso: '2026-09-23', note: '无备注' }
  ];
  const taskRootEntity = function (task) { return entities.find(function (entity) { return entity.id === task?.rootEntityId; }); };
  const taskEntityDisplay = function (task) {
    const entity = taskRootEntity(task);
    if (!entity) return '初始实体待补充';
    const value = entity.type === 'bank' ? entity.cardNumber : entity.type === 'person' ? entity.nationalId : entity.account;
    return entity.kind + '（' + (entity.type === 'network' && entity.platform ? entity.platform + ' ' : '') + (value || '待补充') + '）';
  };
  const currentTask = function () { return tasks[state.currentTask] || tasks[0]; };
  const currentRootId = function () { return currentTask()?.rootEntityId; };
  const activeEntities = function () {
    const ids = new Set(currentTask()?.graphEntityIds || []);
    return entities.filter(function (entity) { return ids.has(entity.id); });
  };
  const entityIdentifier = function (entity) {
    return entity?.type === 'bank' ? entity.cardNumber || '' : entity?.type === 'person' ? entity.nationalId || '' : entity?.account || '';
  };
  function selectTask(index) {
    const changed = state.currentTask !== index;
    state.currentTask = index;
    if (!changed) return;
    const rootId = currentRootId();
    state.entity = rootId;
    state.childParentId = rootId;
    state.drawer = null;
    state.dialog = null;
    state.menu = null;
    state.collapsedBranches.clear();
    state.entityList = false;
    state.graphQuery = '';
    state.graphKind = 'all';
    state.zoom = 1;
    state.graphLayerOpen = false;
    state.graphViewOpen = false;
    state.graphActionsOpen = false;
    state.graphSearchOpen = false;
    state.graphFilterOpen = false;
    state.selectedExisting = { create: '', child: '' };
    state.selectedTools = new Set(['terminal']);
    $('graph-search-input').value = '';
  }
  function entityFromInput(kind, raw, platform) {
    const value = String(raw || '').trim();
    if (kind === '银行卡') {
      const parts = value.split('·').map(function (item) { return item.trim(); });
      return { type: 'bank', kind: kind, cardNumber: parts[0], owner: parts[1] || '待核验', name: parts[1] || '待核验', bank: '待核验' };
    }
    if (kind === '人') {
      const parts = value.split('·').map(function (item) { return item.trim(); });
      return { type: 'person', kind: kind, name: parts[0] || '待核验', nationalId: parts[1] || parts[0] };
    }
    const matched = value.match(/^([^\s]+账号)\s+(.+)$/);
    return { type: 'network', kind: kind, platform: platform || matched?.[1] || '网络账号', account: matched?.[2] || value, name: (platform || matched?.[1] || '网络账号') + ' ' + (matched?.[2] || value) };
  }
  function refreshEntityPresentation(entity) {
    entity.cardType = cardTypeForKind(entity.kind);
    if (entity.type === 'bank') {
      entity.owner = entity.owner || entity.name || '待核验';
      entity.name = entity.owner;
      entity.title = entity.title?.includes('一级') ? entity.title : '一级 · 银行卡';
      entity.identifier = '▣ ' + entity.cardNumber + '　' + entity.owner + '\n   ' + (entity.bank || '开户行待核验');
    } else if (entity.type === 'person') {
      entity.title = entity.name || '人员';
      entity.identifier = '◉ ' + entity.nationalId;
    } else {
      entity.title = '网络账号';
      entity.name = (entity.platform || '网络账号') + ' ' + entity.account;
      entity.identifier = '▣ ' + (entity.platform || '网络账号') + '  ' + entity.account;
    }
  }
  function validIdentifier(kind, value) {
    if (!value || /^[*•·xX\s-]+$/.test(value)) return false;
    if (kind === '银行卡') return /^\d{8,30}$/.test(value);
    if (kind === '人') return /^[0-9Xx]{6,30}$/.test(value);
    return value.length <= 120;
  }
  const toolDefs = [
    { id: 'payment', name: '调取网络支付账号主体及流水信息（金之盾）', recommendation: '调取网络支付账号主体及流水信息', advice: '通过【国家反诈大数据平台/金之盾】核查账号 {account} 的主体信息，并查询约定时间范围内流水。' },
    { id: 'terminal', name: '研判网络账号登录终端（锋刃/猎刃）', recommendation: '研判网络账号登录终端', advice: '使用【锋刃/猎刃】调查登录终端、历史访问行为及相关网络账号，辅助案件研判。' },
    { id: 'trace', name: '网络账号溯源定位', recommendation: '网络账号溯源定位', advice: '使用【云芳】开展网络账号溯源，结合设备信息、历史 IP 和平台行为追踪线索。' },
    { id: 'third', name: '调取第三方主体信息（国反/金之盾）', recommendation: '调取第三方主体信息', advice: '调查账号 {account} 的第三方关联账号、社交关系及网络支付机构，补充侦查依据。' },
    { id: 'ip', name: '调取账号使用设备IP（网安）', recommendation: '调取账号使用设备IP', advice: '通过线下渠道获取设备使用 IP，用于继续开展分析。' }
  ];
  const bankTool = { id: 'banklookup', name: '调取银行卡开户主体及流水信息（国反/金之盾）', recommendation: '调取银行卡开户主体及流水信息', advice: '核查银行卡开户主体和交易流水，补充资金流向依据。' };
  const lookupOptions = {
    '网络账号': ['微信账号 wxid_zs001', '微信账号 AbMen'],
    '银行卡': ['621700001064789359 · 李四', '6228270457000050000 · 王五'],
    '人': ['唐利岩 · 320583199001010018', '高传真 · 320583198801020014']
  };
  const emptyEventFilters = function () { return { entity: '', update: 'all', from: '', to: '' }; };
  const state = {
    page: 'list', drawer: null, dialog: null, currentTask: 0, entity: tasks[0].rootEntityId, menu: null,
    zoom: 1, collapsedBranches: new Set(), entityList: false, graphQuery: '', graphKind: 'all', graphLayerOpen: false, graphViewOpen: false, graphActionsOpen: false, graphSearchOpen: false, graphFilterOpen: false, graphLayers: { recorded: true, inferred: true }, childEdit: false,
    appliedFilters: emptyEventFilters(), filterDraft: emptyEventFilters(),
    selectedExisting: { create: '', child: '' }, selectedTools: new Set(['terminal']),
    authorized: new Set(['payment', 'terminal', 'trace', 'third', 'banklookup']), pendingPermissions: new Set(),
    recommendationStatus: { payment: '调证成功', terminal: '待调证', trace: '调证失败', third: '待调证', ip: '待调证' },
    permissionOrigin: 'entity', reasonVisible: false, notes: [], newNodeCount: 0, childParentId: tasks[0].rootEntityId
  };
  let toastTimer;

  function toast(message) {
    $('event-toast').textContent = message;
    $('event-toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $('event-toast').hidden = true; }, 2700);
  }
  function statusHTML(status) {
    const kind = status === '已完成' || status === '调证成功' ? 'success' :
      status === '任务失败' || status === '调证失败' ? 'error' :
      status === '进行中' || status === '待调证' || status === '调证中' || status === '权限待审批' ? 'warning' : 'neutral';
    return '<span class="status status-' + kind + '"><span class="status-dot"></span>' + esc(status) + '</span>';
  }
  let activeLayer = null;
  let ownsScrollLock = false, previousOverflow = '';
  function releaseScrollLock() {
    if (ownsScrollLock) document.body.style.overflow = previousOverflow;
    ownsScrollLock = false;
  }
  const focusOrigins = new Map();
  function setLayer() {
    const workbenchMain = root.host.closest('main');
    const workbenchHeading = workbenchMain?.querySelector('#event-workflow-heading');
    if (workbenchHeading) workbenchHeading.hidden = state.page === 'graph';
    workbenchMain?.classList.toggle('event-graph-active', state.page === 'graph');
    $('list-page').hidden = state.page !== 'list';
    $('graph-page').hidden = state.page !== 'graph';
    $('backdrop').hidden = !state.drawer;
    $('dialog-backdrop').hidden = !state.dialog;
    ['task-detail-drawer', 'task-edit-drawer', 'entity-drawer'].forEach(function (id) { $(id).hidden = true; });
    ['create-dialog', 'child-dialog', 'retrieval-dialog', 'permission-dialog', 'note-dialog'].forEach(function (id) { $(id).hidden = true; });
    const drawerIds = { task: 'task-detail-drawer', edit: 'task-edit-drawer', entity: 'entity-drawer' };
    const dialogIds = { create: 'create-dialog', child: 'child-dialog', retrieval: 'retrieval-dialog', permission: 'permission-dialog', note: 'note-dialog' };
    if (state.drawer) $(drawerIds[state.drawer]).hidden = false;
    if (state.dialog) $(dialogIds[state.dialog]).hidden = false;
    const nextLayer = state.dialog ? $(dialogIds[state.dialog]) : state.drawer ? $(drawerIds[state.drawer]) : null;
    [root.host.closest('main')?.querySelector('.case-workbench-heading'), document.querySelector('.header'), document.querySelector('.prototype-bar')].filter(Boolean).forEach(el => { el.inert = !!nextLayer; });
    $('list-page').inert = !!nextLayer;
    $('graph-page').inert = !!nextLayer;
    Object.values(drawerIds).forEach(id => { $(id).inert = !!state.dialog; });
    if (nextLayer) {
      if (!ownsScrollLock) previousOverflow = document.body.style.overflow;
      ownsScrollLock = true; document.body.style.overflow = 'hidden';
    } else releaseScrollLock();
    if (nextLayer !== activeLayer) {
      const previous = activeLayer;
      if (nextLayer && !focusOrigins.has(nextLayer)) focusOrigins.set(nextLayer, root.activeElement);
      activeLayer = nextLayer;
      const restore = previous && focusOrigins.get(previous);
      if (previous && previous.hidden) focusOrigins.delete(previous);
      if (restore?.isConnected && !restore.closest('[hidden]') && (!nextLayer || nextLayer.contains(restore))) restore.focus();
      else if (nextLayer) { nextLayer.tabIndex = -1; (nextLayer.querySelector('button,input') || nextLayer).focus(); }
    }
  }
  function openDialog(dialog) { state.dialog = dialog; setLayer(); }
  function closeDialog() { state.dialog = null; state.reasonVisible = false; setLayer(); }
  function showList() { state.page = 'list'; state.drawer = null; state.dialog = null; state.menu = null; $('map-panel').classList.remove('fullscreen'); setLayer(); renderTasks(); }
  function showGraph() {
    state.page = 'graph'; state.drawer = null; state.dialog = null; state.menu = null;
    $('graph-task-name').textContent = tasks[state.currentTask].name;
    renderGraph(); setLayer();
    requestAnimationFrame(function () { applyGraphScale(state.zoom); focusGraphEntity(currentRootId()); });
  }
  function graphSize() {
    return { width: 1540, height: parseFloat($('graph-stage').style.height) || 760 };
  }
  function updateGraphZoomLabel(scale) {
    const label = Math.round(scale * 100) + '%';
    all('.zoom-percent').forEach(function (control) {
      control.textContent = label;
      control.setAttribute('aria-label', '当前缩放 ' + label + '；点击恢复 100%');
      control.title = '当前缩放 ' + label + '；点击恢复 100%';
    });
  }
  function applyGraphScale(requested) {
    const viewport = $('graph-viewport'), stage = $('graph-stage'), extent = $('graph-extent');
    const size = graphSize();
    const fit = Math.min(1, (viewport.clientWidth - 32) / size.width, (viewport.clientHeight - 32) / size.height);
    const scale = requested === 'fit' ? Math.max(.35, fit) : Math.max(.35, Math.min(1.5, Number(requested) || 1));
    stage.style.transform = 'scale(' + scale + ')';
    stage.style.transformOrigin = '0 0';
    extent.style.width = (size.width * scale) + 'px';
    extent.style.height = (size.height * scale) + 'px';
    $('map-panel').dataset.scale = String(scale);
    updateGraphZoomLabel(scale);
    return scale;
  }
  function focusGraphEntity(id) {
    const viewport = $('graph-viewport'), node = root.querySelector('[data-node="' + id + '"]');
    if (!node) return;
    const scale = Number($('map-panel').dataset.scale || 1);
    const left = (node.offsetLeft + node.offsetWidth / 2) * scale - viewport.clientWidth / 2;
    const top = (node.offsetTop + Math.min(node.offsetHeight, 180) / 2) * scale - viewport.clientHeight / 2;
    viewport.scrollTo({ left: Math.max(0, left), top: Math.max(0, top) });
  }
  function resetGraph() {
    state.zoom = 1;
    applyGraphScale(1);
    focusGraphEntity(state.entity || currentRootId());
  }
  function fitGraph() {
    const scale = applyGraphScale('fit');
    state.zoom = Number(scale.toFixed(3));
    $('graph-viewport').scrollTo({left:0, top:0});
  }
  function zoomGraph(factor) {
    const viewport = $('graph-viewport');
    const oldScale = Number($('map-panel').dataset.scale || applyGraphScale(state.zoom));
    const next = Math.max(.35, Math.min(1.5, oldScale * factor));
    const centerX = viewport.clientWidth / 2, centerY = viewport.clientHeight / 2;
    const contentX = (viewport.scrollLeft + centerX) / oldScale;
    const contentY = (viewport.scrollTop + centerY) / oldScale;
    state.zoom = Number(next.toFixed(3));
    applyGraphScale(state.zoom);
    viewport.scrollLeft = contentX * next - centerX;
    viewport.scrollTop = contentY * next - centerY;
  }
  function installGraphInteractions() {
    const viewport = $('graph-viewport');
    viewport.addEventListener('wheel', function (event) {
      if (state.page !== 'graph') return;
      event.preventDefault();
      const oldScale = Number($('map-panel').dataset.scale || applyGraphScale(state.zoom));
      const next = Math.max(.35, Math.min(1.5, oldScale * (event.deltaY < 0 ? 1.1 : .9)));
      const rect = viewport.getBoundingClientRect();
      const pointerX = event.clientX - rect.left, pointerY = event.clientY - rect.top;
      const contentX = (viewport.scrollLeft + pointerX) / oldScale;
      const contentY = (viewport.scrollTop + pointerY) / oldScale;
      state.zoom = Number(next.toFixed(3));
      applyGraphScale(state.zoom);
      viewport.scrollLeft = contentX * next - pointerX;
      viewport.scrollTop = contentY * next - pointerY;
    }, { passive: false });
    let drag = null;
    viewport.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || event.target.closest('button,.graph-node,.graph-popover,.entity-list-panel,.map-toolbar-menu,.graph-legend,.graph-zoom-controls')) return;
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
      viewport.classList.add('is-panning');
      viewport.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    viewport.addEventListener('pointermove', function (event) {
      if (!drag || drag.id !== event.pointerId) return;
      viewport.scrollLeft = drag.left - (event.clientX - drag.x);
      viewport.scrollTop = drag.top - (event.clientY - drag.y);
    });
    const stop = function (event) {
      if (!drag || drag.id !== event.pointerId) return;
      drag = null; viewport.classList.remove('is-panning');
    };
    viewport.addEventListener('pointerup', stop);
    viewport.addEventListener('pointercancel', stop);
  }
  function syncFilterControls(filters) {
    $('filter-entity').value = filters.entity || '';
    $('date-start').value = filters.from || '';
    $('date-end').value = filters.to || '';
    all('[data-update]').forEach(function (item) { item.classList.toggle('selected', item.dataset.update === filters.update); });
  }
  function filterSummary(filters) {
    const parts = [];
    if (filters.entity) parts.push('线索要素：' + filters.entity);
    if (filters.update === 'new') parts.push('更新状态：有更新');
    if (filters.from || filters.to) parts.push('创建时间：' + (filters.from || '不限') + ' 至 ' + (filters.to || '不限'));
    return parts;
  }
  function renderFilterSummary() {
    const parts = filterSummary(state.appliedFilters), summary = $('applied-filter-summary');
    summary.hidden = !parts.length;
    summary.textContent = parts.length ? '已应用 ' + parts.length + ' 项条件：' + parts.join('；') : '';
  }
  function renderTasks() {
    const query = $('task-search').value.trim().toLowerCase();
    const filters = state.appliedFilters;
    const visible = tasks.map(function (task, index) { return { task: task, index: index }; }).filter(function (item) {
      const task = item.task;
      const display = taskEntityDisplay(task);
      return (!query || (task.name + ' ' + display).toLowerCase().includes(query)) &&
        (!filters.entity || display.includes(filters.entity)) &&
        (filters.update === 'all' || task.updated) &&
        (!filters.from || task.iso >= filters.from) && (!filters.to || task.iso <= filters.to);
    });
    $('task-rows').innerHTML = visible.map(function (item) {
      const task = item.task;
      return '<tr><td>' + (item.index + 1) + '</td><td><div class="task-name-cell"><strong>' + esc(task.name) +
        '</strong>' + (task.updated ? '<span class="update-badge">有更新</span>' : '') +
        '</div></td><td>' + statusHTML(task.status) + '</td><td>' + esc(formatDateTime(task.created)) +
        '</td><td>' + esc(taskEntityDisplay(task)) + '</td><td>' + esc(task.creator) + '</td><td>' + esc(task.unit) +
        '</td><td><div class="table-actions"><button type="button" class="link-button" data-action="task-detail" data-index="' +
        item.index + '">详情</button><button type="button" class="link-button" data-action="task-edit" data-index="' +
        item.index + '">编辑</button></div></td></tr>';
    }).join('');
    $('task-empty').hidden = visible.length !== 0;
    $('table-count').textContent = '共 ' + visible.length + ' 条';
    $('task-rows').parentElement.hidden = visible.length === 0;
    renderFilterSummary();
  }
  function openTaskDetail(index) {
    selectTask(index);
    const task = tasks[index];
    $('task-detail-title').textContent = task.name;
    $('task-detail-fields').innerHTML = [
      ['任务名称：', task.name], ['初始实体：', taskEntityDisplay(task)], ['任务状态：', statusHTML(task.status)],
      ['任务创建人：', task.creator], ['所属单位：', task.unit], ['备注：', task.note || '无备注']
    ].map(function (pair) { return '<dt>' + pair[0] + '</dt><dd>' + (pair[0] === '任务状态：' ? pair[1] : esc(pair[1])) + '</dd>'; }).join('');
    state.drawer = 'task'; setLayer();
  }
  function openTaskEdit(index) {
    selectTask(index);
    const task = tasks[index], form = $('task-edit-form');
    form.elements.name.value = task.name; form.elements.entity.value = taskEntityDisplay(task);
    form.elements.creator.value = task.creator; form.elements.unit.value = task.unit;
    form.elements.note.value = task.note === '无备注' ? '' : task.note;
    $('edit-note-counter').textContent = form.elements.note.value.length + ' / 1500';
    state.drawer = 'edit'; setLayer();
  }
  function resetCreate() {
    $('create-name').value = ''; $('create-account').value = ''; $('create-account-full').value = '';
    $('create-platform').value = ''; $('create-meta').hidden = true;
    $('create-quick').hidden = false; $('create-entity-expanded').hidden = true; $('create-tool-section').hidden = true;
    $('create-entity-type').value = '网络账号'; $('create-entity-type-full').value = '网络账号';
    root.querySelector('input[name="create-new"][value="yes"]').checked = true;
    $('create-new-fields').hidden = false; $('create-existing-fields').hidden = true;
    $('create-parameters').innerHTML = ''; state.selectedExisting.create = '';
    $('create-dialog').querySelector('.dialog-body').scrollTop = 0;
    syncType('create');
    renderToolOptions('create-tool-list', true);
  }
  function revealCreate() {
    if (!$('create-entity-expanded').hidden) return;
    $('create-account-full').value = $('create-account').value;
    $('create-entity-type-full').value = $('create-entity-type').value;
    $('create-quick').hidden = true; $('create-entity-expanded').hidden = false; $('create-tool-section').hidden = false;
    syncType('create');
  }
  function syncType(purpose) {
    const type = purpose === 'create' ? ($('create-entity-expanded').hidden ? $('create-entity-type').value : $('create-entity-type-full').value) : $('child-type').value;
    state.selectedExisting[purpose] = '';
    if (purpose === 'create') {
      $('create-entity-type').value = type;
      $('create-entity-type-full').value = type;
      updateIdentifierControl($('create-account-quick-label'), $('create-account'), type);
      updateIdentifierControl($('create-account-label'), $('create-account-full'), type);
    } else updateIdentifierControl($('child-account-label'), $('child-account'), type);
    $(purpose + '-network-fields').hidden = type !== '网络账号';
    const platform = $(purpose + '-platform');
    if (platform) {
      platform.toggleAttribute('required', type === '网络账号');
      platform.setAttribute('aria-required', String(type === '网络账号'));
      if (type !== '网络账号') clearFieldError(platform);
    }
    const lookupLabel = root.querySelector('label[for="' + purpose + '-lookup"]');
    if (lookupLabel) lookupLabel.textContent = type === '人' ? '身份证号' : type === '银行卡' ? '银行卡号' : '网络账号';
    clearFieldError(purpose === 'create' ? $('create-account') : $('child-account'));
    clearFieldError(purpose === 'create' ? $('create-account-full') : $('child-account'));
    renderLookup(purpose);
  }
  function setNewMode(purpose, value) {
    $(purpose + '-new-fields').hidden = value !== 'yes';
    $(purpose + '-existing-fields').hidden = value !== 'no';
    if (value === 'no') renderLookup(purpose);
  }
  function renderLookup(purpose) {
    const term = $(purpose + '-lookup').value.trim();
    const type = purpose === 'create' ? $('create-entity-type-full').value : $('child-type').value;
    const options = (lookupOptions[type] || []).filter(function (option) { return !term || option.includes(term); });
    $(purpose + '-results').innerHTML = options.map(function (option, index) {
      return '<button type="button" class="' + (state.selectedExisting[purpose] === option ? 'selected' : '') +
        '" data-action="select-existing" data-purpose="' + purpose + '" data-value="' + esc(option) + '">◉　' + esc(option) + '</button>';
    }).join('') || '<div class="section-empty" style="min-height:48px;margin:0">未找到实体</div>';
  }
  function renderToolOptions(containerId, compact) {
    const available = containerId === 'retrieval-tools' && currentEntity().type === 'bank' ? [bankTool] : toolDefs;
    $(containerId).innerHTML = available.map(function (tool) {
      return '<label><input type="checkbox" data-tool="' + tool.id + '"><span>' + esc(tool.name) + '</span>' +
        (compact ? '' : '<em class="' + (tool.id === 'ip' && !state.authorized.has('ip') ? 'permission-required' : '') +
          '" data-action="' + (tool.id === 'ip' && !state.authorized.has('ip') ? 'expand-approvers' : '') +
          '">' + (state.authorized.has(tool.id) ? '已授权' + (tool.id === 'ip' ? '（剩余有效期 59m 59s）' : '') :
          state.pendingPermissions.has(tool.id) ? '权限待审批' : '申请调用权限　⌄') + '</em>') + '</label>';
    }).join('');
  }
  function openCreate() { resetCreate(); clearDialogErrors($('create-dialog')); openDialog('create'); }
  function createTask() {
    const name = $('create-name').value.trim();
    if (!requireField($('create-name'), '请填写任务名称')) { toast('请检查必填字段'); return; }
    const expanded = !$('create-entity-expanded').hidden;
    const mode = root.querySelector('input[name="create-new"]:checked').value;
    const type = expanded ? $('create-entity-type-full').value : $('create-entity-type').value;
    const accountControl = expanded ? $('create-account-full') : $('create-account');
    const account = expanded && mode === 'no' ? state.selectedExisting.create : accountControl.value.trim();
    if (!account) {
      const message = mode === 'no' && expanded ? '请选择已有实体' : (identifierCopy[type] || identifierCopy['网络账号']).missing;
      setFieldError(expanded && mode === 'no' ? $('create-lookup') : accountControl, message);
      (expanded && mode === 'no' ? $('create-lookup') : accountControl).focus();
      toast('请检查必填字段'); return;
    }
    if (type === '网络账号' && expanded && mode !== 'no' && !requireField($('create-platform'), '请填写平台名称')) { toast('请检查必填字段'); return; }
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    state.newNodeCount += 1;
    const taskId = 'event-task-' + Date.now();
    const rootId = taskId + '-root';
    const rootEntity = { id: rootId, cardType: cardTypeForKind(type), title: type, tags: '初始实体', pos: 'node-network', stat: '待调证', detail: '本地合成任务初始实体', ...entityFromInput(type, account, $('create-platform').value.trim()) };
    refreshEntityPresentation(rootEntity);
    entities.push(rootEntity);
    tasks.unshift({ id: taskId, name: name, rootEntityId: rootId, graphEntityIds: [rootId], status: '待开始', updated: false, creator: '王建国', unit: '演示研判一组', created: date + ' 12:00:00', iso: date, note: '无备注' });
    selectTask(0); state.entity = rootId; state.childParentId = rootId;
    closeDialog(); renderTasks(); toast('研判任务已创建');
  }
  function cardTypeForKind(kind) { return kind === '银行卡' ? 'fund-bank-l1' : kind === '人' ? 'person' : 'net-account'; }
  function childrenMap() {
    const result = new Map(), rootId = currentRootId();
    activeEntities().forEach(function (entity) {
      if (entity.id === rootId) return;
      const parent = entity.parentId || rootId;
      if (!result.has(parent)) result.set(parent, []);
      result.get(parent).push(entity.id);
    });
    return result;
  }
  function visibleGraphEntities() {
    const children = childrenMap(), hidden = new Set();
    const hideDescendants = function (id) {
      (children.get(id) || []).forEach(function (child) {
        if (hidden.has(child)) return;
        hidden.add(child); hideDescendants(child);
      });
    };
    state.collapsedBranches.forEach(hideDescendants);
    const query = state.graphQuery.trim().toLowerCase();
    return activeEntities().filter(function (entity) {
      if (hidden.has(entity.id)) return false;
      if (state.graphKind !== 'all' && entity.type !== state.graphKind) return false;
      return !query || (entity.title + ' ' + entity.name + ' ' + entity.identifier).toLowerCase().includes(query);
    });
  }
  function nodeHTML(entity, children) {
    const menu = state.menu === entity.id;
    const model = investigationCardModel(entity);
    const body = '<span class="node-body">' + investigationCardBody(entity) + '</span>';
    const menuHtml = menu ? '<div id="card-menu-' + esc(entity.id) + '" class="card-menu" role="menu" aria-label="' + esc(entity.title) + '操作">' +
      (['bank', 'network'].includes(entity.type) ? '<button role="menuitem" type="button" data-action="card-retrieval" data-id="' + entity.id + '">发起调证</button>' : '') +
      '<button role="menuitem" type="button" data-action="card-add" data-id="' + entity.id + '">＋ 添加子卡片</button>' +
      '<button role="menuitem" type="button" data-action="card-edit" data-id="' + entity.id + '">编辑</button>' +
      '<button role="menuitem" type="button" data-action="card-dim" data-id="' + entity.id + '">' + (entity.dimmed ? '取消置灰' : '◉ 置灰') + '</button></div>' : '';
    const hasChildren = children.has(entity.id);
    const branch = hasChildren ? '<button type="button" class="branch-toggle' + (state.collapsedBranches.has(entity.id) ? ' is-collapsed' : '') + '" data-action="branch-toggle" data-id="' + entity.id + '" aria-expanded="' + (!state.collapsedBranches.has(entity.id)) + '" aria-label="' + esc(entity.title) + '，' + (state.collapsedBranches.has(entity.id) ? '展开' : '收起') + '所有下级卡片"><i></i><span aria-hidden="true">' + (state.collapsedBranches.has(entity.id) ? '+' : '−') + '</span></button>' : '';
    return '<article class="graph-node entity-clue-card ' + esc(entity.pos) + (entity.dimmed ? ' is-dimmed' : '') + (hasChildren ? ' has-children' : '') +
      '" data-node="' + esc(entity.id) + '" data-card-type="' + esc(model.type) + '"' + (entity.offset ? ' style="top:' + entity.offset + 'px"' : '') +
      '><div class="node-top"><span class="node-type-icon ' + esc(model.category) + '"><img src="' + investigationIconFor(entity) + '" alt=""></span><strong>' + esc(entity.title) +
      '</strong>' + (model.manual && (model.type === 'net-wifi' || model.type === 'net-sdk') ? '<span class="clue-manual">人工创建</span>' : '') +
      '<button type="button" class="node-menu-trigger" aria-haspopup="menu" aria-expanded="' + menu + '" aria-controls="card-menu-' + esc(entity.id) + '" data-action="card-menu" data-id="' + entity.id +
      '" aria-label="' + esc(entity.title) + '操作菜单">' + icon('more') +
      '</button></div><button type="button" class="node-main" data-action="open-entity" data-id="' + entity.id + '">' +
      body + '</button>' + branch + menuHtml + '</article>';
  }
  function positionGraphMenu(menuId,action) {
    const menu = $(menuId), trigger = root.querySelector('[data-action="' + action + '"]');
    if (!menu || menu.hidden || !trigger) return;
    const rect = trigger.getBoundingClientRect(), width = menu.offsetWidth || 184;
    menu.style.left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width)) + 'px';
    menu.style.top = Math.min(window.innerHeight - menu.offsetHeight - 8, rect.bottom + 8) + 'px';
  }
  function renderGraph() {
    const stageHeight = Math.max(760, 250 + Math.max(0, state.newNodeCount - 1) * 230 + 210);
    const children = childrenMap(), visible = visibleGraphEntities(), visibleIds = new Set(visible.map(function (entity) { return entity.id; }));
    $('graph-stage').style.minHeight = stageHeight + 'px';
    $('graph-stage').style.height = stageHeight + 'px';
    $('graph-edges').setAttribute('viewBox', '0 0 1540 ' + stageHeight);
    $('graph-nodes').innerHTML = visible.map(function (entity) { return nodeHTML(entity, children); }).join('');
    requestAnimationFrame(function () {
      const paths = visible.filter(function (entity) { return entity.id !== currentRootId(); }).map(function (entity) {
        const parentId = entity.parentId || currentRootId();
        if (!visibleIds.has(parentId)) return '';
        const relationLayer = entity.inferred || entity.manual ? 'inferred' : 'recorded';
        if (!state.graphLayers[relationLayer]) return '';
        const parent = root.querySelector('[data-node="' + parentId + '"]');
        const node = root.querySelector('[data-node="' + entity.id + '"]');
        if (!parent || !node) return '';
        const fromX = parent.offsetLeft + parent.offsetWidth;
        const fromY = parent.offsetTop + 20;
        const toX = node.offsetLeft;
        const toY = node.offsetTop + 20;
        const midX = fromX + Math.max(48, (toX - fromX) / 2);
        return '<path class="' + (entity.inferred || entity.manual ? 'inferred' : 'recorded') + '" d="M ' + fromX + ' ' + fromY + ' C ' + midX + ' ' + fromY + ', ' + midX + ' ' + toY + ', ' + toX + ' ' + toY + '"></path>';
      });
      $('graph-edges').innerHTML = paths.join('');
      applyGraphScale(state.zoom);
    });
    $('entity-list-panel').hidden = !state.entityList;
    $('entity-list-items').innerHTML = visible.map(function (entity) {
      return '<button type="button" class="entity-item" data-action="open-entity" data-id="' + entity.id + '">' +
        '<span class="node-type-icon ' + investigationCardModel(entity).category + '"><img src="' + investigationIconFor(entity) + '" alt=""></span><span>' +
        esc(entity.title === '一级 · 银行卡' ? entity.name + ' · 银行卡' : entity.name) + '</span></button>';
    }).join('') || '<div class="section-empty">没有匹配实体</div>';
    [['graph-layer-menu','graph-layer','graphLayerOpen'],['graph-view-menu','graph-view','graphViewOpen'],['graph-actions-menu','graph-actions','graphActionsOpen']].forEach(function (entry) {
      const menu=$(entry[0]), open=state[entry[2]];
      menu.hidden=!open;
      root.querySelector('[data-action="'+entry[1]+'"]').setAttribute('aria-expanded',String(open));
      if(open) requestAnimationFrame(function(){positionGraphMenu(entry[0],entry[1]);});
    });
    all('[data-action="toggle-graph-layer"]').forEach(function(button){button.setAttribute('aria-pressed',String(state.graphLayers[button.dataset.layer]));});
    $('graph-search-panel').hidden = !state.graphSearchOpen;
    $('graph-filter-panel').hidden = !state.graphFilterOpen;
    all('[data-action="graph-filter-kind"]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.kind === state.graphKind)); });
    const fullLabel = root.querySelector('.fullscreen-label');
    if (fullLabel) fullLabel.textContent = $('map-panel').classList.contains('fullscreen') ? '退出全屏' : '全屏';
  }
  function currentEntity() { return activeEntities().find(function (entity) { return entity.id === state.entity; }) || taskRootEntity(currentTask()) || activeEntities()[0]; }
  function recommendationItems() {
    const entity = currentEntity();
    if (entity.type === 'person') return [];
    if (entity.type === 'bank') return [bankTool];
    return [toolDefs[0], toolDefs[1], toolDefs[2], toolDefs[3], toolDefs[4]];
  }
  function renderRecommendations() {
    const recs = recommendationItems();
    $('suggestion-anchor').textContent = '调证建议（' + recs.length + '）';
    $('recommendations').innerHTML = recs.length ? recs.map(function (tool, index) {
      const pendingPermission = tool.id === 'ip' && state.pendingPermissions.has('ip');
      const status = pendingPermission ? '权限待审批' : state.recommendationStatus[tool.id] || '待调证';
      const needsPermission = tool.id === 'ip' && !state.authorized.has('ip');
      const label = pendingPermission ? '查看申请状态' : needsPermission ? '申请权限' : status === '调证成功' || status === '调证失败' ? '重新调证' :
        '发起调证' + (tool.id === 'ip' ? '（剩余有效期 59m 59s）' : '');
      return '<article class="recommendation"><div class="recommendation-head"><span class="recommendation-icon">' +
        icon('spark') + '</span><strong>' + (index + 1) + '、' + esc(tool.recommendation) + '</strong>' + statusHTML(status) +
        '<button type="button" class="link-button" data-action="recommend-action" data-tool="' + tool.id + '">' +
        esc(label) + '</button></div><div class="recommendation-body"><div class="recommendation-meta">' +
        '本地合成演示 · 状态仅用于交互预览，未调用调证服务，无真实调证文档</div>' +
        '<div class="recommendation-advice"><span>侦查建议：</span><div>' + esc(tool.advice.replaceAll('{account}', entityIdentifier(currentEntity()) || '待核验账号')) +
        '</div></div></div></article>';
    }).join('') : '<div class="section-empty">当前实体暂无调证建议</div>';
  }
  function renderEntityScope(entity) {
    const task = tasks[state.currentTask];
    const fixture = entityTransactions[entity.id];
    const rows = fixture?.rows || [];
    const amount = rows.reduce(function (sum, row) { return sum + Number(row.amount || 0); }, 0);
    const relatedBanks = task.graphEntityIds.map(function (id) { return entities.find(function (item) { return item.id === id; }); }).filter(function (item) { return item?.type === 'bank' && item.id !== entity.id; });
    const identifier = entity.type === 'bank' ? '银行卡尾号' + String(entity.cardNumber || '').slice(-4) : entityIdentifier(entity) || entity.id;
    const source = fixture?.source || '当前任务的本地合成实体夹具';
    const updatedAt = fixture?.updatedAt ? formatDateTime(fixture.updatedAt) : '未提供交易更新时间';
    $('entity-scope').innerHTML = '<strong>数据范围说明</strong><dl>' +
      '<div><dt>当前实体</dt><dd>' + esc(identifier) + '</dd></div>' +
      '<div><dt>当前任务</dt><dd>' + esc(task.name) + '</dd></div>' +
      '<div><dt>纳入规则</dt><dd>' + esc(entity.type === 'bank' ? '仅纳入当前银行卡稳定实体 ID 直接关联的合成出账记录' : '当前实体没有直接绑定的资金明细') + '</dd></div>' +
      '<div><dt>直接来源</dt><dd>' + esc(source) + '</dd></div>' +
      '<div><dt>数据更新时间</dt><dd>' + esc(updatedAt) + '</dd></div>' +
      '<div><dt>验证边界</dt><dd>本地合成 fixture，未接入真实接口</dd></div></dl>' +
      '<p>' + esc(relatedBanks.length ? '当前任务中的其他银行卡记录不计入本实体统计。' : '未发现需要并入当前实体统计的关联银行卡记录。') + '</p>';
    $('entity-transaction-summary').textContent = '共 ' + rows.length + ' 条 · 合计 ' + formatMoney(amount);
    $('entity-transaction-rows').innerHTML = rows.length ? rows.map(function (row) {
      return '<tr><td title="' + esc(formatDateTime(row.time)) + '">' + esc(formatDateTime(row.time)) + '</td><td>' + esc(row.direction) + '</td><td>' + esc(formatMoney(row.amount)) + '</td><td>' + esc(row.name || '待核验') + '</td><td>' + esc(row.account || '—') + '</td><td>' + esc(row.id || '—') + '</td><td>' + esc(row.source || source) + '</td></tr>';
    }).join('') : '<tr><td colspan="7" class="transaction-empty">当前实体暂无直接绑定的资金明细；不会复用其他实体的银行卡交易记录。</td></tr>';
  }

  function openEntity(id) {
    state.entity = id; state.menu = null;
    const entity = currentEntity();
    const stableTail = function (value) { const text = String(value || '').replace(/\s/g, ''); return text ? text.slice(-4) : ''; };
    $('entity-title').textContent = entity.type === 'network' ? '网络账号 · ' + (entity.account || entity.id) :
      entity.type === 'bank' ? '银行卡 · ' + (stableTail(entity.cardNumber) ? '尾号' + stableTail(entity.cardNumber) : entity.id) :
        '人员 · ' + (stableTail(entity.nationalId) ? '身份证尾号' + stableTail(entity.nationalId) : entity.id);
    const detailRows = [$('entity-bank').parentElement, $('entity-card-number').parentElement, $('entity-owner').parentElement];
    if (entity.type === 'bank') {
      detailRows[0].querySelector('dt').textContent = '开户行'; detailRows[1].querySelector('dt').textContent = '银行卡号'; detailRows[2].querySelector('dt').textContent = '开户人姓名';
      $('entity-bank').textContent = entity.bank || '待核验'; $('entity-card-number').textContent = entity.cardNumber; $('entity-owner').textContent = entity.owner || entity.name || '待核验';
    } else if (entity.type === 'network') {
      detailRows[0].querySelector('dt').textContent = '账号平台'; detailRows[1].querySelector('dt').textContent = '网络账号'; detailRows[2].querySelector('dt').textContent = '实名信息';
      $('entity-bank').textContent = entity.platform || '待核验'; $('entity-card-number').textContent = entity.account; $('entity-owner').textContent = entity.realName || '待核验';
    } else {
      detailRows[0].querySelector('dt').textContent = '实体类型'; detailRows[1].querySelector('dt').textContent = '身份证号'; detailRows[2].querySelector('dt').textContent = '姓名';
      $('entity-bank').textContent = '人员'; $('entity-card-number').textContent = entity.nationalId || '待核验'; $('entity-owner').textContent = entity.name;
    }
    renderEntityScope(entity);
    $('entity-basic-view').hidden = false; $('entity-notes-view').hidden = true; $('entity-results-view').hidden = true;
    all('[data-entity-tab]').forEach(function (button) { button.classList.toggle('active', button.dataset.entityTab === 'basic'); });
    $('entity-content').scrollTop = 0;
    renderRecommendations(); renderGraph();
    // renderGraph replaces node buttons; focus the equivalent stable-ID trigger so the drawer can restore focus on close.
    root.querySelector('[data-action="open-entity"][data-id="' + id + '"]')?.focus({ preventScroll: true });
    state.drawer = 'entity'; setLayer();
  }
  function switchEntityTab(tab) {
    all('[data-entity-tab]').forEach(function (button) { button.classList.toggle('active', button.dataset.entityTab === tab); });
    $('entity-basic-view').hidden = tab === 'notes' || tab === 'results';
    $('entity-notes-view').hidden = tab !== 'notes';
    $('entity-results-view').hidden = tab !== 'results';
    $('entity-content').scrollTop = 0;
    if (tab === 'suggestions') $('suggestion-anchor').scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  function approversHTML(origin) {
    const pending = state.pendingPermissions.has('ip');
    return [0, 1, 2].map(function (item) {
      const unavailable = pending || item === 0;
      return '<div class="approver"><div class="approver-avatar">人</div><div class="approver-info"><strong>马妍颖</strong>' +
        '<small>吉林市公安局 网安大队</small></div><button type="button" class="btn ' +
        (unavailable ? 'btn-secondary' : 'btn-primary') + '" ' +
        (unavailable ? 'disabled' : 'data-action="request-permission" data-origin="' + origin + '"') +
        '>' + (pending ? '待审批' : item === 0 ? '待审批' : '发起申请') + '</button></div>';
    }).join('');
  }
  function openPermission(origin) {
    state.permissionOrigin = origin; state.reasonVisible = false;
    const pending = state.pendingPermissions.has('ip');
    $('permission-title').textContent = pending ? '权限申请待审批' : '申请工具：调取账号使用设备IP（网安）调用权限';
    $('permission-approvers').innerHTML = approversHTML('entity');
    $('permission-reason').hidden = true; $('permission-submit').hidden = true;
    $('permission-simulate').hidden = !pending;
    $('permission-back').textContent = '返回实体详情';
    openDialog('permission');
  }
  function openRetrieval(preselect) {
    state.drawer = null; state.selectedTools = new Set(preselect ? [preselect] : [currentEntity().type === 'bank' ? 'banklookup' : 'terminal']);
    state.reasonVisible = false; $('retrieval-reason').hidden = true;
    $('retrieval-submit').textContent = '发起调证';
    renderRetrieval();
    openDialog('retrieval');
  }
  function renderRetrieval() {
    renderToolOptions('retrieval-tools', false);
    all('#retrieval-tools [data-tool]').forEach(function (check) { check.checked = state.selectedTools.has(check.dataset.tool); });
    $('retrieval-approvers').innerHTML = approversHTML('retrieval');
    $('retrieval-permission').hidden = state.authorized.has('ip');
  }
  function submitRetrieval() {
    if (state.reasonVisible) { submitPermission('retrieval'); return; }
    if (!state.selectedTools.size) { toast('请选择至少一个调证工具'); return; }
    if (state.selectedTools.has('ip') && !state.authorized.has('ip')) { toast('该工具需先申请调用权限'); $('retrieval-permission').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
    state.selectedTools.forEach(function (id) { state.recommendationStatus[id] = '调证中'; });
    closeDialog(); renderRecommendations(); renderGraph(); toast('已进入本地模拟调证中；未调用服务端，无真实结果');
  }
  function submitPermission(origin) {
    const input = origin === 'retrieval' ? $('retrieval-reason-input') : $('permission-reason-input');
    if (!input.value.trim()) { toast('请填写申请事由'); input.focus(); return; }
    state.pendingPermissions.add('ip');
    state.reasonVisible = false; input.value = '';
    closeDialog(); renderRecommendations(); renderGraph();
    toast('权限申请已提交，等待审批后方可调用');
  }
  function simulatePermissionApproval() {
    state.pendingPermissions.delete('ip'); state.authorized.add('ip');
    closeDialog(); renderRecommendations(); renderGraph();
    toast('演示审批已通过（合成状态）');
  }
  function openChild(edit) {
    state.childEdit = Boolean(edit);
    $('child-dialog').classList.toggle('child-compact', !edit);
    $('child-dialog').classList.toggle('dialog-short-form', Boolean(edit));
    $('child-dialog').classList.toggle('is-entity-edit', Boolean(edit));
    clearDialogErrors($('child-dialog'));
    $('child-title').textContent = edit ? '编辑实体' : '添加子卡片';
    $('child-dialog').querySelector('.dialog-footer .btn-primary').textContent = edit ? '保存' : '发起调证';
    const entity = currentEntity();
    $('child-type').value = edit ? entity.kind : '网络账号';
    $('child-type').disabled = Boolean(edit);
    $('child-account').value = edit ? entityIdentifier(entity) : '';
    $('child-platform').value = edit && entity.type === 'network' ? entity.platform || '' : '';
    $('child-lookup').value = ''; state.selectedExisting.child = '';
    root.querySelector('input[name="child-new"][value="yes"]').checked = true;
    setNewMode('child', 'yes'); $('child-parameters').innerHTML = ''; syncType('child');
    $('child-dialog').querySelector('.dialog-body').scrollTop = 0;
    state.menu = null; renderGraph(); openDialog('child');
  }
  function saveChild() {
    const existing = root.querySelector('input[name="child-new"]:checked').value === 'no';
    const kind = $('child-type').value;
    const value = existing ? state.selectedExisting.child : $('child-account').value.trim();
    if (!value) {
      const control = existing ? $('child-lookup') : $('child-account');
      setFieldError(control, existing ? '请选择已有实体' : (identifierCopy[kind] || identifierCopy['网络账号']).missing);
      control.focus(); toast('请检查必填字段'); return;
    }
    if (!existing && kind === '网络账号' && !requireField($('child-platform'), '请填写平台名称')) { toast('请检查必填字段'); return; }
    if (state.childEdit) {
      const entity = currentEntity(), entityKind = entity.kind;
      if (!validIdentifier(entityKind, value)) {
        setFieldError($('child-account'), (identifierCopy[entityKind] || identifierCopy['网络账号']).invalid);
        $('child-account').focus(); toast('实体标识格式不正确，未保存'); return;
      }
      if (entity.type === 'bank') entity.cardNumber = value;
      else if (entity.type === 'person') entity.nationalId = value;
      else { entity.account = value; entity.platform = $('child-platform').value.trim() || entity.platform || '网络账号'; }
      entity.manual = true; refreshEntityPresentation(entity);
      closeDialog(); renderGraph(); toast('实体信息已保存'); return;
    }
    state.newNodeCount += 1;
    const parsed = entityFromInput(kind, value, $('child-platform').value.trim());
    if (!validIdentifier(kind, entityIdentifier(parsed))) {
      setFieldError($('child-account'), (identifierCopy[kind] || identifierCopy['网络账号']).invalid);
      $('child-account').focus(); toast('实体标识格式不正确，未添加'); return;
    }
    const id = currentTask().id + '-added-' + state.newNodeCount;
    const added = { id: id, cardType: cardTypeForKind(kind), title: kind, tags: existing ? '关联已有实体' : '人工补充', manual: true, inferred: true, parentId: state.childParentId,
      pos: 'node-added', offset: 250 + (state.newNodeCount - 1) * 230, stat: '待调证', detail: '', footer: '', ...parsed };
    refreshEntityPresentation(added); entities.push(added); currentTask().graphEntityIds.push(id);
    state.entity = id;
    closeDialog(); renderGraph(); toast('子卡片已添加至侦查导图');
    openRetrieval();
  }
  function addParameter(target) {
    const wrapper = document.createElement('div');
    wrapper.className = 'extra-parameter';
    wrapper.innerHTML = '<input aria-label="参数名称" placeholder="参数名称"><input aria-label="参数值" placeholder="参数值">' +
      '<button type="button" data-action="remove-parameter" aria-label="删除参数">×</button>';
    $(target).appendChild(wrapper);
  }
  function saveNote() {
    const value = $('note-input').value.trim();
    if (!value) { toast('请填写笔记内容'); return; }
    state.notes.unshift({ content: value, time: new Date().toLocaleString('zh-CN') });
    $('note-list').innerHTML = state.notes.map(function (note) { return '<div class="note-item">' + esc(note.content) + '<small>' + esc(note.time) + '</small></div>'; }).join('');
    $('note-input').value = ''; closeDialog(); switchEntityTab('notes'); toast('笔记已保存');
  }
  function exportGraph() {
    const visible = visibleGraphEntities();
    const labels = visible.map(function (entity) {
      const x = entity.id === currentRootId() ? 250 : entity.pos === 'node-added' ? 1150 : 700;
      const y = entity.id === currentRootId() ? 280 : entity.type === 'bank' ? 80 : entity.type === 'person' ? 520 : (entity.offset || 300);
      return '<rect x="' + x + '" y="' + y + '" width="322" height="110" rx="16" fill="#ffffff" stroke="#d0d5dd"/>' +
        '<text x="' + (x + 14) + '" y="' + (y + 28) + '" font-family="sans-serif" font-size="13" font-weight="700" fill="#101828">' +
        esc(entity.title) + '</text><text x="' + (x + 14) + '" y="' + (y + 55) + '" font-family="sans-serif" font-size="11" fill="#475467">' +
        esc(entity.name) + '</text>';
    }).join('');
    const stageHeight = graphSize().height;
    const source = '<svg xmlns="http://www.w3.org/2000/svg" width="1540" height="' + stageHeight + '" viewBox="0 0 1540 ' + stageHeight + '">' +
      '<rect width="1540" height="' + stageHeight + '" fill="#f2f4f7"/>' +
      $('graph-edges').innerHTML.replace(/<path/g, '<path fill="none" stroke="#bfc7d1" stroke-width="2"') + labels + '</svg>';
    const url = URL.createObjectURL(new Blob([source], { type: 'image/svg+xml;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = '因事研判_侦查导图.svg'; link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast('导图已导出为 SVG');
  }
  function updateCounter(inputId, countId) { $(countId).textContent = $(inputId).value.length + ' / 1500'; }

  root.addEventListener('click', function (event) {
    event.stopPropagation();
    const tab = event.target.closest('[data-entity-tab]');
    if (tab) return switchEntityTab(tab.dataset.entityTab);
    const button = event.target.closest('[data-action]');
    if (!button) {
      let changed = false;
      if (state.menu && !event.target.closest('.card-menu')) { state.menu = null; changed = true; }
      if ((state.graphLayerOpen || state.graphViewOpen || state.graphActionsOpen) && !event.target.closest('.map-menu-wrap,.map-toolbar-menu')) { state.graphLayerOpen = false; state.graphViewOpen = false; state.graphActionsOpen = false; changed = true; }
      if (state.graphFilterOpen && !event.target.closest('#graph-filter-panel')) { state.graphFilterOpen = false; changed = true; }
      if (changed) renderGraph();
      return;
    }
    const action = button.dataset.action, id = button.dataset.id;
    if (button.tagName === 'A') event.preventDefault();
    if (action === 'new-task') return openCreate();
    if (action === 'toggle-filter') {
      const opening = $('filter-panel').hidden;
      if (opening) { state.filterDraft = Object.assign(emptyEventFilters(), state.appliedFilters); syncFilterControls(state.filterDraft); }
      $('filter-panel').hidden = !opening; button.setAttribute('aria-expanded', String(opening));
      return;
    }
    if (action === 'apply-filter') {
      const draft = state.filterDraft;
      if (draft.from && draft.to && draft.from > draft.to) { toast('开始日期不能晚于结束日期'); return; }
      state.appliedFilters = Object.assign(emptyEventFilters(), draft);
      $('filter-panel').hidden = true; $('filter-button').setAttribute('aria-expanded', 'false'); renderTasks(); toast('筛选条件已应用'); return;
    }
    if (action === 'cancel-filter') {
      state.filterDraft = Object.assign(emptyEventFilters(), state.appliedFilters); syncFilterControls(state.filterDraft);
      $('filter-panel').hidden = true; $('filter-button').setAttribute('aria-expanded', 'false'); return;
    }
    if (action === 'clear-advanced-filter') {
      state.appliedFilters = emptyEventFilters(); state.filterDraft = emptyEventFilters(); syncFilterControls(state.filterDraft);
      $('filter-panel').hidden = true; $('filter-button').setAttribute('aria-expanded', 'false'); renderTasks(); toast('已清除已应用筛选'); return;
    }
    if (action === 'reset-filter') {
      $('task-search').value = ''; state.appliedFilters = emptyEventFilters(); state.filterDraft = emptyEventFilters(); syncFilterControls(state.filterDraft);
      $('filter-panel').hidden = true; $('filter-button').setAttribute('aria-expanded', 'false'); renderTasks(); toast('任务列表视图已重置'); return;
    }
    if (action === 'save-filter') {
      try {
        localStorage.setItem('ypa-event-filter', JSON.stringify(Object.assign({ query: $('task-search').value }, state.appliedFilters)));
        toast('筛选方案已保存到本机');
      } catch (error) { toast('当前浏览器不支持保存筛选方案'); }
      return;
    }
    if (action === 'task-detail') return openTaskDetail(Number(button.dataset.index));
    if (action === 'task-edit') return openTaskEdit(Number(button.dataset.index));
    if (action === 'edit-task') return openTaskEdit(state.currentTask);
    if (action === 'back-task-detail') return openTaskDetail(state.currentTask);
    if (action === 'close-task-drawer') { state.drawer = null; setLayer(); return; }
    if (action === 'enter-graph') return showGraph();
    if (action === 'back-list') return showList();
    if (action === 'create-task') return createTask();
    if (action === 'close-dialog') return closeDialog();
    if (action === 'collapse-all') { state.collapsedBranches = new Set([currentRootId()]); state.graphViewOpen = false; renderGraph(); return; }
    if (action === 'expand-all') { state.collapsedBranches.clear(); state.graphViewOpen = false; renderGraph(); return; }
    if (action === 'branch-toggle') { state.collapsedBranches.has(id) ? state.collapsedBranches.delete(id) : state.collapsedBranches.add(id); renderGraph(); return; }
    if (action === 'fit-view') { state.graphViewOpen = false; renderGraph(); requestAnimationFrame(fitGraph); toast('已调整至完整视图'); return; }
    if (action === 'reset-view') { state.graphViewOpen = false; renderGraph(); requestAnimationFrame(resetGraph); return; }
    if (action === 'zoom-out') { zoomGraph(.85); return; }
    if (action === 'zoom-in') { zoomGraph(1.15); return; }
    if (action === 'entity-list') { state.entityList = !state.entityList; renderGraph(); return; }
    if (action === 'graph-layer') { state.graphLayerOpen = !state.graphLayerOpen; state.graphViewOpen = false; state.graphActionsOpen = false; state.graphFilterOpen = false; state.graphSearchOpen = false; renderGraph(); return; }
    if (action === 'graph-view') { state.graphViewOpen = !state.graphViewOpen; state.graphLayerOpen = false; state.graphActionsOpen = false; state.graphFilterOpen = false; state.graphSearchOpen = false; renderGraph(); return; }
    if (action === 'graph-actions') { state.graphActionsOpen = !state.graphActionsOpen; state.graphLayerOpen = false; state.graphViewOpen = false; state.graphFilterOpen = false; state.graphSearchOpen = false; renderGraph(); return; }
    if (action === 'toggle-graph-layer') { state.graphLayers[button.dataset.layer] = !state.graphLayers[button.dataset.layer]; renderGraph(); return; }
    if (action === 'graph-search') { state.graphSearchOpen = !state.graphSearchOpen; state.graphFilterOpen = false; state.graphLayerOpen = false; state.graphViewOpen = false; state.graphActionsOpen = false; renderGraph(); if (state.graphSearchOpen) requestAnimationFrame(function () { $('graph-search-input').focus(); }); return; }
    if (action === 'graph-filter') { state.graphFilterOpen = !state.graphFilterOpen; state.graphSearchOpen = false; state.graphLayerOpen = false; state.graphViewOpen = false; state.graphActionsOpen = false; renderGraph(); return; }
    if (action === 'graph-filter-kind') { state.graphKind = button.dataset.kind; renderGraph(); return; }
    if (action === 'regenerate') { state.collapsedBranches.clear(); state.graphQuery = ''; state.graphKind = 'all'; state.graphLayerOpen = false; state.graphViewOpen = false; state.graphActionsOpen = false; state.graphSearchOpen = false; state.graphFilterOpen = false; $('graph-search-input').value = ''; renderGraph(); toast('已重新布局本地合成导图；未执行服务端研判'); return; }
    if (action === 'refresh') { state.graphActionsOpen = false; renderGraph(); toast('已刷新本地演示导图；未请求真实数据'); return; }
    if (action === 'export') { state.graphActionsOpen = false; renderGraph(); return exportGraph(); }
    if (action === 'fullscreen') { $('map-panel').classList.toggle('fullscreen'); renderGraph(); requestAnimationFrame(function () { applyGraphScale(state.zoom); }); return; }
    if (action === 'card-menu') { state.menu = state.menu === id ? null : id; renderGraph(); if (state.menu) root.querySelector('.card-menu button')?.focus(); return; }
    if (action === 'open-entity') return openEntity(id);
    if (action === 'close-entity') { state.drawer = null; setLayer(); return; }
    if (action === 'card-add') { state.entity = id; state.childParentId = id; return openChild(false); }
    if (action === 'card-edit') { state.entity = id; return openChild(true); }
    if (action === 'card-dim') { const entity = entities.find(function (item) { return item.id === id; }); entity.dimmed = !entity.dimmed; state.menu = null; renderGraph(); return; }
    if (action === 'card-retrieval') { state.entity = id; state.menu = null; renderGraph(); return openRetrieval(); }
    if (action === 'save-child') return saveChild();
    if (action === 'select-existing') { state.selectedExisting[button.dataset.purpose] = button.dataset.value; renderLookup(button.dataset.purpose); return; }
    if (action === 'add-parameter') return addParameter(button.dataset.target);
    if (action === 'remove-parameter') { button.closest('.extra-parameter').remove(); return; }
    if (action === 'recommend-action') {
      if (button.dataset.tool === 'ip' && !state.authorized.has('ip')) return openPermission('entity');
      return openRetrieval(button.dataset.tool === 'banklookup' ? undefined : button.dataset.tool);
    }
    if (action === 'expand-approvers') { $('retrieval-permission').hidden = false; $('retrieval-permission').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
    if (action === 'request-permission') {
      state.permissionOrigin = button.dataset.origin; state.reasonVisible = true;
      if (state.permissionOrigin === 'retrieval') {
        $('retrieval-reason').hidden = false; $('retrieval-submit').textContent = '完成并发起申请';
        $('retrieval-reason').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        $('permission-reason').hidden = false; $('permission-submit').hidden = false;
        $('permission-back').textContent = '取消';
      }
      return;
    }
    if (action === 'submit-permission') return submitPermission('entity');
    if (action === 'simulate-approval') return simulatePermissionApproval();
    if (action === 'submit-retrieval') return submitRetrieval();
    if (action === 'add-note') { $('note-input').value = ''; return openDialog('note'); }
    if (action === 'save-note') return saveNote();
  });
  root.addEventListener('change', function (event) {
    event.stopPropagation();
    const target = event.target;
    if (target.matches('[data-update]')) return;
    if (target.name === 'create-new') return setNewMode('create', target.value);
    if (target.name === 'child-new') return setNewMode('child', target.value);
    if (target.matches('[data-sync-type]')) {
      const purpose = target.dataset.syncType;
      if (purpose === 'child') $('child-dialog').classList.remove('child-compact');
      syncType(purpose);
      // Let the native select interaction finish before replacing the quick fields.
      // Hiding the select synchronously makes keyboard/automation selection unreliable.
      if (purpose === 'create' && target.id === 'create-entity-type') requestAnimationFrame(revealCreate);
      return;
    }
    if (target.dataset.tool && target.closest('#retrieval-tools')) {
      target.checked ? state.selectedTools.add(target.dataset.tool) : state.selectedTools.delete(target.dataset.tool);
      return;
    }
    if (target.id === 'filter-entity') { state.filterDraft.entity = target.value; return; }
    if (target.id === 'date-start' || target.id === 'date-end') {
      const key = target.id === 'date-start' ? 'from' : 'to', previous = state.filterDraft[key];
      state.filterDraft[key] = target.value;
      if (state.filterDraft.from && state.filterDraft.to && state.filterDraft.from > state.filterDraft.to) {
        state.filterDraft[key] = previous; target.value = previous; toast('开始日期不能晚于结束日期');
      }
      return;
    }
  });
  root.addEventListener('input', function (event) {
    event.stopPropagation();
    clearFieldError(event.target);
    const id = event.target.id;
    if (id === 'task-search') renderTasks();
    if (id === 'graph-search-input') { state.graphQuery = event.target.value; renderGraph(); }
    if (id === 'create-name') $('create-meta').hidden = !event.target.value.trim();
    if (id === 'create-account') { $('create-account-full').value = event.target.value; clearFieldError($('create-account-full')); }
    if (id === 'child-account') $('child-dialog').classList.remove('child-compact');
    if (id === 'create-lookup') renderLookup('create');
    if (id === 'child-lookup') renderLookup('child');
    if (id === 'permission-reason-input') updateCounter(id, 'permission-reason-count');
    if (id === 'retrieval-reason-input') updateCounter(id, 'retrieval-reason-count');
    if (id === 'edit-note-counter') return;
    if (event.target.name === 'note' && event.target.closest('#task-edit-form')) $('edit-note-counter').textContent = event.target.value.length + ' / 1500';
  });
  all('[data-update]').forEach(function (button) {
    button.addEventListener('click', function () {
      state.filterDraft.update = button.dataset.update;
      all('[data-update]').forEach(function (item) { item.classList.toggle('selected', item === button); });
    });
  });
  $('task-edit-form').addEventListener('submit', function (event) {
    event.preventDefault(); event.stopPropagation();
    const task = tasks[state.currentTask], form = event.currentTarget;
    task.name = form.elements.name.value.trim();
    task.note = form.elements.note.value.trim() || '无备注';
    renderTasks(); openTaskDetail(state.currentTask); toast('任务信息已保存');
  });
  $('backdrop').addEventListener('click', function () { state.drawer = null; setLayer(); });
  $('dialog-backdrop').addEventListener('click', closeDialog);
  root.querySelector('.map-toolbar').addEventListener('scroll', function () {
    if (state.graphLayerOpen) positionGraphMenu('graph-layer-menu', 'graph-layer');
    if (state.graphViewOpen) positionGraphMenu('graph-view-menu', 'graph-view');
    if (state.graphActionsOpen) positionGraphMenu('graph-actions-menu', 'graph-actions');
  }, { passive: true });
  root.addEventListener('keydown', function (event) {
    if (state.menu && ['ArrowDown','ArrowUp','Home','End'].includes(event.key)) {
      event.preventDefault();
      const items = [...root.querySelectorAll('.card-menu button')];
      const index = items.indexOf(root.activeElement);
      items[event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
    }
    if (activeLayer && event.key === 'Tab') {
      const focusable = [...activeLayer.querySelectorAll('button:not(:disabled),input:not(:disabled),select,textarea,a[href],[tabindex="0"]')].filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (event.shiftKey && (root.activeElement === first || root.activeElement === activeLayer)) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && (root.activeElement === last || root.activeElement === activeLayer)) { event.preventDefault(); first?.focus(); }
    }
    if (activeLayer || state.menu) event.stopPropagation();
    if (event.key === 'Escape') {
      if (state.dialog) closeDialog();
      else if (state.drawer) { state.drawer = null; setLayer(); }
      else if (state.menu) { const id = state.menu; state.menu = null; renderGraph(); root.querySelector(`[data-action="card-menu"][data-id="${id}"]`)?.focus(); }
      else if (state.graphLayerOpen || state.graphViewOpen || state.graphActionsOpen || state.graphSearchOpen || state.graphFilterOpen) { state.graphLayerOpen = false; state.graphViewOpen = false; state.graphActionsOpen = false; state.graphSearchOpen = false; state.graphFilterOpen = false; renderGraph(); }
      else if ($('map-panel').classList.contains('fullscreen')) { $('map-panel').classList.remove('fullscreen'); renderGraph(); }
    }
  });
  try {
    const saved = JSON.parse(localStorage.getItem('ypa-event-filter') || 'null');
    if (saved) {
      $('task-search').value = saved.query || '';
      state.appliedFilters = { entity: saved.entity || '', update: saved.update === 'new' ? 'new' : 'all', from: saved.from || '', to: saved.to || '' };
      state.filterDraft = Object.assign(emptyEventFilters(), state.appliedFilters);
      syncFilterControls(state.filterDraft);
    }
  } catch (error) { /* file previews may disable local storage */ }
  installGraphInteractions(); renderTasks(); renderGraph(); setLayer();

  return {
    restore: setLayer,
    suspend: releaseScrollLock,
    context: function () {
      const task = currentTask();
      const rootEntity = taskRootEntity(task);
      return {
        page: state.page,
        taskId: task?.id || '',
        taskName: task?.name || '未选择任务',
        rootEntityId: task?.rootEntityId || '',
        rootLabel: rootEntity ? taskEntityDisplay(task) : '初始实体未选择',
        created: task?.created || ''
      };
    }
  };
}
