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
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const API_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
console.log(`[CutFlow] API Key: ${API_KEY ? '✅ Found (' + API_KEY.slice(0, 12) + '...)' : '❌ MISSING'}`);

const app = express();
app.use(cors());
app.use(express.json());

// ─── In-memory job store (jobId → { segments, duration, originalName }) ───────
const jobStore = new Map();
function storeJob(jobId, data) {
  jobStore.set(jobId, data);
  // Auto-expire after 1 hour
  setTimeout(() => jobStore.delete(jobId), 3600 * 1000);
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

// ─── Get video duration via ffprobe ─────────────────────────────────────────
function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

// ─── Extract audio (small mp3 for Whisper) ───────────────────────────────────
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

// ─── Whisper API call ────────────────────────────────────────────────────────
async function callWhisper(audioPath, language) {
  if (!API_KEY) throw new Error('NO_KEY');

  const form = new FormData();
  form.append('file', fs.createReadStream(audioPath));
  form.append('model', 'whisper-1');
  form.append('response_format', 'verbose_json');
  // word-level timestamps need timestamp_granularities
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
      timeout: 120000 // 2 min timeout
    }
  );
  return response.data;
}

// ─── FFmpeg silencedetect fallback (no Whisper needed) ───────────────────────
function detectSilenceWithFFmpeg(audioPath, silenceThreshold) {
  return new Promise((resolve) => {
    // noise < -30dB for longer than silenceThreshold seconds
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
        // Parse silence_start / silence_end from stderr
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
      .on('error', () => resolve([])) // if error, return no silences
      .run();
  });
}

// ─── Build keep segments from silence list ───────────────────────────────────
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

// ─── Build keep segments from Whisper word timestamps ────────────────────────
function wordsToKeepSegments(words, duration, silenceThreshold, removeFillers) {
  const FILLERS = new Set(['آه','يعني','امممم','اممم','آآآ','اه','إه','uh','um','like','you know','hmm','hm']);

  if (!words || words.length === 0) return [{ start: 0, end: duration }];

  const keep = [];
  let segStart = words[0].start;
  let lastEnd = words[0].end;

  // skip filler at start
  if (removeFillers && FILLERS.has(words[0].word.trim().toLowerCase())) {
    segStart = words[0].end;
  }

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const text = word.word.trim().toLowerCase();
    const gap = word.start - lastEnd;
    const isFiller = removeFillers && FILLERS.has(text);

    if (gap >= silenceThreshold || isFiller) {
      if (segStart < lastEnd) keep.push({ start: segStart, end: lastEnd });
      segStart = isFiller ? word.end : word.start;
    }
    lastEnd = Math.max(lastEnd, word.end);
  }

  if (segStart < duration) keep.push({ start: segStart, end: duration });
  return keep;
}

// ─── Build full timeline (keep + remove) ─────────────────────────────────────
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

// ─── FFmpeg cut & merge ───────────────────────────────────────────────────────
function processVideo(inputPath, outputPath, keepSegments) {
  return new Promise((resolve, reject) => {
    if (!keepSegments || keepSegments.length === 0) {
      return reject(new Error('No segments to keep'));
    }

    // Single full-video segment — just copy
    if (keepSegments.length === 1 && keepSegments[0].start === 0) {
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

    filtergraph += `${concatInputs}concat=n=${keepSegments.length}:v=1:a=1[outv][outa]`;

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

// ─── Cleanup helper ───────────────────────────────────────────────────────────
function tryDelete(...paths) {
  paths.forEach(p => { try { if (fs.existsSync(p)) fs.unlinkSync(p); } catch (_) {} });
}

// ─── Main /api/process route ─────────────────────────────────────────────────
app.post('/api/process', upload.single('video'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'لم يتم استقبال ملف فيديو.' });

  const jobId      = req.file.filename.split('.')[0]; // Use filename base as unique jobId
  const inputPath  = req.file.path;
  const audioPath  = `uploads/${req.file.filename}.mp3`;
  const outputPath = `output/clean_${req.file.filename}`;

  const language         = req.body.language || 'ar';
  const silenceThreshold = Math.max(0.1, parseFloat(req.body.silenceThreshold) || 0.5);
  const removeFillers    = req.body.removeFillers === 'true';

  try {
    // ── Step 1: Get duration ──────────────────────────────────────────────────
    console.log(`\n[1/4] 📐 Getting duration of ${req.file.originalname}...`);
    const originalDuration = await getVideoDuration(inputPath);
    console.log(`      Duration: ${originalDuration.toFixed(2)}s`);

    // ── Step 2: Extract audio ────────────────────────────────────────────────
    console.log(`[2/4] 🔊 Extracting audio...`);
    await extractAudio(inputPath, audioPath);
    const audioSizeMB = (fs.statSync(audioPath).size / (1024 * 1024)).toFixed(2);
    console.log(`      Audio extracted: ${audioSizeMB} MB`);

    // ── Step 3: Transcribe / detect silences ─────────────────────────────────
    let keepSegments;
    let mode = 'whisper';

    if (!API_KEY) {
      mode = 'ffmpeg';
    } else {
      try {
        console.log(`[3/4] 🧠 Calling Whisper API (${audioSizeMB} MB audio)...`);
        const whisperData = await callWhisper(audioPath, language);
        const words = whisperData.words || [];
        console.log(`      Whisper returned ${words.length} words`);
        keepSegments = wordsToKeepSegments(words, originalDuration, silenceThreshold, removeFillers);
      } catch (apiErr) {
        const errData = apiErr?.response?.data?.error;
        const code    = errData?.code || '';
        const msg     = errData?.message || apiErr.message || '';

        if (code === 'insufficient_quota') {
          console.warn(`[3/4] ⚠️  Whisper quota exceeded — falling back to FFmpeg silencedetect`);
          mode = 'ffmpeg_quota_fallback';
        } else {
          console.error(`[3/4] ❌ Whisper error: ${msg}`);
          tryDelete(inputPath, audioPath);
          return res.status(502).json({
            error: 'فشل الاتصال بـ Whisper API.',
            details: msg,
            code
          });
        }
      }
    }

    if (mode === 'ffmpeg' || mode === 'ffmpeg_quota_fallback') {
      console.log(`[3/4] 🔍 Using FFmpeg silencedetect (threshold: ${silenceThreshold}s)...`);
      const silences = await detectSilenceWithFFmpeg(audioPath, silenceThreshold);
      console.log(`      Detected ${silences.length} silence segments`);
      keepSegments = silencesToKeepSegments(silences, originalDuration);
    }

    console.log(`      → ${keepSegments.length} keep segments initially detected`);

    // ── Step 4: Build full timeline for frontend ──────────────────────────────
    console.log(`[4/4] ⏱️  Building interactive timeline...`);
    const timeline = buildFullTimeline(keepSegments, originalDuration);

    const originalSizeMB = parseFloat((fs.statSync(inputPath).size / (1024 * 1024)).toFixed(2));

    // Save job data for the interactive session. We DON'T delete inputPath yet!
    storeJob(jobId, {
      timeline, // store full timeline
      originalDuration,
      originalName: req.file.originalname,
      inputPath: inputPath,
      audioPath: audioPath // We can delete audio, but let's keep it clean
    });

    // Cleanup audio, we don't need it anymore
    tryDelete(audioPath);

    console.log(`\n✅ Done! Analysis complete. Ready for interactive review (mode: ${mode})\n`);

    res.json({
      success: true,
      mode,
      jobId,
      streamUrl: `http://localhost:3000/api/stream/${jobId}`,
      timeline,
      stats: {
        originalDuration: parseFloat(originalDuration.toFixed(2)),
        originalSizeMB:   originalSizeMB,
        segmentsCount:    timeline.length
      }
    });

  } catch (err) {
    console.error('❌ Unhandled error:', err.message);
    tryDelete(req.file ? req.file.path : null);
    res.status(500).json({ error: 'فشلت معالجة الفيديو.', details: err.message });
  }
});

// ─── Stream original video route ──────────────────────────────────────────────
app.get('/api/stream/:jobId', (req, res) => {
  const job = jobStore.get(req.params.jobId);
  if (!job || !fs.existsSync(job.inputPath)) {
    return res.status(404).end('Video not found or expired');
  }

  const stat = fs.statSync(job.inputPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(job.inputPath, {start, end});
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
    fs.createReadStream(job.inputPath).pipe(res);
  }
});

// ─── Render MP4 route (Final step) ────────────────────────────────────────────
app.post('/api/render/:jobId', async (req, res) => {
  const jobId = req.params.jobId;
  const job = jobStore.get(jobId);
  
  if (!job || !fs.existsSync(job.inputPath)) {
    return res.status(404).json({ error: 'انتهت صلاحية الجلسة أو الملف غير موجود.' });
  }

  const userTimeline = req.body.timeline;
  if (!userTimeline || !Array.isArray(userTimeline)) {
    return res.status(400).json({ error: 'لم يتم إرسال بيانات المخطط الزمني.' });
  }

  // Extract keep segments
  const keepSegments = userTimeline.filter(s => s.type === 'keep');
  const outputPath = `output/clean_${jobId}.mp4`;

  try {
    console.log(`\n🚀 Starting Final Render for ${jobId} with ${keepSegments.length} keep segments...`);
    await processVideo(job.inputPath, outputPath, keepSegments);
    
    // Update job with outputPath and the final keepSegments so EDL/XML can use it
    job.outputPath = outputPath;
    job.keepSegments = keepSegments;
    
    // Compute final stats
    let keptDuration = 0;
    keepSegments.forEach(s => (keptDuration += s.end - s.start));
    const savedTime = Math.max(0, job.originalDuration - keptDuration);
    
    const originalSizeMB = parseFloat((fs.statSync(job.inputPath).size / (1024 * 1024)).toFixed(2));
    const finalSizeMB    = parseFloat((fs.statSync(outputPath).size / (1024 * 1024)).toFixed(2));
    const sizeSavedMB    = Math.max(0, originalSizeMB - finalSizeMB).toFixed(2);

    // We can finally delete the original input video!
    tryDelete(job.inputPath);

    console.log(`✅ Render complete! Saved ${savedTime.toFixed(1)}s — ${originalSizeMB}MB → ${finalSizeMB}MB`);

    res.json({
      success: true,
      downloadUrl: `http://localhost:3000/api/export/${jobId}/mp4`,
      stats: {
        originalDuration: parseFloat(job.originalDuration.toFixed(2)),
        finalDuration:    parseFloat(keptDuration.toFixed(2)),
        savedTime:        parseFloat(savedTime.toFixed(2)),
        originalSizeMB:   originalSizeMB,
        finalSizeMB,
        sizeSavedMB:      parseFloat(sizeSavedMB)
      }
    });

  } catch (err) {
    console.error('❌ Render error:', err);
    res.status(500).json({ error: 'فشلت معالجة الفيديو النهائية.' });
  }
});

// ─── Export route ─────────────────────────────────────────────────────────────
// Now supports POST to pass updated user timeline directly
app.all('/api/export/:jobId/:format', express.json(), (req, res) => {
  const { jobId, format } = req.params;
  const job = jobStore.get(jobId);

  if (!job && format !== 'mp4') {
    return res.status(404).json({ error: 'انتهت صلاحية الجلسة أو الملف غير موجود.' });
  }

  // Use provided timeline from POST body, fallback to job's saved segments
  let keepSegments = job?.keepSegments || [];
  if (req.method === 'POST' && req.body && req.body.timeline) {
    keepSegments = req.body.timeline.filter(s => s.type === 'keep');
  }

  const { originalName, outputPath } = job || {};

  // MP4 fallback mapping (in case job expired but file is still there)
  if (format === 'mp4') {
    const filePath = outputPath || path.join(__dirname, 'output', `clean_${jobId}.mp4`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'الملف غير موجود أو تم حذفه.' });
    }
    const stat = fs.statSync(filePath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Content-Disposition', `attachment; filename="cutflow_processed.mp4"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', () => { if (!res.headersSent) res.status(500).end(); });
    return;
  }

  // Format Timecode for EDL/XML based on exact frames
  const toTimecode = (seconds, fps = 25) => {
    const totalFrames = Math.floor(seconds * fps);
    const h = Math.floor(totalFrames / (fps * 3600)).toString().padStart(2, '0');
    const m = Math.floor((totalFrames / (fps * 60)) % 60).toString().padStart(2, '0');
    const s = Math.floor((totalFrames / fps) % 60).toString().padStart(2, '0');
    const f = (totalFrames % fps).toString().padStart(2, '0');
    return `${h}:${m}:${s}:${f}`;
  };

  // ── EDL Generator ──
  if (format === 'edl') {
    let edlStr = `TITLE: CutFlow Export\r\nFCM: NON-DROP FRAME\r\n\r\n`;
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
    res.setHeader('Content-Disposition', `attachment; filename="cutflow_export.edl"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    return res.send(edlStr);
  }

  // ── XML Generator (FCP 7 format) ──
  if (format === 'xml') {
    const fps = 25;
    let xmlStr = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="4">\n<sequence>\n<name>CutFlow Sequence</name>\n<rate><timebase>${fps}</timebase><ntsc>FALSE</ntsc></rate>\n<media>\n<video>\n<format>\n<samplecharacteristics>\n<width>1920</width><height>1080</height>\n</samplecharacteristics>\n</format>\n<track>\n`;
    
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
    res.setHeader('Content-Disposition', `attachment; filename="cutflow_export.xml"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    return res.send(xmlStr);
  }

  // ── SRT Generator (Subtitles of silences removed - roughly) ──
  if (format === 'srt') {
    let srtStr = '';
    const toSrtTime = (seconds) => {
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = Math.floor(seconds % 60).toString().padStart(2, '0');
      const ms = Math.floor((seconds % 1) * 1000).toString().padStart(3, '0');
      return `${h}:${m}:${s},${ms}`;
    };

    keepSegments.forEach((seg, i) => {
      srtStr += `${i + 1}\n`;
      srtStr += `${toSrtTime(seg.start)} --> ${toSrtTime(seg.end)}\n`;
      srtStr += `[محتوى مُحتفظ به]\n\n`;
    });

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="cutflow_export.srt"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
    return res.send(srtStr);
  }

  return res.status(400).json({ error: 'صيغة التصدير غير مدعومة.' });
});

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    apiKey: API_KEY ? 'loaded' : 'missing',
    ffmpeg: true
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 CutFlow backend running on http://localhost:${PORT}`);
  console.log(`   FFmpeg: ✅ available`);
  console.log(`   Mode:   ${API_KEY ? 'Whisper AI + FFmpeg fallback' : 'FFmpeg silencedetect only'}\n`);
});
