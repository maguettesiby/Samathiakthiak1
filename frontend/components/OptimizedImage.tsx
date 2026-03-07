import React, { useState, useRef, useEffect } from 'react';
import { useResponsive } from '../hooks/useResponsive';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  placeholder?: string;
  fallback?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  priority = false,
  placeholder = '/images/placeholder.jpg',
  fallback = '/images/fallback.jpg',
  onLoad,
  onError
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(priority ? src : placeholder);
  const imgRef = useRef<HTMLImageElement>(null);
  const { isMobile } = useResponsive();

  // Optimisation de la source selon l'appareil
  const getOptimizedSrc = (originalSrc: string) => {
    if (isMobile && !originalSrc.includes('?')) {
      // Ajouter des paramètres pour les images mobiles
      return `${originalSrc}?w=800&h=600&format=webp`;
    }
    return originalSrc;
  };

  useEffect(() => {
    if (priority) {
      // Charger immédiatement si prioritaire
      const img = new Image();
      img.onload = () => {
        setIsLoaded(true);
        onLoad?.();
      };
      img.onerror = () => {
        setIsError(true);
        setCurrentSrc(fallback);
        onError?.();
      };
      img.src = getOptimizedSrc(src);
    } else {
      // Lazy loading avec Intersection Observer
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const img = new Image();
              img.onload = () => {
                setIsLoaded(true);
                onLoad?.();
              };
              img.onerror = () => {
                setIsError(true);
                setCurrentSrc(fallback);
                onError?.();
              };
              img.src = getOptimizedSrc(src);
              setCurrentSrc(getOptimizedSrc(src));
              observer.disconnect();
            }
          });
        },
        {
          rootMargin: '50px 0px', // Commencer à charger 50px avant que l'image soit visible
          threshold: 0.01
        }
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => observer.disconnect();
    }
  }, [src, priority, onLoad, onError]);

  // Styles pour le placeholder et le chargement
  const imageStyle: React.CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : 'auto',
    objectFit: 'cover',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0.7,
  };

  const placeholderStyle: React.CSSProperties = {
    width: width ? `${width}px` : '100%',
    height: height ? `${height}px` : '200px',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: '14px',
  };

  if (isError) {
    return (
      <div 
        className={`${className} flex items-center justify-center bg-gray-100 text-gray-500`}
        style={placeholderStyle}
      >
        <span>Image non disponible</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && (
        <div style={placeholderStyle}>
          <div className="animate-pulse">
            <div className="h-full w-full bg-gray-200 rounded"></div>
          </div>
        </div>
      )}
      
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        style={imageStyle}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        width={width}
        height={height}
      />
      
      {/* Badge pour les images optimisées */}
      {isLoaded && isMobile && (
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          Optimisée
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
