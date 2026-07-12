import fs from 'fs';
import path from 'path';

export class MemoryService {
  constructor(storageDir = 'data') {
    this.storageDir = storageDir;
    this.defaultPreferences = {
      alwaysDeleteFillers: ['um', 'uh', 'آه', 'يعني', 'اممم'],
      keepLaughter: true,
      silenceThreshold: 0.5,
      allowShortPauses: true,
      enableRepetitionsHelper: false, // ميزة إزالة التكرار اللفظي اختيارية افتراضياً
      confidenceThreshold: 0.85
    };

    // التأكد من وجود مجلد البيانات
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  _getPrefsPath(userId) {
    // إزالة أي رموز غير آمنة في اسم المستخدم
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '');
    return path.join(this.storageDir, `prefs_${safeUserId || 'default'}.json`);
  }

  /**
   * جلب تفضيلات المستخدم مع دمج التفضيلات الافتراضية
   * @param {string} userId - الرقم التعريفي للمستخدم
   * @returns {Object} التفضيلات المندمجة
   */
  async getUserPreferences(userId) {
    const filePath = this._getPrefsPath(userId);
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return { ...this.defaultPreferences, ...JSON.parse(data) };
      }
    } catch (err) {
      console.error(`[MemoryService] Error reading preferences for ${userId}:`, err.message);
    }
    return { ...this.defaultPreferences };
  }

  /**
   * تحديث تفضيلات تعديل المستخدم وحفظها
   * @param {string} userId - الرقم التعريفي للمستخدم
   * @param {Object} preferences - التفضيلات الجديدة
   * @returns {Promise<Object>} التفضيلات المحدثة
   */
  async updateUserPreferences(userId, preferences = {}) {
    const filePath = this._getPrefsPath(userId);
    try {
      const current = await this.getUserPreferences(userId);
      const updated = { ...current, ...preferences };
      fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
      console.log(`[MemoryService] Saved preferences for user ${userId}`);
      return updated;
    } catch (err) {
      console.error(`[MemoryService] Error saving preferences for ${userId}:`, err.message);
      throw err;
    }
  }
}
