import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Universal Modal Portal for VCAS
 * Renders modals directly onto document.body with z-[9999] and backdrop-blur-md
 * Ensures the entire screen (including header, sidebar, and background) is covered with dark blur
 * and prevents background scrolling.
 */
export default function ModalPortal({ isOpen = true, onClose, children, className = '' }) {
  useEffect(() => {
    if (!isOpen) return;

    const scrollContainer = document.getElementById('main-content-scroll-container');
    const prevBodyOverflow = document.body.style.overflow;
    const prevContainerOverflow = scrollContainer ? scrollContainer.style.overflow : '';

    document.body.style.overflow = 'hidden';
    if (scrollContainer) scrollContainer.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = prevBodyOverflow || 'unset';
      if (scrollContainer) scrollContainer.style.overflow = prevContainerOverflow || 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className={`fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/75 backdrop-blur-md animate-fadeIn ${className}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div 
        className="min-h-full w-full flex items-center justify-center p-4 sm:p-6 text-center"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        <div 
          className="w-full flex items-center justify-center pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
