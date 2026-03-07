import React, { useEffect, useMemo, useState } from 'react';
import { Rider, AvailabilityStatus, RiderFunction, RiderStatus } from '../types';
import { Phone, MapPin, Bike, Car, Truck, Package, ShieldCheck, X, Star, Zap, MessageCircle, Heart, Share2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

interface RiderCardProps {
  rider: Rider;
  userZone?: string;
  onFavoritesChanged?: () => void;
}

type RiderReview = {
  id: string;
  riderId: string;
  reviewerId?: string;
  reviewerEmail?: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

const getScopedKey = (base: string) => {
  let uid = 'anon';
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof parsed.id === 'string' && parsed.id.trim()) {
        uid = parsed.id.trim();
      }
    }
  } catch {
    // ignore
  }
  return `${base}:${uid}`;
};

const REVIEWS_KEY = () => getScopedKey('samathiakthiak_rider_reviews_v1');
const FAVORITES_KEY = () => getScopedKey('samathiakthiak_favorite_riders_v1');
const RECENT_RIDERS_KEY = () => getScopedKey('samathiakthiak_recent_riders_v1');
const RECENT_RIDERS_MAX = 20;

const readReviews = (): RiderReview[] => {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as RiderReview[]) : [];
  } catch {
    return [];
  }
};

const writeReviews = (items: RiderReview[]) => {
  try {
    localStorage.setItem(REVIEWS_KEY(), JSON.stringify(items));
  } catch {
    // ignore
  }
};

const readFavorites = (): string[] => {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
};

const writeFavorites = (items: string[]) => {
  try {
    localStorage.setItem(FAVORITES_KEY(), JSON.stringify(items));
  } catch {
    // ignore
  }
};

const readRecentRiders = (): string[] => {
  try {
    const raw = localStorage.getItem(RECENT_RIDERS_KEY());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
};

const writeRecentRiders = (items: string[]) => {
  try {
    localStorage.setItem(RECENT_RIDERS_KEY(), JSON.stringify(items));
  } catch {
    // ignore
  }
};

const getReviewerKey = (rev: { reviewerId?: string; reviewerEmail?: string }) => {
  const id = typeof rev.reviewerId === 'string' ? rev.reviewerId.trim() : '';
  if (id) return `id:${id}`;
  const em = typeof rev.reviewerEmail === 'string' ? rev.reviewerEmail.trim().toLowerCase() : '';
  if (em) return `em:${em}`;
  return '';
};

const RiderCard: React.FC<RiderCardProps> = ({ rider, userZone, onFavoritesChanged }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAvailable = rider.availabilityStatus === AvailabilityStatus.ONLINE;
  const isBusy = rider.availabilityStatus === AvailabilityStatus.BUSY;
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState(false);

  const saveReviewLocal = (review: RiderReview) => {
    const current = readReviews();
    const newKey = getReviewerKey(review);
    const cleaned = newKey
      ? current.filter((r) => !(r.riderId === rider.id && getReviewerKey(r) === newKey))
      : current;
    writeReviews([review, ...cleaned].slice(0, 500));
  };


  const getFunctionIcon = () => {
    switch (rider.riderFunction) {
      case RiderFunction.MOTO: return <Bike size={16} />;
      case RiderFunction.AUTO: return <Car size={16} />;
      case RiderFunction.TAXI_BAGAGE: return <Truck size={16} />;
      case RiderFunction.THREE_WHEELS: return <Package size={16} />;
      default: return <Bike size={16} />;
    }
  };

  const isVerified = rider.status === RiderStatus.ACTIVE;

  const refreshReviewStats = () => {
    const all = readReviews();

    // 1 avis max par client et par livreur: on dé-duplique par reviewerKey (on garde le plus récent)
    const byReviewer = new Map<string, RiderReview>();
    for (const r of all) {
      if (r.riderId !== rider.id) continue;
      const key = getReviewerKey(r);
      if (!key) continue;
      const prev = byReviewer.get(key);
      if (!prev) {
        byReviewer.set(key, r);
        continue;
      }
      const prevT = new Date(prev.createdAt).getTime();
      const curT = new Date(r.createdAt).getTime();
      if (!Number.isNaN(curT) && (Number.isNaN(prevT) || curT >= prevT)) {
        byReviewer.set(key, r);
      }
    }

    const items = Array.from(byReviewer.values());
    const count = items.length;
    const avg = count > 0 ? items.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / count : 0;
    setReviewCount(count);
    setAvgRating(Math.round(avg * 10) / 10);
  };

  useEffect(() => {
    refreshReviewStats();
  }, [rider.id]);

  useEffect(() => {
    const favorites = readFavorites();
    setIsFavorite(favorites.includes(rider.id));
  }, [rider.id]);

  const stars = useMemo(() => {
    const full = Math.floor(avgRating);
    return { full };
  }, [avgRating]);

  const cleanPhoneForWhatsApp = (phone: string) => phone.replace(/\D/g, '');
  const whatsAppNumber = cleanPhoneForWhatsApp(rider.phone);
  const whatsAppText = encodeURIComponent(
    `Bonjour ${rider.firstName}, j'ai besoin d'un service (pharmacie/documents). Pouvez-vous m'aider ?`
  );
  const whatsAppHref = whatsAppNumber
    ? `https://wa.me/${whatsAppNumber}?text=${whatsAppText}`
    : undefined;

  const zoneTerm = (userZone || '').toLowerCase().trim();
  const matchesZone = zoneTerm ? rider.address.toLowerCase().includes(zoneTerm) : false;

  const isNew = (() => {
    const joined = new Date(rider.joinedAt);
    if (Number.isNaN(joined.getTime())) return false;
    const diff = Date.now() - joined.getTime();
    return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
  })();

  const markAsRecentlyViewed = () => {
    const current = readRecentRiders();
    const next = [rider.id, ...current.filter((id) => id !== rider.id)].slice(0, RECENT_RIDERS_MAX);
    writeRecentRiders(next);
  };

  const shareRider = async () => {
    const phone = rider.phone;
    const text = `${rider.firstName} ${rider.lastName} - ${phone}`;

    try {
      const nav: any = navigator;
      if (nav?.share) {
        await nav.share({ title: t('riderCard.shareTitle'), text });
        showToast({ message: t('riderCard.toast.shared'), variant: 'success', durationMs: 2500 });
        return;
      }
    } catch {
      // ignore
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        showToast({ message: t('riderCard.toast.copied'), variant: 'success', durationMs: 2500 });
        return;
      }
    } catch {
      // ignore
    }

    showToast({ message: t('riderCard.toast.shareNotSupported'), variant: 'error', durationMs: 3000 });
  };

  return (
    <>
      <div className="card-modern h-full flex flex-col animate-fade-in-up">
        {/* Status badge */}
        <div className="p-5 pb-0 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (!user) {
                navigate('/login');
                return;
              }
              const current = readFavorites();
              const wasFavorite = current.includes(rider.id);
              const next = wasFavorite
                ? current.filter((id) => id !== rider.id)
                : [rider.id, ...current];
              writeFavorites(Array.from(new Set(next)).slice(0, 200));
              setIsFavorite(!wasFavorite);
              onFavoritesChanged?.();

              showToast({
                message: wasFavorite ? t('riderCard.toast.favoriteRemoved') : t('riderCard.toast.favoriteAdded'),
                variant: 'success',
                durationMs: 4500,
                actionLabel: t('riderCard.toast.undo'),
                onAction: () => {
                  const cur = readFavorites();
                  const undoNext = wasFavorite
                    ? [rider.id, ...cur]
                    : cur.filter((id) => id !== rider.id);
                  writeFavorites(Array.from(new Set(undoNext)).slice(0, 200));
                  setIsFavorite(wasFavorite);
                  onFavoritesChanged?.();
                },
              });
            }}
            className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-colors ${
              isFavorite
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
            }`}
            title={isFavorite ? t('riderCard.favoriteRemove') : t('riderCard.favoriteAdd')}
            aria-label={isFavorite ? t('riderCard.favoriteRemove') : t('riderCard.favoriteAdd')}
          >
            <Heart size={18} className={isFavorite ? 'fill-red-500' : ''} />
          </button>

          <div className="flex items-center gap-2">
            {matchesZone && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold border bg-blue-50 text-blue-700 border-blue-200">
                {t('riderCard.inYourZone')}
              </span>
            )}

            {isNew && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200">
                <Sparkles size={14} />
                {t('riderCard.newBadge')}
              </span>
            )}

            <span
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                isAvailable
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : isBusy
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isAvailable ? 'bg-green-600' : isBusy ? 'bg-amber-600' : 'bg-slate-400'
                }`}
              />
              {isAvailable ? t('riderCard.statusOnline') : isBusy ? t('riderCard.statusBusy') : t('riderCard.statusOffline')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Avatar and Header */}
          <div className="flex items-start gap-4 mb-5">
            {/* Avatar */}
            <button
              type="button"
              onClick={() => {
                if (!rider.profilePhotoUrl) return;
                markAsRecentlyViewed();
                setShowPhotoModal(true);
              }}
              className="relative focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 rounded-2xl flex-shrink-0"
            >
              <img 
                src={rider.profilePhotoUrl || `https://picsum.photos/seed/${rider.id}/100/100`} 
                alt={`${rider.firstName} ${rider.lastName}`}
                onError={(e: any) => {
                  console.log('[RiderCard] Erreur chargement photo:', {
                    riderId: rider.id,
                    profilePhotoUrl: rider.profilePhotoUrl,
                    fallbackUsed: true
                  });
                  e.currentTarget.src = `https://picsum.photos/seed/${rider.id}/100/100`;
                }}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200"
              />
              {isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-green-600 rounded-full p-1.5 border-2 border-white shadow-sm">
                  <ShieldCheck size={14} className="text-white" />
                </div>
              )}
            </button>

            {/* Name and Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 truncate">
                {rider.firstName} {rider.lastName}
              </h3>
              {isVerified && (
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 border border-green-200">
                  <ShieldCheck size={12} />
                  {t('riderCard.verified')}
                </div>
              )}
            </div>
          </div>

          {/* Service Type */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200">
            {getFunctionIcon()}
            <span className="font-semibold text-slate-900 text-sm">{rider.riderFunction}</span>
          </div>

          {/* Location and Details */}
          <div className="space-y-3 mb-6 text-sm">
            <div className="flex items-start gap-2 text-slate-700">
              <MapPin size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <span className="line-clamp-2">{rider.address}</span>
            </div>
            
            {rider.gender && (
              <div className="text-xs text-slate-600">
                <strong>{t('riderCard.genderLabel')}</strong> {rider.gender === 'female' ? t('riderCard.genderFemale') : t('riderCard.genderMale')}
              </div>
            )}
          </div>

          {/* Rating (Mock) */}
          <div className="flex items-center gap-2 mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map((i) => {
                const filled = i < stars.full;
                return (
                  <Star
                    key={i}
                    size={14}
                    className={filled ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}
                  />
                );
              })}
            </div>
            <span className="text-xs font-bold text-slate-700 ml-auto">
              {reviewCount > 0 ? `${avgRating}/5 (${reviewCount})` : t('riderCard.noReviews')}
            </span>
          </div>

          {/* Actions */}
          <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a 
              href={`tel:${rider.phone.replace(/\s/g, '')}`}
              className="w-full btn-primary flex items-center justify-center gap-2"
              title={t('riderCard.callNow')}
            >
              <Phone size={18} />
              <span className="font-mono">{rider.phone}</span>
            </a>

            <a
              href={whatsAppHref || '#'}
              target="_blank"
              rel="noreferrer"
              className={`w-full btn-secondary flex items-center justify-center gap-2 ${
                whatsAppHref ? '' : 'opacity-60 pointer-events-none'
              }`}
              title={t('riderCard.contactWhatsapp')}
            >
              <MessageCircle size={18} />
              {t('riderCard.whatsapp')}
            </a>

            <button
              type="button"
              onClick={() => {
                markAsRecentlyViewed();
                shareRider();
              }}
              className="w-full btn-secondary flex items-center justify-center gap-2"
            >
              <Share2 size={18} />
              {t('riderCard.share')}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  navigate('/login');
                  return;
                }
                markAsRecentlyViewed();
                setSelectedRating(0);
                setComment('');
                setShowReviewModal(true);
              }}
              className="w-full btn-ghost flex items-center justify-center gap-2 sm:col-span-2"
            >
              <Star size={18} />
              {t('riderCard.rate')}
            </button>
          </div>
        </div>

        {/* Quick info footer */}
        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-slate-700">
            <Zap size={14} />
            <span className="font-semibold">{t('riderCard.quickInfo')}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (!rider.profilePhotoUrl) return;
              markAsRecentlyViewed();
              setShowPhotoModal(true);
            }}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            {t('riderCard.seePhoto')}
          </button>
        </div>
      </div>

      {/* Photo Modal */}
      {showPhotoModal && rider.profilePhotoUrl && (
        <>
          {/* Backdrop cliquable pour fermer */}
          <div 
            className="fixed inset-0 z-[119] bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowPhotoModal(false)}
          />
          
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-fade-in">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-in max-h-[90vh] flex flex-col">
              {/* Close Button - Grande et visible */}
              <button
                type="button"
                onClick={() => setShowPhotoModal(false)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors z-10"
                title={t('riderCard.closePhoto')}
              >
                <X size={22} />
              </button>

              {/* Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <ShieldCheck size={18} className="text-green-600" />
                  <span>{t('riderCard.photoTitle')}</span>
                </div>
                <p className="text-sm text-slate-600 mt-2">{t('riderCard.photoSubtitle')}</p>
              </div>

              {/* Image */}
              <div className="p-4 bg-slate-50 flex-1 overflow-auto flex items-center justify-center">
                <img
                  src={rider.profilePhotoUrl}
                  alt={`${rider.firstName} ${rider.lastName}`}
                  className="w-full max-h-full object-contain rounded-2xl shadow-sm border border-slate-200 bg-white"
                />
              </div>

              {/* Footer avec bouton Fermer */}
              <div className="px-6 py-4 bg-white border-t border-slate-200 space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t('riderCard.photoHint')}
                </p>
                
                <button
                  type="button"
                  onClick={() => setShowPhotoModal(false)}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <X size={18} />
                  {t('riderCard.close')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showReviewModal && (
        <>
          <div
            className="fixed inset-0 z-[119] bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowReviewModal(false)}
          />

          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-fade-in">
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-scale-in max-h-[90vh] flex flex-col">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors z-10"
                title={t('riderCard.close')}
              >
                <X size={22} />
              </button>

              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Star size={18} className="text-yellow-500" />
                  <span>{t('riderCard.reviewTitle')}</span>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  {rider.firstName} {rider.lastName}
                </p>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900 mb-2">{t('riderCard.yourRating')}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setSelectedRating(v)}
                        className="p-1"
                        aria-label={t('riderCard.rateAria', { v })}
                      >
                        <Star
                          size={26}
                          className={v <= selectedRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">{t('riderCard.commentOptional')}</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="input-modern"
                    placeholder={t('riderCard.commentPlaceholder')}
                    maxLength={200}
                  />
                  <p className="text-xs text-slate-500 mt-1">{comment.length}/200</p>
                </div>
              </div>

              <div className="px-6 py-4 bg-white border-t border-slate-200 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 btn-secondary"
                >
                  {t('riderCard.cancel')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedRating < 1 || selectedRating > 5) return;
                    let reviewerId: string | undefined;
                    let reviewerEmail: string | undefined;
                    try {
                      const raw = localStorage.getItem('user');
                      if (raw) {
                        const parsed = JSON.parse(raw);
                        if (parsed && typeof parsed === 'object') {
                          if (typeof parsed.id === 'string') reviewerId = parsed.id;
                          if (typeof parsed.email === 'string') reviewerEmail = parsed.email;
                        }
                      }
                    } catch {
                      // ignore
                    }
                    const review: RiderReview = {
                      id: `rev_${Date.now()}_${Math.random().toString(16).slice(2)}`,
                      riderId: rider.id,
                      reviewerId,
                      reviewerEmail,
                      rating: selectedRating,
                      comment: comment.trim() ? comment.trim() : undefined,
                      createdAt: new Date().toISOString(),
                    };
                    saveReviewLocal(review);
                    refreshReviewStats();
                    setShowReviewModal(false);
                  }}
                  className={`flex-1 btn-primary ${selectedRating < 1 ? 'opacity-60 pointer-events-none' : ''}`}
                >
                  {t('riderCard.send')}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default RiderCard;
