import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random().toString();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div 
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="glass-panel"
            style={{
              padding: '12px 20px',
              borderRadius: '10px',
              background: 'rgba(30, 20, 50, 0.95)',
              color: toast.type === 'error' ? '#E06B6B' : toast.type === 'success' ? '#7FCB9E' : '#F4F2F9',
              border: `1px solid ${toast.type === 'error' ? 'rgba(224, 107, 107, 0.3)' : toast.type === 'success' ? 'rgba(127, 203, 158, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              backdropFilter: 'blur(8px)',
              pointerEvents: 'auto',
              minWidth: '250px',
              animation: 'fadeIn 0.3s ease',
              fontSize: '0.9rem',
              direction: 'rtl'
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
