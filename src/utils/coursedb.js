// 课程持久化: 复用 db.js 的通用 SQLite 连接。
// SQLite API(异步 Promise):
//   open(path)    -> {success, path}
//   execute(sql)  -> {success}          用于 CREATE/INSERT/UPDATE/DELETE
//   select(sql)   -> {success, data:[{col:val,...},...]}
//   close()       -> {success}
import { getDb, esc } from './db.js';

// 读全部课程 → 课程对象数组。失败返回 []。
export async function loadAllCourses() {
  const d = await getDb();
  if (!d) return [];
  try {
    const res = await d.select('SELECT id, data FROM courses ORDER BY id');
    const rows = (res && res.data) ? res.data : [];
    const out = [];
    for (const r of rows) {
      try {
        const c = JSON.parse(r.data);
        c.id = Number(r.id);
        out.push(c);
      } catch (_) { /* 跳过坏行 */ }
    }
    return out;
  } catch (e) {
    return [];
  }
}

// upsert 一条课程(id 主键)。
export async function saveCourse(course) {
  const d = await getDb();
  if (!d) return false;
  try {
    const id = Number(course.id);
    const json = esc(JSON.stringify(course));
    await d.execute("INSERT OR REPLACE INTO courses(id, data) VALUES(" + id + ", '" + json + "')");
    return true;
  } catch (e) {
    return false;
  }
}

// 按 id 删除。
export async function deleteCourseById(id) {
  const d = await getDb();
  if (!d) return false;
  try {
    await d.execute('DELETE FROM courses WHERE id=' + Number(id));
    return true;
  } catch (e) {
    return false;
  }
}
