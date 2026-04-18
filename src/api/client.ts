import axios, { AxiosError } from 'axios';
import { Platform } from 'react-native';
import type { User, Lesson, AnswerResult, ProgressResult, UserProgress, Curriculum } from '../types';

// Base URL resolution order:
//   1. EXPO_PUBLIC_API_URL  — set in .env.production (Vercel) or .env.local
//                             Overrides everything; use for prod + when testing
//                             against a tunnel.
//   2. Dev LAN IP fallback  — for Expo Go on a physical phone.
//   3. Platform-specific localhost fallbacks.
const DEV_LAN_IP = '192.168.1.13'; // update if you change networks

const envUrl = process.env.EXPO_PUBLIC_API_URL;
const baseURL =
  envUrl ||
  (__DEV__
    ? Platform.OS === 'android'
      ? `http://${DEV_LAN_IP}:3001/api`
      : Platform.OS === 'web'
        ? 'http://localhost:3001/api'
        : `http://${DEV_LAN_IP}:3001/api`
    : 'https://aira-backend.onrender.com/api');

const api = axios.create({
  baseURL,
  timeout: 8000,
  headers: { 'Content-Type': 'application/json' },
});

// --- Error types ---

export class NetworkError extends Error {
  constructor(message: string = 'Cannot reach the server. Check your connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

// --- Request interceptor: attach JWT if present ---
// We import the store lazily inside the interceptor to avoid circular deps
// (store imports api, api would import store). The lazy import reads the
// current Zustand state at request time.
api.interceptors.request.use((config) => {
  try {
    // Lazy require to avoid circular dependency at module load time
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { useUserStore } = require('../store/userStore');
    const token: string | null = useUserStore.getState().authToken;
    if (token) {
      config.headers = config.headers ?? {};
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {
    // Store not ready yet — skip header
  }
  return config;
});

// --- Response interceptor ---

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      // Network error (timeout, no connection, DNS fail)
      return Promise.reject(new NetworkError());
    }
    return Promise.reject(error);
  }
);

// --- Health ---

export async function checkHealth(): Promise<boolean> {
  try {
    const { data } = await api.get('/health');
    return data.status === 'ok';
  } catch {
    return false;
  }
}

// --- Auth ---

export interface AuthResponse {
  token: string;
  user: User & { id: string };
}

export async function authSignup(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post('/auth/signup', { name, email, password });
  return data;
}

export async function authLogin(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function authMe(): Promise<{ user: User & { id: string } }> {
  const { data } = await api.get('/auth/me');
  return data;
}

// --- Users ---

export async function createUser(name: string, email?: string): Promise<User> {
  const { data } = await api.post('/users/create', { name, email });
  return data;
}

export async function getUser(userId: string): Promise<User> {
  const { data } = await api.get(`/users/${userId}`);
  return data;
}

// --- Lessons ---

export async function generateLesson(userId: string, topic?: string): Promise<Lesson> {
  const { data } = await api.post('/lessons/generate', { userId, topic });
  return data;
}

export async function getLessonById(lessonId: string, userId?: string): Promise<Lesson> {
  const { data } = await api.get(`/lessons/${lessonId}`, {
    params: userId ? { userId } : undefined,
  });
  return data;
}

export async function getCurriculum(userId: string): Promise<Curriculum> {
  const { data } = await api.get(`/lessons/curriculum/${userId}`);
  return data;
}

export async function getTrackLessons(trackId: string): Promise<{ lessons: Lesson[] }> {
  const { data } = await api.get(`/tracks/${trackId}/lessons`);
  return data;
}

export async function checkAnswer(
  userId: string,
  lessonId: string,
  questionId: string,
  userAnswer: number | boolean | string
): Promise<AnswerResult> {
  const { data } = await api.post('/lessons/check-answer', {
    userId,
    lessonId,
    questionId,
    userAnswer,
  });
  return data;
}

// --- Progress ---

export async function saveProgress(
  userId: string,
  lessonId: string,
  correctCount: number,
  totalCount: number
): Promise<ProgressResult> {
  const { data } = await api.post('/progress/save', {
    userId,
    lessonId,
    correctCount,
    totalCount,
  });
  return data;
}

export async function getProgress(userId: string): Promise<UserProgress> {
  const { data } = await api.get(`/progress/${userId}`);
  return data;
}

// --- Payments (Lemon Squeezy) ---

export interface CheckoutResponse {
  url: string;
}

export async function createCheckout(userId: string): Promise<CheckoutResponse> {
  const { data } = await api.post('/payments/checkout', { userId });
  return data;
}

export default api;
