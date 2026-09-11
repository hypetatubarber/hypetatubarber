import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Package,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Check,
  X,
  Folder,
  FolderOpen,
  Search,
  LayoutGrid,
  List,
  SlidersHorizontal,
  Edit2,
  Trash2,
  Scissors,
  Sparkles,
  Wine,
  Boxes,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  CircleDollarSign,
} from 'lucide-react';
import { Produto, MovimentacaoEstoque, UnidadeProduto } from '../../types';
import { api } from '../../services/api';
import { getProductSetor, getProductSubcategoria } from '../../services/mockData';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { generateUUID } from '../../lib/uuid';

interface Props {
  readOnly?: boolean;
}

// Configuração visual de cada pasta/categoria
interface CategoryFolderConfig {
  key: string;
  label: string;
  icon: React.ElementType;
  badgeColor: string;
  cardGradient: string;
  accentBorder: string;
  textColor: string;
  description: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryFolderConfig> = {
  TODAS: {
    key: 'TODAS',
    label: 'Todas as Pastas',
    icon: FolderOpen,
    badgeColor: 'bg-[var(--accent)]/15 text-[var(--accent-dark)] dark:text-[var(--accent)] border-[var(--accent)]/30',
    cardGradient: 'from-[var(--accent)]/10 via-transparent to-transparent',
    accentBorder: 'border-[var(--accent)]/40',
    textColor: 'text-[var(--accent-dark)] dark:text-[var(--accent)]',
    description: 'Visão consolidada de todo o almoxarifado do estúdio.',
  },
  Barbearia: {
    key: 'Barbearia',
    label: 'Barbearia',
    icon: Scissors,
    badgeColor: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
    cardGradient: 'from-amber-500/10 via-transparent to-transparent',
    accentBorder: 'border-amber-500/40',
    textColor: 'text-amber-500',
    description: 'Pomadas, óleos, lâminas, espumas e loções pós-barba.',
  },
  Tatuagem: {
    key: 'Tatuagem',
    label: 'Tatuagem',
    icon: Sparkles,
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    cardGradient: 'from-purple-500/10 via-transparent to-transparent',
    accentBorder: 'border-purple-500/40',
    textColor: 'text-purple-400',
    description: 'Tintas, agulhas, cartuchos, transfer stencil e vaselinas.',
  },
  Piercing: {
    key: 'Piercing',
    label: 'Piercing',
    icon: Sparkles,
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    cardGradient: 'from-emerald-500/10 via-transparent to-transparent',
    accentBorder: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    description: 'Joias de titânio, labrets, argolas, cateteres e pinças.',
  },
  Bebidas: {
    key: 'Bebidas',
    label: 'Bebidas & Bar',
    icon: Wine,
    badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    cardGradient: 'from-sky-500/10 via-transparent to-transparent',
    accentBorder: 'border-sky-500/40',
    textColor: 'text-sky-400',
    description: 'Cervejas, refrigerantes, energéticos, doses e água mineral.',
  },
  Descartáveis: {
    key: 'Descartáveis',
    label: 'Descartáveis & Higiene',
    icon: Boxes,
    badgeColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    cardGradient: 'from-rose-500/10 via-transparent to-transparent',
    accentBorder: 'border-rose-500/40',
    textColor: 'text-rose-400',
    description: 'Luvas nitrílicas, álcool hospitalar 70% e papel toalha.',
  },
};

const DEFAULT_CATEGORY_CONFIG: CategoryFolderConfig = {
  key: 'Outro',
  label: 'Outros Insumos',
  icon: Folder,
  badgeColor: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  cardGradient: 'from-zinc-500/10 via-transparent to-transparent',
  accentBorder: 'border-zinc-500/40',
  textColor: 'text-zinc-400',
  description: 'Insumos gerais e materiais do estúdio.',
};

export const ProductList: React.FC<Props> = ({ readOnly = false }) => {
  const { showToast } = useToast();
  const { currentUser, role } = useAuth();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [mainTab, setMainTab] = useState<'estoque' | 'movimentacoes'>('estoque');

  // Filtros de Categoria e Estilo de Pasta
  const [selectedFolder, setSelectedFolder] = useState<string>('TODAS');
  const [viewMode, setViewMode] = useState<'pastas' | 'tabela'>('pastas');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'criticos' | 'normais'>('todos');
  const [sortBy, setSortBy] = useState<'nome' | 'menor_estoque' | 'maior_valor'>('nome');

  // Modal Novo / Editar Produto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Barbearia');
  const [customCategoria, setCustomCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [setorDestinado, setSetorDestinado] = useState<'barbearia' | 'tatuagem' | 'piercing' | 'todos' | 'nenhum'>('barbearia');
  const [unidade, setUnidade] = useState<UnidadeProduto>('un');
  const [custoUnitario, setCustoUnitario] = useState(0);
  const [estoqueAtual, setEstoqueAtual] = useState(10);
  const [estoqueMinimo, setEstoqueMinimo] = useState(5);

  // Modal Entrada de Estoque
  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState(false);
  const [entradaCategoriaFiltro, setEntradaCategoriaFiltro] = useState('TODAS');
  const [entradaProdutoId, setEntradaProdutoId] = useState('');
  const [entradaQuantidade, setEntradaQuantidade] = useState(5);
  const [entradaMotivo, setEntradaMotivo] = useState('Compra de reposição mensal');

  const loadData = async () => {
    try {
      const [prodList, movList] = await Promise.all([
        api.getProdutos(),
        api.getMovimentacoes(),
      ]);
      setProdutos(prodList);
      setMovimentacoes(movList);
      if (prodList.length > 0 && !entradaProdutoId) {
        setEntradaProdutoId(prodList[0].id);
      }
    } catch (err) {
      console.error('Erro ao carregar estoque:', err);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('hype_produtos_changed', handleSync);
    window.addEventListener('hype_movimentacoes_estoque_changed', handleSync);
    window.addEventListener('hype_uso_produtos_changed', handleSync);

    return () => {
      window.removeEventListener('hype_produtos_changed', handleSync);
      window.removeEventListener('hype_movimentacoes_estoque_changed', handleSync);
      window.removeEventListener('hype_uso_produtos_changed', handleSync);
    };
  }, []);

  // Lista dinâmica de categorias detectadas nos produtos + fixas
  const availableCategories = useMemo(() => {
    const set = new Set<string>(['Barbearia', 'Tatuagem', 'Piercing', 'Bebidas', 'Descartáveis']);
    produtos.forEach((p) => {
      if (p.categoria) {
        if (p.categoria.toLowerCase() === 'geral') {
          set.add('Descartáveis');
        } else {
          set.add(p.categoria);
        }
      }
    });
    return Array.from(set);
  }, [produtos]);

  const getFolderConfig = (catName: string): CategoryFolderConfig => {
    if (catName === 'Geral') return CATEGORY_CONFIGS['Descartáveis'] || DEFAULT_CATEGORY_CONFIG;
    return CATEGORY_CONFIGS[catName] || {
      ...DEFAULT_CATEGORY_CONFIG,
      key: catName,
      label: catName,
    };
  };

  // Contagem de itens e alertas por pasta
  const folderStats = useMemo(() => {
    const stats: Record<string, { total: number; lowStock: number; valorTotal: number }> = {
      TODAS: { total: produtos.length, lowStock: 0, valorTotal: 0 },
    };

    availableCategories.forEach((cat) => {
      stats[cat] = { total: 0, lowStock: 0, valorTotal: 0 };
    });

    produtos.forEach((p) => {
      const isLow = p.estoque_atual <= p.estoque_minimo;
      const valor = p.custo_unitario * p.estoque_atual;
      const catKey = p.categoria === 'Geral' ? 'Descartáveis' : p.categoria;

      stats.TODAS.valorTotal += valor;
      if (isLow) stats.TODAS.lowStock += 1;

      if (!stats[catKey]) {
        stats[catKey] = { total: 0, lowStock: 0, valorTotal: 0 };
      }
      stats[catKey].total += 1;
      stats[catKey].valorTotal += valor;
      if (isLow) stats[catKey].lowStock += 1;
    });

    return stats;
  }, [produtos, availableCategories]);

  // Filtro e Ordenação dos Produtos
  const filteredProducts = useMemo(() => {
    return produtos
      .filter((p) => {
        // Filtro por pasta/categoria
        if (selectedFolder !== 'TODAS') {
          const catKey = p.categoria === 'Geral' ? 'Descartáveis' : p.categoria;
          if (catKey.toLowerCase() !== selectedFolder.toLowerCase()) {
            return false;
          }
        }

        // Filtro por busca
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchNome = p.nome.toLowerCase().includes(q);
          const matchCat = p.categoria.toLowerCase().includes(q);
          const matchUn = p.unidade.toLowerCase().includes(q);
          if (!matchNome && !matchCat && !matchUn) return false;
        }

        // Filtro por status
        const isLow = p.estoque_atual <= p.estoque_minimo;
        if (statusFilter === 'criticos' && !isLow) return false;
        if (statusFilter === 'normais' && isLow) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'menor_estoque') {
          return a.estoque_atual - b.estoque_atual;
        }
        if (sortBy === 'maior_valor') {
          return b.custo_unitario * b.estoque_atual - a.custo_unitario * a.estoque_atual;
        }
        return a.nome.localeCompare(b.nome);
      });
  }, [produtos, selectedFolder, searchQuery, statusFilter, sortBy]);

  // Produtos filtrados para o modal de entrada
  const produtosParaEntrada = useMemo(() => {
    if (entradaCategoriaFiltro === 'TODAS') return produtos;
    return produtos.filter((p) => {
      const catKey = p.categoria === 'Geral' ? 'Descartáveis' : p.categoria;
      return catKey.toLowerCase() === entradaCategoriaFiltro.toLowerCase();
    });
  }, [produtos, entradaCategoriaFiltro]);

  const handleOpenProductModal = (prod?: Produto) => {
    if (prod) {
      setEditingProduct(prod);
      setNome(prod.nome);
      setCategoria(prod.categoria === 'Geral' ? 'Descartáveis' : prod.categoria);
      setCustomCategoria('');
      setSubcategoria(prod.subcategoria || getProductSubcategoria(prod));
      setSetorDestinado(prod.setor_destinado || getProductSetor(prod));
      setUnidade(prod.unidade);
      setCustoUnitario(prod.custo_unitario);
      setEstoqueAtual(prod.estoque_atual);
      setEstoqueMinimo(prod.estoque_minimo);
    } else {
      setEditingProduct(null);
      setNome('');
      const defaultCat = selectedFolder !== 'TODAS' ? selectedFolder : 'Barbearia';
      setCategoria(defaultCat);
      setCustomCategoria('');
      setSubcategoria('');
      setSetorDestinado(
        defaultCat === 'Barbearia' ? 'barbearia' :
        defaultCat === 'Tatuagem' ? 'tatuagem' :
        defaultCat === 'Piercing' ? 'piercing' :
        defaultCat === 'Bebidas' ? 'nenhum' : 'todos'
      );
      setUnidade('un');
      setCustoUnitario(25);
      setEstoqueAtual(10);
      setEstoqueMinimo(5);
    }
    setIsProductModalOpen(true);
  };

  const handleOpenQuickEntrada = (prod: Produto) => {
    setEntradaProdutoId(prod.id);
    setEntradaCategoriaFiltro(prod.categoria === 'Geral' ? 'Descartáveis' : prod.categoria);
    setEntradaQuantidade(prod.estoque_minimo > prod.estoque_atual ? prod.estoque_minimo * 2 : 10);
    setEntradaMotivo(`Reposição rápida de ${prod.nome}`);
    setIsEntradaModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('Informe o nome do produto.', 'warning');
      return;
    }

    const finalCategoria = categoria === 'Outra' ? (customCategoria.trim() || 'Geral') : categoria;

    try {
      const prodData: Produto = {
        id: editingProduct ? editingProduct.id : generateUUID(),
        nome: nome.trim(),
        categoria: finalCategoria,
        subcategoria: subcategoria.trim() || undefined,
        setor_destinado: setorDestinado,
        unidade,
        custo_unitario: Number(custoUnitario),
        estoque_atual: Number(estoqueAtual),
        estoque_minimo: Number(estoqueMinimo),
      };

      const saved = await api.saveProduto(prodData);
      setProdutos((prev) => {
        const exists = prev.some((p) => p.id === saved.id);
        if (exists) {
          return prev.map((p) => (p.id === saved.id ? saved : p));
        }
        return [saved, ...prev];
      });

      // Auto-seleciona a pasta da categoria salva se o usuário estava em outra pasta filtrada
      const finalCatNormalized = finalCategoria === 'Geral' ? 'Descartáveis' : finalCategoria;
      if (selectedFolder !== 'TODAS' && selectedFolder.toLowerCase() !== finalCatNormalized.toLowerCase()) {
        setSelectedFolder(finalCatNormalized);
      }

      showToast('Produto salvo no estoque com sucesso!', 'success');
      setIsProductModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar produto.', 'error');
    }
  };

  const handleDeleteProduct = async (prod: Produto) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o produto "${prod.nome}" do estoque?`)) {
      return;
    }

    try {
      await api.deleteProduto(prod.id);
      setProdutos((prev) => prev.filter((p) => p.id !== prod.id));
      showToast(`Produto "${prod.nome}" excluído do estoque com sucesso!`, 'success');
      if (editingProduct?.id === prod.id) {
        setIsProductModalOpen(false);
      }
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao excluir produto.', 'error');
    }
  };

  const handleSaveEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entradaProdutoId || entradaQuantidade <= 0) {
      showToast('Selecione um produto e quantidade válida.', 'warning');
      return;
    }

    try {
      await api.registrarEntradaEstoque(
        entradaProdutoId,
        Number(entradaQuantidade),
        entradaMotivo.trim() || 'Entrada de reposição',
        currentUser?.id || 'admin'
      );
      showToast('Entrada de estoque registrada com sucesso!', 'success');
      setIsEntradaModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar entrada.', 'error');
    }
  };

  const totalLowStock = folderStats.TODAS?.lowStock || 0;

  return (
    <div className="space-y-6">
      {/* CABEÇALHO DO ALMOXARIFADO */}
      <div className="bg-[var(--bg-surface)] p-5 sm:p-6 rounded-2xl border border-[var(--border)] shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-5 text-[var(--text-primary)] relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent-dark)] dark:text-[var(--accent)] shadow-xs">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display uppercase tracking-wider text-xl sm:text-2xl text-[var(--text-primary)] flex items-center gap-2">
                Almoxarifado & Estoque
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                Pastas temáticas de insumos, controle de bebidas, alertas de segurança e inventário.
              </p>
            </div>
          </div>
        </div>

        {/* Métricas Rápidas no Topo */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center gap-2.5">
            <Boxes className="w-4 h-4 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
            <div>
              <div className="text-[10px] uppercase font-oswald text-[var(--text-muted)] tracking-wider">Total em Itens</div>
              <div className="font-display text-sm font-bold text-[var(--text-primary)]">
                {produtos.reduce((acc, p) => acc + p.estoque_atual, 0)} <span className="text-[11px] font-normal text-[var(--text-secondary)]">unidades</span>
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center gap-2.5">
            <CircleDollarSign className="w-4 h-4 text-[#6FCF97]" />
            <div>
              <div className="text-[10px] uppercase font-oswald text-[var(--text-muted)] tracking-wider">Patrimônio em Estoque</div>
              <div className="font-display text-sm font-bold text-[#6FCF97]">
                R$ {folderStats.TODAS?.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {!readOnly && role === 'master' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEntradaCategoriaFiltro(selectedFolder !== 'TODAS' ? selectedFolder : 'TODAS');
                  setIsEntradaModalOpen(true);
                }}
                className="px-3.5 py-2.5 bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl text-xs font-oswald uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <ArrowUpRight className="w-4 h-4 text-[#6FCF97]" />
                Entrada
              </button>
              <button
                onClick={() => handleOpenProductModal()}
                className="px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] rounded-xl text-xs font-oswald uppercase tracking-wider font-bold flex items-center gap-1.5 transition-all shadow-accent"
              >
                <Plus className="w-4 h-4" />
                Novo Produto
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ALERTA VISUAL DE ITENS EM BAIXA */}
      {totalLowStock > 0 && (
        <div className="p-4 bg-[rgba(235,87,87,0.12)] border border-[rgba(235,87,87,0.30)] rounded-2xl flex items-center justify-between gap-3 text-[#EB5757] animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(235,87,87,0.22)] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#EB5757] animate-pulse" />
            </div>
            <div>
              <h4 className="font-oswald uppercase tracking-wider text-xs sm:text-sm font-semibold text-[#EB5757]">
                Atenção: {totalLowStock} {totalLowStock === 1 ? 'produto atingiu' : 'produtos atingiram'} o nível de segurança mínimo!
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] font-inter mt-0.5">
                Revise os itens destacados em vermelho e providencie a compra de reposição para não desabastecer o estúdio.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedFolder('TODAS');
              setStatusFilter(statusFilter === 'criticos' ? 'todos' : 'criticos');
            }}
            className="px-3 py-1.5 rounded-lg bg-[rgba(235,87,87,0.20)] hover:bg-[rgba(235,87,87,0.30)] text-[#EB5757] text-xs font-oswald uppercase tracking-wider font-bold shrink-0 transition-colors"
          >
            {statusFilter === 'criticos' ? 'Ver Todos' : 'Filtrar Críticos'}
          </button>
        </div>
      )}

      {/* NAVEGAÇÃO PRINCIPAL: ESTOQUE (PASTAS) x HISTÓRICO DE MOVIMENTAÇÕES */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setMainTab('estoque')}
          className={`px-4 py-2 rounded-xl text-xs font-oswald uppercase tracking-wider font-bold transition-all flex items-center gap-2 ${
            mainTab === 'estoque'
              ? 'bg-[var(--accent)] text-[#0B0E11] shadow-accent'
              : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
          }`}
        >
          <Folder className="w-4 h-4" />
          Pastas de Estoque ({produtos.length})
        </button>
        <button
          onClick={() => setMainTab('movimentacoes')}
          className={`px-4 py-2 rounded-xl text-xs font-oswald uppercase tracking-wider font-bold transition-all flex items-center gap-2 ${
            mainTab === 'movimentacoes'
              ? 'bg-[var(--accent)] text-[#0B0E11] shadow-accent'
              : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          Histórico de Entradas e Saídas ({movimentacoes.length})
        </button>
      </div>

      {mainTab === 'estoque' && (
        <div className="space-y-6">
          {/* ========================================================================= */}
          {/* ABAS ESTILO PASTA FÍSICA (FOLDER TABS)                                    */}
          {/* ========================================================================= */}
          <div className="relative">
            {/* Scroll horizontal suave para telas menores */}
            <div className="flex items-end gap-1.5 overflow-x-auto no-scrollbar pt-2 px-1 border-b border-[var(--border)]">
              {/* ABA: TODAS AS PASTAS */}
              <button
                onClick={() => setSelectedFolder('TODAS')}
                className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-oswald uppercase tracking-wider font-bold transition-all shrink-0 border-t border-x ${
                  selectedFolder === 'TODAS'
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--accent)] -mb-[1px] z-10 shadow-sm'
                    : 'bg-[var(--bg-surface-alt)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--bg-surface-alt)]'
                }`}
              >
                <FolderOpen className={`w-4 h-4 ${selectedFolder === 'TODAS' ? 'text-[var(--accent-dark)] dark:text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
                <span>Todas as Pastas</span>
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[var(--bg-surface-alt)] border border-[var(--border)]">
                  {produtos.length}
                </span>
                {totalLowStock > 0 && (
                  <span className="w-2 h-2 rounded-full bg-[#EB5757] animate-pulse" title={`${totalLowStock} itens críticos`} />
                )}
              </button>

              {/* ABAS DAS CATEGORIAS */}
              {availableCategories.map((catKey) => {
                const config = getFolderConfig(catKey);
                const Icon = config.icon;
                const stats = folderStats[catKey] || { total: 0, lowStock: 0, valorTotal: 0 };
                const isSelected = selectedFolder === catKey;

                return (
                  <button
                    key={catKey}
                    onClick={() => setSelectedFolder(catKey)}
                    className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-oswald uppercase tracking-wider font-bold transition-all shrink-0 border-t border-x ${
                      isSelected
                        ? `bg-[var(--bg-surface)] text-[var(--text-primary)] ${config.accentBorder} -mb-[1px] z-10 shadow-sm`
                        : 'bg-[var(--bg-surface-alt)]/60 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)] hover:bg-[var(--bg-surface-alt)]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? config.textColor : 'text-[var(--text-muted)]'}`} />
                    <span>{config.label}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[var(--bg-surface-alt)] border border-[var(--border)]">
                      {stats.total}
                    </span>
                    {stats.lowStock > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#EB5757] animate-pulse" title={`${stats.lowStock} itens críticos`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VISÃO GERAL DE CAPAS DE PASTAS (EXIBIDA QUANDO "TODAS" ESTÁ ATIVA)        */}
          {/* ========================================================================= */}
          {selectedFolder === 'TODAS' && !searchQuery.trim() && statusFilter === 'todos' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
                  <span className="font-oswald uppercase tracking-wider text-xs font-bold text-[var(--text-primary)]">
                    Selecione uma Pasta para Focar ou Navegue Abaixo
                  </span>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] font-inter">
                  {availableCategories.length} categorias cadastradas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
                {availableCategories.map((catKey) => {
                  const config = getFolderConfig(catKey);
                  const Icon = config.icon;
                  const stats = folderStats[catKey] || { total: 0, lowStock: 0, valorTotal: 0 };
                  const sampleProducts = produtos
                    .filter((p) => (p.categoria === 'Geral' ? 'Descartáveis' : p.categoria) === catKey)
                    .slice(0, 3);

                  return (
                    <div
                      key={catKey}
                      onClick={() => setSelectedFolder(catKey)}
                      className={`group cursor-pointer rounded-2xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-alt)]/80 border border-[var(--border)] hover:${config.accentBorder} p-4 transition-all duration-200 shadow-soft hover:shadow-md flex flex-col justify-between relative overflow-hidden`}
                    >
                      {/* Efeito de aba de pasta no topo do card */}
                      <div className="absolute top-0 right-0 w-20 h-6 bg-[var(--bg-surface-alt)] border-l border-b border-[var(--border)] rounded-bl-xl flex items-center justify-center">
                        <span className="text-[10px] font-mono text-[var(--text-muted)] font-semibold">
                          {stats.total} itens
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className={`w-9 h-9 rounded-xl ${config.badgeColor} border flex items-center justify-center shrink-0`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-display uppercase tracking-wide text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-dark)] dark:group-hover:text-[var(--accent)] transition-colors">
                              {config.label}
                            </h3>
                            <div className="text-[10px] text-[var(--text-muted)] font-inter truncate max-w-[150px]">
                              {stats.lowStock > 0 ? (
                                <span className="text-[#EB5757] font-semibold flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5" /> {stats.lowStock} em nível crítico
                                </span>
                              ) : (
                                <span className="text-[#6FCF97] font-medium">100% em dia</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amostra rápida dos produtos dessa pasta */}
                        <div className="space-y-1 my-2">
                          {sampleProducts.map((p) => (
                            <div key={p.id} className="text-[11px] text-[var(--text-secondary)] font-inter truncate flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                              <span className="truncate">{p.nome}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 mt-2 border-t border-[var(--border)]/60 flex items-center justify-between">
                        <div>
                          <div className="text-[9px] uppercase font-oswald text-[var(--text-muted)] tracking-wider">Patrimônio</div>
                          <div className="font-display text-xs font-bold text-[var(--text-primary)]">
                            R$ {stats.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-lg bg-[var(--bg-surface-alt)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--accent-dark)] dark:group-hover:text-[var(--accent)] group-hover:translate-x-0.5 transition-all">
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BANNER DA PASTA ATIVA (QUANDO UMA CATEGORIA ESPECÍFICA ESTÁ SELECIONADA)  */}
          {/* ========================================================================= */}
          {selectedFolder !== 'TODAS' && (
            <div className="bg-[var(--bg-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const conf = getFolderConfig(selectedFolder);
                  const Icon = conf.icon;
                  return (
                    <div className={`w-11 h-11 rounded-xl ${conf.badgeColor} border flex items-center justify-center shrink-0`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  );
                })()}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-oswald uppercase tracking-wider text-[var(--text-muted)]">
                      Pasta Ativa
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">•</span>
                    <span className="text-[10px] font-inter text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold">
                      {folderStats[selectedFolder]?.total || 0} itens registrados
                    </span>
                  </div>
                  <h3 className="font-display uppercase tracking-wide text-lg sm:text-xl text-[var(--text-primary)]">
                    {getFolderConfig(selectedFolder).label}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] font-inter mt-0.5">
                    {getFolderConfig(selectedFolder).description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-oswald text-[var(--text-muted)] tracking-wider">
                    Valor Total na Pasta
                  </div>
                  <div className="font-display text-base font-bold text-[#6FCF97]">
                    R$ {(folderStats[selectedFolder]?.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFolder('TODAS')}
                  className="px-3 py-2 rounded-xl bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] text-xs font-oswald uppercase tracking-wider font-semibold transition-colors"
                >
                  Ver Todas
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* BARRA DE FERRAMENTAS: BUSCA, STATUS, ORDENAÇÃO E ALTERNADOR DE MODO        */}
          {/* ========================================================================= */}
          <div className="bg-[var(--bg-surface)] p-3.5 sm:p-4 rounded-xl border border-[var(--border)] shadow-soft flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Campo de Busca */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por produto, marca, unidade ou código..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filtro por Status */}
              <div className="flex items-center gap-1 bg-[var(--bg-surface-alt)] p-1 rounded-xl border border-[var(--border)]">
                <button
                  onClick={() => setStatusFilter('todos')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-oswald uppercase tracking-wider font-semibold transition-all ${
                    statusFilter === 'todos'
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter('criticos')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-oswald uppercase tracking-wider font-semibold transition-all flex items-center gap-1 ${
                    statusFilter === 'criticos'
                      ? 'bg-[#EB5757] text-white shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[#EB5757]'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Críticos
                </button>
                <button
                  onClick={() => setStatusFilter('normais')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-oswald uppercase tracking-wider font-semibold transition-all ${
                    statusFilter === 'normais'
                      ? 'bg-[#6FCF97] text-[#0B0E11] font-bold shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[#6FCF97]'
                  }`}
                >
                  Em Dia
                </button>
              </div>

              {/* Ordenar Por */}
              <div className="flex items-center gap-1.5 bg-[var(--bg-surface-alt)] px-3 py-1.5 rounded-xl border border-[var(--border)]">
                <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs text-[var(--text-primary)] outline-none font-oswald uppercase tracking-wider font-semibold cursor-pointer"
                >
                  <option value="nome" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Nome A-Z</option>
                  <option value="menor_estoque" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Menor Estoque</option>
                  <option value="maior_valor" className="bg-[var(--bg-surface)] text-[var(--text-primary)]">Maior Valor (R$)</option>
                </select>
              </div>

              {/* Alternador de Modo: Fichas da Pasta x Tabela */}
              <div className="flex items-center gap-1 bg-[var(--bg-surface-alt)] p-1 rounded-xl border border-[var(--border)]">
                <button
                  onClick={() => setViewMode('pastas')}
                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-oswald uppercase tracking-wider font-semibold ${
                    viewMode === 'pastas'
                      ? 'bg-[var(--accent)] text-[#0B0E11] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Modo Fichas de Pasta (Cards)"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">Fichas</span>
                </button>
                <button
                  onClick={() => setViewMode('tabela')}
                  className={`p-1.5 rounded-lg transition-all flex items-center gap-1 text-xs font-oswald uppercase tracking-wider font-semibold ${
                    viewMode === 'tabela'
                      ? 'bg-[var(--accent)] text-[#0B0E11] shadow-xs'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Modo Tabela Detalhada (Planilha)"
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Tabela</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* MODO 1: FICHAS TÉCNICAS DA PASTA (CARDS COM MEDIDOR VISUAL / GAUGE)       */}
          {/* ========================================================================= */}
          {viewMode === 'pastas' && (
            <div>
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)]">
                  <Package className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                  <h4 className="font-display uppercase tracking-wider text-base text-[var(--text-primary)]">
                    Nenhum produto encontrado nesta pasta
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] font-inter mt-1 max-w-sm mx-auto">
                    Tente ajustar o termo de busca, limpar os filtros ou cadastrar um novo item nesta categoria.
                  </p>
                  {!readOnly && role === 'master' && (
                    <button
                      onClick={() => handleOpenProductModal()}
                      className="mt-4 px-4 py-2 bg-[var(--accent)] text-[#0B0E11] rounded-xl text-xs font-oswald uppercase tracking-wider font-bold inline-flex items-center gap-1.5 shadow-accent"
                    >
                      <Plus className="w-4 h-4" /> Cadastrar Novo Insumo
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4.5">
                  {filteredProducts.map((prod) => {
                    const isLow = prod.estoque_atual <= prod.estoque_minimo;
                    const isAttention = !isLow && prod.estoque_atual <= prod.estoque_minimo * 1.5;
                    const valorTotal = prod.custo_unitario * prod.estoque_atual;
                    const catConfig = getFolderConfig(prod.categoria);
                    const CategoryIcon = catConfig.icon;

                    // Cálculo da régua de nível de estoque (barra visual)
                    const targetCap = Math.max(prod.estoque_minimo * 3, 15);
                    const percentGauge = Math.min(100, Math.max(5, Math.round((prod.estoque_atual / targetCap) * 100)));

                    let gaugeColorClass = 'bg-[#6FCF97]';
                    let statusLabel = 'Estoque Normal';
                    let statusBadgeClass = 'bg-[rgba(81,117,102,0.20)] text-[#6FCF97] border-[rgba(81,117,102,0.40)]';

                    if (isLow) {
                      gaugeColorClass = 'bg-[#EB5757]';
                      statusLabel = 'Nível Crítico';
                      statusBadgeClass = 'bg-[rgba(235,87,87,0.18)] text-[#EB5757] border-[rgba(235,87,87,0.40)] animate-pulse';
                    } else if (isAttention) {
                      gaugeColorClass = 'bg-amber-400';
                      statusLabel = 'Atenção';
                      statusBadgeClass = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                    }

                    return (
                      <div
                        key={prod.id}
                        className={`rounded-2xl bg-[var(--bg-surface)] border ${
                          isLow ? 'border-[#EB5757]/60 shadow-[0_0_15px_rgba(235,87,87,0.12)]' : 'border-[var(--border)]'
                        } p-5 hover:border-[var(--accent)] transition-all duration-200 shadow-soft flex flex-col justify-between relative group overflow-hidden`}
                      >
                        {/* Faixa decorativa superior no estilo dossiê */}
                        <div className={`h-1.5 w-full absolute top-0 left-0 ${gaugeColorClass}`} />

                        <div>
                          {/* Cabeçalho da Ficha */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-oswald uppercase tracking-wider font-semibold border ${catConfig.badgeColor}`}>
                                <CategoryIcon className="w-3 h-3" />
                                {prod.categoria}
                              </span>
                              {prod.subcategoria && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-oswald uppercase tracking-wider font-semibold bg-[var(--bg-surface-alt)] border border-[var(--border)] text-[var(--text-secondary)]">
                                  📁 {prod.subcategoria}
                                </span>
                              )}
                              <span className="text-[11px] font-mono text-[var(--text-muted)] font-medium">
                                #{prod.unidade}
                              </span>
                            </div>

                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-oswald uppercase tracking-wider font-bold border ${statusBadgeClass}`}>
                              {isLow && <AlertTriangle className="w-2.5 h-2.5" />}
                              {isAttention && <TrendingDown className="w-2.5 h-2.5" />}
                              {!isLow && !isAttention && <Check className="w-2.5 h-2.5" />}
                              {statusLabel}
                            </span>
                          </div>

                          {/* Nome do Produto */}
                          <h3 className="font-display uppercase tracking-wide text-base font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-dark)] dark:group-hover:text-[var(--accent)] transition-colors leading-snug">
                            {prod.nome}
                          </h3>

                          {/* MEDIDOR VISUAL DE ESTOQUE (GAUGE BAR) */}
                          <div className="mt-4 p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)]">
                            <div className="flex items-baseline justify-between mb-1.5">
                              <div>
                                <span className="text-[10px] uppercase font-oswald text-[var(--text-muted)] tracking-wider">Estoque Atual</span>
                                <div className="flex items-baseline gap-1">
                                  <span className={`font-display text-2xl font-black ${isLow ? 'text-[#EB5757]' : 'text-[var(--text-primary)]'}`}>
                                    {prod.estoque_atual}
                                  </span>
                                  <span className="text-xs font-oswald uppercase text-[var(--text-secondary)] font-semibold">
                                    {prod.unidade}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] uppercase font-oswald text-[var(--text-muted)] tracking-wider">Mínimo Seguro</span>
                                <div className="text-xs font-oswald font-semibold text-[var(--text-secondary)]">
                                  {prod.estoque_minimo} {prod.unidade}
                                </div>
                              </div>
                            </div>

                            {/* Barra de Progresso do Medidor */}
                            <div className="w-full h-2 rounded-full bg-[var(--bg-surface)] overflow-hidden p-0.5 border border-[var(--border)]">
                              <div
                                className={`h-full rounded-full ${gaugeColorClass} transition-all duration-500`}
                                style={{ width: `${percentGauge}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-[var(--text-muted)] font-mono mt-1">
                              <span>0</span>
                              <span>Nível Seguro: {prod.estoque_minimo}</span>
                              <span>Capacidade: {targetCap}</span>
                            </div>
                          </div>
                        </div>

                        {/* Rodapé Financeiro e Ações Rápidas */}
                        <div className="pt-4 mt-4 border-t border-[var(--border)]">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="text-[9px] uppercase font-oswald text-[var(--text-muted)] tracking-wider">Custo Unitário</div>
                              <div className="font-inter text-xs font-bold text-[var(--text-primary)]">
                                R$ {prod.custo_unitario.toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[9px] uppercase font-oswald text-[var(--text-muted)] tracking-wider">Total em Estoque</div>
                              <div className="font-display text-sm font-bold text-[#6FCF97]">
                                R$ {valorTotal.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Botões de Ação */}
                          {!readOnly && role === 'master' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenQuickEntrada(prod)}
                                className="flex-1 px-3 py-2 rounded-xl bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[#6FCF97] text-xs font-oswald uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 transition-all"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5 text-[#6FCF97]" />
                                + Entrada
                              </button>
                              <button
                                onClick={() => handleOpenProductModal(prod)}
                                className="flex-1 px-3 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] text-xs font-oswald uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all shadow-accent"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod)}
                                className="p-2 rounded-xl bg-[var(--bg-surface-alt)] hover:bg-[#EB5757]/15 text-[var(--text-muted)] hover:text-[#EB5757] border border-[var(--border)] hover:border-[#EB5757]/40 transition-all"
                                title="Excluir Produto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center py-1">
                              <span className="text-[11px] text-[var(--text-muted)] font-inter">
                                Visualização autorizada para recepção
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* MODO 2: TABELA DETALHADA DE CONTROLE (PLANILHA COMPLETA)                  */}
          {/* ========================================================================= */}
          {viewMode === 'tabela' && (
            <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-soft overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-surface-alt)] border-b border-[var(--border)] text-[var(--text-secondary)] font-oswald uppercase tracking-wider text-[12px] font-semibold">
                    <tr>
                      <th className="p-4">Produto & Especificação</th>
                      <th className="p-4">Pasta / Categoria</th>
                      <th className="p-4">Nível de Estoque</th>
                      <th className="p-4">Mínimo</th>
                      <th className="p-4">Custo Unit.</th>
                      <th className="p-4">Valor Total</th>
                      <th className="p-4">Status</th>
                      {!readOnly && role === 'master' && <th className="p-4 text-right">Ações</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]/60">
                    {filteredProducts.map((prod, idx) => {
                      const isLow = prod.estoque_atual <= prod.estoque_minimo;
                      const valorTotal = prod.custo_unitario * prod.estoque_atual;
                      const catConfig = getFolderConfig(prod.categoria);
                      const Icon = catConfig.icon;

                      return (
                        <tr
                          key={prod.id}
                          className={`${idx % 2 === 0 ? 'bg-[var(--bg-surface)]' : 'bg-[var(--table-row-alt)]'} hover:bg-[var(--table-row-hover)] transition-colors`}
                        >
                          <td className="p-4 font-medium text-[var(--text-primary)] font-inter">
                            <div className="font-semibold">{prod.nome}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[var(--text-muted)] font-mono">Unidade: {prod.unidade}</span>
                              {prod.subcategoria && (
                                <span className="text-[10px] text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold font-oswald uppercase">
                                  • {prod.subcategoria}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-[var(--text-secondary)]">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[10px] font-oswald uppercase tracking-wider font-semibold border ${catConfig.badgeColor}`}>
                              <Icon className="w-3 h-3" />
                              {prod.categoria}
                            </span>
                          </td>
                          <td className="p-4 font-inter">
                            <div className="flex items-center gap-2">
                              <span className={`font-black text-sm ${isLow ? 'text-[#EB5757]' : 'text-[var(--text-primary)]'}`}>
                                {prod.estoque_atual}
                              </span>
                              <span className="text-[var(--text-muted)] text-[11px] font-medium">{prod.unidade}</span>
                            </div>
                            {/* Mini gauge na tabela */}
                            <div className="w-24 h-1.5 rounded-full bg-[var(--bg-surface-alt)] overflow-hidden mt-1 border border-[var(--border)]">
                              <div
                                className={`h-full ${isLow ? 'bg-[#EB5757]' : 'bg-[#6FCF97]'}`}
                                style={{ width: `${Math.min(100, (prod.estoque_atual / (prod.estoque_minimo * 3 || 10)) * 100)}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-4 text-[var(--text-secondary)] font-medium font-inter">
                            {prod.estoque_minimo} {prod.unidade}
                          </td>
                          <td className="p-4 text-[var(--text-primary)] font-semibold font-inter">
                            R$ {prod.custo_unitario.toFixed(2)}
                          </td>
                          <td className="p-4 font-bold text-[#6FCF97] font-inter">
                            R$ {valorTotal.toFixed(2)}
                          </td>
                          <td className="p-4">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 bg-[rgba(235,87,87,0.15)] text-[#EB5757] border border-[rgba(235,87,87,0.35)] text-[10px] font-oswald uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                Crítico
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-[rgba(81,117,102,0.25)] text-[#6FCF97] border border-[rgba(81,117,102,0.40)] text-[10px] font-oswald uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full">
                                <Check className="w-3 h-3" />
                                Em Dia
                              </span>
                            )}
                          </td>
                          {!readOnly && role === 'master' && (
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenQuickEntrada(prod)}
                                  className="p-1.5 rounded-lg bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] text-[#6FCF97] border border-[var(--border)] transition-colors"
                                  title="Entrada rápida"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenProductModal(prod)}
                                  className="px-2.5 py-1 text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--accent-dark)] dark:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors border border-[var(--border)]"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(prod)}
                                  className="p-1.5 rounded-lg bg-[var(--bg-surface-alt)] hover:bg-[#EB5757]/15 text-[var(--text-muted)] hover:text-[#EB5757] border border-[var(--border)] hover:border-[#EB5757]/40 transition-colors"
                                  title="Excluir produto"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HISTÓRICO DE ENTRADAS E SAÍDAS                                     */}
      {/* ========================================================================= */}
      {mainTab === 'movimentacoes' && (
        <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border)] shadow-soft overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowDownRight className="w-4 h-4 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
              <h3 className="font-display uppercase tracking-wide text-sm font-bold text-[var(--text-primary)]">
                Registro de Movimentações de Estoque
              </h3>
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-mono">
              Total: {movimentacoes.length} registros
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-alt)] border-b border-[var(--border)] text-[var(--text-secondary)] font-oswald uppercase tracking-wider text-[12px] font-semibold">
                <tr>
                  <th className="p-4">Data / Hora</th>
                  <th className="p-4">Tipo</th>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Quantidade</th>
                  <th className="p-4">Motivo / Descrição</th>
                  <th className="p-4">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {movimentacoes.map((mov, idx) => (
                  <tr
                    key={mov.id}
                    className={`${idx % 2 === 0 ? 'bg-[var(--bg-surface)]' : 'bg-[var(--table-row-alt)]'} hover:bg-[var(--table-row-hover)] transition-colors`}
                  >
                    <td className="p-4 text-[var(--text-secondary)] font-medium font-inter">
                      {new Date(mov.data).toLocaleString('pt-BR')}
                    </td>
                    <td className="p-4">
                      {mov.tipo === 'entrada' ? (
                        <span className="inline-flex items-center gap-1 bg-[rgba(81,117,102,0.25)] text-[#6FCF97] border border-[rgba(81,117,102,0.40)] font-oswald uppercase tracking-wider font-semibold text-[10px] px-2.5 py-0.5 rounded-full">
                          <ArrowUpRight className="w-3 h-3" />
                          Entrada (Reposição)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-[rgba(235,87,87,0.15)] text-[#EB5757] border border-[rgba(235,87,87,0.35)] font-oswald uppercase tracking-wider font-semibold text-[10px] px-2.5 py-0.5 rounded-full">
                          <ArrowDownRight className="w-3 h-3" />
                          Saída (Atendimento)
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-[var(--text-primary)] font-inter">
                      {mov.produto?.nome || 'Produto'}
                    </td>
                    <td className="p-4 font-display text-sm font-bold text-[var(--text-primary)]">
                      {mov.quantidade} {mov.produto?.unidade || 'un'}
                    </td>
                    <td className="p-4 text-[var(--text-secondary)] font-inter">
                      {mov.motivo}
                    </td>
                    <td className="p-4 text-[var(--text-muted)] font-inter font-medium">
                      {mov.usuario?.nome || 'Sistema'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL NOVO / EDITAR PRODUTO                                               */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[var(--bg-surface)] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--border)] my-auto text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
                <h3 className="font-display uppercase tracking-wide text-base sm:text-lg text-[var(--text-primary)]">
                  {editingProduct ? 'Editar Ficha do Produto' : 'Cadastrar Novo Insumo na Pasta'}
                </h3>
              </div>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4">
              {/* Seleção de Pasta / Categoria */}
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1.5">
                  Pasta de Destino (Setor) *
                </label>
                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {['Barbearia', 'Tatuagem', 'Piercing', 'Bebidas', 'Descartáveis', 'Outra'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoria(cat)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold border transition-all ${
                        categoria === cat
                          ? 'bg-[var(--accent)] text-[#0B0E11] border-[var(--accent)] shadow-xs'
                          : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {cat === 'Bebidas' ? '🥤 Bebidas' : cat === 'Barbearia' ? '💈 Barbearia' : cat === 'Tatuagem' ? '🖋️ Tatuagem' : cat === 'Piercing' ? '💎 Piercing' : cat === 'Descartáveis' ? '🧤 Descartáveis' : '➕ Outra...'}
                    </button>
                  ))}
                </div>

                {categoria === 'Outra' && (
                  <input
                    type="text"
                    required
                    placeholder="Nome da nova categoria..."
                    value={customCategoria}
                    onChange={(e) => setCustomCategoria(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                  />
                )}
              </div>

              {/* Nome do Produto */}
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                  Nome do Produto / Marca *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cerveja Heineken (330ml) ou Tinta Dynamic Black"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              {/* Subcategoria / Pasta Interna do Insumo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold">
                    Subcategoria / Pasta Interna (Ex: Tintas, Agulhas, Pomadas)
                  </label>
                </div>
                {/* Sugestões rápidas baseadas na categoria */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {(categoria === 'Tatuagem'
                    ? ['Tintas', 'Agulhas & Cartuchos', 'Decalque & Cuidados', 'Higiene & Aftercare']
                    : categoria === 'Barbearia'
                    ? ['Pomadas & Finalizadores', 'Óleos & Barboterapia', 'Lâminas & Navalhas', 'Shampoos & Lavatório']
                    : categoria === 'Piercing'
                    ? ['Jóias & Titânio', 'Agulhas & Cateteres', 'Assepsia & Pinças']
                    : categoria === 'Descartáveis'
                    ? ['Luvas & Proteção', 'Papéis & Plásticos', 'Antissépticos & Higiene']
                    : ['Cervejas', 'Refrigerantes', 'Energéticos', 'Destilados', 'Águas']
                  ).map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setSubcategoria(sug)}
                      className={`px-2 py-0.5 text-[10px] font-oswald uppercase tracking-wider rounded-md border transition-all ${
                        subcategoria === sug
                          ? 'bg-[var(--accent)] text-[#0B0E11] font-bold border-[var(--accent)]'
                          : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Digite ou escolha uma subcategoria acima..."
                  value={subcategoria}
                  onChange={(e) => setSubcategoria(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              {/* Setor Destinado / Quem pode lançar no portal do colaborador */}
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1.5">
                  Quem pode registrar consumo deste produto no portal? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {[
                    { key: 'barbearia', label: '💈 Apenas Barbearia', desc: 'Disponível apenas para barbeiros' },
                    { key: 'tatuagem', label: '🎨 Apenas Tatuadores', desc: 'Disponível apenas para tatuadores' },
                    { key: 'piercing', label: '💎 Apenas Body Piercing', desc: 'Disponível apenas para piercers' },
                    { key: 'todos', label: '🌐 Todos (Geral / Compartilhado)', desc: 'Luvas, papel e insumos gerais' },
                    { key: 'nenhum', label: '🚫 Nenhum (Apenas Venda / Frigobar)', desc: 'Bebidas e produtos de venda' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSetorDestinado(opt.key as any)}
                      className={`p-2 rounded-xl text-left border transition-all ${
                        setorDestinado === opt.key
                          ? 'bg-[var(--accent)]/15 border-[var(--accent)] shadow-xs'
                          : 'bg-[var(--bg-surface-alt)] border-[var(--border)] hover:border-[var(--accent)]/50'
                      }`}
                    >
                      <div className="text-xs font-oswald uppercase tracking-wider font-bold text-[var(--text-primary)]">
                        {opt.label}
                      </div>
                      <div className="text-[10px] text-[var(--text-secondary)] font-inter mt-0.5">
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Unidade de Medida */}
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1.5">
                  Unidade de Embalagem / Medida *
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['un', 'lata', 'garrafa', 'dose', 'cx', 'ml', 'g', 'par'].map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setUnidade(u as any)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all ${
                        unidade === u
                          ? 'bg-[var(--accent)] text-[#0B0E11] border-[var(--accent)] shadow-xs'
                          : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valores e Quantidades */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                    Custo Unitário (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={custoUnitario}
                    onChange={(e) => setCustoUnitario(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-display text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={estoqueAtual}
                    onChange={(e) => setEstoqueAtual(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-display text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                    Alerta Mínimo
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(parseFloat(e.target.value) || 1)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-display text-sm font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-[var(--border)]">
                <div>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(editingProduct)}
                      className="px-3.5 py-2 text-xs font-oswald uppercase tracking-wider font-semibold text-[#EB5757] hover:bg-[#EB5757]/10 rounded-lg transition-colors border border-[#EB5757]/40 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      Excluir Produto
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="px-4 py-2 text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] text-xs font-oswald uppercase tracking-wider font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-accent"
                  >
                    <Check className="w-4 h-4" />
                    Salvar Ficha
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL ENTRADA DE ESTOQUE                                                  */}
      {/* ========================================================================= */}
      {isEntradaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[var(--bg-surface)] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--border)] my-auto text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-[#6FCF97]" />
                <h3 className="font-display uppercase tracking-wide text-base sm:text-lg text-[var(--text-primary)]">
                  Registrar Entrada de Estoque (Reposição)
                </h3>
              </div>
              <button
                onClick={() => setIsEntradaModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntrada} className="mt-4 space-y-4">
              {/* Filtro prévio por categoria no seletor */}
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1.5">
                  Filtrar por Pasta para Localizar Mais Rápido
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['TODAS', ...availableCategories].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEntradaCategoriaFiltro(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-oswald uppercase tracking-wider font-semibold border transition-all ${
                        entradaCategoriaFiltro === cat
                          ? 'bg-[var(--accent)] text-[#0B0E11] border-[var(--accent)]'
                          : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border)]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                  Produto a Repor *
                </label>
                <select
                  required
                  value={entradaProdutoId}
                  onChange={(e) => setEntradaProdutoId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter font-medium"
                >
                  {produtosParaEntrada.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.categoria}] {p.nome} (Atual: {p.estoque_atual} {p.unidade} | Mín: {p.estoque_minimo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                  Quantidade a Adicionar *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={entradaQuantidade}
                  onChange={(e) => setEntradaQuantidade(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-display text-base font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                  Motivo / Nota Fiscal / Fornecedor
                </label>
                <input
                  type="text"
                  placeholder="Ex: Nota Fiscal 4521 - Distribuidora Salvador ou Reposição balcão"
                  value={entradaMotivo}
                  onChange={(e) => setEntradaMotivo(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsEntradaModalOpen(false)}
                  className="px-4 py-2 text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] text-xs font-oswald uppercase tracking-wider font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-accent"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Confirmar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
