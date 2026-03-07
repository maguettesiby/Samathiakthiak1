export enum RiderStatus {
  PENDING = 'pending',
  DOCUMENTS_REQUIRED = 'documents_required',
  ACTIVE = 'active',
  REJECTED = 'rejected',
  BANNED = 'banned'
}

export enum AvailabilityStatus {
  OFFLINE = 'offline',
  ONLINE = 'online',
  BUSY = 'busy'
}

export enum AccessTier {
  FLASH = 'flash',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export enum RiderFunction {
  MOTO = 'Livreur moto',
  AUTO = 'Livreur auto',
  TAXI_BAGAGE = 'Livreur Taxi Bagage',
  THREE_WHEELS = 'Livreur 3 roues'
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female'
}

export interface Rider {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  status: RiderStatus;
  availabilityStatus: AvailabilityStatus;
  availabilitySince?: string | null;
  riderFunction: RiderFunction;
  emailVerified: boolean;
  gender?: Gender;
  idCardUrl?: string;
  licenseUrl?: string;
  profilePhotoUrl?: string;
  verificationNote?: string;
  joinedAt: string;
  subscriptionExpiresAt?: string;
  subscriptionActive?: boolean;
}

export interface AccessSession {
  isActive: boolean;
  expiresAt: number | null;
  tier: AccessTier | null;
}

export enum PaymentProvider {
  PAYTECH = 'PayTech SN'
}

export enum SenegalRegion {
  DAKAR = 'Dakar',
  THIES = 'Thiès',
  DIOURBEL = 'Diourbel',
  FATICK = 'Fatick',
  KAFFRINE = 'Kaffrine',
  KAOLACK = 'Kaolack',
  KEDOUGOU = 'Kédougou',
  KOLDA = 'Kolda',
  LOUGA = 'Louga',
  MATAM = 'Matam',
  SAINT_LOUIS = 'Saint-Louis',
  SEDHIOU = 'Sédhiou',
  TAMBACOUNDA = 'Tambacounda',
  ZIGUINCHOR = 'Ziguinchor'
}

export enum ServiceCategory {
  PHARMACY = 'Pharmacie',
  DOCUMENTS = 'Documents',
  GROCERIES = 'Courses',
  PARCEL = 'Colis'
}

export enum OrderStatus {
  CREATED = 'Créée',
  ASSIGNED = 'Assignée',
  EN_ROUTE = 'En route',
  ARRIVED = 'Arrivé',
  DELIVERED = 'Livré',
  CANCELLED = 'Annulée'
}

export interface Order {
  id: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  category: ServiceCategory;
  pickupRegion: SenegalRegion;
  dropoffRegion: SenegalRegion;
  pickupAddress: string;
  dropoffAddress: string;
  notes?: string;
  scheduledAt?: string;
  status: OrderStatus;
  estimatedPrice: number;
  createdAt: string;
  assignedRiderId?: string;
}

export enum UserType {
  CLIENT = 'client',
  BUSINESS = 'business'
}
export interface User {
  id: string;
  role: 'admin' | 'rider' | 'user';
  type?: UserType;
  name?: string;
  email?: string;
  riderId?: string;
  emailVerified?: boolean;
}

export interface ClientUser extends User {
  type: UserType.CLIENT;
  name: string;
  email: string;
}

export interface BusinessUser extends User {
  type: UserType.BUSINESS;
  email: string;
  companyName: string;
  ninea?: string;
  companyAddress?: string;
}