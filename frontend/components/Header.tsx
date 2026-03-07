import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, User, LogOut, LayoutDashboard, Search, UserPlus, AlertCircle, MessageCircle, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { UserType } from '../types';

const THEME_KEY = 'samathiakthiak_theme_v1';

const Header: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const userDisplayName = user?.name || user?.email || '';

  const dashboardPath = user
    ? user.type === UserType.CLIENT
      ? '/client'
      : user.role === 'admin'
        ? '/admin'
        : '/rider-dashboard'
    : '/login';

  // Fonction pour défiler vers le haut et naviguer
  const scrollToTopAndNavigate = (to: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
    navigate(to);
  };

  // Fonction pour défiler vers le haut et naviguer avec Link
  const handleLinkClick = (to: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  const navLinks = [
    { to: '/', label: t('nav.home'), icon: null },
    { to: '/find-rider', label: t('common.findRider'), icon: <Search size={18} /> },
  ];

  const supportWhatsAppHref = `https://wa.me/221770000000?text=${encodeURIComponent('Bonjour, je contacte le support SamaThiakThiak.')}`;

  useEffect(() => {
    let next = false;
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark') next = true;
      if (stored === 'light') next = false;
      if (!stored) {
        next = typeof window !== 'undefined' && window.matchMedia
          ? window.matchMedia('(prefers-color-scheme: dark)').matches
          : false;
      }
    } catch {
      next = false;
    }
    setIsDark(next);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) root.classList.add('dark');
    else root.classList.remove('dark');
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  const handleLogoutClick = () => setShowLogoutConfirm(true);
  const cancelLogout = () => setShowLogoutConfirm(false);

  const confirmLogout = () => {
    logout();
    setShowLogoutConfirm(false);
    setIsMenuOpen(false);
    navigate('/');
  };

  useEffect(() => {
    console.log('Header: isMenuOpen =', isMenuOpen);
  }, [isMenuOpen]);

  // Mobile menu JSX (rendered via portal to body so it stays above other content)
  const mobileMenu = isMenuOpen ? (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-[9998] md:hidden backdrop-blur-sm animate-fade-in"
        onClick={() => setIsMenuOpen(false)}
      />

      <div className="fixed inset-0 flex z-[9999] md:hidden">
        <div className="flex-1" />
        <aside className="w-80 bg-white h-full flex flex-col z-[10000] shadow-2xl animate-slide-in-right border-l border-slate-200">
          {/* Header du menu */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">{t('header.menu')}</h2>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors duration-200 text-slate-700"
                aria-label={t('header.closeMenu')}
              >
                <X size={22} />
              </button>
            </div>
            
            {/* Info utilisateur */}
            {user && (
              <div className="mt-4 rounded-xl p-4 border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl border border-slate-200 flex items-center justify-center">
                    <User size={20} className="text-slate-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{t('header.welcome')}</p>
                    {userDisplayName && <p className="text-sm text-slate-600">{userDisplayName}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation principale */}
          <nav className="flex-1 overflow-auto">
            <div className="p-4 space-y-2">
              <button
                type="button"
                onClick={() => setIsDark((v) => !v)}
                className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-100 transition-all duration-300 group text-left"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  {isDark ? <Sun size={18} className="text-amber-600" /> : <Moon size={18} className="text-slate-700" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{t('header.theme')}</p>
                  <p className="text-xs text-gray-500">{isDark ? t('header.themeDark') : t('header.themeLight')}</p>
                </div>
              </button>

              {/* Liens principaux */}
              <div className="space-y-1">
                <Link 
                  to="/find-rider" 
                  onClick={() => handleLinkClick('/find-rider')} 
                  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Search size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t('common.findRider')}</p>
                    <p className="text-xs text-gray-500">{t('nav.findRiderSubtitle')}</p>
                  </div>
                </Link>

                <Link 
                  to="/" 
                  onClick={() => handleLinkClick('/')} 
                  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <LayoutDashboard size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t('nav.home')}</p>
                    <p className="text-xs text-gray-500">{t('nav.homeSubtitle')}</p>
                  </div>
                </Link>

                <Link 
                  to="/find-rider" 
                  onClick={() => handleLinkClick('/find-rider')} 
                  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Search size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t('common.findRider')}</p>
                    <p className="text-xs text-gray-500">{t('findRider.searchLabel')}</p>
                  </div>
                </Link>

                <a
                  href={supportWhatsAppHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-emerald-50 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <MessageCircle size={18} className="text-emerald-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{t('common.supportWhatsapp')}</p>
                    <p className="text-xs text-gray-500">{t('header.fastSupport')}</p>
                  </div>
                </a>
              </div>

              {/* Séparateur */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* Actions utilisateur */}
              <div className="space-y-1">
                {user ? (
                  <>
                    <Link
                      to={dashboardPath}
                      onClick={() => handleLinkClick(dashboardPath)}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-purple-50 transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                        <LayoutDashboard size={18} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{t('common.clientSpace')}</p>
                        <p className="text-xs text-gray-500">{t('header.dashboard')}</p>
                      </div>
                    </Link>

                    <button
                      onClick={() => { setIsMenuOpen(false); handleLogoutClick(); }}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-red-50 transition-all duration-300 group text-left"
                    >
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                        <LogOut size={18} className="text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{t('common.logout')}</p>
                        <p className="text-xs text-gray-500">{t('header.logoutSubtitle')}</p>
                      </div>
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to="/register" 
                      onClick={() => handleLinkClick('/register')} 
                      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all duration-300 group"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                        <UserPlus size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{t('common.becomeRider')}</p>
                        <p className="text-xs text-gray-500">{t('header.createAccount')}</p>
                      </div>
                    </Link>

                    <Link 
                      to="/login" 
                      onClick={() => handleLinkClick('/login')} 
                      className="flex items-center gap-4 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <LogOut size={18} className="text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{t('common.login')}</p>
                        <p className="text-xs text-blue-100">{t('header.accessAccount')}</p>
                      </div>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </nav>

          {/* Footer du menu */}
          <div className="p-4 border-t border-slate-200 bg-slate-50">
            <div className="text-center">
              <p className="text-xs text-slate-600 mb-1">{t('common.appName')}</p>
              <p className="text-xs text-slate-400">{t('header.version', { version: '1.0.0' })}</p>
            </div>
          </div>
        </aside>
      </div>
    </>
  ) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link
          to="/"
          onClick={() => handleLinkClick('/')}
          className="flex items-center gap-3 font-black text-blue-600 tracking-tight hover:opacity-90 transition-opacity"
        >
          <img
            src="/images/samathiakthiak-logo.svg"
            alt={t('common.appName')}
            onError={(e: any) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/site.png';
            }}
            className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-slate-200 bg-white"
          />
          <span className="text-lg sm:text-xl text-blue-600">{t('common.appName')}</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 font-semibold text-sm text-slate-700">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => handleLinkClick(link.to)}
              className="flex items-center gap-2 hover:text-slate-900 transition-colors"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}

          {user ? (
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <button
                type="button"
                onClick={() => setIsDark((v) => !v)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title={t('header.theme')}
                aria-label={t('header.theme')}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {userDisplayName && (
                <div className="hidden lg:flex flex-col leading-tight">
                  <span className="text-xs text-slate-500 font-semibold">{t('header.welcome')}</span>
                  <span className="text-sm text-slate-900 font-bold max-w-[220px] truncate" title={userDisplayName}>
                    {userDisplayName}
                  </span>
                </div>
              )}
              <Link
                to={dashboardPath}
                onClick={() => handleLinkClick(dashboardPath)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <LayoutDashboard size={16} />
                <span className="hidden sm:inline">{t('common.clientSpace')}</span>
              </Link>
              <button
                onClick={handleLogoutClick}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title={t('common.logout')}
                aria-label={t('common.logout')}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <button
                type="button"
                onClick={() => setIsDark((v) => !v)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                title={t('header.theme')}
                aria-label={t('header.theme')}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link
                to="/register"
                onClick={() => handleLinkClick('/register')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-blue-700 hover:bg-blue-50 transition-colors font-semibold"
              >
                <UserPlus size={16} />
                {t('common.becomeRider')}
              </Link>
              <Link
                to="/login"
                onClick={() => handleLinkClick('/login')}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              >
                {t('common.login')}
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="md:hidden p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label={t('header.toggleMenu')}
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav Overlay (portal) */}
      {typeof document !== 'undefined' && createPortal(mobileMenu, document.body)}

      {/* Modal de confirmation de déconnexion */}
      {showLogoutConfirm && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-fade-in" onClick={cancelLogout} />

          {/* Modal */}
          <div className="fixed inset-0 flex items-start justify-center z-50 p-4 pt-24 sm:pt-28 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-scale-in">
              {/* Header avec icône */}
              <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-4">
                <AlertCircle size={24} className="text-red-600" />
              </div>

              {/* Titre */}
              <h2 className="text-2xl font-black text-center text-gray-900 mb-2">{t('header.confirmLogoutTitle')}</h2>

              {/* Message */}
              <p className="text-center text-gray-600 mb-6">{t('header.confirmLogoutMessage')}</p>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <button onClick={cancelLogout} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 px-4 rounded-xl transition-all duration-300 active:scale-95">{t('header.cancel')}</button>
                <button onClick={confirmLogout} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-500/50 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"><LogOut size={18} />{t('common.logout')}</button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
