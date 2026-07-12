import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

export default function ExportMenu({ 
  jobId, 
  segments, 
  captions = [], 
  captionStyle = {}, 
  captionsEnabled = false,
  zoomKeyframes = [],
  autoZoomEnabled = false
}) {
  const { showToast } = useToast();
  const { lang } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const menuRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    // Close dropdown on click outside
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const triggerFileDownload = (url, filename) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => document.body.removeChild(a), 200);
  };

  const handleExportMP4 = async () => {
    setIsOpen(false);
    const keepSegments = segments.filter(s => s.type === 'keep');
    if (keepSegments.length === 0) {
      showToast(lang === 'ar' ? 'خطأ: لا يوجد مقاطع للإبقاء عليها وتصديرها.' : 'Error: No segments to keep.', 'error');
      return;
    }

    setIsRendering(true);
    setRenderProgress(0);
    showToast(lang === 'ar' ? 'جاري بدء عملية تصدير الفيديو من الخادم... 🚀' : 'Starting video render on server... 🚀', 'info');

    const payload = {
      timeline: keepSegments,
      captions: captionsEnabled ? captions : null,
      captionStyle: captionsEnabled ? captionStyle : null,
      zoomKeyframes: autoZoomEnabled ? zoomKeyframes : null
    };

    try {
      const res = await fetch(`/api/render/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to trigger render');
      }

      const { exportId } = await res.json();

      let isCompleted = false;
      pollIntervalRef.current = setInterval(async () => {
        if (isCompleted) {
          clearInterval(pollIntervalRef.current);
          return;
        }

        try {
          const statusRes = await fetch(`/api/export/${exportId}/status`);
          if (!statusRes.ok) return;
          const statusData = await statusRes.json();

          setRenderProgress(statusData.progress || 0);

          if (statusData.status === 'completed') {
            isCompleted = true;
            clearInterval(pollIntervalRef.current);
            setIsRendering(false);
            showToast(lang === 'ar' ? 'اكتمل تصدير الفيديو بنجاح! 🎬' : 'Video exported successfully! 🎬', 'success');
            
            // Trigger actual download of the MP4
            triggerFileDownload(`/api/export/${jobId}/mp4`, 'vireon_export.mp4');
          } else if (statusData.status === 'failed') {
            isCompleted = true;
            clearInterval(pollIntervalRef.current);
            setIsRendering(false);
            showToast(lang === 'ar' ? 'فشل تصدير الفيديو على الخادم.' : 'Video export failed on server.', 'error');
          }
        } catch (e) {
          console.error(e);
        }
      }, 2000);

    } catch (err) {
      console.error(err);
      setIsRendering(false);
      showToast(lang === 'ar' ? 'حدث خطأ أثناء التصدير.' : 'Error occurred during export.', 'error');
    }
  };

  const handleExportFormat = async (format) => {
    setIsOpen(false);
    showToast(lang === 'ar' ? `جاري تصدير مشروع ${format.toUpperCase()}... 📁` : `Exporting ${format.toUpperCase()} project... 📁`, 'info');

    try {
      const res = await fetch(`/api/export/${jobId}/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segments })
      });

      if (!res.ok) {
        throw new Error(`Failed to export as ${format}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      triggerFileDownload(url, `vireon_export.${format}`);
      showToast(lang === 'ar' ? `تم تصدير مشروع ${format.toUpperCase()} وتحميله! ✅` : `Exported ${format.toUpperCase()} project successfully! ✅`, 'success');
    } catch (err) {
      console.error(err);
      showToast(lang === 'ar' ? 'حدث خطأ أثناء تصدير ملفات المونتاج.' : 'Error exporting timeline files.', 'error');
    }
  };

  const formatSRTTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };

  const handleExportSRT = () => {
    setIsOpen(false);
    showToast(lang === 'ar' ? 'جاري إنشاء ملف الترجمة SRT... 📝' : 'Generating SRT subtitles... 📝', 'info');

    let srt = '';
    
    if (captions && captions.length > 0) {
      captions.forEach((cue, idx) => {
        const startStr = formatSRTTime(cue.start);
        const endStr = formatSRTTime(cue.end);
        srt += `${idx + 1}\n${startStr} --> ${endStr}\n${cue.text}\n\n`;
      });
    } else {
      const keepSegs = segments.filter(s => s.type === 'keep');
      keepSegs.forEach((seg, idx) => {
        const startStr = formatSRTTime(seg.start);
        const endStr = formatSRTTime(seg.end);
        srt += `${idx + 1}\n${startStr} --> ${endStr}\nالمقطع رقم ${idx + 1}\n\n`;
      });
    }
    
    const blob = new Blob([srt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    triggerFileDownload(url, 'vireon_subtitles.srt');
    showToast(lang === 'ar' ? 'تم تحميل ملف الترجمة SRT بنجاح! ✅' : 'SRT subtitles downloaded! ✅', 'success');
  };

  return (
    <div className="cc-export-wrapper" ref={menuRef} style={{ position: 'relative' }}>
      <button className="btn btn-primary cc-btn-export" onClick={() => setIsOpen(!isOpen)} style={{ cursor: 'pointer' }}>
        📤 {lang === 'ar' ? 'تصدير' : 'Export'}
      </button>

      {isOpen && (
        <div 
          className="cc-dropdown-menu" 
          style={{ 
            position: 'absolute', 
            top: '105%', 
            right: 0, 
            display: 'block', 
            zIndex: 9999,
            background: 'var(--bg-3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
            minWidth: '220px'
          }}
        >
          <div className="cc-dropdown-item" onClick={handleExportMP4} style={{ cursor: 'pointer', padding: '10px 15px', color: '#fff' }}>
            {lang === 'ar' ? 'تصدير MP4 (Render)' : 'Export MP4 (Render)'}
          </div>
          <div className="cc-dropdown-item" onClick={() => handleExportFormat('xml')} style={{ cursor: 'pointer', padding: '10px 15px', color: '#fff' }}>
            {lang === 'ar' ? 'تصدير مشروع XML (Premiere)' : 'Export XML Project (Premiere)'}
          </div>
          <div className="cc-dropdown-item" onClick={() => handleExportFormat('edl')} style={{ cursor: 'pointer', padding: '10px 15px', color: '#fff' }}>
            {lang === 'ar' ? 'تصدير مشروع EDL (DaVinci)' : 'Export EDL Project (DaVinci)'}
          </div>
          <div className="cc-dropdown-item" onClick={handleExportSRT} style={{ cursor: 'pointer', padding: '10px 15px', color: '#fff' }}>
            {lang === 'ar' ? 'تصدير ترجمة SRT' : 'Export Subtitles (SRT)'}
          </div>
        </div>
      )}

      {/* Render Progress Overlay */}
      {isRendering && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            zIndex: 99999, 
            background: 'rgba(0, 0, 0, 0.85)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <div 
            className="glass-panel" 
            style={{ 
              background: 'var(--bg-2)', 
              borderRadius: 'var(--radius-lg)', 
              padding: '2.5rem', 
              textAlign: 'center', 
              minWidth: '350px',
              border: '1px solid var(--border)'
            }}
          >
            <h3 style={{ color: 'var(--text)', marginBottom: '1.2rem', fontWeight: '500' }}>
              {lang === 'ar' ? 'جاري تصدير الفيديو وتجميعه...' : 'Exporting and rendering video...'}
            </h3>
            <div 
              style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                borderRadius: '10px', 
                height: '10px', 
                overflow: 'hidden', 
                marginBottom: '0.8rem',
                border: '1px solid rgba(255,255,255,0.05)'
              }}
            >
              <div 
                style={{ 
                  background: 'var(--gradient-primary)', 
                  height: '100%', 
                  width: `${renderProgress}%`, 
                  transition: 'width 0.3s ease' 
                }}
              ></div>
            </div>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{renderProgress}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
