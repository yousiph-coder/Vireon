import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

const VideoPlayer = forwardRef(({
  videoUrl,
  currentTime,
  isPlaying,
  duration,
  segments,
  onTimeUpdate,
  onPlayPause,
  onDurationChange,
  // Caption props
  captions = [],
  captionsEnabled = false,
  captionStyle = {},
  // Zoom props
  zoomKeyframes = [],
  autoZoomEnabled = false
}, ref) => {
  const videoRef = useRef(null);
  const playheadSyncRef = useRef(null);

  // Timecode formatter: HH:MM:SS:FF (at 30fps)
  const formatTimecode = (secs) => {
    if (isNaN(secs) || secs === Infinity) secs = 0;
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const f = Math.floor((secs % 1) * 30);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
  };

  useImperativeHandle(ref, () => ({
    seekTo: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    }
  }));

  // Sync play/pause state
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().catch(() => onPlayPause(false));
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, onPlayPause]);

  // RequestAnimationFrame loop for high-precision playhead tracking
  useEffect(() => {
    const syncPlayhead = () => {
      if (videoRef.current && isPlaying) {
        const t = videoRef.current.currentTime;
        
        // Skip logic: if the current time falls inside a removed segment, skip past it
        const currentSeg = segments.find(s => t >= s.start && t < s.end);
        if (currentSeg && currentSeg.type === 'remove') {
          videoRef.current.currentTime = currentSeg.end;
          onTimeUpdate(currentSeg.end);
        } else {
          onTimeUpdate(t);
        }
      }
      playheadSyncRef.current = requestAnimationFrame(syncPlayhead);
    };

    if (isPlaying) {
      playheadSyncRef.current = requestAnimationFrame(syncPlayhead);
    } else {
      if (playheadSyncRef.current) cancelAnimationFrame(playheadSyncRef.current);
    }

    return () => {
      if (playheadSyncRef.current) cancelAnimationFrame(playheadSyncRef.current);
    };
  }, [isPlaying, segments, onTimeUpdate]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      onDurationChange(videoRef.current.duration);
    }
  };

  const handleTimeUpdate = () => {
    // Fallback time sync when not playing
    if (videoRef.current && !isPlaying) {
      onTimeUpdate(videoRef.current.currentTime);
    }
  };

  const handleVolumeChange = (e) => {
    if (videoRef.current) {
      videoRef.current.volume = parseFloat(e.target.value);
    }
  };

  const togglePlay = () => {
    onPlayPause(!isPlaying);
  };

  const seekRelative = (delta) => {
    if (videoRef.current) {
      const target = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
      videoRef.current.currentTime = target;
      onTimeUpdate(target);
    }
  };

  const seekAbsolute = (target) => {
    if (videoRef.current) {
      videoRef.current.currentTime = target;
      onTimeUpdate(target);
    }
  };

  const getPositionStyles = (pos) => {
    switch (pos) {
      case 'top':
        return { top: '10%' };
      case 'center':
        return { top: '50%', transform: 'translate(-50%, -50%)' };
      case 'bottom':
      default:
        return { bottom: '10%' };
    }
  };

  // Find active caption cue matching playhead time
  const activeCue = captions.find(cue => currentTime >= cue.start && currentTime <= cue.end);

  // Get active zoom level based on keyframes
  const getActiveZoom = () => {
    if (!autoZoomEnabled || !zoomKeyframes || zoomKeyframes.length === 0) return 1.0;
    const active = zoomKeyframes.find(z => currentTime >= z.start && currentTime <= z.end);
    return active ? active.zoomLevel : 1.0;
  };

  return (
    <div className="cc-center-stage">
      <div className="cc-video-wrapper" style={{ position: 'relative', overflow: 'hidden' }} onClick={togglePlay}>
        <video 
          ref={videoRef}
          id="ccVideo" 
          preload="auto"
          src={videoUrl}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          style={{ 
            width: '100%', 
            height: '100%', 
            display: 'block', 
            objectFit: 'contain',
            transform: `scale(${getActiveZoom()})`,
            transition: 'transform 0.15s ease-out'
          }}
        ></video>
        
        {/* Dynamic captions overlay in player */}
        {captionsEnabled && activeCue && (
          <div 
            className="cc-captions-overlay"
            style={{
              position: 'absolute',
              left: '50%',
              transform: captionStyle.position === 'center' ? 'translate(-50%, -50%)' : 'translateX(-50%)',
              width: '90%',
              textAlign: 'center',
              pointerEvents: 'none',
              zIndex: 20,
              fontFamily: captionStyle.fontName || 'Cairo',
              fontSize: `${captionStyle.fontSize || 24}px`,
              color: captionStyle.fontColor || '#ffffff',
              textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.9)',
              fontWeight: 'bold',
              lineHeight: '1.4',
              ...getPositionStyles(captionStyle.position)
            }}
          >
            {activeCue.text}
          </div>
        )}

        <div className={`cc-play-overlay ${isPlaying ? 'hidden' : ''}`}>▶️</div>
      </div>
      
      <div className="cc-playback-controls">
        <div className="cc-timecode" id="ccTimecode">
          {formatTimecode(currentTime)} / {formatTimecode(duration)}
        </div>
        
        <div className="cc-play-buttons">
          <button className="cc-icon-btn" title="للبداية" onClick={() => seekAbsolute(0)}>⏮</button>
          <button className="cc-icon-btn" title="رجوع 5 ثواني" onClick={() => seekRelative(-5)}>⏪</button>
          <button className="cc-icon-btn cc-play-pause" title="تشغيل/إيقاف (Space)" onClick={togglePlay}>
            {isPlaying ? '⏸' : '▶️'}
          </button>
          <button className="cc-icon-btn" title="تقديم 5 ثواني" onClick={() => seekRelative(5)}>⏩</button>
          <button className="cc-icon-btn" title="للنهاية" onClick={() => seekAbsolute(duration)}>⏭</button>
        </div>

        <div className="cc-volume-control">
          <span style={{ fontSize: '1.2rem' }}>🔊</span>
          <input 
            type="range" 
            id="ccVolume" 
            min="0" 
            max="1" 
            step="0.1" 
            defaultValue="1" 
            onChange={handleVolumeChange}
          />
        </div>
      </div>
    </div>
  );
});

VideoPlayer.displayName = 'VideoPlayer';
export default VideoPlayer;
