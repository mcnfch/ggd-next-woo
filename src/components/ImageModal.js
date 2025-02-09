'use client';

import { useState, useRef, useEffect } from 'react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

export default function ImageModal({ src, alt, onClose }) {
  const [scale, setScale] = useState(1);
  const [isPinching, setIsPinching] = useState(false);
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0 });
  const modalRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const getDistance = (touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      setIsPinching(true);
      touchStartRef.current.distance = getDistance(e.touches[0], e.touches[1]);
    }
  };

  const handleTouchMove = (e) => {
    if (isPinching && e.touches.length === 2) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const delta = currentDistance / touchStartRef.current.distance;
      setScale(Math.min(Math.max(1, delta * scale), 4));
    }
  };

  const handleTouchEnd = () => {
    setIsPinching(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === modalRef.current) {
      onClose();
    }
  };

  return (
    <div 
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={handleBackdropClick}
    >
      <button 
        className="absolute top-4 right-4 text-white text-2xl z-50"
        onClick={onClose}
      >
        ×
      </button>
      <div 
        className="relative w-full h-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Desktop */}
        <div className="hidden md:block">
          <Zoom>
            <img
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </Zoom>
        </div>
        {/* Mobile */}
        <div className="block md:hidden">
          <img
            src={src}
            alt={alt}
            className="max-h-[90vh] max-w-[90vw] object-contain transform transition-transform"
            style={{ transform: `scale(${scale})` }}
          />
        </div>
      </div>
    </div>
  );
}
