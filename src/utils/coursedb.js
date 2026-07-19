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

// 保存换课记录。
export async function saveSwap(swap) {
  const d = await getDb();
  if (!d) return false;
  try {
    const c1 = Number(swap.course1_id);
    const c2 = Number(swap.course2_id);
    const tp = esc(swap.type);
    const wn = Number(swap.week_num);
    const ca = esc(swap.created_at);
    await d.execute("INSERT INTO swaps(course1_id, course2_id, type, week_num, created_at) VALUES(" + c1 + ", " + c2 + ", '" + tp + "', " + wn + ", '" + ca + "')");
    return true;
  } catch (e) {
    return false;
  }
}

// 加载本周有效的临时换课记录。
export async function loadActiveSwaps(currentWeekNum) {
  const d = await getDb();
  if (!d) return [];
  try {
    const res = await d.select('SELECT id, course1_id, course2_id, type, week_num, created_at FROM swaps WHERE type = "temporary" AND week_num = ' + Number(currentWeekNum));
    const rows = (res && res.data) ? res.data : [];
    return rows.map(r => ({
      id: Number(r.id),
      course1_id: Number(r.course1_id),
      course2_id: Number(r.course2_id),
      type: r.type,
      week_num: Number(r.week_num),
      created_at: r.created_at
    }));
  } catch (e) {
    return [];
  }
}

// 删除过期的临时换课记录。
export async function cleanupExpiredSwaps(currentWeekNum) {
  const d = await getDb();
  if (!d) return false;
  try {
    await d.execute('DELETE FROM swaps WHERE type = "temporary" AND week_num < ' + Number(currentWeekNum));
    return true;
  } catch (e) {
    return false;
  }
}
