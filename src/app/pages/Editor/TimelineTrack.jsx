import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from '../../context/I18nContext';

const PX_PER_SEC_BASE = 100;

export default function TimelineTrack({
  segments,
  zoomLevel,
  currentTime,
  duration,
  bladeMode,
  selectedIds,
  onSegmentClick,
  onBladeCut,
  onTrimSegment,
  onPlayheadSeek,
  onZoomChange,
  onToggleSegment,
  onContextMenu
}) {
  const { lang } = useTranslation();
  const scrollAreaRef = useRef(null);
  const canvasRef = useRef(null);
  const isScrubbingRef = useRef(false);
  const isDraggingPlayheadRef = useRef(false);

  // Trimming interaction state
  const [trimming, setTrimming] = useState(null); // { index, side, initialStart, initialEnd, startX }
  const [trimGhost, setTrimGhost] = useState(null); // { index, start, end }

  const pxPerSec = PX_PER_SEC_BASE * zoomLevel;
  const canvasWidth = Math.max(duration * pxPerSec, 800);

  // Time formatter: MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 1. Generate ruler ticks dynamically
  const renderRulerTicks = () => {
    const ticks = [];
    let interval = 10;
    if (zoomLevel >= 2) {
      interval = 1;
    } else if (zoomLevel >= 0.5) {
      interval = 5;
    }

    const maxTime = Math.ceil(duration || 0);
    for (let t = 0; t <= maxTime; t += interval) {
      ticks.push(
        <div 
          key={t} 
          className="cc-tick" 
          style={{ left: `${t * pxPerSec}px`, position: 'absolute' }}
        >
          <span>{formatTime(t)}</span>
        </div>
      );
    }
    return ticks;
  };

  // 2. Playhead auto-scroll during playback
  useEffect(() => {
    if (!scrollAreaRef.current) return;
    const scrollArea = scrollAreaRef.current;
    const playheadPos = currentTime * pxPerSec;
    const scrollLeft = scrollArea.scrollLeft;
    const visibleWidth = scrollArea.clientWidth;

    // If playhead goes out of visible viewport, scroll it into center view
    if (playheadPos > scrollLeft + visibleWidth - 80 || playheadPos < scrollLeft + 20) {
      scrollArea.scrollLeft = Math.max(0, playheadPos - visibleWidth / 2);
    }
  }, [currentTime, pxPerSec]);

  // 3. Ruler scrubbing mouse interactions
  const handleRulerMouseDown = (e) => {
    isScrubbingRef.current = true;
    handleScrub(e);
    window.addEventListener('mousemove', handleRulerMouseMove);
    window.addEventListener('mouseup', handleRulerMouseUp);
  };

  const handleRulerMouseMove = (e) => {
    if (isScrubbingRef.current) {
      handleScrub(e);
    }
  };

  const handleRulerMouseUp = () => {
    isScrubbingRef.current = false;
    window.removeEventListener('mousemove', handleRulerMouseMove);
    window.removeEventListener('mouseup', handleRulerMouseUp);
  };

  const handleScrub = (e) => {
    if (!scrollAreaRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const time = Math.max(0, Math.min(duration, x / pxPerSec));
    onPlayheadSeek(time);
  };

  // 4. Playhead drag handlers
  const handlePlayheadMouseDown = (e) => {
    e.stopPropagation();
    isDraggingPlayheadRef.current = true;
    window.addEventListener('mousemove', handlePlayheadMouseMove);
    window.addEventListener('mouseup', handlePlayheadMouseUp);
  };

  const handlePlayheadMouseMove = (e) => {
    if (isDraggingPlayheadRef.current) {
      handleScrub(e);
    }
  };

  const handlePlayheadMouseUp = () => {
    isDraggingPlayheadRef.current = false;
    window.removeEventListener('mousemove', handlePlayheadMouseMove);
    window.removeEventListener('mouseup', handlePlayheadMouseUp);
  };

  // 5. Segment click / blade-cut click
  const handleSegmentClick = (idx, seg, e) => {
    if (bladeMode) {
      e.stopPropagation();
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const cutTime = seg.start + (clickX / pxPerSec);
      onBladeCut(cutTime);
    } else {
      onSegmentClick(idx);
    }
  };

  // 6. Trimming dragging implementation
  const handleTrimMouseDown = (idx, side, e) => {
    e.stopPropagation();
    const seg = segments[idx];
    setTrimming({
      index: idx,
      side,
      initialStart: seg.start,
      initialEnd: seg.end,
      startX: e.clientX
    });
    setTrimGhost({
      index: idx,
      start: seg.start,
      end: seg.end
    });
  };

  useEffect(() => {
    if (!trimming) return;

    const handleMouseMove = (e) => {
      const deltaX = e.clientX - trimming.startX;
      const deltaSec = deltaX / pxPerSec;
      const seg = segments[trimming.index];
      
      const prevSeg = segments[trimming.index - 1];
      const nextSeg = segments[trimming.index + 1];

      const minStart = prevSeg ? prevSeg.end : 0;
      const maxEnd = nextSeg ? nextSeg.start : duration;

      if (trimming.side === 'left') {
        const newStart = Math.max(minStart, Math.min(trimming.initialEnd - 0.1, trimming.initialStart + deltaSec));
        setTrimGhost({
          index: trimming.index,
          start: newStart,
          end: trimming.initialEnd
        });
      } else {
        const newEnd = Math.max(trimming.initialStart + 0.1, Math.min(maxEnd, trimming.initialEnd + deltaSec));
        setTrimGhost({
          index: trimming.index,
          start: trimming.initialStart,
          end: newEnd
        });
      }
    };

    const handleMouseUp = () => {
      if (trimGhost) {
        onTrimSegment(trimGhost.index, trimGhost.start, trimGhost.end);
      }
      setTrimming(null);
      setTrimGhost(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [trimming, pxPerSec, segments, duration, onTrimSegment, trimGhost]);

  // 7. Middle click panning or zoom wheel key handlers
  const handleWheel = (e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
      onZoomChange(zoomLevel * zoomFactor);
    }
  };

  return (
    <div className="cc-timeline-area">
      {/* Zoom / Blade Toolbar */}
      <div className="cc-timeline-toolbar">
        <div className="cc-timeline-tools">
          <button 
            className={`cc-icon-btn ${bladeMode ? 'active' : ''}`} 
            title={lang === 'ar' ? 'وضع الشفرة (B)' : 'Blade Mode (B)'}
            onClick={onBladeCut ? () => onZoomChange(zoomLevel) /* Toggle helper */ : null}
            style={{ background: bladeMode ? 'rgba(139,92,246,0.3)' : '' }}
          >
            🔪
          </button>
          {bladeMode && <span className="cc-blade-label">{lang === 'ar' ? 'وضع الشفرة نشط' : 'Blade Mode Active'}</span>}
        </div>
        <div className="cc-zoom-controls">
          <button className="cc-icon-btn" title="تصغير (-)" onClick={() => onZoomChange(zoomLevel / 1.25)}>🔍-</button>
          <input 
            type="range" 
            min="0.1" 
            max="10" 
            step="0.1" 
            value={zoomLevel} 
            style={{ width: '80px' }} 
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
          />
          <button className="cc-icon-btn" title="تكبير (+)" onClick={() => onZoomChange(zoomLevel * 1.25)}>🔍+</button>
          <span style={{ fontSize: '0.75rem', color: '#aaa', minWidth: '30px' }}>{zoomLevel.toFixed(1)}x</span>
        </div>
      </div>

      {/* Scrollable Tracks Canvas Container */}
      <div 
        ref={scrollAreaRef}
        className="cc-timeline-scroll-area" 
        id="ccTimelineScrollArea"
        onWheel={handleWheel}
      >
        <div 
          ref={canvasRef}
          className="cc-timeline-canvas" 
          id="ccTimelineCanvas"
          style={{ width: `${canvasWidth}px`, position: 'relative', height: '100px' }}
        >
          {/* Timeline Ruler */}
          <div 
            className="cc-ruler" 
            id="ccRuler"
            style={{ height: '30px', position: 'relative', background: '#120f1d', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'ew-resize' }}
            onMouseDown={handleRulerMouseDown}
          >
            {renderRulerTicks()}
          </div>

          {/* Tracks Container */}
          <div className="cc-tracks" style={{ position: 'relative', height: '65px', marginTop: '5px' }}>
            <div className="cc-track cc-video-track" id="ccTrackVideo" style={{ position: 'relative', height: '60px', background: 'rgba(255,255,255,0.01)' }}>
              
              {/* Segments Mapping */}
              {segments.map((seg, idx) => {
                const isSelected = selectedIds.includes(idx);
                const isTrimmingThis = trimGhost && trimGhost.index === idx;

                const start = isTrimmingThis ? trimGhost.start : seg.start;
                const end = isTrimmingThis ? trimGhost.end : seg.end;

                const left = start * pxPerSec;
                const width = Math.max((end - start) * pxPerSec, 2);

                return (
                  <div
                    key={seg.id || idx}
                    className={`cc-segment ${seg.type} ${isSelected && !bladeMode ? 'selected' : ''}`}
                    style={{
                      position: 'absolute',
                      left: `${left}px`,
                      width: `${width}px`,
                      height: '100%',
                      top: '0',
                      cursor: bladeMode ? 'cell' : 'pointer'
                    }}
                    onClick={(e) => handleSegmentClick(idx, seg, e)}
                    onContextMenu={(e) => onContextMenu(idx, e)}
                  >
                    {/* Left Trim Handle (Matches Original Layout & Styling) */}
                    {isSelected && !bladeMode && selectedIds.length === 1 && (
                      <div 
                        className="handle left"
                        onMouseDown={(e) => handleTrimMouseDown(idx, 'left', e)}
                        style={{ background: 'rgba(234,179,8,0.5)', width: '12px', cursor: 'col-resize', position: 'absolute', top: 0, bottom: 0, left: 0, zIndex: 10 }}
                      ></div>
                    )}

                    {/* Segment Label (Formatted like original with seg-label class and text shadow) */}
                    {width > 30 && (
                      <div 
                        className="seg-label"
                        style={{ 
                          padding: '3px 5px', 
                          fontSize: '10px', 
                          color: seg.type === 'keep' ? '#ffffff' : '#ff9999', 
                          textShadow: '0 1px 2px #000', 
                          pointerEvents: 'none', 
                          userSelect: 'none', 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden' 
                        }}
                      >
                        {(end - start).toFixed(1)}s
                      </div>
                    )}

                    {/* Right Trim Handle (Matches Original Layout & Styling) */}
                    {isSelected && !bladeMode && selectedIds.length === 1 && (
                      <div 
                        className="handle right"
                        onMouseDown={(e) => handleTrimMouseDown(idx, 'right', e)}
                        style={{ background: 'rgba(234,179,8,0.5)', width: '12px', cursor: 'col-resize', position: 'absolute', top: 0, bottom: 0, right: 0, zIndex: 10 }}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Playhead */}
          <div 
            className="cc-playhead-line" 
            id="ccPlayhead"
            style={{ 
              left: `${currentTime * pxPerSec}px`, 
              position: 'absolute', 
              top: 0, 
              bottom: 0, 
              width: '2px', 
              background: '#EF4444', 
              zIndex: 10,
              pointerEvents: 'none'
            }}
          >
            <div 
              className="cc-playhead-head"
              style={{
                width: '10px',
                height: '14px',
                background: '#EF4444',
                position: 'absolute',
                top: 0,
                left: '-4px',
                cursor: 'ew-resize',
                clipPath: 'polygon(0% 0%, 100% 0%, 100% 60%, 50% 100%, 0% 60%)',
                pointerEvents: 'auto'
              }}
              onMouseDown={handlePlayheadMouseDown}
            ></div>
          </div>

        </div>
      </div>
    </div>
  );
}
