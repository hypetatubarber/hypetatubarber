import React from 'react';
import { StatusAgendamento } from '../../types';

interface Props {
  status: StatusAgendamento;
  size?: 'sm' | 'md';
}

export const AppointmentStatusBadge: React.FC<Props> = ({ status, size = 'sm' }) => {
  const getConfig = () => {
    switch (status) {
      case 'agendado':
        return {
          label: 'Agendado',
          style: {
            backgroundColor: 'rgba(140, 189, 173, 0.15)',
            color: '#8CBDAD',
            borderColor: 'rgba(140, 189, 173, 0.30)',
          },
          dotColor: '#8CBDAD',
        };
      case 'confirmado':
        return {
          label: 'Confirmado',
          style: {
            backgroundColor: 'rgba(140, 189, 173, 0.22)',
            color: '#8CBDAD',
            borderColor: '#8CBDAD',
          },
          dotColor: '#8CBDAD',
        };
      case 'em_atendimento':
        return {
          label: 'Em Atendimento',
          style: {
            backgroundColor: 'rgba(255, 193, 7, 0.15)',
            color: '#FFC107',
            borderColor: 'rgba(255, 193, 7, 0.35)',
          },
          dotColor: '#FFC107',
        };
      case 'concluido':
        return {
          label: 'Concluído',
          style: {
            backgroundColor: 'rgba(81, 117, 102, 0.25)',
            color: '#6FCF97',
            borderColor: 'rgba(81, 117, 102, 0.40)',
          },
          dotColor: '#6FCF97',
        };
      case 'cancelado':
        return {
          label: 'Cancelado',
          style: {
            backgroundColor: 'rgba(235, 87, 87, 0.15)',
            color: '#EB5757',
            borderColor: 'rgba(235, 87, 87, 0.35)',
          },
          dotColor: '#EB5757',
        };
      default:
        return {
          label: status,
          style: {
            backgroundColor: 'rgba(140, 189, 173, 0.15)',
            color: '#8CBDAD',
            borderColor: 'rgba(140, 189, 173, 0.30)',
          },
          dotColor: '#8CBDAD',
        };
    }
  };

  const config = getConfig();

  return (
    <span
      style={config.style}
      className={`inline-flex items-center gap-1.5 font-oswald font-semibold uppercase tracking-[0.08em] rounded-full border ${
        size === 'sm' ? 'text-[10px] px-2.5 py-0.5' : 'text-xs px-3 py-1'
      }`}
    >
      <span
        style={{ backgroundColor: config.dotColor }}
        className={`w-1.5 h-1.5 rounded-full ${status === 'em_atendimento' ? 'animate-pulse' : ''}`}
      />
      {config.label}
    </span>
  );
};
