import api from './api';

export type LiveClassAccess = 'free' | 'paid';
export type LiveClassAccessStatus = 'host' | 'pending' | 'active' | 'revoked' | 'refunded' | 'cancelled' | null;

export interface LiveClass {
  id: number;
  slug: string;
  title: string;
  description: string;
  educator: { id: number; name: string; avatar: string | null };
  category: string;
  level: string;
  scheduled_date: string;
  scheduled_time: string;
  starts_at: string;
  duration_minutes: number;
  capacity: number;
  registered_count: number;
  available_spaces: number;
  cover_image_url: string | null;
  access_type: LiveClassAccess;
  price: string;
  currency: string;
  status: 'draft' | 'published' | 'live' | 'completed' | 'cancelled';
  recording_enabled: boolean;
  is_joinable: boolean;
  viewer_access_status: LiveClassAccessStatus;
  learning_objectives?: string;
  requirements?: string;
  course?: number | null;
  course_title?: string | null;
  recordings_available?: boolean;
}

export interface LiveClassRegistration {
  id: number;
  live_class: number;
  live_class_title: string;
  live_class_slug: string;
  starts_at: string;
  educator_name: string;
  registration_status: string;
  access_status: string;
  amount_paid: string;
  registered_at: string;
}

export interface ClassroomAccess {
  auth_token: string;
  meeting_id: string;
  room_name: string;
  participant_id: string;
  attendance_id: number;
  role: 'host' | 'learner';
}

export const liveClassesApi = {
  list: (params?: Record<string, string>) => api.get<LiveClass[]>('/live-classes/', { params }),
  detail: (slug: string) => api.get<LiveClass>(`/live-classes/${slug}/`),
  mine: () => api.get<LiveClassRegistration[]>('/live-classes/mine/'),
  educator: () => api.get<LiveClass[]>('/live-classes/educator/'),
  create: (data: FormData) => api.post('/live-classes/educator/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  register: (slug: string) => api.post(`/live-classes/${slug}/register/`),
  verifyPayment: (slug: string, reference: string) => api.post(`/live-classes/${slug}/verify-payment/`, { reference }),
  join: (slug: string) => api.post<ClassroomAccess>(`/live-classes/${slug}/join/`),
  leave: (slug: string, attendanceId: number) => api.post(`/live-classes/${slug}/leave/`, { attendance_id: attendanceId }),
};

export function formatClassDate(value: string) {
  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function money(amount: string, currency: string) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(Number(amount));
}
