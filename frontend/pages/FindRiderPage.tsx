import React, { useMemo, useState, useEffect, useRef } from 'react';
import { mockApi } from '../services/mockDb';
import { AvailabilityStatus, Rider } from '../types';
import RiderCard from '../components/RiderCard';
import RiderCardSkeleton from '../components/RiderCardSkeleton';
import InfiniteScroll from '../components/InfiniteScroll';
import { usePayment } from '../context/PaymentContext';
import { useAuth } from '../context/AuthContext';
import { Search, Filter, Users, Clock, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
const USER_ZONE_KEY = () => getScopedKey('samathiakthiak_user_zone_v1');

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

const FindRiderPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'closest' | 'default' | 'availability' | 'favorites' | 'name'>('closest');
  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | string>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | AvailabilityStatus>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [userZone, setUserZone] = useState('');
  const [onlyMyZone, setOnlyMyZone] = useState(false);
  const [favoritesVersion, setFavoritesVersion] = useState(0);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const { session } = usePayment();

  useEffect(() => {
    loadRiders({ silent: false });
  }, []);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (!search) return;
      setSearch('');
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [search]);

  useEffect(() => {
    setUserZone(readUserZone());
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadRiders({ silent: true });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!session.isActive || !session.expiresAt) {
      setRemainingMs(null);
      return;
    }

    const update = () => {
      const diff = session.expiresAt! - Date.now();
      setRemainingMs(diff > 0 ? diff : 0);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [session.isActive, session.expiresAt]);

  const loadRiders = async (opts?: { silent?: boolean }) => {
    try {
      if (opts?.silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      const data = await mockApi.getPublicRiders();
      setRiders(data);
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      console.error('Erreur lors du chargement des livreurs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatLastUpdated = (iso: string) => {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const favorites = useMemo(() => readFavorites(), [favoritesVersion]);
  const myRiderId = user?.role === 'rider' ? user.riderId : undefined;
  const filteredRiders = riders.filter((rider) => {
    if (myRiderId && rider.id === myRiderId) return false;
    const firstName = String((rider as any)?.firstName ?? '').toLowerCase();
    const lastName = String((rider as any)?.lastName ?? '').toLowerCase();
    const phone = String((rider as any)?.phone ?? '').toLowerCase();
    const address = String((rider as any)?.address ?? '').toLowerCase();

    const term = search.toLowerCase().trim();
    const matchesSearch =
      term === '' ||
      firstName.includes(term) ||
      lastName.includes(term) ||
      phone.includes(term) ||
      address.includes(term);

    const loc = locationFilter.toLowerCase().trim();
    const matchesLocation = loc === '' || address.includes(loc);

    const matchesType =
      typeFilter === 'all' || rider.riderFunction === typeFilter;

    const matchesGender =
      genderFilter === 'all' || rider.gender === genderFilter;

    const matchesAvailability =
      availabilityFilter === 'all' || rider.availabilityStatus === availabilityFilter;

    const matchesFavorites = !onlyFavorites || favorites.includes(rider.id);

    const zoneTerm = userZone.toLowerCase().trim();
    const matchesZone = !onlyMyZone || zoneTerm === '' || address.includes(zoneTerm);

    return matchesSearch && matchesLocation && matchesType && matchesGender && matchesAvailability && matchesFavorites && matchesZone;
  });

  const sortedRiders = useMemo(() => {
    const list = [...filteredRiders];

    if (sortBy === 'closest') {
      const zoneTerm = (userZone || '').toLowerCase().trim();
      const locTerm = (locationFilter || '').toLowerCase().trim();
      const searchTerm = (search || '').toLowerCase().trim();
      const tokens = searchTerm.split(/\s+/).filter(Boolean);

      const score = (r: Rider) => {
        const addr = (r.address || '').toLowerCase();
        const fullName = `${r.firstName} ${r.lastName}`.toLowerCase();
        const phone = (r.phone || '').toLowerCase();
        let s = 0;

        if (zoneTerm && addr.includes(zoneTerm)) s += 50;
        if (locTerm && addr.includes(locTerm)) s += 30;

        for (const tok of tokens) {
          if (tok.length < 2) continue;
          if (fullName.includes(tok)) s += 10;
          if (phone.includes(tok)) s += 8;
          if (addr.includes(tok)) s += 6;
        }

        if (r.availabilityStatus === AvailabilityStatus.ONLINE) s += 3;
        else if (r.availabilityStatus === AvailabilityStatus.BUSY) s += 1;

        return s;
      };

      list.sort((a, b) => {
        const sa = score(a);
        const sb = score(b);
        if (sa !== sb) return sb - sa;
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });

      return list;
    }

    if (sortBy === 'name') {
      list.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
      return list;
    }

    if (sortBy === 'favorites') {
      list.sort((a, b) => {
        const af = favorites.includes(a.id) ? 1 : 0;
        const bf = favorites.includes(b.id) ? 1 : 0;
        if (af !== bf) return bf - af;
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });
      return list;
    }

    if (sortBy === 'availability') {
      const rank = (s: AvailabilityStatus) => {
        if (s === AvailabilityStatus.ONLINE) return 0;
        if (s === AvailabilityStatus.BUSY) return 1;
        return 2;
      };
      list.sort((a, b) => {
        const ra = rank(a.availabilityStatus);
        const rb = rank(b.availabilityStatus);
        if (ra !== rb) return ra - rb;
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      });
      return list;
    }

    return list;
  }, [filteredRiders, favorites, sortBy]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="page-shell py-8 sm:py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight">
            {t('findRider.title')}
          </h1>
          <p className="text-base sm:text-lg text-slate-600">
            {t('findRider.subtitle')}
          </p>
        </div>

        {/* Access Session Badge */}
        {session.isActive && remainingMs !== null && (
          <div className="mb-8 animate-scale-in">
            <div className="card-modern p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center">
                    <Users size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="text-slate-900 font-semibold">{t('findRider.premiumActive')}</p>
                    <p className="text-slate-600 text-sm">
                      {t('findRider.tier')}:{' '}
                      <span className="font-bold uppercase">{session.tier}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-5 py-3 rounded-xl">
                  <Clock size={20} className="text-blue-600" />
                  <div className="text-right">
                    <p className="text-slate-600 text-xs">{t('findRider.timeRemaining')}</p>
                    <p className="text-slate-900 font-mono font-bold text-lg">{formatTime(remainingMs)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters Card */}
        <div className="card-modern p-6 sm:p-8 mb-8 animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3 mb-6">
            <Filter size={22} className="text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{t('findRider.filtersTitle')}</h2>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="text-sm text-slate-600">
              {lastUpdatedAt ? (
                <span>
                  {t('findRider.lastUpdate')} <span className="font-semibold text-slate-900">{formatLastUpdated(lastUpdatedAt)}</span>
                </span>
              ) : (
                <span>{t('findRider.lastUpdate')} —</span>
              )}
              {refreshing && <span className="ml-2 text-blue-600 font-semibold">{t('findRider.refreshing')}</span>}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="input-modern sm:w-56"
              >
                <option value="closest">{t('findRider.sort.closest')}</option>
                <option value="default">{t('findRider.sort.default')}</option>
                <option value="availability">{t('findRider.sort.availability')}</option>
                <option value="favorites">{t('findRider.sort.favorites')}</option>
                <option value="name">{t('findRider.sort.name')}</option>
              </select>

              <button
                onClick={() => loadRiders({ silent: true })}
                className="btn-ghost"
                type="button"
              >
                {t('findRider.refresh')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Search Input */}
            <div className="md:col-span-2">
              <label className="label-modern">{t('findRider.searchLabel')}</label>
              <div className="relative">
                <Search size={20} className="absolute left-4 top-3.5 text-slate-400" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('findRider.searchPlaceholder')}
                  list="find-rider-search-suggestions"
                  autoComplete="on"
                  className={search ? 'input-modern pl-12 pr-12' : 'input-modern pl-12'}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      searchRef.current?.focus();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    aria-label="Clear"
                    title="Clear"
                  >
                    <X size={18} />
                  </button>
                ) : null}
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="label-modern">{t('findRider.locationLabel')}</label>
              <input
                type="text"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                placeholder={t('findRider.locationPlaceholder')}
                list="find-rider-location-suggestions"
                autoComplete="on"
                className="input-modern"
              />
            </div>

            {/* User Zone */}
            <div>
              <label className="label-modern">{t('findRider.userZoneLabel')}</label>
              <input
                type="text"
                value={userZone}
                onChange={(e) => {
                  setUserZone(e.target.value);
                  writeUserZone(e.target.value);
                }}
                placeholder={t('findRider.userZonePlaceholder')}
                list="find-rider-zone-suggestions"
                autoComplete="on"
                className="input-modern"
              />
            </div>

            <datalist id="find-rider-search-suggestions">
              {Array.from(
                new Set(
                  riders
                    .flatMap((r) => [`${r.firstName} ${r.lastName}`, r.phone])
                    .filter(Boolean)
                    .map((s) => String(s).trim())
                    .filter((s) => s.length >= 2)
                )
              )
                .slice(0, 30)
                .map((v) => (
                  <option key={v} value={v} />
                ))}
            </datalist>

            <datalist id="find-rider-location-suggestions">
              {Array.from(
                new Set(
                  riders
                    .map((r) => r.address)
                    .filter(Boolean)
                    .map((s) => String(s).trim())
                    .filter((s) => s.length >= 2)
                )
              )
                .slice(0, 30)
                .map((v) => (
                  <option key={v} value={v} />
                ))}
            </datalist>

            <datalist id="find-rider-zone-suggestions">
              {Array.from(
                new Set(
                  riders
                    .map((r) => r.address)
                    .filter(Boolean)
                    .flatMap((addr) =>
                      String(addr)
                        .split(/[,\n\r]+/)
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                    .filter((s) => s.length >= 2)
                )
              )
                .slice(0, 40)
                .map((v) => (
                  <option key={v} value={v} />
                ))}
            </datalist>

            {/* Type Filter */}
            <div>
              <label className="label-modern">{t('findRider.vehicleTypeLabel')}</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="input-modern"
              >
                <option value="all">{t('findRider.all')}</option>
                <option value="Livreur moto">{t('findRider.vehicleMoto')}</option>
                <option value="Livreur auto">{t('findRider.vehicleCar')}</option>
                <option value="Livreur Taxi Bagage">{t('findRider.vehicleTaxiLuggage')}</option>
                <option value="Livreur 3 roues">{t('findRider.vehicleThreeWheels')}</option>
              </select>
            </div>

            {/* Availability Filter */}
            <div>
              <label className="label-modern">{t('findRider.availabilityLabel')}</label>
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                className="input-modern"
              >
                <option value="all">{t('findRider.all')}</option>
                <option value={AvailabilityStatus.ONLINE}>{t('findRider.availabilityOnline')}</option>
                <option value={AvailabilityStatus.BUSY}>{t('findRider.availabilityBusy')}</option>
                <option value={AvailabilityStatus.OFFLINE}>{t('findRider.availabilityOffline')}</option>
              </select>
            </div>

            {/* Gender Filter */}
            <div>
              <label className="label-modern">{t('findRider.genderLabel')}</label>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as any)}
                className="input-modern"
              >
                <option value="all">{t('findRider.all')}</option>
                <option value="male">{t('findRider.genderMale')}</option>
                <option value="female">{t('findRider.genderFemale')}</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="md:col-span-2">
              <label className="label-modern">{t('findRider.optionsLabel')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={onlyFavorites}
                    onChange={(e) => setOnlyFavorites(e.target.checked)}
                    className="h-4 w-4"
                  />
                  {t('findRider.onlyFavorites')}
                </label>
                <label className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={onlyMyZone}
                    onChange={(e) => setOnlyMyZone(e.target.checked)}
                    className="h-4 w-4"
                  />
                  {t('findRider.onlyMyZone')}
                </label>
              </div>
            </div>
          </div>

          {/* Results Counter */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Users size={18} className="text-blue-600" />
              </div>
              <p className="text-slate-900 font-semibold">
                {t('findRider.resultsCount', { count: sortedRiders.length })}
              </p>
            </div>
            {(search || locationFilter || userZone || typeFilter !== 'all' || genderFilter !== 'all' || availabilityFilter !== 'all' || onlyFavorites || onlyMyZone) && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setLocationFilter('');
                  setTypeFilter('all');
                  setGenderFilter('all');
                  setAvailabilityFilter('all');
                  setOnlyFavorites(false);
                  setOnlyMyZone(false);
                  setSortBy('closest');
                }}
                className="btn-ghost"
              >
                {t('findRider.resetFilters')}
              </button>
            )}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {Array.from({ length: 9 }).map((_, idx) => (
              <div key={idx} className="animate-fade-in-up">
                <RiderCardSkeleton />
              </div>
            ))}
          </div>
        ) : riders.length === 0 ? (
          <div className="text-center py-24 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <Users size={36} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('findRider.noRidersTitle')}</h3>
            <p className="text-slate-600">{t('findRider.noRidersSubtitle')}</p>
          </div>
        ) : sortedRiders.length === 0 ? (
          <div className="card-modern p-12 text-center animate-fade-in">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Search size={34} className="text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('findRider.emptyTitle')}</h3>
            <p className="text-slate-600">{t('findRider.emptySubtitle')}</p>
          </div>
        ) : (
          <InfiniteScroll
            key={`${sortBy}_${search}_${locationFilter}_${userZone}_${typeFilter}_${genderFilter}_${availabilityFilter}_${onlyFavorites}_${onlyMyZone}`}
            items={sortedRiders}
            pageSize={12}
            gridClassName="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            renderItem={(rider, idx) => (
              <div style={{ animationDelay: `${idx * 0.05}s` }} className="animate-fade-in-up">
                <RiderCard
                  rider={rider}
                  userZone={userZone}
                  onFavoritesChanged={() => setFavoritesVersion((v) => v + 1)}
                />
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
};

export default FindRiderPage;
