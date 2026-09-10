import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './components/layout/AppLayout';
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
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] text-[var(--accent-dark)] dark:text-[var(--accent)] font-bold text-sm">
        Carregando Hype Tatu...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/admin" replace />;
  }

  if (role === 'master') {
    return <Navigate to="/admin" replace />;
  }

  if (role === 'recepcionista') {
    return <Navigate to="/recepcao" replace />;
  }

  if (role === 'colaborador') {
    return <Navigate to={`/equipe/${currentUser.slug || 'danilinho-barber'}`} replace />;
  }

  return <Navigate to="/admin" replace />;
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
              {/* Raiz Inteligente */}
              <Route path="/" element={<RootRedirect />} />

              {/* Login */}
              <Route path="/login" element={<LoginPage />} />

              {/* Layout Autenticado com Sidebar & Header */}
              <Route element={<AppLayout />}>
                {/* 1. Rotas Master (/admin) */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/conversas" element={<ConversasPage />} />
                <Route path="/admin/configuracoes/whatsapp" element={<WhatsAppConfigPage />} />
                <Route path="/admin/whatsapp" element={<WhatsAppConfigPage />} />
                <Route path="/admin/agenda" element={<AdminDashboard />} />
                <Route path="/admin/servicos" element={<AdminDashboard />} />
                <Route path="/admin/equipe" element={<AdminDashboard />} />
                <Route path="/admin/estoque" element={<AdminDashboard />} />
                <Route path="/admin/clientes" element={<AdminDashboard />} />
                <Route path="/admin/relatorios" element={<AdminDashboard />} />

                {/* 2. Rotas Recepção (/recepcao) */}
                <Route path="/recepcao" element={<ReceptionDashboard />} />
                <Route path="/recepcao/conversas" element={<ConversasPage />} />
                <Route path="/recepcao/clientes" element={<ReceptionDashboard />} />
                <Route path="/recepcao/estoque" element={<ReceptionDashboard />} />

                {/* 3. Rotas Colaborador (/equipe/:slug) */}
                <Route path="/equipe/:slug" element={<CollaboratorDashboard />} />
                <Route path="/equipe/:slug/agenda" element={<CollaboratorDashboard />} />
                <Route path="/equipe/:slug/materiais" element={<CollaboratorDashboard />} />
                <Route path="/equipe/:slug/notificacoes" element={<CollaboratorDashboard />} />

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
