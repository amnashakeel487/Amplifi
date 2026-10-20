import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../lib/types';
import { mockDb, INITIAL_USERS } from '../lib/mock-db';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isStudent: boolean;
  isClient: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  adminLogin: (email: string, password?: string, pin?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRoleUser: (userId: string) => void;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateCurrentUserProfile: (updates: Partial<UserProfile>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check saved session
    const savedUserId = localStorage.getItem('amplifi_active_user_id');
    if (savedUserId) {
      const existing = mockDb.getUser(savedUserId);
      if (existing) {
        setUser(existing);
      } else {
        // Fallback to default admin
        setUser(INITIAL_USERS[0]);
      }
    } else {
      // Default to admin for seamless first load
      setUser(INITIAL_USERS[0]);
      localStorage.setItem('amplifi_active_user_id', INITIAL_USERS[0].id);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    await new Promise(res => setTimeout(res, 500)); // Smooth auth latency simulation

    const foundUser = mockDb.getUserByEmail(email);
    if (!foundUser) {
      setIsLoading(false);
      return { success: false, error: 'No account found with this email address.' };
    }

    if (foundUser.status === 'inactive' || foundUser.status === 'suspended') {
      setIsLoading(false);
      return { success: false, error: 'This user account has been deactivated. Please contact an administrator.' };
    }

    // Optional password verification
    if (password && password.length < 6) {
      setIsLoading(false);
      return { success: false, error: 'Invalid password. Please check your credentials.' };
    }

    setUser(foundUser);
    localStorage.setItem('amplifi_active_user_id', foundUser.id);
    setIsLoading(false);

    mockDb.logAudit({
      user_id: foundUser.id,
      user_email: foundUser.email,
      user_role: foundUser.role,
      action: 'USER_LOGIN',
      entity_type: 'auth',
      entity_id: foundUser.id,
      details: { method: 'standard_password' },
    });

    return { success: true };
  };

  const adminLogin = async (email: string, password?: string, pin?: string) => {
    setIsLoading(true);
    await new Promise(res => setTimeout(res, 600));

    const foundUser = mockDb.getUserByEmail(email);
    if (!foundUser || foundUser.role !== 'admin') {
      setIsLoading(false);
      return { success: false, error: 'Access denied. You do not hold Administrator security clearance.' };
    }

    if (pin && pin !== '2026' && pin.length > 0) {
      setIsLoading(false);
      return { success: false, error: 'Invalid security PIN for root console.' };
    }

    setUser(foundUser);
    localStorage.setItem('amplifi_active_user_id', foundUser.id);
    setIsLoading(false);

    mockDb.logAudit({
      user_id: foundUser.id,
      user_email: foundUser.email,
      user_role: foundUser.role,
      action: 'ADMIN_CONSOLE_LOGIN',
      entity_type: 'auth',
      entity_id: foundUser.id,
      details: { security_level: 'elevated' },
    });

    return { success: true };
  };

  const logout = () => {
    if (user) {
      mockDb.logAudit({
        user_id: user.id,
        user_email: user.email,
        user_role: user.role,
        action: 'USER_LOGOUT',
        entity_type: 'auth',
        entity_id: user.id,
      });
    }
    setUser(null);
    localStorage.removeItem('amplifi_active_user_id');
  };

  const switchRoleUser = (userId: string) => {
    const target = mockDb.getUser(userId);
    if (target) {
      setUser(target);
      localStorage.setItem('amplifi_active_user_id', target.id);
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return { success: false, error: 'No active session' };
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    const updated = mockDb.updateUser(user.id, { must_change_password: false });
    setUser(updated);

    mockDb.logAudit({
      user_id: user.id,
      user_email: user.email,
      user_role: user.role,
      action: 'PASSWORD_UPDATED',
      entity_type: 'user',
      entity_id: user.id,
    });

    return { success: true };
  };

  const updateCurrentUserProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = mockDb.updateUser(user.id, updates);
    setUser(updated);
  };

  const role = user?.role ?? null;
  const isAdmin = role === 'admin';
  const isManager = role === 'manager';
  const isStudent = role === 'student';
  const isClient = role === 'client';

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isLoading,
        isAdmin,
        isManager,
        isStudent,
        isClient,
        login,
        adminLogin,
        logout,
        switchRoleUser,
        updatePassword,
        updateCurrentUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
