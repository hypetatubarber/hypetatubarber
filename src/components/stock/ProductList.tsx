import React, { useState, useEffect } from 'react';
import { Plus, Package, AlertTriangle, ArrowDownRight, ArrowUpRight, Check, X } from 'lucide-react';
import { Produto, MovimentacaoEstoque } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface Props {
  readOnly?: boolean;
}

export const ProductList: React.FC<Props> = ({ readOnly = false }) => {
  const { showToast } = useToast();
  const { currentUser, role } = useAuth();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [activeTab, setActiveTab] = useState<'produtos' | 'movimentacoes'>('produtos');

  // Modal Novo / Editar Produto
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Tatuagem');
  const [unidade, setUnidade] = useState<any>('un');
  const [custoUnitario, setCustoUnitario] = useState(0);
  const [estoqueAtual, setEstoqueAtual] = useState(10);
  const [estoqueMinimo, setEstoqueMinimo] = useState(5);

  // Modal Entrada de Estoque
  const [isEntradaModalOpen, setIsEntradaModalOpen] = useState(false);
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
  }, []);

  const handleOpenProductModal = (prod?: Produto) => {
    if (prod) {
      setEditingProduct(prod);
      setNome(prod.nome);
      setCategoria(prod.categoria);
      setUnidade(prod.unidade);
      setCustoUnitario(prod.custo_unitario);
      setEstoqueAtual(prod.estoque_atual);
      setEstoqueMinimo(prod.estoque_minimo);
    } else {
      setEditingProduct(null);
      setNome('');
      setCategoria('Tatuagem');
      setUnidade('un');
      setCustoUnitario(25);
      setEstoqueAtual(10);
      setEstoqueMinimo(5);
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      showToast('Informe o nome do produto.', 'warning');
      return;
    }

    try {
      const prodData: Produto = {
        id: editingProduct ? editingProduct.id : 'prod-' + Date.now(),
        nome: nome.trim(),
        categoria,
        unidade,
        custo_unitario: Number(custoUnitario),
        estoque_atual: Number(estoqueAtual),
        estoque_minimo: Number(estoqueMinimo),
      };

      await api.saveProduto(prodData);
      showToast('Produto salvo no estoque com sucesso!', 'success');
      setIsProductModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar produto.', 'error');
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
        entradaMotivo.trim() || 'Entrada manual',
        currentUser?.id || 'admin'
      );
      showToast('Entrada de estoque registrada com sucesso!', 'success');
      setIsEntradaModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar entrada.', 'error');
    }
  };

  const lowStockCount = produtos.filter((p) => p.estoque_atual <= p.estoque_minimo).length;

  return (
    <div className="space-y-6">
      {/* Barra de Ações & Alertas */}
      <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[var(--text-primary)]">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
            <h2 className="font-display uppercase tracking-wide text-xl text-[var(--text-primary)]">
              Controle Geral de Estoque
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-inter">
            Monitoramento de níveis de estoque, compras de reposição e saídas por atendimento.
          </p>
        </div>

        {!readOnly && role === 'master' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEntradaModalOpen(true)}
              className="px-4 py-2.5 bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--accent)] rounded-xl text-xs font-oswald uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <ArrowUpRight className="w-4 h-4 text-[#6FCF97]" />
              Entrada de Estoque
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

      {/* Alerta Visual de Estoque Baixo */}
      {lowStockCount > 0 && (
        <div className="p-4 bg-[rgba(235,87,87,0.12)] border border-[rgba(235,87,87,0.30)] rounded-xl flex items-center gap-3 text-[#EB5757] animate-in fade-in">
          <div className="w-9 h-9 rounded-lg bg-[rgba(235,87,87,0.20)] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-[#EB5757]" />
          </div>
          <div>
            <h4 className="font-oswald uppercase tracking-wider text-xs sm:text-sm font-semibold text-[#EB5757]">
              Alerta: {lowStockCount} {lowStockCount === 1 ? 'produto está' : 'produtos estão'} no estoque mínimo ou abaixo!
            </h4>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5 font-inter">
              Faça a reposição necessária para evitar falta de insumos durante os atendimentos.
            </p>
          </div>
        </div>
      )}

      {/* Alternador de Abas: Produtos x Movimentações */}
      <div className="flex items-center gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab('produtos')}
          className={`px-4 py-2 rounded-xl text-xs font-oswald uppercase tracking-wider font-bold transition-all ${
            activeTab === 'produtos'
              ? 'bg-[var(--accent)] text-[#0B0E11] shadow-accent'
              : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
          }`}
        >
          Itens em Estoque ({produtos.length})
        </button>
        <button
          onClick={() => setActiveTab('movimentacoes')}
          className={`px-4 py-2 rounded-xl text-xs font-oswald uppercase tracking-wider font-bold transition-all ${
            activeTab === 'movimentacoes'
              ? 'bg-[var(--accent)] text-[#0B0E11] shadow-accent'
              : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
          }`}
        >
          Histórico de Entradas e Saídas ({movimentacoes.length})
        </button>
      </div>

      {/* TAB 1: LISTA DE PRODUTOS */}
      {activeTab === 'produtos' && (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-alt)] border-b border-[var(--border)] text-[var(--text-secondary)] font-oswald uppercase tracking-wider text-[12px] font-semibold">
                <tr>
                  <th className="p-4">Produto</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Estoque Atual</th>
                  <th className="p-4">Mínimo</th>
                  <th className="p-4">Custo Unitário</th>
                  <th className="p-4">Status</th>
                  {!readOnly && role === 'master' && <th className="p-4 text-right">Ação</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {produtos.map((prod, idx) => {
                  const isLow = prod.estoque_atual <= prod.estoque_minimo;
                  return (
                    <tr
                      key={prod.id}
                      className={`${idx % 2 === 0 ? 'bg-[var(--bg-surface)]' : 'bg-[var(--table-row-alt)]'} hover:bg-[var(--table-row-hover)] transition-colors`}
                    >
                      <td className="p-4 font-medium text-[var(--text-primary)] font-inter">
                        {prod.nome}
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-inter">
                        <span className="bg-[var(--bg-surface-alt)] border border-[var(--border)] px-2 py-0.5 rounded text-[11px] font-medium">
                          {prod.categoria}
                        </span>
                      </td>
                      <td className="p-4 font-inter">
                        <span className={`font-black text-sm ${isLow ? 'text-[#EB5757]' : 'text-[var(--text-primary)]'}`}>
                          {prod.estoque_atual}
                        </span>{' '}
                        <span className="text-[var(--text-muted)] font-medium">{prod.unidade}</span>
                      </td>
                      <td className="p-4 text-[var(--text-secondary)] font-medium font-inter">
                        {prod.estoque_minimo} {prod.unidade}
                      </td>
                      <td className="p-4 text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold font-inter">
                        R$ {prod.custo_unitario.toFixed(2)}
                      </td>
                      <td className="p-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 bg-[rgba(235,87,87,0.15)] text-[#EB5757] border border-[rgba(235,87,87,0.35)] text-[10px] font-oswald uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            Estoque Baixo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-[rgba(81,117,102,0.25)] text-[#6FCF97] border border-[rgba(81,117,102,0.40)] text-[10px] font-oswald uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            Normal
                          </span>
                        )}
                      </td>
                      {!readOnly && role === 'master' && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleOpenProductModal(prod)}
                            className="text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--accent-dark)] dark:text-[var(--accent)] hover:bg-[var(--accent-bg)] px-2.5 py-1 rounded transition-colors"
                          >
                            Editar
                          </button>
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

      {/* TAB 2: MOVIMENTAÇÕES DE ENTRADA E SAÍDA */}
      {activeTab === 'movimentacoes' && (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] shadow-soft overflow-hidden">
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
                        <span className="inline-flex items-center gap-1 bg-[rgba(81,117,102,0.25)] text-[#6FCF97] border border-[rgba(81,117,102,0.40)] font-oswald uppercase tracking-wider font-semibold text-[10px] px-2.5 py-0.5 rounded">
                          <ArrowUpRight className="w-3 h-3" />
                          Entrada (Compra)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-[rgba(235,87,87,0.15)] text-[#EB5757] border border-[rgba(235,87,87,0.35)] font-oswald uppercase tracking-wider font-semibold text-[10px] px-2.5 py-0.5 rounded">
                          <ArrowDownRight className="w-3 h-3" />
                          Saída (Uso)
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-[var(--text-primary)] font-inter">
                      {mov.produto?.nome || 'Produto'}
                    </td>
                    <td className="p-4 font-display text-sm text-[var(--text-primary)]">
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

      {/* MODAL NOVO / EDITAR PRODUTO */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[var(--bg-surface)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--border)] my-auto text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <h3 className="font-display uppercase tracking-wide text-base sm:text-lg text-[var(--text-primary)]">
                {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Insumo'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Nome do Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tinta Dynamic Black (240ml)"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Categoria *</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-oswald uppercase tracking-wider font-semibold"
                  >
                    <option value="Tatuagem">Tatuagem</option>
                    <option value="Barbearia">Barbearia</option>
                    <option value="Piercing">Piercing</option>
                    <option value="Geral">Geral / Higiene</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Unidade *</label>
                  <select
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-oswald uppercase tracking-wider font-semibold"
                  >
                    <option value="un">un (unidade)</option>
                    <option value="cx">cx (caixa)</option>
                    <option value="ml">ml (mililitros)</option>
                    <option value="g">g (gramas)</option>
                    <option value="par">par</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Custo (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={custoUnitario}
                    onChange={(e) => setCustoUnitario(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-display text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Estoque Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={estoqueAtual}
                    onChange={(e) => setEstoqueAtual(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-display text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Alerta Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(parseFloat(e.target.value) || 1)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-display text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
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
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ENTRADA DE ESTOQUE */}
      {isEntradaModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[var(--bg-surface)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--border)] my-auto text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <h3 className="font-display uppercase tracking-wide text-base sm:text-lg text-[var(--text-primary)]">
                Registrar Entrada de Estoque
              </h3>
              <button
                onClick={() => setIsEntradaModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntrada} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Produto a Repor *</label>
                <select
                  required
                  value={entradaProdutoId}
                  onChange={(e) => setEntradaProdutoId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                >
                  {produtos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} (Atual: {p.estoque_atual} {p.unidade})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Quantidade a Adicionar *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={entradaQuantidade}
                  onChange={(e) => setEntradaQuantidade(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-display text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Motivo / Nota Fiscal</label>
                <input
                  type="text"
                  placeholder="Ex: Compra quinzenal distribuidora Salvador"
                  value={entradaMotivo}
                  onChange={(e) => setEntradaMotivo(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
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
