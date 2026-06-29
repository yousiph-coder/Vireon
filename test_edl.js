const keepSegments = [{start: 0, end: 2.5}, {start: 5.4, end: 8.0}];
const originalName = 'original_video.mp4';
const toTimecode = (seconds, fps = 25) => {
  const totalFrames = Math.floor(seconds * fps);
  const h = Math.floor(totalFrames / (fps * 3600)).toString().padStart(2, '0');
  const m = Math.floor((totalFrames / (fps * 60)) % 60).toString().padStart(2, '0');
  const s = Math.floor((totalFrames / fps) % 60).toString().padStart(2, '0');
  const f = (totalFrames % fps).toString().padStart(2, '0');
  return `${h}:${m}:${s}:${f}`;
};
let edlStr = `TITLE: CutFlow Export\nFCM: NON-DROP FRAME\n\n`;
let recordTime = 0;
keepSegments.forEach((seg, i) => {
  const idx = (i + 1).toString().padStart(3, '0');
  const inSrc = toTimecode(seg.start);
  const outSrc = toTimecode(seg.end);
  const duration = seg.end - seg.start;
  const inRec = toTimecode(recordTime);
  const outRec = toTimecode(recordTime + duration);
  edlStr += `${idx}  AX       V     C        ${inSrc} ${outSrc} ${inRec} ${outRec}\n`;
  edlStr += `* FROM CLIP NAME: ${originalName}\n\n`;
  recordTime += duration;
});
console.log(edlStr);
