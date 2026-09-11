import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Package,
  Check,
  AlertCircle,
  Folder,
  Search,
  Minus,
  Plus,
  Layers,
} from 'lucide-react';
import { Produto, Agendamento, UsoProduto, Usuario } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { generateUUID } from '../../lib/uuid';
import { getProductSetor, getProductSubcategoria, getColaboradorSetor } from '../../services/mockData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  linkedAgendamentoId?: string;
  onSaved: () => void;
  colaborador?: Usuario | null;
}

export const MaterialUsageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  linkedAgendamentoId,
  onSaved,
  colaborador,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  
  // Filtros de seleção
  const [selectedSubcategoria, setSelectedSubcategoria] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Campos do formulário
  const [produtoId, setProdutoId] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [agendamentoId, setAgendamentoId] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const activeUser = colaborador || currentUser;
  const userSetor = getColaboradorSetor(activeUser);

  const loadData = async () => {
    try {
      const [prodList, agList] = await Promise.all([
        api.getProdutos(),
        activeUser ? api.getAgendamentosByColaborador(activeUser.id) : api.getAgendamentos(),
      ]);
      setProdutos(prodList);
      setAgendamentos(agList);
    } catch (err) {
      console.error('Erro ao carregar produtos para lançamento:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      if (linkedAgendamentoId) {
        setAgendamentoId(linkedAgendamentoId);
      }
      setQuantidade(1);
      setObservacao('');
      setSearchQuery('');
      setSelectedSubcategoria('all');
    }
  }, [isOpen, linkedAgendamentoId, activeUser?.id]);

  // Filtra apenas produtos permitidos para o setor do colaborador
  // (Ex: Barbeiro só vê produtos de Barbearia e insumos compartilhados 'todos', como luvas/álcool; Tatuador só vê Tatuagem e 'todos')
  const availableProducts = useMemo(() => {
    return produtos.filter((p) => {
      const pSetor = p.setor_destinado || getProductSetor(p);
      // Itens marcados como 'nenhum' são bebidas ou revenda exclusiva de recepção, não são insumos de bancada
      if (pSetor === 'nenhum') return false;

      // Se o usuário logado for Master ou Geral, pode ver tudo
      if (userSetor === 'todos') return true;

      // Se for barbeiro, vê 'barbearia' e 'todos'
      // Se for tatuador, vê 'tatuagem' e 'todos'
      // Se for piercer, vê 'piercing' e 'todos'
      return pSetor === userSetor || pSetor === 'todos';
    });
  }, [produtos, userSetor]);

  // Pastas / Subcategorias disponíveis para este setor
  const subpastas = useMemo(() => {
    const foldersMap = new Map<string, Produto[]>();
    availableProducts.forEach((p) => {
      const sub = p.subcategoria || getProductSubcategoria(p);
      if (!foldersMap.has(sub)) {
        foldersMap.set(sub, []);
      }
      foldersMap.get(sub)!.push(p);
    });

    return Array.from(foldersMap.entries()).map(([nome, itens]) => ({
      nome,
      itens,
      count: itens.length,
    }));
  }, [availableProducts]);

  // Produtos filtrados por pasta selecionada e termo de busca
  const displayedProducts = useMemo(() => {
    let list = availableProducts;
    if (selectedSubcategoria !== 'all') {
      list = list.filter((p) => (p.subcategoria || getProductSubcategoria(p)) === selectedSubcategoria);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          (p.subcategoria || '').toLowerCase().includes(q) ||
          p.unidade.toLowerCase().includes(q)
      );
    }
    return list;
  }, [availableProducts, selectedSubcategoria, searchQuery]);

  // Garante seleção inicial válida
  useEffect(() => {
    if (availableProducts.length > 0) {
      if (!produtoId || !availableProducts.some((p) => p.id === produtoId)) {
        setProdutoId(availableProducts[0].id);
      }
    }
  }, [availableProducts, produtoId]);

  const selectedProduct = useMemo(() => {
    return produtos.find((p) => p.id === produtoId);
  }, [produtos, produtoId]);

  const handleStepQuantity = (delta: number) => {
    setQuantidade((prev) => {
      const nextVal = Math.round((Number(prev) + delta) * 10) / 10;
      return nextVal > 0 ? nextVal : 0.1;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeUser) {
      showToast('Usuário não autenticado.', 'error');
      return;
    }

    if (!produtoId || quantidade <= 0) {
      showToast('Selecione um produto e informe uma quantidade válida maior que zero.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const novoUso: UsoProduto = {
        id: generateUUID(),
        colaborador_id: activeUser.id,
        produto_id: produtoId,
        quantidade: Number(quantidade),
        data,
        agendamento_id: agendamentoId || undefined,
        observacao: observacao.trim() || undefined,
        criado_em: new Date().toISOString(),
      };

      await api.registrarUsoProduto(novoUso);
      showToast(
        `Consumo de ${quantidade} ${selectedProduct?.unidade} de "${selectedProduct?.nome}" registrado com sucesso! Estoque abatido.`,
        'success'
      );
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Erro ao registrar material.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const remainingStock = selectedProduct ? selectedProduct.estoque_atual - quantidade : 0;
  const isInsufficientStock = selectedProduct ? quantidade > selectedProduct.estoque_atual : false;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 my-auto text-[var(--text-primary)] overflow-hidden">
        
        {/* CABEÇALHO DO MODAL */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--bg-surface)]">
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
              <h3 className="font-display uppercase tracking-wide text-base sm:text-lg text-[var(--text-primary)]">
                Registrar Material Usado
              </h3>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] uppercase font-oswald tracking-wider font-semibold text-[var(--text-muted)]">
                Profissional:
              </span>
              <span className="text-xs font-semibold text-[var(--text-primary)] font-inter">
                {activeUser?.nome || 'Colaborador'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md font-oswald uppercase tracking-wider font-bold bg-[var(--accent)]/15 text-[var(--accent-dark)] dark:text-[var(--accent)] border border-[var(--accent)]/30">
                {userSetor === 'barbearia' && '💈 Barbearia'}
                {userSetor === 'tatuagem' && '🎨 Tatuagem'}
                {userSetor === 'piercing' && '💎 Piercing'}
                {userSetor === 'todos' && '🌐 Geral / Estúdio'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DO FORMULÁRIO COM ROLAGEM */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* SELEÇÃO POR PASTAS / SUBCATEGORIAS */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5" />
                Pastas de Insumos ({availableProducts.length} itens do seu setor)
              </label>
              {selectedSubcategoria !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedSubcategoria('all')}
                  className="text-[11px] font-oswald uppercase text-[var(--accent-dark)] dark:text-[var(--accent)] hover:underline font-semibold"
                >
                  Limpar Pasta
                </button>
              )}
            </div>

            {/* Fita de Pastas */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              <button
                type="button"
                onClick={() => setSelectedSubcategoria('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-oswald uppercase tracking-wider font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedSubcategoria === 'all'
                    ? 'bg-[var(--accent)] text-[#0B0E11] shadow-accent font-bold'
                    : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Todas ({availableProducts.length})
              </button>

              {subpastas.map((pasta) => {
                const isSelected = selectedSubcategoria === pasta.nome;
                return (
                  <button
                    key={pasta.nome}
                    type="button"
                    onClick={() => setSelectedSubcategoria(pasta.nome)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-oswald uppercase tracking-wider font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                      isSelected
                        ? 'bg-[var(--accent)] text-[#0B0E11] shadow-accent font-bold'
                        : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5" />
                    {pasta.nome} ({pasta.count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* CAMPO DE BUSCA RÁPIDA */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar insumo por nome, subcategoria ou unidade..."
              className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* LISTA / GRID DE PRODUTOS DA PASTA (FICHAS CLICÁVEIS) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-oswald uppercase tracking-wider font-semibold text-[var(--text-secondary)]">
                Escolha o Insumo Utilizado ({displayedProducts.length} opções disponíveis)
              </span>
            </div>

            {displayedProducts.length === 0 ? (
              <div className="p-6 text-center bg-[var(--bg-surface-alt)] rounded-xl border border-[var(--border)]">
                <Package className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-1.5 opacity-50" />
                <div className="text-xs font-display uppercase tracking-wider text-[var(--text-primary)]">
                  Nenhum insumo encontrado nesta pasta
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  Tente limpar a busca ou selecionar outra pasta acima.
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-[var(--border)] rounded-xl bg-[var(--bg-surface-alt)]/50">
                {displayedProducts.map((prod) => {
                  const isSelected = prod.id === produtoId;
                  const isLow = prod.estoque_atual <= prod.estoque_minimo;
                  const subName = prod.subcategoria || getProductSubcategoria(prod);

                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => setProdutoId(prod.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-[var(--accent)] bg-[var(--accent)]/15 shadow-xs ring-1 ring-[var(--accent)]'
                          : 'border-[var(--border)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/50'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9px] font-oswald uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--bg-surface-alt)] border border-[var(--border)] text-[var(--text-muted)]">
                            {subName}
                          </span>
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-oswald uppercase tracking-wider font-bold text-[var(--accent-dark)] dark:text-[var(--accent)]">
                              <Check className="w-3 h-3" /> Selecionado
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-[var(--text-primary)] font-inter line-clamp-1">
                          {prod.nome}
                        </div>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-[10px] font-inter pt-1.5 border-t border-[var(--border)]/50">
                        <span className="text-[var(--text-muted)]">Unid: {prod.unidade}</span>
                        <span
                          className={`font-bold ${
                            isLow ? 'text-[#EB5757]' : 'text-[#6FCF97]'
                          }`}
                        >
                          Saldo: {prod.estoque_atual} {prod.unidade}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* PRODUTO SELECIONADO & CONTROLE DE QUANTIDADE */}
          {selectedProduct && (
            <div className="p-3.5 bg-[var(--bg-surface-alt)] rounded-xl border border-[var(--accent)]/40 relative">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[9px] font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-bold block">
                    Insumo Selecionado
                  </span>
                  <div className="text-sm font-bold text-[var(--text-primary)] font-inter">
                    {selectedProduct.nome}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] font-inter mt-0.5">
                    Pasta: <span className="text-[var(--text-primary)] font-semibold">{selectedProduct.subcategoria || getProductSubcategoria(selectedProduct)}</span> • Saldo atual: <span className="text-[var(--text-primary)] font-bold">{selectedProduct.estoque_atual} {selectedProduct.unidade}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-oswald uppercase tracking-wider text-[var(--text-muted)] block">
                    Unidade
                  </span>
                  <span className="font-mono text-xs font-bold text-[var(--text-primary)] uppercase bg-[var(--bg-surface)] px-2 py-0.5 rounded border border-[var(--border)]">
                    {selectedProduct.unidade}
                  </span>
                </div>
              </div>

              {/* CONTROLE DE QUANTIDADE COM BOTÕES - E + */}
              <div className="bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border)]">
                <label className="text-[11px] font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1.5">
                  Quantidade a Lançar ({selectedProduct.unidade}) *
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleStepQuantity(-1)}
                    className="w-9 h-9 rounded-lg bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] transition-colors active:scale-95"
                    title="Diminuir 1"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    required
                    value={quantidade}
                    onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
                    className="flex-1 text-center py-2 text-base font-display font-bold rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none"
                  />

                  <button
                    type="button"
                    onClick={() => handleStepQuantity(1)}
                    className="w-9 h-9 rounded-lg bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] transition-colors active:scale-95"
                    title="Aumentar 1"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Saldo Restante / Alerta */}
                <div className="flex items-center justify-between text-[11px] font-inter mt-2 pt-2 border-t border-[var(--border)]/60">
                  <span className="text-[var(--text-muted)]">Saldo após baixa:</span>
                  <span
                    className={`font-semibold ${
                      isInsufficientStock ? 'text-[#EB5757] font-bold' : 'text-[#6FCF97]'
                    }`}
                  >
                    {remainingStock} {selectedProduct.unidade}
                    {isInsufficientStock && ' (Insuficiente!)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* DATA DO USO */}
          <div>
            <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
              Data do Uso *
            </label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
            />
          </div>

          {/* VINCULAR A ATENDIMENTO (OPCIONAL) */}
          <div>
            <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
              Vincular a Atendimento (Opcional)
            </label>
            <select
              value={agendamentoId}
              onChange={(e) => setAgendamentoId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
            >
              <option value="">Sem vínculo específico (Uso geral de bancada)</option>
              {agendamentos.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.data} às {ag.hora_inicio} — {ag.cliente?.nome} ({ag.servico?.nome})
                </option>
              ))}
            </select>
          </div>

          {/* OBSERVAÇÕES */}
          <div>
            <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Utilizado no cliente Marcos - degrade com toalha"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
            />
          </div>

          {/* AVISO DE BAIXA AUTOMÁTICA */}
          <div className="p-3 bg-[var(--bg-surface-alt)] rounded-xl border border-[var(--border)] flex items-start gap-2 text-[11px] text-[var(--text-secondary)] font-inter">
            <AlertCircle className="w-4 h-4 text-[var(--accent-dark)] dark:text-[var(--accent)] shrink-0 mt-0.5" />
            <span>
              Ao confirmar, a quantidade informada será abatida automaticamente do inventário e computada no seu relatório de consumo de insumos.
            </span>
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)] font-oswald uppercase">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedProduct || quantidade <= 0}
              className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] disabled:opacity-50 disabled:cursor-not-allowed text-[#0B0E11] hover:text-[var(--text-primary)] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-accent"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Registrando...' : 'Confirmar e Abater Estoque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
