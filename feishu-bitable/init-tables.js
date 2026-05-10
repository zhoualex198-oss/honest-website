// ============================================================
//  宏斯特机电 - 多维表格初始化脚本
//  自动创建：客户管理 / 抓住机会 / 在制订单 / 售后维保 / 结案
// ============================================================

import config from './config.js';

const BASE_URL = 'https://open.feishu.cn/open-apis';

// ---- 辅助：等待 ----
const wait = ms => new Promise(r => setTimeout(r, ms));

// ---- 通用：获取 token ----
async function getToken() {
  const resp = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: config.APP_ID, app_secret: config.APP_SECRET }),
  });
  const data = await resp.json();
  if (data.code !== 0) throw new Error(`获取 token 失败: ${data.msg}`);
  return data.tenant_access_token;
}

// ---- 通用：带 token 的请求 ----
async function request(method, path, body = null) {
  const token = await getToken();
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) options.body = JSON.stringify(body);
  const resp = await fetch(url, options);
  const data = await resp.json();
  if (data.code !== 0) throw new Error(`API 错误 [${data.code}]: ${data.msg}\n请求: ${method} ${path}`);
  return data;
}

// ---- 创建或获取多维表格 ----
async function getOrCreateBitable() {
  if (config.EXISTING_APP_TOKEN) {
    console.log(`→ 使用已有多维表格: ${config.EXISTING_APP_TOKEN}`);
    return config.EXISTING_APP_TOKEN;
  }
  console.log('→ 创建新的多维表格...');
  const data = await request('POST', '/bitable/v1/apps', {
    name: config.BASE_NAME,
    time_zone: 'Asia/Shanghai',
  });
  const appToken = data.data.app.app_token;
  console.log(`✓ 创建成功: ${appToken}`);
  console.log(`  链接: https://bytedance.feishu.cn/base/${appToken}`);
  return appToken;
}

// ---- 打印链接 ----
function printUrl(appToken) {
  console.log(`  链接: https://bytedance.feishu.cn/base/${appToken}`);
}

// ============================================================
//  表定义
// ============================================================

// --- 初始字段类型限制: 创建表时只支持 文本(1), 数字(2), 日期(5), 电话(13), 超链接(15), 公式(20), 地理位置(22)
// --- 其他类型（单选、多选、人员、关联等）需创建表后用 createField 追加

const TABLES = [
  // ========== 客户管理 ==========
  {
    name: '客户管理',
    initFields: [
      { field_name: '客户名称', type: 1 },
      { field_name: '业务介绍', type: 1 },
      { field_name: '地区', type: 1 },
      { field_name: '对接人', type: 1 },
      { field_name: '对接人职位', type: 1 },
      { field_name: '电话', type: 13 },
      { field_name: '邮箱', type: 1 },
      { field_name: '接单累计金额', type: 2 },
    ],
    // 表创建后追加的复杂字段
    extraFields: [
      {
        field_name: '行业',
        type: 3,
        property: {
          options: [
            { name: '锂电行业', color: 0 },
            { name: '电机马达', color: 1 },
            { name: '金属加工', color: 2 },
            { name: '汽摩配套', color: 3 },
            { name: '白色家电', color: 4 },
            { name: '其他', color: 5 },
          ],
        },
      },
      {
        field_name: '规模',
        type: 3,
        property: {
          options: [
            { name: '小型', color: 0 },
            { name: '中型', color: 1 },
            { name: '大型', color: 2 },
            { name: '特大型', color: 3 },
          ],
        },
      },
      { field_name: '客户所有人', type: 11 },
      { field_name: '销售Leader', type: 11 },
      {
        field_name: '客户阶段',
        type: 3,
        property: {
          options: [
            { name: '有机会', color: 0 },
            { name: '暂无机会', color: 1 },
          ],
        },
      },
      {
        field_name: '接单累计金额',
        type: 2,
        ui_type: 'Currency',
        property: { formatter: '0.00', currency_code: 'CNY' },
        // 覆盖上面的同名基础字段
        replace: true,
      },
    ],
  },

  // ========== 抓住机会 ==========
  {
    name: '抓住机会',
    initFields: [
      { field_name: '项目名称', type: 1 },
      { field_name: '客户预算', type: 2 },
      { field_name: '开始时间', type: 5 },
      { field_name: '下一步动作', type: 1 },
    ],
    extraFields: [
      {
        field_name: '分类',
        type: 3,
        property: {
          options: [
            { name: '改造类', color: 0 },
            { name: '线体类', color: 1 },
            { name: '单机类', color: 2 },
          ],
        },
      },
      {
        field_name: '项目阶段',
        type: 3,
        property: {
          options: [
            { name: '信息', color: 0 },
            { name: '现场检讨', color: 1 },
            { name: '方案、成本', color: 2 },
            { name: '报价', color: 3 },
            { name: '中标', color: 4 },
            { name: '未中标', color: 5 },
            { name: '暂停', color: 6 },
          ],
        },
      },
      { field_name: '营销负责人', type: 11 },
      { field_name: '技术负责人', type: 11 },
    ],
  },

  // ========== 在制订单 ==========
  {
    name: '在制订单',
    initFields: [
      { field_name: '项目名称', type: 1 },
      { field_name: '完成度', type: 2 },
      { field_name: '下一步动作', type: 1 },
    ],
    extraFields: [
      {
        field_name: '分类',
        type: 3,
        property: {
          options: [
            { name: '改造类', color: 0 },
            { name: '线体类', color: 1 },
            { name: '单机类', color: 2 },
          ],
        },
      },
      {
        field_name: '项目阶段',
        type: 3,
        property: {
          options: [
            { name: '信息', color: 0 },
            { name: '现场检讨', color: 1 },
            { name: '方案、成本', color: 2 },
            { name: '报价', color: 3 },
            { name: '中标', color: 4 },
            { name: '未中标', color: 5 },
            { name: '暂停', color: 6 },
          ],
        },
      },
      { field_name: '营销负责人', type: 11 },
      { field_name: '技术负责人', type: 11 },
      {
        field_name: '完成度',
        type: 2,
        ui_type: 'Progress',
        property: { formatter: '0' },
        replace: true,
      },
    ],
  },

  // ========== 售后维保 ==========
  {
    name: '售后维保',
    initFields: [
      { field_name: '项目名称', type: 1 },
      { field_name: '开始日期', type: 5 },
      { field_name: '维保到期日', type: 5 },
      { field_name: '备注', type: 1 },
    ],
    extraFields: [
      {
        field_name: '分类',
        type: 3,
        property: {
          options: [
            { name: '改造类', color: 0 },
            { name: '线体类', color: 1 },
            { name: '单机类', color: 2 },
          ],
        },
      },
      {
        field_name: '状态',
        type: 3,
        property: {
          options: [
            { name: '进行中', color: 0 },
            { name: '已完成', color: 1 },
          ],
        },
      },
      { field_name: '负责人', type: 11 },
    ],
  },

  // ========== 结案 ==========
  {
    name: '结案',
    initFields: [
      { field_name: '项目名称', type: 1 },
      { field_name: '结案日期', type: 5 },
      { field_name: '项目总结', type: 1 },
    ],
    extraFields: [
      {
        field_name: '分类',
        type: 3,
        property: {
          options: [
            { name: '改造类', color: 0 },
            { name: '线体类', color: 1 },
            { name: '单机类', color: 2 },
          ],
        },
      },
      { field_name: '归档人', type: 11 },
    ],
  },
];

// ============================================================
//  执行
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     宏斯特机电 - 多维表格初始化          ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 1. 创建多维表格
  const appToken = await getOrCreateBitable();
  console.log('');

  // 2. 获取已有表列表（防止重复创建）
  let existingTables = {};
  try {
    const listData = await request('GET', `/bitable/v1/apps/${appToken}/tables`);
    for (const t of listData.data.items || []) {
      existingTables[t.name] = t.table_id;
    }
  } catch (_) {}

  console.log(`已存在 ${Object.keys(existingTables).length} 张表\n`);

  // 3. 遍历创建每张表
  const tableIds = {};

  for (const tableDef of TABLES) {
    const tableName = tableDef.name;

    // 如果表已存在，直接复用
    if (existingTables[tableName]) {
      tableIds[tableName] = existingTables[tableName];
      console.log(`→ ${tableName}: 已存在 (${existingTables[tableName]})`);
      continue;
    }

    // 创建表（带初始字段）
    console.log(`→ 创建表: ${tableName} ...`);
    const createData = await request('POST', `/bitable/v1/apps/${appToken}/tables`, {
      table: {
        name: tableName,
        fields: tableDef.initFields || [],
      },
    });
    const tableId = createData.data.table_id;
    tableIds[tableName] = tableId;
    console.log(`✓ 创建成功: ${tableName} (${tableId})`);
    await wait(500);

    // 追加复杂字段
    if (tableDef.extraFields && tableDef.extraFields.length > 0) {
      for (const field of tableDef.extraFields) {
        // 如果是 replace 类型字段，需要先删除已有的（创建表时已创建的基础版本）
        // 但因为 replace 标记同名字段，我们需要先检查并删除
        // 简化处理：跳过 replace，后续通过更新字段来处理
        if (field.replace) {
          console.log(`  ~ 更新字段: ${field.field_name} (${field.ui_type || '升级类型'})`);
          try {
            // 查出现有字段 ID
            const fieldsData = await request('GET', `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`);
            const existingField = fieldsData.data.items.find(f => f.field_name === field.field_name);
            if (existingField && existingField.type !== field.type) {
              // 删除原字段
              await request('DELETE', `/bitable/v1/apps/${appToken}/tables/${tableId}/fields/${existingField.field_id}`);
              await wait(300);
              // 重建
              const { replace, ...newField } = field;
              await request('POST', `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, newField);
              await wait(300);
            }
          } catch (e) {
            console.log(`  ! 字段更新跳过: ${e.message}`);
          }
        } else {
          console.log(`  + 添加字段: ${field.field_name} (类型: ${field.type})`);
          try {
            await request('POST', `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, field);
            await wait(400);
          } catch (e) {
            console.log(`  ! 字段添加跳过: ${e.message}`);
          }
        }
      }
    }

    console.log('');
  }

  // 4. 建立表间关联（客户管理 → 其他表）
  console.log('→ 建立表间关联...');
  const customerTableId = tableIds['客户管理'];
  if (customerTableId) {
    for (const tableName of ['抓住机会', '在制订单', '售后维保', '结案']) {
      const tid = tableIds[tableName];
      if (!tid) continue;
      try {
        await request('POST', `/bitable/v1/apps/${appToken}/tables/${tid}/fields`, {
          field_name: '客户',
          type: 18, // SingleLink
          property: {
            table_id: customerTableId,
            multiple: false,
          },
        });
        console.log(`  + ${tableName} → 关联字段「客户」已添加`);
        await wait(400);
      } catch (e) {
        console.log(`  ! ${tableName} 关联添加跳过: ${e.message}`);
      }
    }
  }

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║              初始化完成！                 ║');
  console.log('╚══════════════════════════════════════════╝');
  printUrl(appToken);

  // 返回结果供后续脚本使用
  return { appToken, tableIds };
}

main().catch(err => {
  console.error('\n✗ 初始化失败:', err.message);
  process.exit(1);
});
