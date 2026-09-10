import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, Clock, Filter, Calendar, Scissors, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { Pagamento, Usuario } from '../../types';
import { api } from '../../services/api';

interface Props {
  colaborador: Usuario;
}

export const CollaboratorEarnings: React.FC<Props> = ({ colaborador }) => {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'mes_atual' | 'mes_anterior' | '30_dias' | 'todos'>('mes_atual');

  const loadData = async () => {
    try {
      setLoading(true);
      const list = await api.getPagamentos(colaborador.id);
      setPagamentos(list);
    } catch (err) {
      console.error('Erro ao carregar ganhos do colaborador:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('hype_pagamentos_changed', handleSync);
    window.addEventListener('hype_repasses_changed', handleSync);

    return () => {
      window.removeEventListener('hype_pagamentos_changed', handleSync);
      window.removeEventListener('hype_repasses_changed', handleSync);
    };
  }, [colaborador.id]);

  // Filtragem por Período
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  const filteredPagamentos = pagamentos.filter((p) => {
    if (!p.data) return true;
    const pDate = new Date(p.data + 'T00:00:00');

    if (filtroPeriodo === 'mes_atual') {
      return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
    }
    if (filtroPeriodo === 'mes_anterior') {
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return pDate.getFullYear() === prevYear && pDate.getMonth() === prevMonth;
    }
    if (filtroPeriodo === '30_dias') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return pDate >= thirtyDaysAgo;
    }
    return true; // 'todos'
  });

  // Métricas do Mês Atual
  const pagamentosMesAtual = pagamentos.filter((p) => {
    if (!p.data) return false;
    const pDate = new Date(p.data + 'T00:00:00');
    return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
  });

  const totalComissaoMesAtual = pagamentosMesAtual.reduce((sum, p) => sum + p.comissao_valor, 0);

  // Totais do período selecionado
  const totalComissoesPeriodo = filteredPagamentos.reduce((sum, p) => sum + p.comissao_valor, 0);
  const totalJaRepassado = filteredPagamentos
    .filter((p) => p.status_repasse === 'pago')
    .reduce((sum, p) => sum + p.comissao_valor, 0);
  const totalAReceber = filteredPagamentos
    .filter((p) => p.status_repasse !== 'pago')
    .reduce((sum, p) => sum + p.comissao_valor, 0);

  if (loading) {
    return (
      <div className="py-12 text-center text-[var(--text-muted)] text-xs font-inter">
        Carregando demonstrativo de ganhos...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Topo: Resumo do Colaborador & Informações de Repasse */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[rgba(140,189,173,0.12)] border border-[rgba(140,189,173,0.25)] text-[#517566] dark:text-[#8CBDAD] text-xs font-oswald uppercase tracking-wider font-semibold mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            Meus Ganhos & Comissões
          </div>
          <h2 className="font-display uppercase text-2xl sm:text-3xl tracking-wide text-[var(--text-primary)]">
            EXTRATO DE COMISSÕES — {colaborador.nome}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] font-inter mt-1 max-w-lg">
            Acompanhe o valor gerado por seus atendimentos, suas porcentagens por categoria e o status de cada repasse financeiro.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] text-xs">
            <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase block">Tipo de Repasse</span>
            <strong className="font-oswald uppercase text-[var(--accent-dark)] dark:text-[var(--accent)] font-bold">
              {colaborador.tipo_repasse === 'servico'
                ? 'Por Serviço (Imediato)'
                : colaborador.tipo_repasse === 'quinzenal'
                ? 'Quinzenal (Dias 15 e 30)'
                : colaborador.tipo_repasse === 'mensal'
                ? 'Mensal (5º dia útil)'
                : 'Semanal (Segunda-feira)'}
            </strong>
          </div>
        </div>
      </div>

      {/* Cards Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Comissões Mês Atual */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-soft">
          <div className="text-[11px] font-oswald uppercase tracking-wider font-semibold text-[var(--text-muted)]">
            Total Comissões no Mês Atual
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">
            R$ {totalComissaoMesAtual.toFixed(2)}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] font-inter mt-1">
            {pagamentosMesAtual.length} atendimento(s) este mês
          </div>
        </div>

        {/* 2. Total a Receber */}
        <div className="p-5 rounded-2xl bg-[rgba(229,169,60,0.08)] border border-[rgba(229,169,60,0.30)] shadow-soft">
          <div className="text-[11px] font-oswald uppercase tracking-wider font-semibold text-[#E5A93C]">
            Total a Receber (Pendente)
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#E5A93C] mt-1">
            R$ {totalAReceber.toFixed(2)}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] font-inter mt-1">
            Aguardando próximo fechamento
          </div>
        </div>

        {/* 3. Total Já Repassado */}
        <div className="p-5 rounded-2xl bg-[rgba(39,174,96,0.08)] border border-[rgba(39,174,96,0.30)] shadow-soft">
          <div className="text-[11px] font-oswald uppercase tracking-wider font-semibold text-[#27AE60]">
            Total Já Repassado (Pago)
          </div>
          <div className="font-display text-2xl sm:text-3xl font-bold text-[#27AE60] mt-1">
            R$ {totalJaRepassado.toFixed(2)}
          </div>
          <div className="text-[10px] text-[var(--text-secondary)] font-inter mt-1">
            Transferido / quitado pelo estúdio
          </div>
        </div>

        {/* 4. Minhas Porcentagens */}
        <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-soft flex flex-col justify-between">
          <div className="text-[11px] font-oswald uppercase tracking-wider font-semibold text-[var(--text-muted)]">
            Minhas % por Categoria
          </div>
          <div className="grid grid-cols-3 gap-1 text-center mt-2">
            <div className="p-1.5 rounded-lg bg-[var(--bg-surface-alt)]">
              <span className="text-[9px] text-[var(--text-muted)] font-oswald uppercase block">Barber</span>
              <strong className="text-xs font-mono font-bold text-[var(--accent)]">{colaborador.comissao_barbearia ?? 50}%</strong>
            </div>
            <div className="p-1.5 rounded-lg bg-[var(--bg-surface-alt)]">
              <span className="text-[9px] text-[var(--text-muted)] font-oswald uppercase block">Tattoo</span>
              <strong className="text-xs font-mono font-bold text-[var(--accent)]">{colaborador.comissao_tatuagem ?? 60}%</strong>
            </div>
            <div className="p-1.5 rounded-lg bg-[var(--bg-surface-alt)]">
              <span className="text-[9px] text-[var(--text-muted)] font-oswald uppercase block">Pierc</span>
              <strong className="text-xs font-mono font-bold text-[var(--accent)]">{colaborador.comissao_piercing ?? 55}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Detalhada com Filtro de Período */}
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <h3 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
              Detalhamento de Atendimentos & Comissões
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[var(--bg-surface-alt)] text-[var(--text-secondary)]">
              {filteredPagamentos.length} registros
            </span>
          </div>

          {/* Filtro de Período */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setFiltroPeriodo('mes_atual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold transition-all ${
                filtroPeriodo === 'mes_atual'
                  ? 'bg-[#8CBDAD] text-[#0B0E11] font-bold shadow-sm'
                  : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Mês Atual
            </button>
            <button
              type="button"
              onClick={() => setFiltroPeriodo('mes_anterior')}
              className={`px-3 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold transition-all ${
                filtroPeriodo === 'mes_anterior'
                  ? 'bg-[#8CBDAD] text-[#0B0E11] font-bold shadow-sm'
                  : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Mês Anterior
            </button>
            <button
              type="button"
              onClick={() => setFiltroPeriodo('30_dias')}
              className={`px-3 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold transition-all ${
                filtroPeriodo === '30_dias'
                  ? 'bg-[#8CBDAD] text-[#0B0E11] font-bold shadow-sm'
                  : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Últimos 30 Dias
            </button>
            <button
              type="button"
              onClick={() => setFiltroPeriodo('todos')}
              className={`px-3 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold transition-all ${
                filtroPeriodo === 'todos'
                  ? 'bg-[#8CBDAD] text-[#0B0E11] font-bold shadow-sm'
                  : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Todos
            </button>
          </div>
        </div>

        {/* Tabela */}
        {filteredPagamentos.length === 0 ? (
          <div className="py-12 text-center text-[var(--text-muted)] text-xs font-inter">
            Nenhum atendimento ou comissão registrada para o período selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-inter">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-oswald uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="pb-2.5 font-semibold">Data / Hora</th>
                  <th className="pb-2.5 font-semibold">Cliente</th>
                  <th className="pb-2.5 font-semibold">Serviço</th>
                  <th className="pb-2.5 font-semibold">Categoria</th>
                  <th className="pb-2.5 font-semibold text-right">Valor Serviço</th>
                  <th className="pb-2.5 font-semibold text-center">Sua %</th>
                  <th className="pb-2.5 font-semibold text-right">Sua Comissão</th>
                  <th className="pb-2.5 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {filteredPagamentos.map((p) => {
                  const isPago = p.status_repasse === 'pago';
                  const dataFormatada = p.data ? p.data.split('-').reverse().join('/') : '-';

                  return (
                    <tr key={p.id} className="hover:bg-[var(--bg-surface-alt)]/50 transition-colors">
                      <td className="py-3 font-mono text-[11px] text-[var(--text-secondary)]">
                        {dataFormatada} {p.hora ? `às ${p.hora}` : ''}
                      </td>
                      <td className="py-3 font-semibold text-[var(--text-primary)]">
                        {p.cliente_nome}
                      </td>
                      <td className="py-3 text-[var(--text-secondary)]">
                        {p.servico_nome}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-oswald uppercase font-semibold bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border border-[var(--border)]">
                          {p.categoria_nome}
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono text-[var(--text-primary)] font-medium">
                        R$ {p.valor_bruto.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[rgba(140,189,173,0.15)] text-[#517566] dark:text-[#8CBDAD]">
                          {p.comissao_pct}%
                        </span>
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-[#27AE60] text-sm">
                        R$ {p.comissao_valor.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        {isPago ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-oswald uppercase font-bold bg-[rgba(39,174,96,0.12)] text-[#27AE60] border border-[rgba(39,174,96,0.30)]">
                            <CheckCircle2 className="w-3 h-3" />
                            Repassado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-oswald uppercase font-bold bg-[rgba(229,169,60,0.12)] text-[#E5A93C] border border-[rgba(229,169,60,0.30)]">
                            <Clock className="w-3 h-3" />
                            A Receber
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé com Totalizadores da Seleção */}
        {filteredPagamentos.length > 0 && (
          <div className="p-3.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-[var(--text-muted)] font-inter">
              Total no período filtrado ({filteredPagamentos.length} atendimentos):
            </span>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase mr-1.5">Já Pago:</span>
                <strong className="font-mono text-[#27AE60]">R$ {totalJaRepassado.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase mr-1.5">A Receber:</span>
                <strong className="font-mono text-[#E5A93C]">R$ {totalAReceber.toFixed(2)}</strong>
              </div>
              <div className="pl-3 border-l border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase mr-1.5">Total Comissão:</span>
                <strong className="font-display text-base text-[var(--text-primary)]">R$ {totalComissoesPeriodo.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
