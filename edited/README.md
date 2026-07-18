# 课程表 app —— 数据库持久化改动

帮你把课程数据存进设备 sqlite,重启不再丢。**原有功能全保留**(AI/IME/ScanInput/Shell/Update 一个没动),只是把你 C++ 层里那个一直没用起来的 `JSSQLite` 补全并暴露给 JS。

真机(有道笔 aarch64)实测通过:课程加进去 → 重启 app → 还在。

---

## 一、原来的问题

- `ui/src/pages/index/index.vue` 的 `loadCourses()` 是空桩,不读任何存储;`addCourse`/`deleteCourse` 只改内存数组,没落盘。
- C++ 层其实有 `jsapi/src/AI/JSSQLite.cpp`(通用 sqlite 绑定),但:
  - `JSAPI.cpp` 没把 `SQLite` 导出给 JS,require 拿不到;
  - `JSSQLite::select` 是空桩(只返回空数组);
  - 有几处写法对不上 SDK,其实**从没编译过**。

---

## 二、改了哪 5 个文件(`src改动/` 里,按原路径放好了)

### C++(jsapi)
1. **`jsapi/src/AI/JSSQLite.cpp`** —— 补全 + 修正
   - 实现 `select`:`prepare_v2` + `step` 循环,返回 `{success, data:[{列:值},...]}`。
   - `open` 改收完整路径参数(原来用了非本 SDK 的 `getDataDir()`)。
   - 参数读取改 `info[0].string_value()`(原 `info.getString(0)` 本 SDK 无此方法)。
   - `post` 改用 `Bson::object`/`Bson::array`(原 nlohmann brace-init 与 Bson 不兼容)。
   - 析构改直接 `sqlite3_close`(原 `close({})` 绑定报错)。
2. **`jsapi/src/AI/JSSQLite.hpp`** —— 加 `using namespace JQUTIL_NS;`(原缺,`JQPublishObject`/`JQAsyncInfo` 找不到);头 include 用 `<sqlite3/sqlite3.h>`(和你 `Database/*.cpp` 一致)。
3. **`jsapi/src/JSAPI.cpp`** —— `exportList` 加 `"SQLite"`,`module_init` 加 `setModuleExport("SQLite", createSQLite(env.get()))`。**AI/IME/ScanInput/Shell/Update 全部保留**。

### 前端(ui)
4. **`ui/src/utils/coursedb.js`**(新增)—— 封装 `require('langningchen').SQLite`:open / 建表 / loadAll / save(upsert) / deleteById。表 `courses(id INTEGER PRIMARY KEY, data TEXT)`,每行存一门课的 JSON;SQL 单引号转义防注入。
5. **`ui/src/pages/index/index.vue`**(3 处)——
   - 顶部 `import { loadAllCourses, saveCourse, deleteCourseById } from '../../utils/coursedb.js'`
   - `loadCourses()`:从库异步读回(失败兜底空数组)
   - `addCourse()`:push 后 `saveCourse(courseData)`
   - `deleteCourse()`:filter 后 `deleteCourseById(delId)`

DB 文件默认落在 `/userdisk/course_app.db`(想改路径就改 `coursedb.js` 里的 open 参数)。

---

## 三、怎么集成

把 `src改动/` 下 5 个文件按路径覆盖进你的工程,然后照你平时的方式构建(native 编 `libjsapi_langningchen.so` + `aiot-cli` 打 amr)。

CMakeLists 无需改——`file(GLOB_RECURSE src/*.cpp)` 会自动带上改动;sqlite3 头/库来自你的 versioninfo 包(`include/sqlite3/` + `lib/libsqlite3.so`)。

---

## 四、如果你用 GitHub Actions CI 构建

你仓库自带的 workflow 是从原始 langningchen 工程搬来的,课程表 app 精简后有 3 处对不上,CI 会失败。修法:

1. **`update.ts` 引用**:课程表没有 OTA 更新页,但 workflow 和 `tools/build.sh` 都硬引用 `ui/src/pages/update/update.ts`。
   - 每条 `build_for_*.yml` 里那句 `sed ... update.ts` 前面加存在判断:
     `if [ -f ./ui/src/pages/update/update.ts ]; then sed ...; fi`
   - `tools/build.sh` 的 `check_version_consistency`:文件不存在时 `return 0`(跳过),别 `return 1`。

2. **`aiot-vue-cli` 缺失**:课程表 UI 用全局 `aiot-cli`,没装 workflow 里打补丁的那个 `aiot-vue-cli`。最省事的办法是让 CI **只编 native .so**(给 `build.sh` 加个 `--native-only` 跳过 UI 打包),amr 你本地用 `aiot-cli` 打,再把 CI 编的 .so 换进 amr 的 `libs/`。

3. **sqlite 头路径**:已在本次源码改动里修好(`<sqlite3/sqlite3.h>`),你直接用即可。

> 这 3 处只影响"能不能在你现有 CI 里一键构建",跟数据库功能本身无关。你要是本地手动构建,只看第三节就够了。

---

## 五、说明

- `JSSQLite` 本来是死代码(从没编译过),本次是**完善它**,没引入新依赖。
- 课程存 JSON blob,几十门课绰绰有余;要更结构化可以改成多列。
- native 模块 require 名沿用你工程里的 `langningchen`。
