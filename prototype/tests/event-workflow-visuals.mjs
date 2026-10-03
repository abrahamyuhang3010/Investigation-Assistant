// Captures named business states. Capture is not an automatic pixel/DS acceptance verdict.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
let pw;try{pw=await import('playwright')}catch{pw=await import(path.join(process.env.HOME,'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'))}
const base=process.env.PROTOTYPE_URL||'http://127.0.0.1:4186';
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../audit/event-workflow-correction-2026-10-01/states');
await fs.mkdir(out,{recursive:true});
const b=await pw.chromium.launch({headless:true,channel:process.env.PW_CHANNEL||'chrome'});
const p=await b.newPage({viewport:{width:1288,height:824}});let f;const matrix=[],errors=[];
p.on('pageerror',e=>errors.push(e.message));
async function fresh(){await p.goto(`${base}/?visual=${Date.now()}#/PG14`);f=p.locator('event-workflow');await f.locator('#task-rows tr').first().waitFor();await p.waitForTimeout(150)}
async function action(name,selector=''){await f.locator(`[data-action="${name}"]${selector}`).first().click();await p.waitForTimeout(80)}
async function capture(source,state,note='业务状态截图；未自动判定像素或设计系统一致性'){await f.locator('#event-toast').waitFor({state:'hidden'});await p.waitForTimeout(150);const index=matrix.length+1,file=String(index).padStart(2,'0')+'-'+state+'.png';await p.screenshot({path:path.join(out,file)});matrix.push({index,source:'因事研判_'+source+'.png',state,screenshot:file,reviewStatus:'CAPTURED',note})}
async function graph(){await fresh();await action('task-detail');await action('enter-graph')}
async function entity(){await f.locator('.graph-node [data-action=open-entity][data-id^=network-]').first().click()}
async function permission(){await f.locator('[data-action=recommend-action][data-tool=ip]').click()}
async function approve(){await permission();await action('simulate-approval')}
await fresh();await capture('初始页面_01','任务列表');
await f.locator('.task-panel>.table-scroll').evaluate(el=>el.scrollTop=el.scrollHeight);
await capture('初始页面_01-1','列表滚动','原稿第二种列表视图；不是搜索结果。当前视口使用滚动容器。');
await action('task-detail');await capture('初始页面_任务详情','任务详情抽屉');await action('close-task-drawer');
await action('toggle-filter');await capture('初始页面_筛选','列表筛选');await action('task-edit');await capture('初始页面_编辑任务信息','编辑任务抽屉');
await fresh();await action('new-task');await capture('创建研判任务_01','创建初始');
await f.locator('#create-name').fill('合成线索研判任务');await f.locator('#create-entity-type').selectOption('网络账号');
await f.locator('#create-entity-expanded').evaluate(el=>el.scrollIntoView({block:'start'}));
await capture('创建研判任务_02','新建网络实体');
await f.locator('#create-entity-type-full').selectOption('人');await capture('创建研判任务_03','新建人员实体');
await f.locator('input[name=create-new][value=no]').check();await f.locator('#create-lookup').fill('唐');await capture('创建研判任务_04','选择已有人员');
await graph();await f.locator('[data-action=card-menu][data-id=person]').click();await capture('侦查导图_05','人员卡片菜单');await p.keyboard.press('Escape');
await entity();await capture('侦查导图_08','实体基本信息及调证建议');
await f.locator('[data-action=recommend-action][data-tool=ip]').scrollIntoViewIfNeeded();await capture('侦查导图_09','建议区无权限工具');
await permission();await capture('侦查导图_10','权限审批人列表');
await f.locator('#permission-approvers [data-action=request-permission]').first().click();await f.locator('#permission-reason-input').fill('核验合成账号设备信息，仅用于本地演示。');await capture('侦查导图_11','填写权限申请事由');
await action('submit-permission');await approve();await f.locator('[data-action=recommend-action][data-tool=ip]').scrollIntoViewIfNeeded();await capture('侦查导图_12','演示审批后授权','只有显式点击模拟审批通过才进入授权；不代表真实权限。有效期文案为演示值。');
await f.locator('[data-entity-tab=suggestions]').click();await p.waitForTimeout(400);await capture('侦查导图_13','调证建议页签');
await f.locator('[data-entity-tab=basic]').click();await capture('侦查导图_14','基本信息页签');
await action('close-entity');await f.locator('[data-action=card-menu][data-id=bank1]').hover();await capture('侦查导图_15','银行卡菜单触点悬停');
await f.locator('[data-action=card-menu][data-id=bank1]').click();await capture('侦查导图_人工创建卡片_01','银行卡片菜单');
await f.locator('[data-action=card-add][data-id=bank1]').hover();await capture('侦查导图_人工创建卡片_02','添加子卡片入口悬停');
await f.locator('[data-action=card-add][data-id=bank1]').click();await capture('侦查导图_人工创建卡片_03-1','子卡片紧凑初始表单');
await f.locator('#child-type').selectOption('网络账号');await capture('侦查导图_人工创建卡片_03','子卡片新实体展开');
await f.locator('#child-type').selectOption('人');await f.locator('input[name=child-new][value=no]').check();await f.locator('#child-lookup').fill('唐');await capture('侦查导图_人工创建卡片_04','子卡片已有人员候选');
await graph();await f.locator('[data-action=card-menu][data-id^=network-]').click();await capture('侦查导图_发起调证_01','网络实体发起调证入口');
await action('card-retrieval','[data-id^=network-]');await f.locator('#retrieval-tools input[data-tool=ip]').check();await capture('侦查导图_发起调证_02','调证工具及审批人');
await f.locator('#retrieval-approvers [data-action=request-permission]').first().click();await f.locator('#retrieval-reason-input').fill('合成账号设备核验，用于交互演示。');await capture('侦查导图_发起调证_03','调证权限申请事由');
await action('submit-retrieval');await entity();await approve();await action('close-entity');await f.locator('[data-action=card-menu][data-id^=network-]').click();await action('card-retrieval','[data-id^=network-]');await capture('侦查导图_发起调证_04','演示授权后工具列表','真实后端审批未接入；此图是显式模拟审批后的状态。');
await fs.writeFile(path.join(out,'../state-matrix.json'),JSON.stringify({captured:matrix.length,errors,matrix},null,2));console.log(JSON.stringify({captured:matrix.length,errors,out},null,2));await b.close();if(errors.length)process.exitCode=1;
