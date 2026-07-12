import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import { useTranslation } from '../../context/I18nContext';

export default function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const { lang, t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [spinnerMsg, setSpinnerMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg(lang === 'ar' ? 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.' : 'Please enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    setSpinnerMsg(lang === 'ar' ? 'جاري التحقق من الحساب وتسجيل الدخول...' : 'Verifying credentials and logging in...');
    setErrorMsg('');

    try {
      const { data, error } = await login(email.trim(), password);
      if (error) {
        setErrorMsg(error.message);
        setIsSubmitting(false);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(lang === 'ar' ? 'حدث خطأ غير متوقع أثناء تسجيل الدخول.' : 'An unexpected error occurred during login.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSpinnerMsg(lang === 'ar' ? 'اتصال آمن بـ Google OAuth...' : 'Establishing secure Google OAuth connection...');
    await googleLogin();
    navigate('/dashboard');
  };

  return (
    <div className="auth-page-wrapper">
      {isSubmitting && <Spinner text={spinnerMsg} />}
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <a href="/" className="auth-logo">Vireon <span>✂️</span></a>
          <h2>{t('login.title')}</h2>
          <p>{t('login.sub')}</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {errorMsg && <div className="form-error-msg">{errorMsg}</div>}

          <div className="form-group">
            <label htmlFor="loginEmail">{t('login.email')}</label>
            <input 
              type="email" 
              id="loginEmail" 
              required 
              placeholder="name@example.com" 
              autoComplete="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <div className="label-wrapper">
              <label htmlFor="loginPassword">{t('login.password')}</label>
              <Link to="/forgot-password" className="forgot-pass-link">{t('login.forgot')}</Link>
            </div>
            <input 
              type="password" 
              id="loginPassword" 
              required 
              placeholder="••••••••" 
              autoComplete="current-password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-auth">{t('login.btn')}</button>
        </form>

        <div className="auth-divider">
          <span>Or</span>
        </div>

        <button className="btn btn-secondary btn-block btn-google" id="btnGoogleLogin" onClick={handleGoogleLogin}>
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#EA4335" d="M12 5.04c1.67 0 3.2.58 4.38 1.71l3.27-3.27C17.67 1.63 14.98 1 12 1 7.35 1 3.4 3.65 1.48 7.5l3.85 2.99c.9-2.7 3.4-4.45 6.67-4.45z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57v2.96h3.9c2.28-2.1 3.55-5.19 3.55-8.77z"/>
            <path fill="#FBBC05" d="M5.33 10.49c-.23-.7-.36-1.45-.36-2.24s.13-1.54.36-2.24L1.48 3.02C.54 4.9 0 7.01 0 9.25c0 2.24.54 4.35 1.48 6.23l3.85-2.99z"/>
            <path fill="#34A853" d="M12 17.5c2.97 0 5.46-.98 7.28-2.66l-3.9-2.96c-1.08.72-2.47 1.16-3.38 1.16-3.27 0-5.77-1.75-6.67-4.45l-3.85 2.99C3.4 14.85 7.35 17.5 12 17.5z"/>
          </svg>
          Google
        </button>

        <p className="auth-footer-text">
          <span>{t('login.no.account')}</span> <Link to="/signup">{t('login.signup')}</Link>
        </p>
      </div>
    </div>
  );
}
