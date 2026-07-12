/**
 * محرك الخط الزمني الافتراضي في الواجهة الأمامية (TimelineEngine).
 * مسؤول عن إدارة حالات القطع، الانتقالات، تتبع التراجع والإعادة (Undo/Redo)،
 * وعمليات الحذف المتسلسل (Ripple editing) والحفاظ على سلامة التوقيتات.
 */
export class TimelineEngine {
  constructor(segments = []) {
    this.segments = [];
    this.history = [];
    this.historyPointer = -1;
    
    if (segments.length > 0) {
      this.loadTimeline(segments);
    }
  }

  /**
   * تحميل خط زمني جديد وتهيئته
   * @param {Array} segments - مصفوفة الأجزاء الزمنية
   */
  loadTimeline(segments) {
    this.segments = JSON.parse(JSON.stringify(segments));
    this.history = [];
    this.historyPointer = -1;
    this.commit();
  }

  getSegments() {
    return this.segments;
  }

  /**
   * تسجيل الحالة الحالية في سجل التراجع والإعادة (History Commit)
   */
  commit() {
    // حذف الحالات المستقبلية إذا كنا قد قمنا بتراجع ثم تعديل جديد
    if (this.historyPointer < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyPointer + 1);
    }

    this.history.push(JSON.parse(JSON.stringify(this.segments)));
    this.historyPointer++;
    
    // الحد الأقصى لسجل التراجع (50 حالة)
    if (this.history.length > 50) {
      this.history.shift();
      this.historyPointer--;
    }
  }

  /**
   * التراجع عن آخر إجراء (Undo)
   */
  undo() {
    if (this.historyPointer > 0) {
      this.historyPointer--;
      this.segments = JSON.parse(JSON.stringify(this.history[this.historyPointer]));
      return true;
    }
    return false;
  }

  /**
   * إعادة تطبيق إجراء تم التراجع عنه (Redo)
   */
  redo() {
    if (this.historyPointer < this.history.length - 1) {
      this.historyPointer++;
      this.segments = JSON.parse(JSON.stringify(this.history[this.historyPointer]));
      return true;
    }
    return false;
  }

  /**
   * تقسيم مقطع عند نقطة زمنية محددة (Split Segment)
   * @param {number} time - نقطة التقسيم بالثواني
   */
  split(time) {
    const index = this.segments.findIndex(s => time > s.start && time < s.end);
    if (index === -1) return false;

    const seg = this.segments[index];
    const seg1 = {
      ...seg,
      id: Math.random().toString(36).substr(2, 9),
      end: time
    };
    const seg2 = {
      ...seg,
      id: Math.random().toString(36).substr(2, 9),
      start: time
    };

    this.segments.splice(index, 1, seg1, seg2);
    this.commit();
    return true;
  }

  /**
   * تغيير حالة مقطع بين البقاء والحذف (Toggle Segment)
   * @param {string} id - الرقم التعريفي للمقطع
   */
  toggleSegment(id) {
    const seg = this.segments.find(s => s.id === id);
    if (seg) {
      seg.type = (seg.type === 'keep') ? 'remove' : 'keep';
      // إزالة علامة المراجعة بمجرد تفاعل المستخدم
      if (seg.reviewRequired) {
        delete seg.reviewRequired;
      }
      this.commit();
      return true;
    }
    return false;
  }

  /**
   * تعيين حالة المقطع إلى حذف (Cut Segment)
   */
  cutSegment(id) {
    const seg = this.segments.find(s => s.id === id);
    if (seg && seg.type !== 'remove') {
      seg.type = 'remove';
      this.commit();
      return true;
    }
    return false;
  }

  /**
   * تعيين حالة المقطع إلى بقاء (Keep Segment)
   */
  keepSegment(id) {
    const seg = this.segments.find(s => s.id === id);
    if (seg && seg.type !== 'keep') {
      seg.type = 'keep';
      this.commit();
      return true;
    }
    return false;
  }

  /**
   * الحذف المتسلسل (Ripple Delete)
   * يقوم بحذف الجزء وإزاحة كافة التوقيتات اللاحقة بمقدار مدة الجزء المحذوف.
   * @param {string} id - الرقم التعريفي للجزء المحذوف
   */
  rippleDelete(id) {
    const index = this.segments.findIndex(s => s.id === id);
    if (index === -1) return false;

    const targetSeg = this.segments[index];
    const duration = targetSeg.end - targetSeg.start;

    // حذف الجزء من المصفوفة
    this.segments.splice(index, 1);

    // إزاحة جميع الأجزاء اللاحقة بمقدار مدة الجزء المحذوف
    for (let i = index; i < this.segments.length; i++) {
      this.segments[i].start -= duration;
      this.segments[i].end -= duration;
    }

    this.commit();
    return true;
  }
}
