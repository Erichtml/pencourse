<template>
  <div class="page">
    <div class="header">
      <div class="header-main">
        <text class="title">我的课程表</text>
        <text class="week-info">{{ currentWeek }}</text>
      </div>
      <div class="header-status">
        <div class="status-box">
          <text class="status-label">当前</text>
          <text class="status-value">{{ currentCourseText }}</text>
        </div>
        <div class="status-box">
          <text class="status-label">下节</text>
          <text class="status-value">{{ nextCourseText }}</text>
        </div>
      </div>
      <div class="header-btns">
        <div class="settings-btn" @click="goSettings">
          <text class="settings-text">设置</text>
        </div>
        <div class="about-btn" @click="goAbout">
          <text class="about-text">关于</text>
        </div>
      </div>
    </div>
    
    <div class="week-nav">
      <div v-for="(day, index) in weekDays" 
           :key="index" 
           :class="['week-day', currentDayIndex === index ? 'active-day' : '']"
           @click="selectDay(index)">
        <text class="day-name">{{ day.name }}</text>
        <text class="day-date">{{ day.date }}</text>
      </div>
    </div>
    
    <text class="debug-text" v-if="showDebug">{{ debugText }}</text>

    <div v-if="dayCourses.length === 0" class="empty-tip">
      <text class="empty-text">今日暂无课程</text>
      <text class="empty-subtext">点击下方按钮添加课程</text>
    </div>
    <scroller v-else class="schedule-scroller">
      <div class="course-list">
        <div v-for="course in dayCourses"
             :key="course.id"
             class="course-card"
             :style="{ backgroundColor: course.color }"
             @click="handleCardClick(course)">
          <div class="select-hit-area" @click="onCircleClick(course.id, $event)">
            <div :class="isSelected(course.id) ? 'select-circle select-circle-selected' : 'select-circle'">
              <text v-if="isSelected(course.id)" class="check-icon">✓</text>
            </div>
          </div>
          <text class="course-time">{{ getCourseCardTime(course) }}</text>
          <div class="course-middle">
            <text class="course-name">{{ course.name }}</text>
          </div>
          <text class="course-location" v-if="showLocation" :class="course.location ? '' : 'location-empty'">{{ course.location || '未添加地点' }}</text>
        </div>
      </div>
    </scroller>
    
    <div class="swap-fab" @click="openSwapTypeDialog" v-if="!swapMode">
      <text class="swap-fab-text">⇌</text>
    </div>

    <div class="fab" :class="{ 'fab-delete': hasSelected, 'fab-swap': swapMode }" @click="handleFabClick">
      <text class="fab-text">{{ swapMode ? '✓' : (hasSelected ? '−' : '+') }}</text>
    </div>
    
    <div class="dialog-mask" v-if="showAddDialog" @click="closeAddDialog">
      <div class="dialog" @click.stop>
        <text class="dialog-title">{{ editMode ? '编辑课程' : '添加课程' }}</text>
        
        <scroller class="dialog-scroller">
          <div class="dialog-content">
            <div class="form-item">
              <text class="form-label">课程名称</text>
              <input v-if="keyboardFailed" class="form-input" 
                     :value="newCourse.name"
                     @input="newCourse.name = $event.value"
                     placeholder="请输入课程名称" />
              <div v-else class="form-input form-input-display" @click="openKeyboard('name', '请输入课程名称', 'ZhCNPreferred')">
                <text :class="newCourse.name ? 'display-value' : 'display-placeholder'">{{ newCourse.name || '请输入课程名称' }}</text>
              </div>
            </div>

            <div class="form-item" v-if="showLocation">
              <text class="form-label">地点</text>
              <input v-if="keyboardFailed" class="form-input" 
                     :value="newCourse.location"
                     @input="newCourse.location = $event.value"
                     placeholder="请输入上课地点" />
              <div v-else class="form-input form-input-display" @click="openKeyboard('location', '请输入上课地点', 'ZhCNPreferred')">
                <text :class="newCourse.location ? 'display-value' : 'display-placeholder'">{{ newCourse.location || '请输入上课地点' }}</text>
              </div>
            </div>
            
            <div class="form-item">
              <text class="form-label">星期</text>
              <scroller class="day-select-scroller" scroll-direction="horizontal">
                <div class="day-select">
                  <div v-for="(day, index) in weekDays" 
                       :key="index"
                       :class="['day-option', newCourse.dayIndex === index ? 'active-day-option' : '']"
                       @click="newCourse.dayIndex = index">
                    <text class="day-option-text">{{ day.name }}</text>
                  </div>
                </div>
              </scroller>
            </div>
            
            <div class="form-item">
              <text class="form-label">时间方式</text>
              <div class="mode-select">
                <div :class="['mode-option', newCourse.timeMode === 'slot' ? 'active-mode' : '']"
                     @click="newCourse.timeMode = 'slot'">
                  <text class="mode-option-text">选择节次</text>
                </div>
                <div :class="['mode-option', newCourse.timeMode === 'custom' ? 'active-mode' : '']"
                     @click="newCourse.timeMode = 'custom'">
                  <text class="mode-option-text">自定义时间</text>
                </div>
              </div>
            </div>
            
            <div class="form-item" v-if="newCourse.timeMode === 'slot'">
              <text class="form-label">节次</text>
              <scroller class="time-select-scroller">
                <div class="time-select">
                  <div v-for="time in timeSlots" 
                       :key="time.id"
                       :class="['time-option', newCourse.slot === time.id ? 'active-time' : '']"
                       @click="newCourse.slot = time.id">
                    <text class="time-option-text">{{ time.text }}</text>
                  </div>
                </div>
              </scroller>
            </div>
            
            <div class="form-item" v-if="newCourse.timeMode === 'custom'">
              <text class="form-label">自定义时间</text>
              <div class="custom-time-row">
                <div class="time-input time-input-display" @click="openTimePicker('customStart')">
                  <text :class="newCourse.customStart ? 'display-value' : 'display-placeholder'">{{ newCourse.customStart || '08:00' }}</text>
                </div>
                <text class="time-separator">-</text>
                <div class="time-input time-input-display" @click="openTimePicker('customEnd')">
                  <text :class="newCourse.customEnd ? 'display-value' : 'display-placeholder'">{{ newCourse.customEnd || '09:00' }}</text>
                </div>
              </div>
              <text class="error-text" v-if="timeError">{{ timeError }}</text>
            </div>
            
            <div class="form-item">
              <text class="form-label">颜色</text>
              <div class="color-select">
                <div v-for="color in colors" 
                     :key="color"
                     :style="{ backgroundColor: color }"
                     :class="['color-option', newCourse.color === color ? 'active-color' : '']"
                     @click="newCourse.color = color">
                </div>
              </div>
            </div>
          </div>
        </scroller>
        
        <div class="dialog-actions">
          <div class="cancel-btn" @click="closeAddDialog">
            <text class="btn-text-gray">取消</text>
          </div>
          <div class="confirm-btn" @click="saveEditCourse">
            <text class="btn-text-white">确定</text>
          </div>
        </div>
      </div>
    </div>
    
    <div class="dialog-mask" v-if="showDetailDialog" @click="showDetailDialog = false">
      <div class="dialog detail-dialog" @click.stop>
        <div class="detail-content">
          <text class="dialog-title">{{ selectedCourse.name }}</text>
          
          <div class="detail-item">
            <text class="detail-label">时间：</text>
            <text class="detail-value">{{ getCourseTimeText(selectedCourse) }}</text>
          </div>

          <div class="detail-item" v-if="showLocation">
            <text class="detail-label">地点：</text>
            <text class="detail-value" :class="selectedCourse.location ? '' : 'location-empty'">{{ selectedCourse.location || '未添加地点' }}</text>
          </div>
        </div>
        
        <div class="dialog-actions">
          <div class="delete-btn" @click="deleteCourse">
            <text class="btn-text-gray">删除</text>
          </div>
          <div class="cancel-btn" @click="editCourse">
            <text class="btn-text-gray">编辑</text>
          </div>
          <div class="confirm-btn" @click="showDetailDialog = false">
            <text class="btn-text-white">关闭</text>
          </div>
        </div>
      </div>
    </div>

    <div class="dialog-mask" v-if="showTimePicker" @click="cancelTimePicker">
      <div class="dialog time-picker-dialog" @click.stop>
        <text class="dialog-title">选择时间</text>

        <div class="picker-row">
          <scroller class="picker-column">
            <div class="picker-list">
              <div v-for="h in hours"
                   :key="h"
                   :class="['picker-item', pickerHour === h ? 'picker-active' : '']"
                   @click="pickerHour = h">
                <text :class="['picker-item-text', pickerHour === h ? 'picker-active-text' : '']">{{ h }}</text>
              </div>
            </div>
          </scroller>

          <text class="picker-colon">:</text>

          <scroller class="picker-column">
            <div class="picker-list">
              <div v-for="m in minutes"
                   :key="m"
                   :class="['picker-item', pickerMinute === m ? 'picker-active' : '']"
                   @click="pickerMinute = m">
                <text :class="['picker-item-text', pickerMinute === m ? 'picker-active-text' : '']">{{ m }}</text>
              </div>
            </div>
          </scroller>
        </div>

        <div class="dialog-actions">
          <div class="cancel-btn" @click="cancelTimePicker">
            <text class="btn-text-gray">取消</text>
          </div>
          <div class="confirm-btn" @click="confirmTimePicker">
            <text class="btn-text-white">确定</text>
          </div>
        </div>
      </div>
    </div>

    <div class="dialog-mask" v-if="showDeleteConfirm" @click="cancelDelete">
      <div class="dialog confirm-dialog" @click.stop>
        <text class="dialog-title">确认删除</text>
        <div class="confirm-content">
          <text class="confirm-text">确定要删除选中的 {{ selectedIds.length }} 门课程吗？</text>
        </div>
        <div class="dialog-actions">
          <div class="cancel-btn" @click="cancelDelete">
            <text class="btn-text-gray">取消</text>
          </div>
          <div class="delete-confirm-btn" @click="confirmBatchDelete">
            <text class="btn-text-white">删除</text>
          </div>
        </div>
      </div>
    </div>

    <div class="dialog-mask" v-if="showSwapTypeDialog" @click="cancelSwapType">
      <div class="dialog confirm-dialog" @click.stop>
        <text class="dialog-title confirm-dialog-title">选择换课类型</text>
        <div class="swap-type-list">
          <div class="swap-type-item" @click="selectSwapType('permanent')">
            <text class="swap-type-text">永久换课</text>
          </div>
          <text class="swap-type-hint">修改后永久保存</text>
          <div class="swap-type-item" @click="selectSwapType('temporary')">
            <text class="swap-type-text">临时换课</text>
          </div>
          <text class="swap-type-hint">仅本周有效，下周自动恢复</text>
        </div>
        <div class="dialog-actions confirm-dialog-actions">
          <div class="cancel-btn" @click="cancelSwapType">
            <text class="btn-text-gray">取消</text>
          </div>
        </div>
      </div>
    </div>

    <div class="toast-card" v-if="showToast">
      <text class="toast-text">{{ toastText }}</text>
    </div>
  </div>
</template>

<script>
import { getGlobalModule, isKeyboardAvailable } from '../../utils/keyboard';
import { loadAllCourses, saveCourse, deleteCourseById, saveSwap, loadActiveSwaps, cleanupExpiredSwaps } from '../../utils/coursedb.js';
import { getShowLocation, getShowDebug } from '../../utils/settings.js';

export default {
  data() {
    return {
      weekDays: [],
      timeSlots: [
        { id: 1, text: '第1节\n08:00-08:45' },
        { id: 2, text: '第2节\n08:55-09:40' },
        { id: 3, text: '第3节\n10:00-10:45' },
        { id: 4, text: '第4节\n10:55-11:40' },
        { id: 5, text: '第5节\n14:00-14:45' },
        { id: 6, text: '第6节\n14:55-15:40' },
        { id: 7, text: '第7节\n16:00-16:45' },
        { id: 8, text: '第8节\n16:55-17:40' },
        { id: 9, text: '第9节\n19:00-19:45' },
        { id: 10, text: '第10节\n19:55-20:40' }
      ],
      courses: [],
      currentDayIndex: 0,
      showAddDialog: false,
      showDetailDialog: false,
      selectedCourse: null,
      newCourse: this.createEmptyCourse(),
      timeError: '',
      keyboardFailed: false,
      inputTaskUuid: '',
      keyboardField: '',
      showLocation: false,
      showDebug: false,
      debugText: 'init',
      editMode: false,
      colors: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
        '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
        '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
        '#F1948A', '#AED6F1'
      ],
      hours: Array.from({ length: 24 }, function (_, i) { return (i < 10 ? '0' : '') + i; }),
      minutes: Array.from({ length: 12 }, function (_, i) { var m = i * 5; return (m < 10 ? '0' : '') + m; }),
      showTimePicker: false,
      pickerField: '',
      pickerHour: '08',
      pickerMinute: '00',
      selectedIds: [],
      showDeleteConfirm: false,
      swapMode: false,
      swapType: 'permanent',
      showSwapTypeDialog: false,
      originalCourses: [],
      activeSwaps: [],
      showToast: false,
      toastText: ''
    };
  },
  computed: {
    hasSelected() {
      return this.selectedIds.length > 0;
    },
    currentWeek() {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const day = now.getDate();
      return `${year}年${month}月${day}日`;
    },
    dayCourses() {
      return this.courses
        .filter(c => c.dayIndex === this.currentDayIndex)
        .sort((a, b) => {
          const aOrder = a.timeMode === 'slot' ? a.slot : 1000;
          const bOrder = b.timeMode === 'slot' ? b.slot : 1000;
          return aOrder - bOrder;
        });
    },
    currentCourseText() {
      const course = this.findCurrentCourse();
      if (!course) return '无';
      const remaining = this.getCourseEndMinutes(course) - this.currentMinutes();
      return `${course.name} 剩${this.formatMinutes(remaining)}`;
    },
    nextCourseText() {
      const course = this.findNextCourse();
      if (!course) return '无';
      const remaining = this.getCourseStartMinutes(course) - this.currentMinutes();
      const startText = this.getCourseStartText(course);
      return `${startText} ${course.name} 剩${this.formatMinutes(remaining)}`;
    }
  },
  mounted() {
    this.initWeekDays();
    this.loadCourses();
    this.loadShowLocation('mounted');
    this.initKeyboard();
    this.startShowLocationPoll();
    this.loadAndApplySwaps();
  },

  beforeDestroy() {
    this.stopShowLocationPoll();
    this.closeKeyboard();
  },

  methods: {
    createEmptyCourse() {
      return {
        name: '',
        dayIndex: this.currentDayIndex || 0,
        slot: 1,
        timeMode: 'slot',
        customStart: '',
        customEnd: '',
        color: '#FF6B6B',
        location: ''
      };
    },
    initWeekDays() {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      
      const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      
      this.weekDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        this.weekDays.push({
          name: dayNames[i],
          date: `${date.getMonth() + 1}/${date.getDate()}`
        });
      }
    },
    
    loadCourses() {
      const self = this;
      loadAllCourses().then(function (list) {
        const arr = Array.isArray(list) ? list : [];
        self.originalCourses = JSON.parse(JSON.stringify(arr));
        self.courses = arr;
      }).catch(function () {
        self.courses = [];
        self.originalCourses = [];
      });
    },
    
    selectDay(index) {
      this.currentDayIndex = index;
    },

    goAbout() {
      $falcon.navTo('about');
    },

    goSettings() {
      $falcon.navTo('settings');
    },

    loadShowLocation(source) {
      this.debugText = (source || 'poll') + ':loading';
      Promise.all([getShowLocation(), getShowDebug()]).then((results) => {
        this.showLocation = !!results[0];
        this.showDebug = !!results[1];
        this.debugText = (source || 'poll') + ':loc=' + JSON.stringify(results[0]) + ' dbg=' + JSON.stringify(results[1]);
      }).catch((e) => {
        this.showLocation = false;
        this.showDebug = false;
        this.debugText = (source || 'poll') + ':err:' + (e && e.message ? e.message : String(e));
      });
    },

    startShowLocationPoll() {
      this.stopShowLocationPoll();
      this._locationPoll = setInterval(() => {
        this.loadShowLocation();
      }, 1000);
    },

    stopShowLocationPoll() {
      if (this._locationPoll) {
        clearInterval(this._locationPoll);
        this._locationPoll = null;
      }
    },

    initKeyboard() {
      const gm = getGlobalModule();
      if (!gm) {
        console.log('keyboard init failed: gm not available');
        this.keyboardFailed = true;
        return;
      }
      if (!gm.textEditFinished || typeof gm.textEditFinished.on !== 'function') {
        console.log('keyboard init failed: textEditFinished.on not available, methods:', Object.keys(gm).join(','));
        this.keyboardFailed = true;
        return;
      }
      this.editFinishedHandler = (uuid, jsonData) => {
        if (uuid !== this.inputTaskUuid) return;
        console.log('keyboard finished, uuid:', uuid, 'data:', jsonData);
        try {
          const result = (typeof jsonData === 'string') ? JSON.parse(jsonData) : jsonData;
          if (result && result.editConfirmed && this.keyboardField) {
            this.editFinishedClicked(result.text);
          }
        } catch (e) {
          console.log('keyboard parse error:', e);
        }
      };
      gm.textEditFinished.on(this.editFinishedHandler);
      console.log('keyboard listener registered');
    },

    editFinishedClicked(text) {
      const value = (text || '').replace(/\n/g, '');
      if (this.keyboardField === 'name') {
        this.newCourse.name = value;
      } else if (this.keyboardField === 'location') {
        this.newCourse.location = value;
      } else if (this.keyboardField === 'customStart') {
        this.newCourse.customStart = value;
        this.validateCustomTime();
      } else if (this.keyboardField === 'customEnd') {
        this.newCourse.customEnd = value;
        this.validateCustomTime();
      }
      this.closeKeyboard();
    },

    openKeyboard(field, placeholder, inputType) {
      if (this.keyboardFailed) {
        console.log('openKeyboard skipped: keyboardFailed=true');
        return;
      }
      if (!isKeyboardAvailable()) {
        console.log('openKeyboard: keyboard not available, fallback to input');
        this.keyboardFailed = true;
        return;
      }
      const gm = getGlobalModule();
      const value = this.newCourse[field] || '';
      this.keyboardField = field;
      const payload = JSON.stringify({
        text: value,
        placeholder: placeholder,
        placeholderColor: '#878A99',
        autofocus: true,
        maxlength: field.indexOf('custom') >= 0 ? 5 : 100,
        showCursor: true,
        cursorColor: '#2196F3',
        cursorSize: 3,
        confirmButtonDisabledOnTextEmpty: false,
        inputType: inputType || 'ZhCNPreferred',
        multiLinesEditVisible: false,
        capsLockSwitchOn: false,
        enterButtonText: '确认'
      });
      console.log('startTextEdit payload:', payload);
      try {
        this.inputTaskUuid = gm.startTextEdit(payload);
        console.log('startTextEdit returned:', this.inputTaskUuid);
      } catch (e) {
        console.log('startTextEdit error:', e.message || e);
        this.keyboardFailed = true;
        return;
      }
      if (this.inputTaskUuid === undefined || this.inputTaskUuid === null || this.inputTaskUuid === '') {
        console.log('startTextEdit returned empty uuid, fallback');
        this.keyboardFailed = true;
      }
    },

    closeKeyboard() {
      const gm = getGlobalModule();
      if (gm && gm.closeTextEdit && this.inputTaskUuid) {
        try {
          gm.closeTextEdit(this.inputTaskUuid);
        } catch (e) {
          console.log('closeTextEdit error:', e.message || e);
        }
      }
      this.inputTaskUuid = '';
      this.keyboardField = '';
    },

    openTimePicker(field) {
      const value = this.newCourse[field] || (field === 'customStart' ? '08:00' : '09:00');
      const parts = value.split(':');
      this.pickerField = field;
      this.pickerHour = parts[0] || '08';
      this.pickerMinute = parts[1] || '00';
      this.showTimePicker = true;
    },

    confirmTimePicker() {
      if (this.pickerField) {
        this.newCourse[this.pickerField] = this.pickerHour + ':' + this.pickerMinute;
        this.validateCustomTime();
      }
      this.showTimePicker = false;
      this.pickerField = '';
    },

    cancelTimePicker() {
      this.showTimePicker = false;
      this.pickerField = '';
    },

    getCoursesForSlot(slotId) {
      return this.courses.filter(c => {
        if (c.timeMode === 'custom') return false;
        return c.slot === slotId && c.dayIndex === this.currentDayIndex;
      });
    },
    
    getSlotText(slotId) {
      const slot = this.timeSlots.find(s => s.id === slotId);
      return slot ? slot.text : '';
    },

    getCourseTimeText(course) {
      if (!course) return '';
      if (course.timeMode === 'custom') {
        return `${course.customStart || '?'} - ${course.customEnd || '?'}`;
      }
      return this.getSlotText(course.slot);
    },

    getCourseCardTime(course) {
      if (!course) return '';
      if (course.timeMode === 'custom') {
        return `${course.customStart || '?'} - ${course.customEnd || '?'}`;
      }
      const slot = this.timeSlots.find(s => s.id === course.slot);
      if (!slot) return '';
      const lines = slot.text.split('\n');
      return lines.join(' ');
    },

    currentMinutes() {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    },

    timeToMinutes(timeStr) {
      if (!timeStr) return 0;
      const parts = timeStr.split(':');
      if (parts.length !== 2) return 0;
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (isNaN(h) || isNaN(m)) return 0;
      return h * 60 + m;
    },

    getSlotTimeRange(slotId) {
      const slot = this.timeSlots.find(s => s.id === slotId);
      if (!slot) return null;
      const match = slot.text.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
      if (!match) return null;
      return { start: match[1], end: match[2] };
    },

    getCourseStartMinutes(course) {
      if (course.timeMode === 'slot') {
        const range = this.getSlotTimeRange(course.slot);
        return range ? this.timeToMinutes(range.start) : 0;
      }
      return this.timeToMinutes(course.customStart);
    },

    getCourseEndMinutes(course) {
      if (course.timeMode === 'slot') {
        const range = this.getSlotTimeRange(course.slot);
        return range ? this.timeToMinutes(range.end) : 0;
      }
      return this.timeToMinutes(course.customEnd);
    },

    getCourseStartText(course) {
      if (course.timeMode === 'slot') {
        const range = this.getSlotTimeRange(course.slot);
        return range ? range.start : '';
      }
      return course.customStart || '';
    },

    findCurrentCourse() {
      const now = this.currentMinutes();
      return this.dayCourses.find(c => {
        const start = this.getCourseStartMinutes(c);
        const end = this.getCourseEndMinutes(c);
        return now >= start && now < end;
      });
    },

    findNextCourse() {
      const now = this.currentMinutes();
      const future = this.dayCourses
        .filter(c => this.getCourseStartMinutes(c) > now)
        .sort((a, b) => this.getCourseStartMinutes(a) - this.getCourseStartMinutes(b));
      return future[0] || null;
    },

    formatMinutes(minutes) {
      if (minutes <= 0) return '0分';
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      if (h > 0 && m > 0) return `${h}时${m}分`;
      if (h > 0) return `${h}时`;
      return `${m}分`;
    },

    isSelected(id) {
      return this.selectedIds.indexOf(id) >= 0;
    },
    onCircleClick(id, event) {
      if (event && event.stopPropagation) {
        event.stopPropagation();
      }
      this.toggleSelect(id);
    },
    toggleSelect(id) {
      const idx = this.selectedIds.indexOf(id);
      if (idx >= 0) {
        this.selectedIds.splice(idx, 1);
      } else {
        if (this.swapMode && this.selectedIds.length >= 2) {
          this.showToastHint('换课最多选择2个课程');
          return;
        }
        this.selectedIds.push(id);
      }
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
    handleCardClick(course) {
      if (this.swapMode || this.hasSelected) {
        this.toggleSelect(course.id);
      } else {
        this.showCourseDetail(course);
      }
    },
    handleFabClick() {
      if (this.swapMode) {
        if (this.selectedIds.length === 2) {
          if (this.swapType === 'permanent') {
            this.doPermanentSwap();
          } else {
            this.doTemporarySwap();
          }
        } else {
          this.cancelSwapMode();
        }
      } else if (this.hasSelected) {
        this.showDeleteConfirm = true;
      } else {
        this.openAddDialog();
      }
    },
    cancelDelete() {
      this.showDeleteConfirm = false;
    },
    confirmBatchDelete() {
      const idsToDelete = this.selectedIds.slice();
      for (let i = 0; i < idsToDelete.length; i++) {
        const id = idsToDelete[i];
        this.courses = this.courses.filter(c => c.id !== id);
        deleteCourseById(id);
      }
      this.selectedIds = [];
      this.showDeleteConfirm = false;
    },
    getWeekNumber() {
      const now = new Date();
      const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },
    openSwapTypeDialog() {
      if (this.selectedIds.length === 1) {
        this.showToastHint('请选择2个课程进行换课');
        return;
      }
      if (this.selectedIds.length > 2) {
        this.showToastHint('请选择2个课程进行换课');
        return;
      }
      this.showSwapTypeDialog = true;
    },
    cancelSwapType() {
      this.showSwapTypeDialog = false;
    },
    selectSwapType(type) {
      this.swapType = type;
      this.showSwapTypeDialog = false;
      if (this.selectedIds.length === 2) {
        if (type === 'permanent') {
          this.doPermanentSwap();
        } else {
          this.doTemporarySwap();
        }
      } else {
        this.swapMode = true;
        this.selectedIds = [];
      }
    },
    cancelSwapMode() {
      this.swapMode = false;
      this.selectedIds = [];
    },
    async loadAndApplySwaps() {
      const weekNum = this.getWeekNumber();
      try {
        await cleanupExpiredSwaps(weekNum);
        const swaps = await loadActiveSwaps(weekNum);
        this.activeSwaps = swaps || [];
        this.applyTemporarySwaps();
      } catch (e) {
        console.error('load swaps error', e);
      }
    },
    applyTemporarySwaps() {
      if (this.activeSwaps.length === 0 || this.originalCourses.length === 0) return;
      let swapped = JSON.parse(JSON.stringify(this.originalCourses));
      const self = this;
      for (let i = 0; i < this.activeSwaps.length; i++) {
        const swap = this.activeSwaps[i];
        const idx1 = swapped.findIndex(function (c) { return Number(c.id) === Number(swap.course1_id); });
        const idx2 = swapped.findIndex(function (c) { return Number(c.id) === Number(swap.course2_id); });
        if (idx1 >= 0 && idx2 >= 0) {
          self.swapCourseContent(swapped[idx1], swapped[idx2]);
        }
      }
      this.courses = swapped;
    },
    swapCourseContent(c1, c2) {
      const tName = c1.name;
      const tColor = c1.color;
      const tLocation = c1.location;
      c1.name = c2.name;
      c1.color = c2.color;
      c1.location = c2.location;
      c2.name = tName;
      c2.color = tColor;
      c2.location = tLocation;
    },
    async doPermanentSwap() {
      if (this.selectedIds.length !== 2) return;
      const id1 = Number(this.selectedIds[0]);
      const id2 = Number(this.selectedIds[1]);
      try {
        const all = await loadAllCourses();
        const c1 = all.find(function (c) { return Number(c.id) === id1; });
        const c2 = all.find(function (c) { return Number(c.id) === id2; });
        if (!c1 || !c2) return;
        const c1BeforeTime = { dayIndex: c1.dayIndex, slot: c1.slot, timeMode: c1.timeMode, customStart: c1.customStart, customEnd: c1.customEnd };
        const c2BeforeTime = { dayIndex: c2.dayIndex, slot: c2.slot, timeMode: c2.timeMode, customStart: c2.customStart, customEnd: c2.customEnd };
        this.swapCourseContent(c1, c2);
        c1.dayIndex = c1BeforeTime.dayIndex;
        c1.slot = c1BeforeTime.slot;
        c1.timeMode = c1BeforeTime.timeMode;
        c1.customStart = c1BeforeTime.customStart;
        c1.customEnd = c1BeforeTime.customEnd;
        c2.dayIndex = c2BeforeTime.dayIndex;
        c2.slot = c2BeforeTime.slot;
        c2.timeMode = c2BeforeTime.timeMode;
        c2.customStart = c2BeforeTime.customStart;
        c2.customEnd = c2BeforeTime.customEnd;
        await saveCourse(c1);
        await saveCourse(c2);
        this.originalCourses = JSON.parse(JSON.stringify(all));
        this.courses = JSON.parse(JSON.stringify(all));
        this.applyTemporarySwaps();
      } catch (e) {
        console.error('permanent swap error', e);
      }
      this.selectedIds = [];
      this.swapMode = false;
    },
    async doTemporarySwap() {
      if (this.selectedIds.length !== 2) return;
      const id1 = Number(this.selectedIds[0]);
      const id2 = Number(this.selectedIds[1]);
      const weekNum = this.getWeekNumber();
      const now = new Date();
      const createdAt = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
      const swapRecord = {
        course1_id: id1,
        course2_id: id2,
        type: 'temporary',
        week_num: weekNum,
        created_at: createdAt
      };
      try {
        await saveSwap(swapRecord);
        this.activeSwaps.push(swapRecord);
        this.applyTemporarySwaps();
      } catch (e) {
        console.error('save swap error', e);
      }
      this.selectedIds = [];
      this.swapMode = false;
    },
    openAddDialog() {
      this.newCourse = this.createEmptyCourse();
      this.editMode = false;
      this.timeError = '';
      this.showAddDialog = true;
    },

    closeAddDialog() {
      this.showAddDialog = false;
      this.editMode = false;
      this.newCourse = this.createEmptyCourse();
      this.timeError = '';
    },

    editCourse() {
      if (!this.selectedCourse) return;
      const c = this.selectedCourse;
      this.newCourse = {
        id: c.id,
        name: c.name || '',
        dayIndex: c.dayIndex,
        slot: c.slot || 1,
        timeMode: c.timeMode || 'slot',
        customStart: c.customStart || '',
        customEnd: c.customEnd || '',
        color: c.color || '#FF6B6B',
        location: c.location || ''
      };
      this.editMode = true;
      this.timeError = '';
      this.showDetailDialog = false;
      this.showAddDialog = true;
    },
    
    showCourseDetail(course) {
      this.selectedCourse = course;
      this.showDetailDialog = true;
    },

    isValidTime(timeStr) {
      if (!timeStr) return false;
      const parts = timeStr.split(':');
      if (parts.length !== 2) return false;
      const hour = parseInt(parts[0], 10);
      const minute = parseInt(parts[1], 10);
      if (isNaN(hour) || isNaN(minute)) return false;
      if (!Number.isInteger(hour) || !Number.isInteger(minute)) return false;
      return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
    },

    normalizeTime(timeStr) {
      if (!this.isValidTime(timeStr)) return timeStr;
      const parts = timeStr.split(':');
      const hour = parseInt(parts[0], 10).toString().padStart(2, '0');
      const minute = parseInt(parts[1], 10).toString().padStart(2, '0');
      return `${hour}:${minute}`;
    },

    validateCustomTime() {
      if (this.newCourse.timeMode !== 'custom') return true;
      const start = this.newCourse.customStart;
      const end = this.newCourse.customEnd;
      if (!this.isValidTime(start)) {
        this.timeError = '开始时间格式错误，示例：08:00';
        return false;
      }
      if (!this.isValidTime(end)) {
        this.timeError = '结束时间格式错误，示例：09:00';
        return false;
      }
      const startMinutes = this.timeToMinutes(start);
      const endMinutes = this.timeToMinutes(end);
      if (endMinutes <= startMinutes) {
        this.timeError = '结束时间必须晚于开始时间';
        return false;
      }
      this.timeError = '';
      return true;
    },

    onCustomTimeInput(field, value) {
      this.newCourse[field] = value;
      if (this.newCourse.customStart || this.newCourse.customEnd) {
        this.validateCustomTime();
      } else {
        this.timeError = '';
      }
    },

    normalizeCustomTimes() {
      if (this.newCourse.timeMode === 'custom') {
        this.newCourse.customStart = this.normalizeTime(this.newCourse.customStart);
        this.newCourse.customEnd = this.normalizeTime(this.newCourse.customEnd);
      }
    },
    
    addCourse() {
      console.log('addCourse called', JSON.stringify(this.newCourse));
      if (!this.newCourse.name) {
        console.log('addCourse blocked: empty name');
        return;
      }

      if (this.newCourse.timeMode === 'custom' && !this.validateCustomTime()) {
        console.log('addCourse blocked: invalid custom time');
        return;
      }
      
      this.normalizeCustomTimes();
      
      const newId = Math.max(...this.courses.map(c => c.id), 0) + 1;
      const courseData = {
        id: newId,
        name: this.newCourse.name,
        dayIndex: this.newCourse.dayIndex,
        color: this.newCourse.color,
        timeMode: this.newCourse.timeMode,
        location: this.showLocation ? (this.newCourse.location || '') : ''
      };

      if (this.newCourse.timeMode === 'slot') {
        courseData.slot = this.newCourse.slot;
      } else {
        courseData.customStart = this.newCourse.customStart;
        courseData.customEnd = this.newCourse.customEnd;
      }

      this.courses.push(courseData);
      saveCourse(courseData);
      
      this.newCourse = this.createEmptyCourse();
      this.timeError = '';
      this.showAddDialog = false;
    },

    saveEditCourse() {
      if (this.editMode) {
        if (!this.newCourse.name) return;
        if (this.newCourse.timeMode === 'custom' && !this.validateCustomTime()) return;
        this.normalizeCustomTimes();
        const courseData = {
          id: this.newCourse.id,
          name: this.newCourse.name,
          dayIndex: this.newCourse.dayIndex,
          color: this.newCourse.color,
          timeMode: this.newCourse.timeMode,
          location: this.showLocation ? (this.newCourse.location || '') : ''
        };
        if (this.newCourse.timeMode === 'slot') {
          courseData.slot = this.newCourse.slot;
        } else {
          courseData.customStart = this.newCourse.customStart;
          courseData.customEnd = this.newCourse.customEnd;
        }
        const idx = this.courses.findIndex(function (c) { return c.id === courseData.id; });
        if (idx >= 0) {
          this.courses.splice(idx, 1, courseData);
        } else {
          this.courses.push(courseData);
        }
        saveCourse(courseData);
        this.closeAddDialog();
      } else {
        this.addCourse();
      }
    },
    
    deleteCourse() {
      if (!this.selectedCourse) return;
      const delId = this.selectedCourse.id;
      this.courses = this.courses.filter(c => c.id !== delId);
      deleteCourseById(delId);
      this.showDetailDialog = false;
      this.selectedCourse = null;
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
  position: relative;
}

.header {
  background-color: #2196F3;
  padding-top: 6px;
  padding-bottom: 6px;
  padding-left: 12px;
  padding-right: 12px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.header-main {
  flex: 1;
}

.header-status {
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: 10px;
}

.status-box {
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 8px;
  padding-right: 8px;
  margin-right: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
}

.status-label {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 2px;
}

.status-value {
  font-size: 11px;
  color: #FFFFFF;
  text-align: center;
  lines: 2;
}

.header-btns {
  display: flex;
  flex-direction: row;
  margin-left: 4px;
}

.settings-btn, .about-btn {
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 8px;
  padding-right: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.settings-btn {
  margin-right: 6px;
}

.settings-text, .about-text {
  font-size: 12px;
  color: #FFFFFF;
}

.title {
  font-size: 20px;
  color: #FFFFFF;
  font-weight: bold;
  margin-bottom: 2px;
}

.week-info {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
}

.week-nav {
  display: flex;
  flex-direction: row;
  background-color: #FFFFFF;
  padding-top: 4px;
  padding-bottom: 4px;
  border-bottom-width: 1px;
  border-bottom-color: #E0E0E0;
}

.debug-text {
  font-size: 10px;
  color: #F44336;
  padding-top: 2px;
  padding-bottom: 2px;
  padding-left: 8px;
  padding-right: 8px;
}

.week-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 4px;
  padding-bottom: 4px;
}

.active-day {
  background-color: #E3F2FD;
  border-radius: 4px;
}

.day-name {
  font-size: 14px;
  color: #333333;
  margin-bottom: 2px;
}

.day-date {
  font-size: 10px;
  color: #666666;
}

.schedule-scroller {
  flex: 1;
}

.course-list {
  padding: 8px;
}

.empty-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 40px;
  padding-bottom: 40px;
}

.empty-text {
  font-size: 18px;
  color: #999999;
  margin-bottom: 4px;
}

.empty-subtext {
  font-size: 12px;
  color: #BBBBBB;
}

.course-card {
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 6px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  position: relative;
}

.course-time {
  position: absolute;
  left: 62px;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.95);
  line-height: 18px;
}

.course-middle {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.course-name {
  font-size: 16px;
  color: #FFFFFF;
  font-weight: bold;
}

.course-location {
  position: absolute;
  right: 12px;
  font-size: 11px;
  color: #FFFFFF;
  text-align: right;
  max-width: 80px;
  lines: 2;
}

.location-empty {
  opacity: 0.7;
}

.select-hit-area {
  position: absolute;
  left: 0px;
  top: 0px;
  bottom: 0px;
  width: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.select-circle {
  width: 24px;
  height: 24px;
  border-radius: 12px;
  border-width: 2px;
  border-style: solid;
  border-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
}

.select-circle-selected {
  background-color: #FFFFFF;
  border-color: #FFFFFF;
}

.check-icon {
  font-size: 14px;
  color: #333333;
  font-weight: bold;
  line-height: 14px;
}

.fab {
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #2196F3;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 6px #999999;
}

.fab-delete {
  background-color: #F44336;
}

.fab-swap {
  background-color: #FF9800;
}

.swap-fab {
  position: absolute;
  right: 72px;
  bottom: 16px;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  background-color: #FF9800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 6px #999999;
}

.swap-fab-text {
  font-size: 22px;
  color: #FFFFFF;
  font-weight: bold;
}

.fab-text {
  font-size: 28px;
  color: #FFFFFF;
  font-weight: bold;
}

.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  width: auto;
  min-width: 300px;
  max-width: 920px;
  height: 240px;
  max-height: 250px;
  background-color: #FFFFFF;
  border-radius: 8px;
  padding-top: 8px;
  padding-left: 12px;
  padding-right: 12px;
  padding-bottom: 8px;
  display: flex;
  flex-direction: column;
}

.detail-dialog {
  height: auto;
  min-height: 140px;
  max-height: 250px;
  justify-content: flex-start;
}

.detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.dialog-title {
  font-size: 18px;
  color: #333333;
  font-weight: bold;
  margin-bottom: 6px;
  text-align: center;
}

.dialog-scroller {
  flex: 1;
  height: auto;
  max-height: 180px;
}

.dialog-content {
  padding-bottom: 4px;
}

.form-item {
  margin-bottom: 6px;
}

.form-label {
  font-size: 12px;
  color: #333333;
  margin-bottom: 2px;
}

.form-input {
  border-width: 1px;
  border-color: #DDDDDD;
  border-radius: 4px;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 8px;
  padding-right: 8px;
  font-size: 13px;
  color: #333333;
}

.form-input-display {
  display: flex;
  align-items: center;
  min-height: 30px;
}

.display-value {
  font-size: 13px;
  color: #333333;
}

.display-placeholder {
  font-size: 13px;
  color: #AAAAAA;
}

.mode-select {
  display: flex;
  flex-direction: row;
}

.mode-option {
  flex: 1;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 8px;
  padding-right: 8px;
  border-width: 1px;
  border-color: #DDDDDD;
  background-color: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mode-option:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  border-right-width: 0;
}

.mode-option:last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}

.mode-option-text {
  font-size: 12px;
}

.active-mode {
  background-color: #E3F2FD;
  border-color: #2196F3;
}

.day-select-scroller {
  height: 32px;
  display: flex;
  flex-direction: row;
}

.day-select {
  display: flex;
  flex-direction: row;
}

.day-option {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background-color: #F5F5F5;
  margin-right: 6px;
  flex-shrink: 0;
}

.day-option-text {
  font-size: 10px;
}

.active-day-option {
  background-color: #E3F2FD;
  border-width: 1px;
  border-color: #2196F3;
}

.time-select-scroller {
  height: 90px;
}

.time-select {
  display: flex;
  flex-wrap: wrap;
}

.time-option {
  padding-top: 3px;
  padding-bottom: 3px;
  padding-left: 6px;
  padding-right: 6px;
  margin-right: 4px;
  margin-bottom: 4px;
  border-width: 1px;
  border-color: #DDDDDD;
  border-radius: 4px;
  background-color: #F5F5F5;
}

.time-option-text {
  font-size: 10px;
}

.active-time {
  background-color: #E3F2FD;
  border-color: #2196F3;
}

.custom-time-row {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.time-input {
  width: 90px;
  border-width: 1px;
  border-color: #DDDDDD;
  border-radius: 4px;
  padding-top: 8px;
  padding-bottom: 8px;
  padding-left: 6px;
  padding-right: 6px;
  font-size: 13px;
  color: #333333;
  text-align: center;
}

.time-input-display {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 30px;
}

.time-separator {
  font-size: 12px;
  color: #333333;
  margin-left: 6px;
  margin-right: 6px;
}

.error-text {
  font-size: 10px;
  color: #F44336;
  margin-top: 2px;
}

.color-select {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.color-option {
  width: 26px;
  height: 26px;
  border-radius: 13px;
  border-width: 2px;
  border-color: transparent;
  margin-right: 6px;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.active-color {
  border-color: #333333;
}

.dialog-actions {
  display: flex;
  flex-direction: row;
  margin-top: 6px;
}

.cancel-btn, .delete-btn {
  flex: 1;
  min-height: 34px;
  padding-top: 6px;
  padding-bottom: 6px;
  background-color: #F5F5F5;
  border-radius: 4px;
  margin-right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-text-gray {
  font-size: 12px;
  color: #666666;
}

.confirm-btn {
  flex: 1;
  min-height: 34px;
  padding-top: 6px;
  padding-bottom: 6px;
  background-color: #2196F3;
  border-radius: 4px;
  margin-left: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-text-white {
  font-size: 12px;
  color: #FFFFFF;
}

.detail-item {
  display: flex;
  flex-direction: row;
  margin-bottom: 4px;
}

.detail-label {
  font-size: 12px;
  color: #666666;
  width: 45px;
}

.detail-value {
  font-size: 12px;
  color: #333333;
  flex: 1;
  lines: 0;
}

.time-picker-dialog {
  padding: 8px;
  width: 220px;
  height: auto;
  min-height: 160px;
  max-height: 220px;
}

.picker-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  height: 110px;
  margin-top: 4px;
  margin-bottom: 4px;
}

.picker-column {
  width: 70px;
  height: 110px;
  border-width: 1px;
  border-color: #E0E0E0;
  border-radius: 8px;
  background-color: #FAFAFA;
}

.picker-colon {
  font-size: 16px;
  color: #333333;
  margin-left: 6px;
  margin-right: 6px;
}

.picker-list {
  padding-top: 2px;
  padding-bottom: 2px;
}

.picker-item {
  padding-top: 3px;
  padding-bottom: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-item-text {
  font-size: 14px;
  color: #333333;
}

.picker-active {
  background-color: #2196F3;
}

.picker-active-text {
  color: #FFFFFF;
}

.confirm-dialog {
  height: auto;
  min-height: 200px;
  max-height: 264px;
  justify-content: flex-start;
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 8px;
  padding-right: 8px;
  min-width: 340px;
}

.confirm-dialog-title {
  margin-bottom: 4px;
  font-size: 16px;
}

.confirm-dialog-actions {
  margin-top: 4px;
}

.confirm-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 8px;
  padding-bottom: 8px;
}

.confirm-text {
  font-size: 13px;
  color: #333333;
  text-align: center;
}

.delete-confirm-btn {
  padding-top: 6px;
  padding-bottom: 6px;
  padding-left: 12px;
  padding-right: 12px;
  background-color: #F44336;
  border-radius: 4px;
  margin-left: 8px;
}

.swap-type-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-top: 2px;
  padding-bottom: 2px;
  min-height: 0;
}

.swap-type-item {
  padding-top: 12px;
  padding-bottom: 12px;
  padding-left: 10px;
  padding-right: 10px;
  background-color: #F5F5F5;
  border-radius: 6px;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.swap-type-text {
  font-size: 13px;
  color: #333333;
}

.swap-type-hint {
  font-size: 10px;
  color: #999999;
  margin-top: -2px;
  margin-bottom: 4px;
  margin-left: 10px;
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
