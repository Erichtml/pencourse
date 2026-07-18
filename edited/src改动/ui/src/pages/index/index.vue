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
        <div class="about-btn" @click="goAbout">
          <text class="about-text">关于</text>
        </div>
        <div class="settings-btn" @click="goSettings">
          <text class="about-text">设置</text>
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
             @click="showCourseDetail(course)">
          <text class="course-time">{{ getCourseCardTime(course) }}</text>
          <div class="course-middle">
            <text class="course-name" :class="{'course-name-only': !showLocation}">{{ course.name }}</text>
            <text v-if="showLocation" class="course-location">{{ course.location || '地点未填写' }}</text>
          </div>
        </div>
      </div>
    </scroller>
    
    <div class="fab" @click="openAddDialog">
      <text class="fab-text">+</text>
    </div>
    
    <div class="dialog-mask" v-if="showAddDialog" @click="showAddDialog = false">
      <div class="dialog" @click.stop>
        <text class="dialog-title">添加课程</text>
        
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
              <text class="form-label">上课地点</text>
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
                <input v-if="keyboardFailed" class="time-input" 
                       :value="newCourse.customStart"
                       @input="onCustomTimeInput('customStart', $event.value)"
                       placeholder="08:00" />
                <div v-else class="time-input time-input-display" @click="openKeyboard('customStart', '08:00', 'Number')">
                  <text :class="newCourse.customStart ? 'display-value' : 'display-placeholder'">{{ newCourse.customStart || '08:00' }}</text>
                </div>
                <text class="time-separator">-</text>
                <input v-if="keyboardFailed" class="time-input" 
                       :value="newCourse.customEnd"
                       @input="onCustomTimeInput('customEnd', $event.value)"
                       placeholder="09:00" />
                <div v-else class="time-input time-input-display" @click="openKeyboard('customEnd', '09:00', 'Number')">
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
          <div class="cancel-btn" @click="showAddDialog = false">
            <text class="btn-text-gray">取消</text>
          </div>
          <div class="confirm-btn" @click="addCourse">
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
            <text class="detail-value">{{ selectedCourse.location }}</text>
          </div>
        </div>
        
        <div class="dialog-actions">
          <div class="delete-btn" @click="deleteCourse">
            <text class="btn-text-gray">删除</text>
          </div>
          <div class="confirm-btn" @click="showDetailDialog = false">
            <text class="btn-text-white">关闭</text>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getGlobalModule, isKeyboardAvailable } from '../../utils/keyboard';
import { getShowLocation } from '../../utils/settings.js';
import { loadAllCourses, saveCourse, deleteCourseById } from '../../utils/coursedb.js';

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
      colors: [
        '#4CAF50', '#2196F3', '#FF9800', '#E91E63', 
        '#9C27B0', '#00BCD4', '#8BC34A', '#FF5722',
        '#795548', '#607D8B', '#3F51B5', '#009688',
        '#CDDC39', '#FFC107'
      ],
      showLocation: true
    };
  },
  computed: {
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
    this.initKeyboard();
    this.loadShowLocation();
  },

  onShow() {
    this.loadShowLocation();
  },

  beforeDestroy() {
    this.closeKeyboard();
  },

  methods: {
    createEmptyCourse() {
      return {
        name: '',
        location: '',
        dayIndex: this.currentDayIndex || 0,
        slot: 1,
        timeMode: 'slot',
        customStart: '',
        customEnd: '',
        color: '#4CAF50'
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
      // 从 native sqlite 读回持久化的课程;失败兜底空数组不崩
      const self = this;
      loadAllCourses().then(function (list) {
        self.courses = Array.isArray(list) ? list : [];
      }).catch(function () {
        self.courses = [];
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

    async loadShowLocation() {
      this.showLocation = await getShowLocation();
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

    openAddDialog() {
      this.newCourse = this.createEmptyCourse();
      this.timeError = '';
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

    timeToMinutes(timeStr) {
      const parts = timeStr.split(':');
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
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
        location: this.newCourse.location,
        dayIndex: this.newCourse.dayIndex,
        color: this.newCourse.color,
        timeMode: this.newCourse.timeMode
      };

      if (this.newCourse.timeMode === 'slot') {
        courseData.slot = this.newCourse.slot;
      } else {
        courseData.customStart = this.newCourse.customStart;
        courseData.customEnd = this.newCourse.customEnd;
      }

      this.courses.push(courseData);
      saveCourse(courseData);   // 落库(异步 best-effort)

      this.newCourse = this.createEmptyCourse();
      this.timeError = '';
      this.showAddDialog = false;
    },

    deleteCourse() {
      if (!this.selectedCourse) return;
      const delId = this.selectedCourse.id;
      this.courses = this.courses.filter(c => c.id !== delId);
      deleteCourseById(delId);   // 从库删除
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

.about-btn, .settings-btn {
  padding-top: 4px;
  padding-bottom: 4px;
  padding-left: 8px;
  padding-right: 8px;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  margin-right: 4px;
}

.about-text {
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
  left: 12px;
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
  margin-right: 10px;
}

.course-name-only {
  margin-right: 0;
}

.course-location {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.9);
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
</style>
