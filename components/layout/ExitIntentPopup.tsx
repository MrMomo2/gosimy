'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';

const POPUP_COOKIE = 'gosimy_exit_popup_shown';
const DISMISS_DAYS = 7;

export function ExitIntentPopup() {
  const t = useTranslations('exitPopup');
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(POPUP_COOKIE);
    if (dismissed) {
      const dismissDate = new Date(dismissed);
      const now = new Date();
      const daysDiff = (now.getTime() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff < DISMISS_DAYS) {
        setIsDismissed(true);
        return;
      }
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isDismissed) {
        setIsVisible(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(POPUP_COOKIE, new Date().toISOString());
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText('WELCOME10');
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={handleDismiss}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('title')}
            </h2>
            <p className="text-lg text-amber-600 font-semibold mb-4">
              {t('subtitle')}
            </p>
            <p className="text-gray-600 mb-6">
              {t('description')}
            </p>

            <div className="bg-gray-100 rounded-xl p-4 mb-6">
              <code className="text-2xl font-bold text-gray-900 tracking-wider">WELCOME10</code>
            </div>

            <button
              onClick={handleCopyCode}
              className="w-full btn-primary py-3 text-base mb-3"
            >
              {t('button')}
            </button>

            <button
              onClick={handleDismiss}
              className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
            >
              {t('noThanks')}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
