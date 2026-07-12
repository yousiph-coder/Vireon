import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTimeline } from '../../hooks/useTimeline';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';
import VideoPlayer from './VideoPlayer';
import TimelineTrack from './TimelineTrack';
import ToolsPanel from './ToolsPanel';
import ExportMenu from './ExportMenu';

export default function TimelineEditor() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { lang, t } = useTranslation();
  
  // Custom hook for NLE editor state management
  const timeline = useTimeline();
  const {
    segments, undoStack, redoStack, selectedIds, zoomLevel, bladeMode,
    loadSegments, split, deleteSegment, toggleSegment, restoreSegment,
    rippleDelete, deleteForward, deleteBackward, trimSegment,
    undo, redo, setZoom, toggleBlade, selectSegment, selectAll, deselectAll
  } = timeline;

  // Local state synced with video element
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [jobId, setJobId] = useState('');

  // Captions States
  const [captions, setCaptions] = useState([]);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [captionStyle, setCaptionStyle] = useState({
    fontName: 'Cairo',
    fontSize: 24,
    fontColor: '#ffffff',
    position: 'bottom'
  });

  // Auto Zoom States
  const [zoomKeyframes, setZoomKeyframes] = useState([]);
  const [autoZoomEnabled, setAutoZoomEnabled] = useState(false);

  // Refs
  const videoPlayerRef = useRef(null);

  // Right-click context menu state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, segIdx: -1 });

  // On mount: load video, segments, captions, and zoom keyframes from localStorage
  useEffect(() => {
    document.body.classList.add('in-editor-mode');
    
    const storedUrl = localStorage.getItem('vireon_video_url');
    const storedJobId = localStorage.getItem('vireon_job_id');
    const storedSegsStr = localStorage.getItem('vireon_segments');
    const storedCaptionsStr = localStorage.getItem('vireon_captions');
    const storedCaptionsEnabled = localStorage.getItem('vireon_auto_captions_enabled') === 'true';
    const storedZoomKeyframesStr = localStorage.getItem('vireon_zoom_keyframes');
    const storedAutoZoomEnabled = localStorage.getItem('vireon_auto_zoom_enabled') === 'true';

    if (storedUrl) setVideoUrl(storedUrl);
    if (storedJobId) setJobId(storedJobId);
    
    if (storedSegsStr) {
      try {
        const segs = JSON.parse(storedSegsStr);
        loadSegments(segs);
      } catch (e) {
        console.error('Failed to parse timeline segments:', e);
      }
    } else {
      showToast(lang === 'ar' ? 'خطأ: لم يتم العثور على مقاطع فيديو معالجة.' : 'Error: No processed segments found.', 'error');
      navigate('/dashboard/editor');
    }

    if (storedCaptionsStr) {
      try {
        setCaptions(JSON.parse(storedCaptionsStr));
      } catch (e) {
        console.error('Failed to parse captions:', e);
      }
    }
    setCaptionsEnabled(storedCaptionsEnabled);

    if (storedZoomKeyframesStr) {
      try {
        setZoomKeyframes(JSON.parse(storedZoomKeyframesStr));
      } catch (e) {
        console.error('Failed to parse zoom keyframes:', e);
      }
    }
    setAutoZoomEnabled(storedAutoZoomEnabled);

    return () => {
      document.body.classList.remove('in-editor-mode');
    };
  }, [loadSegments, navigate, showToast, lang]);

  // Sync bladeMode with body class for crosshair cursor
  useEffect(() => {
    if (bladeMode) {
      document.body.classList.add('blade-mode');
    } else {
      document.body.classList.remove('blade-mode');
    }
    return () => {
      document.body.classList.remove('blade-mode');
    };
  }, [bladeMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault();
          setIsPlaying((prev) => !prev);
          break;
        case 's':
          e.preventDefault();
          split(currentTime);
          showToast(lang === 'ar' ? 'تم تقسيم المقطع مقصاً ✂️' : 'Segment split ✂️', 'success');
          break;
        case 'b':
          e.preventDefault();
          toggleBlade();
          break;
        case 'delete':
        case 'backspace':
          e.preventDefault();
          if (selectedIds.length > 0) {
            if (shift) {
              rippleDelete(selectedIds[0]);
              showToast(lang === 'ar' ? 'تم الحذف وإغلاق الفراغ ⚡' : 'Ripple deleted ⚡', 'info');
            } else {
              deleteSegment(selectedIds[0]);
              showToast(lang === 'ar' ? 'تم حذف الجزء المحدد 🗑️' : 'Segment deleted 🗑️', 'info');
            }
          }
          break;
        case 'd':
          e.preventDefault();
          if (shift) {
            deleteBackward(currentTime);
            showToast(lang === 'ar' ? 'تم حذف ما قبل المؤشر 🗑️' : 'Deleted backward from playhead 🗑️', 'info');
          } else {
            deleteForward(currentTime);
            showToast(lang === 'ar' ? 'تم حذف ما بعد المؤشر 🗑️' : 'Deleted forward from playhead 🗑️', 'info');
          }
          break;
        case 'z':
          if (ctrl) {
            e.preventDefault();
            if (shift) {
              redo();
              showToast(lang === 'ar' ? 'إعادة الخطوة ↪️' : 'Redo ↪️', 'info');
            } else {
              undo();
              showToast(lang === 'ar' ? 'تراجع ↩️' : 'Undo ↩️', 'info');
            }
          }
          break;
        case 'y':
          if (ctrl) {
            e.preventDefault();
            redo();
            showToast(lang === 'ar' ? 'إعادة الخطوة ↪️' : 'Redo ↪️', 'info');
          }
          break;
        case 'arrowleft':
          e.preventDefault();
          const skipLeft = shift ? 5 : (1 / 30);
          handleSeek(Math.max(0, currentTime - skipLeft));
          break;
        case 'arrowright':
          e.preventDefault();
          const skipRight = shift ? 5 : (1 / 30);
          handleSeek(Math.min(duration, currentTime + skipRight));
          break;
        case 'home':
          e.preventDefault();
          handleSeek(0);
          break;
        case 'end':
          e.preventDefault();
          handleSeek(duration);
          break;
        case '+':
        case '=':
          e.preventDefault();
          setZoom(zoomLevel * 1.2);
          break;
        case '-':
          e.preventDefault();
          setZoom(zoomLevel / 1.2);
          break;
        case 'escape':
          e.preventDefault();
          deselectAll();
          if (bladeMode) toggleBlade();
          break;
        case 'a':
          if (ctrl) {
            e.preventDefault();
            selectAll();
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    currentTime, duration, bladeMode, selectedIds, zoomLevel, lang,
    split, deleteSegment, rippleDelete, deleteForward, deleteBackward,
    undo, redo, setZoom, toggleBlade, selectAll, deselectAll, showToast
  ]);

  const handleSeek = (time) => {
    setCurrentTime(time);
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(time);
    }
  };

  const handleContextMenu = (idx, e) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      segIdx: idx
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, segIdx: -1 });
  };

  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) closeContextMenu();
    };
    window.addEventListener('click', handleGlobalClick);
    return () => {
      window.removeEventListener('click', handleGlobalClick);
    };
  }, [contextMenu]);

  return (
    <div id="view-timeline" className="route-view active">
      {/* Topbar */}
      <div className="cc-topbar">
        <div className="cc-topbar-left">
          <ExportMenu 
            jobId={jobId} 
            segments={segments} 
            captions={captions}
            captionStyle={captionStyle}
            captionsEnabled={captionsEnabled}
            zoomKeyframes={zoomKeyframes}
            autoZoomEnabled={autoZoomEnabled}
          />
        </div>
        
        <div className="cc-topbar-center">
          <button 
            className="cc-icon-btn" 
            disabled={undoStack.length === 0} 
            title={lang === 'ar' ? 'تراجع (Ctrl+Z)' : 'Undo (Ctrl+Z)'}
            onClick={undo}
          >
            ↩️
          </button>
          <button 
            className="cc-icon-btn" 
            disabled={redoStack.length === 0} 
            title={lang === 'ar' ? 'إعادة (Ctrl+Shift+Z)' : 'Redo (Ctrl+Shift+Z)'}
            onClick={redo}
          >
            ↪️
          </button>
        </div>

        <div className="cc-topbar-right">
          <span className="cc-project-name" id="ccProjectName">
            {lang === 'ar' ? 'مشروع بدون اسم' : 'Untitled Project'}
          </span>
          <Link to="/dashboard" className="cc-logo" id="ccBtnHome">Vireon <span>✂️</span></Link>
        </div>
      </div>

      {/* Workspace */}
      <div className="cc-workspace">
        <ToolsPanel 
          bladeMode={bladeMode}
          onSplit={() => { split(currentTime); showToast(lang === 'ar' ? 'تم التقسيم ✂️' : 'Split ✂️', 'success'); }}
          onToggleBlade={toggleBlade}
          onDelete={() => { if (selectedIds.length > 0) { deleteSegment(selectedIds[0]); showToast(lang === 'ar' ? 'تم الحذف 🗑️' : 'Deleted 🗑️', 'info'); } }}
          onRippleDelete={() => { if (selectedIds.length > 0) { rippleDelete(selectedIds[0]); showToast(lang === 'ar' ? 'تم حذف المقطع وإغلاق الفجوة ⚡' : 'Ripple deleted ⚡', 'info'); } }}
          onDeleteForward={() => { deleteForward(currentTime); showToast(lang === 'ar' ? 'تم حذف ما بعد المؤشر 🗑️' : 'Deleted forward 🗑️', 'info'); }}
          onDeleteBackward={() => { deleteBackward(currentTime); showToast(lang === 'ar' ? 'تم حذف ما قبل المؤشر 🗑️' : 'Deleted backward 🗑️', 'info'); }}
          onRestore={() => { if (selectedIds.length > 0) { restoreSegment(selectedIds[0]); showToast(lang === 'ar' ? 'تمت استعادة الجزء المحذوف ♻️' : 'Restored deleted part ♻️', 'success'); } }}
          // Caption styling props
          captionsEnabled={captionsEnabled}
          setCaptionsEnabled={setCaptionsEnabled}
          captionStyle={captionStyle}
          setCaptionStyle={setCaptionStyle}
          // Auto Zoom props
          autoZoomEnabled={autoZoomEnabled}
          setAutoZoomEnabled={setAutoZoomEnabled}
        />

        <VideoPlayer 
          ref={videoPlayerRef}
          videoUrl={videoUrl}
          currentTime={currentTime}
          isPlaying={isPlaying}
          duration={duration}
          segments={segments}
          onTimeUpdate={setCurrentTime}
          onPlayPause={setIsPlaying}
          onDurationChange={setDuration}
          // Caption props
          captions={captions}
          captionsEnabled={captionsEnabled}
          captionStyle={captionStyle}
          // Auto Zoom props
          zoomKeyframes={zoomKeyframes}
          autoZoomEnabled={autoZoomEnabled}
        />
      </div>

      {/* Timeline Bottom Area */}
      <TimelineTrack 
        segments={segments}
        zoomLevel={zoomLevel}
        currentTime={currentTime}
        duration={duration}
        bladeMode={bladeMode}
        selectedIds={selectedIds}
        onSegmentClick={selectSegment}
        onBladeCut={(cutTime) => { split(cutTime); showToast(lang === 'ar' ? 'تم تقسيم المقطع بشفرة القطع 🔪' : 'Cut segment with blade 🔪', 'success'); }}
        onTrimSegment={trimSegment}
        onPlayheadSeek={handleSeek}
        onZoomChange={setZoom}
        onToggleSegment={toggleSegment}
        onContextMenu={handleContextMenu}
      />

      {/* Right-click Context Menu */}
      {contextMenu.visible && (
        <div 
          className="cc-context-menu" 
          id="ccContextMenu"
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
            display: 'block',
            zIndex: 1000
          }}
        >
          <div className="cc-ctx-item" onClick={() => { split(currentTime); showToast(lang === 'ar' ? 'تم التقسيم ✂️' : 'Split ✂️', 'success'); }}>
            {lang === 'ar' ? '✂️ تقسيم هنا (S)' : '✂️ Split here (S)'}
          </div>
          <div className="cc-ctx-item" onClick={() => { deleteForward(currentTime); showToast(lang === 'ar' ? 'تم حذف ما بعد المؤشر 🗑️' : 'Deleted forward 🗑️', 'info'); }}>
            {lang === 'ar' ? '🗑️ حذف ما بعد المؤشر (D)' : '🗑️ Delete forward (D)'}
          </div>
          <div className="cc-ctx-item" onClick={() => { deleteBackward(currentTime); showToast(lang === 'ar' ? 'تم حذف ما قبل المؤشر 🗑️' : 'Deleted backward 🗑️', 'info'); }}>
            {lang === 'ar' ? '🗑️ حذف ما قبل المؤشر (Shift+D)' : '🗑️ Delete backward (Shift+D)'}
          </div>
          <div className="cc-ctx-item" onClick={() => { toggleSegment(contextMenu.segIdx); showToast(lang === 'ar' ? 'تم تبديل حالة القص/الاستعادة ♻️' : 'Toggled cut/keep state ♻️', 'info'); }}>
            {lang === 'ar' ? '♻️ قص / استعادة' : '♻️ Cut / Keep'}
          </div>
          <div className="cc-ctx-item" onClick={() => { deleteSegment(contextMenu.segIdx); showToast(lang === 'ar' ? 'تم حذف المقطع 🗑️' : 'Deleted segment 🗑️', 'info'); }}>
            {lang === 'ar' ? '🗑️ حذف المقطع (Del)' : '🗑️ Delete segment (Del)'}
          </div>
        </div>
      )}
    </div>
  );
}
