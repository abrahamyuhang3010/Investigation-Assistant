// Business markup only. No app navigation, theme controls, or attachment CSS.
export const eventTemplate = `
  <svg class="svg-defs" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <symbol id="i-spark" viewBox="0 0 24 24"><path d="M12 2.5 14.5 9.5 21.5 12l-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5L12 2.5Z" fill="currentColor"/></symbol>
    <symbol id="i-list" viewBox="0 0 24 24"><path d="M4 5h3v3H4zm6 0h10v2H10zM4 10.5h3v3H4zm6 .5h10v2H10zM4 16h3v3H4zm6 .5h10v2H10z" fill="currentColor"/></symbol>
    <symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4.2 4.2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
    <symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
    <symbol id="i-close" viewBox="0 0 24 24"><path d="m5 5 14 14M19 5 5 19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
    <symbol id="i-chevron" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-back" viewBox="0 0 24 24"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-refresh" viewBox="0 0 24 24"><path d="M20 11a8 8 0 1 0-2.2 6M20 4v7h-7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-expand" viewBox="0 0 24 24"><path d="M9 4H4v5M15 4h5v5M4 15v5h5m11-5v5h-5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-collapse" viewBox="0 0 24 24"><path d="M4 9h5V4m11 5h-5V4M4 15h5v5m11-5h-5v5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-download" viewBox="0 0 24 24"><path d="M12 3v12m-4-4 4 4 4-4M5 17v3h14v-3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></symbol>
    <symbol id="i-more" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/></symbol>
    <symbol id="i-globe" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 12h18M12 3c-2.5 2.5-3.5 5.5-3.5 9s1 6.5 3.5 9c2.5-2.5 3.5-5.5 3.5-9S14.5 5.5 12 3Z" fill="none" stroke="currentColor" stroke-width="1.5"/></symbol>
    <symbol id="i-card" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3 10h18M6 15h5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
    <symbol id="i-person" viewBox="0 0 24 24"><circle cx="12" cy="7" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M5.5 20v-2c0-3.5 2.8-5.5 6.5-5.5s6.5 2 6.5 5.5v2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></symbol>
    <symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 2.8 20 6v5.6c0 4.2-2.7 7.4-8 9.6-5.3-2.2-8-5.4-8-9.6V6l8-3.2Z" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.5v5.2m0 3.2h.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></symbol>
  </svg>



  <section id="list-page" class="page page-list">

    <section class="task-panel" aria-label="研判任务列表">
      <div class="task-toolbar">
        <button class="btn btn-primary" type="button" data-action="new-task"><svg class="icon"><use href="#i-plus"></use></svg>新增任务</button>
        <div class="toolbar-spacer"></div>
        <label class="input-search"><svg class="icon"><use href="#i-search"></use></svg><input id="task-search" type="search" placeholder="请输入任务名称等" aria-label="搜索任务名称"></label>
        <button class="btn btn-secondary" type="button" id="filter-button" data-action="toggle-filter"><svg class="icon chevron"><use href="#i-chevron"></use></svg>筛选</button>
        <button class="btn btn-secondary" type="button" data-action="reset-filter">重置</button>
        <button class="btn btn-secondary" type="button" data-action="save-filter">保存</button>
      </div>
      <div id="filter-panel" class="filter-panel" hidden>
        <label class="filter-control"><span>线索要素</span><select id="filter-entity"><option value="">全部线索要素</option><option value="网络账号">网络账号</option><option value="银行卡">银行卡</option><option value="人">人</option></select></label>
        <div class="filter-control filter-segment"><span>更新状态</span><div class="segmented"><button type="button" data-update="new">有更新</button><button type="button" class="selected" data-update="all">全部</button></div></div>
        <label class="filter-control filter-date"><span>创建时间</span><div class="date-range"><input id="date-start" type="date" aria-label="开始日期"><span>→</span><input id="date-end" type="date" aria-label="结束日期"></div></label>
      </div>
      <div class="table-scroll">
        <table class="task-table">
          <thead><tr><th>序号</th><th>任务名称</th><th>任务状态</th><th>创建时间</th><th>初始实体</th><th>任务创建人</th><th>所属单位</th><th>操作</th></tr></thead>
          <tbody id="task-rows"></tbody>
        </table>
        <div id="task-empty" class="empty-state" hidden><svg class="icon"><use href="#i-search"></use></svg><strong>没有符合条件的任务</strong><span>调整筛选条件后重试</span></div>
      </div>
      <div class="table-footer"><span id="table-count"></span></div>
    </section>
  </section>

  <section id="graph-page" class="page page-graph" hidden>
    <div class="task-back"><button type="button" class="text-back" data-action="back-list"><svg class="icon"><use href="#i-back"></use></svg><span id="graph-task-name">Task00000007</span></button></div>
    <section id="map-panel" class="map-panel" aria-label="侦查导图">
      <div class="map-toolbar">
        <div class="map-title"><h2>侦查导图</h2></div><div class="toolbar-spacer"></div>
        <button class="btn btn-secondary" type="button" data-action="entity-list">全部实体</button>
        <button class="btn btn-secondary" type="button" data-action="graph-search"><svg class="icon"><use href="#i-search"></use></svg>搜索</button>
        <button class="btn btn-secondary" type="button" data-action="graph-filter">筛选</button>
        <div class="map-layer-wrap">
          <button class="btn btn-secondary" type="button" data-action="graph-layer" aria-expanded="false">图层</button>
          <div id="graph-layer-menu" class="map-layer-menu" hidden>
            <button type="button" data-action="collapse-all"><svg class="icon"><use href="#i-collapse"></use></svg>收起全部分支</button>
            <button type="button" data-action="expand-all"><svg class="icon"><use href="#i-expand"></use></svg>展开全部分支</button>
            <button type="button" data-action="refresh"><svg class="icon"><use href="#i-refresh"></use></svg>刷新导图</button>
            <button type="button" data-action="export"><svg class="icon"><use href="#i-download"></use></svg>导出导图</button>
          </div>
        </div>
        <button class="btn btn-secondary" type="button" data-action="fullscreen"><svg class="icon"><use href="#i-expand"></use></svg><span class="fullscreen-label">全屏</span></button>
        <button class="btn btn-primary map-run" type="button" data-action="regenerate">重新研判</button>
      </div>
      <div class="graph-shell">
        <div class="graph-viewport" id="graph-viewport">
          <div id="graph-extent" class="graph-extent">
          <div id="graph-stage" class="graph-stage">
            <svg id="graph-edges" class="graph-edges" viewBox="0 0 1540 760" preserveAspectRatio="none" aria-hidden="true"></svg>
            <div id="graph-nodes"></div>
          </div>
        </div>
        <div id="graph-search-panel" class="graph-popover graph-search-panel" hidden>
          <label><svg class="icon"><use href="#i-search"></use></svg><input id="graph-search-input" type="search" placeholder="搜索实体名称或标识" aria-label="搜索侦查导图实体"></label>
          <button type="button" class="icon-action" data-action="graph-search" aria-label="关闭搜索"><svg class="icon"><use href="#i-close"></use></svg></button>
        </div>
        <div id="graph-filter-panel" class="graph-popover graph-filter-panel" hidden>
          <strong>实体类型</strong>
          <button type="button" data-action="graph-filter-kind" data-kind="all" aria-pressed="true">全部</button>
          <button type="button" data-action="graph-filter-kind" data-kind="network" aria-pressed="false">网络账号</button>
          <button type="button" data-action="graph-filter-kind" data-kind="bank" aria-pressed="false">银行卡</button>
          <button type="button" data-action="graph-filter-kind" data-kind="person" aria-pressed="false">人员</button>
        </div>
        <div id="entity-list-panel" class="entity-list-panel" hidden>
          <div class="entity-list-heading"><strong>实体列表</strong><button type="button" class="icon-action" data-action="entity-list" aria-label="关闭实体列表"><svg class="icon"><use href="#i-close"></use></svg></button></div>
          <div id="entity-list-items"></div>
        </div>
        </div>
        <div class="graph-zoom-controls" aria-label="导图缩放控制">
          <button class="btn btn-secondary" type="button" data-action="zoom-out" aria-label="缩小导图">−</button>
          <button class="btn btn-secondary" type="button" data-action="fit-view">适应画布</button>
          <button class="btn btn-secondary" type="button" data-action="zoom-in" aria-label="放大导图">+</button>
        </div>
      </div>
    </section>
  </section>

  <div id="backdrop" class="backdrop" hidden></div>

  <aside id="task-detail-drawer" class="drawer task-drawer" role="dialog" aria-modal="true" aria-label="任务详情" hidden>
    <div class="drawer-header"><h2 id="task-detail-title">Task00000007</h2><button type="button" class="icon-action" data-action="close-task-drawer" aria-label="关闭"><svg class="icon"><use href="#i-close"></use></svg></button></div>
    <div class="task-drawer-actions"><button type="button" class="btn btn-primary" data-action="enter-graph">进入侦查导图</button><button type="button" class="btn btn-secondary" data-action="edit-task">编辑</button></div>
    <div class="drawer-content"><h3>基本信息</h3><dl id="task-detail-fields" class="detail-list"></dl></div>
  </aside>

  <aside id="task-edit-drawer" class="drawer task-drawer" role="dialog" aria-modal="true" aria-label="编辑任务信息" hidden>
    <div class="drawer-header"><h2>编辑任务信息</h2><button type="button" class="icon-action" data-action="back-task-detail" aria-label="关闭"><svg class="icon"><use href="#i-close"></use></svg></button></div>
    <form id="task-edit-form" class="drawer-content drawer-edit-form">
      <h3>基本信息</h3>
      <label>任务名称 <input name="name" required maxlength="80"></label>
      <label>初始实体 <input name="entity" required></label>
      <label>创建人 <input name="creator" readonly></label>
      <label>所属单位 <input name="unit" readonly></label>
      <label>备注 <textarea name="note" maxlength="1500" rows="5"></textarea><small class="counter" id="edit-note-counter">0 / 1500</small></label>
      <div class="drawer-footer"><button type="button" class="btn btn-secondary" data-action="back-task-detail">取消</button><button class="btn btn-primary" type="submit">保存</button></div>
    </form>
  </aside>

  <section id="entity-drawer" class="drawer entity-drawer" role="dialog" aria-modal="true" aria-label="实体详情" hidden>
    <div class="entity-header"><h2 id="entity-title">微信账号：AbMen</h2><button type="button" class="icon-action" data-action="close-entity" aria-label="关闭实体详情"><svg class="icon"><use href="#i-close"></use></svg></button></div>
    <div class="entity-layout">
      <nav class="entity-tabs" aria-label="实体详情分区">
        <button type="button" class="active" data-entity-tab="basic">基本信息</button>
        <button type="button" data-entity-tab="suggestions">调证建议</button>
        <button type="button" data-entity-tab="notes">侦查笔记</button>
        <button type="button" data-entity-tab="results">结果分析</button>
      </nav>
      <div class="entity-content" id="entity-content">
        <div id="entity-basic-view">
          <h3>基本信息</h3>
          <dl class="entity-info">
            <div><dt>开户行</dt><dd id="entity-bank">招商银行</dd></div>
            <div><dt>银行卡号</dt><dd id="entity-card-number">6228270457000050000</dd></div>
            <div><dt>开户人姓名</dt><dd id="entity-owner">王五</dd></div>
            <div><dt>主体类别</dt><dd>自然人</dd></div>
          </dl>
          <div class="section-subtitle">出账 <span>共 3 条明细　↓</span></div>
          <div class="table-scroll"><table class="transaction-table"><thead><tr><th>时间</th><th>金额</th><th>姓名</th><th>银行卡号</th><th>网络账号</th><th>订单号</th><th>平台</th></tr></thead><tbody>
            <tr><td>2025.11.12 13:28</td><td>50,000.00</td><td>陈六</td><td>6228270457000000</td><td>--</td><td>--</td><td>招商银行</td></tr>
            <tr><td>2025.11.12 13:28</td><td>50,000.00</td><td>陈六</td><td>6228270457000000</td><td>--</td><td>--</td><td>招商银行</td></tr>
            <tr><td>2025.11.12 13:28</td><td>50,000.00</td><td>陈六</td><td>6228270457000000</td><td>--</td><td>--</td><td>招商银行</td></tr>
          </tbody></table></div>
          <h3 class="suggestion-heading" id="suggestion-anchor">调证建议（5）</h3>
          <div id="recommendations" class="recommendations"></div>
        </div>
        <div id="entity-notes-view" class="secondary-view" hidden>
          <div class="secondary-heading"><h3>侦查笔记</h3><button class="btn btn-secondary" type="button" data-action="add-note"><svg class="icon"><use href="#i-plus"></use></svg>新增笔记</button></div>
          <div id="note-list" class="note-list"><div class="section-empty">暂无侦查笔记</div></div>
        </div>
        <div id="entity-results-view" class="secondary-view" hidden><h3>结果分析</h3><div class="section-empty">当前实体暂无可展示的结果分析。完成调证后可在此查看更新。</div></div>
      </div>
    </div>
  </section>

  <div id="dialog-backdrop" class="dialog-backdrop" hidden></div>

  <section id="create-dialog" class="dialog dialog-wide" role="dialog" aria-modal="true" aria-labelledby="create-title" hidden>
    <div class="dialog-header"><h2 id="create-title">新建研判任务</h2><button class="icon-action" type="button" data-action="close-dialog" aria-label="关闭"><svg class="icon"><use href="#i-close"></use></svg></button></div>
    <div class="dialog-body">
      <div class="form-section"><h3><span class="section-number">①</span>填写任务信息</h3>
        <div class="form-row"><label for="create-name">*任务名称</label><input id="create-name" type="text" maxlength="80" placeholder="请输入名称"></div>
        <div id="create-meta" hidden>
          <div class="form-row"><label for="create-type">研判类型</label><select id="create-type"><option>侵犯财产案 / 盗窃案</option><option>线索核查</option><option>资金分析</option><option>人员分析</option></select></div>
          <div class="form-row"><label for="create-creator">创建人</label><input id="create-creator" value="王建国" readonly></div>
          <div class="form-row"><label for="create-unit">所属单位</label><input id="create-unit" value="演示研判一组" readonly></div>
        </div>
      </div>
      <div class="form-section"><h3><span class="section-number">②</span>关联实体线索</h3>
        <div id="create-quick">
          <div class="form-row"><label for="create-entity-type">*选择实体类型</label><select id="create-entity-type" data-sync-type="create"><option>网络账号</option><option>银行卡</option><option>人</option></select></div>
          <div class="form-row"><label for="create-account">*账号</label><input id="create-account" type="text" placeholder="请输入账号"></div>
        </div>
        <div id="create-entity-expanded" hidden>
          <div class="form-row"><span class="form-label">*是否为新实体</span><div class="choice-row"><label><input type="radio" name="create-new" value="yes" checked>是</label><label><input type="radio" name="create-new" value="no">否</label></div></div>
          <div class="form-row"><label for="create-entity-type-full">*选择实体类型</label><select id="create-entity-type-full" data-sync-type="create"><option>网络账号</option><option>银行卡</option><option>人</option></select></div>
          <div id="create-new-fields">
            <div class="form-row"><span class="form-label">*选择实体角色</span><div class="choice-row"><label><input type="radio" name="create-role" value="受害" checked>受害</label><label><input type="radio" name="create-role" value="嫌疑">嫌疑</label><label><input type="radio" name="create-role" value="相关">相关</label></div></div>
            <div class="form-row"><label for="create-account-full" id="create-account-label">*账号</label><input id="create-account-full" type="text" placeholder="请输入账号"></div>
            <div id="create-network-fields">
              <div class="form-row"><label for="create-platform">*平台</label><input id="create-platform" placeholder="请输入平台名称"></div>
              <div class="form-row"><span class="form-label">*支付属性</span><div class="choice-row"><label><input type="radio" name="create-payment" checked>用于支付</label><label><input type="radio" name="create-payment">未用于支付</label></div></div>
              <div class="form-row"><span class="form-label">*商户类型</span><div class="choice-row"><label><input type="radio" name="create-merchant" checked>商户</label><label><input type="radio" name="create-merchant">非商户</label></div></div>
            </div>
            <div class="parameter-line"><button type="button" class="btn btn-primary" data-action="add-parameter" data-target="create-parameters"><svg class="icon"><use href="#i-plus"></use></svg>新增参数</button><div id="create-parameters"></div></div>
          </div>
          <div id="create-existing-fields" hidden>
            <div class="form-row"><label for="create-lookup">*身份证号／账号</label><input id="create-lookup" type="search" placeholder="请输入账号或身份证号"></div>
            <div class="lookup-results" id="create-results"></div>
          </div>
        </div>
      </div>
      <div id="create-tool-section" class="form-section" hidden><h3><span class="section-number">③</span>选择调证工具</h3><div class="tool-check-list compact" id="create-tool-list"></div></div>
    </div>
    <div class="dialog-footer"><button type="button" class="btn btn-secondary" data-action="close-dialog">取消</button><button type="button" class="btn btn-primary" data-action="create-task">完成</button></div>
  </section>

  <section id="child-dialog" class="dialog dialog-wide" role="dialog" aria-modal="true" aria-labelledby="child-title" hidden>
    <div class="dialog-header"><h2 id="child-title">添加子卡片</h2><button class="icon-action" type="button" data-action="close-dialog" aria-label="关闭"><svg class="icon"><use href="#i-close"></use></svg></button></div>
    <div class="dialog-body">
      <div class="form-section no-top-border"><h3>关联实体线索</h3>
        <div class="form-row"><span class="form-label">*是否为新实体</span><div class="choice-row"><label><input type="radio" name="child-new" value="yes" checked>是</label><label><input type="radio" name="child-new" value="no">否</label></div></div>
        <div class="form-row"><label for="child-type">*选择实体类型</label><select id="child-type" data-sync-type="child"><option>网络账号</option><option>银行卡</option><option>人</option></select></div>
        <div id="child-new-fields">
          <div class="form-row"><span class="form-label">*选择实体角色</span><div class="choice-row"><label><input type="radio" name="child-role" checked>受害</label><label><input type="radio" name="child-role">嫌疑</label><label><input type="radio" name="child-role">相关</label></div></div>
          <div class="form-row"><label for="child-account" id="child-account-label">*账号</label><input id="child-account" placeholder="请输入账号"></div>
          <div id="child-network-fields">
            <div class="form-row"><label for="child-platform">*平台</label><input id="child-platform" placeholder="请输入平台名称"></div>
            <div class="form-row"><span class="form-label">*支付属性</span><div class="choice-row"><label><input type="radio" name="child-payment" checked>用于支付</label><label><input type="radio" name="child-payment">未用于支付</label></div></div>
            <div class="form-row"><span class="form-label">*商户类型</span><div class="choice-row"><label><input type="radio" name="child-merchant" checked>商户</label><label><input type="radio" name="child-merchant">非商户</label></div></div>
          </div>
          <div class="parameter-line"><button type="button" class="btn btn-primary" data-action="add-parameter" data-target="child-parameters"><svg class="icon"><use href="#i-plus"></use></svg>新增参数</button><div id="child-parameters"></div></div>
        </div>
        <div id="child-existing-fields" hidden><div class="form-row"><label for="child-lookup">*身份证号／账号</label><input id="child-lookup" type="search" placeholder="请输入账号或身份证号"></div><div id="child-results" class="lookup-results"></div></div>
      </div>
    </div>
    <div class="dialog-footer"><button type="button" class="btn btn-secondary" data-action="close-dialog">取消</button><button type="button" class="btn btn-primary" data-action="save-child">发起调证</button></div>
  </section>

  <section id="retrieval-dialog" class="dialog dialog-wide" role="dialog" aria-modal="true" aria-labelledby="retrieval-title" hidden>
    <div class="dialog-header"><h2 id="retrieval-title">发起调证</h2><button class="icon-action" type="button" data-action="close-dialog" aria-label="关闭"><svg class="icon"><use href="#i-close"></use></svg></button></div>
    <div class="dialog-body retrieval-body">
      <h3>选择调证工具</h3><div id="retrieval-tools" class="tool-check-list"></div>
      <div id="retrieval-permission" class="retrieval-permission">
        <div class="permission-label">您可以向以下账户发起权限申请</div>
        <div id="retrieval-approvers"></div>
      </div>
      <div id="retrieval-reason" class="reason-inline" hidden><label for="retrieval-reason-input">*请填写申请事由：</label><textarea id="retrieval-reason-input" maxlength="1500" rows="3" placeholder="请说明本次调证用途"></textarea><small id="retrieval-reason-count">0 / 1500</small></div>
    </div>
    <div class="dialog-footer"><button type="button" class="btn btn-secondary" data-action="close-dialog">取消</button><button type="button" id="retrieval-submit" class="btn btn-primary" data-action="submit-retrieval">发起调证</button></div>
  </section>

  <section id="permission-dialog" class="dialog dialog-small" role="dialog" aria-modal="true" aria-labelledby="permission-title" hidden>
    <div class="permission-content">
      <div class="permission-title"><svg class="icon"><use href="#i-shield"></use></svg><h2 id="permission-title">申请工具调用权限</h2></div>
      <p>您可以向以下账户发起权限申请</p><div id="permission-approvers"></div>
      <div id="permission-reason" class="reason-inline" hidden><label for="permission-reason-input">*请填写申请事由：</label><textarea id="permission-reason-input" maxlength="1500" rows="3" placeholder="请说明本次调证用途"></textarea><small id="permission-reason-count">0 / 1500</small></div>
      <div class="permission-footer"><button type="button" class="btn btn-secondary" data-action="close-dialog" id="permission-back">返回实体详情</button><button type="button" class="btn btn-secondary" id="permission-simulate" data-action="simulate-approval" hidden>模拟审批通过（仅演示）</button><button type="button" class="btn btn-primary" id="permission-submit" data-action="submit-permission" hidden>完成并发起申请</button></div>
    </div>
  </section>

  <section id="note-dialog" class="dialog dialog-small note-dialog" role="dialog" aria-modal="true" aria-labelledby="note-title" hidden>
    <div class="dialog-header"><h2 id="note-title">新增侦查笔记</h2><button class="icon-action" type="button" data-action="close-dialog" aria-label="关闭"><svg class="icon"><use href="#i-close"></use></svg></button></div>
    <div class="note-dialog-body"><label for="note-input">笔记内容</label><textarea id="note-input" rows="7" maxlength="1500" placeholder="记录需要进一步核实的线索"></textarea></div>
    <div class="dialog-footer"><button class="btn btn-secondary" type="button" data-action="close-dialog">取消</button><button class="btn btn-primary" type="button" data-action="save-note">保存</button></div>
  </section>

  <div id="event-toast" class="toast" role="status" aria-live="polite" hidden></div>

`;
