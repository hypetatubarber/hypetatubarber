import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Banknote, QrCode, Percent, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Agendamento, FormaPagamento, Usuario } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  agendamento: Agendamento | null;
  onSuccess?: () => void;
}

export const RegistrarPagamentoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  agendamento,
  onSuccess,
}) => {
  const { showToast } = useToast();

  const [valorCobrado, setValorCobrado] = useState<string>('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [parcelas, setParcelas] = useState<number>(1);
  const [taxaMaquininhaPct, setTaxaMaquininhaPct] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [colaborador, setColaborador] = useState<Usuario | null>(null);

  // Inicializa dados quando o modal abre com o agendamento
  useEffect(() => {
    if (agendamento && isOpen) {
      const precoOriginal = agendamento.servico?.preco ?? 0;
      setValorCobrado(precoOriginal > 0 ? String(precoOriginal) : '');
      setFormaPagamento('pix');
      setParcelas(1);
      setTaxaMaquininhaPct(0);
      setObservacoes('');

      // Busca dados completos do colaborador para identificar comissões por categoria
      api.getUsuarios().then(users => {
        const found = users.find(u => u.id === agendamento.colaborador_id);
        if (found) setColaborador(found);
      });
    }
  }, [agendamento, isOpen]);

  if (!isOpen || !agendamento) return null;

  // Ajusta taxa de maquininha padrão ao mudar a forma de pagamento
  const handleFormaChange = (forma: FormaPagamento, numParcelas: number = 1) => {
    setFormaPagamento(forma);
    setParcelas(numParcelas);

    if (forma === 'pix' || forma === 'dinheiro') {
      setTaxaMaquininhaPct(0);
    } else if (forma === 'debito') {
      setTaxaMaquininhaPct(1.9);
    } else if (forma === 'credito') {
      setTaxaMaquininhaPct(3.5);
    } else if (forma === 'credito_parcelado') {
      if (numParcelas <= 3) setTaxaMaquininhaPct(5.5);
      else if (numParcelas <= 6) setTaxaMaquininhaPct(7.5);
      else setTaxaMaquininhaPct(10.5);
    }
  };

  const handleParcelasChange = (num: number) => {
    setParcelas(num);
    if (num <= 3) setTaxaMaquininhaPct(5.5);
    else if (num <= 6) setTaxaMaquininhaPct(7.5);
    else setTaxaMaquininhaPct(10.5);
  };

  // Identificação da porcentagem de comissão do colaborador para a categoria do serviço
  const categoriaNome = agendamento.servico?.categoria?.nome || 'Geral';
  const catLower = categoriaNome.toLowerCase();
  let comissaoPct = 50;
  if (catLower.includes('tatu') || catLower.includes('tattoo')) {
    comissaoPct = colaborador?.comissao_tatuagem ?? (colaborador?.comissao_porcentagem || 60);
  } else if (catLower.includes('barb') || catLower.includes('corte')) {
    comissaoPct = colaborador?.comissao_barbearia ?? (colaborador?.comissao_porcentagem || 50);
  } else if (catLower.includes('pierc')) {
    comissaoPct = colaborador?.comissao_piercing ?? (colaborador?.comissao_porcentagem || 55);
  } else {
    comissaoPct = colaborador?.comissao_porcentagem || 50;
  }

  // Cálculos Automáticos
  const bruto = typeof valorCobrado === 'number'
    ? valorCobrado
    : parseFloat(String(valorCobrado).replace(',', '.')) || 0;
  const taxaPct = (formaPagamento === 'credito' || formaPagamento === 'credito_parcelado' || formaPagamento === 'debito') 
    ? Number(taxaMaquininhaPct) || 0 
    : 0;
  const taxaValor = Number(((bruto * taxaPct) / 100).toFixed(2));
  const liquidoTransacao = Number((bruto - taxaValor).toFixed(2));
  const comissaoValor = Number(((bruto * comissaoPct) / 100).toFixed(2));
  const liquidoEstudio = Number((liquidoTransacao - comissaoValor).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bruto || bruto <= 0 || isNaN(bruto)) {
      showToast('Informe um valor cobrado válido maior que zero.', 'warning');
      return;
    }

    try {
      setLoading(true);
      await api.registrarPagamento({
        agendamento_id: agendamento.id,
        cliente_id: agendamento.cliente_id,
        cliente_nome: agendamento.cliente?.nome || 'Cliente',
        colaborador_id: agendamento.colaborador_id,
        colaborador_nome: agendamento.colaborador?.nome || colaborador?.nome || 'Profissional',
        servico_id: agendamento.servico_id,
        servico_nome: agendamento.servico?.nome || 'Serviço',
        categoria_nome: categoriaNome,
        valor_bruto: bruto,
        forma_pagamento: formaPagamento,
        parcelas: formaPagamento === 'credito_parcelado' ? parcelas : 1,
        taxa_maquininha_pct: taxaPct,
        observacoes: observacoes.trim() || undefined,
      });

      showToast(`Pagamento de R$ ${bruto.toFixed(2)} registrado com sucesso!`, 'success');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar pagamento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Cabeçalho */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-surface-alt)]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[rgba(39,174,96,0.15)] flex items-center justify-center text-[#27AE60] shrink-0 border border-[rgba(39,174,96,0.3)]">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display uppercase text-lg sm:text-xl tracking-wide text-[var(--text-primary)]">
                Registrar Pagamento
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-inter">
                Atendimento Concluído • Hype Tatu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--border)]/50 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo do Atendimento */}
        <div className="p-4 bg-[rgba(140,189,173,0.06)] border-b border-[var(--border)] flex flex-wrap items-center justify-between gap-3 text-xs font-inter">
          <div>
            <span className="text-[var(--text-muted)] font-oswald uppercase text-[10px] block">Cliente</span>
            <strong className="text-[var(--text-primary)] text-sm">{agendamento.cliente?.nome || 'Cliente'}</strong>
          </div>
          <div>
            <span className="text-[var(--text-muted)] font-oswald uppercase text-[10px] block">Profissional</span>
            <strong className="text-[var(--text-primary)]">{agendamento.colaborador?.nome || colaborador?.nome}</strong>
          </div>
          <div>
            <span className="text-[var(--text-muted)] font-oswald uppercase text-[10px] block">Serviço</span>
            <span className="inline-flex items-center gap-1 font-semibold text-[var(--accent-dark)] dark:text-[var(--accent)]">
              {agendamento.servico?.nome} ({categoriaNome})
            </span>
          </div>
          <div>
            <span className="text-[var(--text-muted)] font-oswald uppercase text-[10px] block">Horário</span>
            <span className="text-[var(--text-secondary)] font-mono">{agendamento.hora_inicio} às {agendamento.hora_fim}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">
          {/* Valor Cobrado */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold">
                Valor Cobrado (R$) *
              </label>
              {agendamento.servico && (
                <button
                  type="button"
                  onClick={() => setValorCobrado(String(agendamento.servico?.preco || '0'))}
                  className="text-[10px] text-[var(--text-secondary)] hover:text-[var(--accent)] font-mono underline"
                >
                  Usar valor tabela (R$ {agendamento.servico.preco.toFixed(2)})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-display text-lg text-[var(--text-muted)]">R$</span>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={valorCobrado}
                onChange={(e) => setValorCobrado(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] font-display text-2xl font-bold focus:border-[var(--accent)] outline-none"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div>
            <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-2">
              Forma de Pagamento *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* 1. PIX */}
              <button
                type="button"
                onClick={() => handleFormaChange('pix')}
                className={`p-2.5 rounded-xl border text-xs font-oswald uppercase tracking-wider font-bold flex flex-col items-center justify-center gap-1 transition-all text-center ${
                  formaPagamento === 'pix'
                    ? 'bg-[#27AE60]/20 border-[#27AE60] text-[#27AE60] shadow-sm ring-1 ring-[#27AE60]'
                    : 'bg-[var(--bg-surface-alt)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>PIX</span>
                <span className="text-[10px] opacity-80 font-normal">0% taxa</span>
              </button>

              {/* 2. CRÉDITO À VISTA */}
              <button
                type="button"
                onClick={() => handleFormaChange('credito', 1)}
                className={`p-2.5 rounded-xl border text-xs font-oswald uppercase tracking-wider font-bold flex flex-col items-center justify-center gap-1 transition-all text-center ${
                  formaPagamento === 'credito'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-500 shadow-sm ring-1 ring-blue-500'
                    : 'bg-[var(--bg-surface-alt)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Crédito 1x</span>
                <span className="text-[10px] opacity-80 font-normal">À vista</span>
              </button>

              {/* 3. CRÉDITO PARCELADO */}
              <button
                type="button"
                onClick={() => handleFormaChange('credito_parcelado', parcelas > 1 ? parcelas : 2)}
                className={`p-2.5 rounded-xl border text-xs font-oswald uppercase tracking-wider font-bold flex flex-col items-center justify-center gap-1 transition-all text-center ${
                  formaPagamento === 'credito_parcelado'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-sm ring-1 ring-purple-500'
                    : 'bg-[var(--bg-surface-alt)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Parcelado</span>
                <span className="text-[10px] opacity-80 font-normal">2x até 12x</span>
              </button>

              {/* 4. DÉBITO */}
              <button
                type="button"
                onClick={() => handleFormaChange('debito')}
                className={`p-2.5 rounded-xl border text-xs font-oswald uppercase tracking-wider font-bold flex flex-col items-center justify-center gap-1 transition-all text-center ${
                  formaPagamento === 'debito'
                    ? 'bg-teal-500/20 border-teal-500 text-teal-400 shadow-sm ring-1 ring-teal-500'
                    : 'bg-[var(--bg-surface-alt)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Débito</span>
                <span className="text-[10px] opacity-80 font-normal">1.9% taxa</span>
              </button>

              {/* 5. DINHEIRO */}
              <button
                type="button"
                onClick={() => handleFormaChange('dinheiro')}
                className={`p-2.5 rounded-xl border text-xs font-oswald uppercase tracking-wider font-bold flex flex-col items-center justify-center gap-1 transition-all text-center ${
                  formaPagamento === 'dinheiro'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-sm ring-1 ring-amber-500'
                    : 'bg-[var(--bg-surface-alt)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span>Dinheiro</span>
                <span className="text-[10px] opacity-80 font-normal">Espécie</span>
              </button>
            </div>
          </div>

          {/* Detalhamento Visual da Forma Selecionada */}
          {formaPagamento === 'credito_parcelado' && (
            <div className="p-4 rounded-xl bg-[var(--bg-surface-alt)] border border-purple-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-oswald uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Parcelamento no Cartão (2x a 12x)
                </span>
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                  {parcelas}x de R$ {(bruto / parcelas).toFixed(2)}
                </span>
              </div>

              {/* Botões Rápidos de Parcelas */}
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {[2, 3, 4, 5, 6, 10, 12].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => handleParcelasChange(n)}
                    className={`py-2 px-1 rounded-lg text-xs font-oswald uppercase font-bold transition-all text-center border ${
                      parcelas === n
                        ? 'bg-purple-600 text-white border-purple-400 shadow-sm'
                        : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-purple-400 hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <div>{n}x</div>
                    <div className="text-[9px] font-mono opacity-80">R$ {(bruto / n).toFixed(0)}</div>
                  </button>
                ))}
              </div>

              {/* Seletor dropdown completo + taxa da maquininha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-[11px] font-oswald uppercase tracking-wider text-[var(--text-secondary)] font-semibold block mb-1">
                    Número de Parcelas
                  </label>
                  <select
                    value={parcelas}
                    onChange={(e) => handleParcelasChange(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-oswald uppercase font-semibold outline-none focus:border-purple-500"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>
                        {n}x de R$ {(bruto / n).toFixed(2)} (Total: R$ {bruto.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-oswald uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                      Taxa da Maquininha ({parcelas}x)
                    </label>
                    <span className="text-[10px] text-[#EB5757] font-mono font-bold">
                      - R$ {taxaValor.toFixed(2)}
                    </span>
                  </div>
                  <div className="relative">
                    <Percent className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      value={taxaMaquininhaPct}
                      onChange={(e) => setTaxaMaquininhaPct(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono font-bold outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {formaPagamento === 'credito' && (
            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-alt)] border border-blue-500/30 space-y-2 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-oswald uppercase tracking-wider text-blue-400 font-bold flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Crédito à Vista (1x)
                </span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  R$ {bruto.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-xs pt-1">
                <label className="text-[11px] font-oswald uppercase tracking-wider text-[var(--text-secondary)] font-semibold">
                  Taxa da Maquininha (%):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#EB5757] font-mono font-bold">
                    = - R$ {taxaValor.toFixed(2)}
                  </span>
                  <div className="relative w-24">
                    <Percent className="w-3 h-3 text-[var(--text-muted)] absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      value={taxaMaquininhaPct}
                      onChange={(e) => setTaxaMaquininhaPct(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs pl-6 pr-2 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono font-bold outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {formaPagamento === 'debito' && (
            <div className="p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-teal-500/30 flex items-center justify-between text-xs animate-fadeIn">
              <span className="font-oswald uppercase tracking-wider text-teal-400 font-bold flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Cartão de Débito
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--text-secondary)] font-oswald uppercase">Taxa:</span>
                <span className="text-xs font-mono font-bold text-[#EB5757]">
                  {taxaMaquininhaPct}% (- R$ {taxaValor.toFixed(2)})
                </span>
              </div>
            </div>
          )}

          {formaPagamento === 'pix' && (
            <div className="p-3 rounded-xl bg-[#27AE60]/10 border border-[#27AE60]/30 flex items-center justify-between text-xs animate-fadeIn">
              <span className="font-oswald uppercase tracking-wider text-[#27AE60] font-bold flex items-center gap-1.5">
                <QrCode className="w-4 h-4" /> PIX Instantâneo
              </span>
              <span className="text-xs font-mono font-bold text-[#27AE60]">
                0% de taxa • Creditado integralmente
              </span>
            </div>
          )}

          {formaPagamento === 'dinheiro' && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs animate-fadeIn">
              <span className="font-oswald uppercase tracking-wider text-amber-500 font-bold flex items-center gap-1.5">
                <Banknote className="w-4 h-4" /> Dinheiro em Espécie
              </span>
              <span className="text-xs font-mono font-bold text-amber-500">
                0% de taxa • Lançamento no Caixa Físico
              </span>
            </div>
          )}

          {/* Demonstrativo em Tempo Real de Cálculo Automático */}
          <div className="rounded-xl border border-[rgba(140,189,173,0.30)] bg-[rgba(140,189,173,0.06)] p-4 space-y-2">
            <div className="text-[11px] font-oswald uppercase tracking-wider font-bold text-[#517566] dark:text-[#8CBDAD] flex items-center justify-between">
              <span>Cálculo Automático & Divisão</span>
              <span className="font-mono text-[10px]">Comissão: {comissaoPct}% ({categoriaNome})</span>
            </div>

            <div className="space-y-1.5 text-xs font-inter">
              <div className="flex items-center justify-between text-[var(--text-secondary)]">
                <span>Valor Bruto Cobrado:</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">R$ {bruto.toFixed(2)}</span>
              </div>

              {taxaValor > 0 && (
                <div className="flex items-center justify-between text-[#EB5757]">
                  <span>(-) Taxa da Maquininha ({taxaPct}%):</span>
                  <span className="font-mono font-semibold">- R$ {taxaValor.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[var(--text-secondary)] text-[11px] pt-1 border-t border-[var(--border)]/50">
                <span>Líquido da Transação:</span>
                <span className="font-mono font-semibold">R$ {liquidoTransacao.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-[#E5A93C] pt-1">
                <span>(-) Comissão de {agendamento.colaborador?.nome?.split(' ')[0] || 'Profissional'} ({comissaoPct}%):</span>
                <span className="font-mono font-bold">- R$ {comissaoValor.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[rgba(140,189,173,0.30)]">
                <span className="font-oswald uppercase tracking-wider font-bold text-sm text-[var(--text-primary)]">
                  (=) Faturamento Líquido do Estúdio:
                </span>
                <span className="font-display text-xl font-bold text-[#27AE60]">
                  R$ {liquidoEstudio.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
              Observações do Pagamento
            </label>
            <input
              type="text"
              placeholder="Ex: Cliente dividiu no PIX e cartão, ou gorjeta opcional..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] font-inter"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || bruto <= 0}
              className="px-5 py-2.5 bg-[#27AE60] hover:bg-[#219653] text-white text-xs font-oswald uppercase tracking-wider font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {loading
                ? 'Processando...'
                : formaPagamento === 'credito_parcelado'
                ? `Confirmar Pagamento (${parcelas}x de R$ ${(bruto / parcelas).toFixed(2)})`
                : `Confirmar Pagamento (R$ ${bruto.toFixed(2)})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
