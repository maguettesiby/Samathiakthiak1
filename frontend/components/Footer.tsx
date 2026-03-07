import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Heart, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  // Fonction pour défiler vers le haut lors de la navigation
  const handleLinkClick = (to: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fonction pour les liens externes (téléphone, email)
  const handleExternalLinkClick = (e: React.MouseEvent) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Laisser le comportement par défaut du lien se produire
  };

  const supportWhatsAppHref = `https://wa.me/221770000000?text=${encodeURIComponent('Bonjour, je contacte le support SamaThiakThiak.')}`;

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="container mx-auto px-4 py-14">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0s' }}>
            <Link to="/" onClick={() => handleLinkClick('/')} className="flex items-center gap-3 text-xl font-black text-blue-600 hover:opacity-90 transition-opacity">
              <img
                src="/images/samathiakthiak-icon-mobile.svg"
                alt="SamaThiakThiak"
                onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/site.png'; }}
                className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl border border-slate-200 bg-white md:hidden"
              />
              <img
                src="/images/samathiakthiak-logo-desktop.svg"
                alt="SamaThiakThiak"
                onError={(e: any) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/site.png'; }}
                className="hidden md:block h-11 w-auto"
              />
            </Link>
            <p className="text-slate-600 text-sm leading-relaxed">
              {t('footer.about')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3">
              {[
                { to: "/", label: t('nav.home') },
                { to: "/find-rider", label: t('common.findRider') },
                { to: "/register", label: t('common.becomeRider') },
              ].map(link => (
                <li key={link.to}>
                  <Link 
                    to={link.to}
                    onClick={() => handleLinkClick(link.to)}
                    className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t('footer.services')}</h3>
            <ul className="space-y-3">
              {[
                t('footer.serviceExpress'),
                t('footer.serviceRealtime'),
                t('footer.serviceSupport'),
                t('footer.serviceSecurePay'),
              ].map((service, idx) => (
                <li key={idx} className="text-slate-600 hover:text-slate-900 transition-colors duration-200 flex items-center gap-2 cursor-pointer group">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                  {service}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">{t('footer.contact')}</h3>
            <div className="space-y-4">
              <a href="tel:+221775616203" onClick={handleExternalLinkClick} className="flex items-start gap-3 text-slate-600 hover:text-slate-900 transition-colors duration-200 group">
                <Phone size={18} className="mt-0.5" />
                <span className="text-sm">+221 77 561 62 03</span>
              </a>

              
              <a href="mailto:samathiakthiak@gmail.com" onClick={handleExternalLinkClick} className="flex items-start gap-3 text-slate-600 hover:text-slate-900 transition-colors duration-200 group">
                <Mail size={18} className="mt-0.5" />
                <span className="text-sm">samathiakthiak@gmail.com</span>
              </a>
              <div className="flex items-start gap-3 text-slate-600">
                <MapPin size={18} className="mt-0.5" />
                <span className="text-sm">Dakar, Sénégal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-200 mb-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-slate-500 text-sm text-center md:text-left">
            © {currentYear}. {t('footer.rights')}
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" onClick={handleExternalLinkClick} className="text-slate-500 hover:text-slate-900 text-sm transition-colors duration-200">
              {t('footer.privacy')}
            </a>
            <span className="text-slate-300">|</span>
            <a href="#" onClick={handleExternalLinkClick} className="text-slate-500 hover:text-slate-900 text-sm transition-colors duration-200">
              {t('footer.terms')}
            </a>
          </div>

          {/* Made with love */}
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span>{t('footer.madeWith')}</span>
            <Heart size={16} className="text-red-500 animate-pulse" />
            <span>{t('footer.inSenegal')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
