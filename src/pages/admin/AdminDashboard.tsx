import React, { useState, useEffect } from 'react';
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
import { api } from '../../services/api';
import { Agendamento, Usuario, CategoriaServico } from '../../types';
import { Calendar, DollarSign, Users, AlertTriangle, Plus, Sparkles, Flame } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();

  // Estados principais
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [colaboradores, setColaboradores] = useState<Usuario[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);

  // Modais
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isRotativoModalOpen, setIsRotativoModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Agendamento | null>(null);
  const [initialSlotData, setInitialSlotData] = useState<{ colabId?: string; time?: string }>({});

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
      <div className="bg-[#12171C] text-[#F2F5F7] p-4 sm:p-6 rounded-2xl border border-[rgba(140,189,173,0.20)] shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[rgba(140,189,173,0.12)] border border-[rgba(140,189,173,0.25)] text-[#8CBDAD] text-[10px] sm:text-xs font-oswald uppercase tracking-wider font-semibold mb-1.5 sm:mb-2">
              <Sparkles className="w-3 h-3 text-[#8CBDAD]" />
              Painel Master de Controle
            </div>
            <h1 className="font-display uppercase text-xl sm:text-2xl lg:text-3xl tracking-wide text-[#F2F5F7]">
              HYPE TATU — GESTÃO GERAL
            </h1>
            <p className="text-[11px] sm:text-xs text-[#AAB6BE] mt-0.5 sm:mt-1 max-w-lg font-inter leading-relaxed">
              Acompanhe a agenda do salão, faturamento diário, estoque e consumo de materiais da equipe.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap mt-2 sm:mt-0 w-full sm:w-auto">
            <button
              onClick={() => setIsRotativoModalOpen(true)}
              className="flex-1 sm:flex-none justify-center bg-[rgba(81,117,102,0.25)] hover:bg-[rgba(81,117,102,0.40)] text-[#6FCF97] border border-[rgba(81,117,102,0.50)] font-oswald uppercase font-bold text-xs py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
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
              className="flex-1 sm:flex-none justify-center bg-[#8CBDAD] hover:bg-[#517566] text-[#0B0E11] hover:text-[#FFFFFF] font-oswald uppercase font-bold text-xs py-2 sm:py-2.5 px-3.5 sm:px-5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Agendamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Métricas Principais (visíveis em Overview e Agenda) - Grid 2x2 no Mobile */}
      {(activeTab === 'overview' || activeTab === 'agenda') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-[#12171C] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[rgba(140,189,173,0.18)] shadow-lg flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[rgba(140,189,173,0.12)] border border-[rgba(140,189,173,0.20)] flex items-center justify-center text-[#8CBDAD] shrink-0">
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-[#8CBDAD]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[11px] text-[#AAB6BE] font-oswald uppercase tracking-wider font-semibold truncate">Agendamentos Hoje</div>
              <div className="font-display text-lg sm:text-[28px] lg:text-[32px] text-[#F2F5F7] mt-0.5 leading-tight">
                {todayAgendamentos.length}
              </div>
            </div>
          </div>

          <div className="bg-[#12171C] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[rgba(140,189,173,0.18)] shadow-lg flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[rgba(140,189,173,0.12)] border border-[rgba(140,189,173,0.20)] flex items-center justify-center text-[#8CBDAD] shrink-0">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-[#8CBDAD]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[11px] text-[#AAB6BE] font-oswald uppercase tracking-wider font-semibold truncate">Previsão de Hoje</div>
              <div className="font-display text-base sm:text-2xl lg:text-[28px] text-[#8CBDAD] mt-0.5 leading-tight truncate">
                R$ {faturamentoPrevistoHoje.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-[#12171C] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[rgba(140,189,173,0.18)] shadow-lg flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[rgba(140,189,173,0.12)] border border-[rgba(140,189,173,0.20)] flex items-center justify-center text-[#8CBDAD] shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-[#8CBDAD]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[11px] text-[#AAB6BE] font-oswald uppercase tracking-wider font-semibold truncate">Profissionais Ativos</div>
              <div className="font-display text-lg sm:text-[28px] lg:text-[32px] text-[#F2F5F7] mt-0.5 leading-tight">
                {colaboradores.length}
              </div>
            </div>
          </div>

          <div className="bg-[#12171C] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[rgba(140,189,173,0.18)] shadow-lg flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[rgba(140,189,173,0.12)] border border-[rgba(140,189,173,0.20)] flex items-center justify-center text-[#8CBDAD] shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6 text-[#8CBDAD]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[11px] text-[#AAB6BE] font-oswald uppercase tracking-wider font-semibold truncate">Total Agendado</div>
              <div className="font-display text-lg sm:text-[28px] lg:text-[32px] text-[#F2F5F7] mt-0.5 leading-tight">
                {agendamentos.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDERIZAÇÃO DO CONTEÚDO CONFORME A ABA/ROTA */}
      {(activeTab === 'overview' || activeTab === 'agenda') && (
        <div className="space-y-6">
          {/* Calendário Mensal */}
          <MonthCalendar
            selectedDate={selectedDate}
            onSelectDate={(dStr) => setSelectedDate(dStr)}
            agendamentos={agendamentos}
          />

          {/* Agenda do Dia por Colunas (Salão / Barbearia / Tattoo) */}
          <SalonDayColumns
            selectedDate={selectedDate}
            colaboradores={colaboradores}
            agendamentos={agendamentos}
            categorias={categorias}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
            onChamarRotativo={() => setIsRotativoModalOpen(true)}
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
      />

      {/* Modal de Solicitação de Tatuador Rotativo */}
      <SolicitarRotativoModal
        isOpen={isRotativoModalOpen}
        onClose={() => setIsRotativoModalOpen(false)}
        initialDate={selectedDate}
        onSuccess={loadData}
      />
    </div>
  );
};
