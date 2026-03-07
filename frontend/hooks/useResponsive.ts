import { useState, useEffect } from 'react';

type BreakpointKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface Breakpoints {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  '2xl': number;
}

const breakpoints: Breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointKey>('md');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });

      // Déterminer le breakpoint actuel
      let breakpoint: BreakpointKey = 'xs';
      for (const [key, value] of Object.entries(breakpoints)) {
        if (width >= value) {
          breakpoint = key as BreakpointKey;
        }
      }
      setCurrentBreakpoint(breakpoint);
    };

    // Initialiser
    handleResize();

    // Ajouter l'écouteur d'événement
    window.addEventListener('resize', handleResize);

    // Nettoyer
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = ['xs', 'sm'].includes(currentBreakpoint);
  const isTablet = currentBreakpoint === 'md';
  const isDesktop = ['lg', 'xl', '2xl'].includes(currentBreakpoint);
  const isSmallScreen = windowSize.width < 768;
  const isMediumScreen = windowSize.width >= 768 && windowSize.width < 1024;
  const isLargeScreen = windowSize.width >= 1024;

  return {
    windowSize,
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isMediumScreen,
    isLargeScreen,
    breakpoints,
  };
};

// Hook pour les media queries personnalisées
export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
};

// Hook pour détecter l'orientation
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
};

// Hook pour détecter le type d'appareil
export const useDevice = () => {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTabletDevice = /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
    
    if (isTabletDevice) {
      setDevice('tablet');
    } else if (isMobileDevice) {
      setDevice('mobile');
    } else {
      setDevice('desktop');
    }
  }, []);

  return device;
};
