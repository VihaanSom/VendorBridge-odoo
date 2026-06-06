// ── VendorBridge — Unified API Client ───────────────────────────────
// Shared fetch helpers with JWT auth for ALL frontend pages.
// Dev A: Auth, Directory, RFQs
// Dev B: Quotations, Approvals, Financials, Analytics

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

// ── Token helpers (used by Dev B pages) ─────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// ── Dev B typed wrappers (used by Quotations, Approvals, etc.) ──────

export async function apiGet<T>(path: string): Promise<T> {
  return apiFetch<T>(path);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  return apiFetch<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * Fetch a binary blob (e.g. PDF download).
 * Returns the raw Response so callers can read .blob(), set headers, etc.
 */
export async function apiGetBlob(path: string): Promise<Response> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token ?? ''}` },
  });
  if (!res.ok) {
    throw new Error(`GET ${path} failed with status ${res.status}`);
  }
  return res;
}

// ══════════════════════════════════════════════════════════════════════
// Dev A — Auth
// ══════════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════════
// Dev A — Directory
// ══════════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════════
// Dev A — RFQs
// ══════════════════════════════════════════════════════════════════════

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
