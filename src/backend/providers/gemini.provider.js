import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider } from './ai-provider.interface.js';

export class GeminiProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || '';
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  _isConfigured() {
    return !!this.genAI;
  }

  async analyzeTranscript(words, promptTemplate, options = {}) {
    if (!this._isConfigured()) {
      throw new Error('Gemini API key is not configured.');
    }

    const modelName = options.modelName || 'gemini-1.5-flash';
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            cuts: {
              type: 'ARRAY',
              description: 'قائمة بالكلمات المقترح قطعها وإزالتها من الخط الزمني.',
              items: {
                type: 'OBJECT',
                properties: {
                  wordIndex: {
                    type: 'INTEGER',
                    description: 'الرقم التعريفي (Index) للكلمة المراد قطعها.'
                  },
                  reason: {
                    type: 'STRING',
                    description: 'السبب التقني للحذف (filler_word, stuttering, breath, false_start).'
                  },
                  confidence: {
                    type: 'NUMBER',
                    description: 'مستوى الثقة في القرار من 0.0 إلى 1.0.'
                  }
                },
                required: ['wordIndex', 'reason', 'confidence']
              }
            }
          },
          required: ['cuts']
        }
      }
    });

    // تجهيز المدخلات للنموذج
    const formattedWords = words.map((w, idx) => ({
      index: idx,
      word: w.word.trim(),
      start: parseFloat(w.start.toFixed(3)),
      end: parseFloat(w.end.toFixed(3))
    }));

    const userPrompt = `${promptTemplate}\n\nنص الكلمات مع التوقيتات والمعرفات:\n${JSON.stringify(formattedWords, null, 2)}`;

    try {
      console.log(`[Gemini API] Sending ${formattedWords.length} words to model ${modelName}...`);
      const result = await model.generateContent(userPrompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('[Gemini API] Error generating content:', error);
      throw error;
    }
  }

  async resolveRepetitions(repetitions, promptTemplate, options = {}) {
    if (!this._isConfigured()) {
      throw new Error('Gemini API key is not configured.');
    }

    const modelName = options.modelName || 'gemini-1.5-flash';
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            cuts: {
              type: 'ARRAY',
              description: 'قائمة بمعرفات الكلمات الخاصة بالتكرارات المرفوضة التي يجب قطعها.',
              items: {
                type: 'OBJECT',
                properties: {
                  wordIndices: {
                    type: 'ARRAY',
                    items: { type: 'INTEGER' },
                    description: 'مجموعة معرفات الكلمات المرتبطة بالتكرار الضعيف أو المرفوض.'
                  },
                  reason: {
                    type: 'STRING',
                    description: 'السبب (مثال: repeated_phrase_poor_delivery).'
                  },
                  confidence: {
                    type: 'NUMBER'
                  }
                },
                required: ['wordIndices', 'reason', 'confidence']
              }
            }
          },
          required: ['cuts']
        }
      }
    });

    const userPrompt = `${promptTemplate}\n\nقائمة التكرارات المكتشفة للمقارنة:\n${JSON.stringify(repetitions, null, 2)}`;

    try {
      console.log(`[Gemini API] Resolving ${repetitions.length} repetition groups...`);
      const result = await model.generateContent(userPrompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('[Gemini API] Error resolving repetitions:', error);
      throw error;
    }
  }

  async generateCaptions(words, promptTemplate, options = {}) {
    if (!this._isConfigured()) {
      throw new Error('Gemini API key is not configured.');
    }

    const modelName = options.modelName || 'gemini-1.5-flash';
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            cues: {
              type: 'ARRAY',
              description: 'قائمة بأسطر نصوص الشاشة المجمعة زمنياً.',
              items: {
                type: 'OBJECT',
                properties: {
                  id: { type: 'STRING', description: 'معرف فريد للسطر.' },
                  start: { type: 'NUMBER', description: 'توقيت بدء السطر بالثواني.' },
                  end: { type: 'NUMBER', description: 'توقيت نهاية السطر بالثواني.' },
                  text: { type: 'STRING', description: 'النص المجمع والمصحح للسطر.' }
                },
                required: ['id', 'start', 'end', 'text']
              }
            }
          },
          required: ['cues']
        }
      }
    });

    const formattedWords = words.map((w, idx) => ({
      index: idx,
      word: w.word.trim(),
      start: parseFloat(w.start.toFixed(3)),
      end: parseFloat(w.end.toFixed(3))
    }));

    const userPrompt = `${promptTemplate}\n\nقائمة الكلمات للتجميع:\n${JSON.stringify(formattedWords, null, 2)}`;

    try {
      console.log(`[Gemini API] Generating chunked captions for ${formattedWords.length} words...`);
      const result = await model.generateContent(userPrompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('[Gemini API] Error generating captions:', error);
      throw error;
    }
  }

  async detectEmphasis(words, promptTemplate, options = {}) {
    if (!this._isConfigured()) {
      throw new Error('Gemini API key is not configured.');
    }

    const modelName = options.modelName || 'gemini-1.5-flash';
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            emphasisPoints: {
              type: 'ARRAY',
              description: 'List of high-impact words/phrases timestamps for dynamic zoom.',
              items: {
                type: 'OBJECT',
                properties: {
                  start: { type: 'NUMBER', description: 'Start time of the emphasis point in seconds.' },
                  end: { type: 'NUMBER', description: 'End time of the emphasis point in seconds.' },
                  intensity: { type: 'STRING', enum: ['subtle', 'punchy'], description: 'Suggested zoom intensity.' },
                  word: { type: 'STRING', description: 'The word or phrase being emphasized.' }
                },
                required: ['start', 'end', 'intensity', 'word']
              }
            }
          },
          required: ['emphasisPoints']
        }
      }
    });

    const formattedWords = words.map((w, idx) => ({
      index: idx,
      word: w.word.trim(),
      start: parseFloat(w.start.toFixed(3)),
      end: parseFloat(w.end.toFixed(3))
    }));

    const userPrompt = `${promptTemplate}\n\nList of words for analysis:\n${JSON.stringify(formattedWords, null, 2)}`;

    try {
      console.log(`[Gemini API] Detecting emphasis for ${formattedWords.length} words...`);
      const result = await model.generateContent(userPrompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      console.error('[Gemini API] Error detecting emphasis:', error);
      throw error;
    }
  }
}
