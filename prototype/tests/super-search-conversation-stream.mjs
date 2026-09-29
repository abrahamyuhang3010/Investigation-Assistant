import assert from 'node:assert/strict';
import path from 'node:path';

let pw;
try { pw=await import('playwright'); }
catch { pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs')); }

const browser=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const runtimeErrors=[];
page.on('pageerror',error=>runtimeErrors.push(error.message));

await page.goto(process.env.PROTOTYPE_URL||'http://127.0.0.1:4186/#/PG05');
await page.evaluate(async()=>{const {reset}=await import('/src/state.js');reset();location.hash='/PG05';});
await page.reload();
await page.locator('.super-search-page').waitFor();

const turns=page.locator('.ss-conversation-turn');
assert.equal(await turns.count(),5,'默认历史会话应同时展示 5 轮对话');
assert.equal(await page.locator('.ss-query-history').count(),0,'中央区域不得保留横向 Query Tab');
assert.equal(await page.locator('.ss-task-detail-card').count(),5,'每轮必须持续保留一张 Task Detail Card');
assert.equal(await page.locator('.ss-task-detail-card.is-collapsed').count(),3,'前三轮完成态应默认折叠为 Historical Summary');
assert.equal(await page.locator('.ss-task-detail-card.is-expanded').count(),2,'授权轮次与最新轮次应展开');
assert.equal(await page.locator('.ss-turn-rewrite,.ss-task-card.ss-turn-subtasks,.ss-conclusion-card.ss-turn-result').count(),0,'不得再以三张一级卡片拼接模型输出');

const expectedQueries=[
 '查一下张三 220221194509013544 最近30天的交易情况',
 '继续分析交易对手的多跳资金路径',
 '重点核验第二个高频交易对手的身份',
 '查看该人员关联支付宝账户的资金流水',
 '结合前面的资金关系判断是否存在资金归集特征'
];
assert.deepEqual(await turns.locator('.ss-query-message strong').allTextContents(),expectedQueries);
assert.equal(await turns.nth(3).getAttribute('class').then(value=>value.includes('is-expanded')),true,'等待授权的历史轮次应默认展开');
assert.equal(await turns.nth(4).getAttribute('class').then(value=>value.includes('is-expanded')),true,'最新轮次应始终展开');
assert.equal(await page.locator('.ss-turn-meta').count(),0,'每轮对话前不得显示重复的轮次、时间和状态');
assert.equal(await page.locator('.ss-subtask-dot').count(),0,'子任务左侧不得保留重复状态指示灯');
assert.equal(await page.locator('.ss-sidebar-head h2 .icon').count(),0,'任务列表标题左侧不得显示图标');
const sidebarHeadingStyle=await page.locator('.ss-sidebar-head h2').evaluate(element=>({color:getComputedStyle(element).color,left:element.getBoundingClientRect().left}));
const workspaceHeadingStyle=await page.locator('.ss-workspace-title strong').evaluate(element=>({color:getComputedStyle(element).color}));
assert.equal(sidebarHeadingStyle.color,workspaceHeadingStyle.color,'任务列表标题颜色必须与研判空间标题一致');
assert.equal(sidebarHeadingStyle.left,14,'移除图标后任务列表标题必须向左对齐');
const toolStatusIconSizes=await page.locator('.ss-tool-row .ss-status-mark').evaluateAll(elements=>elements.map(element=>{const icon=element.querySelector('.icon'),outer=element.getBoundingClientRect(),inner=icon.getBoundingClientRect();return {outer:[outer.width,outer.height],inner:[inner.width,inner.height]};}));
assert(toolStatusIconSizes.length>0,'工具列表必须保留状态图标');
for(const size of toolStatusIconSizes){assert.deepEqual(size.outer,[18,18]);assert.deepEqual(size.inner,[16,16]);}
assert((await page.locator('.ss-task-section-icon').count())>0,'三个模块名称左侧必须显示对应图标');
assert.equal(await page.locator('.ss-task-section-icon-dark').first().evaluate(element=>getComputedStyle(element).display),'none','浅色模式不得显示深色模块图标');
await page.evaluate(()=>{document.documentElement.dataset.theme='dark';});
assert.equal(await page.locator('.ss-task-section-icon-light').first().evaluate(element=>getComputedStyle(element).display),'none','深色模式不得显示浅色模块图标');
assert.equal(await page.locator('.ss-task-section-icon-dark').first().evaluate(element=>getComputedStyle(element).display),'block','深色模式必须显示深色模块图标');
await page.evaluate(()=>{document.documentElement.dataset.theme='light';});

for(const tabName of ['工作空间','文档空间','导图空间']){
 const tab=page.locator(`[data-action="super-workspace-tab"][data-tab="${tabName}"]`).filter({visible:true}).first();
 await tab.click();
 const colors=await tab.evaluate(element=>{const icon=element.querySelector('.ss-workspace-icon');return {button:getComputedStyle(element).color,icon:getComputedStyle(icon).backgroundColor};});
 assert.equal(colors.icon,colors.button,`${tabName}选中态图标必须继承标签颜色`);
}
assert.equal(await page.locator('.ss-graph-canvas .entity-node').count(),await page.locator('.ss-graph-canvas .ss-dify-entity-icon').count(),'导图节点必须全部使用 Dify Workflow 实体图标');
assert.equal(await page.locator('.ss-graph-canvas .entity-icon > img').count(),0,'超级搜索导图不得继续使用旧实体图标');
assert.equal(await page.locator('.ss-entity-detail .ss-dify-entity-icon').count(),1,'实体线索详情必须使用 Dify Workflow 实体图标');
await page.locator('[data-action="super-workspace-tab"][data-tab="工作空间"]').filter({visible:true}).first().click();

for(let index=0;index<5;index++){
 const turn=turns.nth(index);
 assert.equal(await turn.locator('.ss-query-message').count(),1,`第 ${index+1} 轮缺少用户 Query`);
 assert.equal(await turn.locator(':scope > .ss-task-detail-card').count(),1,`第 ${index+1} 轮必须只有一张一级 Task Detail Card`);
 assert.equal(await turn.locator(':scope > .ss-recommendations').count(),1,`第 ${index+1} 轮推荐提问必须位于 Task Detail Card 外部`);
 assert.equal(await turn.locator('.ss-task-detail-card .ss-recommendations').count(),0,'推荐提问不得放入 Task Detail Card');
}

const cardStyle=await page.locator('.ss-task-detail-card').first().evaluate(element=>{const style=getComputedStyle(element);return {padding:style.padding,gap:style.gap,radius:style.borderRadius,shadow:style.boxShadow};});
assert.equal(cardStyle.padding,'16px');
assert.equal(cardStyle.gap,'10px','折叠卡按 Historical Summary 使用 10px 内部间距');
assert.equal(cardStyle.radius,'12px');
assert.equal(cardStyle.shadow,'none');
const expandedStyle=await page.locator('.ss-task-detail-card.is-expanded').first().evaluate(element=>getComputedStyle(element).gap);
assert.equal(expandedStyle,'16px','展开卡一级 section gap 必须为 16px');

const firstCard=turns.nth(0).locator('.ss-task-detail-card');
const firstToggle=firstCard.locator('[data-action="super-turn-toggle"]');
assert.equal(await firstToggle.count(),1,'展开按钮必须位于卡片内部');
await firstToggle.click();
assert((await turns.nth(0).getAttribute('class')).includes('is-expanded'),'历史轮次应可展开');
assert.equal(await turns.nth(0).locator('.ss-task-detail-card').count(),1,'展开后 Task Detail Card 不得消失或拆分');
for(const section of ['意图识别','任务规划','结论输出'])assert((await firstCard.innerText()).includes(section),`展开卡缺少 ${section}`);
assert.equal(await firstCard.locator('.ss-report-artifact').count(),1,'完成态报告应使用 Report Artifact');
assert.equal(await firstCard.locator('[data-action="super-file-preview"]').innerText(),'查看报告');
await firstCard.locator('[data-action="super-file-preview"]').click();
assert.equal(await page.locator('#overlay .ss-preview').count(),1,'查看报告应打开现有文件预览');
await page.locator('#overlay [data-action="close"]').first().click();
await turns.nth(0).locator('[data-action="super-turn-toggle"]').click();
assert((await turns.nth(0).getAttribute('class')).includes('is-collapsed'),'历史轮次应可收起');
assert.equal(await turns.nth(0).locator('.ss-task-detail-card').count(),1,'收起后 Task Detail Card 仍须存在');

const authTurn=turns.nth(3);
const permissionButton=authTurn.locator('.ss-permission-card [data-action="super-permission-apply"]');
assert.equal(await permissionButton.count(),1,'授权卡片必须保留在对应子任务内部');
const authToggle=authTurn.locator('[data-action="super-turn-toggle"]');
assert.equal(await authToggle.innerText(),'收起任务详情','等待授权轮次应提供收起入口');
await authToggle.click();
assert((await authTurn.getAttribute('class')).includes('is-collapsed'),'包含待审批授权子任务的任务卡片应可收起');
assert.equal(await authTurn.locator('[data-action="super-turn-toggle"]').innerText(),'展开任务详情');
await authTurn.locator('[data-action="super-turn-toggle"]').click();
assert((await authTurn.getAttribute('class')).includes('is-expanded'),'等待授权轮次收起后应可再次展开');
assert.equal(await page.locator('.ss-composer-dock > .ss-recommendations').count(),0,'输入区不得承载建议追问');
assert.equal(await page.locator('#super-search-prompt').getAttribute('placeholder'),'继续追问、补充线索或发起新的研判任务…');

const recommendationHeaderStyle=await turns.nth(0).locator('.ss-recommendations > header').evaluate(element=>{const style=getComputedStyle(element);return {gap:style.gap,justifyContent:style.justifyContent};});
assert.equal(recommendationHeaderStyle.gap,'24px','推荐提问与换一换的间距必须为 24px');
assert.equal(recommendationHeaderStyle.justifyContent,'flex-start','换一换必须紧随推荐提问左对齐');
assert.equal(await turns.nth(0).locator('.ss-recommend-refresh .ss-dify-icon-refresh').count(),1,'换一换必须使用 Dify Workflow 规范的刷新图标');
const recommendationBubbleStyles=await turns.nth(0).locator('.ss-suggested-query').evaluateAll(elements=>elements.map(element=>{const style=getComputedStyle(element);const rect=element.getBoundingClientRect();return {width:Math.round(rect.width),paddingTop:style.paddingTop,paddingBottom:style.paddingBottom};}));
assert.equal(new Set(recommendationBubbleStyles.map(item=>item.width)).size>1,true,'推荐 Query 气泡宽度必须随文本长度自适应');
for(const style of recommendationBubbleStyles){assert.equal(style.paddingTop,'12px');assert.equal(style.paddingBottom,'12px');}

const refresh=turns.nth(0).locator('[data-action="super-recommend-refresh"]');
const beforeRefresh=await turns.nth(0).locator('.ss-suggested-query span').first().innerText();
await refresh.click();
const afterRefresh=await turns.nth(0).locator('.ss-suggested-query span').first().innerText();
assert.notEqual(afterRefresh,beforeRefresh,'换一换应轮换本轮推荐问题');

const centralText=await page.locator('.ss-center').innerText();
for(const forbidden of ['403 Forbidden','403_FORBIDDEN','PERM-','TOOL-','Agent','SQL','JSON','Debug','Token','Memory','系统日志'])assert(!centralText.includes(forbidden),`中央对话区暴露了内部技术信息：${forbidden}`);

const messages=page.locator('.ss-messages');
await messages.evaluate(element=>{element.scrollTop=0;element.dispatchEvent(new Event('scroll',{bubbles:true}));});
await page.waitForTimeout(150);
const before=await messages.evaluate(element=>element.scrollTop);
await page.evaluate(async()=>{
 const {ensureSuperSearchState}=await import('/src/super-search-model.js');
 const {save}=await import('/src/state.js');
 const latest=ensureSuperSearchState().queries.at(-1);
 const running=latest.agents.flatMap(agent=>agent.toolCalls).find(tool=>tool.status==='running');
 running.dueAt=Date.now()+20;
 save();
});
await page.waitForTimeout(900);
const after=await messages.evaluate(element=>element.scrollTop);
assert(Math.abs(after-before)<=2,`向上阅读时不应被强制拉回底部：${before} → ${after}`);
assert.equal(await page.locator('.ss-latest-button').innerText(),'有新的执行进展');
assert.equal(await page.locator('.ss-latest-button').isVisible(),true);
await page.locator('.ss-latest-button').click();
await page.waitForTimeout(650);
const bottomGap=await messages.evaluate(element=>element.scrollHeight-element.scrollTop-element.clientHeight);assert(bottomGap<=4,'点击返回最新进展后应滚动到底部');
assert.equal(await page.locator('.ss-latest-button').isVisible(),false);

await permissionButton.click();
assert.equal(await page.evaluate(()=>location.hash),'#/PG26','历史授权入口应保持可点击并进入权限申请页');
const authState=await page.evaluate(async()=>{const ss=(await import('/src/super-search-model.js')).ensureSuperSearchState();const run=ss.queries.find(item=>item.query.originalQuery==='查看该人员关联支付宝账户的资金流水');return {queryStatus:run.query.status,permissionStatus:run.permissions[0].status};});
assert.equal(authState.queryStatus,'waiting_approval');
assert.equal(authState.permissionStatus,'requested');
assert.deepEqual(runtimeErrors,[],'浏览器运行时不应报错');

console.log({status:'PASS',turns:5,cards:5,collapsed:3,expanded:2,reportPreview:true,recommendRefresh:true,scrollPreserved:true,authorization:'requested'});
await browser.close();
