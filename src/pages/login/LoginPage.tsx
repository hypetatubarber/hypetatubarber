import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, LogIn, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const { loginWithEmail, currentUser, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Se o usuário já estiver logado, redireciona diretamente para o painel correspondente
  useEffect(() => {
    if (!authLoading && currentUser && role) {
      if (role === 'master') {
        navigate('/admin', { replace: true });
      } else if (role === 'recepcionista') {
        navigate('/recepcao', { replace: true });
      } else if (role === 'colaborador') {
        const slug = currentUser.slug || 'danilinho-barber';
        navigate(`/equipe/${slug}`, { replace: true });
      }
    }
  }, [currentUser, role, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      // Autentica via Supabase e busca perfil na tabela 'usuarios'
      const user = await loginWithEmail(email, password);

      // Redirecionamento estrito baseado no role retornado
      if (user.role === 'master') {
        navigate('/admin', { replace: true });
      } else if (user.role === 'recepcionista') {
        navigate('/recepcao', { replace: true });
      } else if (user.role === 'colaborador') {
        const slug = user.slug || 'danilinho-barber';
        navigate(`/equipe/${slug}`, { replace: true });
      } else {
        navigate('/admin', { replace: true });
      }
    } catch (err: any) {
      console.error('[LoginPage Error]:', err);
      setErrorMessage(err.message || 'Erro ao realizar login. Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  const isConfigured = isSupabaseConfigured();

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#F2F5F7] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Luz ambiente (radial glow) oficial Hype Tatu */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 35%, rgba(44, 122, 140, 0.28) 0%, rgba(140, 189, 173, 0.10) 35%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Header com Logo Oficial */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <img
              src="/logo.png"
              alt="Hype Tatu"
              className="h-16 w-auto object-contain drop-shadow-lg"
            />
          </div>
          <p className="text-xs uppercase tracking-[0.15em] font-semibold text-[#8CBDAD]">
            Lauro de Freitas — BA
          </p>
          <p className="text-xs text-[#AAB6BE] mt-1 font-mono">
            Sistema de Gestão • Atendimento • WhatsApp
          </p>
        </div>

        {/* Card do Formulário de Login Único */}
        <div className="bg-[#12171C] rounded-2xl p-8 border border-[rgba(140,189,173,0.18)] shadow-2xl backdrop-blur-md">
          <h2 className="text-lg font-bold text-[#F2F5F7] text-center mb-1">
            Acesso ao Sistema
          </h2>
          <p className="text-xs text-[#AAB6BE] text-center mb-6">
            Informe seu e-mail e senha para acessar seu painel
          </p>

          {/* Aviso se Supabase não estiver configurado */}
          {!isConfigured && (
            <div className="mb-4 p-3 rounded-xl bg-amber-950/50 border border-amber-500/30 text-amber-200 text-xs">
              <div className="font-bold flex items-center gap-1.5 text-amber-400 mb-1">
                <AlertCircle className="w-4 h-4" />
                Aviso: Supabase não detectado no ambiente
              </div>
              <p className="text-[11px] leading-relaxed text-amber-200/90">
                As variáveis <code>VITE_SUPABASE_URL</code> ou <code>VITE_SUPABASE_ANON_KEY</code> não estão preenchidas. Adicione-as nas variáveis do Railway para ativar autenticação oficial em nuvem.
              </p>
            </div>
          )}

          {/* Alerta de Erro */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo E-mail */}
            <div>
              <label className="block text-xs font-semibold text-[#AAB6BE] uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#72808A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@hypetatu.com.br"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#151B20] border border-[rgba(140,189,173,0.18)] text-[#F2F5F7] placeholder-[#72808A] focus:outline-none focus:border-[#8CBDAD] focus:ring-1 focus:ring-[#8CBDAD] transition"
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="block text-xs font-semibold text-[#AAB6BE] uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#72808A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#151B20] border border-[rgba(140,189,173,0.18)] text-[#F2F5F7] placeholder-[#72808A] focus:outline-none focus:border-[#8CBDAD] focus:ring-1 focus:ring-[#8CBDAD] transition"
                />
              </div>
            </div>

            {/* Botão Entrar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-[#8CBDAD] hover:bg-[#517566] text-[#0B0E11] hover:text-white font-oswald font-bold text-xs uppercase tracking-wider transition duration-150 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar no Sistema</span>
                </>
              )}
            </button>
          </form>

          {/* Dicas sutis para a equipe */}
          <div className="mt-6 pt-5 border-t border-[rgba(140,189,173,0.12)] text-center">
            <p className="text-[11px] text-[#72808A]">
              Dúvidas ou problemas com acesso? Contate a administração do Hype Tatu.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
