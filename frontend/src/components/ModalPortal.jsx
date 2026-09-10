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
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto animate-fadeIn ${className}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      {children}
    </div>,
    document.body
  );
}
