import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { MonthCalendar } from '../../components/calendar/MonthCalendar';
import { SalonDayColumns } from '../../components/calendar/SalonDayColumns';
import { AppointmentModal } from '../../components/appointments/AppointmentModal';
import { SolicitarRotativoModal } from '../../components/appointments/SolicitarRotativoModal';
import { ServiceList } from '../../components/services/ServiceList';
import { ProductList } from '../../components/stock/ProductList';
import { CollaboratorConsumption } from '../../components/stock/CollaboratorConsumption';
import { ClientList } from '../../components/clients/ClientList';
import { CollaboratorManagement } from '../../components/collaborators/CollaboratorManagement';
import { AdminFinanceiroView } from '../../components/financeiro/AdminFinanceiroView';
import { RegistrarPagamentoModal } from '../../components/financeiro/RegistrarPagamentoModal';
import { api } from '../../services/api';
import { Agendamento, Usuario, CategoriaServico } from '../../types';
import { Calendar, DollarSign, Users, CheckCircle2, Plus, Sparkles, Flame, ChevronDown, ChevronUp } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();

  // Estados principais
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [colaboradores, setColaboradores] = useState<Usuario[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState<boolean>(false);

  // Modais
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isRotativoModalOpen, setIsRotativoModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Agendamento | null>(null);
  const [initialSlotData, setInitialSlotData] = useState<{ colabId?: string; time?: string }>({});
  const [pagamentoModalAgendamento, setPagamentoModalAgendamento] = useState<Agendamento | null>(null);

  // Aba ativa conforme a URL
  const getTabFromPath = () => {
    if (location.pathname.includes('/financeiro')) return 'financeiro';
    if (location.pathname.includes('/agenda')) return 'agenda';
    if (location.pathname.includes('/servicos')) return 'servicos';
    if (location.pathname.includes('/equipe')) return 'equipe';
    if (location.pathname.includes('/estoque')) return 'estoque';
    if (location.pathname.includes('/clientes')) return 'clientes';
    if (location.pathname.includes('/relatorios')) return 'relatorios';
    return 'overview';
  };

  const activeTab = getTabFromPath();

  const loadData = async () => {
    try {
      const [agList, colabList, catList] = await Promise.all([
        api.getAgendamentos(),
        api.getColaboradores(),
        api.getCategorias(),
      ]);
      setAgendamentos(agList);
      setColaboradores(colabList);
      setCategorias(catList);
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('hype_agendamentos_changed', handleSync);
    window.addEventListener('hype_usuarios_changed', handleSync);
    window.addEventListener('hype_servicos_changed', handleSync);

    return () => {
      window.removeEventListener('hype_agendamentos_changed', handleSync);
      window.removeEventListener('hype_usuarios_changed', handleSync);
      window.removeEventListener('hype_servicos_changed', handleSync);
    };
  }, []);

  // Cálculos para os cards de métricas
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAgendamentos = agendamentos.filter((a) => a.data === todayStr && a.status !== 'cancelado');
  
  const faturamentoPrevistoHoje = todayAgendamentos.reduce((sum, a) => {
    return sum + (a.servico?.preco || 0);
  }, 0);

  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, [selectedDate]);

  const selectedDayAgendamentosCount = useMemo(() => {
    return agendamentos.filter((a) => a.data === selectedDate && a.status !== 'cancelado').length;
  }, [agendamentos, selectedDate]);

  const handleSlotClick = (colaboradorId: string, time: string) => {
    setAppointmentToEdit(null);
    setInitialSlotData({ colabId: colaboradorId, time });
    setIsAppModalOpen(true);
  };

  const handleAppointmentClick = (ag: Agendamento) => {
    setAppointmentToEdit(ag);
    setInitialSlotData({});
    setIsAppModalOpen(true);
  };

  useEffect(() => {
    const handleOpenModal = () => {
      setAppointmentToEdit(null);
      setInitialSlotData({});
      setIsAppModalOpen(true);
    };
    window.addEventListener('open-appointment-modal', handleOpenModal);
    return () => window.removeEventListener('open-appointment-modal', handleOpenModal);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Topo do Painel Master */}
      <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] p-4 sm:p-6 rounded-2xl border border-[var(--border)] shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent-bg)] border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] sm:text-xs font-oswald uppercase tracking-wider font-semibold mb-1.5 sm:mb-2">
              <Sparkles className="w-3 h-3 text-[var(--accent)]" />
              Painel Master de Controle
            </div>
            <h1 className="font-display uppercase text-xl sm:text-2xl lg:text-3xl tracking-wide text-[var(--text-primary)]">
              HYPE TATU — GESTÃO GERAL
            </h1>
            <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-0.5 sm:mt-1 max-w-lg font-inter leading-relaxed">
              Acompanhe a agenda do salão, faturamento diário, atendimentos e equipe em tempo real.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap mt-2 sm:mt-0 w-full sm:w-auto">
            <button
              onClick={() => setIsRotativoModalOpen(true)}
              className="flex-1 sm:flex-none justify-center bg-[var(--accent-bg)] hover:bg-[var(--accent)]/30 text-[#27AE60] dark:text-[#6FCF97] border border-[var(--accent)]/40 font-oswald uppercase font-bold text-xs py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 text-[#27AE60]" />
              <span>Chamar Rotativo</span>
            </button>

            <button
              onClick={() => {
                setAppointmentToEdit(null);
                setInitialSlotData({});
                setIsAppModalOpen(true);
              }}
              className="flex-1 sm:flex-none justify-center bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] font-oswald uppercase font-bold text-xs py-2 sm:py-2.5 px-3.5 sm:px-5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Agendamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Métricas Principais (visíveis em Overview e Agenda) - Grid 2x2 no Mobile, 4 colunas no Desktop */}
      {(activeTab === 'overview' || activeTab === 'agenda') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-[var(--bg-surface)] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[11px] text-[var(--text-secondary)] font-oswald uppercase tracking-wider font-semibold truncate">Agendamentos Hoje</div>
              <div className="font-display text-lg sm:text-[28px] lg:text-[32px] text-[var(--text-primary)] mt-0.5 leading-tight">
                {todayAgendamentos.length}
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[11px] text-[var(--text-secondary)] font-oswald uppercase tracking-wider font-semibold truncate">Previsão de Hoje</div>
              <div className="font-display text-base sm:text-2xl lg:text-[28px] text-[var(--accent)] mt-0.5 leading-tight truncate">
                R$ {faturamentoPrevistoHoje.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[11px] text-[var(--text-secondary)] font-oswald uppercase tracking-wider font-semibold truncate">Profissionais Ativos</div>
              <div className="font-display text-lg sm:text-[28px] lg:text-[32px] text-[var(--text-primary)] mt-0.5 leading-tight">
                {colaboradores.length}
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[11px] text-[var(--text-secondary)] font-oswald uppercase tracking-wider font-semibold truncate">Total Agendado</div>
              <div className="font-display text-lg sm:text-[28px] lg:text-[32px] text-[var(--text-primary)] mt-0.5 leading-tight">
                {agendamentos.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDERIZAÇÃO DO CONTEÚDO CONFORME A ABA/ROTA */}
      {(activeTab === 'overview' || activeTab === 'agenda') && (
        <div className="space-y-4 sm:space-y-6">
          {/* Seção Calendário - Reduzida/Colapsável com Auto-Minimização */}
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl sm:rounded-2xl border border-[var(--border)] shadow-sm transition-all overflow-hidden">
            {/* Barra Compacta de Controle / Resumo da Data Selecionada */}
            <div
              onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
              className="p-3.5 sm:p-4.5 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-surface-alt)]/60 transition-colors select-none group"
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0 group-hover:scale-105 transition-transform">
                  <Calendar className="w-5 h-5 text-[var(--accent)]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] sm:text-[11px] font-oswald uppercase tracking-wider font-semibold text-[var(--accent)]">
                      Calendário do Salão
                    </span>
                    {selectedDate === todayStr && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--accent)] text-[#0B0E11] text-[9px] font-bold uppercase tracking-wider">
                        Hoje
                      </span>
                    )}
                  </div>
                  <div className="font-display text-base sm:text-lg lg:text-xl text-[var(--text-primary)] capitalize truncate mt-0.5">
                    {formattedSelectedDate}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                {/* Contador de agendamentos no dia selecionado */}
                <div className="hidden xs:flex flex-col items-end text-right">
                  <span className="text-xs font-oswald uppercase tracking-wider font-bold text-[var(--text-primary)]">
                    {selectedDayAgendamentosCount} {selectedDayAgendamentosCount === 1 ? 'Agendamento' : 'Agendamentos'}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-inter">
                    {isCalendarExpanded ? 'Clique para recolher' : 'Clique para alterar a data'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCalendarExpanded(!isCalendarExpanded);
                  }}
                  className={`px-3 py-2 rounded-xl border border-[var(--border)] text-xs font-oswald uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                    isCalendarExpanded
                      ? 'bg-[var(--accent)] text-[#0B0E11] border-[var(--accent)]'
                      : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] group-hover:border-[var(--accent)]/40'
                  }`}
                >
                  <span>{isCalendarExpanded ? 'Recolher Calendário' : 'Expandir Calendário'}</span>
                  {isCalendarExpanded ? (
                    <ChevronUp className="w-4 h-4 transition-transform" />
                  ) : (
                    <ChevronDown className="w-4 h-4 transition-transform" />
                  )}
                </button>
              </div>
            </div>

            {/* Calendário Mensal Completo (Exibido apenas quando expandido) */}
            {isCalendarExpanded && (
              <div className="border-t border-[var(--border)] p-2 sm:p-4 bg-[var(--bg-surface)]">
                <MonthCalendar
                  selectedDate={selectedDate}
                  onSelectDate={(dStr) => {
                    setSelectedDate(dStr);
                    setIsCalendarExpanded(false); // Minimiza novamente após selecionar o dia!
                  }}
                  agendamentos={agendamentos}
                />
              </div>
            )}
          </div>

          {/* Agenda do Dia por Colunas (Salão / Barbearia / Tattoo) */}
          <SalonDayColumns
            selectedDate={selectedDate}
            colaboradores={colaboradores}
            agendamentos={agendamentos}
            categorias={categorias}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
            onChamarRotativo={() => setIsRotativoModalOpen(true)}
            onRegistrarPagamento={(ag) => setPagamentoModalAgendamento(ag)}
          />
        </div>
      )}

      {activeTab === 'servicos' && <ServiceList />}
      {activeTab === 'equipe' && <CollaboratorManagement />}
      {activeTab === 'estoque' && <ProductList />}
      {activeTab === 'clientes' && <ClientList />}
      {activeTab === 'relatorios' && <CollaboratorConsumption />}
      {activeTab === 'financeiro' && <AdminFinanceiroView />}

      {/* Modal de Agendamento */}
      <AppointmentModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        appointmentToEdit={appointmentToEdit}
        initialDate={selectedDate}
        initialTime={initialSlotData.time}
        initialColaboradorId={initialSlotData.colabId}
        onSaved={loadData}
        onRegistrarPagamento={(ag) => setPagamentoModalAgendamento(ag)}
      />

      {/* Modal de Solicitação de Tatuador Rotativo */}
      <SolicitarRotativoModal
        isOpen={isRotativoModalOpen}
        onClose={() => setIsRotativoModalOpen(false)}
        initialDate={selectedDate}
        onSuccess={loadData}
      />

      {/* Modal Registrar Pagamento (PIX, Crédito à Vista, Parcelado, Débito ou Dinheiro) */}
      <RegistrarPagamentoModal
        isOpen={!!pagamentoModalAgendamento}
        onClose={() => setPagamentoModalAgendamento(null)}
        agendamento={pagamentoModalAgendamento}
        onSuccess={loadData}
      />
    </div>
  );
};
