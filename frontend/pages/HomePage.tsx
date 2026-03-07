import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, Search, Shield, Zap, TrendingUp, Users, MapPin, ArrowRight, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { mockApi, PublicReview, PublicStats } from '../services/mockDb';
import Modal from '../components/Modal';

const useCountUp = (value: number, durationMs = 900) => {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    const to = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    fromRef.current = to;

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(from + (to - from) * eased);
      setDisplay(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, value]);

  return display;
};

const HomeCarouselBackground: React.FC<{ images: { src: string; alt: string }[] }> = ({ images }) => {
  const [index, setIndex] = useState(0);
  const length = images.length;

  useEffect(() => {
    if (length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((v) => (v + 1) % length);
    }, 3000);
    return () => window.clearInterval(id);
  }, [length]);

  const goPrev = () => setIndex((v) => (v - 1 + length) % length);
  const goNext = () => setIndex((v) => (v + 1) % length);

  if (length === 0) return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      {images.map((img, i) => (
        <img
          key={img.src}
          src={img.src}
          alt={img.alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${i === index ? 'opacity-80' : 'opacity-0'}`}
          loading="lazy"
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/55 via-blue-50/35 to-slate-50/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-blue-900/5 via-transparent to-blue-900/5" />

      {length > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              goPrev();
            }}
            aria-label="Précédent"
            className="pointer-events-auto absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/70 hover:bg-white/90 shadow flex items-center justify-center text-slate-900"
          >
            <span className="text-xl leading-none">‹</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              goNext();
            }}
            aria-label="Suivant"
            className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/70 hover:bg-white/90 shadow flex items-center justify-center text-slate-900"
          >
            <span className="text-xl leading-none">›</span>
          </button>
        </>
      ) : null}

      {length > 1 ? (
        <div className="pointer-events-auto absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center justify-center gap-2">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Aller à la diapositive ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                setIndex(i);
              }}
              className={`h-2.5 rounded-full transition-all ${i === index ? 'w-7 bg-blue-700' : 'w-2.5 bg-slate-300/80 hover:bg-slate-400/90'}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

const HomePage: React.FC = () => {
  const { t } = useTranslation();

  const [stats, setStats] = useState<PublicStats>({
    activeRiders: 0,
    satisfiedClients: 0,
    coverageZones: 0,
  });

  const [showReviews, setShowReviews] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [publicReviews, setPublicReviews] = useState<PublicReview[]>([]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await mockApi.getPublicStats();
        if (!mounted) return;
        setStats(data);
      } catch {
        // ignore
      }
    };

    load();
    const interval = window.setInterval(load, 15000);
    const onClientsUpdated = () => load();
    window.addEventListener('samathiakthiak:clients_updated', onClientsUpdated);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener('samathiakthiak:clients_updated', onClientsUpdated);
    };
  }, []);

  useEffect(() => {
    if (!showReviews) return;

    let mounted = true;
    const load = async () => {
      try {
        setReviewsLoading(true);
        const rows = await mockApi.getPublicReviews(12);
        if (!mounted) return;
        setPublicReviews(rows);
      } finally {
        if (!mounted) return;
        setReviewsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [showReviews]);

  const ridersAnimated = useCountUp(stats.activeRiders);
  const clientsAnimated = useCountUp(stats.registeredClients ?? stats.satisfiedClients ?? 0);
  const coverageAnimated = useCountUp(stats.coverageZones);

  const carouselImages = useMemo(
    () => [
      { src: '/images/image1.jpg', alt: t('common.appName') },
      { src: '/images/image2.jpg', alt: t('common.appName') },
      { src: '/images/image3.jpg', alt: t('common.appName') },
      { src: '/images/image4.jpg', alt: t('common.appName') },
    ],
    [t]
  );

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 sm:pt-20 pb-16 sm:pb-32">
        <HomeCarouselBackground images={carouselImages} />

        {/* Animated background shapes */}
        <div className="absolute inset-0 overflow-hidden z-[1]">
          <div className="absolute top-10 right-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20" style={{ animation: 'float 6s ease-in-out infinite 2s' }}></div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center">
            {/* Icon with animation */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="bg-white p-4 rounded-3xl shadow-lg border border-slate-200 animate-bounce-subtle">
                <img
                  src="/images/samathiakthiak-icon-mobile.svg"
                  alt={t('common.appName')}
                  className="h-16 w-16 md:hidden"
                />
                <img
                  src="/images/samathiakthiak-logo-desktop.svg"
                  alt={t('common.appName')}
                  className="hidden md:block h-16 w-auto"
                />
              </div>
            </div>

            {/* Main heading */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-blue-900 mb-6 leading-tight animate-fade-in-up">
              {t('common.appName')}
            </h1>
            
            <div className="mx-auto mb-12 max-w-3xl rounded-2xl bg-white/70 backdrop-blur-sm px-5 py-5 sm:px-7 sm:py-6 shadow-lg border border-white/60">
              <p
                className="text-2xl sm:text-3xl text-slate-900 mb-3 font-black animate-fade-in-up drop-shadow-[0_2px_10px_rgba(0,0,0,0.25)]"
                style={{ animationDelay: '0.1s' }}
              >
                {t('home.platformTagline')}
              </p>

              <p
                className="text-lg md:text-xl text-slate-800 animate-fade-in-up drop-shadow-[0_2px_10px_rgba(0,0,0,0.18)]"
                style={{ animationDelay: '0.2s' }}
              >
                {t('home.heroSubtitle')}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12 sm:mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link 
                to="/find-rider" 
                className="btn-primary inline-flex items-center justify-center gap-3 group"
              >
                <Search size={24} className="group-hover:scale-110 transition-transform" />
                {t('home.ctaFindRider')}
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/register" 
                className="btn-secondary inline-flex items-center justify-center gap-3 group"
              >
                <UserPlus size={24} className="group-hover:scale-110 transition-transform" />
                {t('home.ctaBecomeRider')}
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <div className="card-modern group relative overflow-hidden hover:shadow-xl transition-shadow">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-700" />
                <div className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue-600/10 border border-blue-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <TrendingUp size={26} className="text-blue-700" />
                    </div>
                  </div>
                  <p className="text-4xl font-black text-slate-900 tracking-tight">{ridersAnimated.toLocaleString()}</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{t('home.statsRiders')}</p>
                </div>
              </div>

              <div className="card-modern group relative overflow-hidden hover:shadow-xl transition-shadow">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-purple-500 to-fuchsia-600" />
                <div className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-purple-600/10 border border-purple-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Users size={26} className="text-purple-700" />
                    </div>
                  </div>
                  <p className="text-4xl font-black text-slate-900 tracking-tight">{clientsAnimated.toLocaleString()}</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{t('home.statsRegisteredClients')}</p>
                </div>
              </div>

              <div className="card-modern group relative overflow-hidden hover:shadow-xl transition-shadow">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-green-600" />
                <div className="p-6">
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-emerald-600/10 border border-emerald-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <MapPin size={26} className="text-emerald-700" />
                    </div>
                  </div>
                  <p className="text-4xl font-black text-slate-900 tracking-tight">{coverageAnimated.toLocaleString()}</p>
                  <p className="text-sm font-bold text-slate-700 mt-1">{t('home.statsCoverageTitle')}</p>
                  <p className="text-xs text-slate-600 mt-1">{t('home.statsCoverageSubtitle')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl font-black text-center text-blue-900 mb-4 animate-fade-in-up">
            {t('home.whyTitle')}
          </h2>
          <p className="text-center text-gray-600 text-lg mb-16 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t('home.whySubtitle')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Feature 1 */}
            <div className="card-modern group overflow-hidden hover:scale-105 transition-transform duration-300">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-700"></div>
              <div className="p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap size={32} className="text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">{t('home.featureFastTitle')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('home.featureFastText')}
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card-modern group overflow-hidden hover:scale-105 transition-transform duration-300">
              <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              <div className="p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield size={32} className="text-blue-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">{t('home.featureSecureTitle')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('home.featureSecureText')}
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card-modern group overflow-hidden hover:scale-105 transition-transform duration-300">
              <div className="h-1 bg-gradient-to-r from-green-400 to-emerald-600"></div>
              <div className="p-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users size={32} className="text-green-600" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">{t('home.featureReliableTitle')}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {t('home.featureReliableText')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full mix-blend-multiply filter blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 animate-fade-in-up">
              {t('home.ctaReadyTitle')}
            </h2>
            <p className="text-xl text-blue-100 mb-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {t('home.ctaReadySubtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <Link 
                to="/find-rider" 
                className="px-8 py-4 rounded-2xl font-black text-lg bg-white text-blue-700 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
              >
                {t('home.ctaStartNow')}
              </Link>
              <Link 
                to="/register" 
                className="px-8 py-4 rounded-2xl font-black text-lg border-2 border-white text-white hover:bg-white/10 transition-all duration-300"
              >
                {t('home.ctaIAmRider')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Modal
        isOpen={showReviews}
        onClose={() => setShowReviews(false)}
        title={t('home.reviewsModalTitle')}
        footer={
          <button type="button" onClick={() => setShowReviews(false)} className="btn-secondary w-full">
            {t('common.close')}
          </button>
        }
      >
        {reviewsLoading ? (
          <div className="text-slate-600">{t('home.reviewsLoading')}</div>
        ) : publicReviews.length === 0 ? (
          <div className="text-slate-600">{t('home.reviewsEmpty')}</div>
        ) : (
          <div className="space-y-4">
            {publicReviews.map((r) => (
              <div key={r.id} className="p-4 rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-black text-slate-900 truncate">
                      {r.reviewerName || t('home.reviewAnonymous')}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-sm font-black text-slate-900">
                    {Math.max(0, Math.min(5, Math.round(Number(r.rating) || 0)))}/5
                  </div>
                </div>

                {r.comment ? <p className="mt-3 text-sm text-slate-700">{r.comment}</p> : null}

                <p className="mt-3 text-xs text-slate-500">
                  {t('home.reviewAbout')}{' '}
                  <span className="font-semibold text-slate-700">
                    {r.rider.firstName} {r.rider.lastName}
                  </span>
                  {r.rider.riderFunction ? (
                    <>
                      {' '}•{' '}
                      <span className="font-semibold text-slate-700">{r.rider.riderFunction}</span>
                    </>
                  ) : null}
                </p>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default HomePage;
