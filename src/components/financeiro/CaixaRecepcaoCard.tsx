import React, { useState, useEffect } from 'react';
import { DollarSign, QrCode, Banknote, CreditCard, ArrowUpRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Pagamento, Agendamento } from '../../types';
import { api } from '../../services/api';

interface Props {
  selectedDate: string;
  agendamentos: Agendamento[];
  onOpenPagamentoModal: (ag: Agendamento) => void;
}

export const CaixaRecepcaoCard: React.FC<Props> = ({
  selectedDate,
  agendamentos,
  onOpenPagamentoModal,
}) => {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPagamentos = async () => {
    try {
      setLoading(true);
      const list = await api.getPagamentos();
      setPagamentos(list);
    } catch (err) {
      console.error('Erro ao carregar pagamentos do caixa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPagamentos();

    const handleSync = () => {
      loadPagamentos();
    };

    window.addEventListener('hype_pagamentos_changed', handleSync);
    window.addEventListener('hype_agendamentos_changed', handleSync);

    return () => {
      window.removeEventListener('hype_pagamentos_changed', handleSync);
      window.removeEventListener('hype_agendamentos_changed', handleSync);
    };
  }, []);

  // Filtra pagamentos do dia selecionado
  const pagamentosDoDia = pagamentos.filter((p) => p.data === selectedDate);

  // Cálculos de métricas do dia
  const totalBrutoHoje = pagamentosDoDia.reduce((sum, p) => sum + p.valor_bruto, 0);
  const totalPixHoje = pagamentosDoDia
    .filter((p) => p.forma_pagamento === 'pix')
    .reduce((sum, p) => sum + p.valor_bruto, 0);
  const totalDinheiroHoje = pagamentosDoDia
    .filter((p) => p.forma_pagamento === 'dinheiro')
    .reduce((sum, p) => sum + p.valor_bruto, 0);
  const totalCartaoHoje = pagamentosDoDia
    .filter((p) => p.forma_pagamento === 'debito' || p.forma_pagamento === 'credito' || p.forma_pagamento === 'credito_parcelado')
    .reduce((sum, p) => sum + p.valor_bruto, 0);

  const totalComissoesHoje = pagamentosDoDia.reduce((sum, p) => sum + p.comissao_valor, 0);
  const liquidoEstudioHoje = pagamentosDoDia.reduce((sum, p) => sum + p.valor_liquido_estudio, 0);

  // Agendamentos concluídos do dia
  const agendamentosConcluidosHoje = agendamentos.filter(
    (a) => a.data === selectedDate && a.status === 'concluido'
  );

  const agendamentosPendentesDePagamento = agendamentosConcluidosHoje.filter(
    (a) => !pagamentosDoDia.some((p) => p.agendamento_id === a.id) && !a.pago
  );

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-soft space-y-5">
      {/* Topo: Título & Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-[rgba(140,189,173,0.15)] flex items-center justify-center text-[#517566] dark:text-[#8CBDAD] shrink-0 border border-[rgba(140,189,173,0.25)]">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
                Controle de Caixa do Dia
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(140,189,173,0.12)] text-[#517566] dark:text-[#8CBDAD]">
                {selectedDate.split('-').reverse().join('/')}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-inter">
              Resumo financeiro em tempo real e conciliação de recebimentos da recepção.
            </p>
          </div>
        </div>

        {agendamentosPendentesDePagamento.length > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgba(235,87,87,0.12)] border border-[rgba(235,87,87,0.30)] text-[#EB5757] text-xs font-oswald uppercase font-bold animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            {agendamentosPendentesDePagamento.length} pagamento(s) pendente(s)
          </div>
        )}
      </div>

      {/* Grid com os 4 Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Recebido Bruto */}
        <div className="p-4 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] relative overflow-hidden">
          <div className="text-[11px] font-oswald uppercase tracking-wider font-semibold text-[var(--text-muted)]">
            Total Recebido Hoje (Bruto)
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">
            R$ {totalBrutoHoje.toFixed(2)}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] font-inter mt-1">
            {pagamentosDoDia.length} transação(ões) registradas
          </div>
        </div>

        {/* 2. Formas de Pagamento */}
        <div className="p-4 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex flex-col justify-between">
          <div className="text-[11px] font-oswald uppercase tracking-wider font-semibold text-[var(--text-muted)] mb-1.5">
            Por Forma de Pagamento
          </div>
          <div className="space-y-1 text-xs font-inter">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <QrCode className="w-3 h-3 text-[#27AE60]" /> PIX:
              </span>
              <strong className="font-mono text-[var(--text-primary)]">R$ {totalPixHoje.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <Banknote className="w-3 h-3 text-[#27AE60]" /> Dinheiro:
              </span>
              <strong className="font-mono text-[var(--text-primary)]">R$ {totalDinheiroHoje.toFixed(2)}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-[var(--text-secondary)]">
                <CreditCard className="w-3 h-3 text-[var(--accent)]" /> Cartão:
              </span>
              <strong className="font-mono text-[var(--text-primary)]">R$ {totalCartaoHoje.toFixed(2)}</strong>
            </div>
          </div>
        </div>

        {/* 3. Comissões do Dia */}
        <div className="p-4 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] relative overflow-hidden">
          <div className="text-[11px] font-oswald uppercase tracking-wider font-semibold text-[#E5A93C]">
            Total Comissões do Dia
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#E5A93C] mt-1">
            R$ {totalComissoesHoje.toFixed(2)}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] font-inter mt-1">
            Soma de repasses devidos aos colaboradores
          </div>
        </div>

        {/* 4. Líquido do Estúdio Hoje */}
        <div className="p-4 rounded-xl bg-[rgba(39,174,96,0.08)] border border-[rgba(39,174,96,0.30)] relative overflow-hidden">
          <div className="text-[11px] font-oswald uppercase tracking-wider font-bold text-[#27AE60]">
            Líquido do Estúdio Hoje
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#27AE60] mt-1">
            R$ {liquidoEstudioHoje.toFixed(2)}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] font-inter mt-1">
            Após taxas de cartão e comissões da equipe
          </div>
        </div>
      </div>

      {/* Lista de Atendimentos Concluídos Hoje & Botão de Pagamento */}
      {agendamentosConcluidosHoje.length > 0 && (
        <div className="pt-3 border-t border-[var(--border)]">
          <div className="text-xs font-oswald uppercase tracking-wider font-bold text-[var(--text-secondary)] mb-2 flex items-center justify-between">
            <span>Atendimentos Concluídos Hoje ({agendamentosConcluidosHoje.length})</span>
            <span className="text-[10px] font-inter font-normal text-[var(--text-muted)]">
              Clique em "Registrar Pagamento" para lançar no caixa
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {agendamentosConcluidosHoje.map((ag) => {
              const pag = pagamentosDoDia.find((p) => p.agendamento_id === ag.id);
              const isPago = !!pag || ag.pago;

              return (
                <div
                  key={ag.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                    isPago
                      ? 'bg-[var(--bg-surface-alt)]/60 border-[var(--border)]'
                      : 'bg-[rgba(235,87,87,0.05)] border-[rgba(235,87,87,0.30)]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate font-inter">
                        {ag.cliente?.nome || 'Cliente'}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] shrink-0">
                        {ag.hora_inicio}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate font-inter">
                      {ag.servico?.nome} • {ag.colaborador?.nome}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isPago ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[rgba(39,174,96,0.12)] text-[#27AE60] text-[11px] font-oswald uppercase font-bold border border-[rgba(39,174,96,0.25)]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Pago R$ {pag?.valor_bruto ? pag.valor_bruto.toFixed(2) : ag.servico?.preco.toFixed(2)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenPagamentoModal(ag)}
                        className="px-3 py-1.5 rounded-lg bg-[#27AE60] hover:bg-[#219653] text-white text-xs font-oswald uppercase tracking-wider font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Registrar Pagamento
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
