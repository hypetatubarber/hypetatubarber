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
          className="h-14 sm:h-20 p-1.5 text-[var(--text-muted)] opacity-35 bg-[var(--bg-surface-alt)]/40 rounded-lg text-xs font-inter flex flex-col justify-between"
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
              ? 'bg-[var(--accent)] text-[#0B0E11] font-bold border-[var(--accent)] shadow-accent'
              : isSelected
              ? 'bg-[var(--accent-bg)] text-[var(--text-primary)] font-bold border-2 border-[var(--accent)]'
              : 'bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-alt)] text-[var(--text-primary)] border-[var(--border)]'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className={`text-xs sm:text-sm font-inter ${isToday ? 'text-[#0B0E11] font-bold' : 'text-[var(--text-primary)]'}`}>
              {day}
            </span>
            {isToday && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#0B0E11]" title="Hoje" />
            )}
          </div>

          {count > 0 && (
            <div className="mt-auto w-full">
              <div
                className="text-[10px] font-oswald uppercase tracking-wider px-1.5 py-0.5 rounded truncate text-center bg-[var(--accent)] text-[#0B0E11] font-bold"
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
    <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl p-4 sm:p-6 border border-[var(--border)] shadow-sm transition-colors">
      {/* Cabeçalho do Calendário */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="font-display uppercase tracking-wide text-lg sm:text-xl text-[var(--text-primary)]">
            {monthNames[month]} de {year}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleJumpToToday}
            className="text-xs font-oswald uppercase tracking-wider font-semibold px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] hover:bg-[var(--accent)] hover:text-[#0B0E11] text-[var(--text-primary)] transition-colors"
          >
            Hoje
          </button>
          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-surface-alt)]">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cabeçalho dos Dias da Semana */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--text-muted)]">
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
