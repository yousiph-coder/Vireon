/**
 * واجهة برمجية موحدة (Interface) لموفري خدمات الذكاء الاصطناعي.
 * تضمن إمكانية التبديل بين Gemini, OpenAI, Claude, إلخ.
 */
export class AIProvider {
  /**
   * تحليل النص المستخرج من الصوت لتحديد قرارات القطع (Keep/Cut)
   * @param {Array} words - مصفوفة الكلمات المستخرجة من Whisper مع التوقيتات
   * @param {string} prompt - قالب التوجيه (Prompt) المستدعى من PromptManager
   * @param {Object} options - خيارات إضافية (اسم الموديل، التفضيلات)
   * @returns {Promise<Object>} قرارات التعديل في مصفوفة تحتوي على cuts
   */
  async analyzeTranscript(words, prompt, options = {}) {
    throw new Error('Method analyzeTranscript() must be implemented');
  }

  /**
   * تحليل التكرارات اللفظية واختيار التكرار الأفضل صوتياً أو سياقياً
   * @param {Array} repetitions - قائمة التكرارات المرصودة ومواقيتها
   * @param {string} prompt - قالب توجيه حل التكرار
   * @param {Object} options - خيارات إضافية تشمل عينات الصوت إن وجدت
   * @returns {Promise<Object>} قائمة بالقطع المقترحة للتكرارات المرفوضة
   */
  async resolveRepetitions(repetitions, prompt, options = {}) {
    throw new Error('Method resolveRepetitions() must be implemented');
  }

  /**
   * توليد أسطر نصوص الشاشة المجمعة والمصححة زمنياً (Auto Captions)
   * @param {Array} words - مصفوفة الكلمات المستخرجة من Whisper
   * @param {string} prompt - قالب توجيه التجميع والتنظيف
   * @param {Object} options - خيارات إضافية
   * @returns {Promise<Object>} الترجمة المجمعة في مصفوفة تحتوي على cues
   */
  async generateCaptions(words, prompt, options = {}) {
    throw new Error('Method generateCaptions() must be implemented');
  }

  /**
   * تحديد الكلمات والعبارات المهمة لتطبيق زوم ديناميكي عليها
   * @param {Array} words - مصفوفة الكلمات المستخرجة من Whisper
   * @param {string} prompt - قالب توجيه تحديد الكلمات المهمة
   * @param {Object} options - خيارات إضافية
   * @returns {Promise<Object>} قائمة بنقاط الزوم في مصفوفة تحتوي على emphasisPoints
   */
  async detectEmphasis(words, prompt, options = {}) {
    throw new Error('Method detectEmphasis() must be implemented');
  }
}
