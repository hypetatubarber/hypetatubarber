import React, { useState, useEffect } from 'react';
import { X, Package, Check, AlertCircle } from 'lucide-react';
import { Produto, Agendamento, UsoProduto } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  linkedAgendamentoId?: string;
  onSaved: () => void;
}

export const MaterialUsageModal: React.FC<Props> = ({
  isOpen,
  onClose,
  linkedAgendamentoId,
  onSaved,
}) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  
  const [produtoId, setProdutoId] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [data, setData] = useState<string>(new Date().toISOString().split('T')[0]);
  const [agendamentoId, setAgendamentoId] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodList, agList] = await Promise.all([
          api.getProdutos(),
          currentUser ? api.getAgendamentosByColaborador(currentUser.id) : api.getAgendamentos(),
        ]);
        setProdutos(prodList);
        setAgendamentos(agList);
        if (prodList.length > 0 && !produtoId) {
          setProdutoId(prodList[0].id);
        }
      } catch (err) {
        console.error('Erro ao carregar produtos para lançamento:', err);
      }
    };

    if (isOpen) {
      loadData();
      if (linkedAgendamentoId) {
        setAgendamentoId(linkedAgendamentoId);
      }
      setQuantidade(1);
      setObservacao('');
    }
  }, [isOpen, linkedAgendamentoId, currentUser]);

  const selectedProduct = produtos.find((p) => p.id === produtoId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
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
        id: 'uso-' + Date.now(),
        colaborador_id: currentUser.id,
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 my-auto text-[var(--text-primary)]">
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
            <h3 className="font-display uppercase tracking-wide text-base sm:text-lg text-[var(--text-primary)]">
              Registrar Material Usado
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Produto */}
          <div>
            <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Produto / Insumo *</label>
            <select
              required
              value={produtoId}
              onChange={(e) => setProdutoId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
            >
              {produtos.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.nome} — Estoque atual: {prod.estoque_atual} {prod.unidade}
                </option>
              ))}
            </select>
            {selectedProduct && (
              <div className="mt-1 flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-inter">
                <span>Unidade: <strong>{selectedProduct.unidade}</strong></span>
                <span className={selectedProduct.estoque_atual <= selectedProduct.estoque_minimo ? 'text-[#EB5757] font-bold' : 'text-[var(--accent-dark)] dark:text-[var(--accent)]'}>
                  Disponível: {selectedProduct.estoque_atual} {selectedProduct.unidade}
                </span>
              </div>
            )}
          </div>

          {/* Quantidade */}
          <div>
            <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
              Quantidade Utilizada * ({selectedProduct?.unidade || 'unidade'})
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              required
              value={quantidade}
              onChange={(e) => setQuantidade(parseFloat(e.target.value) || 0)}
              className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-display text-sm"
            />
          </div>

          {/* Data */}
          <div>
            <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Data do Uso *</label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
            />
          </div>

          {/* Vincular a Atendimento (Opcional) */}
          <div>
            <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
              Vincular a Atendimento (Opcional)
            </label>
            <select
              value={agendamentoId}
              onChange={(e) => setAgendamentoId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
            >
              <option value="">Sem vínculo específico</option>
              {agendamentos.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  {ag.data} às {ag.hora_inicio} — {ag.cliente?.nome} ({ag.servico?.nome})
                </option>
              ))}
            </select>
          </div>

          {/* Observação */}
          <div>
            <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Observações (opcional)</label>
            <input
              type="text"
              placeholder="Ex: Tinta usada no fechamento de braço"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
            />
          </div>

          {/* Informação sobre baixa automática */}
          <div className="p-3 bg-[var(--bg-surface-alt)] rounded-xl border border-[var(--border)] flex items-start gap-2 text-[11px] text-[var(--text-secondary)] font-inter">
            <AlertCircle className="w-4 h-4 text-[var(--accent-dark)] dark:text-[var(--accent)] shrink-0 mt-0.5" />
            <span>
              Ao salvar, a quantidade informada será abatida automaticamente do inventário geral e contabilizada no seu relatório de consumo.
            </span>
          </div>

          {/* Ações */}
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
              disabled={loading}
              className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-accent"
            >
              <Check className="w-4 h-4" />
              {loading ? 'Registrando...' : 'Registrar e Abater Estoque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
