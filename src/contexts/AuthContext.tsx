import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { AuthenticatedUser, UserRole } from '../types';
import { apiCall } from '../services/apiService';

interface AuthContextType {
  user: AuthenticatedUser | null;
  login: (emailOrRoll: string, password?: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface LoginResponse {
  user: Omit<AuthenticatedUser, 'role'>;
  role: string;
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(() => {
    const storedUser = sessionStorage.getItem('authUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('authUser', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('authUser');
    }
  }, [user]);

  const login = async (emailOrRoll: string, password?: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await apiCall<LoginResponse>('/auth/login', 'POST', {
        emailOrRoll,
        password
      });

      const roleMap: Record<string, UserRole> = {
        FACULTY: UserRole.Faculty,
        HOD: UserRole.Hod,
        MENTOR: UserRole.Mentor,
        STUDENT: UserRole.Student
      };

      const authenticatedUser: AuthenticatedUser = {
        ...response.user,
        role: roleMap[response.role] || UserRole.Student
      };

      setUser(authenticatedUser);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('authUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
