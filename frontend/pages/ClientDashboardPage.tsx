import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockDb';
import { Rider, UserType } from '../types';
import { Heart, Star, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from '../components/Modal';

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

const FAVORITES_KEY = () => getScopedKey('samathiakthiak_favorite_riders_v1');
const REVIEWS_KEY = () => getScopedKey('samathiakthiak_rider_reviews_v1');
const RECENT_RIDERS_KEY = () => getScopedKey('samathiakthiak_recent_riders_v1');
const USER_ZONE_KEY = () => getScopedKey('samathiakthiak_user_zone_v1');

type RiderReview = {
  id: string;
  riderId: string;
  reviewerId?: string;
  reviewerEmail?: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

const getReviewerKey = (rev: { reviewerId?: string; reviewerEmail?: string }) => {
  const id = typeof rev.reviewerId === 'string' ? rev.reviewerId.trim() : '';
  if (id) return `id:${id}`;
  const em = typeof rev.reviewerEmail === 'string' ? rev.reviewerEmail.trim().toLowerCase() : '';
  if (em) return `em:${em}`;
  return '';
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

const writeReviews = (items: RiderReview[]) => {
  try {
    localStorage.setItem(REVIEWS_KEY(), JSON.stringify(items));
  } catch {
    // ignore
  }
};

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

const readUserZone = (): string => {
  try {
    return localStorage.getItem(USER_ZONE_KEY()) || '';
  } catch {
    return '';
  }
};

const writeUserZone = (zone: string) => {
  try {
    localStorage.setItem(USER_ZONE_KEY(), zone);
  } catch {
    // ignore
  }
};

export default function ClientDashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const [reviewsVersion, setReviewsVersion] = useState(0);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editZone, setEditZone] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.type !== UserType.CLIENT) {
      navigate(user.role === 'admin' ? '/admin' : '/rider-dashboard');
      return;
    }
  }, [navigate, user]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await mockApi.getPublicRiders();
        setRiders(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!user) return;
    setEditName(user.name || '');
    setEditZone(readUserZone());
  }, [user]);

  useEffect(() => {
    const favoritesKey = FAVORITES_KEY();
    const reviewsKey = REVIEWS_KEY();
    const onStorage = (e: StorageEvent) => {
      if (e.key === favoritesKey) setFavoritesVersion(v => v + 1);
      if (e.key === reviewsKey) setReviewsVersion(v => v + 1);
    };
    const onFocus = () => setFavoritesVersion(v => v + 1);
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('focus', onFocus);
    };
  }, [user?.id]);

  const favorites = useMemo(() => readFavorites(), [favoritesVersion]);
  const favoriteRiders = useMemo(() => riders.filter(r => favorites.includes(r.id)), [favorites, riders]);

  const recentRiderIds = useMemo(() => readRecentRiders(), [favoritesVersion, reviewsVersion]);
  const recentRiders = useMemo(
    () => recentRiderIds.map((id) => riders.find((r) => r.id === id)).filter(Boolean) as Rider[],
    [recentRiderIds, riders]
  );

  const myReviews = useMemo(() => {
    const all = readReviews();
    if (!user) return [];
    const uid = user.id;
    const email = user.email;
    return all
      .filter(r => (uid && r.reviewerId === uid) || (email && r.reviewerEmail === email))
      .slice(0, 200);
  }, [reviewsVersion, user]);


  const ridersById = useMemo(() => {
    const map = new Map<string, Rider>();
    for (const r of riders) map.set(r.id, r);
    return map;
  }, [riders]);

  return (
    <div className="page-shell py-8 sm:py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900">{t('client.title')}</h1>
            <p className="text-slate-600 mt-1">{t('client.subtitle')}</p>
          </div>

          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="btn-secondary"
          >
            {t('common.logout')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="card-modern p-6 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
                <User size={22} className="text-white" />
              </div>
              <div>
                <p className="text-slate-900 font-bold">{user?.name || t('client.typeClient')}</p>
                <p className="text-slate-600 text-sm">{user?.email || ''}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 space-y-2 text-sm text-slate-700">
              <p>
                <span className="font-semibold">{t('client.typeLabel')}</span> {t('client.typeClient')}
              </p>
              <p>
                <span className="font-semibold">{t('client.favoritesLabel')}</span> {favorites.length}
              </p>
            </div>

            <div className="mt-6">
              <Link to="/find-rider" className="btn-primary w-full text-center inline-block">
                {t('common.findRider')}
              </Link>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowEditProfile(true)}
                className="btn-secondary w-full"
              >
                {t('client.editProfile.button')}
              </button>
            </div>
          </div>

          <div className="card-modern p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
                <Heart size={22} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{t('client.myFavoritesTitle')}</h2>
                <p className="text-slate-600 text-sm">{t('client.myFavoritesSubtitle')}</p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-20 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : favorites.length === 0 ? (
              <div className="py-10 text-slate-600">
                {t('client.noFavorites')}{' '}
                <Link to="/find-rider" className="text-blue-600 font-bold hover:underline">
                  {t('common.findRider')}
                </Link>.
              </div>
            ) : favoriteRiders.length === 0 ? (
              <div className="py-10 text-slate-600">
                {t('client.favoritesNoVisible')}
              </div>
            ) : (
              <div className="space-y-3">
                {favoriteRiders.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedRider(r)}
                        className="font-black text-slate-900 truncate text-left hover:underline"
                      >
                        {r.firstName} {r.lastName}
                      </button>
                      <p className="text-sm text-slate-600 truncate">{r.riderFunction} • {r.address}</p>
                    </div>
                    <a className="btn-primary" href={`tel:${r.phone.replace(/\s/g, '')}`}>
                      {t('client.call')}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-modern p-6 lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                <User size={22} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{t('client.recentlyViewed.title')}</h2>
                <p className="text-slate-600 text-sm">{t('client.recentlyViewed.subtitle')}</p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-20 rounded-2xl border border-slate-200 bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : recentRiders.length === 0 ? (
              <div className="py-6 text-slate-600">
                {t('client.recentlyViewed.emptyPrefix')}{' '}
                <Link to="/find-rider" className="text-blue-600 font-bold hover:underline">
                  {t('common.findRider')}
                </Link>{' '}
                {t('client.recentlyViewed.emptySuffix')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recentRiders.slice(0, 6).map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-slate-200 bg-white">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => setSelectedRider(r)}
                        className="font-black text-slate-900 truncate text-left hover:underline"
                      >
                        {r.firstName} {r.lastName}
                      </button>
                      <p className="text-sm text-slate-600 truncate">{r.riderFunction} • {r.address}</p>
                    </div>
                    <a className="btn-primary" href={`tel:${r.phone.replace(/\s/g, '')}`}>
                      {t('client.call')}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card-modern p-6 lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-50 border border-yellow-200 flex items-center justify-center">
                <Star size={22} className="text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">{t('client.myReviewsTitle')}</h2>
                <p className="text-slate-600 text-sm">{t('client.myReviewsSubtitle')}</p>
              </div>
            </div>

            {myReviews.length === 0 ? (
              <div className="py-6 text-slate-600">
                {t('client.noReviews')}{' '}
                <Link to="/find-rider" className="text-blue-600 font-bold hover:underline">
                  {t('common.findRider')}
                </Link>.
              </div>
            ) : (
              <div className="space-y-3">
                {myReviews.map((rev) => {
                  const rider = ridersById.get(rev.riderId);
                  const riderName = rider ? `${rider.firstName} ${rider.lastName}` : rev.riderId;
                  return (
                    <div key={rev.id} className="p-4 rounded-2xl border border-slate-200 bg-white">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 truncate">{riderName}</p>
                          <p className="text-sm text-slate-600 truncate">
                            {new Date(rev.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <Star
                              key={i}
                              size={14}
                              className={i <= (Number(rev.rating) || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}
                            />
                          ))}
                        </div>
                      </div>
                      {rev.comment ? (
                        <p className="mt-3 text-sm text-slate-700">{rev.comment}</p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        title={t('client.editProfile.title')}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowEditProfile(false)} className="flex-1 btn-secondary">
              {t('client.editProfile.cancel')}
            </button>
            <button
              type="button"
              onClick={() => {
                updateUser({ name: editName.trim() ? editName.trim() : undefined });
                writeUserZone(editZone.trim());
                setShowEditProfile(false);
              }}
              className="flex-1 btn-primary"
            >
              {t('client.editProfile.save')}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label-modern">{t('client.editProfile.nameLabel')}</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="input-modern"
              placeholder={t('client.editProfile.namePlaceholder')}
            />
          </div>

          <div>
            <label className="label-modern">{t('client.editProfile.zoneLabel')}</label>
            <input
              type="text"
              value={editZone}
              onChange={(e) => setEditZone(e.target.value)}
              className="input-modern"
              placeholder={t('client.editProfile.zonePlaceholder')}
            />
            <p className="text-xs text-slate-500 mt-2">
              {t('client.editProfile.zoneHint')}
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(selectedRider)}
        onClose={() => setSelectedRider(null)}
        title={t('client.riderDetails.title')}
        footer={
          selectedRider ? (
            <div className="flex gap-3">
              <a className="flex-1 btn-primary text-center" href={`tel:${selectedRider.phone.replace(/\s/g, '')}`}>
                {t('client.call')}
              </a>
              <button type="button" onClick={() => setSelectedRider(null)} className="flex-1 btn-secondary">
                {t('common.close')}
              </button>
            </div>
          ) : null
        }
      >
        {selectedRider ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center flex-shrink-0">
                {selectedRider.profilePhotoUrl ? (
                  <img
                    src={selectedRider.profilePhotoUrl}
                    alt={`${selectedRider.firstName} ${selectedRider.lastName}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="text-slate-700 font-black">
                    {String(selectedRider.firstName || '').slice(0, 1).toUpperCase()}
                    {String(selectedRider.lastName || '').slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-xl font-black text-slate-900 truncate">
                  {selectedRider.firstName} {selectedRider.lastName}
                </p>
                <p className="text-slate-600 text-sm truncate">{selectedRider.riderFunction}</p>
              </div>
            </div>

            {(() => {
              const availabilityKey =
                selectedRider.availabilityStatus === 'online'
                  ? 'findRider.availabilityOnline'
                  : selectedRider.availabilityStatus === 'busy'
                    ? 'findRider.availabilityBusy'
                    : 'findRider.availabilityOffline';

              const statusKey =
                selectedRider.status === 'active'
                  ? 'client.riderDetails.statusActive'
                  : selectedRider.status === 'pending'
                    ? 'client.riderDetails.statusPending'
                    : selectedRider.status === 'rejected'
                      ? 'client.riderDetails.statusRejected'
                      : selectedRider.status === 'banned'
                        ? 'client.riderDetails.statusBanned'
                        : undefined;

              return (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <p className="text-xs text-slate-500">{t('client.riderDetails.phone')}</p>
                    <p className="font-bold text-slate-900 break-words">{selectedRider.phone}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <p className="text-xs text-slate-500">{t('client.riderDetails.availability')}</p>
                    <p className="font-bold text-slate-900">{t(availabilityKey as any)}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white sm:col-span-2">
                    <p className="text-xs text-slate-500">{t('client.riderDetails.address')}</p>
                    <p className="font-bold text-slate-900 break-words">{selectedRider.address}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <p className="text-xs text-slate-500">{t('client.riderDetails.gender')}</p>
                    <p className="font-bold text-slate-900">
                      {selectedRider.gender === 'female'
                        ? t('findRider.genderFemale')
                        : selectedRider.gender === 'male'
                          ? t('findRider.genderMale')
                          : '-'}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <p className="text-xs text-slate-500">{t('client.riderDetails.status')}</p>
                    <p className="font-bold text-slate-900">{statusKey ? t(statusKey as any) : String(selectedRider.status)}</p>
                  </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
