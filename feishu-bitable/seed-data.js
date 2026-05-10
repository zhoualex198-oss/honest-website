// ============================================================
//  宏斯特机电 - 演示数据填充脚本
// ============================================================

import config from './config.js';

const BASE_URL = 'https://open.feishu.cn/open-apis';
const appToken = config.EXISTING_APP_TOKEN || 'GsgLbWAsha6nwEsRMjncFBZpn2e';
const APP_ID = config.APP_ID;
const APP_SECRET = config.APP_SECRET;

let TOKEN = '';
async function getToken() {
  if (TOKEN) return TOKEN;
  const r = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET }),
  });
  const d = await r.json();
  TOKEN = d.tenant_access_token;
  return TOKEN;
}

async function req(method, path, body) {
  const token = await getToken();
  const r = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const d = await r.json();
  if (d.code !== 0) throw new Error(`${method} ${path}: ${d.msg}`);
  return d;
}

const wait = ms => new Promise(r => setTimeout(r, ms));

// ---- 获取表ID ----
async function getTableId(tableName) {
  const d = await req('GET', `/bitable/v1/apps/${appToken}/tables`);
  const t = d.data.items.find(t => t.name === tableName);
  if (!t) throw new Error(`表 "${tableName}" 不存在`);
  return t.table_id;
}

// ---- 获取字段列表 ----
async function getFields(tableId) {
  const d = await req('GET', `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`);
  return d.data.items;
}

// ---- 创建记录 ----
async function createRecord(tableId, fields) {
  const d = await req('POST', `/bitable/v1/apps/${appToken}/tables/${tableId}/records`, { fields });
  return d.data.record.record_id;
}

// ============================================================
//  数据
// ============================================================

const CUSTOMERS = [
  { field_values: { '客户名称': '江西赣锋锂业', '业务介绍': '国内知名锂电制造商，主要生产动力电池电芯', '行业': '锂电行业', '地区': '江西', '规模': '大型', '对接人': '王经理', '对接人职位': '采购总监', '客户阶段': '有机会', '接单累计金额': 5800000 } },
  { field_values: { '客户名称': 'LG新能源(盐城)', '业务介绍': '世界500强韩资锂电制造商，生产软包电池', '行业': '锂电行业', '地区': '盐城', '规模': '特大型', '对接人': 'Kim', '对接人职位': '技术总监', '客户阶段': '有机会', '接单累计金额': 12000000 } },
  { field_values: { '客户名称': 'LG电子(南京)', '业务介绍': '世界500强韩资家电生产商，洗衣机/空调制造', '行业': '白色家电', '地区': '南京', '规模': '特大型', '对接人': '朴部长', '对接人职位': '生产部长', '客户阶段': '有机会', '接单累计金额': 3200000 } },
  { field_values: { '客户名称': 'SK新能源', '业务介绍': '韩资新能源企业，锂电材料与电池制造', '行业': '锂电行业', '地区': '盐城', '规模': '大型', '对接人': '李总', '对接人职位': '工厂长', '客户阶段': '有机会', '接单累计金额': 8500000 } },
  { field_values: { '客户名称': '现代摩比斯(盐城)', '业务介绍': '世界500强韩资汽车零部件供应商', '行业': '汽摩配套', '地区': '盐城', '规模': '大型', '对接人': '张经理', '对接人职位': '采购经理', '客户阶段': '有机会', '接单累计金额': 2100000 } },
  { field_values: { '客户名称': '博世汽车(无锡)', '业务介绍': '世界500强德资汽车零部件制造商', '行业': '汽摩配套', '地区': '无锡', '规模': '特大型', '对接人': '陈工', '对接人职位': '工艺工程师', '客户阶段': '暂无机会', '接单累计金额': 800000 } },
  { field_values: { '客户名称': 'SMC(济南)', '业务介绍': '世界自动化50强气动元件制造商', '行业': '金属加工', '地区': '济南', '规模': '大型', '对接人': '赵部长', '对接人职位': '技术部长', '客户阶段': '有机会', '接单累计金额': 1500000 } },
  { field_values: { '客户名称': '松下压缩机(苏州)', '业务介绍': '中日合资空调压缩机制造商', '行业': '白色家电', '地区': '苏州', '规模': '大型', '对接人': '刘经理', '对接人职位': '设备主管', '客户阶段': '有机会', '接单累计金额': 950000 } },
  { field_values: { '客户名称': '雅马哈发动机(苏州)', '业务介绍': '中日合资摩托车发动机制造商', '行业': '汽摩配套', '地区': '苏州', '规模': '中型', '对接人': '渡边先生', '对接人职位': '生产技术课长', '客户阶段': '有机会', '接单累计金额': 1800000 } },
  { field_values: { '客户名称': '南京泉峰科技', '业务介绍': '新能源电机与工具制造商', '行业': '电机马达', '地区': '南京', '规模': '中型', '对接人': '周经理', '对接人职位': '研发经理', '客户阶段': '暂无机会', '接单累计金额': 0 } },
];

const OPPORTUNITIES = [
  { field_values: { '项目名称': '极耳焊接改造-赣锋锂业', '分类': '改造类', '项目阶段': '方案、成本', '客户预算': 350000 } },
  { field_values: { '项目名称': '贴胶尺寸检测升级', '分类': '改造类', '项目阶段': '报价', '客户预算': 180000 } },
  { field_values: { '项目名称': '软包电池换型开发', '分类': '改造类', '项目阶段': '现场检讨', '客户预算': 650000 } },
  { field_values: { '项目名称': '马达扁线整列机工装', '分类': '单机类', '项目阶段': '信息', '客户预算': 280000 } },
  { field_values: { '项目名称': '壳体外观缺陷检测线', '分类': '线体类', '项目阶段': '方案、成本', '客户预算': 890000 } },
  { field_values: { '项目名称': '洗衣机面板装配线体', '分类': '线体类', '项目阶段': '报价', '客户预算': 1200000 } },
  { field_values: { '项目名称': '电磁阀阀体夹具', '分类': '单机类', '项目阶段': '信息', '客户预算': 95000 } },
  { field_values: { '项目名称': '丝杠退火设备', '分类': '单机类', '项目阶段': '暂停', '客户预算': 420000 } },
];

const ACTIVE_ORDERS = [
  { field_values: { '项目名称': '贴胶机构改造-赣锋锂业', '分类': '改造类', '项目阶段': '中标', '完成度': 75, '下一步动作': '设备组装中，预计下月出货' } },
  { field_values: { '项目名称': '自动检测包装机-LG盐城', '分类': '单机类', '项目阶段': '中标', '完成度': 45, '下一步动作': '电气调试阶段' } },
  { field_values: { '项目名称': 'Forming成型机-南京', '分类': '单机类', '项目阶段': '中标', '完成度': 90, '下一步动作': '客户现场验收中' } },
  { field_values: { '项目名称': '液压夹具-发动机壳体', '分类': '单机类', '项目阶段': '中标', '完成度': 30, '下一步动作': '图纸确认中' } },
  { field_values: { '项目名称': '刹车卡钳夹具', '分类': '单机类', '项目阶段': '中标', '完成度': 60, '下一步动作': '加工中' } },
  { field_values: { '项目名称': 'TAE感应焊设备', '分类': '单机类', '项目阶段': '中标', '完成度': 20, '下一步动作': '采购物料' } },
];

const AFTER_SALES = [
  { field_values: { '项目名称': '极耳焊接机-赣锋', '分类': '改造类', '状态': '进行中', '备注': '已验收3个月，设备运行正常' } },
  { field_values: { '项目名称': '贴胶检测机-赣锋', '分类': '改造类', '状态': '进行中', '备注': '已验收6个月，定期巡检中' } },
  { field_values: { '项目名称': '扁线电机工装', '分类': '单机类', '状态': '已完成', '备注': '质保期已过，转为有偿服务' } },
];

const CLOSED_CASES = [
  { field_values: { '项目名称': '马达圆线嵌线机工装-V1', '分类': '单机类', '项目总结': '首批10套工装已交付，客户验收合格' } },
  { field_values: { '项目名称': '液压夹具-转向关节-V1', '分类': '单机类', '项目总结': '已完成交付，客户复购中' } },
];

// ============================================================
//  主流程
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     宏斯特机电 - 演示数据填充            ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 获取各表ID
  const tCustomer = await getTableId('客户管理');
  const tOpportunity = await getTableId('抓住机会');
  const tOrder = await getTableId('在制订单');
  const tService = await getTableId('售后维保');
  const tClosed = await getTableId('结案');

  const tables = { 客户管理: tCustomer, 抓住机会: tOpportunity, 在制订单: tOrder, 售后维保: tService, 结案: tClosed };
  console.log('已获取所有表ID ✓\n');

  // 获取字段列表（用于了解各表字段名）
  for (const [name, id] of Object.entries(tables)) {
    const fields = await getFields(id);
    console.log(`  ${name} (${fields.length} 个字段): ${fields.map(f => f.field_name).join(', ')}`);
    await wait(200);
  }
  console.log('');

  // ---- 填充客户管理 ----
  console.log('→ 填充客户数据...');
  const customerRecordIds = {};
  for (const c of CUSTOMERS) {
    const rid = await createRecord(tCustomer, c.field_values);
    const name = c.field_values['客户名称'];
    customerRecordIds[name] = rid;
    console.log(`  + ${name} (${rid})`);
    await wait(300);
  }
  console.log(`✓ 共 ${CUSTOMERS.length} 条客户数据\n`);

  // ---- 填充抓住机会 ----
  console.log('→ 填充机会数据...');
  const customerNames = ['江西赣锋锂业', '江西赣锋锂业', 'LG新能源(盐城)', '南京泉峰科技', '雅马哈发动机(苏州)', 'LG电子(南京)', 'SMC(济南)', '松下压缩机(苏州)'];
  for (let i = 0; i < OPPORTUNITIES.length; i++) {
    const opp = OPPORTUNITIES[i];
    const fields = { ...opp.field_values };
    // 关联客户
    const cusName = customerNames[i];
    if (customerRecordIds[cusName]) {
      fields['客户'] = [customerRecordIds[cusName]];
    }
    await createRecord(tOpportunity, fields);
    console.log(`  + ${fields['项目名称']} (${cusName})`);
    await wait(300);
  }
  console.log(`✓ 共 ${OPPORTUNITIES.length} 条机会数据\n`);

  // ---- 填充在制订单 ----
  console.log('→ 填充在制订单数据...');
  const orderCustomerNames = ['江西赣锋锂业', 'LG新能源(盐城)', '南京泉峰科技', '现代摩比斯(盐城)', '现代摩比斯(盐城)', '松下压缩机(苏州)'];
  for (let i = 0; i < ACTIVE_ORDERS.length; i++) {
    const ord = ACTIVE_ORDERS[i];
    const fields = { ...ord.field_values };
    const cusName = orderCustomerNames[i];
    if (customerRecordIds[cusName]) {
      fields['客户'] = [customerRecordIds[cusName]];
    }
    await createRecord(tOrder, fields);
    console.log(`  + ${fields['项目名称']} (${cusName}) - 完成度:${fields['完成度']}%`);
    await wait(300);
  }
  console.log(`✓ 共 ${ACTIVE_ORDERS.length} 条在制订单\n`);

  // ---- 填充售后维保 ----
  console.log('→ 填充售后维保数据...');
  const svcCustomerNames = ['江西赣锋锂业', '江西赣锋锂业', 'LG新能源(盐城)'];
  for (let i = 0; i < AFTER_SALES.length; i++) {
    const svc = AFTER_SALES[i];
    const fields = { ...svc.field_values };
    const cusName = svcCustomerNames[i];
    if (customerRecordIds[cusName]) {
      fields['客户'] = [customerRecordIds[cusName]];
    }
    await createRecord(tService, fields);
    console.log(`  + ${fields['项目名称']}`);
    await wait(300);
  }
  console.log(`✓ 共 ${AFTER_SALES.length} 条维保数据\n`);

  // ---- 填充结案 ----
  console.log('→ 填充结案数据...');
  const closedCustomerNames = ['LG新能源(盐城)', '现代摩比斯(盐城)'];
  for (let i = 0; i < CLOSED_CASES.length; i++) {
    const cc = CLOSED_CASES[i];
    const fields = { ...cc.field_values };
    const cusName = closedCustomerNames[i];
    if (customerRecordIds[cusName]) {
      fields['客户'] = [customerRecordIds[cusName]];
    }
    await createRecord(tClosed, fields);
    console.log(`  + ${fields['项目名称']}`);
    await wait(300);
  }
  console.log(`✓ 共 ${CLOSED_CASES.length} 条结案数据\n`);

  console.log('╔══════════════════════════════════════════╗');
  console.log('║          演示数据填充完成！              ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  链接: https://bytedance.feishu.cn/base/${appToken}`);
}

main().catch(err => {
  console.error('\n✗ 填充失败:', err.message);
  process.exit(1);
});
