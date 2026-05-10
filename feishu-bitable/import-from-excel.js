// ============================================================
//  从Excel导入数据到飞书多维表格
//  1. 清空「抓住机会」和「在制订单」
//  2. 将Excel「项目管理表」数据导入「抓住机会」
// ============================================================

import config from './config.js';
import XLSX from 'xlsx';

const BASE_URL = 'https://open.feishu.cn/open-apis';
const appToken = config.EXISTING_APP_TOKEN;
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
  if (d.code !== 0) throw new Error(`${method} ${path}: ${d.msg} (${d.code})`);
  return d;
}

const wait = ms => new Promise(r => setTimeout(r, ms));

async function getTableId(tableName) {
  const d = await req('GET', `/bitable/v1/apps/${appToken}/tables`);
  const t = d.data.items.find(t => t.name === tableName);
  if (!t) throw new Error(`表 "${tableName}" 不存在`);
  return t.table_id;
}

// ---- 清空表 ----
async function clearTable(tableId, tableName) {
  console.log(`→ 清空「${tableName}」...`);
  let pageToken = '';
  let count = 0;
  do {
    let url = `/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=500`;
    if (pageToken) url += `&page_token=${pageToken}`;
    const d = await req('GET', url);
    const items = d.data.items || [];
    if (items.length === 0) break;

    // Batch delete
    const ids = items.map(r => r.record_id);
    await req('POST', `/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_delete`, {
      records: ids,
    });
    count += ids.length;
    console.log(`  - 已删除 ${count} 条记录...`);
    await wait(300);
    pageToken = d.data.page_token;
  } while (pageToken);
  console.log(`✓ 「${tableName}」已清空 (共 ${count} 条)\n`);
}

// ---- 获取字段信息 ----
async function getFields(tableId) {
  const d = await req('GET', `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`);
  return d.data.items;
}

// ---- 添加分类选项 ----
async function addSelectOptions(tableId, fieldName, newOptions) {
  const fields = await getFields(tableId);
  const field = fields.find(f => f.field_name === fieldName);
  if (!field) {
    console.log(`  ! 字段 "${fieldName}" 不存在，跳过添加选项`);
    return;
  }

  const existingOptions = field.property?.options || [];
  const existingNames = existingOptions.map(o => o.name);
  const optionsToAdd = newOptions.filter(n => !existingNames.includes(n));

  if (optionsToAdd.length === 0) {
    console.log(`  - 「${fieldName}」已有所有需要的选项`);
    return;
  }

  const maxColor = Math.max(...existingOptions.map(o => o.color || 0), -1);
  const allOptions = [
    ...existingOptions,
    ...optionsToAdd.map((name, i) => ({
      name,
      color: (maxColor + 1 + i) % 40,
    })),
  ];

  // 飞书会自动在写入记录时创建新选项，这里跳过
  console.log(`  - 新选项将在导入时自动创建: ${optionsToAdd.join(', ')}`);
}

// ---- Excel日期序列号转Unix秒时间戳 ----
function excelSerialToTimestamp(serial) {
  if (!serial) return undefined;
  const num = Number(serial);
  if (isNaN(num) || num <= 0) return undefined;
  const date = new Date(Date.UTC(1899, 11, 30) + num * 86400000);
  return Math.floor(date.getTime() / 1000); // Unix秒
}

// ---- 映射项目阶段 ----
function mapStage(stageVal, resultVal) {
  // 项目结果优先
  if (resultVal === '中标') return '中标';
  if (resultVal === '未中标') return '未中标';
  if (resultVal === '取消') return '未中标';
  if (resultVal === '暂停') return '暂停';
  if (resultVal === '未来机会') return '信息';

  // 根据项目阶段映射
  const stageMap = {
    '1信息': '信息',
    '2评估': '现场检讨',
    '3方案': '方案、成本',
    '4成本': '方案、成本',
    '5报价': '报价',
  };
  return stageMap[stageVal] || '信息';
}

// ---- 映射分类 ----
function mapType(typeVal) {
  const typeMap = {
    '非标': '非标',
    '改造': '改造',
    '精密件': '精密件',
  };
  return typeMap[typeVal] || '其他';
}

// ---- 主流程 ----
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     Excel数据导入 - 飞书多维表格         ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 1. 获取表ID
  const tOpp = await getTableId('抓住机会');
  const tOrder = await getTableId('在制订单');

  // 2. 清空两个表
  await clearTable(tOpp, '抓住机会');
  await clearTable(tOrder, '在制订单');

  // 3. 添加分类选项
  console.log('→ 检查分类选项...');
  await addSelectOptions(tOpp, '分类', ['非标', '改造', '精密件', '其他']);
  await wait(300);

  // 4. 检查是否有新分类选项需要添加到 在制订单
  await addSelectOptions(tOrder, '分类', ['非标', '改造', '精密件', '其他']);
  await wait(300);

  // 5. 读取Excel
  console.log('\n→ 读取Excel文件...');
  const workbook = XLSX.readFile('c:\\Users\\Administrator\\Desktop\\Honest\\项目统计-营销一部.xlsx');
  const sheet = workbook.Sheets['项目管理表'];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '', header: 1 });
  console.log(`  共 ${rows.length} 行`);

  // 数据从第4行开始 (index 3)
  // 列映射:
  // 0:序号 1:营销团队 2:负责人 3:客户名称 4:项目联系人
  // 5:项目名称 6:项目类型 7:检讨时间 8:项目阶段 9:项目结果
  // 10:报价编号 11:数量 12:单位 13:客户预算 14-18:费用相关
  // 19:备注(下一步动作) 20:类别 21:制程 22:工段

  let imported = 0;
  let skipped = 0;

  console.log('\n→ 导入数据到「抓住机会」...\n');

  for (let i = 3; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue; // 跳过空行

    const projectName = (row[5] || '').toString().trim();
    if (!projectName) continue; // 跳过无项目名称的行

    const typeVal = (row[6] || '').toString().trim();
    const stageVal = (row[8] || '').toString().trim();
    const resultVal = (row[9] || '').toString().trim();
    const budgetRaw = row[13];
    const dateSerial = row[7];
    const notes = (row[19] || '').toString().trim();

    // 解析预算
    let budget = undefined;
    if (budgetRaw !== undefined && budgetRaw !== '') {
      const num = parseFloat(String(budgetRaw).replace(/[^\d.]/g, ''));
      if (!isNaN(num) && num > 0) budget = num;
    }

    const fields = {
      '项目名称': projectName,
      '分类': mapType(typeVal),
      '项目阶段': mapStage(stageVal, resultVal),
    };

    if (budget !== undefined) fields['客户预算'] = budget;

    const dateTs = excelSerialToTimestamp(dateSerial);
    if (dateTs) fields['开始时间'] = dateTs;

    if (notes) fields['下一步动作'] = notes;

    try {
      await req('POST', `/bitable/v1/apps/${appToken}/tables/${tOpp}/records`, { fields });
      console.log(`  ✓ [${i-2}] ${projectName} (${fields['项目阶段']})`);
      imported++;
      await wait(350);
    } catch (err) {
      console.log(`  ✗ [${i-2}] ${projectName}: ${err.message}`);
      skipped++;
      await wait(350);
    }
  }

  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║              导入完成！                  ║`);
  console.log(`╚══════════════════════════════════════════╝`);
  console.log(`  成功导入: ${imported} 条`);
  if (skipped > 0) console.log(`  跳过: ${skipped} 条`);
}

main().catch(err => {
  console.error('\n✗ 导入失败:', err.message);
  process.exit(1);
});
