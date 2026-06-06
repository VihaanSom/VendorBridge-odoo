// ── Centralized API helpers ─────────────────────────────────────────
// All Dev-A routes: Auth, Directory, RFQs.
// Uses Vite proxy → relative "/api" paths (no CORS issues).

const API_BASE = '/api';

// ── Types ───────────────────────────────────────────────────────────

export interface ApiUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'OFFICER' | 'VENDOR' | 'APPROVER';
  firstName?: string | null;
  lastName?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  vendorProfile?: VendorProfile | null;
}

export interface VendorProfile {
  id: string;
  userId: string;
  companyName: string;
  gstNumber: string;
  contactPhone?: string | null;
  category: string;
  vendorStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  rating?: string | null;
  user?: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
    isActive?: boolean;
  };
}

export interface AuthResponse {
  token: string;
  user: ApiUser;
}

export interface RfqItem {
  id: string;
  rfqId: string;
  itemName: string;
  description?: string | null;
  quantity: number;
  unitOfMeasure: string;
}

export interface RfqVendorInvite {
  rfqId: string;
  vendorId: string;
  invitedAt?: string;
  vendor: {
    id: string;
    companyName: string;
    category: string;
  };
}

export interface Rfq {
  id: string;
  createdBy: string;
  title: string;
  deadline: string;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED' | 'AWARDED';
  attachmentUrl?: string | null;
  createdAt?: string;
  items: RfqItem[];
  vendorInvites: RfqVendorInvite[];
  creator: {
    id: string;
    email: string;
    firstName?: string | null;
    lastName?: string | null;
  };
}

// ── Core Fetch Wrapper ──────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      data.error || data.message || 'Something went wrong',
      res.status
    );
  }

  return data as T;
}

// ── Auth ─────────────────────────────────────────────────────────────

export function authLogin(email: string, password: string) {
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export interface SignupData {
  email: string;
  password: string;
  role: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  gstNumber?: string;
  category?: string;
  contactPhone?: string;
}

export function authSignup(data: SignupData) {
  return apiFetch<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function authForgotPassword(email: string) {
  return apiFetch<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function authResetPassword(token: string, newPassword: string) {
  return apiFetch<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

export function authMe() {
  return apiFetch<ApiUser>('/auth/me');
}

// ── Directory ───────────────────────────────────────────────────────

export function getVendors(category?: string) {
  const params = category ? `?category=${encodeURIComponent(category)}` : '';
  return apiFetch<VendorProfile[]>(`/directory/vendors${params}`);
}

export function updateVendor(
  id: string,
  data: {
    contactPhone?: string;
    category?: string;
    vendorStatus?: string;
  }
) {
  return apiFetch<VendorProfile>(`/directory/vendors/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function getUsers(role?: string) {
  const params = role ? `?role=${encodeURIComponent(role)}` : '';
  return apiFetch<ApiUser[]>(`/directory/users${params}`);
}

// ── RFQs ────────────────────────────────────────────────────────────

export function getRfqs() {
  return apiFetch<Rfq[]>('/rfqs');
}

export function getRfq(id: string) {
  return apiFetch<Rfq>(`/rfqs/${id}`);
}

export interface CreateRfqData {
  title: string;
  deadline: string;
  attachmentUrl?: string;
  items: {
    itemName: string;
    description?: string;
    quantity: number;
    unitOfMeasure: string;
  }[];
  vendorIds: string[];
}

export function createRfq(data: CreateRfqData) {
  return apiFetch<Rfq>('/rfqs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateRfqStatus(id: string, status: string) {
  return apiFetch<Rfq>(`/rfqs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}
