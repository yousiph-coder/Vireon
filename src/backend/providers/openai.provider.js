import axios from 'axios';
import { AIProvider } from './ai-provider.interface.js';

export class OpenAIProvider extends AIProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
  }

  _isConfigured() {
    return !!this.apiKey;
  }

  async analyzeTranscript(words, promptTemplate, options = {}) {
    if (!this._isConfigured()) {
      throw new Error('OpenAI API key is not configured.');
    }

    const modelName = options.modelName || 'gpt-4o-mini';
    const formattedWords = words.map((w, idx) => ({
      index: idx,
      word: w.word.trim(),
      start: parseFloat(w.start.toFixed(3)),
      end: parseFloat(w.end.toFixed(3))
    }));

    const responseSchema = {
      type: "object",
      properties: {
        cuts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              wordIndex: { type: "integer" },
              reason: { type: "string" },
              confidence: { type: "number" }
            },
            required: ["wordIndex", "reason", "confidence"],
            additionalProperties: false
          }
        }
      },
      required: ["cuts"],
      additionalProperties: false
    };

    try {
      console.log(`[OpenAI API] Sending ${formattedWords.length} words to model ${modelName}...`);
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: modelName,
          messages: [
            { role: "system", content: "You are a professional assistant for video editing. Output your response only as a valid JSON object matching the requested schema." },
            { role: "user", content: `${promptTemplate}\n\nنص الكلمات:\n${JSON.stringify(formattedWords, null, 2)}` }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "video_cuts",
              schema: responseSchema,
              strict: true
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 60000
        }
      );

      const responseText = response.data.choices[0].message.content;
      return JSON.parse(responseText);
    } catch (error) {
      const errMessage = error.response?.data?.error?.message || error.message;
      console.error('[OpenAI API] Error generating content:', errMessage);
      throw new Error(`OpenAI API failed: ${errMessage}`);
    }
  }

  async resolveRepetitions(repetitions, promptTemplate, options = {}) {
    if (!this._isConfigured()) {
      throw new Error('OpenAI API key is not configured.');
    }

    const modelName = options.modelName || 'gpt-4o-mini';
    const responseSchema = {
      type: "object",
      properties: {
        cuts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              wordIndices: {
                type: "array",
                items: { type: "integer" }
              },
              reason: { type: "string" },
              confidence: { type: "number" }
            },
            required: ["wordIndices", "reason", "confidence"],
            additionalProperties: false
          }
        }
      },
      required: ["cuts"],
      additionalProperties: false
    };

    try {
      console.log(`[OpenAI API] Resolving ${repetitions.length} repetition groups...`);
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: modelName,
          messages: [
            { role: "system", content: "You are a professional video editor. Decide which duplicate word/phrase to remove. Output only valid JSON." },
            { role: "user", content: `${promptTemplate}\n\nقائمة التكرارات:\n${JSON.stringify(repetitions, null, 2)}` }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "resolve_repetitions",
              schema: responseSchema,
              strict: true
            }
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          timeout: 60000
        }
      );

      const responseText = response.data.choices[0].message.content;
      return JSON.parse(responseText);
    } catch (error) {
      const errMessage = error.response?.data?.error?.message || error.message;
      console.error('[OpenAI API] Error resolving repetitions:', errMessage);
      throw new Error(`OpenAI API failed: ${errMessage}`);
    }
  }
}
