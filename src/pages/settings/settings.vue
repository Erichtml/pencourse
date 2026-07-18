<template>
  <div class="page">
    <div class="header">
      <text class="title">设置</text>
    </div>

    <scroller class="content-scroller">
      <div class="content">
        <div class="setting-item">
          <text class="setting-label">显示课程地点</text>
          <div :class="['switch', showLocation ? 'switch-on' : '']" @click="toggleLocation">
            <div :class="['switch-thumb', showLocation ? 'thumb-on' : '']"></div>
          </div>
        </div>

        <text class="tip">开启后,课程卡片和详情将显示上课地点。</text>

        <div class="setting-item" v-if="showDebug || debugUnlocked">
          <text class="setting-label">显示调试信息</text>
          <div :class="['switch', showDebug ? 'switch-on' : '']" @click="toggleDebug">
            <div :class="['switch-thumb', showDebug ? 'thumb-on' : '']"></div>
          </div>
        </div>

        <text class="tip" v-if="showDebug || debugUnlocked">开启后,首页和设置页会显示红色调试文字。</text>

        <text class="debug" v-if="showDebug">{{ debugText }}</text>
      </div>
    </scroller>

    <div class="footer">
      <div class="back-btn" @click="goBack">
        <text class="back-text">返回</text>
      </div>
    </div>
  </div>
</template>

<script>
import { getShowLocation, setShowLocation, getShowDebug, setShowDebug } from '../../utils/settings.js';

export default {
  data() {
    return {
      showLocation: false,
      showDebug: false,
      debugUnlocked: false,
      debugText: 'init'
    };
  },
  mounted() {
    this.debugUnlocked = this.checkDebugUnlocked();
    this.loadSetting('mounted');
  },
  beforeDestroy() {
    if (!this.showDebug) {
      this.setDebugUnlocked(false);
    }
  },
  methods: {
    checkDebugUnlocked() {
      try {
        return typeof window !== 'undefined' && !!window.debugUnlocked;
      } catch (e) {
        return false;
      }
    },
    setDebugUnlocked(value) {
      try {
        if (typeof window !== 'undefined') {
          window.debugUnlocked = !!value;
        }
      } catch (e) {}
      this.debugUnlocked = !!value;
    },
    loadSetting(source) {
      const self = this;
      self.debugText = (source || 'load') + ':loading';

      Promise.all([getShowLocation(), getShowDebug()]).then(function(results){
        self.showLocation = !!results[0];
        self.showDebug = !!results[1];
        self.debugText = (source || 'load') + ':loc=' + JSON.stringify(results[0]) + ' dbg=' + JSON.stringify(results[1]) + ' unlocked=' + self.debugUnlocked;
      }).catch(function(e){
        self.showLocation = false;
        self.showDebug = false;
        self.debugText = (source || 'load') + ':err:' + (e && e.message ? e.message : String(e));
      });
    },
    goBack() {
      this.$page.finish();
    },
    toggleLocation() {
      const self = this;
      self.showLocation = !self.showLocation;
      setShowLocation(self.showLocation).then(function(ok){
        self.refreshDebug('saved:loc=' + ok);
      }).catch(function (e) {
        self.refreshDebug('saveLocErr:' + (e && e.message ? e.message : String(e)));
      });
    },
    toggleDebug() {
      const self = this;
      self.showDebug = !self.showDebug;
      self.setDebugUnlocked(false);
      setShowDebug(self.showDebug).then(function(ok){
        self.refreshDebug('saved:dbg=' + ok);
      }).catch(function (e) {
        self.refreshDebug('saveDbgErr:' + (e && e.message ? e.message : String(e)));
      });
    },
    refreshDebug(msg) {
      if (this.showDebug) {
        this.debugText = msg;
      }
    }
  }
};
</script>

<style>
.page {
  background-color: #F5F5F5;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.header {
  background-color: #2196F3;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 16px;
  padding-right: 16px;
}

.title {
  font-size: 22px;
  color: #FFFFFF;
  font-weight: bold;
  text-align: center;
}

.content-scroller {
  flex: 1;
}

.content {
  padding: 12px;
}

.setting-item {
  background-color: #FFFFFF;
  border-radius: 8px;
  padding-top: 12px;
  padding-bottom: 12px;
  padding-left: 16px;
  padding-right: 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.setting-label {
  font-size: 14px;
  color: #333333;
}

.switch {
  width: 48px;
  height: 26px;
  border-radius: 13px;
  background-color: #CCCCCC;
  position: relative;
}

.switch-on {
  background-color: #2196F3;
}

.switch-thumb {
  width: 22px;
  height: 22px;
  border-radius: 11px;
  background-color: #FFFFFF;
  position: absolute;
  top: 2px;
  left: 2px;
}

.thumb-on {
  left: 24px;
}

.tip {
  font-size: 12px;
  color: #999999;
  margin-top: 4px;
  margin-bottom: 12px;
  margin-left: 4px;
  margin-right: 4px;
}

.debug {
  font-size: 10px;
  color: #F44336;
  margin-top: 4px;
  margin-left: 4px;
  margin-right: 4px;
}

.footer {
  padding: 8px;
  background-color: #FFFFFF;
  border-top-width: 1px;
  border-top-color: #E0E0E0;
}

.back-btn {
  background-color: #2196F3;
  border-radius: 12px;
  padding-top: 8px;
  padding-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.back-text {
  font-size: 16px;
  color: #FFFFFF;
  font-weight: bold;
}
</style>
