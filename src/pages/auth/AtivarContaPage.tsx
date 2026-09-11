import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Mail, CheckCircle2, AlertCircle, Eye, EyeOff, Sparkles, Scissors, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Usuario } from '../../types';

export const AtivarContaPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { loginWithEmail, setUserSession } = useAuth();

  const userId = searchParams.get('id') || searchParams.get('token') || searchParams.get('colab');

  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [colaborador, setColaborador] = useState<Usuario | null>(null);

  const [email, setEmail] = useState<string>('');
  const [senha, setSenha] = useState<string>('');
  const [confirmarSenha, setConfirmarSenha] = useState<string>('');
  const [mostrarSenha, setMostrarSenha] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const fetchColaborador = async () => {
      if (!userId) {
        setLoadingUser(false);
        return;
      }

      try {
        setLoadingUser(true);
        const user = await api.getUsuarioById(userId);
        if (user && user.role === 'colaborador') {
          setColaborador(user);
          if (user.email && !user.email.includes('placeholder') && !user.email.includes('@temp')) {
            setEmail(user.email);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar dados para ativação:', err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchColaborador();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!colaborador) {
      setErro('Colaborador não identificado.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErro('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (senha.length < 6) {
      setErro('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('As senhas não coincidem. Digite novamente.');
      return;
    }

    try {
      setSubmitting(true);
      const cleanEmail = email.trim().toLowerCase();

      // Ativa a conta e salva a senha/e-mail no perfil
      const updatedUser = await api.ativarContaColaborador(colaborador.id, cleanEmail, senha);

      // Define imediatamente a sessão do usuário de forma persistente
      setUserSession(updatedUser);

      showToast('Conta ativada com sucesso! Conectando ao seu painel...', 'success');

      // Tenta logar no Supabase em segundo plano
      try {
        await loginWithEmail(cleanEmail, senha);
      } catch (loginErr) {
        console.warn('Login em segundo plano no Supabase:', loginErr);
      }

      navigate('/equipe', { replace: true });
    } catch (err: any) {
      console.error('Erro na ativação da conta:', err);
      setErro(err.message || 'Erro ao ativar sua conta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-[#0B0E11] text-[#F2F5F7] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin mb-3" />
        <p className="text-xs text-[var(--text-secondary)] font-inter">
          Localizando seu convite de profissional...
        </p>
      </div>
    );
  }

  if (!colaborador) {
    return (
      <div className="min-h-screen bg-[#0B0E11] text-[#F2F5F7] flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="w-full max-w-md bg-[#12171C] rounded-2xl p-8 border border-[rgba(235,87,87,0.30)] text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-[rgba(235,87,87,0.15)] flex items-center justify-center mx-auto mb-4 text-[#EB5757]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-display uppercase tracking-wide text-xl text-white mb-2">
            Link Inválido ou Expirado
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-inter leading-relaxed mb-6">
            Não encontramos um perfil de colaborador associado a este link de convite.
            Por favor, solicite um novo link de ativação ao administrador do estúdio.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-2.5 bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] rounded-xl text-xs font-oswald uppercase tracking-wider font-semibold transition-all"
          >
            Ir para a Tela de Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0E11] text-[#F2F5F7] flex flex-col justify-center items-center px-4 py-10 relative overflow-hidden font-sans">
      {/* Luz ambiente temática */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 30%, rgba(44, 122, 140, 0.28) 0%, rgba(140, 189, 173, 0.10) 35%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Header com Logo */}
        <div className="text-center mb-6">
          <img
            src="/logo.png"
            alt="Hype Tatu Barber"
            className="h-16 w-auto object-contain mx-auto mb-2 drop-shadow-lg"
          />
          <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[var(--accent)] font-oswald block">
            Primeiro Acesso do Profissional
          </span>
        </div>

        {/* Card do Formulário */}
        <div className="bg-[#12171C] rounded-2xl p-6 sm:p-8 border border-[rgba(140,189,173,0.22)] shadow-2xl backdrop-blur-md">
          {/* Card de Identificação do Profissional */}
          <div className="mb-6 p-3.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center gap-3">
            <img
              src={colaborador.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
              alt={colaborador.nome}
              className="w-12 h-12 rounded-xl object-cover border border-[var(--border)]"
            />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-oswald text-[var(--accent)] tracking-wider font-semibold">
                Perfil de Acesso
              </div>
              <h3 className="font-display uppercase tracking-wide text-base font-bold text-white truncate">
                {colaborador.nome}
              </h3>
              <div className="text-[11px] text-[var(--text-secondary)] truncate">
                {colaborador.especialidade || 'Colaborador da Equipe'}
              </div>
            </div>
          </div>

          <div className="mb-5">
            <h2 className="text-base font-bold text-white mb-1">
              Defina seu Acesso Pessoal
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-inter leading-relaxed">
              Informe o e-mail que você deseja utilizar para login e crie sua senha de segurança.
            </p>
          </div>

          {erro && (
            <div className="mb-4 p-3 bg-[rgba(235,87,87,0.15)] border border-[rgba(235,87,87,0.35)] rounded-xl flex items-center gap-2.5 text-[#EB5757] text-xs font-inter animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo E-mail */}
            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent)] font-semibold block mb-1.5">
                E-mail para Login *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-surface-alt)] text-white placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>
              <span className="text-[10px] text-[var(--text-muted)] mt-1 block font-inter">
                Você usará este e-mail para entrar sempre que acessar o sistema.
              </span>
            </div>

            {/* Campo Senha */}
            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent)] font-semibold block mb-1.5">
                Criar Senha de Acesso *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  placeholder="Mínimo de 6 dígitos"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-surface-alt)] text-white placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-white"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Senha */}
            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent)] font-semibold block mb-1.5">
                Confirmar Senha *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  required
                  placeholder="Repita a senha criada"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-surface-alt)] text-white placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 mt-2 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] rounded-xl text-xs font-oswald uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 shadow-accent disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ativando Conta...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Ativar Minha Conta e Entrar
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[var(--border)]/60 text-center">
            <p className="text-[11px] text-[var(--text-muted)] font-inter">
              Já possui senha criada?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[var(--accent)] hover:underline font-semibold"
              >
                Fazer login diretamente
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AtivarContaPage;
