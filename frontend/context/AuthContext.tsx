import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Rider } from '../types';

interface AuthContextType {
  user: User | null;
  login: (userData: User, token: string, remember?: boolean) => void;
  updateUser: (patch: Partial<User>) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si un token existe au chargement de la page
  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string, remember = true) => {
    const storage = remember ? localStorage : sessionStorage;
    try {
      const other = remember ? sessionStorage : localStorage;
      other.removeItem('token');
      other.removeItem('user');
    } catch {
      // ignore
    }

    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (patch: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem('user', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const logout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {
      // ignore
    }
    try {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    } catch {
      // ignore
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, updateUser, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};