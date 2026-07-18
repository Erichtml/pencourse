// 通用 SQLite 连接层。
// 整个应用只维护一个 native SQLite 实例(_ready),并一次性建好所有表。
// 业务模块(coursedb/settings)都从这里取连接,避免多模块各自 open 同一个库文件。
import langningchenModule from 'langningchen';

const DB_PATH = '/userdisk/course_app.db';
let _ready = null;

export function esc(s) {
  return String(s == null ? '' : s).replace(/'/g, "''");
}

// 初始化 SQLite 实例 + 建表(只做一次)。失败返回 null,调用方兜底不崩。
export function getDb() {
  if (_ready) return _ready;
  _ready = (async function () {
    try {
      const mod = langningchenModule;
      const d = mod && mod.SQLite;
      if (!d || typeof d.open !== 'function') return null;
      await d.open(DB_PATH);
      await d.execute('CREATE TABLE IF NOT EXISTS courses(id INTEGER PRIMARY KEY, data TEXT)');
      await d.execute('CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY, value TEXT)');
      return d;
    } catch (e) {
      return null;
    }
  })();
  return _ready;
}
