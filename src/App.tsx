import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './components/layout/AppLayout';
import { RoleGuard } from './components/auth/RoleGuard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ReceptionDashboard } from './pages/recepcao/ReceptionDashboard';
import { CollaboratorDashboard } from './pages/equipe/CollaboratorDashboard';
import { LoginPage } from './pages/login/LoginPage';
import { ConversasPage } from './pages/conversas/ConversasPage';
import { WhatsAppConfigPage } from './pages/admin/WhatsAppConfigPage';
import { NotFound } from './pages/NotFound';
import { evolutionApi } from './services/evolutionApi';

// Roteador Inteligente da Raiz
const RootRedirect: React.FC = () => {
  const { currentUser, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0E11] text-[#8CBDAD] font-bold text-sm">
        Carregando Hype Tatu...
      </div>
    );
  }

  // Não autenticado -> tela de login
  if (!currentUser || !role) {
    return <Navigate to="/login" replace />;
  }

  // Redirecionamento estrito por role
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
};

export const App: React.FC = () => {
  // Inicialização do Webhook da Evolution API
  React.useEffect(() => {
    evolutionApi.autoRegisterWebhook().catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <NotificationProvider>
              <Routes>
                {/* 1. Raiz Inteligente */}
                <Route path="/" element={<RootRedirect />} />

                {/* 2. Tela de Login Única */}
                <Route path="/login" element={<LoginPage />} />

                {/* 3. Área Autenticada com Layout */}
                <Route element={<AppLayout />}>
                  {/* ROTAS MASTER (/admin) — Acesso exclusivo de role 'master' */}
                  <Route
                    path="/admin"
                    element={
                      <RoleGuard allowedRoles={['master']}>
                        <AdminDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/admin/conversas"
                    element={
                      <RoleGuard allowedRoles={['master']}>
                        <ConversasPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/admin/configuracoes/whatsapp"
                    element={
                      <RoleGuard allowedRoles={['master']}>
                        <WhatsAppConfigPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/admin/whatsapp"
                    element={
                      <RoleGuard allowedRoles={['master']}>
                        <WhatsAppConfigPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/admin/agenda"
                    element={
                      <RoleGuard allowedRoles={['master']}>
                        <AdminDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/admin/servicos"
                    element={
                      <RoleGuard allowedRoles={['master']}>
                        <AdminDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/admin/equipe"
                    element={
                      <RoleGuard allowedRoles={['master']}>
                        <AdminDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/admin/estoque"
                    element={
                      <RoleGuard allowedRoles={['master']}>
                        <AdminDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/admin/clientes"
                    element={
                      <RoleGuard allowedRoles={['master']}>
                        <AdminDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/admin/relatorios"
                    element={
                      <RoleGuard allowedRoles={['master']}>
                        <AdminDashboard />
                      </RoleGuard>
                    }
                  />

                  {/* ROTAS RECEPÇÃO (/recepcao) — Acesso exclusivo de role 'recepcionista' */}
                  <Route
                    path="/recepcao"
                    element={
                      <RoleGuard allowedRoles={['recepcionista']}>
                        <ReceptionDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/recepcao/conversas"
                    element={
                      <RoleGuard allowedRoles={['recepcionista']}>
                        <ConversasPage />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/recepcao/clientes"
                    element={
                      <RoleGuard allowedRoles={['recepcionista']}>
                        <ReceptionDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/recepcao/estoque"
                    element={
                      <RoleGuard allowedRoles={['recepcionista']}>
                        <ReceptionDashboard />
                      </RoleGuard>
                    }
                  />

                  {/* ROTAS COLABORADOR (/equipe/:slug) — Acesso exclusivo de role 'colaborador' */}
                  <Route
                    path="/equipe/:slug"
                    element={
                      <RoleGuard allowedRoles={['colaborador']}>
                        <CollaboratorDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/equipe/:slug/agenda"
                    element={
                      <RoleGuard allowedRoles={['colaborador']}>
                        <CollaboratorDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/equipe/:slug/materiais"
                    element={
                      <RoleGuard allowedRoles={['colaborador']}>
                        <CollaboratorDashboard />
                      </RoleGuard>
                    }
                  />
                  <Route
                    path="/equipe/:slug/notificacoes"
                    element={
                      <RoleGuard allowedRoles={['colaborador']}>
                        <CollaboratorDashboard />
                      </RoleGuard>
                    }
                  />

                  {/* 404 Interno */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </NotificationProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
