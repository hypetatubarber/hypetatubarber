import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Agendamento } from '../../types';

interface Props {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  agendamentos: Agendamento[];
}

export const MonthCalendar: React.FC<Props> = ({ selectedDate, onSelectDate, agendamentos }) => {
  const [currentDate, setCurrentDate] = useState(() => {
    return selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  const prevLastDay = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    const dStr = today.toISOString().split('T')[0];
    onSelectDate(dStr);
  };

  // Mapeia quantidade de agendamentos por dia no mês atual
  const getAgendamentosForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return agendamentos.filter((a) => a.data === dateStr && a.status !== 'cancelado');
  };

  const renderDays = () => {
    const days = [];

    // Dias do mês anterior (padding)
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push(
        <div
          key={`prev-${i}`}
          className="h-14 sm:h-20 p-1.5 text-[#C5CDD4] bg-[#F5F7F9]/50 rounded-lg text-xs font-inter flex flex-col justify-between"
        >
          <span>{prevLastDay - i}</span>
        </div>
      );
    }

    // Dias do mês atual
    const todayStr = new Date().toISOString().split('T')[0];

    for (let day = 1; day <= lastDayOfMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isSelected = selectedDate === dateStr;
      const isToday = todayStr === dateStr;
      const dayAgendamentos = getAgendamentosForDay(day);
      const count = dayAgendamentos.length;

      days.push(
        <button
          key={`day-${day}`}
          onClick={() => onSelectDate(dateStr)}
          className={`h-14 sm:h-20 p-1.5 sm:p-2 rounded-xl text-left flex flex-col justify-between transition-all relative border ${
            isToday
              ? 'bg-[#8CBDAD] text-[#0B0E11] font-bold border-[#8CBDAD]'
              : isSelected
              ? 'bg-[rgba(140,189,173,0.15)] text-[#0B0E11] font-bold border-2 border-[#8CBDAD]'
              : 'bg-[#FFFFFF] hover:bg-[#F5F7F9] text-[#0B0E11] border-[#DDE1E7]'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className={`text-xs sm:text-sm font-inter ${isToday ? 'text-[#0B0E11] font-bold' : 'text-[#0B0E11]'}`}>
              {day}
            </span>
            {isToday && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B0E11]" title="Hoje" />
            )}
          </div>

          {count > 0 && (
            <div className="mt-auto w-full">
              <div
                className="text-[10px] font-oswald uppercase tracking-wider px-1.5 py-0.5 rounded truncate text-center bg-[#517566] text-[#FFFFFF]"
              >
                {count} {count === 1 ? 'agend.' : 'agends.'}
              </div>
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  return (
    <div className="bg-[#FFFFFF] rounded-xl p-4 sm:p-6 border border-[#DDE1E7] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
      {/* Cabeçalho do Calendário */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[#8CBDAD]" />
          <h2 className="font-display uppercase tracking-wide text-lg sm:text-xl text-[#0B0E11]">
            {monthNames[month]} de {year}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleJumpToToday}
            className="text-xs font-oswald uppercase tracking-wider font-semibold px-3 py-1.5 rounded-lg border border-[#DDE1E7] bg-[#F5F7F9] hover:bg-[#DDE1E7] text-[#0B0E11] transition-colors"
          >
            Hoje
          </button>
          <div className="flex items-center border border-[#DDE1E7] rounded-lg overflow-hidden bg-[#F5F7F9]">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-[#DDE1E7] text-[#4A5568] hover:text-[#0B0E11] transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-[#DDE1E7] text-[#4A5568] hover:text-[#0B0E11] transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cabeçalho dos Dias da Semana: Oswald uppercase 12px #8A96A3 */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-oswald uppercase tracking-wider font-semibold text-[#8A96A3]">
        <div>Dom</div>
        <div>Seg</div>
        <div>Ter</div>
        <div>Qua</div>
        <div>Qui</div>
        <div>Sex</div>
        <div>Sáb</div>
      </div>

      {/* Grid de Dias */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {renderDays()}
      </div>
    </div>
  );
};
