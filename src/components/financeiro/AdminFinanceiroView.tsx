import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Percent,
  Download,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Calendar,
  Filter,
  Users,
  Building2,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
  PieChart,
  Layers,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { Pagamento, CustoFixo, RepasseComissao, Usuario, CategoriaServico, FormaPagamento } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

type SubTab = 'visao_geral' | 'faturamento_detalhado' | 'comissoes' | 'custos_fixos' | 'resultado' | 'colaboradores';

export const AdminFinanceiroView: React.FC = () => {
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('visao_geral');
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [custosFixos, setCustosFixos] = useState<CustoFixo[]>([]);
  const [repasses, setRepasses] = useState<RepasseComissao[]>([]);
  const [colaboradores, setColaboradores] = useState<Usuario[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros para Faturamento Detalhado
  const [filtroPeriodo, setFiltroPeriodo] = useState<'mes_atual' | 'mes_anterior' | 'todos' | 'personalizado'>('mes_atual');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [filtroColaborador, setFiltroColaborador] = useState('all');
  const [filtroCategoria, setFiltroCategoria] = useState('all');
  const [filtroFormaPagamento, setFiltroFormaPagamento] = useState('all');

  // Modal Novo Custo Fixo
  const [isCustoModalOpen, setIsCustoModalOpen] = useState(false);
  const [custoNome, setCustoNome] = useState('');
  const [custoValor, setCustoValor] = useState<number>(0);
  const [custoDia, setCustoDia] = useState<number>(10);
  const [custoCategoria, setCustoCategoria] = useState('Geral');

  // Modal Marcar Comissão como Paga
  const [isRepasseModalOpen, setIsRepasseModalOpen] = useState(false);
  const [repasseColab, setRepasseColab] = useState<Usuario | null>(null);
  const [repasseValor, setRepasseValor] = useState<number>(0);
  const [repassePagamentosIds, setRepassePagamentosIds] = useState<string[]>([]);
  const [repasseObs, setRepasseObs] = useState('');

  // Ordenação da Tabela Comparativa por Colaborador
  const [sortField, setSortField] = useState<'nome' | 'servicos' | 'faturamento' | 'comissao' | 'ticket'>('faturamento');
  const [sortAsc, setSortAsc] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [pList, cfList, repList, colabList, catList] = await Promise.all([
        api.getPagamentos(),
        api.getCustosFixos(),
        api.getRepassesComissao(),
        api.getColaboradores(),
        api.getCategorias(),
      ]);
      setPagamentos(pList);
      setCustosFixos(cfList);
      setRepasses(repList);
      setColaboradores(colabList);
      setCategorias(catList);
    } catch (err) {
      console.error('Erro ao carregar dados do módulo financeiro:', err);
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
    window.addEventListener('hype_custos_fixos_changed', handleSync);
    window.addEventListener('hype_repasses_changed', handleSync);

    return () => {
      window.removeEventListener('hype_pagamentos_changed', handleSync);
      window.removeEventListener('hype_custos_fixos_changed', handleSync);
      window.removeEventListener('hype_repasses_changed', handleSync);
    };
  }, []);

  // Datas e Períodos
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const mesAtualStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const mesAnteriorStr = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}`;

  // Pagamentos do Mês Atual
  const pagamentosMesAtual = useMemo(() => {
    return pagamentos.filter((p) => {
      if (!p.data) return false;
      const [y, m] = p.data.split('-');
      return Number(y) === currentYear && Number(m) === currentMonth + 1;
    });
  }, [pagamentos, currentYear, currentMonth]);

  // Pagamentos do Mês Anterior
  const pagamentosMesAnterior = useMemo(() => {
    return pagamentos.filter((p) => {
      if (!p.data) return false;
      const [y, m] = p.data.split('-');
      return Number(y) === prevYear && Number(m) === prevMonth + 1;
    });
  }, [pagamentos, prevYear, prevMonth]);

  // KPIs Mês Atual
  const faturamentoBrutoMesAtual = pagamentosMesAtual.reduce((sum, p) => sum + p.valor_bruto, 0);
  const taxasMaquininhaMesAtual = pagamentosMesAtual.reduce((sum, p) => sum + p.taxa_maquininha_valor, 0);
  const comissoesMesAtual = pagamentosMesAtual.reduce((sum, p) => sum + p.comissao_valor, 0);
  const comissoesPagasMesAtual = pagamentosMesAtual.filter(p => p.status_repasse === 'pago').reduce((sum, p) => sum + p.comissao_valor, 0);
  const comissoesAPagarMesAtual = pagamentosMesAtual.filter(p => p.status_repasse !== 'pago').reduce((sum, p) => sum + p.comissao_valor, 0);
  const faturamentoLiquidoEstudioMesAtual = pagamentosMesAtual.reduce((sum, p) => sum + p.valor_liquido_estudio, 0);
  const ticketMedioMesAtual = pagamentosMesAtual.length > 0 ? faturamentoBrutoMesAtual / pagamentosMesAtual.length : 0;

  // KPIs Mês Anterior
  const faturamentoBrutoMesAnterior = pagamentosMesAnterior.reduce((sum, p) => sum + p.valor_bruto, 0);
  const faturamentoLiquidoMesAnterior = pagamentosMesAnterior.reduce((sum, p) => sum + p.valor_liquido_estudio, 0);
  const variacaoBruto = faturamentoBrutoMesAnterior > 0
    ? ((faturamentoBrutoMesAtual - faturamentoBrutoMesAnterior) / faturamentoBrutoMesAnterior) * 100
    : 100;

  // Filtragem de Pagamentos na aba Faturamento Detalhado
  const pagamentosFiltrados = useMemo(() => {
    return pagamentos.filter((p) => {
      if (!p.data) return true;

      // Filtro de Data
      if (filtroPeriodo === 'mes_atual') {
        const [y, m] = p.data.split('-');
        if (Number(y) !== currentYear || Number(m) !== currentMonth + 1) return false;
      } else if (filtroPeriodo === 'mes_anterior') {
        const [y, m] = p.data.split('-');
        if (Number(y) !== prevYear || Number(m) !== prevMonth + 1) return false;
      } else if (filtroPeriodo === 'personalizado') {
        if (dataInicio && p.data < dataInicio) return false;
        if (dataFim && p.data > dataFim) return false;
      }

      // Filtro de Colaborador
      if (filtroColaborador !== 'all' && p.colaborador_id !== filtroColaborador) {
        return false;
      }

      // Filtro de Categoria
      if (filtroCategoria !== 'all' && p.categoria_nome !== filtroCategoria) {
        return false;
      }

      // Filtro de Forma de Pagamento
      if (filtroFormaPagamento !== 'all') {
        if (filtroFormaPagamento === 'cartao') {
          if (p.forma_pagamento !== 'debito' && p.forma_pagamento !== 'credito' && p.forma_pagamento !== 'credito_parcelado') return false;
        } else if (p.forma_pagamento !== filtroFormaPagamento) {
          return false;
        }
      }

      return true;
    });
  }, [pagamentos, filtroPeriodo, dataInicio, dataFim, filtroColaborador, filtroCategoria, filtroFormaPagamento, currentYear, currentMonth, prevYear, prevMonth]);

  // Totais da Seleção Filtrada
  const totalFiltradoBruto = pagamentosFiltrados.reduce((sum, p) => sum + p.valor_bruto, 0);
  const totalFiltradoTaxas = pagamentosFiltrados.reduce((sum, p) => sum + p.taxa_maquininha_valor, 0);
  const totalFiltradoComissoes = pagamentosFiltrados.reduce((sum, p) => sum + p.comissao_valor, 0);
  const totalFiltradoLiquido = pagamentosFiltrados.reduce((sum, p) => sum + p.valor_liquido_estudio, 0);

  // Total de Custos Fixos do Mês
  const totalCustosFixosMes = custosFixos.reduce((sum, c) => sum + c.valor_mensal, 0);
  const custosFixosPagos = custosFixos.filter(c => c.status_mes?.[mesAtualStr] === 'pago').reduce((sum, c) => sum + c.valor_mensal, 0);
  const custosFixosPendentes = totalCustosFixosMes - custosFixosPagos;

  // DRE - Resultado Líquido do Período
  const outrosCustosVariaveis = 450.00; // Insumos descartáveis, luvas, tintas e lâminas estimadas
  const lucroLiquidoPeriodo = faturamentoLiquidoEstudioMesAtual - totalCustosFixosMes - outrosCustosVariaveis;
  const isLucroPositivo = lucroLiquidoPeriodo >= 0;

  // Exportar para CSV
  const handleExportCSV = () => {
    if (pagamentosFiltrados.length === 0) {
      showToast('Não há registros para exportar.', 'warning');
      return;
    }

    const headers = ['Data', 'Hora', 'Cliente', 'Colaborador', 'Serviço', 'Categoria', 'Valor Bruto (R$)', 'Forma Pagamento', 'Parcelas', 'Taxa Maquininha (R$)', 'Comissão (R$)', 'Líquido Estúdio (R$)', 'Status Repasse'];
    const rows = pagamentosFiltrados.map((p) => [
      p.data,
      p.hora || '',
      `"${p.cliente_nome.replace(/"/g, '""')}"`,
      `"${p.colaborador_nome.replace(/"/g, '""')}"`,
      `"${p.servico_nome.replace(/"/g, '""')}"`,
      p.categoria_nome,
      p.valor_bruto.toFixed(2),
      p.forma_pagamento,
      p.parcelas || 1,
      p.taxa_maquininha_valor.toFixed(2),
      p.comissao_valor.toFixed(2),
      p.valor_liquido_estudio.toFixed(2),
      p.status_repasse,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hype_tatu_faturamento_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Relatório CSV exportado com sucesso!', 'success');
  };

  // Salvar Novo Custo Fixo
  const handleSaveCustoFixo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custoNome.trim() || custoValor <= 0) {
      showToast('Preencha o nome e um valor válido.', 'warning');
      return;
    }

    try {
      await api.saveCustoFixo({
        id: 'cf-' + Date.now(),
        nome: custoNome.trim(),
        valor_mensal: Number(custoValor),
        dia_vencimento: Number(custoDia),
        categoria: custoCategoria,
        status_mes: { [mesAtualStr]: 'pendente' },
        criado_em: new Date().toISOString(),
      });
      showToast('Custo fixo cadastrado com sucesso!', 'success');
      setIsCustoModalOpen(false);
      setCustoNome('');
      setCustoValor(0);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao cadastrar custo fixo.', 'error');
    }
  };

  // Alternar Status do Custo Fixo
  const handleToggleCustoStatus = async (id: string) => {
    try {
      await api.toggleStatusCustoFixo(id, mesAtualStr);
      loadData();
    } catch (err: any) {
      showToast('Erro ao alternar status do custo.', 'error');
    }
  };

  // Excluir Custo Fixo
  const handleDeleteCustoFixo = async (id: string, nome: string) => {
    if (window.confirm(`Deseja realmente excluir o custo fixo "${nome}"?`)) {
      try {
        await api.deleteCustoFixo(id);
        showToast('Custo fixo removido.', 'info');
        loadData();
      } catch (err: any) {
        showToast('Erro ao excluir custo fixo.', 'error');
      }
    }
  };

  // Abrir Modal de Quitação de Repasse
  const handleOpenRepasseModal = (colab: Usuario, pags: Pagamento[]) => {
    const pagsPendentes = pags.filter(p => p.status_repasse !== 'pago');
    const valor = pagsPendentes.reduce((sum, p) => sum + p.comissao_valor, 0);
    setRepasseColab(colab);
    setRepasseValor(valor);
    setRepassePagamentosIds(pagsPendentes.map(p => p.id));
    setRepasseObs(`Fechamento de comissões (${pagsPendentes.length} atendimento(s)) quitado com sucesso.`);
    setIsRepasseModalOpen(true);
  };

  // Confirmar Quitação de Repasse
  const handleConfirmRepasse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repasseColab || repassePagamentosIds.length === 0) {
      showToast('Nenhum atendimento pendente para quitação.', 'warning');
      return;
    }

    try {
      await api.marcarComissaoPaga(
        repasseColab.id,
        repassePagamentosIds,
        repasseValor,
        'Admin Master'
      );
      showToast(`Comissão de R$ ${repasseValor.toFixed(2)} marcada como PAGA para ${repasseColab.nome}!`, 'success');
      setIsRepasseModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar quitação de repasse.', 'error');
    }
  };

  // Dados para o Comparativo por Colaborador
  const comparativoColaboradores = useMemo(() => {
    const list = colaboradores.map((colab) => {
      const colabPags = pagamentosMesAtual.filter((p) => p.colaborador_id === colab.id);
      const servicosQtd = colabPags.length;
      const faturamento = colabPags.reduce((sum, p) => sum + p.valor_bruto, 0);
      const comissao = colabPags.reduce((sum, p) => sum + p.comissao_valor, 0);
      const ticket = servicosQtd > 0 ? faturamento / servicosQtd : 0;
      const categoriaPrincipal = colab.especialidade?.includes('Tatu')
        ? 'Tatuagem'
        : colab.tipo_colaborador === 'rotativo'
        ? 'Tatuagem'
        : 'Barbearia';

      return {
        id: colab.id,
        nome: colab.nome,
        foto: colab.foto,
        tipo: colab.tipo_colaborador || 'fixo',
        categoriaPrincipal,
        servicos: servicosQtd,
        faturamento,
        comissao,
        ticket,
      };
    });

    return list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [colaboradores, pagamentosMesAtual, sortField, sortAsc]);

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-[var(--text-primary)]">
      {/* Sub-Navegação em Abas Elegantes */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[var(--border)]">
        {[
          { id: 'visao_geral', label: '1. Visão Geral', icon: PieChart },
          { id: 'faturamento_detalhado', label: '2. Faturamento Detalhado', icon: FileSpreadsheet },
          { id: 'comissoes', label: '3. Comissões & Repasses', icon: Percent },
          { id: 'custos_fixos', label: '4. Custos Fixos', icon: Building2 },
          { id: 'resultado', label: '5. Resultado (DRE)', icon: TrendingUp },
          { id: 'colaboradores', label: '6. Comparativo Equipe', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as SubTab)}
              className={`px-4 py-2.5 rounded-xl text-xs font-oswald uppercase tracking-wider font-bold flex items-center gap-2 shrink-0 transition-all ${
                isActive
                  ? 'bg-[#8CBDAD] text-[#0B0E11] shadow-md'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* 1. VISÃO GERAL (DASHBOARD FINANCEIRO) */}
      {/* ===================================================================== */}
      {activeSubTab === 'visao_geral' && (
        <div className="space-y-6">
          {/* Cards Principais do Mês Atual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Faturamento Bruto */}
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-soft">
              <div className="text-[11px] font-oswald uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                Faturamento Bruto do Mês
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mt-1">
                R$ {faturamentoBrutoMesAtual.toFixed(2)}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-[#27AE60] font-inter font-semibold">
                <TrendingUp className="w-3 h-3" />
                {variacaoBruto >= 0 ? `+${variacaoBruto.toFixed(1)}%` : `${variacaoBruto.toFixed(1)}%`} vs mês anterior
              </div>
            </div>

            {/* 2. Total Taxas Maquininha */}
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-soft">
              <div className="text-[11px] font-oswald uppercase tracking-wider font-semibold text-[#EB5757]">
                Total Taxas Maquininha
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[#EB5757] mt-1">
                R$ {taxasMaquininhaMesAtual.toFixed(2)}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] font-inter mt-1">
                Retenção média cartões
              </div>
            </div>

            {/* 3. Total Comissões */}
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-soft">
              <div className="text-[11px] font-oswald uppercase tracking-wider font-semibold text-[#E5A93C]">
                Comissões da Equipe
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[#E5A93C] mt-1">
                R$ {comissoesMesAtual.toFixed(2)}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] font-inter mt-1 flex items-center gap-1.5">
                <span className="text-[#27AE60]">R$ {comissoesPagasMesAtual.toFixed(0)} pagas</span> •{' '}
                <span className="text-[#E5A93C]">R$ {comissoesAPagarMesAtual.toFixed(0)} pendentes</span>
              </div>
            </div>

            {/* 4. Faturamento Líquido Estúdio */}
            <div className="p-5 rounded-2xl bg-[rgba(39,174,96,0.08)] border border-[rgba(39,174,96,0.30)] shadow-soft">
              <div className="text-[11px] font-oswald uppercase tracking-wider font-bold text-[#27AE60]">
                Faturamento Líquido Estúdio
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[#27AE60] mt-1">
                R$ {faturamentoLiquidoEstudioMesAtual.toFixed(2)}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] font-inter mt-1">
                Receita líquida retida na casa
              </div>
            </div>

            {/* 5. Ticket Médio */}
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-soft">
              <div className="text-[11px] font-oswald uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                Ticket Médio por Serviço
              </div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-[var(--accent-dark)] dark:text-[var(--accent)] mt-1">
                R$ {ticketMedioMesAtual.toFixed(2)}
              </div>
              <div className="text-[10px] text-[var(--text-secondary)] font-inter mt-1">
                {pagamentosMesAtual.length} atendimentos concluídos
              </div>
            </div>
          </div>

          {/* Gráfico Visual Comparativo Mês Atual vs Mês Anterior */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
                  Comparativo de Faturamento: Mês Atual vs Mês Anterior
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                  Análise comparativa de volume bruto, retenções e faturamento líquido retido no estúdio.
                </p>
              </div>
              <div className="inline-flex items-center gap-3 text-xs font-inter font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#8CBDAD]" />
                  <span>Setembro (Atual)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#72808A]" />
                  <span>Agosto (Anterior)</span>
                </div>
              </div>
            </div>

            {/* Barras de Comparação Visual */}
            <div className="space-y-4">
              {/* Bruto */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-inter">
                  <span className="font-semibold text-[var(--text-secondary)]">Faturamento Bruto</span>
                  <div className="space-x-3 font-mono">
                    <strong className="text-[#8CBDAD]">Atual: R$ {faturamentoBrutoMesAtual.toFixed(2)}</strong>
                    <span className="text-[var(--text-muted)]">| Anterior: R$ {faturamentoBrutoMesAnterior.toFixed(2)}</span>
                  </div>
                </div>
                <div className="h-4 bg-[var(--bg-surface-alt)] rounded-full overflow-hidden flex gap-1 p-0.5">
                  <div
                    style={{ width: `${Math.min(100, (faturamentoBrutoMesAtual / (Math.max(faturamentoBrutoMesAtual, faturamentoBrutoMesAnterior) || 1)) * 100)}%` }}
                    className="h-full bg-[#8CBDAD] rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              {/* Líquido da Casa */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1 font-inter">
                  <span className="font-semibold text-[var(--text-secondary)]">Líquido Estúdio</span>
                  <div className="space-x-3 font-mono">
                    <strong className="text-[#27AE60]">Atual: R$ {faturamentoLiquidoEstudioMesAtual.toFixed(2)}</strong>
                    <span className="text-[var(--text-muted)]">| Anterior: R$ {faturamentoLiquidoMesAnterior.toFixed(2)}</span>
                  </div>
                </div>
                <div className="h-4 bg-[var(--bg-surface-alt)] rounded-full overflow-hidden flex gap-1 p-0.5">
                  <div
                    style={{ width: `${Math.min(100, (faturamentoLiquidoEstudioMesAtual / (Math.max(faturamentoLiquidoEstudioMesAtual, faturamentoLiquidoMesAnterior) || 1)) * 100)}%` }}
                    className="h-full bg-[#27AE60] rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. FATURAMENTO DETALHADO */}
      {/* ===================================================================== */}
      {activeSubTab === 'faturamento_detalhado' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-soft space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div>
              <h3 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
                Faturamento Detalhado por Atendimento
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-inter">
                Histórico analítico de transações com taxas, comissões individuais e valores líquidos.
              </p>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-[#27AE60] hover:bg-[#219653] text-white text-xs font-oswald uppercase tracking-wider font-bold flex items-center gap-2 shadow-sm transition-all shrink-0"
            >
              <Download className="w-4 h-4" />
              Exportar como CSV
            </button>
          </div>

          {/* Barra de Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] text-xs font-inter">
            {/* Período */}
            <div>
              <label className="text-[10px] font-oswald uppercase text-[var(--text-muted)] block mb-1">Período</label>
              <select
                value={filtroPeriodo}
                onChange={(e) => setFiltroPeriodo(e.target.value as any)}
                className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] font-oswald uppercase text-xs outline-none"
              >
                <option value="mes_atual">Mês Atual (Setembro 2026)</option>
                <option value="mes_anterior">Mês Anterior (Agosto 2026)</option>
                <option value="todos">Todos os Registros</option>
                <option value="personalizado">Data Personalizada</option>
              </select>
            </div>

            {/* Colaborador */}
            <div>
              <label className="text-[10px] font-oswald uppercase text-[var(--text-muted)] block mb-1">Colaborador</label>
              <select
                value={filtroColaborador}
                onChange={(e) => setFiltroColaborador(e.target.value)}
                className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs outline-none"
              >
                <option value="all">Todos os Colaboradores</option>
                {colaboradores.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="text-[10px] font-oswald uppercase text-[var(--text-muted)] block mb-1">Categoria</label>
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs outline-none"
              >
                <option value="all">Todas as Categorias</option>
                <option value="Barbearia">Barbearia</option>
                <option value="Tatuagem">Tatuagem</option>
                <option value="Piercing">Piercing</option>
              </select>
            </div>

            {/* Forma Pagamento */}
            <div>
              <label className="text-[10px] font-oswald uppercase text-[var(--text-muted)] block mb-1">Forma de Pagamento</label>
              <select
                value={filtroFormaPagamento}
                onChange={(e) => setFiltroFormaPagamento(e.target.value)}
                className="w-full p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs outline-none"
              >
                <option value="all">Todas as Formas</option>
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão (Débito/Crédito)</option>
              </select>
            </div>
          </div>

          {/* Tabela de Pagamentos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-inter">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-oswald uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="pb-2.5 font-semibold">Data / Hora</th>
                  <th className="pb-2.5 font-semibold">Cliente</th>
                  <th className="pb-2.5 font-semibold">Colaborador</th>
                  <th className="pb-2.5 font-semibold">Serviço</th>
                  <th className="pb-2.5 font-semibold text-right">Valor Bruto</th>
                  <th className="pb-2.5 font-semibold text-center">Forma</th>
                  <th className="pb-2.5 font-semibold text-right">Taxa Maq.</th>
                  <th className="pb-2.5 font-semibold text-right">Comissão</th>
                  <th className="pb-2.5 font-semibold text-right">Líquido Estúdio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {pagamentosFiltrados.map((p) => {
                  const dataFormatada = p.data ? p.data.split('-').reverse().join('/') : '-';
                  return (
                    <tr key={p.id} className="hover:bg-[var(--bg-surface-alt)]/50 transition-colors">
                      <td className="py-2.5 font-mono text-[11px] text-[var(--text-secondary)]">
                        {dataFormatada} {p.hora ? `às ${p.hora}` : ''}
                      </td>
                      <td className="py-2.5 font-semibold text-[var(--text-primary)]">
                        {p.cliente_nome}
                      </td>
                      <td className="py-2.5 text-[var(--text-secondary)]">
                        {p.colaborador_nome}
                      </td>
                      <td className="py-2.5 text-[var(--text-secondary)]">
                        {p.servico_nome}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-[var(--text-primary)]">
                        R$ {p.valor_bruto.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-oswald uppercase font-bold bg-[var(--bg-surface-alt)] border border-[var(--border)]">
                          {p.forma_pagamento === 'pix' ? 'PIX' : p.forma_pagamento === 'dinheiro' ? 'Dinheiro' : p.forma_pagamento === 'debito' ? 'Débito' : `Crédito ${p.parcelas && p.parcelas > 1 ? `${p.parcelas}x` : ''}`}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-[#EB5757]">
                        - R$ {p.taxa_maquininha_valor.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-right font-mono text-[#E5A93C]">
                        - R$ {p.comissao_valor.toFixed(2)} ({p.comissao_pct}%)
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-[#27AE60]">
                        R$ {p.valor_liquido_estudio.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totalizador da Seleção */}
          <div className="p-4 rounded-xl bg-[rgba(140,189,173,0.08)] border border-[rgba(140,189,173,0.30)] flex flex-wrap items-center justify-between gap-4 text-xs font-inter">
            <span className="font-semibold text-[var(--text-primary)]">
              Total no período selecionado ({pagamentosFiltrados.length} atendimentos):
            </span>
            <div className="flex items-center gap-5">
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase mr-1">Bruto:</span>
                <strong className="font-mono text-sm text-[var(--text-primary)]">R$ {totalFiltradoBruto.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase mr-1">Taxas:</span>
                <strong className="font-mono text-sm text-[#EB5757]">- R$ {totalFiltradoTaxas.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase mr-1">Comissões:</span>
                <strong className="font-mono text-sm text-[#E5A93C]">- R$ {totalFiltradoComissoes.toFixed(2)}</strong>
              </div>
              <div className="pl-3 border-l border-[var(--border)]">
                <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase mr-1">Líquido Estúdio:</span>
                <strong className="font-display text-lg text-[#27AE60]">R$ {totalFiltradoLiquido.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. COMISSÕES & REPASSES */}
      {/* ===================================================================== */}
      {activeSubTab === 'comissoes' && (
        <div className="space-y-6">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div>
                <h3 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
                  Comissões por Colaborador & Fechamento de Repasses
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-inter">
                  Gerencie valores acumulados por profissional, tipo de repasse e registre pagamentos quitados.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {colaboradores.map((colab) => {
                const colabPags = pagamentos.filter((p) => p.colaborador_id === colab.id);
                const comissaoTotal = colabPags.reduce((sum, p) => sum + p.comissao_valor, 0);
                const comissaoPaga = colabPags.filter((p) => p.status_repasse === 'pago').reduce((sum, p) => sum + p.comissao_valor, 0);
                const comissaoPendente = colabPags.filter((p) => p.status_repasse !== 'pago').reduce((sum, p) => sum + p.comissao_valor, 0);

                return (
                  <div key={colab.id} className="p-4 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={colab.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                          alt={colab.nome}
                          className="w-10 h-10 rounded-xl object-cover border border-[var(--accent)]"
                        />
                        <div>
                          <strong className="text-xs font-bold text-[var(--text-primary)] block truncate font-inter">
                            {colab.nome}
                          </strong>
                          <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase">
                            {colab.tipo_colaborador === 'rotativo' ? 'Tatuador Rotativo' : 'Fixo'} • {colab.tipo_repasse || 'semanal'}
                          </span>
                        </div>
                      </div>

                      {comissaoPendente > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenRepasseModal(colab, colabPags)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#27AE60] hover:bg-[#219653] text-white text-[11px] font-oswald uppercase font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Marcar como Pago
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] text-xs font-inter">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase block">Total Pago</span>
                        <strong className="font-mono text-[#27AE60]">R$ {comissaoPaga.toFixed(2)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase block">A Pagar (Pendente)</span>
                        <strong className="font-mono text-[#E5A93C]">R$ {comissaoPendente.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Histórico de Repasses Quitados */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-soft space-y-4">
            <h4 className="font-display uppercase tracking-wide text-base text-[var(--text-primary)]">
              Histórico de Repasses Quitados
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-inter">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[10px] font-oswald uppercase tracking-wider text-[var(--text-muted)]">
                    <th className="pb-2.5 font-semibold">Data Quitação</th>
                    <th className="pb-2.5 font-semibold">Colaborador</th>
                    <th className="pb-2.5 font-semibold text-right">Valor Repassado</th>
                    <th className="pb-2.5 font-semibold">Atendimentos</th>
                    <th className="pb-2.5 font-semibold">Autorizado Por</th>
                    <th className="pb-2.5 font-semibold">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/60">
                  {repasses.map((rep) => (
                    <tr key={rep.id} className="hover:bg-[var(--bg-surface-alt)]/50 transition-colors">
                      <td className="py-2.5 font-mono text-[11px] text-[var(--text-secondary)]">
                        {rep.pago_em.split('T')[0].split('-').reverse().join('/')}
                      </td>
                      <td className="py-2.5 font-semibold text-[var(--text-primary)]">
                        {rep.colaborador_nome}
                      </td>
                      <td className="py-2.5 text-right font-mono font-bold text-[#27AE60]">
                        R$ {rep.valor_total.toFixed(2)}
                      </td>
                      <td className="py-2.5 text-[var(--text-secondary)] font-mono">
                        {rep.pagamentos_ids.length} serviço(s)
                      </td>
                      <td className="py-2.5 text-[var(--text-secondary)]">
                        {rep.pago_por || 'Master'}
                      </td>
                      <td className="py-2.5 text-[var(--text-muted)] text-[11px]">
                        {rep.observacoes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. CUSTOS FIXOS */}
      {/* ===================================================================== */}
      {activeSubTab === 'custos_fixos' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-soft space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
            <div>
              <h3 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
                Custos Fixos Mensais do Estúdio
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-inter">
                Cadastre aluguel, energia, internet, contabilidade e controle os pagamentos do mês.
              </p>
            </div>

            <button
              onClick={() => setIsCustoModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#8CBDAD] hover:bg-[#517566] text-[#0B0E11] hover:text-white text-xs font-oswald uppercase tracking-wider font-bold flex items-center gap-2 shadow-sm transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              + Novo Custo Fixo
            </button>
          </div>

          {/* Cards de Resumo de Custos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)]">
              <div className="text-[10px] font-oswald uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                Total Custos Fixos / Mês
              </div>
              <div className="font-display text-2xl font-bold text-[var(--text-primary)] mt-0.5">
                R$ {totalCustosFixosMes.toFixed(2)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[rgba(39,174,96,0.08)] border border-[rgba(39,174,96,0.30)]">
              <div className="text-[10px] font-oswald uppercase tracking-wider font-bold text-[#27AE60]">
                Custos Pagos no Mês
              </div>
              <div className="font-display text-2xl font-bold text-[#27AE60] mt-0.5">
                R$ {custosFixosPagos.toFixed(2)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[rgba(229,169,60,0.08)] border border-[rgba(229,169,60,0.30)]">
              <div className="text-[10px] font-oswald uppercase tracking-wider font-bold text-[#E5A93C]">
                Custos Pendentes
              </div>
              <div className="font-display text-2xl font-bold text-[#E5A93C] mt-0.5">
                R$ {custosFixosPendentes.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Tabela de Custos Fixos */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-inter">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-oswald uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="pb-2.5 font-semibold">Nome do Custo</th>
                  <th className="pb-2.5 font-semibold">Categoria</th>
                  <th className="pb-2.5 font-semibold text-center">Dia Vencimento</th>
                  <th className="pb-2.5 font-semibold text-right">Valor Mensal</th>
                  <th className="pb-2.5 font-semibold text-center">Status Mês ({mesAtualStr})</th>
                  <th className="pb-2.5 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {custosFixos.map((c) => {
                  const isPago = c.status_mes?.[mesAtualStr] === 'pago';
                  return (
                    <tr key={c.id} className="hover:bg-[var(--bg-surface-alt)]/50 transition-colors">
                      <td className="py-3 font-semibold text-[var(--text-primary)]">
                        {c.nome}
                      </td>
                      <td className="py-3 text-[var(--text-secondary)]">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-oswald uppercase font-semibold bg-[var(--bg-surface-alt)] border border-[var(--border)]">
                          {c.categoria || 'Geral'}
                        </span>
                      </td>
                      <td className="py-3 text-center font-mono font-bold text-[var(--text-primary)]">
                        Dia {c.dia_vencimento}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-[var(--text-primary)] text-sm">
                        R$ {c.valor_mensal.toFixed(2)}
                      </td>
                      <td className="py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleCustoStatus(c.id)}
                          className={`px-3 py-1 rounded-full text-[10px] font-oswald uppercase font-bold transition-all ${
                            isPago
                              ? 'bg-[rgba(39,174,96,0.15)] text-[#27AE60] border border-[rgba(39,174,96,0.30)]'
                              : 'bg-[rgba(229,169,60,0.15)] text-[#E5A93C] border border-[rgba(229,169,60,0.30)]'
                          }`}
                        >
                          {isPago ? '✓ Pago' : '⏳ Pendente'}
                        </button>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCustoFixo(c.id, c.nome)}
                          className="p-1 rounded-lg text-[#EB5757] hover:bg-[rgba(235,87,87,0.15)] transition-colors"
                          title="Excluir custo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. RESULTADO DO PERÍODO (DRE) */}
      {/* ===================================================================== */}
      {activeSubTab === 'resultado' && (
        <div className="space-y-6">
          {/* Card Destacado Hero (Verde se Positivo, Vermelho se Negativo) */}
          <div
            className={`p-8 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${
              isLucroPositivo
                ? 'bg-gradient-to-br from-[rgba(39,174,96,0.15)] to-[rgba(39,174,96,0.05)] border-[#27AE60]/40'
                : 'bg-gradient-to-br from-[rgba(235,87,87,0.15)] to-[rgba(235,87,87,0.05)] border-[#EB5757]/40'
            }`}
          >
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-oswald uppercase tracking-wider font-bold mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isLucroPositivo ? 'bg-[#27AE60]' : 'bg-[#EB5757]'}`} />
                  Demonstrativo do Resultado do Exercício (DRE) • Mês Atual
                </div>
                <h3 className="font-display uppercase text-3xl sm:text-4xl font-bold tracking-wide">
                  {isLucroPositivo ? 'LUCRO LÍQUIDO DO PERÍODO' : 'PREJUÍZO NO PERÍODO'}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-inter mt-1 max-w-lg">
                  Cálculo contábil automático: Faturamento Líquido do estúdio menos Custos Fixos operacionais e Insumos variáveis.
                </p>
              </div>

              <div className="text-right">
                <div className={`font-display text-4xl sm:text-5xl font-extrabold ${isLucroPositivo ? 'text-[#27AE60]' : 'text-[#EB5757]'}`}>
                  {isLucroPositivo ? `+ R$ ${lucroLiquidoPeriodo.toFixed(2)}` : `- R$ ${Math.abs(lucroLiquidoPeriodo).toFixed(2)}`}
                </div>
                <div className="text-xs font-mono font-semibold text-[var(--text-secondary)] mt-1">
                  Margem Líquida: {faturamentoBrutoMesAtual > 0 ? ((lucroLiquidoPeriodo / faturamentoBrutoMesAtual) * 100).toFixed(1) : 0}% sobre o faturamento bruto
                </div>
              </div>
            </div>
          </div>

          {/* Quebra Detalhada da Fórmula DRE */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-6 shadow-soft space-y-4">
            <h4 className="font-display uppercase tracking-wide text-base text-[var(--text-primary)]">
              Composição Contábil do Resultado
            </h4>
            <div className="space-y-3 font-inter text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(39,174,96,0.08)]">
                <span className="font-semibold text-[var(--text-primary)]">(+) Faturamento Líquido do Estúdio (após comissões e taxas)</span>
                <strong className="font-mono text-[#27AE60] text-base">+ R$ {faturamentoLiquidoEstudioMesAtual.toFixed(2)}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(235,87,87,0.08)]">
                <span className="font-semibold text-[var(--text-primary)]">(-) Total de Custos Fixos Operacionais</span>
                <strong className="font-mono text-[#EB5757] text-base">- R$ {totalCustosFixosMes.toFixed(2)}</strong>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(235,87,87,0.08)]">
                <span className="font-semibold text-[var(--text-primary)]">(-) Outros Custos Variáveis & Insumos de Bancada</span>
                <strong className="font-mono text-[#EB5757] text-base">- R$ {outrosCustosVariaveis.toFixed(2)}</strong>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-alt)] font-bold text-base">
                <span className="font-oswald uppercase tracking-wider">(=) Resultado Líquido Final da Casa</span>
                <span className={`font-display text-2xl ${isLucroPositivo ? 'text-[#27AE60]' : 'text-[#EB5757]'}`}>
                  R$ {lucroLiquidoPeriodo.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. COMPARATIVO POR COLABORADOR */}
      {/* ===================================================================== */}
      {activeSubTab === 'colaboradores' && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div>
              <h3 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
                Tabela Comparativa de Produtividade & Geração de Receita
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-inter">
                Clique nos cabeçalhos para ordenar por qualquer coluna (faturamento, serviços, comissão ou ticket).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-inter">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] font-oswald uppercase tracking-wider text-[var(--text-muted)] cursor-pointer select-none">
                  <th onClick={() => handleSort('nome')} className="pb-2.5 font-semibold hover:text-[var(--accent)]">
                    <div className="flex items-center gap-1">
                      Profissional
                      {sortField === 'nome' && (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th className="pb-2.5 font-semibold text-center">Tipo</th>
                  <th className="pb-2.5 font-semibold text-center">Categoria Principal</th>
                  <th onClick={() => handleSort('servicos')} className="pb-2.5 font-semibold text-center hover:text-[var(--accent)]">
                    <div className="flex items-center justify-center gap-1">
                      Serviços Feitos
                      {sortField === 'servicos' && (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('faturamento')} className="pb-2.5 font-semibold text-right hover:text-[var(--accent)]">
                    <div className="flex items-center justify-end gap-1">
                      Faturamento Gerado
                      {sortField === 'faturamento' && (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('comissao')} className="pb-2.5 font-semibold text-right hover:text-[var(--accent)]">
                    <div className="flex items-center justify-end gap-1">
                      Comissão do Profissional
                      {sortField === 'comissao' && (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('ticket')} className="pb-2.5 font-semibold text-right hover:text-[var(--accent)]">
                    <div className="flex items-center justify-end gap-1">
                      Ticket Médio
                      {sortField === 'ticket' && (sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {comparativoColaboradores.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-[var(--bg-surface-alt)]/50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold text-[var(--text-muted)] w-4">#{idx + 1}</span>
                        <img
                          src={item.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80'}
                          alt={item.nome}
                          className="w-8 h-8 rounded-lg object-cover border border-[var(--border)]"
                        />
                        <span className="font-bold text-[var(--text-primary)]">{item.nome}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-oswald uppercase font-bold ${
                        item.tipo === 'rotativo'
                          ? 'bg-[rgba(81,117,102,0.20)] text-[#27AE60]'
                          : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border border-[var(--border)]'
                      }`}>
                        {item.tipo === 'rotativo' ? 'Rotativo' : 'Fixo'}
                      </span>
                    </td>
                    <td className="py-3 text-center text-[var(--text-secondary)]">
                      {item.categoriaPrincipal}
                    </td>
                    <td className="py-3 text-center font-mono font-bold text-[var(--text-primary)]">
                      {item.servicos}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-[#27AE60] text-sm">
                      R$ {item.faturamento.toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-[#E5A93C]">
                      R$ {item.comissao.toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-mono text-[var(--text-secondary)] font-medium">
                      R$ {item.ticket.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAIS AUXILIARES */}
      {/* ===================================================================== */}

      {/* Modal Novo Custo Fixo */}
      {isCustoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
                Cadastrar Custo Fixo Mensal
              </h3>
              <button onClick={() => setIsCustoModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustoFixo} className="space-y-3.5">
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                  Nome do Custo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel do Salão, Energia Elétrica, Água..."
                  value={custoNome}
                  onChange={(e) => setCustoNome(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                    Valor Mensal (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={custoValor || ''}
                    onChange={(e) => setCustoValor(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] font-mono font-bold outline-none focus:border-[var(--accent)]"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                    Dia Vencimento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    required
                    value={custoDia}
                    onChange={(e) => setCustoDia(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] font-mono font-bold outline-none focus:border-[var(--accent)] text-center"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                  Categoria
                </label>
                <select
                  value={custoCategoria}
                  onChange={(e) => setCustoCategoria(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                >
                  <option value="Instalações">Instalações (Aluguel, Condomínio)</option>
                  <option value="Utilidades">Utilidades (Energia, Água, Gás)</option>
                  <option value="Tecnologia">Tecnologia (Internet, Telefonia)</option>
                  <option value="Software">Software & Sistemas</option>
                  <option value="Serviços">Serviços Contábeis & Jurídicos</option>
                  <option value="Marketing">Marketing & Publicidade</option>
                  <option value="Geral">Outros Gerais</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCustoModalOpen(false)}
                  className="px-4 py-2 text-xs font-oswald uppercase font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#8CBDAD] hover:bg-[#517566] text-[#0B0E11] hover:text-white text-xs font-oswald uppercase font-bold transition-all shadow-md"
                >
                  Salvar Custo Fixo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar Repasse de Comissão */}
      {isRepasseModalOpen && repasseColab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h3 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
                Quitar Repasse de Comissões
              </h3>
              <button onClick={() => setIsRepasseModalOpen(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRepasse} className="space-y-4">
              <div className="p-4 rounded-xl bg-[rgba(39,174,96,0.08)] border border-[rgba(39,174,96,0.30)] text-center space-y-1">
                <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase block">
                  Valor Total a Transferir para {repasseColab.nome}
                </span>
                <div className="font-display text-3xl font-extrabold text-[#27AE60]">
                  R$ {repasseValor.toFixed(2)}
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] font-inter">
                  Referente a {repassePagamentosIds.length} atendimento(s) concluídos
                </div>
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                  Observação / Comprovante
                </label>
                <input
                  type="text"
                  value={repasseObs}
                  onChange={(e) => setRepasseObs(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                  placeholder="Ex: Transferido via PIX chave celular..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRepasseModalOpen(false)}
                  className="px-4 py-2 text-xs font-oswald uppercase font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#27AE60] hover:bg-[#219653] text-white text-xs font-oswald uppercase font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Quitação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
