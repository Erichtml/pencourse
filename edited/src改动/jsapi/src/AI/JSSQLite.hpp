#pragma once
#include <jqutil_v2/jqutil.h>
#include <sqlite3/sqlite3.h>

using namespace JQUTIL_NS;

class JSSQLITE : public JQPublishObject {
private:
  sqlite3* db = nullptr;

public:
  JSSQLITE();
  ~JSSQLITE();

  void open(JQAsyncInfo &info);
  void execute(JQAsyncInfo &info);
  void select(JQAsyncInfo &info);
  void close(JQAsyncInfo &info);
};

JSValue createSQLite(JQModuleEnv *env);