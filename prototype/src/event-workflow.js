import {eventTemplate} from './event-workflow-template.js';
import {caseWorkbenchHeading} from './case-workbench.js';
import {investigationCardBody, investigationCardModel, investigationIconFor} from './entity-node.js';

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
  const tasks = [
    { name: 'Task2026090001', status: '进行中', updated: true, entity: '网络账号（微信账号 wxid_zs001）', creator: '王建国', unit: '演示研判一组', created: '2026-09-29 09:30:00', iso: '2026-09-29', note: '无备注' },
    { name: 'Task2026090002', status: '已完成', updated: true, entity: '网络账号（微信账号 wxid_zs001）', creator: '王建国', unit: '演示研判一组', created: '2026-09-28 09:30:00', iso: '2026-09-28', note: '无备注' },
    { name: 'Task2026090003', status: '任务失败', updated: true, entity: '网络账号（微信账号 wxid_zs001）', creator: '王建国', unit: '演示研判一组', created: '2026-09-27 09:30:00', iso: '2026-09-27', note: '无备注' },
    { name: 'Task2026090004', status: '待开始', updated: false, entity: '网络账号（微信账号 wxid_zs001）', creator: '王建国', unit: '演示研判一组', created: '2026-09-26 09:30:00', iso: '2026-09-26', note: '无备注' },
    { name: 'Task2026090005', status: '已完成', updated: false, entity: '网络账号（微信账号 wxid_zs001）', creator: '王建国', unit: '演示研判一组', created: '2026-09-25 09:30:00', iso: '2026-09-25', note: '无备注' },
    { name: 'Task2026090006', status: '已完成', updated: false, entity: '网络账号（微信账号 wxid_zs001）', creator: '王建国', unit: '演示研判一组', created: '2026-09-24 09:30:00', iso: '2026-09-24', note: '无备注' },
    { name: 'Task2026090007', status: '进行中', updated: false, entity: '网络账号（微信账号 wxid_zs001）', creator: '王建国', unit: '演示研判一组', created: '2026-09-23 09:30:00', iso: '2026-09-23', note: '无备注' }
  ];
  const entities = [
    { id: 'network', type: 'network', cardType: 'fund-account-l1', kind: '网络账号', title: '网络账号', name: '微信账号 AbMen', identifier: '▣ 微信账号  AbMen', stat: '总计转出：250000.00元', detail: '首次 2025-08-18 · ¥250000.00\n最后 2025-08-18 · ¥250000.00', tags: '活跃账号', pos: 'node-network' },
    { id: 'bank1', type: 'bank', cardType: 'fund-bank-l1', kind: '银行卡', title: '一级 · 银行卡', name: '李四', owner: '李四', cardNumber: '621700001064789359', bank: '建设银行', identifier: '▣ 621700001064789359　李四\n   建设银行', stat: '共收 ¥200000.00 · 可疑 ¥0.00', detail: '2025-08-18 转入 ¥250000.00\n2025-09-01 转出 ¥250000.00', tags: '已冻结　快捷转出', footer: '查人员位置　››', pos: 'node-bank-one' },
    { id: 'bank2', type: 'bank', cardType: 'fund-bank-l1', kind: '银行卡', title: '一级 · 银行卡', name: '王五', owner: '王五', cardNumber: '621700001064789359', bank: '建设银行', identifier: '▣ 621700001064789359　王五\n   建设银行', stat: '共收 ¥200000.00 · 可疑 ¥0.00', detail: '2025-08-18 转入 ¥250000.00\n2025-09-01 转出 ¥250000.00', tags: '已冻结　快捷转出', footer: '查人员位置　››', pos: 'node-bank-two' },
    { id: 'person', type: 'person', cardType: 'person', kind: '人', title: '高传真', name: '高传真', identifier: '◉ 32058320250001234', tags: '关联受害人', inferred: true, pos: 'node-person' }
  ];
  const toolDefs = [
    { id: 'payment', name: '调取网络支付账号主体及流水信息（金之盾）', recommendation: '调取网络支付账号主体及流水信息', advice: '通过【国家反诈大数据平台/金之盾】查询微信账号 AbMen 的主体信息，并查询近一个月流水。' },
    { id: 'terminal', name: '研判网络账号登录终端（锋刃/猎刃）', recommendation: '研判网络账号登录终端', advice: '使用【锋刃/猎刃】调查登录终端、历史访问行为及相关网络账号，辅助案件研判。' },
    { id: 'trace', name: '网络账号溯源定位', recommendation: '网络账号溯源定位', advice: '使用【云芳】开展网络账号溯源，结合设备信息、历史 IP 和平台行为追踪线索。' },
    { id: 'third', name: '调取第三方主体信息（国反/金之盾）', recommendation: '调取第三方主体信息', advice: '调查账号 AbMen 的第三方关联账号、社交关系及网络支付机构，补充侦查依据。' },
    { id: 'ip', name: '调取账号使用设备IP（网安）', recommendation: '调取账号使用设备IP', advice: '通过线下渠道获取设备使用 IP，用于继续开展分析。' }
  ];
  const bankTool = { id: 'banklookup', name: '调取银行卡开户主体及流水信息（国反/金之盾）', recommendation: '调取银行卡开户主体及流水信息', advice: '核查银行卡开户主体和交易流水，补充资金流向依据。' };
  const lookupOptions = {
    '网络账号': ['微信账号 wxid_zs001', '微信账号 AbMen'],
    '银行卡': ['621700001064789359 · 李四', '6228270457000050000 · 王五'],
    '人': ['唐利岩 · 320583199001010018', '高传真 · 320583198801020014']
  };
  const state = {
    page: 'list', drawer: null, dialog: null, currentTask: 0, entity: 'network', menu: null,
    zoom: 'fit', collapsedBranches: new Set(), entityList: false, graphQuery: '', graphKind: 'all', graphLayerOpen: false, graphSearchOpen: false, graphFilterOpen: false, childEdit: false, filterUpdate: 'all',
    selectedExisting: { create: '', child: '' }, selectedTools: new Set(['terminal']),
    authorized: new Set(['payment', 'terminal', 'trace', 'third', 'banklookup']), pendingPermissions: new Set(),
    recommendationStatus: { payment: '调证成功', terminal: '待调证', trace: '调证失败', third: '待调证', ip: '待调证' },
    permissionOrigin: 'entity', reasonVisible: false, notes: [], newNodeCount: 0, childParentId: 'network'
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
    requestAnimationFrame(fitGraph);
  }
  function graphSize() {
    return { width: 1540, height: parseFloat($('graph-stage').style.height) || 760 };
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
    return scale;
  }
  function fitGraph() {
    state.zoom = 'fit';
    applyGraphScale('fit');
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
      if (event.button !== 0 || event.target.closest('button,.graph-node,.graph-popover,.entity-list-panel,.map-layer-menu,.graph-legend,.graph-zoom-controls')) return;
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
  function renderTasks() {
    const query = $('task-search').value.trim().toLowerCase();
    const entity = $('filter-entity').value;
    const from = $('date-start').value;
    const to = $('date-end').value;
    const visible = tasks.map(function (task, index) { return { task: task, index: index }; }).filter(function (item) {
      const task = item.task;
      return (!query || (task.name + ' ' + task.entity).toLowerCase().includes(query)) &&
        (!entity || task.entity.includes(entity)) &&
        (state.filterUpdate === 'all' || task.updated) &&
        (!from || task.iso >= from) && (!to || task.iso <= to);
    });
    $('task-rows').innerHTML = visible.map(function (item) {
      const task = item.task;
      return '<tr><td>' + (item.index + 1) + '</td><td><div class="task-name-cell"><strong>' + esc(task.name) +
        '</strong>' + (task.updated ? '<span class="update-badge">有更新</span>' : '') +
        '</div></td><td>' + statusHTML(task.status) + '</td><td>' + esc(task.created) +
        '</td><td>' + esc(task.entity) + '</td><td>' + esc(task.creator) + '</td><td>' + esc(task.unit) +
        '</td><td><div class="table-actions"><button type="button" class="link-button" data-action="task-detail" data-index="' +
        item.index + '">详情</button><button type="button" class="link-button" data-action="task-edit" data-index="' +
        item.index + '">编辑</button></div></td></tr>';
    }).join('');
    $('task-empty').hidden = visible.length !== 0;
    $('table-count').textContent = '共 ' + visible.length + ' 条';
    $('task-rows').parentElement.hidden = visible.length === 0;
  }
  function openTaskDetail(index) {
    state.currentTask = index;
    const task = tasks[index];
    $('task-detail-title').textContent = task.name;
    $('task-detail-fields').innerHTML = [
      ['任务名称：', task.name], ['初始实体：', task.entity], ['任务状态：', statusHTML(task.status)],
      ['任务创建人：', task.creator], ['所属单位：', task.unit], ['备注：', task.note || '无备注']
    ].map(function (pair) { return '<dt>' + pair[0] + '</dt><dd>' + (pair[0] === '任务状态：' ? pair[1] : esc(pair[1])) + '</dd>'; }).join('');
    state.drawer = 'task'; setLayer();
  }
  function openTaskEdit(index) {
    state.currentTask = index;
    const task = tasks[index], form = $('task-edit-form');
    form.elements.name.value = task.name; form.elements.entity.value = task.entity;
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
    if (purpose === 'create') { $('create-entity-type').value = type; $('create-entity-type-full').value = type; }
    $(purpose + '-network-fields').hidden = type !== '网络账号';
    $(purpose + '-account-label').textContent = type === '人' ? '*身份证号' : type === '银行卡' ? '*银行卡号' : '*账号';
    const lookupLabel = root.querySelector('label[for="' + purpose + '-lookup"]');
    lookupLabel.textContent = type === '人' ? '*身份证号' : '*账号／卡号';
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
  function openCreate() { resetCreate(); openDialog('create'); }
  function createTask() {
    const name = $('create-name').value.trim();
    if (!name) { toast('请填写任务名称'); $('create-name').setAttribute('aria-invalid','true'); $('create-name').focus(); return; }
    const expanded = !$('create-entity-expanded').hidden;
    const mode = root.querySelector('input[name="create-new"]:checked').value;
    const type = expanded ? $('create-entity-type-full').value : $('create-entity-type').value;
    const account = expanded && mode === 'no' ? state.selectedExisting.create :
      expanded ? $('create-account-full').value.trim() : $('create-account').value.trim();
    if (!account) { toast(mode === 'no' && expanded ? '请选择已有实体' : '请填写初始实体账号'); return; }
    const now = new Date();
    const date = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
    tasks.unshift({ name: name, status: '待开始', updated: false, entity: type + '（' + account + '）', creator: '王建国', unit: '演示研判一组', created: date + ' 12:00:00', iso: date, note: '无备注' });
    state.currentTask = 0; closeDialog(); renderTasks(); toast('研判任务已创建');
  }
  function cardTypeForKind(kind) { return kind === '银行卡' ? 'fund-bank-l1' : kind === '人' ? 'person' : 'net-account'; }
  function childrenMap() {
    const result = new Map();
    entities.forEach(function (entity) {
      if (entity.id === 'network') return;
      const parent = entity.parentId || 'network';
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
    return entities.filter(function (entity) {
      if (hidden.has(entity.id)) return false;
      if (state.graphKind !== 'all' && entity.type !== state.graphKind) return false;
      return !query || (entity.title + ' ' + entity.name + ' ' + entity.identifier).toLowerCase().includes(query);
    });
  }
  function nodeHTML(entity, children) {
    const menu = state.menu === entity.id;
    const model = investigationCardModel(entity);
    const body = '<span class="node-body">' + investigationCardBody(entity) + '</span>';
    const menuHtml = menu ? '<div class="card-menu" role="menu">' +
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
      '<button type="button" class="node-menu-trigger" aria-haspopup="menu" data-action="card-menu" data-id="' + entity.id +
      '" aria-label="' + esc(entity.title) + '操作菜单">' + icon('more') +
      '</button></div><button type="button" class="node-main" data-action="open-entity" data-id="' + entity.id + '">' +
      body + '</button>' + branch + menuHtml + '</article>';
  }
  function positionGraphLayerMenu() {
    const menu = $('graph-layer-menu'), trigger = root.querySelector('[data-action="graph-layer"]');
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
      const paths = visible.filter(function (entity) { return entity.id !== 'network'; }).map(function (entity) {
        const parentId = entity.parentId || 'network';
        if (!visibleIds.has(parentId)) return '';
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
    $('graph-layer-menu').hidden = !state.graphLayerOpen;
    if (state.graphLayerOpen) requestAnimationFrame(positionGraphLayerMenu);
    root.querySelector('[data-action="graph-layer"]').setAttribute('aria-expanded', String(state.graphLayerOpen));
    $('graph-search-panel').hidden = !state.graphSearchOpen;
    $('graph-filter-panel').hidden = !state.graphFilterOpen;
    all('[data-action="graph-filter-kind"]').forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.kind === state.graphKind)); });
    const fullLabel = root.querySelector('.fullscreen-label');
    if (fullLabel) fullLabel.textContent = $('map-panel').classList.contains('fullscreen') ? '退出全屏' : '全屏';
  }
  function currentEntity() { return entities.find(function (entity) { return entity.id === state.entity; }) || entities[0]; }
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
        '<div class="recommendation-advice"><span>侦查建议：</span><div>' + esc(tool.advice) +
        '</div></div></div></article>';
    }).join('') : '<div class="section-empty">当前实体暂无调证建议</div>';
  }
  function openEntity(id) {
    state.entity = id; state.menu = null;
    const entity = currentEntity();
    $('entity-title').textContent = entity.type === 'network' ? '网络账号：' + entity.name :
      entity.type === 'bank' ? '银行卡：' + entity.name : '人员：' + entity.name;
    $('entity-bank').textContent = entity.type === 'network' ? '招商银行' : entity.type === 'bank' ? '建设银行' : '—';
    $('entity-card-number').textContent = entity.type === 'bank' ? '621700001064789359' : entity.type === 'network' ? '6228270457000050000' : '—';
    $('entity-owner').textContent = entity.type === 'network' ? '王五' : entity.name;
    $('entity-basic-view').hidden = false; $('entity-notes-view').hidden = true; $('entity-results-view').hidden = true;
    all('[data-entity-tab]').forEach(function (button) { button.classList.toggle('active', button.dataset.entityTab === 'basic'); });
    $('entity-content').scrollTop = 0;
    renderRecommendations(); renderGraph();
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
    $('child-title').textContent = edit ? '编辑实体' : '添加子卡片';
    $('child-dialog').querySelector('.dialog-footer .btn-primary').textContent = edit ? '保存' : '发起调证';
    $('child-type').value = edit ? currentEntity().kind : '网络账号';
    $('child-account').value = edit ? currentEntity().name : '';
    $('child-platform').value = '';
    $('child-lookup').value = ''; state.selectedExisting.child = '';
    root.querySelector('input[name="child-new"][value="yes"]').checked = true;
    setNewMode('child', 'yes'); $('child-parameters').innerHTML = ''; syncType('child');
    $('child-dialog').querySelector('.dialog-body').scrollTop = 0;
    state.menu = null; renderGraph(); openDialog('child');
  }
  function saveChild() {
    const existing = root.querySelector('input[name="child-new"]:checked').value === 'no';
    const value = existing ? state.selectedExisting.child : $('child-account').value.trim();
    if (!value) { toast(existing ? '请选择已有实体' : '请填写实体标识'); return; }
    if (state.childEdit) {
      const entity = currentEntity();
      const kind = $('child-type').value;
      entity.kind = kind; entity.type = kind === '网络账号' ? 'network' : kind === '银行卡' ? 'bank' : 'person';
      entity.cardType = cardTypeForKind(kind); entity.title = kind; entity.name = value; entity.identifier = value; entity.manual = true;
      closeDialog(); renderGraph(); toast('实体信息已保存'); return;
    }
    state.newNodeCount += 1;
    const kind = $('child-type').value;
    const type = kind === '网络账号' ? 'network' : kind === '银行卡' ? 'bank' : 'person';
    const id = 'added-' + state.newNodeCount;
    entities.push({ id: id, type: type, cardType: cardTypeForKind(kind), kind: kind, title: kind, name: value, identifier: value, tags: existing ? '关联已有实体' : '人工补充', manual: true, inferred: true, parentId: state.childParentId,
      pos: 'node-added', offset: 250 + (state.newNodeCount - 1) * 230, stat: '待调证', detail: '', footer: '' });
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
      const x = entity.id === 'network' ? 250 : entity.id === 'bank1' || entity.id === 'bank2' || entity.id === 'person' ? 700 : 1150;
      const y = entity.id === 'network' ? 280 : entity.id === 'bank1' ? 50 : entity.id === 'bank2' ? 300 : entity.id === 'person' ? 550 : (entity.offset || 250);
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
      if (state.graphLayerOpen && !event.target.closest('.map-layer-wrap')) { state.graphLayerOpen = false; changed = true; }
      if (state.graphFilterOpen && !event.target.closest('#graph-filter-panel')) { state.graphFilterOpen = false; changed = true; }
      if (changed) renderGraph();
      return;
    }
    const action = button.dataset.action, id = button.dataset.id;
    if (button.tagName === 'A') event.preventDefault();
    if (action === 'new-task') return openCreate();
    if (action === 'toggle-filter') { $('filter-panel').hidden = !$('filter-panel').hidden; button.setAttribute('aria-expanded', String(!$('filter-panel').hidden)); return; }
    if (action === 'reset-filter') { $('task-search').value = ''; $('filter-entity').value = ''; $('date-start').value = ''; $('date-end').value = ''; state.filterUpdate = 'all'; all('[data-update]').forEach(function (item) { item.classList.toggle('selected', item.dataset.update === 'all'); }); renderTasks(); return; }
    if (action === 'save-filter') {
      try {
        localStorage.setItem('ypa-event-filter', JSON.stringify({ query: $('task-search').value, entity: $('filter-entity').value,
          update: state.filterUpdate, from: $('date-start').value, to: $('date-end').value }));
        toast('筛选条件已保存');
      } catch (error) { toast('当前浏览器不支持保存筛选条件'); }
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
    if (action === 'collapse-all') { state.collapsedBranches = new Set(['network']); state.graphLayerOpen = false; renderGraph(); return; }
    if (action === 'expand-all') { state.collapsedBranches.clear(); state.graphLayerOpen = false; renderGraph(); return; }
    if (action === 'branch-toggle') { state.collapsedBranches.has(id) ? state.collapsedBranches.delete(id) : state.collapsedBranches.add(id); renderGraph(); return; }
    if (action === 'fit-view') { fitGraph(); toast('已调整至完整视图'); return; }
    if (action === 'zoom-out') { zoomGraph(.85); return; }
    if (action === 'zoom-in') { zoomGraph(1.15); return; }
    if (action === 'entity-list') { state.entityList = !state.entityList; renderGraph(); return; }
    if (action === 'graph-layer') { state.graphLayerOpen = !state.graphLayerOpen; state.graphFilterOpen = false; renderGraph(); return; }
    if (action === 'graph-search') { state.graphSearchOpen = !state.graphSearchOpen; state.graphFilterOpen = false; state.graphLayerOpen = false; renderGraph(); if (state.graphSearchOpen) requestAnimationFrame(function () { $('graph-search-input').focus(); }); return; }
    if (action === 'graph-filter') { state.graphFilterOpen = !state.graphFilterOpen; state.graphSearchOpen = false; state.graphLayerOpen = false; renderGraph(); return; }
    if (action === 'graph-filter-kind') { state.graphKind = button.dataset.kind; renderGraph(); return; }
    if (action === 'regenerate') { state.collapsedBranches.clear(); state.graphQuery = ''; state.graphKind = 'all'; state.graphLayerOpen = false; state.graphSearchOpen = false; state.graphFilterOpen = false; $('graph-search-input').value = ''; renderGraph(); requestAnimationFrame(fitGraph); toast('已重新布局本地合成导图；未执行服务端研判'); return; }
    if (action === 'refresh') { state.graphLayerOpen = false; renderGraph(); toast('已刷新本地演示导图；未请求真实数据'); return; }
    if (action === 'export') { state.graphLayerOpen = false; renderGraph(); return exportGraph(); }
    if (action === 'fullscreen') { $('map-panel').classList.toggle('fullscreen'); renderGraph(); requestAnimationFrame(function () { if (state.zoom === 'fit') fitGraph(); else applyGraphScale(state.zoom); }); return; }
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
      if (target.dataset.syncType === 'create') revealCreate();
      if (target.dataset.syncType === 'child') $('child-dialog').classList.remove('child-compact');
      syncType(target.dataset.syncType); return;
    }
    if (target.id === 'create-account' && target.value.trim()) { revealCreate(); return; }
    if (target.dataset.tool && target.closest('#retrieval-tools')) {
      target.checked ? state.selectedTools.add(target.dataset.tool) : state.selectedTools.delete(target.dataset.tool);
      return;
    }
    if (target.id === 'filter-entity' || target.id === 'date-start' || target.id === 'date-end') renderTasks();
  });
  root.addEventListener('input', function (event) {
    event.stopPropagation();
    event.target.removeAttribute('aria-invalid');
    const id = event.target.id;
    if (id === 'task-search') renderTasks();
    if (id === 'graph-search-input') { state.graphQuery = event.target.value; renderGraph(); }
    if (id === 'create-name') $('create-meta').hidden = !event.target.value.trim();
    if (id === 'create-account') $('create-account-full').value = event.target.value;
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
      state.filterUpdate = button.dataset.update;
      all('[data-update]').forEach(function (item) { item.classList.toggle('selected', item === button); });
      renderTasks();
    });
  });
  $('task-edit-form').addEventListener('submit', function (event) {
    event.preventDefault(); event.stopPropagation();
    const task = tasks[state.currentTask], form = event.currentTarget;
    task.name = form.elements.name.value.trim(); task.entity = form.elements.entity.value.trim();
    task.note = form.elements.note.value.trim() || '无备注';
    renderTasks(); openTaskDetail(state.currentTask); toast('任务信息已保存');
  });
  $('backdrop').addEventListener('click', function () { state.drawer = null; setLayer(); });
  $('dialog-backdrop').addEventListener('click', closeDialog);
  root.querySelector('.map-toolbar').addEventListener('scroll', positionGraphLayerMenu, { passive: true });
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
      else if (state.graphLayerOpen || state.graphSearchOpen || state.graphFilterOpen) { state.graphLayerOpen = false; state.graphSearchOpen = false; state.graphFilterOpen = false; renderGraph(); }
      else if ($('map-panel').classList.contains('fullscreen')) { $('map-panel').classList.remove('fullscreen'); renderGraph(); }
    }
  });
  try {
    const saved = JSON.parse(localStorage.getItem('ypa-event-filter') || 'null');
    if (saved) {
      $('task-search').value = saved.query || ''; $('filter-entity').value = saved.entity || '';
      $('date-start').value = saved.from || ''; $('date-end').value = saved.to || '';
      state.filterUpdate = saved.update === 'new' ? 'new' : 'all';
      all('[data-update]').forEach(function (item) { item.classList.toggle('selected', item.dataset.update === state.filterUpdate); });
    }
  } catch (error) { /* file previews may disable local storage */ }
  installGraphInteractions(); renderTasks(); renderGraph(); setLayer();

  return { restore: setLayer, suspend: releaseScrollLock };
}
