// Cliente HTTP central da aplicação (axios). Todas as chamadas ao backend
// passam por esta instância, garantindo baseURL e autenticação consistentes.
import axios from 'axios';

// A URL da API vem da env var de build VITE_API_URL; em dev usa o backend local.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token in request headers
// Lê o token do localStorage a cada requisição (e não uma única vez na carga),
// então login/logout têm efeito imediato sem recriar a instância do axios.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('@heintrelinhas:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
