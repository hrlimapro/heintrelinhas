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

  const signIn = async ({ email, password }: any) => {
    const response = await api.post('/api/auth/login', { email, password });
    const { token: jwtToken, user: userProfile } = response.data;

    localStorage.setItem('@heintrelinhas:token', jwtToken);
    localStorage.setItem('@heintrelinhas:user', JSON.stringify(userProfile));

    setToken(jwtToken);
    setUser(userProfile);
  };

  const signUp = async ({ name, email, password, role }: any) => {
    await api.post('/api/auth/register', { name, email, password, role });
  };

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
