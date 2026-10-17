// Centralized API configuration for Local Development & Hostinger Production
const envUrl = (import.meta.env.VITE_API_URL || '').trim();

const isBrowser = typeof window !== 'undefined';
const isLocalhost = isBrowser && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '::1'
);

export const BACKEND_URL = (
  (isBrowser && !isLocalhost)
    ? (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1') ? envUrl : window.location.origin)
    : (envUrl || 'http://localhost:5000')
).replace(/\/+$/, '');

export const API_BASE = `${BACKEND_URL}/api`;

export const getKnownDepartments = () => {
  try {
    const cached = JSON.parse(localStorage.getItem('vcas_departments_cache') || '[]');
    if (Array.isArray(cached) && cached.length > 0) {
      const names = cached.map(d => (typeof d === 'string' ? d : d.name)).filter(Boolean);
      if (names.length > 0) return Array.from(new Set(names));
    }
  } catch (_) {}
  return [
    'Artificial Intelligence',
    'Commerce',
    'Computer Science',
    'Criminology and Forensic Science',
    'Management'
  ];
};

export default API_BASE;

