
import { Rider, RiderStatus, AvailabilityStatus, RiderFunction, PaymentProvider, Order, OrderStatus, SenegalRegion, ServiceCategory, User, UserType, BusinessUser, ClientUser } from '../types';

// Utiliser l'URL de l'API depuis les variables d'environnement ou par défaut localhost
// En production, utilisez window.location.origin pour utiliser le même domaine
const getApiBaseUrl = () => {
  // Vérifier si on est en production (même domaine) ou développement
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return window.location.origin; // En production, utiliser le même serveur
  }

  // En dev sur localhost, utiliser des URLs relatives pour passer par le proxy Vite (/api, /uploads)
  // et éviter les problèmes CORS quand le frontend tourne sur un autre port.
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    return '';
  }

  // Fallback: utiliser la variable d'environnement ou localhost par défaut
  const env = (import.meta as any)?.env as { VITE_API_URL?: string } | undefined;
  return (typeof import.meta !== 'undefined' && env?.VITE_API_URL)
    ? env.VITE_API_URL
    : 'http://localhost:8000';
};

type PaymentTransaction = {
  id: string;
  provider: PaymentProvider;
  phone: string;
  amount: number;
  status: 'success' | 'failed';
  createdAt: string;
  purpose?: string;
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

const PAYMENT_HISTORY_KEY = () => getScopedKey('samathiakthiak_payment_history_v1');

const readPaymentHistory = (): PaymentTransaction[] => {
  try {
    const raw = localStorage.getItem(PAYMENT_HISTORY_KEY());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PaymentTransaction[]) : [];
  } catch {
    return [];
  }
};

const writePaymentHistory = (items: PaymentTransaction[]) => {
  try {
    localStorage.setItem(PAYMENT_HISTORY_KEY(), JSON.stringify(items));
  } catch {
    // ignore
  }
};

const addPaymentHistoryItem = (item: PaymentTransaction) => {
  const current = readPaymentHistory();
  writePaymentHistory([item, ...current].slice(0, 50));
};

const ORDERS_KEY = () => getScopedKey('samathiakthiak_orders_v1');

const readOrders = (): Order[] => {
  try {
    const raw = localStorage.getItem(ORDERS_KEY());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
};

const writeOrders = (items: Order[]) => {
  try {
    localStorage.setItem(ORDERS_KEY(), JSON.stringify(items));
  } catch {
    // ignore
  }
};

const BUSINESS_USERS_KEY = 'samathiakthiak_business_users_v1';

const CLIENT_USERS_KEY = 'samathiakthiak_client_users_v1';

const readBusinessUsers = (): BusinessUser[] => {
  try {
    const raw = localStorage.getItem(BUSINESS_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BusinessUser[]) : [];
  } catch {
    return [];
  }
};

const writeBusinessUsers = (items: BusinessUser[]) => {
  try {
    localStorage.setItem(BUSINESS_USERS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
};

const readClientUsers = (): Array<ClientUser & { password: string }> => {
  try {
    const raw = localStorage.getItem(CLIENT_USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Array<ClientUser & { password: string }>) : [];
  } catch {
    return [];
  }
};

const writeClientUsers = (items: Array<ClientUser & { password: string }>) => {
  try {
    localStorage.setItem(CLIENT_USERS_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
};

const estimateOrderPrice = (category: ServiceCategory, pickup: SenegalRegion, dropoff: SenegalRegion): number => {
  const baseByCategory: Record<ServiceCategory, number> = {
    [ServiceCategory.PHARMACY]: 1200,
    [ServiceCategory.DOCUMENTS]: 800,
    [ServiceCategory.GROCERIES]: 1500,
    [ServiceCategory.PARCEL]: 2000,
  };

  const regionIndex: SenegalRegion[] = [
    SenegalRegion.DAKAR,
    SenegalRegion.THIES,
    SenegalRegion.DIOURBEL,
    SenegalRegion.FATICK,
    SenegalRegion.KAOLACK,
    SenegalRegion.KAFFRINE,
    SenegalRegion.LOUGA,
    SenegalRegion.SAINT_LOUIS,
    SenegalRegion.MATAM,
    SenegalRegion.TAMBACOUNDA,
    SenegalRegion.KEDOUGOU,
    SenegalRegion.KOLDA,
    SenegalRegion.SEDHIOU,
    SenegalRegion.ZIGUINCHOR,
  ];

  const a = regionIndex.indexOf(pickup);
  const b = regionIndex.indexOf(dropoff);
  const steps = a >= 0 && b >= 0 ? Math.abs(a - b) : 6;

  const base = baseByCategory[category] ?? 1200;
  const zoneFee = pickup === dropoff ? 0 : 600 + steps * 350;
  const nationalSurcharge = pickup === dropoff ? 0 : 400;

  return Math.round(base + zoneFee + nationalSurcharge);
};

export const API_BASE_URL = getApiBaseUrl();
const API_URL = `${API_BASE_URL}/api`;

export type PublicStats = {
  activeRiders: number;
  satisfiedClients: number;
  registeredClients?: number;
  coverageZones: number;
  generatedAt?: string;
};

export type PublicReview = {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewerName?: string;
  rider: {
    id: string;
    firstName: string;
    lastName: string;
    riderFunction: string;
  };
};

export type UpsertReviewInput = {
  riderId: string;
  rating: number;
  comment?: string;
};

const getHeaders = () => {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

const normalizeRider = (data: any): Rider => {
  const makeAbsolute = (input?: unknown) => {
    if (!input) return undefined;

    const url =
      typeof input === 'string'
        ? input
        : typeof (input as any)?.url === 'string'
          ? (input as any).url
          : typeof (input as any)?.path === 'string'
            ? (input as any).path
          : typeof (input as any)?.original === 'string'
            ? (input as any).original
            : undefined;

    if (!url) return undefined;
    if (url.startsWith('http')) return url;
    // Utiliser l'URL relative pour que le proxy Vite fonctionne
    return url.startsWith('/') ? url : `/${url}`;
  };

  const profilePhotoUrl = makeAbsolute(data.profile_photo ?? data.profilePhotoUrl);

  return {
    id: data.id.toString(),
    firstName: data.firstName || data.first_name,
    lastName: data.lastName || data.last_name,
    phone: data.phone || "",
    address: data.address || "",
    status: (data.status as RiderStatus) || RiderStatus.PENDING,
    availabilityStatus: (data.availability as AvailabilityStatus) || AvailabilityStatus.OFFLINE,
    riderFunction: (data.riderFunction as RiderFunction) || RiderFunction.MOTO,
    emailVerified: true,
    verificationNote: (data.verificationNote as string) || (data.verification_note as string) || undefined,
    gender: data.gender,
    profilePhotoUrl,
    idCardUrl: makeAbsolute(data.id_card ?? data.idCardUrl),
    licenseUrl: makeAbsolute(data.license ?? data.licenseUrl),
    joinedAt: data.joined_at || data.joinedAt || new Date().toISOString(),
    subscriptionExpiresAt: data.subscriptionExpiresAt || data.subscription_expires_at || undefined,
    subscriptionActive: data.subscriptionActive || undefined,
  };
};

export const mockApi = {
  login: async (identifier: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Identifiants incorrects");
    }
    return response.json();
  },

  registerClient: async (input: { name: string; email: string; password: string }): Promise<{ user: ClientUser; token: string }> => {
    const users = readClientUsers();
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();

    if (!name) throw new Error('Le nom complet est requis');
    if (!email) throw new Error("L'email est requis");
    if (users.some(u => u.email.toLowerCase() === email)) {
      throw new Error('Un compte existe déjà avec cet email');
    }
    if (!input.password || input.password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères');
    }

    const user: ClientUser = {
      id: `cli_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      role: 'user',
      type: UserType.CLIENT,
      name,
      email,
      emailVerified: false,
    };

    writeClientUsers([{ ...user, password: input.password }, ...users].slice(0, 500));

    try {
      window.dispatchEvent(new Event('samathiakthiak:clients_updated'));
    } catch {
      // ignore
    }
    const token = `client_${user.id}`;
    return { user, token };
  },

  loginClient: async (email: string, password: string): Promise<{ user: ClientUser; token: string }> => {
    const users = readClientUsers();
    const normalizedEmail = email.trim().toLowerCase();
    const found = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!found || found.password !== password) {
      throw new Error('Identifiants incorrects');
    }

    const { password: _pw, ...user } = found;
    const token = `client_${user.id}`;
    return { user: user as ClientUser, token };
  },


  getMe: async (): Promise<Rider> => {
    const response = await fetch(`${API_URL}/riders/me`, { headers: getHeaders() });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('Session expirée. Veuillez vous reconnecter.');
      }

      try {
        const errorData = await response.json();
        throw new Error(errorData?.message || `Erreur lors du chargement du profil (${response.status}).`);
      } catch {
        try {
          const txt = await response.text();
          const compact = txt?.trim() ? txt.trim().slice(0, 200) : '';
          throw new Error(compact || `Erreur lors du chargement du profil (${response.status}).`);
        } catch {
          throw new Error(`Erreur lors du chargement du profil (${response.status}).`);
        }
      }
    }
    const data = await response.json();
    return normalizeRider(data);
  },

  updateRiderPhone: async (phone: string): Promise<Rider> => {
    const formData = new FormData();
    formData.append('phone', phone);

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/riders/me/profile`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors de la mise à jour du numéro');
    }

    const data = await response.json();
    return normalizeRider(data);
  },

  getPublicRiders: async (): Promise<Rider[]> => {
    try {
      const response = await fetch(`${API_URL}/riders/public`);
      if (!response.ok) return [];
      const data = await response.json();
      return Array.isArray(data) ? data.map(normalizeRider) : [];
    } catch (e) {
      return [];
    }
  },

  getPublicStats: async (): Promise<PublicStats> => {
    let localClientsCount = 0;
    try {
      localClientsCount = readClientUsers().length;
    } catch {
      localClientsCount = 0;
    }

    try {
      const response = await fetch(`${API_URL}/stats`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      return {
        activeRiders: Number(data?.activeRiders) || 0,
        satisfiedClients: Number(data?.satisfiedClients) || 0,
        registeredClients: (Number(data?.registeredClients) || 0) + localClientsCount,
        coverageZones: Number(data?.coverageZones) || 0,
        generatedAt: typeof data?.generatedAt === 'string' ? data.generatedAt : undefined,
      };
    } catch {
      return {
        activeRiders: 0,
        satisfiedClients: 0,
        registeredClients: localClientsCount,
        coverageZones: 0,
      };
    }
  },

  getPublicReviews: async (limit = 12): Promise<PublicReview[]> => {
    const response = await fetch(`${API_URL}/reviews/public?limit=${encodeURIComponent(String(limit))}`);
    if (!response.ok) return [];
    const data = await response.json().catch(() => ({}));
    const rows = Array.isArray(data?.reviews) ? data.reviews : [];
    return rows
      .map((r: any) => ({
        id: String(r?.id ?? ''),
        rating: Number(r?.rating) || 0,
        comment: typeof r?.comment === 'string' ? r.comment : undefined,
        createdAt: typeof r?.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
        reviewerName: typeof r?.reviewerName === 'string' ? r.reviewerName : undefined,
        rider: {
          id: String(r?.rider?.id ?? ''),
          firstName: String(r?.rider?.firstName ?? ''),
          lastName: String(r?.rider?.lastName ?? ''),
          riderFunction: String(r?.rider?.riderFunction ?? ''),
        },
      }))
      .filter((r: PublicReview) => r.id);
  },

  upsertReview: async (input: UpsertReviewInput): Promise<void> => {
    const riderId = String(input.riderId);
    const rating = Number(input.rating);
    const comment = typeof input.comment === 'string' ? input.comment : undefined;

    const token = localStorage.getItem('token') || '';
    // Les comptes clients du mode mock utilisent un token local (client_*), non compatible JWT backend.
    // Dans ce cas on ne fait pas d'appel réseau (le caller gère déjà le localStorage).
    if (!token || token.startsWith('client_')) {
      return;
    }

    const response = await fetch(`${API_URL}/reviews/${encodeURIComponent(riderId)}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ rating, comment }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data?.message || 'Erreur lors de la sauvegarde de la satisfaction');
    }
  },

  registerRider: async (formData: FormData): Promise<Rider> => {
    const response = await fetch(`${API_URL}/riders/register`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Erreur lors de l'inscription");
    }
    const result = await response.json();
    return normalizeRider(result.rider);
  },

  updateAvailability: async (id: string, availabilityStatus: AvailabilityStatus): Promise<void> => {
    await fetch(`${API_URL}/riders/availability`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status: availabilityStatus }),
    });
  },

  getRiders: async (): Promise<Rider[]> => {
    const response = await fetch(`${API_URL}/riders`, { headers: getHeaders() });
    const data = await response.json();
    return Array.isArray(data) ? data.map(normalizeRider) : [];
  },

  updateRiderStatus: async (id: string, status: RiderStatus, verificationNote?: string): Promise<void> => {
    await fetch(`${API_URL}/riders/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, verificationNote: verificationNote || '' }),
    });
  },

  deleteRider: async (id: string): Promise<void> => {
    await fetch(`${API_URL}/riders/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  },

  resetPassword: async (identifier: string): Promise<void> => {
    await new Promise(r => setTimeout(r, 1000));
  },

  verifyEmail: async (token: string): Promise<void> => {
    await new Promise(r => setTimeout(r, 1000));
  },

  processPayment: async (
    provider: PaymentProvider,
    phone: string,
    amount: number,
    meta?: { purpose?: string }
  ): Promise<boolean> => {
    // Dev mode: simulate payment processing with logging
    console.log(`[Payment] Initiation paiement via ${provider}:`, { provider, phone, amount });
    
    await new Promise(r => setTimeout(r, 2500));
    
    const ok = true;
    console.log(`[Payment] Paiement simulé réussi via ${provider}`);

    addPaymentHistoryItem({
      id: `pay_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      provider,
      phone,
      amount,
      status: ok ? 'success' : 'failed',
      createdAt: new Date().toISOString(),
      purpose: meta?.purpose,
    });

    return ok;
  },

  getPaymentHistory: async (): Promise<PaymentTransaction[]> => {
    return readPaymentHistory();
  },

  estimatePrice: async (input: { category: ServiceCategory; pickupRegion: SenegalRegion; dropoffRegion: SenegalRegion }): Promise<{ estimatedPrice: number }> => {
    const estimatedPrice = estimateOrderPrice(input.category, input.pickupRegion, input.dropoffRegion);
    return { estimatedPrice };
  },

  createOrder: async (input: Omit<Order, 'id' | 'status' | 'estimatedPrice' | 'createdAt'>): Promise<Order> => {
    const estimatedPrice = estimateOrderPrice(input.category, input.pickupRegion, input.dropoffRegion);
    const order: Order = {
      id: `ord_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      status: OrderStatus.CREATED,
      estimatedPrice,
      createdAt: new Date().toISOString(),
      ...input,
    };

    const current = readOrders();
    writeOrders([order, ...current].slice(0, 100));
    return order;
  },

  listOrders: async (userId?: string): Promise<Order[]> => {
    const all = readOrders();
    return userId ? all.filter(o => o.userId === userId) : all;
  },

  getOrder: async (id: string): Promise<Order | null> => {
    const items = readOrders();
    return items.find(o => o.id === id) || null;
  },

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order | null> => {
    const items = readOrders();
    const idx = items.findIndex(o => o.id === id);
    if (idx < 0) return null;
    const updated: Order = { ...items[idx], status };
    const next = [...items];
    next[idx] = updated;
    writeOrders(next);
    return updated;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword: string
  ): Promise<void> => {
    const response = await fetch(`${API_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors du changement de mot de passe');
    }
  },

  updateRiderProfile: async (
    firstName: string,
    lastName: string,
    profilePhoto?: File | null
  ): Promise<Rider> => {
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    if (profilePhoto) {
      formData.append('profilePhoto', profilePhoto);
    }

    const token = localStorage.getItem('token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/riders/me/profile`, {
      method: 'PUT',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors de la mise à jour du profil');
    }

    const data = await response.json();
    return normalizeRider(data);
  },

  renewSubscription: async (): Promise<{ subscriptionExpiresAt: string }> => {
    const response = await fetch(`${API_URL}/riders/me/subscription/renew`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Erreur lors du renouvellement de l’abonnement');
    }

    return response.json();
  },

  registerBusinessUser: async (input: Omit<BusinessUser, 'id' | 'role' | 'type' | 'emailVerified'> & { email: string; password: string }): Promise<BusinessUser> => {
    const businessUser: BusinessUser = {
      id: 'biz_' + Date.now(),
      role: 'user',
      type: UserType.BUSINESS,
      email: input.email,
      companyName: input.companyName,
      ninea: input.ninea,
      companyAddress: input.companyAddress,
      emailVerified: false,
    };

    const current = readBusinessUsers();
    writeBusinessUsers([businessUser, ...current].slice(0, 100));
    return businessUser;
  },

  getBusinessUser: async (email: string): Promise<BusinessUser | null> => {
    const items = readBusinessUsers();
    return items.find(u => u.email === email) || null;
  },

  getCurrentUser: async (): Promise<User | BusinessUser | ClientUser | null> => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      // Si c'est un utilisateur business, chercher les détails complémentaires
      if (user.type === UserType.BUSINESS) {
        const businessUsers = readBusinessUsers();
        return businessUsers.find(b => b.id === user.id) || user;
      }
      if (user.type === UserType.CLIENT) {
        const clientUsers = readClientUsers();
        const found = clientUsers.find(c => c.id === user.id);
        if (!found) return user;
        const { password: _pw, ...clean } = found;
        return clean as ClientUser;
      }
      return user;
    } catch {
      return null;
    }
  },
};
