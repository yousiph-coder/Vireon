export class RuleEngine {
  constructor() {
    this.FILLERS = new Set([
      'آه', 'يعني', 'امممم', 'اممم', 'آآآ', 'اه', 'إه', 'لاكن', 'يعنيي',
      'uh', 'um', 'like', 'you know', 'hmm', 'hm', 'ah', 'er'
    ]);
  }

  /**
   * تحليل النص محلياً لاستخراج الأحداث المشكوك فيها (Filler words, Long pauses, Repetitions)
   * وتجنب إرسال الفواصل القصيرة (< 250ms) أو المقاطع السليمة يقيناً.
   * @param {Array} words - قائمة الكلمات من Whisper
   * @param {number} silenceThreshold - عتبة الصمت بالثواني (مثال: 0.5)
   * @returns {Object} يحتوي على الأحداث المشكوك فيها ومطابقتها لمجموعات الكلمات الأصلية
   */
  analyze(words, silenceThreshold = 0.5) {
    const events = [];
    const eventMapping = new Map();
    let eventIdCounter = 0;

    if (!words || words.length === 0) {
      return { events, eventMapping };
    }

    const getContext = (index, range = 3) => {
      const start = Math.max(0, index - range);
      const end = Math.min(words.length - 1, index + range);
      return words.slice(start, end + 1).map(w => w.word.trim()).join(' ');
    };

    // 1. الكشف عن كلمات الحشو (Filler Words)
    words.forEach((w, idx) => {
      const text = w.word.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      if (this.FILLERS.has(text)) {
        const eventId = `event_filler_${eventIdCounter++}`;
        events.push({
          eventId,
          type: 'filler_word',
          word: w.word,
          wordIndex: idx,
          context: getContext(idx),
          start: w.start,
          end: w.end
        });
        eventMapping.set(eventId, { type: 'filler', wordIndices: [idx], start: w.start, end: w.end });
      }
    });

    // 2. الكشف عن الصمت الطويل والفراغات (Long Pauses / Dead Air)
    // نعتبر أي فجوة زمنية أكبر من silenceThreshold وبحد أدنى 250ms كحدث صمت مشكوك فيه.
    const minSilenceLimit = Math.max(0.25, silenceThreshold);

    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i];
      const nextWord = words[i + 1];
      const gap = nextWord.start - currentWord.end;

      if (gap >= minSilenceLimit) {
        const eventId = `event_pause_${eventIdCounter++}`;
        const midTime = (currentWord.end + nextWord.start) / 2;
        events.push({
          eventId,
          type: 'long_pause',
          duration: parseFloat(gap.toFixed(3)),
          context: `${currentWord.word} [صمت ${gap.toFixed(1)} ثانية] ${nextWord.word}`,
          start: currentWord.end,
          end: nextWord.start
        });
        eventMapping.set(eventId, { type: 'pause', start: currentWord.end, end: nextWord.start });
      }
    }

    // 3. الكشف الأولي عن التكرار اللفظي البسيط (Repetitions)
    // نبحث عن الكلمات المتتالية المتشابهة
    for (let i = 0; i < words.length - 1; i++) {
      const word1 = words[i].word.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      const word2 = words[i + 1].word.trim().toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");

      if (word1 === word2 && word1.length > 1) {
        const eventId = `event_rep_${eventIdCounter++}`;
        events.push({
          eventId,
          type: 'repetition',
          word: words[i].word,
          wordIndices: [i, i + 1],
          context: getContext(i + 1, 4),
          start: words[i].start,
          end: words[i + 1].end
        });
        eventMapping.set(eventId, { type: 'repetition', wordIndices: [i, i + 1], start: words[i].start, end: words[i + 1].end });
        i++; // تخطي الكلمة التالية لتجنب تكرار الفحص
      }
    }

    return { events, eventMapping };
  }
}
