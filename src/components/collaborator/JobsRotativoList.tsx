import React, { useState, useEffect } from 'react';
import { Sparkles, Check, X, Clock, DollarSign, User, Flame, AlertCircle, CheckCircle2, Bell, BellOff, Power } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Usuario, SolicitacaoRotativo } from '../../types';

interface Props {
  colaborador: Usuario;
  onJobAccepted?: () => void;
}

export const JobsRotativoList: React.FC<Props> = ({ colaborador, onJobAccepted }) => {
  const { showToast } = useToast();

  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoRotativo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Status local do colaborador
  const [disponivel, setDisponivel] = useState<boolean>(
    colaborador.status_disponibilidade !== 'indisponivel'
  );
  const [notificacoesAtivas, setNotificacoesAtivas] = useState<boolean>(
    colaborador.notificacoes_ativas !== false
  );

  const loadJobs = async () => {
    try {
      setLoading(true);
      const list = await api.getSolicitacoesRotativo();
      setSolicitacoes(list);
    } catch (err) {
      console.error('Erro ao carregar solicitações de rotativo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();

    const handleSync = () => {
      loadJobs();
    };

    window.addEventListener('hype_solicitacoes_rotativo_changed', handleSync);
    return () => {
      window.removeEventListener('hype_solicitacoes_rotativo_changed', handleSync);
    };
  }, []);

  const handleToggleDisponibilidade = async () => {
    try {
      const novoStatus = disponivel ? 'indisponivel' : 'disponivel';
      setDisponivel(!disponivel);
      await api.saveUsuario({
        ...colaborador,
        status_disponibilidade: novoStatus,
      });
      showToast(
        novoStatus === 'disponivel'
          ? 'Você agora está DISPONÍVEL para receber jobs!'
          : 'Você agora está INDISPONÍVEL. Não receberá alertas de jobs.',
        novoStatus === 'disponivel' ? 'success' : 'info'
      );
    } catch (err) {
      setDisponivel(disponivel);
      showToast('Erro ao atualizar disponibilidade.', 'error');
    }
  };

  const handleToggleNotificacoes = async () => {
    try {
      const novoValor = !notificacoesAtivas;
      setNotificacoesAtivas(novoValor);
      await api.saveUsuario({
        ...colaborador,
        notificacoes_ativas: novoValor,
      });
      showToast(
        novoValor ? 'Notificações de jobs ativadas.' : 'Notificações de jobs silenciadas.',
        'info'
      );
    } catch (err) {
      setNotificacoesAtivas(notificacoesAtivas);
      showToast('Erro ao atualizar notificações.', 'error');
    }
  };

  const handleAceitarJob = async (job: SolicitacaoRotativo) => {
    try {
      setActionLoadingId(job.id);
      await api.aceitarJobRotativo(job.id, colaborador.id);

      showToast(
        `Job aceito com sucesso! Agendamento marcado para ${job.data} às ${job.hora_inicio}.`,
        'success'
      );

      loadJobs();
      if (onJobAccepted) onJobAccepted();
    } catch (err: any) {
      console.error('Erro ao aceitar job:', err);
      showToast(err.message || 'Erro ao aceitar job.', 'error');
      loadJobs();
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRecusarJob = async (job: SolicitacaoRotativo) => {
    try {
      setActionLoadingId(job.id);
      await api.recusarJobRotativo(job.id, colaborador.id);
      showToast('Você recusou este job.', 'info');
      loadJobs();
    } catch (err: any) {
      showToast(err.message || 'Erro ao recusar job.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Jobs abertos (excluindo os já recusados por este rotativo)
  const jobsAbertos = solicitacoes.filter(
    (s) =>
      s.status === 'aberto' &&
      (!s.recusado_por_ids || !s.recusado_por_ids.includes(colaborador.id))
  );

  // Jobs aceitos por este rotativo
  const meusJobsAceitos = solicitacoes.filter(
    (s) => s.status === 'aceito' && s.aceito_por_id === colaborador.id
  );

  return (
    <div className="space-y-5 text-[var(--text-primary)]">
      {/* Barra de Status do Rotativo */}
      <div className="bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(140,189,173,0.12)] border border-[rgba(140,189,173,0.25)] text-[#517566] dark:text-[#8CBDAD] text-xs font-oswald uppercase tracking-wider font-semibold mb-1">
            <Flame className="w-3.5 h-3.5 text-[#517566] dark:text-[#8CBDAD]" />
            Painel do Tatuador Rotativo
          </div>
          <h2 className="font-display uppercase tracking-wide text-xl text-[var(--text-primary)]">
            Oportunidades & Jobs Rápidos
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-inter">
            Receba chamados quando a demanda de tatuagem do estúdio estiver cheia. O primeiro a aceitar fica com o atendimento.
          </p>
        </div>

        {/* Controles de Disponibilidade e Push */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleToggleNotificacoes}
            className={`px-3 py-2 rounded-xl border text-xs font-oswald uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all ${
              notificacoesAtivas
                ? 'bg-[var(--bg-surface-alt)] text-[var(--accent-dark)] dark:text-[var(--accent)] border-[var(--border)]'
                : 'bg-[var(--bg-surface-alt)] text-[var(--text-muted)] border-[var(--border)] opacity-60'
            }`}
            title="Ativar/desativar notificações push de novos jobs"
          >
            {notificacoesAtivas ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {notificacoesAtivas ? 'Alertas On' : 'Alertas Off'}
          </button>

          <button
            onClick={handleToggleDisponibilidade}
            className={`px-4 py-2 rounded-xl text-xs font-oswald uppercase tracking-wider font-bold flex items-center gap-2 transition-all shadow-sm ${
              disponivel
                ? 'bg-[rgba(81,117,102,0.25)] text-[#6FCF97] border border-[rgba(81,117,102,0.40)] hover:bg-[rgba(81,117,102,0.35)]'
                : 'bg-[rgba(235,87,87,0.15)] text-[#EB5757] border border-[rgba(235,87,87,0.35)] hover:bg-[rgba(235,87,87,0.25)]'
            }`}
          >
            <Power className="w-4 h-4" />
            {disponivel ? '🟢 Disponível p/ Jobs' : '🔴 Indisponível'}
          </button>
        </div>
      </div>

      {/* Seção 1: Jobs Abertos Disponíveis para Aceitar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#517566] dark:text-[#8CBDAD]" />
            <h3 className="font-oswald uppercase tracking-wider font-semibold text-base text-[var(--text-primary)]">
              Jobs Disponíveis Agora ({jobsAbertos.length})
            </h3>
          </div>
          {jobsAbertos.length > 0 && (
            <span className="text-[11px] text-[#EB5757] font-oswald uppercase tracking-wider font-semibold animate-pulse">
              ⚡ Primeiro a aceitar garante o atendimento!
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[var(--text-muted)] font-inter bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)]">
            Carregando jobs disponíveis...
          </div>
        ) : jobsAbertos.length === 0 ? (
          <div className="bg-[var(--bg-surface)] rounded-2xl p-8 border border-[var(--border)] text-center shadow-soft">
            <CheckCircle2 className="w-8 h-8 text-[#517566] dark:text-[#8CBDAD] mx-auto mb-2 opacity-80" />
            <h4 className="font-oswald uppercase tracking-wider text-sm font-semibold text-[var(--text-primary)]">
              Nenhum job aberto no momento
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md mx-auto font-inter">
              Assim que a recepção ou o master chamar um rotativo para atender um cliente, o job aparecerá aqui e você receberá uma notificação imediata.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {jobsAbertos.map((job) => (
              <div
                key={job.id}
                className="bg-[var(--bg-surface)] rounded-2xl p-5 border-2 border-[var(--accent)] shadow-accent flex flex-col justify-between relative overflow-hidden transition-all hover:scale-[1.01]"
              >
                {/* Badge Topo */}
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-[var(--border)]">
                  <span className="px-2.5 py-0.5 rounded-md bg-[var(--accent)] text-[#0B0E11] text-[10px] font-oswald uppercase font-bold tracking-wider">
                    Job Disponível
                  </span>
                  <span className="text-[11px] font-mono text-[var(--text-muted)]">
                    {new Date(job.criado_em).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
                        {job.estilo}
                      </h4>
                      <span className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase font-semibold block">
                        Porte: {job.tamanho}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-oswald uppercase text-[var(--text-secondary)]">Valor Estimado</div>
                      <div className="font-display text-xl sm:text-2xl text-[var(--accent)] leading-tight">
                        R$ {Number(job.valor_estimado).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Informações de Data, Horário e Cliente */}
                  <div className="p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] space-y-1.5 text-xs font-inter">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Clock className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span>
                        <strong className="text-[var(--text-primary)]">{job.data}</strong> às{' '}
                        <strong className="text-[var(--text-primary)]">{job.hora_inicio}</strong> (até {job.hora_fim})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <User className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                      <span>Cliente: <strong className="text-[var(--text-primary)]">{job.cliente_nome}</strong></span>
                    </div>

                    {job.observacoes && (
                      <p className="text-[11px] text-[var(--text-muted)] italic pt-1 border-t border-[var(--border)]">
                        "{job.observacoes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-[var(--border)]">
                  <button
                    type="button"
                    onClick={() => handleRecusarJob(job)}
                    disabled={actionLoadingId === job.id}
                    className="py-2.5 px-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-alt)] hover:bg-[rgba(235,87,87,0.15)] text-[var(--text-secondary)] hover:text-[#EB5757] text-xs font-oswald uppercase tracking-wider font-semibold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    Recusar
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAceitarJob(job)}
                    disabled={actionLoadingId === job.id}
                    className="py-2.5 px-3 rounded-xl bg-[#27AE60] hover:bg-[#219653] text-white text-xs font-oswald uppercase tracking-wider font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    {actionLoadingId === job.id ? 'Confirmando...' : 'Aceitar Job'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção 2: Meus Jobs Aceitos */}
      {meusJobsAceitos.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-[var(--border)]">
          <h3 className="font-oswald uppercase tracking-wider font-semibold text-sm text-[var(--text-secondary)]">
            Seus Jobs Confirmados ({meusJobsAceitos.length})
          </h3>

          <div className="space-y-2">
            {meusJobsAceitos.map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--text-primary)] font-inter">{job.cliente_nome}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[rgba(81,117,102,0.25)] text-[#6FCF97] font-oswald uppercase text-[10px] font-semibold">
                      Confirmado
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-inter mt-0.5">
                    {job.estilo} ({job.tamanho}) • {job.data} às {job.hora_inicio}
                  </div>
                </div>

                <div className="text-right font-display text-sm text-[var(--accent)]">
                  R$ {Number(job.valor_estimado).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
