// 设置持久化: 复用 db.js 的通用 SQLite 连接。
import { getDb, esc } from './db.js';

const SHOW_LOCATION_KEY = 'showLocation';
const SHOW_DEBUG_KEY = 'showDebug';

// 通用读配置。key 不存在或失败时返回 defaultValue。
export async function getSetting(key, defaultValue) {
  const d = await getDb();
  if (!d) return defaultValue;
  try {
    const res = await d.select("SELECT value FROM settings WHERE key='" + esc(key) + "'");
    const rows = (res && res.data) ? res.data : [];
    if (rows.length > 0 && rows[0].value !== undefined && rows[0].value !== null) {
      return rows[0].value;
    }
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

// 通用写配置。
export async function setSetting(key, value) {
  const d = await getDb();
  if (!d) return false;
  try {
    const v = esc(String(value));
    await d.execute("INSERT OR REPLACE INTO settings(key, value) VALUES('" + esc(key) + "', '" + v + "')");
    return true;
  } catch (e) {
    return false;
  }
}

// 是否显示课程地点。默认关闭(false)。
export async function getShowLocation() {
  const raw = await getSetting(SHOW_LOCATION_KEY, 'false');
  return String(raw).toLowerCase().trim() === 'true';
}

export async function setShowLocation(show) {
  return await setSetting(SHOW_LOCATION_KEY, show ? 'true' : 'false');
}

// 是否显示调试信息。默认关闭(false)。
export async function getShowDebug() {
  const raw = await getSetting(SHOW_DEBUG_KEY, 'false');
  return String(raw).toLowerCase().trim() === 'true';
}

export async function setShowDebug(show) {
  return await setSetting(SHOW_DEBUG_KEY, show ? 'true' : 'false');
}
