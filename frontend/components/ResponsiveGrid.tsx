import React from 'react';
import { useResponsive } from '../hooks/useResponsive';

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  gap?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
  };
  autoFit?: boolean;
  minColumnWidth?: string;
}

const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 },
  gap = { xs: '2', sm: '3', md: '4', lg: '6', xl: '8', '2xl': '8' },
  autoFit = false,
  minColumnWidth = '250px'
}) => {
  const { currentBreakpoint } = useResponsive();

  const getGridClasses = () => {
    const currentCols = cols[currentBreakpoint] || cols.md || 3;
    const currentGap = gap[currentBreakpoint] || gap.md || '4';

    if (autoFit) {
      return `grid grid-cols-[repeat(auto-fit,minmax(${minColumnWidth},1fr))] gap-${currentGap} ${className}`;
    }

    return `grid grid-cols-${currentCols} gap-${currentGap} ${className}`;
  };

  return (
    <div className={getGridClasses()}>
      {children}
    </div>
  );
};

export default ResponsiveGrid;
