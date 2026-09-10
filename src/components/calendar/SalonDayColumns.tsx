import React, { useState } from 'react';
import { Usuario, Agendamento, CategoriaServico } from '../../types';
import { AppointmentStatusBadge } from '../appointments/AppointmentStatusBadge';
import { Plus, Filter, Clock, Scissors } from 'lucide-react';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  colaboradores: Usuario[];
  agendamentos: Agendamento[];
  categorias: CategoriaServico[];
  onSlotClick: (colaboradorId: string, time: string) => void;
  onAppointmentClick: (agendamento: Agendamento) => void;
}

export const SalonDayColumns: React.FC<Props> = ({
  selectedDate,
  colaboradores,
  agendamentos,
  categorias,
  onSlotClick,
  onAppointmentClick,
}) => {
  // Filtros
  const [selectedColaboradorId, setSelectedColaboradorId] = useState<string>('all');
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Gera slots de 30 minutos das 08:00 às 22:00
  const timeSlots: string[] = [];
  for (let hour = 8; hour < 22; hour++) {
    timeSlots.push(`${String(hour).padStart(2, '0')}:00`);
    timeSlots.push(`${String(hour).padStart(2, '0')}:30`);
  }

  // Filtra colaboradores de acordo com os filtros
  const filteredColaboradores = colaboradores.filter((colab) => {
    if (selectedColaboradorId !== 'all' && colab.id !== selectedColaboradorId) {
      return false;
    }
    return true;
  });

  // Agendamentos do dia filtrados
  const dayAgendamentos = agendamentos.filter((ag) => {
    if (ag.data !== selectedDate) return false;
    if (selectedColaboradorId !== 'all' && ag.colaborador_id !== selectedColaboradorId) return false;
    if (selectedStatus !== 'all' && ag.status !== selectedStatus) return false;
    if (selectedCategoriaId !== 'all' && ag.servico?.categoria_id !== selectedCategoriaId) return false;
    return true;
  });

  // Data legível em português
  const formattedDate = (() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return selectedDate;
    }
  })();

  return (
    <div className="bg-[#FFFFFF] rounded-xl border border-[#DDE1E7] shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col h-[750px] overflow-hidden">
      {/* Barra de Título & Filtros Superiores */}
      <div className="p-4 sm:p-5 border-b border-[#DDE1E7] bg-[#FFFFFF] shrink-0">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8CBDAD]" />
              <h3 className="font-display uppercase tracking-wide text-base sm:text-lg text-[#0B0E11] capitalize">
                Agenda do Dia — {formattedDate}
              </h3>
            </div>
            <p className="text-xs text-[#8A96A3] mt-0.5 font-inter">
              Horários de atendimento das 08h às 22h. Clique em qualquer horário livre para agendar.
            </p>
          </div>

          {/* Filtros em Linha */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-[#517566] font-oswald uppercase tracking-wider font-semibold">
              <Filter className="w-3.5 h-3.5" />
              <span>Filtros:</span>
            </div>

            {/* Filtro por Colaborador */}
            <select
              value={selectedColaboradorId}
              onChange={(e) => setSelectedColaboradorId(e.target.value)}
              className="text-xs bg-[#F0F2F4] border border-[#DDE1E7] rounded-lg px-2.5 py-1.5 font-inter text-[#4A5568] outline-none focus:border-[#8CBDAD]"
            >
              <option value="all">Todos os Profissionais</option>
              {colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome} ({c.especialidade?.split(' ')[0] || 'Geral'})
                </option>
              ))}
            </select>

            {/* Filtro por Categoria */}
            <select
              value={selectedCategoriaId}
              onChange={(e) => setSelectedCategoriaId(e.target.value)}
              className="text-xs bg-[#F0F2F4] border border-[#DDE1E7] rounded-lg px-2.5 py-1.5 font-inter text-[#4A5568] outline-none focus:border-[#8CBDAD]"
            >
              <option value="all">Todas as Categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>

            {/* Filtro por Status */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-[#F0F2F4] border border-[#DDE1E7] rounded-lg px-2.5 py-1.5 font-inter text-[#4A5568] outline-none focus:border-[#8CBDAD]"
            >
              <option value="all">Todos os Status</option>
              <option value="agendado">Agendado</option>
              <option value="confirmado">Confirmado</option>
              <option value="em_atendimento">Em Atendimento</option>
              <option value="concluido">Concluído</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid de Colunas Estilo Salão */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        <div className="inline-block min-w-full align-middle">
          {/* Cabeçalho das Colunas com Foto e Nome dos Colaboradores */}
          <div className="sticky top-0 z-20 bg-[#F5F7F9] border-b border-[#DDE1E7] flex">
            {/* Coluna fixa de Horários */}
            <div className="w-16 sm:w-20 p-3 text-center text-xs font-oswald uppercase tracking-wider font-semibold text-[#8A96A3] shrink-0 border-r border-[#DDE1E7] bg-[#F5F7F9]">
              Hora
            </div>

            {/* Colunas dos Colaboradores */}
            {filteredColaboradores.map((colab) => (
              <div
                key={colab.id}
                className="w-56 sm:w-64 p-3 shrink-0 border-r border-[#DDE1E7] flex items-center gap-2.5 bg-[#F5F7F9]"
              >
                <img
                  src={colab.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                  alt={colab.nome}
                  className="w-8 h-8 rounded-full object-cover border border-[#8CBDAD]/40"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-oswald uppercase tracking-wider text-[#0B0E11] truncate">{colab.nome}</h4>
                  <p className="text-[10px] text-[#8A96A3] truncate font-inter">{colab.especialidade || 'Colaborador'}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Linhas de Horário (Grade 30 min) */}
          <div className="divide-y divide-[#DDE1E7]">
            {timeSlots.map((time) => (
              <div key={time} className="flex min-h-[58px]">
                {/* Marcador de Horário */}
                <div className="w-16 sm:w-20 p-2 text-center text-[11px] font-semibold text-[var(--text-muted)] shrink-0 border-r border-[var(--border)] bg-[var(--bg-surface-alt)]/60 flex items-center justify-center font-inter">
                  {time}
                </div>

                {/* Slots para cada Colaborador */}
                {filteredColaboradores.map((colab) => {
                  const ag = dayAgendamentos.find(
                    (a) =>
                      a.colaborador_id === colab.id &&
                      time >= a.hora_inicio &&
                      time < a.hora_fim
                  );

                  const isStartSlot = ag && ag.hora_inicio === time;

                  return (
                    <div
                      key={`${colab.id}-${time}`}
                      className="w-56 sm:w-64 p-1 shrink-0 border-r border-[var(--border)]/60 relative group transition-colors"
                    >
                      {ag ? (
                        isStartSlot ? (
                          <div
                            onClick={() => onAppointmentClick(ag)}
                            className="h-full w-full p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-left cursor-pointer transition-all shadow-soft hover:border-[var(--accent)] flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="font-bold text-xs truncate text-[var(--text-primary)] font-inter">
                                  {ag.cliente?.nome || 'Cliente'}
                                </span>
                                <AppointmentStatusBadge status={ag.status} size="sm" />
                              </div>
                              <p className="text-[11px] font-medium text-[var(--text-secondary)] truncate flex items-center gap-1 font-inter">
                                <Scissors className="w-3 h-3 text-[var(--accent)] shrink-0" />
                                {ag.servico?.nome || 'Serviço'}
                              </p>
                            </div>
                            <div className="text-[10px] text-[var(--text-muted)] font-medium mt-1 font-inter">
                              {ag.hora_inicio} às {ag.hora_fim}
                            </div>
                          </div>
                        ) : (
                          // Continuação visual de agendamento longo (>30 min)
                          <div
                            onClick={() => onAppointmentClick(ag)}
                            className="h-full w-full bg-[var(--bg-surface-alt)]/60 rounded-lg cursor-pointer border border-dashed border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-muted)] font-inter"
                          >
                            ↕ {ag.servico?.nome}
                          </div>
                        )
                      ) : (
                        // Slot Livre (pode ser clicado para agendar)
                        <button
                          onClick={() => onSlotClick(colab.id, time)}
                          className="w-full h-full min-h-[48px] rounded-lg border border-transparent hover:border-[var(--accent)] hover:bg-[var(--accent-bg)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent-dark)] dark:hover:text-[var(--accent)] transition-all opacity-0 group-hover:opacity-100 font-oswald uppercase tracking-wider"
                          title={`Agendar com ${colab.nome} às ${time}`}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          <span className="text-xs font-semibold">Agendar {time}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
