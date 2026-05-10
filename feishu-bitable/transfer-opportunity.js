// ============================================================
//  机会转移脚本 — 将「抓住机会」中状态变为「中标」的
//  记录自动转移到「在制订单」
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

async function getTableId(tableName) {
  const d = await req('GET', `/bitable/v1/apps/${appToken}/tables`);
  const t = d.data.items.find(t => t.name === tableName);
  if (!t) throw new Error(`表 "${tableName}" 不存在`);
  return t.table_id;
}

// ============================================================
//  转移逻辑
// ============================================================

async function transferWonOpportunities() {
  console.log('→ 检查「抓住机会」表中是否有新中标项目...\n');

  const tOpp = await getTableId('抓住机会');
  const tOrder = await getTableId('在制订单');

  // 1. 查询所有 "中标" 状态的机会
  const recordsData = await req('GET', `/bitable/v1/apps/${appToken}/tables/${tOpp}/records?page_size=500`);
  const records = recordsData.data.items || [];

  // 2. 获取字段列表（查找字段 ID 和名称的映射）
  const fieldsData = await req('GET', `/bitable/v1/apps/${appToken}/tables/${tOpp}/fields`);
  const fieldMap = {};
  for (const f of fieldsData.data.items) {
    fieldMap[f.field_name] = { id: f.field_id, type: f.type };
  }

  let transferred = 0;

  for (const rec of records) {
    const fields = rec.fields;
    const stage = fields['项目阶段'];
    const name = fields['项目名称'];
    const linkedCustomer = fields['客户']; // 关联客户的数据

    if (stage === '中标') {
      console.log(`  ▶ 发现中标项目: ${name}`);

      // 构建在制订单的记录
      const orderFields = {
        '项目名称': name,
        '分类': fields['分类'] || undefined,
        '项目阶段': '中标',
        '完成度': 0,
        '营销负责人': fields['营销负责人'] || undefined,
        '技术负责人': fields['技术负责人'] || undefined,
      };

      // 保留客户关联
      if (linkedCustomer && linkedCustomer.length > 0) {
        // 格式: ["recXXXX"] - 直接传 record_id 数组
        orderFields['客户'] = linkedCustomer.map(c =>
          typeof c === 'string' ? c : (c.record_id || c)
        );
      }

      // 写入在制订单
      await req('POST', `/bitable/v1/apps/${appToken}/tables/${tOrder}/records`, {
        fields: orderFields,
      });
      console.log(`  ✓ 已转入在制订单: ${name}`);
      transferred++;
      await wait(500);
    }
  }

  if (transferred === 0) {
    console.log('  - 当前没有新中标项目需要转移');
  } else {
    console.log(`\n✓ 成功转移 ${transferred} 个项目到在制订单`);
  }
}

// ============================================================
//  执行
// ============================================================

transferWonOpportunities().catch(err => {
  console.error('\n✗ 转移失败:', err.message);
  process.exit(1);
});
