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
    <div className="space-y-6">
      {/* Topo do Painel Master */}
      <div className="bg-[#FFFFFF] text-[#0B0E11] p-6 rounded-2xl border border-[#DDE1E7] shadow-[0_1px_3px_rgba(0,0,0,0.06)] relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(140,189,173,0.12)] border border-[rgba(140,189,173,0.25)] text-[#517566] text-xs font-oswald uppercase tracking-wider font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Painel Master de Controle
            </div>
            <h1 className="font-display uppercase text-2xl sm:text-3xl tracking-wide text-[#0B0E11]">
              HYPE TATU — GESTÃO GERAL
            </h1>
            <p className="text-xs text-[#4A5568] mt-1 max-w-lg font-inter">
              Acompanhe a agenda do salão, faturamento diário, estoque e consumo de materiais da equipe.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => setIsRotativoModalOpen(true)}
              className="bg-[rgba(81,117,102,0.18)] hover:bg-[rgba(81,117,102,0.30)] text-[#517566] dark:text-[#6FCF97] border border-[rgba(81,117,102,0.40)] font-oswald uppercase font-bold text-xs py-2.5 px-4 rounded-lg flex items-center gap-2 transition-all shadow-sm"
            >
              <Flame className="w-4 h-4 text-[#27AE60]" />
              Chamar Rotativo
            </button>

            <button
              onClick={() => {
                setAppointmentToEdit(null);
                setInitialSlotData({});
                setIsAppModalOpen(true);
              }}
              className="bg-[#8CBDAD] hover:bg-[#517566] text-[#0B0E11] hover:text-[#FFFFFF] font-oswald uppercase font-bold text-xs py-2.5 px-5 rounded-lg flex items-center gap-2 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              + Novo Agendamento
            </button>
          </div>
        </div>
      </div>

      {/* Métricas Principais (visíveis em Overview e Agenda) */}
      {(activeTab === 'overview' || activeTab === 'agenda') && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#DDE1E7] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(140,189,173,0.10)] flex items-center justify-center text-[#8CBDAD] shrink-0">
              <Calendar className="w-6 h-6 text-[#8CBDAD]" />
            </div>
            <div>
              <div className="text-[11px] text-[#8A96A3] font-oswald uppercase tracking-wider font-semibold">Agendamentos Hoje</div>
              <div className="font-display text-[28px] sm:text-[32px] text-[#0B0E11] mt-0.5 leading-tight">
                {todayAgendamentos.length}
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#DDE1E7] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(140,189,173,0.10)] flex items-center justify-center text-[#8CBDAD] shrink-0">
              <DollarSign className="w-6 h-6 text-[#8CBDAD]" />
            </div>
            <div>
              <div className="text-[11px] text-[#8A96A3] font-oswald uppercase tracking-wider font-semibold">Previsão de Hoje</div>
              <div className="font-display text-[28px] sm:text-[32px] text-[#0B0E11] mt-0.5 leading-tight">
                R$ {faturamentoPrevistoHoje.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#DDE1E7] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(140,189,173,0.10)] flex items-center justify-center text-[#8CBDAD] shrink-0">
              <Users className="w-6 h-6 text-[#8CBDAD]" />
            </div>
            <div>
              <div className="text-[11px] text-[#8A96A3] font-oswald uppercase tracking-wider font-semibold">Profissionais Ativos</div>
              <div className="font-display text-[28px] sm:text-[32px] text-[#0B0E11] mt-0.5 leading-tight">
                {colaboradores.length}
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] p-5 rounded-xl border border-[#DDE1E7] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[rgba(140,189,173,0.10)] flex items-center justify-center text-[#8CBDAD] shrink-0">
              <AlertTriangle className="w-6 h-6 text-[#8CBDAD]" />
            </div>
            <div>
              <div className="text-[11px] text-[#8A96A3] font-oswald uppercase tracking-wider font-semibold">Total Geral Agendado</div>
              <div className="font-display text-[28px] sm:text-[32px] text-[#0B0E11] mt-0.5 leading-tight">
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
