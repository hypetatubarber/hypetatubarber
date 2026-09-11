import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { TodaySchedule } from '../../components/collaborator/TodaySchedule';
import { MaterialUsageModal } from '../../components/collaborator/MaterialUsageModal';
import { UsageHistory } from '../../components/collaborator/UsageHistory';
import { MonthCalendar } from '../../components/calendar/MonthCalendar';
import { AppointmentStatusBadge } from '../../components/appointments/AppointmentStatusBadge';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { JobsRotativoList } from '../../components/collaborator/JobsRotativoList';
import { CollaboratorEarnings } from '../../components/collaborator/CollaboratorEarnings';
import { Usuario, Agendamento, UsoProduto } from '../../types';
import { CheckCircle2, Clock, PackagePlus, Scissors, ShieldAlert, Bell, Flame, DollarSign, Calendar, X } from 'lucide-react';

export const CollaboratorDashboard: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const { currentUser, switchCollaborator } = useAuth();
  const { notificacoes, unreadCount, markAsRead, requestPushPermission, pushPermission } = useNotifications();

  const [colaborador, setColaborador] = useState<Usuario | null>(null);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [usos, setUsos] = useState<UsoProduto[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Controle para exibir o banner de push apenas na 1ª visita
  const [pushDismissed, setPushDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hype_push_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissPush = () => {
    setPushDismissed(true);
    try {
      localStorage.setItem('hype_push_dismissed', 'true');
    } catch {}
  };

  const handleActivatePush = () => {
    requestPushPermission();
    setPushDismissed(true);
    try {
      localStorage.setItem('hype_push_dismissed', 'true');
    } catch {}
  };

  // Modal de Lançamento de Material
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState<boolean>(false);
  const [linkedAgendamentoId, setLinkedAgendamentoId] = useState<string | undefined>(undefined);

  const getActiveTab = () => {
    if (location.pathname.includes('/agenda')) return 'agenda';
    if (location.pathname.includes('/ganhos')) return 'ganhos';
    if (location.pathname.includes('/materiais')) return 'materiais';
    if (location.pathname.includes('/notificacoes')) return 'notificacoes';
    return 'hoje';
  };

  const activeTab = getActiveTab();

  const loadData = async () => {
    try {
      setLoading(true);
      let targetUser: Usuario | null = null;

      if (currentUser && currentUser.role === 'colaborador') {
        targetUser = currentUser;
      } else if (slug) {
        targetUser = (await api.getUsuarioBySlug(slug)) || null;
      }

      if (!targetUser) {
        const colabs = await api.getColaboradores();
        if (colabs.length > 0) {
          targetUser = colabs[0];
        }
      }

      if (targetUser) {
        setColaborador(targetUser);
        if (targetUser.slug && currentUser?.id !== targetUser.id) {
          switchCollaborator(targetUser.slug);
        }

        const [agList, usoList] = await Promise.all([
          api.getAgendamentosByColaborador(targetUser.id),
          api.getUsoProdutos(),
        ]);

        setAgendamentos(agList);
        setUsos(usoList.filter((u) => u.colaborador_id === targetUser.id));
      }
    } catch (err) {
      console.error('Erro ao carregar dados do colaborador:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('hype_agendamentos_changed', handleSync);
    window.addEventListener('hype_uso_produtos_changed', handleSync);

    return () => {
      window.removeEventListener('hype_agendamentos_changed', handleSync);
      window.removeEventListener('hype_uso_produtos_changed', handleSync);
    };
  }, [slug, currentUser]);

  const handleOpenMaterialModal = (agId?: string) => {
    setLinkedAgendamentoId(agId);
    setIsMaterialModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[var(--text-secondary)] text-sm font-inter">
        Carregando painel do colaborador...
      </div>
    );
  }

  if (!colaborador) {
    return (
      <div className="bg-[var(--bg-surface)] p-8 rounded-xl border border-[var(--border)] text-center shadow-soft text-[var(--text-primary)]">
        <ShieldAlert className="w-10 h-10 text-[#EB5757] mx-auto mb-2" />
        <h3 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">Colaborador não encontrado</h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1 font-inter">Nenhum profissional ativo foi encontrado ou autenticado.</p>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAgendamentos = agendamentos.filter((a) => a.data === todayStr);

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Topo: Perfil do Colaborador */}
      <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] p-6 rounded-xl border border-[var(--border)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <img
            src={colaborador.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'}
            alt={colaborador.nome}
            className="w-16 h-16 rounded-xl object-cover border-2 border-[var(--accent)] shadow-soft"
          />
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(140,189,173,0.12)] border border-[rgba(140,189,173,0.25)] text-[#517566] text-[10px] font-oswald uppercase tracking-wider font-semibold mb-1">
              {colaborador.tipo_colaborador === 'rotativo' ? (
                <>
                  <Flame className="w-3 h-3 text-[#517566] dark:text-[#8CBDAD]" />
                  Tatuador Rotativo
                </>
              ) : (
                <>
                  <Scissors className="w-3 h-3" />
                  Portal do Profissional
                </>
              )}
            </div>
            <h1 className="font-display uppercase tracking-wide text-xl sm:text-2xl text-[var(--text-primary)]">
              {colaborador.nome}
            </h1>
            <p className="text-xs text-[var(--text-secondary)] font-inter">{colaborador.especialidade || 'Colaborador Hype Tatu'}</p>
            {colaborador.estilos_tatuagem && colaborador.estilos_tatuagem.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap mt-2">
                {colaborador.estilos_tatuagem.map((est) => (
                  <span
                    key={est}
                    className="text-[10px] font-oswald uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--bg-surface-alt)] border border-[var(--border)] text-[var(--text-secondary)]"
                  >
                    {est}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Botão de Ação Rápida */}
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={() => handleOpenMaterialModal()}
            className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[#FFFFFF] rounded-xl text-xs font-oswald uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
          >
            <PackagePlus className="w-4 h-4" />
            Lançar Material Usado
          </button>
        </div>
      </div>

      {/* Banner de Ativação Push (apenas na 1ª visita e se ainda não concedido) */}
      {!pushDismissed && pushPermission !== 'granted' && (
        <div className="p-4 bg-[var(--accent-bg)] border border-[var(--border)] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[var(--text-primary)] relative">
          <div className="flex items-center gap-2.5 pr-6 sm:pr-0">
            <Bell className="w-5 h-5 text-[#517566] dark:text-[#8CBDAD] shrink-0" />
            <div>
              <div className="font-oswald uppercase tracking-wider font-semibold text-xs sm:text-sm text-[var(--text-primary)]">Receba avisos instantâneos na sua tela</div>
              <div className="text-[11px] text-[var(--text-secondary)] font-inter">
                Seja notificado no celular assim que a recepção agendar um cliente para você.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={handleActivatePush}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[#FFFFFF] rounded-lg text-xs font-oswald uppercase tracking-wider font-bold whitespace-nowrap transition-colors"
            >
              Ativar Notificações
            </button>
            <button
              onClick={handleDismissPush}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] transition-colors"
              title="Dispensar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ABA 1: HOJE EM DESTAQUE */}
      {activeTab === 'hoje' && (
        <div className="space-y-6">
          {/* Seção Especial de Jobs para Tatuadores Rotativos */}
          {colaborador.tipo_colaborador === 'rotativo' && (
            <JobsRotativoList colaborador={colaborador} onJobAccepted={loadData} />
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#517566]" />
                <h2 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
                  Seus Atendimentos de Hoje ({todayAgendamentos.length})
                </h2>
              </div>
              <span className="text-xs text-[var(--text-secondary)] font-inter">
                {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
            </div>

            <TodaySchedule
              agendamentos={todayAgendamentos}
              onRefresh={loadData}
              onOpenMaterialModal={handleOpenMaterialModal}
            />
          </div>
        </div>
      )}

      {/* ABA 2: MINHA AGENDA (Atendimentos com Calendário Recolhível) */}
      {activeTab === 'agenda' && (
        <div className="space-y-4">
          {/* Barra Superior Compacta de Escolha de Data */}
          <div className="bg-[var(--bg-surface)] p-4 sm:p-5 rounded-xl border border-[var(--border)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[var(--text-primary)]">
            <div>
              <div className="text-[10px] font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold">
                {selectedDate === todayStr ? 'Agenda de Hoje' : 'Data Selecionada'}
              </div>
              <h2 className="font-display uppercase tracking-wide text-lg sm:text-xl text-[var(--text-primary)]">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedDate !== todayStr && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDate(todayStr);
                    setIsCalendarOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-colors"
                >
                  Voltar para Hoje
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-white flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{isCalendarOpen ? 'Recolher Calendário' : 'Escolher Data'}</span>
              </button>
            </div>
          </div>

          {/* Calendário que expande apenas sob demanda */}
          {isCalendarOpen && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <MonthCalendar
                selectedDate={selectedDate}
                onSelectDate={(dStr) => {
                  setSelectedDate(dStr);
                  setIsCalendarOpen(false); // Fecha o calendário para focar na lista
                }}
                agendamentos={agendamentos}
              />
            </div>
          )}

          {/* Atendimentos do Dia Selecionado com todas as ações disponíveis */}
          <TodaySchedule
            agendamentos={agendamentos.filter((a) => a.data === selectedDate)}
            onRefresh={loadData}
            onOpenMaterialModal={handleOpenMaterialModal}
          />
        </div>
      )}

      {/* ABA 3: REGISTRO DE MATERIAIS */}
      {activeTab === 'materiais' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
              Controle de Insumos Utilizados
            </h2>
            <button
              onClick={() => handleOpenMaterialModal()}
              className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] rounded-xl text-xs font-oswald uppercase tracking-wider font-bold flex items-center gap-1.5 transition-all shadow-accent"
            >
              <PackagePlus className="w-4 h-4" />
              Novo Lançamento
            </button>
          </div>

          <UsageHistory usages={usos} />
        </div>
      )}

      {/* ABA 4: NOTIFICAÇÕES */}
      {activeTab === 'notificacoes' && (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] shadow-soft overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-surface-alt)] flex items-center justify-between">
            <h3 className="font-oswald uppercase tracking-wider font-semibold text-sm text-[var(--text-primary)]">
              Suas Notificações & Avisos de Agendamento
            </h3>
            {unreadCount > 0 && (
              <span className="bg-[var(--accent-bg)] text-[var(--accent-dark)] dark:text-[var(--accent)] text-xs font-oswald uppercase font-semibold px-2.5 py-0.5 rounded-full">
                {unreadCount} não lidas
              </span>
            )}
          </div>

          <div className="divide-y divide-[var(--border)]/60 max-h-[550px] overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="py-12 text-center text-[var(--text-muted)] text-xs font-inter">
                Nenhuma notificação recebida por enquanto.
              </div>
            ) : (
              notificacoes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id)}
                  className={`p-4 transition-colors cursor-pointer flex gap-3 ${
                    n.lida ? 'bg-[var(--bg-surface)] opacity-80' : 'bg-[rgba(140,189,173,0.06)] hover:bg-[var(--accent-bg)]'
                  }`}
                >
                  <div className="mt-1">
                    <div className={`w-2.5 h-2.5 rounded-full ${n.lida ? 'bg-[#72808A]' : 'bg-[var(--accent)]'}`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs sm:text-sm font-oswald uppercase tracking-wider font-semibold text-[var(--text-primary)]">{n.titulo}</h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed font-inter">{n.mensagem}</p>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1.5 block font-inter">
                      {new Date(n.criado_em).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ABA 5: MEUS GANHOS & COMISSÕES */}
      {activeTab === 'ganhos' && (
        <CollaboratorEarnings colaborador={colaborador} />
      )}

      {/* Modal de Lançamento de Material */}
      <MaterialUsageModal
        isOpen={isMaterialModalOpen}
        onClose={() => setIsMaterialModalOpen(false)}
        linkedAgendamentoId={linkedAgendamentoId}
        onSaved={loadData}
      />
    </div>
  );
};
