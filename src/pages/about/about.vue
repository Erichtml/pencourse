<template>
  <div class="page">
    <div class="header">
      <text class="title">关于</text>
    </div>

    <scroller class="content-scroller">
      <div class="content">
        <div class="logo-card">
          <image class="app-icon" src="assets/images/schedule.png" />
          <text class="app-name">课程表</text>
          <text class="version">版本 1.1.0</text>
        </div>

        <div class="info-list">
          <div :class="['info-item', !isDebugEnabled ? 'clickable-item' : '']" @click="onCommonClick">
            <text class="info-label">作者</text>
            <text class="info-value">Eric</text>
          </div>
          <div :class="['info-item', !isDebugEnabled ? 'clickable-item' : '']" @click="onFrameworkClick">
            <text class="info-label">框架</text>
            <text class="info-value">Falcon / HaaS UI</text>
          </div>
          <div :class="['info-item', !isDebugEnabled ? 'clickable-item' : '']" @click="onCommonClick">
            <text class="info-label">说明</text>
            <text class="info-value">一款简洁的课程表小应用</text>
          </div>
        </div>
      </div>
    </scroller>

    <div class="footer">
      <div class="back-btn" @click="goBack">
        <text class="back-text">返回</text>
      </div>
    </div>

    <div class="toast-card" v-if="showToast">
      <text class="toast-text">{{ toastText }}</text>
    </div>
  </div>
</template>

<script>
import { getShowDebug } from '../../utils/settings.js';

const DEBUG_CLICK_THRESHOLD = 7;

export default {
  data() {
    return {
      debugClickCount: 0,
      isDebugEnabled: false,
      showToast: false,
      toastText: ''
    };
  },
  mounted() {
    this.checkDebugEnabled();
  },
  methods: {
    goBack() {
      this.$page.finish();
    },
    checkDebugEnabled() {
      const self = this;
      try {
        if (typeof window !== 'undefined' && window.debugUnlocked) {
          self.isDebugEnabled = true;
          return;
        }
      } catch (e) {}
      getShowDebug().then(function (show) {
        self.isDebugEnabled = !!show;
      }).catch(function () {
        self.isDebugEnabled = false;
      });
    },
    showToastHint(text) {
      this.toastText = text;
      this.showToast = true;
      if (this._toastTimer) {
        clearTimeout(this._toastTimer);
      }
      this._toastTimer = setTimeout(() => {
        this.showToast = false;
      }, 1500);
    },
    resetClickTimer() {
      if (this._clickTimer) {
        clearTimeout(this._clickTimer);
      }
      this._clickTimer = setTimeout(() => {
        this.debugClickCount = 0;
      }, 300);
    },
    onCommonClick() {
      if (this.isDebugEnabled) return;
      this.resetClickTimer();
    },
    onFrameworkClick() {
      if (this.isDebugEnabled) return;
      this.debugClickCount++;
      this.resetClickTimer();
      const remain = DEBUG_CLICK_THRESHOLD - this.debugClickCount;
      if (remain <= 0) {
        this.showToastHint('调试模式已解锁');
        this.debugClickCount = 0;
        if (this._clickTimer) {
          clearTimeout(this._clickTimer);
        }
        this.isDebugEnabled = true;
        try {
          if (typeof window !== 'undefined') {
            window.debugUnlocked = true;
          }
        } catch (e) {}
      } else if (this.debugClickCount >= 4) {
        this.showToastHint('再点击 ' + remain + ' 次显示调试模式');
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

.logo-card {
  background-color: #FFFFFF;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 12px;
}

.app-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 8px;
  border-radius: 12px;
}

.app-name {
  font-size: 26px;
  color: #2196F3;
  font-weight: bold;
  margin-bottom: 4px;
}

.version {
  font-size: 14px;
  color: #666666;
}

.info-list {
  background-color: #FFFFFF;
  border-radius: 8px;
  padding: 8px;
}

.info-item {
  display: flex;
  flex-direction: row;
  padding-top: 8px;
  padding-bottom: 8px;
  border-bottom-width: 1px;
  border-bottom-color: #EEEEEE;
}

.info-item:last-child {
  border-bottom-width: 0;
}

.clickable-item:active {
  background-color: #E3F2FD;
}

.info-label {
  width: 60px;
  font-size: 14px;
  color: #666666;
}

.info-value {
  flex: 1;
  font-size: 14px;
  color: #333333;
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

.toast-card {
  position: fixed;
  left: 50%;
  bottom: 100px;
  width: 180px;
  margin-left: -90px;
  background-color: #333333;
  opacity: 0.5;
  border-radius: 8px;
  padding-top: 12px;
  padding-bottom: 12px;
  padding-left: 20px;
  padding-right: 20px;
  z-index: 200;
}

.toast-text {
  font-size: 14px;
  color: #FFFFFF;
  text-align: center;
}
</style>
