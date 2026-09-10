import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { currentUser, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0E11] text-[#8CBDAD] font-bold text-sm">
        Carregando Hype Tatu...
      </div>
    );
  }

  // 1. Usuário não autenticado -> redireciona para login
  if (!currentUser || !role) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Usuário autenticado tentando acessar rota não autorizada para seu perfil
  if (!allowedRoles.includes(role)) {
    // Redireciona de volta para o próprio painel correspondente
    if (role === 'master') {
      return <Navigate to="/admin" replace />;
    }
    if (role === 'recepcionista') {
      return <Navigate to="/recepcao" replace />;
    }
    if (role === 'colaborador') {
      const slug = currentUser.slug || 'danilinho-barber';
      return <Navigate to={`/equipe/${slug}`} replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Acesso autorizado
  return <>{children}</>;
};
export default RoleGuard;
