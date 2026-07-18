#include "JSSQLite.hpp"

// 说明:原作者此文件是半成品(select 空桩、post 用 nlohmann brace-init 与本 SDK 的 Bson 不兼容、
// getString/getDataDir 非本 SDK API、析构 close({}) 绑定错)。此处按本 SDK(jqutil_dist)的
// Bson / info[] 约定补全,使 require('langningchen').SQLite 可用。仅完善其未完成代码。

JSSQLITE::JSSQLITE() {}

JSSQLITE::~JSSQLITE() {
  if (db) {
    sqlite3_close(db);
    db = nullptr;
  }
}

// open(path) -> Promise<{success, path}>。path 为绝对路径,缺省 /userdisk/course_app.db
void JSSQLITE::open(JQAsyncInfo &info) {
  try {
    std::string path = info[0].is_string() ? info[0].string_value() : "";
    if (path.empty()) path = "/userdisk/course_app.db";
    int rc = sqlite3_open(path.c_str(), &db);
    if (rc) {
      info.postError(db ? sqlite3_errmsg(db) : "open failed");
    } else {
      Bson::object out = {{"success", true}, {"path", path}};
      info.post(out);
    }
  } catch (const std::exception &e) {
    info.postError(e.what());
  }
}

// execute(sql) -> Promise<{success}>。用于 CREATE/INSERT/UPDATE/DELETE 等无结果集语句
void JSSQLITE::execute(JQAsyncInfo &info) {
  try {
    if (!db) { info.postError("数据库未打开"); return; }
    std::string sql = info[0].is_string() ? info[0].string_value() : "";
    char *errMsg = nullptr;
    int rc = sqlite3_exec(db, sql.c_str(), nullptr, nullptr, &errMsg);
    if (rc != SQLITE_OK) {
      std::string err = errMsg ? errMsg : "执行失败";
      if (errMsg) sqlite3_free(errMsg);
      info.postError(err);
    } else {
      Bson::object out = {{"success", true}};
      info.post(out);
    }
  } catch (const std::exception &e) {
    info.postError(e.what());
  }
}

// select(sql) -> Promise<{success, data:[{col:val,...},...]}>
void JSSQLITE::select(JQAsyncInfo &info) {
  try {
    if (!db) { info.postError("数据库未打开"); return; }
    std::string sql = info[0].is_string() ? info[0].string_value() : "";

    sqlite3_stmt *stmt = nullptr;
    int rc = sqlite3_prepare_v2(db, sql.c_str(), -1, &stmt, nullptr);
    if (rc != SQLITE_OK || !stmt) {
      std::string err = sqlite3_errmsg(db);
      if (stmt) sqlite3_finalize(stmt);
      info.postError(err);
      return;
    }

    Bson::array rows;
    int ncol = sqlite3_column_count(stmt);
    while (sqlite3_step(stmt) == SQLITE_ROW) {
      Bson::object row;
      for (int i = 0; i < ncol; i++) {
        const char *cn = sqlite3_column_name(stmt, i);
        std::string col = cn ? cn : "";
        int t = sqlite3_column_type(stmt, i);
        if (t == SQLITE_INTEGER) {
          row[col] = (int)sqlite3_column_int64(stmt, i);
        } else if (t == SQLITE_FLOAT) {
          row[col] = sqlite3_column_double(stmt, i);
        } else if (t == SQLITE_NULL) {
          row[col] = Bson();
        } else {
          const unsigned char *txt = sqlite3_column_text(stmt, i);
          row[col] = txt ? std::string((const char *)txt) : std::string("");
        }
      }
      rows.push_back(row);
    }
    sqlite3_finalize(stmt);
    Bson::object out = {{"success", true}, {"data", rows}};
    info.post(out);
  } catch (const std::exception &e) {
    info.postError(e.what());
  } catch (...) {
    info.postError("查询失败");
  }
}

void JSSQLITE::close(JQAsyncInfo &info) {
  if (db) {
    sqlite3_close(db);
    db = nullptr;
  }
  Bson::object out = {{"success", true}};
  info.post(out);
}

JSValue createSQLite(JQModuleEnv *env) {
  JQFunctionTemplateRef tpl = JQFunctionTemplate::New(env, "SQLite");
  tpl->InstanceTemplate()->setObjectCreator([]() { return new JSSQLITE(); });

  tpl->SetProtoMethodPromise("open", &JSSQLITE::open);
  tpl->SetProtoMethodPromise("execute", &JSSQLITE::execute);
  tpl->SetProtoMethodPromise("select", &JSSQLITE::select);
  tpl->SetProtoMethodPromise("close", &JSSQLITE::close);

  return tpl->CallConstructor();
}
