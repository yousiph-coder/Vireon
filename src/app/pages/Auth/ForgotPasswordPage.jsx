import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Spinner from '../../components/Spinner';
import { useTranslation } from '../../context/I18nContext';

export default function ForgotPasswordPage() {
  const { lang, t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
    }, 900);
  };

  return (
    <div className="auth-page-wrapper">
      {isSubmitting && (
        <Spinner text={lang === 'ar' ? 'جاري إرسال تعليمات الاستعادة...' : 'Sending password reset instructions...'} />
      )}
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <a href="/" className="auth-logo">Vireon <span>✂️</span></a>
          <h2>{t('login.forgot')}</h2>
          <p>{t('forgot.sub')}</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {showSuccess && (
            <div className="form-success-msg">
              {lang === 'ar' 
                ? '✓ تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح!' 
                : '✓ Password reset link has been successfully sent to your email address!'}
            </div>
          )}
          
          {!showSuccess && (
            <>
              <div className="form-group" id="forgotGroupInput">
                <label htmlFor="forgotEmail">{t('login.email')}</label>
                <input 
                  type="email" 
                  id="forgotEmail" 
                  required 
                  placeholder="name@example.com" 
                  autoComplete="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-block btn-auth" id="btnForgotSubmit">
                {t('forgot.btn')}
              </button>
            </>
          )}
        </form>

        <p className="auth-footer-text">
          <Link to="/login">{t('forgot.back')}</Link>
        </p>
      </div>
    </div>
  );
}
