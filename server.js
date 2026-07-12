import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import axios from 'axios';
import FormData from 'form-data';
import { fileURLToPath } from 'url';

// استيراد الخدمات وموفري الذكاء الاصطناعي الجديدة
import { GeminiProvider } from './src/backend/providers/gemini.provider.js';
import { OpenAIProvider } from './src/backend/providers/openai.provider.js';
import { RuleEngine } from './src/backend/services/rule-engine.service.js';
import { MemoryService } from './src/backend/services/memory.service.js';
import { AIOrchestrator } from './src/backend/services/orchestrator.service.js';
import { QueueManager } from './src/backend/services/queue.manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

console.log(`[Vireon] OpenAI API Key: ${API_KEY ? '✅ Found' : '❌ MISSING'}`);
console.log(`[Vireon] Gemini API Key: ${GEMINI_API_KEY ? '✅ Found' : '❌ MISSING'}`);

const app = express();
app.use(cors());
app.use(express.json());

// ─── إعداد خدمات النظام ──────────────────────────────────────────────────────
const memoryService = new MemoryService('data');
const ruleEngine = new RuleEngine();

function recordDurationLog(durationSeconds) {
  try {
    const dir = path.join(__dirname, 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const filepath = path.join(dir, 'system_stats.json');
    let stats = { totalDurationSeconds: 0, jobsCount: 0 };
    if (fs.existsSync(filepath)) {
      try {
        stats = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      } catch (_) {}
    }
    stats.totalDurationSeconds = (stats.totalDurationSeconds || 0) + durationSeconds;
    stats.jobsCount = (stats.jobsCount || 0) + 1;
    fs.writeFileSync(filepath, JSON.stringify(stats, null, 2), 'utf8');
    console.log(`[Stats Log] Cumulative Duration: ${stats.totalDurationSeconds}s, Jobs: ${stats.jobsCount}`);
  } catch (err) {
    console.error('[Stats Log] Error recording duration:', err.message);
  }
}

let activeProvider = null;
if (GEMINI_API_KEY) {
  activeProvider = new GeminiProvider(GEMINI_API_KEY);
  console.log('[Vireon] Active Provider loaded: Gemini AI ✅');
} else if (API_KEY) {
  activeProvider = new OpenAIProvider(API_KEY);
  console.log('[Vireon] Active Provider loaded: OpenAI GPT 🧠');
} else {
  console.warn('[Vireon] No AI provider keys found in .env. Heuristics fallback active.');
}

const orchestrator = new AIOrchestrator(activeProvider, ruleEngine, memoryService);
const queueManager = new QueueManager();

// تهيئة نظام الطوابير المتعددة
await queueManager.initialize();

// ─── مخازن الحالات المؤقتة (In-Memory status stores) ───────────────────────────
const jobStore = new Map();
const exportStore = new Map();

function storeJob(jobId, data) {
  const current = jobStore.get(jobId) || {};
  jobStore.set(jobId, { ...current, ...data });
}

function updateJobStatus(jobId, status, details = {}) {
  const job = jobStore.get(jobId) || {};
  jobStore.set(jobId, { ...job, status, ...details });
  console.log(`[Job Status][${jobId}] -> ${status} (${details.progress || 0}%)`);
}

function updateExportStatus(exportId, status, details = {}) {
  const exp = exportStore.get(exportId) || {};
  exportStore.set(exportId, { ...exp, status, ...details });
  console.log(`[Export Status][${exportId}] -> ${status}`);
}

// ─── Multer upload ────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 2000 * 1024 * 1024 } });

// ─── وظائف FFmpeg المساعدة ────────────────────────────────────────────────────
function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

function extractAudio(videoPath, audioPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(audioPath)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioBitrate('32k')
      .audioChannels(1)
      .audioFrequency(16000)
      .on('end', () => resolve(audioPath))
      .on('error', reject)
      .run();
  });
}

async function callWhisper(audioPath, language) {
  if (!API_KEY) throw new Error('NO_KEY');
  const form = new FormData();
  form.append('file', fs.createReadStream(audioPath));
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');
  form.append('timestamp_granularities[]', 'word');
  if (language && language !== 'both') {
    form.append('language', language === 'ar' ? 'ar' : 'en');
  }

  const response = await axios.post(
    'https://api.openai.com/v1/audio/transcriptions',
    form,
    {
      headers: { ...form.getHeaders(), Authorization: `Bearer ${API_KEY}` },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 120000
    }
  );
  return response.data;
}

function detectSilenceWithFFmpeg(audioPath, silenceThreshold) {
  return new Promise((resolve) => {
    const noiseLevel = '-30dB';
    const silenceDuration = silenceThreshold;

    const segments = [];
    let stderr = '';

    ffmpeg(audioPath)
      .audioFilters(`silencedetect=noise=${noiseLevel}:duration=${silenceDuration}`)
      .format('null')
      .output('-')
      .on('stderr', (line) => {
        stderr += line + '\n';
      })
      .on('end', () => {
        const startRe = /silence_start: ([\d.]+)/g;
        const endRe = /silence_end: ([\d.]+)/g;

        let sm, em;
        const silenceStarts = [];
        const silenceEnds = [];

        while ((sm = startRe.exec(stderr)) !== null) silenceStarts.push(parseFloat(sm[1]));
        while ((em = endRe.exec(stderr)) !== null) silenceEnds.push(parseFloat(em[1]));

        for (let i = 0; i < Math.min(silenceStarts.length, silenceEnds.length); i++) {
          segments.push({ start: silenceStarts[i], end: silenceEnds[i] });
        }
        resolve(segments);
      })
      .on('error', () => resolve([]))
      .run();
  });
}

function silencesToKeepSegments(silences, duration) {
  if (!silences || silences.length === 0) return [{ start: 0, end: duration }];

  const keep = [];
  let cursor = 0;

  for (const silence of silences) {
    if (silence.start > cursor) {
      keep.push({ start: cursor, end: silence.start });
    }
    cursor = silence.end;
  }

  if (cursor < duration) {
    keep.push({ start: cursor, end: duration });
  }

  return keep;
}

function buildFullTimeline(keepSegments, duration) {
  const timeline = [];
  let cursor = 0;
  for (const seg of keepSegments) {
    if (seg.start > cursor) {
      timeline.push({ id: Math.random().toString(36).substr(2, 9), start: cursor, end: seg.start, type: 'remove' });
    }
    timeline.push({ id: Math.random().toString(36).substr(2, 9), start: seg.start, end: seg.end, type: 'keep' });
    cursor = seg.end;
  }
  if (cursor < duration) {
    timeline.push({ id: Math.random().toString(36).substr(2, 9), start: cursor, end: duration, type: 'remove' });
  }
  return timeline;
}

function hexToAssColor(hex) {
  if (!hex) return '&H00FFFFFF';
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean[0] + clean[0] + clean[1] + clean[1] + clean[2] + clean[2];
  }
  if (clean.length !== 6) return '&H00FFFFFF';
  const r = clean.substring(0, 2);
  const g = clean.substring(2, 4);
  const b = clean.substring(4, 6);
  return `&H00${b}${g}${r}`;
}

function generateAssFile(cues, style, assPath) {
  const fontName = style.fontName || 'Cairo';
  const fontSize = style.fontSize || 24;
  const primaryColor = hexToAssColor(style.fontColor || '#ffffff');
  
  let alignment = 2; // bottom center
  if (style.position === 'top') alignment = 8;
  else if (style.position === 'center') alignment = 5;

  let assContent = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,${alignment},10,10,50,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const formatAssTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    
    const h = hrs.toString().padStart(1, '0');
    const m = mins.toString().padStart(2, '0');
    const s = secs.toString().padStart(2, '0');
    const d = ms.toString().padStart(2, '0');
    return `${h}:${m}:${s}.${d}`;
  };

  cues.forEach(cue => {
    const startStr = formatAssTime(cue.start);
    const endStr = formatAssTime(cue.end);
    const textClean = cue.text.replace(/\r?\n/g, '\\N').replace(/,/g, '،');
    assContent += `Dialogue: 0,${startStr},${endStr},Default,,0,0,0,,${textClean}\n`;
  });

  fs.writeFileSync(assPath, assContent, 'utf-8');
}

function localChunking(words) {
  const cues = [];
  const chunkSize = 4;
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize);
    const text = chunk.map(w => w.word).join(' ');
    cues.push({
      id: `cue_${i}`,
      start: parseFloat(chunk[0].start.toFixed(3)),
      end: parseFloat(chunk[chunk.length - 1].end.toFixed(3)),
      text: text
    });
  }
  return { cues };
}

function getIntensitySettings(intensity) {
  switch (intensity) {
    case 'subtle':
      return { cutZoom: 1.04, emphasisZoom: 1.09, maxEmphasisPerMin: 3 };
    case 'punchy':
      return { cutZoom: 1.10, emphasisZoom: 1.18, maxEmphasisPerMin: 8 };
    case 'balanced':
    default:
      return { cutZoom: 1.07, emphasisZoom: 1.14, maxEmphasisPerMin: 5 };
  }
}

function generateZoomKeyframes(timeline, emphasisPoints, intensity, silenceRemoval, duration) {
  const settings = getIntensitySettings(intensity);
  
  // 1. Calculate cut points
  const cutPoints = [];
  if (silenceRemoval) {
    const keepSegments = timeline.filter(s => s.type === 'keep' && (s.end - s.start) > 0.05);
    let currentTrimmedTime = 0;
    for (let i = 0; i < keepSegments.length - 1; i++) {
      currentTrimmedTime += (keepSegments[i].end - keepSegments[i].start);
      cutPoints.push(currentTrimmedTime);
    }
  }

  // 2. Adjust emphasis points using overlap resolution
  const minSpacing = 1.0;
  const resolvedEmphasis = emphasisPoints.map(ep => {
    let start = ep.start;
    let end = ep.end;
    
    cutPoints.forEach(cp => {
      if (Math.abs(start - cp) < minSpacing) {
        start = cp;
      }
      if (Math.abs(end - cp) < minSpacing) {
        end = cp;
      }
    });

    return {
      start: parseFloat(start.toFixed(3)),
      end: parseFloat(end.toFixed(3)),
      zoomLevel: settings.emphasisZoom,
      source: 'emphasis'
    };
  });

  // Limit emphasis points based on video duration to avoid jitter
  const minutes = duration / 60;
  const maxAllowed = Math.max(1, Math.round(minutes * settings.maxEmphasisPerMin));
  const finalEmphasis = resolvedEmphasis.slice(0, maxAllowed);

  // 3. Build baseline cut-point zoom segments
  const baseSegments = [];
  if (cutPoints.length > 0) {
    let currentZoom = 1.0;
    let lastTime = 0;
    cutPoints.forEach(cp => {
      baseSegments.push({ start: lastTime, end: cp, zoomLevel: currentZoom, source: 'cut' });
      currentZoom = currentZoom === 1.0 ? settings.cutZoom : 1.0;
      lastTime = cp;
    });
    baseSegments.push({ start: lastTime, end: duration, zoomLevel: currentZoom, source: 'cut' });
  } else {
    baseSegments.push({ start: 0, end: duration, zoomLevel: 1.0, source: 'cut' });
  }

  // 4. Overlay emphasis points on top of baseSegments
  const boundaries = new Set([0, duration]);
  baseSegments.forEach(s => { boundaries.add(s.start); boundaries.add(s.end); });
  finalEmphasis.forEach(e => { boundaries.add(e.start); boundaries.add(e.end); });

  const sortedBoundaries = Array.from(boundaries).filter(t => t >= 0 && t <= duration).sort((a, b) => a - b);
  const result = [];
  
  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const start = sortedBoundaries[i];
    const end = sortedBoundaries[i + 1];
    if (end - start < 0.01) continue; // skip tiny slices

    const mid = (start + end) / 2;
    
    // Check if covered by any emphasis point
    const activeEmphasis = finalEmphasis.find(e => mid >= e.start && mid <= e.end);
    if (activeEmphasis) {
      result.push({ start, end, zoomLevel: settings.emphasisZoom, source: 'emphasis' });
    } else {
      // Find covering base segment
      const activeBase = baseSegments.find(b => mid >= b.start && mid <= b.end);
      const zoom = activeBase ? activeBase.zoomLevel : 1.0;
      result.push({ start, end, zoomLevel: zoom, source: 'cut' });
    }
  }

  return result;
}

function generateFfmpegZoomFilter(zoomKeyframes) {
  if (!zoomKeyframes || zoomKeyframes.length === 0) return '';
  
  let wExpr = 'in_w';
  let hExpr = 'in_h';

  zoomKeyframes.forEach(kf => {
    if (kf.zoomLevel !== 1.0) {
      wExpr = `if(between(t,${kf.start},${kf.end}),in_w/${kf.zoomLevel},${wExpr})`;
      hExpr = `if(between(t,${kf.start},${kf.end}),in_h/${kf.zoomLevel},${hExpr})`;
    }
  });

  return `crop=w='${wExpr}':h='${hExpr}':x='(in_w-out_w)/2':y='(in_h-out_h)/2',scale=1920:1080`;
}

function processVideo(inputPath, outputPath, keepSegments, originalDuration, assPath = null, zoomFilter = null) {
  return new Promise((resolve, reject) => {
    if (!keepSegments || keepSegments.length === 0) {
      return reject(new Error('No segments to keep'));
    }
    const isSingleKeepAll = keepSegments.length === 1 && keepSegments[0].start === 0 && originalDuration && Math.abs(keepSegments[0].end - originalDuration) < 0.1;
    if (isSingleKeepAll && !assPath && !zoomFilter) {
      fs.copyFileSync(inputPath, outputPath);
      return resolve(outputPath);
    }

    let filtergraph = '';
    let concatInputs = '';
    keepSegments.forEach((seg, i) => {
      filtergraph += `[0:v]trim=start=${seg.start.toFixed(3)}:end=${seg.end.toFixed(3)},setpts=PTS-STARTPTS[v${i}];`;
      filtergraph += `[0:a]atrim=start=${seg.start.toFixed(3)}:end=${seg.end.toFixed(3)},asetpts=PTS-STARTPTS[a${i}];`;
      concatInputs += `[v${i}][a${i}]`;
    });
    
    if (zoomFilter && assPath) {
      const escapedAssPath = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
      filtergraph += `${concatInputs}concat=n=${keepSegments.length}:v=1:a=1[concatv][outa];[concatv]${zoomFilter}[zoomedv];[zoomedv]subtitles='${escapedAssPath}'[outv]`;
    } else if (zoomFilter) {
      filtergraph += `${concatInputs}concat=n=${keepSegments.length}:v=1:a=1[concatv][outa];[concatv]${zoomFilter}[outv]`;
    } else if (assPath) {
      const escapedAssPath = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
      filtergraph += `${concatInputs}concat=n=${keepSegments.length}:v=1:a=1[concatv][outa];[concatv]subtitles='${escapedAssPath}'[outv]`;
    } else {
      filtergraph += `${concatInputs}concat=n=${keepSegments.length}:v=1:a=1[outv][outa]`;
    }

    ffmpeg(inputPath)
      .complexFilter(filtergraph, ['outv', 'outa'])
      .output(outputPath)
      .videoCodec('libx264')
      .outputOptions(['-preset ultrafast', '-crf 23', '-movflags +faststart'])
      .audioCodec('aac')
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .run();
  });
}

function tryDelete(...paths) {
  paths.forEach(p => { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {} });
}

// ─── تسجيل معالجي الطوابير (Queue Workers) ────────────────────────────────────

// 1. Upload Queue Worker
queueManager.registerWorker('UploadQueue', async (job) => {
  const { jobId, inputPath, audioPath, language, silenceThreshold, silenceRemoval, autoCaptions, autoZoom, zoomIntensity } = job.data;
  updateJobStatus(jobId, 'processing_upload', { progress: 20 });

  const originalDuration = await getVideoDuration(inputPath);
  updateJobStatus(jobId, 'processing_upload', { progress: 60 });

  await extractAudio(inputPath, audioPath);
  updateJobStatus(jobId, 'processing_upload', { progress: 100 });

  // الانتقال لطابور Whisper
  await queueManager.addJob('WhisperQueue', 'transcribe', {
    jobId,
    inputPath,
    audioPath,
    originalDuration,
    language,
    silenceThreshold,
    silenceRemoval,
    autoCaptions,
    autoZoom,
    zoomIntensity
  });
});

// 2. Whisper Queue Worker
queueManager.registerWorker('WhisperQueue', async (job) => {
  const { jobId, inputPath, audioPath, originalDuration, language, silenceThreshold, silenceRemoval, autoCaptions, autoZoom, zoomIntensity } = job.data;
  updateJobStatus(jobId, 'processing_transcription', { progress: 20 });

  let words = [];
  let fallback = false;

  if (API_KEY) {
    try {
      const whisperData = await callWhisper(audioPath, language);
      words = whisperData.words || [];
      updateJobStatus(jobId, 'processing_transcription', { progress: 90 });
    } catch (err) {
      console.error('[Whisper Queue Worker] Whisper failed:', err.message);
      fallback = true;
    }
  } else {
    fallback = true;
  }

  if (fallback) {
    console.log(`[WhisperQueue] Whisper failed. Falling back to FFmpeg silencedetect (threshold: ${silenceThreshold}s)...`);
    const silences = await detectSilenceWithFFmpeg(audioPath, silenceThreshold);
    console.log(`[WhisperQueue] FFmpeg detected ${silences.length} silences.`);
    const keepSegments = silencesToKeepSegments(silences, originalDuration);
    const timeline = buildFullTimeline(keepSegments, originalDuration);

    const originalSizeMB = parseFloat((fs.statSync(inputPath).size / (1024 * 1024)).toFixed(2));

    storeJob(jobId, {
      timeline,
      captions: [],
      zoomKeyframes: [],
      originalDuration,
      inputPath,
      status: 'completed',
      progress: 100,
      stats: {
        originalDuration: parseFloat(originalDuration.toFixed(2)),
        originalSizeMB,
        segmentsCount: timeline.length
      }
    });

    tryDelete(audioPath);
    recordDurationLog(originalDuration);
    updateJobStatus(jobId, 'completed', { progress: 100 });
    return;
  }

  tryDelete(audioPath);
  updateJobStatus(jobId, 'processing_transcription', { progress: 100 });

  // الانتقال لطابور Gemini
  await queueManager.addJob('GeminiQueue', 'analyze', {
    jobId,
    inputPath,
    originalDuration,
    words,
    silenceThreshold,
    silenceRemoval,
    autoCaptions,
    autoZoom,
    zoomIntensity,
    language
  });
});

// 3. Gemini Queue Worker (Combines silence detection, auto-caption and auto-zoom pipeline)
queueManager.registerWorker('GeminiQueue', async (job) => {
  const { jobId, inputPath, originalDuration, words, silenceThreshold, silenceRemoval, autoCaptions, autoZoom, zoomIntensity, language } = job.data;
  updateJobStatus(jobId, 'processing_analysis', { progress: 30 });

  let timeline = [];
  const userId = 'default_user';

  // Section A: Silence Detection
  if (silenceRemoval !== false && words.length > 0) {
    try {
      timeline = await orchestrator.process(userId, words, silenceThreshold);
    } catch (err) {
      console.error('[Gemini Queue Worker] Orchestrator failed:', err.message);
      timeline = buildFullTimeline([{ start: 0, end: originalDuration }], originalDuration);
    }
  } else {
    timeline = buildFullTimeline([{ start: 0, end: originalDuration }], originalDuration);
  }

  updateJobStatus(jobId, 'processing_analysis', { progress: 60 });

  let finalCues = [];
  let trimmedPath = null;
  let trimmedWords = [];

  const needsTrimmedTranscribe = (silenceRemoval !== false) && (autoCaptions === true || autoZoom === true);

  if (needsTrimmedTranscribe) {
    const keepSegments = timeline.filter(s => s.type === 'keep' && (s.end - s.start) > 0.05);
    trimmedPath = `uploads/trimmed_${jobId}.mp4`;
    const trimmedAudioPath = `uploads/trimmed_${jobId}.mp3`;

    console.log(`[GeminiQueue] Generating trimmed video for transcription: ${trimmedPath}`);
    await processVideo(inputPath, trimmedPath, keepSegments, originalDuration);

    console.log(`[GeminiQueue] Extracting audio from trimmed video...`);
    await extractAudio(trimmedPath, trimmedAudioPath);

    console.log(`[GeminiQueue] Transcribing trimmed audio...`);
    if (API_KEY) {
      try {
        const whisperData = await callWhisper(trimmedAudioPath, language);
        trimmedWords = whisperData.words || [];
      } catch (err) {
        console.error('[GeminiQueue] Whisper on trimmed audio failed:', err.message);
      }
    }
    tryDelete(trimmedAudioPath);
  }

  const sourceWords = (silenceRemoval !== false) ? trimmedWords : words;

  // Section B: Auto Captions Chunking Pass
  if (autoCaptions === true && sourceWords.length > 0) {
    try {
      const template = fs.readFileSync('src/backend/prompts/generate_captions.txt', 'utf-8');
      const captionsRes = await activeProvider.generateCaptions(sourceWords, template);
      finalCues = captionsRes.cues || [];
    } catch (err) {
      console.error('[GeminiQueue] Caption chunking failed, using fallback:', err.message);
      finalCues = localChunking(sourceWords).cues;
    }
  }

  // Section C: Auto Zoom Keyframes Generation
  let zoomKeyframes = [];
  if (autoZoom === true) {
    let emphasisPoints = [];
    if (sourceWords.length > 0 && API_KEY) {
      try {
        const template = fs.readFileSync('src/backend/prompts/detect_emphasis.txt', 'utf-8');
        const zoomRes = await activeProvider.detectEmphasis(sourceWords, template);
        emphasisPoints = zoomRes.emphasisPoints || [];
      } catch (err) {
        console.error('[GeminiQueue] Emphasis detection failed:', err.message);
      }
    }

    const finalDuration = (silenceRemoval !== false) 
      ? timeline.filter(s => s.type === 'keep').reduce((acc, s) => acc + (s.end - s.start), 0)
      : originalDuration;

    zoomKeyframes = generateZoomKeyframes(timeline, emphasisPoints, zoomIntensity || 'balanced', silenceRemoval !== false, finalDuration);
  }

  const originalSizeMB = parseFloat((fs.statSync(inputPath).size / (1024 * 1024)).toFixed(2));

  storeJob(jobId, {
    timeline,
    captions: finalCues,
    zoomKeyframes,
    trimmedPath,
    originalDuration,
    inputPath,
    status: 'completed',
    progress: 100,
    stats: {
      originalDuration: parseFloat(originalDuration.toFixed(2)),
      originalSizeMB,
      segmentsCount: timeline.length
    }
  });

  recordDurationLog(originalDuration);
  updateJobStatus(jobId, 'completed', { progress: 100 });
});

// 4. Export Queue Worker
queueManager.registerWorker('ExportQueue', async (job) => {
  const { exportId, jobId, keepSegments, captions, captionStyle, zoomKeyframes } = job.data;
  updateExportStatus(exportId, 'processing_export', { progress: 20 });

  const session = jobStore.get(jobId);
  if (!session) {
    throw new Error('Session not found.');
  }

  const outputPath = `output/clean_${jobId}.mp4`;
  updateExportStatus(exportId, 'processing_export', { progress: 40 });

  let assPath = null;
  if (captions && captions.length > 0 && captionStyle) {
    assPath = `uploads/subs_${exportId}.ass`;
    generateAssFile(captions, captionStyle, assPath);
  }

  let zoomFilter = null;
  if (zoomKeyframes && zoomKeyframes.length > 0) {
    zoomFilter = generateFfmpegZoomFilter(zoomKeyframes);
  }

  // If silence removal is active, trim and burn. If not active, keepSegments has 1 segment (start: 0, end: originalDuration)
  await processVideo(session.inputPath, outputPath, keepSegments, session.originalDuration, assPath, zoomFilter);
  
  if (assPath) {
    tryDelete(assPath);
  }

  updateExportStatus(exportId, 'processing_export', { progress: 80 });

  let keptDuration = 0;
  keepSegments.forEach(s => (keptDuration += s.end - s.start));
  const savedTime = Math.max(0, session.originalDuration - keptDuration);

  const originalSizeMB = parseFloat((fs.statSync(session.inputPath).size / (1024 * 1024)).toFixed(2));
  const finalSizeMB    = parseFloat((fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2));
  const sizeSavedMB    = Math.max(0, originalSizeMB - finalSizeMB).toFixed(2);

  updateExportStatus(exportId, 'completed', {
    progress: 100,
    downloadUrl: `/api/export/${jobId}/mp4`,
    stats: {
      originalDuration: parseFloat(session.originalDuration.toFixed(2)),
      finalDuration:    parseFloat(keptDuration.toFixed(2)),
      savedTime:        parseFloat(savedTime.toFixed(2)),
      originalSizeMB,
      finalSizeMB,
      sizeSavedMB:      parseFloat(sizeSavedMB)
    }
  });

  session.outputPath = outputPath;
  session.keepSegments = keepSegments;
});

// ─── مسارات واجهات برمجة التطبيقات (API Routes) ───────────────────────────────

// 1. بدء معالجة رفع الفيديو (Async POST)
app.post('/api/process', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم استقبال ملف فيديو.' });

  const jobId = req.file.filename.split('.')[0];
  const inputPath = req.file.path;
  const audioPath = `uploads/${req.file.filename}.mp3`;
  const language = req.body.language || 'ar';
  const silenceThreshold = Math.max(0.1, parseFloat(req.body.silenceThreshold) || 0.5);
  const silenceRemoval = req.body.silenceRemoval !== 'false';
  const autoCaptions = req.body.autoCaptions === 'true';
  const autoZoom = req.body.autoZoom === 'true';
  const zoomIntensity = req.body.zoomIntensity || 'balanced';

  // إنشاء المهمة وحفظ الحالة الأولية
  storeJob(jobId, {
    status: 'queued',
    progress: 0,
    originalName: req.file.originalname,
    inputPath,
    silenceRemoval,
    autoCaptions,
    autoZoom,
    zoomIntensity
  });

  try {
    // دفع المهمة للطابور الأول والرد الفوري على العميل
    await queueManager.addJob('UploadQueue', 'prepare', {
      jobId,
      inputPath,
      audioPath,
      language,
      silenceThreshold,
      silenceRemoval,
      autoCaptions,
      autoZoom,
      zoomIntensity
    });

    res.json({
      success: true,
      jobId,
      status: 'queued',
      message: 'تم استلام الفيديو بنجاح ووضعه في طابور المعالجة.'
    });
  } catch (err) {
    console.error('Error queueing job:', err.message);
    tryDelete(inputPath, audioPath);
    res.status(500).json({ error: 'فشل وضع المهمة في الطابور.' });
  }
});


// 2. الاستعلام عن تفاصيل حالة المعالجة ومخرجات التحليل (Polling)
app.get('/api/job/:jobId/status', (req, res) => {
  const job = jobStore.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'الجلسة غير موجودة أو انتهت صلاحيتها.' });
  }

  res.json({
    jobId: req.params.jobId,
    status: job.status,
    progress: job.progress || 0,
    timeline: job.timeline || null,
    captions: job.captions || null,
    zoomKeyframes: job.zoomKeyframes || null,
    stats: job.stats || null,
    streamUrl: `http://localhost:3000/api/stream/${req.params.jobId}`
  });
});

// 3. جلب تفضيلات التعديل للمستخدم
app.get('/api/preferences', async (req, res) => {
  const userId = req.query.userId || 'default_user';
  const prefs = await memoryService.getUserPreferences(userId);
  res.json(prefs);
});

// 4. تحديث تفضيلات التعديل للمستخدم
app.post('/api/preferences', async (req, res) => {
  const userId = req.body.userId || 'default_user';
  const newPrefs = req.body.preferences || {};
  try {
    const updated = await memoryService.updateUserPreferences(userId, newPrefs);
    res.json({ success: true, preferences: updated });
  } catch (err) {
    res.status(500).json({ error: 'فشل حفظ التفضيلات.' });
  }
});

// 5. بث مقطع الفيديو الأصلي للمعاينة التفاعلية
app.get('/api/stream/:jobId', (req, res) => {
  const job = jobStore.get(req.params.jobId);
  if (!job) {
    return res.status(404).end('Video not found or expired');
  }
  const videoPath = job.trimmedPath || job.inputPath;
  if (!fs.existsSync(videoPath)) {
    return res.status(404).end('Video file not found or expired');
  }

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(videoPath).pipe(res);
  }
});

// 6. بدء عملية التصدير والقطع الفعلي (Async Export Request)
app.post('/api/render/:jobId', async (req, res) => {
  const jobId = req.params.jobId;
  const job = jobStore.get(jobId);
  if (!job || !fs.existsSync(job.inputPath)) {
    return res.status(404).json({ error: 'الجلسة غير موجودة أو انتهت صلاحيتها.' });
  }

  const userTimeline = req.body.timeline;
  if (!userTimeline || !Array.isArray(userTimeline)) {
    return res.status(400).json({ error: 'بيانات الخط الزمني مفقودة.' });
  }

  const keepSegments = userTimeline.filter(s => s.type === 'keep' && (s.end - s.start) > 0.05);
  const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const userCaptions = req.body.captions;
  const captionStyle = req.body.captionStyle;
  const zoomKeyframes = req.body.zoomKeyframes;

  updateExportStatus(exportId, 'queued', { progress: 0 });

  try {
    // دفع مهمة التصدير إلى ExportQueue
    await queueManager.addJob('ExportQueue', 'render', {
      exportId,
      jobId,
      keepSegments,
      captions: userCaptions,
      captionStyle,
      zoomKeyframes
    });

    res.json({
      success: true,
      exportId,
      status: 'queued',
      message: 'بدأت عملية التصدير في الخلفية بنجاح.'
    });
  } catch (err) {
    res.status(500).json({ error: 'فشل جدولة عملية التصدير.' });
  }
});

// 7. الاستعلام عن حالة تصدير الفيديو
app.get('/api/export/:exportId/status', (req, res) => {
  const exp = exportStore.get(req.params.exportId);
  if (!exp) {
    return res.status(404).json({ error: 'طلب التصدير غير موجود.' });
  }
  res.json(exp);
});

// 8. تحميل الفيديو النهائي وتنزيل التصدير بالصيغ المختلفة
app.all('/api/export/:jobId/:format', express.json(), (req, res) => {
  const { jobId, format } = req.params;
  const job = jobStore.get(jobId);

  if (!job && format !== 'mp4') {
    return res.status(404).json({ error: 'الجلسة غير موجودة.' });
  }

  let keepSegments = job?.keepSegments || [];
  if (req.method === 'POST' && req.body && req.body.timeline) {
    keepSegments = req.body.timeline.filter(s => s.type === 'keep');
  }

  const originalName = job?.originalName || 'video.mp4';
  const outputPath = job?.outputPath || path.join(__dirname, 'output', `clean_${jobId}.mp4`);

  if (format === 'mp4') {
    if (!fs.existsSync(outputPath)) {
      return res.status(404).json({ error: 'الملف المصدر غير موجود.' });
    }
    const stat = fs.statSync(outputPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="vireon_${jobId}.mp4"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    const stream = fs.createReadStream(outputPath);
    stream.pipe(res);
    return;
  }

  const toTimecode = (seconds, fps = 25) => {
    const totalFrames = Math.floor(seconds * fps);
    const h = Math.floor(totalFrames / (fps * 3600)).toString().padStart(2, '0');
    const m = Math.floor((totalFrames / (fps * 60)) % 60).toString().padStart(2, '0');
    const s = Math.floor((totalFrames / fps) % 60).toString().padStart(2, '0');
    const f = (totalFrames % fps).toString().padStart(2, '0');
    return `${h}:${m}:${s}:${f}`;
  };

  if (format === 'edl') {
    let edlStr = `TITLE: Vireon Export\r\nFCM: NON-DROP FRAME\r\n\r\n`;
    let recordTime = 0;
    keepSegments.forEach((seg, i) => {
      const idx = (i + 1).toString().padStart(3, '0');
      const inSrc = toTimecode(seg.start);
      const outSrc = toTimecode(seg.end);
      const duration = seg.end - seg.start;
      const inRec = toTimecode(recordTime);
      const outRec = toTimecode(recordTime + duration);
      
      edlStr += `${idx}  AX       V     C        ${inSrc} ${outSrc} ${inRec} ${outRec}\r\n`;
      edlStr += `* FROM CLIP NAME: ${originalName}\r\n\r\n`;
      recordTime += duration;
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="vireon_${jobId}.edl"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(edlStr);
  }

  if (format === 'xml') {
    const fps = 25;
    let xmlStr = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="4">\n<sequence>\n<name>Vireon Sequence</name>\n<rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>\n<media>\n<video>\n<format>\n<samplecharacteristics>\n<width>1920</width><height>1080</height>\n</samplecharacteristics>\n</format>\n<track>\n`;
    
    let recordFrame = 0;
    keepSegments.forEach((seg, i) => {
      const inFrame = Math.floor(seg.start * fps);
      const outFrame = Math.floor(seg.end * fps);
      const durFrames = outFrame - inFrame;
      
      xmlStr += `  <clipitem id="clipitem-${i}">\n`;
      xmlStr += `    <name>${originalName}</name>\n`;
      xmlStr += `    <rate><timebase>${fps}</timebase></rate>\n`;
      xmlStr += `    <start>${recordFrame}</start>\n`;
      xmlStr += `    <end>${recordFrame + durFrames}</end>\n`;
      xmlStr += `    <in>${inFrame}</in>\n`;
      xmlStr += `    <out>${outFrame}</out>\n`;
      xmlStr += `    <file id="file-1">\n`;
      xmlStr += `      <name>${originalName}</name>\n`;
      xmlStr += `    </file>\n`;
      xmlStr += `  </clipitem>\n`;
      recordFrame += durFrames;
    });
    xmlStr += `</track>\n</video>\n</media>\n</sequence>\n</xmeml>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="vireon_${jobId}.xml"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.send(xmlStr);
  }

  return res.status(400).json({ error: 'صيغة التصدير غير مدعومة.' });
});
// 8.5 إحصاءات الإدارة وإدارة مفاتيح الـ API (Platform Admin Endpoints)
app.get('/api/admin/metrics', async (req, res) => {
  try {
    const statsPath = path.join(__dirname, 'data/system_stats.json');
    let stats = { totalDurationSeconds: 0, jobsCount: 0 };
    if (fs.existsSync(statsPath)) {
      try {
        stats = JSON.parse(fs.readFileSync(statsPath, 'utf8'));
      } catch (_) {}
    }

    const totalSeconds = stats.totalDurationSeconds || 0;
    // Whisper API: $0.006 per minute = $0.0001 per second
    // Gemini Flash: $0.000075 per 1k input tokens (cleanup is cheap, let's estimate $0.0001 per second)
    // Combined API cost: $0.0002 per second of video processed
    const apiCost = parseFloat((totalSeconds * 0.0002).toFixed(4));

    const activeKeys = [];
    if (process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY) activeKeys.push('OpenAI/Whisper');
    if (process.env.GEMINI_API_KEY) activeKeys.push('Gemini AI');
    
    res.json({
      success: true,
      totalDurationSeconds: totalSeconds,
      jobsCount: stats.jobsCount,
      apiCost,
      activeKeysCount: activeKeys.length,
      activeKeys
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/rotate-keys', async (req, res) => {
  const { openaiKey, geminiKey } = req.body;
  try {
    if (openaiKey !== undefined) {
      process.env.VITE_OPENAI_API_KEY = openaiKey;
      process.env.OPENAI_API_KEY = openaiKey;
    }
    if (geminiKey !== undefined) {
      process.env.GEMINI_API_KEY = geminiKey;
    }

    const envPath = path.join(__dirname, '.env');
    let envLines = [];
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      envLines = content.split('\n');
    }

    const updateEnvVar = (key, value) => {
      const index = envLines.findIndex(line => line.startsWith(`${key}=`));
      if (index !== -1) {
        envLines[index] = `${key}=${value}`;
      } else {
        envLines.push(`${key}=${value}`);
      }
    };

    if (openaiKey !== undefined) {
      updateEnvVar('OPENAI_API_KEY', openaiKey);
      updateEnvVar('VITE_OPENAI_API_KEY', openaiKey);
    }
    if (geminiKey !== undefined) {
      updateEnvVar('GEMINI_API_KEY', geminiKey);
    }

    fs.writeFileSync(envPath, envLines.join('\n'), 'utf8');

    // Reload active AI providers dynamically
    if (process.env.GEMINI_API_KEY) {
      activeProvider = new GeminiProvider(process.env.GEMINI_API_KEY);
      console.log('[Vireon Admin] Active Provider reloaded: Gemini AI ✅');
    } else if (process.env.OPENAI_API_KEY) {
      activeProvider = new OpenAIProvider(process.env.OPENAI_API_KEY);
      console.log('[Vireon Admin] Active Provider reloaded: OpenAI GPT 🧠');
    }

    res.json({
      success: true,
      message: 'تم تحديث وتدوير مفاتيح الـ API بنجاح وحفظها في ملف البيئة.',
      activeKeysCount: (process.env.OPENAI_API_KEY ? 1 : 0) + (process.env.GEMINI_API_KEY ? 1 : 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 9. التحقق من سلامة الخادم (Health Check)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    apiProvider: activeProvider ? activeProvider.constructor.name : 'none',
    useRedis: queueManager.useRedis,
    ffmpeg: true
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Vireon Backend Service running on http://localhost:${PORT}`);
  console.log(`   Running Mode: ${activeProvider ? activeProvider.constructor.name : 'No-AI offline'}`);
  console.log(`   Queue Engine: ${queueManager.useRedis ? 'Redis/BullMQ' : 'In-Memory Async Queue'}\n`);
});
