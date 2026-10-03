import assert from 'node:assert/strict';
import {
  entityGraph,
  entityNode,
  graphZoomPercent,
  investigationCardBody,
  investigationCardModel,
  investigationTypeFor,
} from '../src/entity-node.js';

const networkWithFundLikeContent = {
  id: 'network-generic',
  type: 'network',
  title: '网络账号',
  platform: '微信账号',
  account: 'wxid_long_account_000123',
  name: '微信账号 wxid_long_account_000123',
  stat: '总计转出：250000.00元',
  detail: '2026-09-01 转出 250000.00元',
  footer: '查人员位置',
  x: 0,
  y: 0,
};
assert.equal(investigationTypeFor(networkWithFundLikeContent), 'net-account', '资金场景文本不得改变网络账号类型');
assert.equal(investigationTypeFor({...networkWithFundLikeContent, cardType: 'fund-account-l1'}), 'fund-account-l1', '显式支付/资金子类型必须保留');

const genericModel = investigationCardModel(networkWithFundLikeContent);
assert.equal(genericModel.category, 'net');
assert.equal(genericModel.owner, '', '通用 name 不得被当作账号持有人');
assert.equal(genericModel.nickname, '');
assert.equal(genericModel.realName, '');

const identifiedNetwork = {
  ...networkWithFundLikeContent,
  nickname: '小张',
  realName: '张三',
};
const identifiedBody = investigationCardBody(identifiedNetwork);
assert.match(identifiedBody, /昵称/);
assert.match(identifiedBody, /小张/);
assert.match(identifiedBody, /实名/);
assert.match(identifiedBody, /张三/);
const duplicateIdentityBody = investigationCardBody({...identifiedNetwork, nickname: identifiedNetwork.account, realName: identifiedNetwork.account});
assert.doesNotMatch(duplicateIdentityBody, /账号昵称/);
assert.doesNotMatch(duplicateIdentityBody, /账号实名/);

const nodeHtml = entityNode(identifiedNetwork, {variant: 'investigation'});
assert.equal((nodeHtml.match(/class="entity-icon/g) || []).length, 1, '标题行类型图标只应出现一次');
assert.equal((nodeHtml.match(/net-globe\.svg/g) || []).length, 1, '网络类型图标只应渲染一次');
const graphHtml = entityGraph([identifiedNetwork], [], {id: 'prompt-04', variant: 'investigation', defaultZoom: 1});
assert.match(graphHtml, /data-zoom="1"/);
assert.match(graphHtml, /data-card-type="net-account"/);
assert.equal(graphZoomPercent(1), '100%');
assert.equal(graphZoomPercent(.7342), '73%');

console.log(JSON.stringify({
  status: 'PASS',
  checks: [
    'network fallback remains net-account',
    'explicit fund subtype remains supported',
    'generic name is not treated as owner',
    'nickname and real name require independent fields',
    'title icon renders once',
    'default zoom and percent formatting are stable',
  ],
}, null, 2));
