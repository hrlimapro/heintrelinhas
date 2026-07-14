// Contexto global de autenticação: mantém usuário/token em memória e sincronizado
// com o localStorage (chaves "@heintrelinhas:token" e "@heintrelinhas:user"),
// permitindo que a sessão sobreviva a recarregamentos da página.
// O token em si é injetado nas requisições pelo interceptor em services/api.ts.
import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'WRITER' | 'EDITOR' | 'ADMIN';
}

interface AuthContextData {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (data: { name: string; email: string; password: string; role: 'WRITER' | 'EDITOR' | 'ADMIN' }) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Na montagem, restaura a sessão persistida no localStorage (se existir).
  // O flag "loading" evita que rotas privadas redirecionem antes dessa leitura.
  useEffect(() => {
    function loadStorageData() {
      const storagedToken = localStorage.getItem('@heintrelinhas:token');
      const storagedUser = localStorage.getItem('@heintrelinhas:user');

      if (storagedToken && storagedUser) {
        setToken(storagedToken);
        setUser(JSON.parse(storagedUser));
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  // Login: chama a API, persiste token + perfil e atualiza o estado em memória.
  const signIn = async ({ email, password }: any) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { token: jwtToken, user: userProfile } = response.data;

    localStorage.setItem('@heintrelinhas:token', jwtToken);
    localStorage.setItem('@heintrelinhas:user', JSON.stringify(userProfile));

    setToken(jwtToken);
    setUser(userProfile);
  };

  // Cadastro: apenas cria a conta; NÃO autentica automaticamente
  // (a página Register redireciona para /login após o sucesso).
  const signUp = async ({ name, email, password, role }: any) => {
    await api.post('/api/auth/register', { name, email, password, role });
  };

  // Logout: limpa o armazenamento persistente e o estado em memória.
  const signOut = () => {
    localStorage.removeItem('@heintrelinhas:token');
    localStorage.removeItem('@heintrelinhas:user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
