import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AIOrchestrator {
  constructor(aiProvider, ruleEngine, memoryService) {
    this.aiProvider = aiProvider;
    this.ruleEngine = ruleEngine;
    this.memoryService = memoryService;
    this.promptsDir = path.join(__dirname, '..', 'prompts');
  }

  _readPrompt(fileName) {
    const filePath = path.join(this.promptsDir, fileName);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
  }

  /**
   * تشغيل التنسيق والتحليل الكامل لملف تفريغ الكلمات
   * @param {string} userId - معرف المستخدم لجلب تفضيلاته
   * @param {Array} words - قائمة الكلمات القادمة من Whisper
   * @param {number} silenceThreshold - عتبة الصمت
   * @returns {Promise<Object>} الخط الزمني النهائي المعالج
   */
  async process(userId, words, silenceThreshold) {
    console.log(`[AIOrchestrator] Starting orchestration for user: ${userId}, words count: ${words.length}`);
    
    // 1. جلب تفضيلات المستخدم من خدمة الذاكرة
    const prefs = await this.memoryService.getUserPreferences(userId);
    const threshold = silenceThreshold !== undefined ? silenceThreshold : prefs.silenceThreshold;

    // 2. تشغيل محرك القواعد المسبق RuleEngine محلياً لتحديد الأحداث المشكوك فيها
    const { events, eventMapping } = this.ruleEngine.analyze(words, threshold);
    console.log(`[AIOrchestrator] RuleEngine found ${events.length} candidates for AI review.`);

    if (events.length === 0) {
      console.log(`[AIOrchestrator] No events found. Returning clean timeline.`);
      return this._buildTimeline(words, [], prefs.confidenceThreshold);
    }

    // 3. قراءة قالب التوجيه (Prompt) لـ Filler Words
    const fillerPromptTemplate = this._readPrompt('remove_fillers.txt');

    // 4. اختيار الموديل المناسب
    // نستخدم Flash للأعمال الاعتيادية السريعة و Pro للأعمال الطويلة أو عند تفعيل الميزات المتكاملة
    const modelName = words.length > 500 ? 'gemini-1.5-pro' : 'gemini-1.5-flash';

    // 5. استدعاء الـ AIProvider لتحليل أحداث حشو الكلام والصمت
    // نرسل فقط الأحداث المشكوك فيها مع سياقها النصي بدلاً من كامل الكلمات لتوفير الـ Tokens
    let aiCuts = [];
    try {
      // تحضير قائمة الأحداث كمدخل للذكاء الاصطناعي
      const aiResponse = await this.aiProvider.analyzeTranscript(events, fillerPromptTemplate, { modelName });
      aiCuts = aiResponse.cuts || [];
      console.log(`[AIOrchestrator] AI Provider returned ${aiCuts.length} cut decisions.`);
    } catch (err) {
      console.error('[AIOrchestrator] Error calling AI Provider for fillers:', err.message);
      // Fallback: قطع كلمات الحشو الواضحة محلياً بناءً على محرك القواعد
      aiCuts = events
        .filter(e => e.type === 'filler_word')
        .map(e => ({ wordIndex: e.wordIndex, reason: 'filler_word', confidence: 0.99 }));
      console.log(`[AIOrchestrator] Fallback applied. Cut ${aiCuts.length} fillers locally.`);
    }

    // 6. تشغيل مساعد التكرار (AI Repetitions Helper) اختيارياً إذا كان مفعلاً من المستخدم
    let repetitionCuts = [];
    if (prefs.enableRepetitionsHelper) {
      const repEvents = events.filter(e => e.type === 'repetition');
      if (repEvents.length > 0) {
        console.log(`[AIOrchestrator] AI Repetitions Helper is active. Analyzing ${repEvents.length} repetitions...`);
        const repPromptTemplate = this._readPrompt('resolve_repetitions.txt');
        try {
          const repResponse = await this.aiProvider.resolveRepetitions(repEvents, repPromptTemplate, { modelName });
          repetitionCuts = repResponse.cuts || [];
          console.log(`[AIOrchestrator] Repetitions Helper recommended cutting ${repetitionCuts.length} repetitions.`);
        } catch (repErr) {
          console.error('[AIOrchestrator] Error resolving repetitions:', repErr.message);
        }
      }
    }

    // 7. دمج قرارات القطع (Cuts Merger)
    const cutsToApply = this._mergeCuts(aiCuts, repetitionCuts, events, eventMapping);

    // 8. بناء الخط الزمني النهائي مع تصنيف الثقة (Confidence Threshold)
    return this._buildTimeline(words, cutsToApply, prefs.confidenceThreshold);
  }

  _mergeCuts(aiCuts, repetitionCuts, events, eventMapping) {
    const finalCuts = new Map();

    // دمج قطوعات حشو الكلام
    aiCuts.forEach(c => {
      // العثور على الحدث المقابل للـ wordIndex
      const matchingEvent = events.find(e => e.wordIndex === c.wordIndex);
      if (matchingEvent) {
        finalCuts.set(matchingEvent.wordIndex, {
          wordIndex: matchingEvent.wordIndex,
          reason: c.reason,
          confidence: c.confidence,
          start: matchingEvent.start,
          end: matchingEvent.end
        });
      }
    });

    // دمج قطوعات التكرار المرفوضة
    repetitionCuts.forEach(rc => {
      rc.wordIndices.forEach(idx => {
        // التحقق من أن الكلمة غير مسجلة مسبقاً أو تسجيلها بثقة أعلى
        if (!finalCuts.has(idx)) {
          // العثور على أوقات الكلمة من مصفوفة التكرار
          finalCuts.set(idx, {
            wordIndex: idx,
            reason: rc.reason || 'repeated_phrase_poor_delivery',
            confidence: rc.confidence || 0.95
          });
        }
      });
    });

    return Array.from(finalCuts.values());
  }

  _buildTimeline(words, cuts, confidenceThreshold) {
    // خريطة لتسريع البحث عن قرارات القطع
    const cutMap = new Map();
    cuts.forEach(c => cutMap.set(c.wordIndex, c));

    const timeline = [];
    let currentSegment = null;

    const createSegment = (type, start, end, details = {}) => ({
      id: Math.random().toString(36).substr(2, 9),
      type,
      start: parseFloat(start.toFixed(3)),
      end: parseFloat(end.toFixed(3)),
      ...details
    });

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const cutDecision = cutMap.get(i);
      
      let isCut = false;
      let reason = '';
      let confidence = 1.0;

      if (cutDecision) {
        // تطبيق Confidence Threshold
        if (cutDecision.confidence >= confidenceThreshold) {
          isCut = true;
          reason = cutDecision.reason;
          confidence = cutDecision.confidence;
        } else if (cutDecision.confidence >= 0.5) {
          // إذا كانت الثقة متوسطة، نضعها للمراجعة (keep مع إشارة للمراجعة)
          isCut = false;
          reason = cutDecision.reason;
          confidence = cutDecision.confidence;
        }
      }

      const segmentType = isCut ? 'remove' : 'keep';
      const details = {
        word: w.word,
        wordIndex: i,
        confidence,
        reason: reason || undefined,
        reviewRequired: (!isCut && cutDecision && cutDecision.confidence < confidenceThreshold) ? true : undefined
      };

      if (!currentSegment) {
        currentSegment = createSegment(segmentType, w.start, w.end, details);
      } else {
        // دمج الكلمات المتتالية من نفس النوع (مثال: دمج كلمات الحشو المتتالية)
        // ولكن لا ندمج الكلمات العادية المتباعدة بمسافة كبيرة
        const gap = w.start - currentSegment.end;
        if (currentSegment.type === segmentType && gap < 0.1 && !details.reviewRequired && !currentSegment.reviewRequired) {
          currentSegment.end = w.end;
          // دمج النصوص
          currentSegment.word += ' ' + w.word;
        } else {
          timeline.push(currentSegment);
          currentSegment = createSegment(segmentType, w.start, w.end, details);
        }
      }
    }

    if (currentSegment) {
      timeline.push(currentSegment);
    }

    return timeline;
  }
}
