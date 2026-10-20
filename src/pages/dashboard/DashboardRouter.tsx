import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { AdminDashboard } from './AdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { StudentDashboard } from './StudentDashboard';

export const DashboardRouter: React.FC = () => {
  const { role } = useAuth();

  switch (role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'student':
      return <StudentDashboard />;
    case 'client':
      return <ManagerDashboard />;
    default:
      return <AdminDashboard />;
  }
};
