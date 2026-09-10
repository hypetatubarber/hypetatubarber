import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MonthCalendar } from '../../components/calendar/MonthCalendar';
import { SalonDayColumns } from '../../components/calendar/SalonDayColumns';
import { AppointmentModal } from '../../components/appointments/AppointmentModal';
import { SolicitarRotativoModal } from '../../components/appointments/SolicitarRotativoModal';
import { RegistrarPagamentoModal } from '../../components/financeiro/RegistrarPagamentoModal';
import { CaixaRecepcaoCard } from '../../components/financeiro/CaixaRecepcaoCard';
import { ClientList } from '../../components/clients/ClientList';
import { ProductList } from '../../components/stock/ProductList';
import { api } from '../../services/api';
import { Agendamento, Usuario, CategoriaServico } from '../../types';
import { Plus, Sparkles, Flame } from 'lucide-react';

export const ReceptionDashboard: React.FC = () => {
  const location = useLocation();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [colaboradores, setColaboradores] = useState<Usuario[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);

  // Modais
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isRotativoModalOpen, setIsRotativoModalOpen] = useState(false);
  const [pagamentoModalAgendamento, setPagamentoModalAgendamento] = useState<Agendamento | null>(null);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Agendamento | null>(null);
  const [initialSlotData, setInitialSlotData] = useState<{ colabId?: string; time?: string }>({});

  const getActiveTab = () => {
    if (location.pathname.includes('/clientes')) return 'clientes';
    if (location.pathname.includes('/estoque')) return 'estoque';
    return 'agenda';
  };

  const activeTab = getActiveTab();

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
      console.error('Erro ao carregar dados da recepção:', err);
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
      {/* Topo do Painel Recepção */}
      <div className="bg-[#FFFFFF] text-[#0B0E11] p-6 rounded-2xl border border-[#DDE1E7] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(140,189,173,0.12)] border border-[rgba(140,189,173,0.25)] text-[#517566] text-xs font-oswald uppercase tracking-wider font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Recepção & Agendamentos
          </div>
          <h1 className="font-display uppercase text-2xl sm:text-3xl tracking-wide text-[#0B0E11]">
            AGENDA GERAL DO SALÃO
          </h1>
          <p className="text-xs text-[#4A5568] mt-0.5 font-inter">
            Gerencie horários de todos os barbeiros e tatuadores, cadastre clientes e envie avisos imediatos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={() => setIsRotativoModalOpen(true)}
            className="bg-[rgba(81,117,102,0.18)] hover:bg-[rgba(81,117,102,0.30)] text-[#517566] dark:text-[#6FCF97] border border-[rgba(81,117,102,0.40)] font-oswald uppercase font-bold text-xs py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
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
            className="bg-[#8CBDAD] hover:bg-[#517566] text-[#0B0E11] hover:text-[#FFFFFF] font-oswald uppercase font-bold text-xs py-2.5 px-5 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            + Novo Agendamento
          </button>
        </div>
      </div>

      {/* Conteúdo Conforme a Rota */}
      {activeTab === 'agenda' && (
        <div className="space-y-6">
          {/* Controle de Caixa do Dia (Recepção) */}
          <CaixaRecepcaoCard
            selectedDate={selectedDate}
            agendamentos={agendamentos}
            onOpenPagamentoModal={(ag) => setPagamentoModalAgendamento(ag)}
          />

          <MonthCalendar
            selectedDate={selectedDate}
            onSelectDate={(dStr) => setSelectedDate(dStr)}
            agendamentos={agendamentos}
          />

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

      {activeTab === 'clientes' && <ClientList />}
      {activeTab === 'estoque' && <ProductList readOnly={true} />}

      {/* Modal de Agendamento Padrão */}
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

      {/* Modal Registrar Pagamento */}
      <RegistrarPagamentoModal
        isOpen={!!pagamentoModalAgendamento}
        onClose={() => setPagamentoModalAgendamento(null)}
        agendamento={pagamentoModalAgendamento}
        onSuccess={loadData}
      />
    </div>
  );
};
