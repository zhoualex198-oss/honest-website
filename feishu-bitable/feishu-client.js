// ============================================================
//  飞书 API 客户端 - 封装 token 获取和通用请求
// ============================================================

import config from './config.js';

const BASE_URL = 'https://open.feishu.cn/open-apis';

class FeishuClient {
  constructor() {
    this.token = null;
    this.tokenExpire = 0;
  }

  // ---- 获取 tenant_access_token ----
  async getToken() {
    if (Date.now() < this.tokenExpire) return this.token;

    const resp = await fetch(`${BASE_URL}/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: config.APP_ID,
        app_secret: config.APP_SECRET,
      }),
    });
    const data = await resp.json();
    if (data.code !== 0) throw new Error(`获取 token 失败: ${data.msg}`);
    this.token = data.tenant_access_token;
    this.tokenExpire = Date.now() + (data.expire - 60) * 1000;
    return this.token;
  }

  // ---- 通用请求 ----
  async request(method, path, body = null) {
    const token = await this.getToken();
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
    if (data.code !== 0 && data.code !== 0) {
      // 有些接口返回 code != 0 但不算错误，如查询类
      if (data.code !== 0) {
        throw new Error(`API 错误 [${data.code}]: ${data.msg} (${method} ${path})`);
      }
    }
    return data;
  }

  // ---- 快捷方法 ----

  // 创建多维表格
  async createBitable(name) {
    return this.request('POST', `/bitable/v1/apps`, {
      name,
      time_zone: 'Asia/Shanghai',
    });
  }

  // 创建数据表（工作表）
  async createTable(appToken, tableName, fields = []) {
    return this.request('POST', `/bitable/v1/apps/${appToken}/tables`, {
      table: { name: tableName, fields },
    });
  }

  // 获取所有数据表
  async listTables(appToken) {
    return this.request('GET', `/bitable/v1/apps/${appToken}/tables`);
  }

  // 新增字段
  async createField(appToken, tableId, field) {
    return this.request('POST', `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`, field);
  }

  // 获取所有字段
  async listFields(appToken, tableId) {
    return this.request('GET', `/bitable/v1/apps/${appToken}/tables/${tableId}/fields`);
  }

  // 新增记录
  async createRecord(appToken, tableId, fields) {
    return this.request('POST', `/bitable/v1/apps/${appToken}/tables/${tableId}/records`, {
      fields,
    });
  }

  // 批量新增记录（最多 500 条）
  async batchCreateRecords(appToken, tableId, records) {
    return this.request('POST', `/bitable/v1/apps/${appToken}/tables/${tableId}/records/batch_create`, {
      records,
    });
  }

  // 列出记录
  async listRecords(appToken, tableId, pageSize = 500) {
    return this.request('GET', `/bitable/v1/apps/${appToken}/tables/${tableId}/records?page_size=${pageSize}`);
  }

  // 更新记录
  async updateRecord(appToken, tableId, recordId, fields) {
    return this.request('PUT', `/bitable/v1/apps/${appToken}/tables/${tableId}/records/${recordId}`, {
      fields,
    });
  }

  // 等待（避免并发限制）
  async wait(ms = 600) {
    return new Promise(r => setTimeout(r, ms));
  }
}

export default FeishuClient;
