import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTranslation } from '../../context/I18nContext';

export default function UploadEditorView() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { lang, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  const isFullEditMode = location.pathname === '/dashboard/fulledit';
  const isEditorMode = location.pathname === '/dashboard/editor';
  const isCaptionMode = location.pathname === '/dashboard/captions';
  const isRepetitionsMode = location.pathname === '/dashboard/repetitions';

  // States
  const [phase, setPhase] = useState('upload'); // 'upload' | 'settings' | 'processing' | 'done'
  const [currentFile, setCurrentFile] = useState(null);
  const [selectedLang, setSelectedLang] = useState('ar'); // 'ar' | 'en' | 'both'
  const [silenceThreshold, setSilenceThreshold] = useState(5); // 0.5s default (stored as 5 for slider)
  const [sensitivity, setSensitivity] = useState(2); // 'متوسط' default
  const [confidence, setConfidence] = useState(85); // 85% default
  const [repetitionsHelper, setRepetitionsHelper] = useState(isFullEditMode || isRepetitionsMode);
  const [silenceRemoval, setSilenceRemoval] = useState(isFullEditMode || isEditorMode);
  const [autoCaptions, setAutoCaptions] = useState(isFullEditMode || isCaptionMode);
  const [autoZoom, setAutoZoom] = useState(isFullEditMode);
  const [zoomIntensity, setZoomIntensity] = useState('balanced'); // 'subtle' | 'balanced' | 'punchy'
  const [isDragOver, setIsDragOver] = useState(false);

  // Reset defaults when switching tabs
  useEffect(() => {
    if (isFullEditMode) {
      setSilenceRemoval(true);
      setAutoCaptions(true);
      setAutoZoom(true);
      setRepetitionsHelper(true);
    } else if (isEditorMode) {
      setSilenceRemoval(true);
      setAutoCaptions(false);
      setAutoZoom(false);
      setRepetitionsHelper(false);
    } else if (isCaptionMode) {
      setSilenceRemoval(false);
      setAutoCaptions(true);
      setAutoZoom(false);
      setRepetitionsHelper(false);
    } else if (isRepetitionsMode) {
      setSilenceRemoval(false);
      setAutoCaptions(false);
      setAutoZoom(false);
      setRepetitionsHelper(true);
    }
    setPhase('upload');
    setCurrentFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [location.pathname, isFullEditMode, isEditorMode, isCaptionMode, isRepetitionsMode]);

  // Processing state
  const [progress, setProgress] = useState(0);
  const [procTitle, setProcTitle] = useState(t('proc.uploading'));
  const [procSub, setProcSub] = useState(lang === 'ar' ? 'يرجى الانتظار، جاري نقل البيانات.' : 'Please wait, transferring files.');
  const [activeStep, setActiveStep] = useState(0); // 0, 1, 2, 3
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCurrentFile(file);
      setPhase('settings');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setCurrentFile(file);
      setPhase('settings');
    }
  };

  const handleRemoveFile = () => {
    setCurrentFile(null);
    setPhase('upload');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerProcessing = async () => {
    if (!currentFile) return;

    if (!silenceRemoval && !autoCaptions && !autoZoom && !repetitionsHelper) {
      showToast(
        lang === 'ar' 
          ? 'الرجاء اختيار خيار واحد على الأقل لبدء معالجة المقطع.' 
          : 'Please select at least one option to process.', 
        'warning'
      );
      return;
    }

    setPhase('processing');
    setProgress(0);
    setActiveStep(0);
    setProcTitle(lang === 'ar' ? 'جاري رفع الفيديو...' : 'Uploading video...');
    setProcSub(lang === 'ar' ? 'يرجى الانتظار، جاري نقل البيانات.' : 'Please wait, transferring files.');

    const formData = new FormData();
    formData.append('video', currentFile);
    formData.append('language', selectedLang);
    formData.append('silenceThreshold', (silenceThreshold / 10).toString());
    formData.append('removeFillers', 'true'); // Hardcoded to true
    formData.append('enableRepetitionsHelper', repetitionsHelper ? 'true' : 'false');
    formData.append('confidenceThreshold', (confidence / 100).toString());
    formData.append('silenceRemoval', silenceRemoval ? 'true' : 'false');
    formData.append('autoCaptions', autoCaptions ? 'true' : 'false');
    formData.append('autoZoom', autoZoom ? 'true' : 'false');
    formData.append('zoomIntensity', zoomIntensity);

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/process', true);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 30); // First 30% is upload
          setProgress(percentComplete);
          
          if (percentComplete > 15 && percentComplete <= 30) {
            setActiveStep(1);
            setProcTitle(lang === 'ar' ? 'الذكاء الاصطناعي يحلل الصوت...' : 'AI analyzing audio...');
            setProcSub(lang === 'ar' ? 'الذكاء الاصطناعي يستمع للمقاطع.' : 'AI is listening to the clips.');
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          const jobId = response.jobId;

          let isCompleted = false;
          pollIntervalRef.current = setInterval(async () => {
            if (isCompleted) {
              clearInterval(pollIntervalRef.current);
              return;
            }

            try {
              const statusRes = await fetch(`/api/job/${jobId}/status`);
              if (!statusRes.ok) return;
              const statusData = await statusRes.json();

              if (statusData.status === 'processing_upload') {
                const prog = Math.round(30 + (statusData.progress || 0) * 0.2);
                setProgress(prog);
              } else if (statusData.status === 'processing_transcription') {
                setActiveStep(1);
                setProcTitle(lang === 'ar' ? 'الذكاء الاصطناعي يحلل الصوت...' : 'AI analyzing audio...');
                setProcSub(lang === 'ar' ? 'الذكاء الاصطناعي يستمع للمقاطع.' : 'AI is listening to the clips.');

                const prog = Math.round(50 + (statusData.progress || 0) * 0.2);
                setProgress(prog);
              } else if (statusData.status === 'processing_analysis') {
                setActiveStep(2);
                setProcTitle(lang === 'ar' ? 'جاري إزالة السكتات...' : 'Removing silences...');
                setProcSub(lang === 'ar' ? 'تحديد لحظات الصمت وإزالتها.' : 'Locating and cutting silence blocks.');

                const prog = Math.round(70 + (statusData.progress || 0) * 0.25);
                setProgress(prog);
              } else if (statusData.status === 'completed') {
                isCompleted = true;
                clearInterval(pollIntervalRef.current);
                
                setActiveStep(3);
                setProcTitle(lang === 'ar' ? 'جاهز للتحميل والتعديل!' : 'Ready to download & edit!');
                setProcSub(lang === 'ar' ? 'تجهيز الملف للتحميل والمونتاج.' : 'Preparing file for download and timeline editing.');
                setProgress(100);

                setTimeout(async () => {
                  localStorage.setItem('vireon_video_url', statusData.streamUrl);
                  localStorage.setItem('vireon_segments', JSON.stringify(statusData.timeline));
                  localStorage.setItem('vireon_captions', JSON.stringify(statusData.captions || []));
                  localStorage.setItem('vireon_zoom_keyframes', JSON.stringify(statusData.zoomKeyframes || []));
                  localStorage.setItem('vireon_auto_captions_enabled', autoCaptions ? 'true' : 'false');
                  localStorage.setItem('vireon_silence_removal_enabled', silenceRemoval ? 'true' : 'false');
                  localStorage.setItem('vireon_auto_zoom_enabled', autoZoom ? 'true' : 'false');
                  localStorage.setItem('vireon_original_url', statusData.streamUrl);
                  localStorage.setItem('vireon_job_id', jobId);
                  localStorage.setItem('vireon_stats', JSON.stringify(statusData.stats));

                  if (user) {
                    await supabase.from('video_history').insert({
                      user_id: user.id,
                      filename: currentFile.name || 'مقطع جديد',
                      duration_original: 'N/A',
                      duration_processed: 'N/A',
                      time_saved: statusData.stats ? (statusData.originalDuration - statusData.stats.originalDuration) + 'ث' : '0ث',
                      silences_removed: statusData.timeline ? statusData.timeline.filter(t => t.type === 'remove').length : 0
                    });
                  }
                  navigate('/dashboard/timeline');
                }, 800);
              } else if (statusData.status === 'failed') {
                isCompleted = true;
                clearInterval(pollIntervalRef.current);
                showToast(lang === 'ar' ? 'فشلت معالجة الفيديو بالذكاء الاصطناعي.' : 'AI processing failed.', 'error');
                handleRemoveFile();
              }
            } catch (err) {
              console.error('Error polling status:', err);
            }
          }, 2000);
        } else {
          showToast(lang === 'ar' ? 'حدث خطأ أثناء معالجة الفيديو.' : 'Error processing video.', 'error');
          handleRemoveFile();
        }
      };

      xhr.onerror = () => {
        showToast(lang === 'ar' ? 'فشل الاتصال بالخادم.' : 'Server connection failed.', 'error');
        handleRemoveFile();
      };

      xhr.send(formData);

    } catch (err) {
      console.error(err);
      showToast(lang === 'ar' ? 'حدث خطأ غير متوقع.' : 'Unexpected error occurred.', 'error');
      handleRemoveFile();
    }
  };

  const sensitivityLabels = { 
    1: lang === 'ar' ? 'منخفض' : 'Low', 
    2: lang === 'ar' ? 'متوسط' : 'Medium', 
    3: lang === 'ar' ? 'عالي' : 'High' 
  };

  const getPageTitleAndSub = () => {
    if (isFullEditMode) {
      return {
        title: lang === 'ar' ? 'استوديو التعديل والمونتاج الكامل بـ AI' : 'AI Full Edit Studio',
        subtitle: lang === 'ar' ? 'ارفع مقطعك وسيقوم الـ AI بإنتاج فيديو متكامل (قص، زوم، إزالة التكرار وترجمة تلقائية) بضغطة زر' : 'Upload your clip and let the AI do all the heavy lifting (cut, zoom, repetitions and subtitles) in seconds'
      };
    } else if (isEditorMode) {
      return {
        title: t('editor.title'),
        subtitle: t('editor.sub')
      };
    } else if (isCaptionMode) {
      return {
        title: lang === 'ar' ? 'استوديو توليد نصوص الشاشة التلقائية' : 'AI Auto Captions Studio',
        subtitle: lang === 'ar' ? 'ارفع مقطع الفيديو الخاص بك وسيقوم الـ AI بكتابة الترجمة النصية التلقائية في ثوانٍ' : 'Upload your clip and the AI will automatically generate subtitles in seconds'
      };
    } else if (isRepetitionsMode) {
      return {
        title: lang === 'ar' ? 'استوديو إزالة التكرار واللعثم بـ AI' : 'AI Repetitions & Stutter Removal',
        subtitle: lang === 'ar' ? 'ارفع مقطعك ليقوم الـ AI بحذف التكرار اللفظي والوقفات المترددة تلقائياً' : 'Upload your clip and let the AI automatically delete stutters and stumbles'
      };
    }
    return { title: '', subtitle: '' };
  };

  const { title, subtitle } = getPageTitleAndSub();

  return (
    <div id="dash-subview-editor" className="dash-subview active">
      <div className="subview-header">
        <h1 className="subview-title">{title}</h1>
        <p className="subview-subtitle">{subtitle}</p>
      </div>

      <div className="uploader-studio-card glass-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="dash-uploader-container" id="dashUploader">
          
          {/* Phase 1: Drag & Drop */}
          {phase === 'upload' && (
            <div 
              className={`dash-upload-zone ${isDragOver ? 'dragover' : ''}`} 
              id="dashUploadZone"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="upload-icon-wrapper">
                <svg className="upload-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3>{t('editor.drop')}</h3>
              <p>{lang === 'ar' ? 'أو اضغط لاختيار ملف من جهازك' : 'Or click to choose a file from your device'}</p>
              <span className="upload-limit">{t('editor.drop.sub')}</span>
              <button 
                className="btn btn-primary" 
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                {t('editor.browse')}
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                id="dashFileInput" 
                accept="video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/*,audio/*" 
                style={{ display: 'none' }} 
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* Phase 2: Settings Panel */}
          {phase === 'settings' && currentFile && (
            <div className="dash-settings-panel" id="dashSettingsPanel">
              <div className="file-preview-card">
                <div className="file-preview-icon">🎬</div>
                <div className="file-preview-info">
                  <strong id="previewFileName">{currentFile.name}</strong>
                  <span id="previewFileMeta">{formatBytes(currentFile.size)}</span>
                </div>
                <button className="btn-remove-file" id="btnRemoveFile" onClick={handleRemoveFile}>✕</button>
              </div>

              <div className="settings-divider"></div>

              {/* Toggle Switches: ONLY show in Full Edit Mode */}
              {isFullEditMode && (
                <div className="settings-group" style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '20px' }}>
                  {/* Silence Removal Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <label className="settings-label" style={{ margin: 0 }}>
                        {lang === 'ar' ? 'إزالة السكتات واللحظات الصامتة' : 'Silence Removal'}
                      </label>
                      <div className="settings-slider-info" style={{ marginTop: '2px' }}>
                        {lang === 'ar' ? 'تحديد لحظات الصمت والوقفات الطويلة وإزالتها.' : 'Detect and trim silent parts and long pauses.'}
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        id="silenceRemovalToggle"
                        checked={silenceRemoval}
                        onChange={(e) => setSilenceRemoval(e.target.checked)}
                      />
                      <span className="toggle-thumb"></span>
                    </label>
                  </div>

                  {/* Auto Captions Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingTop: '4px' }}>
                    <div>
                      <label className="settings-label" style={{ margin: 0 }}>
                        {lang === 'ar' ? 'توليد نصوص الشاشة التلقائية' : 'Auto Captions'}
                      </label>
                      <div className="settings-slider-info" style={{ marginTop: '2px' }}>
                        {lang === 'ar' ? 'توليد ترجمة نصية تلقائية متزامنة على الفيديو.' : 'Automatically generate and sync text subtitles on screen.'}
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        id="autoCaptionsToggle"
                        checked={autoCaptions}
                        onChange={(e) => setAutoCaptions(e.target.checked)}
                      />
                      <span className="toggle-thumb"></span>
                    </label>
                  </div>

                  {/* Auto Zoom Toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
                    <div>
                      <label className="settings-label" style={{ margin: 0 }}>
                        {lang === 'ar' ? 'تكبير تلقائي ذكي (Auto Zoom)' : 'AI Auto Zoom'}
                      </label>
                      <div className="settings-slider-info" style={{ marginTop: '2px' }}>
                        {lang === 'ar' ? 'تكبير وتصغير الفيديو تلقائياً لإضافة حيوية وحماس للمتكلم.' : 'Automatically zoom in/out to add emphasis and visual energy.'}
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        id="autoZoomToggle"
                        checked={autoZoom}
                        onChange={(e) => setAutoZoom(e.target.checked)}
                      />
                      <span className="toggle-thumb"></span>
                    </label>
                  </div>
                </div>
              )}

              {/* Conditional warning if Zoom is active but Silence removal is off */}
              {autoZoom && !silenceRemoval && isFullEditMode && (
                <div style={{ padding: '10px 15px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', color: '#93C5FD', fontSize: '0.8rem', marginBottom: '15px' }}>
                  ℹ️ {lang === 'ar' 
                    ? 'سيتم تطبيق زوم الكلمات التعبيرية فقط (Emphasis) لتعطيل إزالة السكتات.' 
                    : 'Only word-based emphasis zoom will be applied since Silence Removal is disabled.'}
                </div>
              )}

              {/* Zoom Intensity Selection */}
              {autoZoom && isFullEditMode && (
                <div className="settings-group" style={{ animation: 'fadeIn 0.3s ease', marginBottom: '20px' }}>
                  <label className="settings-label">
                    {lang === 'ar' ? '🎚️ حدة التكبير والتصغير (Zoom Intensity)' : '🎚️ Zoom Intensity'}
                  </label>
                  <div className="lang-selector-grid">
                    {['subtle', 'balanced', 'punchy'].map((level) => (
                      <button 
                        key={level}
                        className={`lang-btn ${zoomIntensity === level ? 'active' : ''}`}
                        onClick={() => setZoomIntensity(level)}
                        type="button"
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                      >
                        {level === 'subtle' ? (lang === 'ar' ? '🔍 خفيف' : 'Subtle') 
                         : level === 'punchy' ? (lang === 'ar' ? '💥 قوي' : 'Punchy') 
                         : (lang === 'ar' ? '⚖️ متوازن' : 'Balanced')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Content Language: Always show */}
              <div className="settings-group">
                <label className="settings-label">{t('editor.lang.label')}</label>
                <div className="lang-selector-grid" id="langSelectorGrid">
                  <button 
                    className={`lang-btn ${selectedLang === 'ar' ? 'active' : ''}`}
                    onClick={() => setSelectedLang('ar')}
                  >
                    🇪🇬 عربي
                  </button>
                  <button 
                    className={`lang-btn ${selectedLang === 'en' ? 'active' : ''}`}
                    onClick={() => setSelectedLang('en')}
                  >
                    🇺🇸 English
                  </button>
                  <button 
                    className={`lang-btn ${selectedLang === 'both' ? 'active' : ''}`}
                    onClick={() => setSelectedLang('both')}
                  >
                    🔀 كلاهما
                  </button>
                </div>
              </div>

              {/* Silence Removal Sliders: Only show if Silence Removal is active */}
              {silenceRemoval && (
                <div className="silence-removal-options-wrapper" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div className="settings-group">
                    <div className="settings-slider-row">
                      <label className="settings-label">
                        {lang === 'ar' ? '⏱️ طول الصمت المستهدف (Threshold)' : '⏱️ Silence Threshold'}
                      </label>
                      <span className="settings-slider-value" id="silenceThresholdValue">
                        {(silenceThreshold / 10).toFixed(1)} {lang === 'ar' ? 'ث' : 's'}
                      </span>
                    </div>
                    <input 
                      type="range" 
                      id="silenceThresholdSlider" 
                      className="settings-slider" 
                      min="1" 
                      max="30" 
                      value={silenceThreshold}
                      onChange={(e) => setSilenceThreshold(parseInt(e.target.value))}
                    />
                    <div className="settings-slider-info">
                      {lang === 'ar' ? 'أي صمت أطول من هذه المدة سيتم إزالته.' : 'Any silence longer than this duration will be removed.'}
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="settings-slider-row">
                      <label className="settings-label">
                        {lang === 'ar' ? '🎚️ حساسية الالتقاط (Sensitivity)' : '🎚️ Detection Sensitivity'}
                      </label>
                      <span className="settings-slider-value" id="sensitivityValue">{sensitivityLabels[sensitivity]}</span>
                    </div>
                    <input 
                      type="range" 
                      id="sensitivitySlider" 
                      className="settings-slider" 
                      min="1" 
                      max="3" 
                      value={sensitivity}
                      onChange={(e) => setSensitivity(parseInt(e.target.value))}
                    />
                    <div className="settings-slider-info">
                      {lang === 'ar' ? 'حساسية الخوارزمية لتمييز التغيير في الصوت.' : 'Algorithm sensitivity to detect sound changes.'}
                    </div>
                  </div>

                  <div className="settings-group">
                    <div className="settings-slider-row">
                      <label className="settings-label">
                        {lang === 'ar' ? '🎯 مستوى دقة الفهم (Confidence Threshold)' : '🎯 Confidence Threshold'}
                      </label>
                      <span className="settings-slider-value" id="confidenceValue">{confidence}%</span>
                    </div>
                    <input 
                      type="range" 
                      id="confidenceSlider" 
                      className="settings-slider" 
                      min="50" 
                      max="100" 
                      value={confidence}
                      onChange={(e) => setConfidence(parseInt(e.target.value))}
                    />
                    <div className="settings-slider-info">
                      {lang === 'ar' ? 'الحد الأدنى لثقة الذكاء الاصطناعي لتأكيد الكلمات أو الصمت.' : 'Minimum AI confidence to confirm words/silence.'}
                    </div>
                  </div>
                </div>
              )}

              {/* Repetitions switch: Only show in Full Edit Mode or Repetitions Mode */}
              {(isFullEditMode || isRepetitionsMode) && (
                <div className="settings-group" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div>
                      <label className="settings-label" style={{ margin: 0 }}>
                        {lang === 'ar' ? '🔄 إزالة التكرار (Repetitions)' : '🔄 Remove Repetitions'}
                      </label>
                      <div className="settings-slider-info" style={{ marginTop: '2px' }}>
                        {lang === 'ar' ? 'حذف الكلمات المتكررة نتيجة التلعثم تلقائياً.' : 'Automatically delete stuttered words.'}
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        id="repetitionsToggle"
                        checked={repetitionsHelper}
                        disabled={isRepetitionsMode} // Hardcoded checked in Repetitions mode
                        onChange={(e) => setRepetitionsHelper(e.target.checked)}
                      />
                      <span className="toggle-thumb"></span>
                    </label>
                  </div>
                </div>
              )}

              <div className="settings-actions" style={{ marginTop: '30px' }}>
                <button className="btn btn-secondary" id="btnCancelUpload" onClick={handleRemoveFile}>
                  {t('editor.cancel')}
                </button>
                <button className="btn btn-primary" id="btnStartProcessing" onClick={triggerProcessing}>
                  {lang === 'ar' ? 'ابدأ المعالجة 🚀' : 'Start Processing 🚀'}
                </button>
              </div>
            </div>
          )}

          {/* Phase 3: Processing Zone */}
          {phase === 'processing' && (
            <div className="dash-processing-zone" id="dashProcessingZone" style={{ padding: '1rem 0' }}>
              <h2 id="dashProcTitle" style={{ color: 'var(--text)', marginBottom: '0.5rem', textAlign: 'center' }}>
                {procTitle}
              </h2>
              <p id="dashProcSub" style={{ color: 'var(--text-dim)', marginBottom: '2rem', fontSize: '0.9rem', textAlign: 'center' }}>
                {procSub}
              </p>

              <div className="processing-steps-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Step 1 */}
                <div className={`proc-step ${activeStep === 0 ? 'active' : activeStep > 0 ? 'done' : ''}`} id="procStep1">
                  <div className="step-icon-status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                    {activeStep > 0 ? '✔️' : activeStep === 0 ? <span style={{ display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>🔄</span> : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                    )}
                  </div>
                  <div className="step-text">
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                      {lang === 'ar' ? 'رفع الفيديو إلى الاستوديو الذكي' : 'Uploading video to the smart studio'}
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>
                      {lang === 'ar' ? 'يرجى الانتظار، جاري نقل البيانات.' : 'Please wait, transferring files.'}
                    </span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className={`proc-step ${activeStep === 1 ? 'active' : activeStep > 1 ? 'done' : ''}`} id="procStep2">
                  <div className="step-icon-status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                    {activeStep > 1 ? '✔️' : activeStep === 1 ? <span style={{ display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>🔄</span> : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="m16.24 7.76-5.66 5.66"></path>
                        <circle cx="12" cy="12" r="1"></circle>
                      </svg>
                    )}
                  </div>
                  <div className="step-text">
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                      {lang === 'ar' ? 'التعرف على الكلمات وتحليل الصوت' : 'Speech recognition and audio analysis'}
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>
                      {lang === 'ar' ? 'الذكاء الاصطناعي يقوم بالاستماع للترددات الصوتية.' : 'AI is analyzing speech patterns.'}
                    </span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className={`proc-step ${activeStep === 2 ? 'active' : activeStep > 2 ? 'done' : ''}`} id="procStep3">
                  <div className="step-icon-status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                    {activeStep > 2 ? '✔️' : activeStep === 2 ? <span style={{ display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>🔄</span> : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                        <circle cx="6" cy="6" r="3"></circle>
                        <circle cx="6" cy="18" r="3"></circle>
                        <line x1="9.8" y1="8.2" x2="20" y2="18"></line>
                        <line x1="9.8" y1="15.8" x2="20" y2="6"></line>
                      </svg>
                    )}
                  </div>
                  <div className="step-text">
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                      {lang === 'ar' ? 'إزالة السكتات وتحديد لحظات الصمت' : 'Removing silences and padding cuts'}
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>
                      {lang === 'ar' ? 'تحديد لحظات الصمت والوقفات الطويلة وإزالتها.' : 'Trimming long pauses and buffering.'}
                    </span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className={`proc-step ${activeStep === 3 ? 'active' : activeStep > 3 ? 'done' : ''}`} id="procStep4">
                  <div className="step-icon-status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', fontSize: '0.9rem' }}>
                    {activeStep > 3 ? '✔️' : activeStep === 3 ? <span style={{ display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>🔄</span> : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle' }}>
                        <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
                        <line x1="7" y1="2" x2="7" y2="22"></line>
                        <line x1="17" y1="2" x2="17" y2="22"></line>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                      </svg>
                    )}
                  </div>
                  <div className="step-text">
                    <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                      {lang === 'ar' ? 'إنهاء معالجة الفيديو' : 'Wrapping up processing'}
                    </strong>
                    <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.7, marginTop: '2px' }}>
                      {lang === 'ar' ? 'تجهيز الملف للتحميل والمونتاج التلقائي.' : 'Rendering clean video and segments.'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dash-progress-track" style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '10px', height: '10px', overflow: 'hidden', marginTop: '2rem', marginBottom: '0.5rem' }}>
                <div 
                  className="dash-progress-fill" 
                  id="dashProgressBar" 
                  style={{ width: `${progress}%`, background: 'var(--gradient-primary)', height: '100%', transition: 'width 0.3s ease' }}
                ></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                <span>{lang === 'ar' ? 'نسبة التقدم' : 'Progress'}</span>
                <span id="dashProgressPercent">{progress}%</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
