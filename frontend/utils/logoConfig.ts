/**
 * Logo Assets Configuration
 * SamaThiakThiak
 */

export const LOGO_CONFIG = {
  // Primary logo path (use site.png provided in repository)
  SVG: '/images/site.png',
  
  // Logo Dimensions
  SIZES: {
    xs: '24px',
    sm: '32px',
    md: '40px',
    lg: '48px',
    xl: '56px',
    '2xl': '64px',
  },
  
  // Logo Colors
  COLORS: {
    primary: '#003D7A',     // Bleu foncé
    accent: '#F39200',      // Orange
    dark: '#0F172A',        // Bleu très foncé
    light: '#DBEAFE',       // Bleu très clair
  },
  
  // Usage Contexts
  USAGE: {
    header: '40px',
    footer: '40px',
    favicon: '32px',
    mobile: '36px',
    social: '24px',
    print: '200px',
  },
};

/**
 * Logo Component Hook
 * Usage: const logoUrl = useLogo('header')
 */
export const useLogo = (context = 'header') => {
  const size = LOGO_CONFIG.USAGE[context as keyof typeof LOGO_CONFIG.USAGE] || '40px';
  return {
    url: LOGO_CONFIG.SVG,
    alt: 'SamaThiakThiak',
    width: size,
    height: size,
    className: 'drop-shadow-lg',
  };
};

/**
 * Styled Logo Component
 */
export const LogoComponent = ({ 
  size = 'md', 
  className = '' 
}: { 
  size?: keyof typeof LOGO_CONFIG.SIZES,
  className?: string 
}) => {
  const sizeValue = LOGO_CONFIG.SIZES[size];
  
  return (
    <img 
      src={LOGO_CONFIG.SVG}
      alt="SamaThiakThiak"
      style={{ 
        width: sizeValue, 
        height: sizeValue 
      }}
      className={`drop-shadow-lg ${className}`}
    />
  );
};

/**
 * Logo Variants for Different Uses
 */
export const LogoVariants = {
  // Header Logo
  Header: () => (
    <img 
      src={LOGO_CONFIG.SVG}
      alt="SamaThiakThiak"
      onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/logo.svg'; }}
      className="h-10 w-10 drop-shadow-lg filter brightness-0 invert"
    />
  ),
  
  // Footer Logo
  Footer: () => (
    <img 
      src={LOGO_CONFIG.SVG}
      alt="SamaThiakThiak"
      onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/logo.svg'; }}
      className="h-10 w-10 drop-shadow-lg filter brightness-0 invert"
    />
  ),
  
  // Favicon
  Favicon: () => (
    <link 
      rel="icon" 
      type="image/png" 
      href="/images/site.png" 
    />
  ),
  
  // Social Media
  Social: () => (
    <img 
      src={LOGO_CONFIG.SVG}
      alt="SamaThiakThiak"
      onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/logo.svg'; }}
      className="h-6 w-6 filter brightness-0 invert"
    />
  ),
  
  // Mobile Menu
  Mobile: () => (
    <img 
      src={LOGO_CONFIG.SVG}
      alt="SamaThiakThiak"
      onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/logo.svg'; }}
      className="h-9 w-9 drop-shadow-lg filter brightness-0 invert"
    />
  ),
};

export default LOGO_CONFIG;
