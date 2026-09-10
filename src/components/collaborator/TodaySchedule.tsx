import React from 'react';
import { Agendamento } from '../../types';
import { AppointmentStatusBadge } from '../appointments/AppointmentStatusBadge';
import { Clock, Phone, Scissors, Check, Play, CheckCircle, PackagePlus, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface Props {
  agendamentos: Agendamento[];
  onRefresh: () => void;
  onOpenMaterialModal: (agendamentoId?: string) => void;
}

export const TodaySchedule: React.FC<Props> = ({
  agendamentos,
  onRefresh,
  onOpenMaterialModal,
}) => {
  const { showToast } = useToast();

  const handleUpdateStatus = async (id: string, newStatus: Agendamento['status'], statusLabel: string) => {
    try {
      await api.updateAgendamentoStatus(id, newStatus);
      showToast(`Atendimento atualizado para "${statusLabel}"!`, 'success');
      onRefresh();
    } catch (err) {
      showToast('Erro ao atualizar status.', 'error');
    }
  };

  const sorted = [...agendamentos].sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));

  if (sorted.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-xl p-8 text-center border border-[var(--border)] shadow-soft text-[var(--text-primary)]">
        <div className="w-12 h-12 rounded-full bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center justify-center mx-auto mb-3 text-[var(--accent-dark)] dark:text-[var(--accent)]">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="font-oswald uppercase tracking-wider font-semibold text-base text-[var(--text-primary)]">Nenhum atendimento agendado para hoje</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto font-inter">
          Quando a recepção agendar um cliente para você, ele aparecerá aqui com notificações em tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.map((ag) => {
        const cleanPhone = ag.cliente?.telefone?.replace(/\D/g, '') || '';
        const whatsappLink = `https://wa.me/55${cleanPhone}`;

        return (
          <div
            key={ag.id}
            className={`bg-[var(--bg-surface)] rounded-xl p-4 sm:p-5 border transition-all shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 text-[var(--text-primary)] ${
              ag.status === 'em_atendimento'
                ? 'border-[var(--accent)] ring-1 ring-[#8CBDAD]/50 bg-[var(--bg-surface-alt)]'
                : ag.status === 'concluido'
                ? 'border-[var(--border)] opacity-80'
                : 'border-[var(--border)] hover:border-[var(--accent)]'
            }`}
          >
            {/* Lado Esquerdo: Horário e Dados do Cliente */}
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-16 sm:w-20 p-2.5 rounded-xl bg-[var(--bg-surface-alt)] text-[var(--accent-dark)] dark:text-[var(--accent)] text-center shrink-0 border border-[var(--border)] font-display">
                <span className="block text-sm tracking-tight">{ag.hora_inicio}</span>
                <span className="text-[10px] text-[var(--text-secondary)] block mt-0.5 font-oswald uppercase">às {ag.hora_fim}</span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h4 className="font-display uppercase tracking-wide text-sm sm:text-base text-[var(--text-primary)] truncate">
                    {ag.cliente?.nome || 'Cliente'}
                  </h4>
                  <AppointmentStatusBadge status={ag.status} size="sm" />
                </div>

                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap font-inter">
                  <span className="flex items-center gap-1 text-[var(--text-primary)] font-medium">
                    <Scissors className="w-3.5 h-3.5 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
                    {ag.servico?.nome} ({ag.servico?.duracao_minutos} min)
                  </span>

                  {ag.cliente?.telefone && (
                    <a
                      href={whatsappLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--accent-dark)] dark:text-[var(--accent)] hover:underline font-medium"
                      title="Abrir conversa no WhatsApp"
                    >
                      <Phone className="w-3 h-3 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
                      {ag.cliente.telefone}
                    </a>
                  )}
                </div>

                {ag.observacoes && (
                  <p className="text-[11px] text-[var(--text-secondary)] bg-[var(--bg-surface-alt)] border border-[var(--border)] rounded-md px-2 py-1 mt-2 flex items-center gap-1 font-inter">
                    <MessageSquare className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
                    <span className="truncate">{ag.observacoes}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Lado Direito: Ações de Status e Consumo de Material */}
            <div className="flex items-center gap-2 flex-wrap justify-end border-t md:border-t-0 pt-3 md:pt-0 border-[var(--border)] font-oswald uppercase">
              {/* Botão de Lançar Material */}
              <button
                onClick={() => onOpenMaterialModal(ag.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent)] flex items-center gap-1.5 transition-colors"
                title="Registrar materiais usados neste atendimento"
              >
                <PackagePlus className="w-3.5 h-3.5 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
                <span className="hidden sm:inline">Lançar Material</span>
              </button>

              {/* Botão de Avanço de Status */}
              {ag.status === 'agendado' && (
                <button
                  onClick={() => handleUpdateStatus(ag.id, 'confirmado', 'Confirmado')}
                  className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-accent"
                >
                  <Check className="w-3.5 h-3.5" />
                  Confirmar
                </button>
              )}

              {ag.status === 'confirmado' && (
                <button
                  onClick={() => handleUpdateStatus(ag.id, 'em_atendimento', 'Em Atendimento')}
                  className="px-3 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-accent"
                >
                  <Play className="w-3.5 h-3.5" />
                  Iniciar Atendimento
                </button>
              )}

              {ag.status === 'em_atendimento' && (
                <button
                  onClick={() => handleUpdateStatus(ag.id, 'concluido', 'Concluído')}
                  className="px-3 py-1.5 bg-[#517566] hover:bg-[var(--accent)] text-white hover:text-[#0B0E11] rounded-lg text-xs font-bold flex items-center gap-1 transition-all shadow-accent"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Concluir Atendimento
                </button>
              )}

              {ag.status === 'concluido' && (
                <span className="text-xs text-[#6FCF97] font-semibold flex items-center gap-1 bg-[rgba(81,117,102,0.25)] border border-[rgba(81,117,102,0.40)] px-2.5 py-1 rounded-lg">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Finalizado
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
