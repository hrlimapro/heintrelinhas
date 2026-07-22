// Cliente HTTP central da aplicação (axios). Todas as chamadas ao backend
// passam por esta instância, garantindo baseURL e autenticação consistentes.
import axios from 'axios';

// A URL da API vem da env var de build VITE_API_URL; em dev usa o backend local.
// withCredentials: envia o cookie httpOnly de refresh token nas rotas de auth.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor to inject JWT token in request headers
// Lê o token do localStorage a cada requisição (e não uma única vez na carga),
// então login/logout têm efeito imediato sem recriar a instância do axios.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@enterlinhas:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de resposta: access token expirado (401) ⇒ tenta renovar via
// POST /api/auth/refresh (autenticado pelo cookie httpOnly) e refaz a
// requisição original uma única vez. Se o refresh falhar, encerra a sessão.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const hadToken = !!localStorage.getItem('@enterlinhas:token');
    const isAuthRoute = original?.url?.startsWith('/api/auth');

    if (error.response?.status === 401 && hadToken && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      try {
        const { data } = await api.post('/api/auth/refresh');
        localStorage.setItem('@enterlinhas:token', data.token);
        return api(original);
      } catch {
        localStorage.removeItem('@enterlinhas:token');
        localStorage.removeItem('@enterlinhas:user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
