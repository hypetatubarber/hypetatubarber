import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Check, Clock, X } from 'lucide-react';
import { Servico, CategoriaServico } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const ServiceList: React.FC = () => {
  const { showToast } = useToast();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Servico | null>(null);
  const [nome, setNome] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [duracaoMinutos, setDuracaoMinutos] = useState(45);
  const [preco, setPreco] = useState(60);
  const [ativo, setAtivo] = useState(true);

  const loadData = async () => {
    try {
      const [sList, cList] = await Promise.all([api.getServicos(), api.getCategorias()]);
      setServicos(sList);
      setCategorias(cList);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (srv?: Servico) => {
    if (srv) {
      setEditingService(srv);
      setNome(srv.nome);
      setCategoriaId(srv.categoria_id);
      setDescricao(srv.descricao || '');
      setDuracaoMinutos(srv.duracao_minutos);
      setPreco(srv.preco);
      setAtivo(srv.ativo);
    } else {
      setEditingService(null);
      setNome('');
      setCategoriaId(categorias[0]?.id || '');
      setDescricao('');
      setDuracaoMinutos(45);
      setPreco(50);
      setAtivo(true);
    }
    setIsModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !categoriaId) {
      showToast('Preencha o nome e a categoria do serviço.', 'warning');
      return;
    }

    try {
      const srvData: Servico = {
        id: editingService ? editingService.id : 'srv-' + Date.now(),
        categoria_id: categoriaId,
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        duracao_minutos: Number(duracaoMinutos),
        preco: Number(preco),
        ativo,
      };

      await api.saveServico(srvData);
      showToast(
        editingService ? 'Serviço atualizado com sucesso!' : 'Novo serviço criado com sucesso!',
        'success'
      );
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar serviço.', 'error');
    }
  };

  const handleToggleAtivo = async (srv: Servico) => {
    try {
      await api.saveServico({ ...srv, ativo: !srv.ativo });
      showToast(`Serviço "${srv.nome}" ${!srv.ativo ? 'ativado' : 'desativado'} com sucesso!`, 'info');
      loadData();
    } catch (err) {
      showToast('Erro ao atualizar status do serviço.', 'error');
    }
  };

  const filtered = selectedCatId === 'all'
    ? servicos
    : servicos.filter((s) => s.categoria_id === selectedCatId);

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Topo: Filtros & Botão Novo Serviço */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft">
        <div>
          <h2 className="font-display uppercase tracking-wide text-xl text-[var(--text-primary)]">
            Catálogo de Serviços & Preços
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-inter">
            Configure serviços, durações em minutos e valores para Barbearia, Tatuagem e Piercing.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] rounded-xl text-xs font-oswald uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all shadow-accent"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {/* Abas por Categoria */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCatId('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-oswald uppercase tracking-wider font-bold transition-all ${
            selectedCatId === 'all'
              ? 'bg-[var(--accent)] text-[#0B0E11] shadow-accent'
              : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
          }`}
        >
          Todos os Serviços ({servicos.length})
        </button>
        {categorias.map((cat) => {
          const count = servicos.filter((s) => s.categoria_id === cat.id).length;
          const isSelected = selectedCatId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCatId(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-oswald uppercase tracking-wider font-bold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[var(--accent)] text-[#0B0E11] shadow-accent'
                  : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: cat.cor_identificacao }}
              />
              {cat.nome} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid de Serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((srv) => (
          <div
            key={srv.id}
            className={`bg-[var(--bg-surface)] rounded-xl p-5 border transition-all shadow-soft flex flex-col justify-between ${
              srv.ativo ? 'border-[var(--border)] hover:border-[var(--accent)]' : 'border-[var(--border)] opacity-60 bg-[var(--bg-surface-alt)]/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className="text-[10px] font-oswald uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: srv.categoria?.cor_identificacao || '#517566' }}
                >
                  {srv.categoria?.nome || 'Serviço'}
                </span>
                <span
                  className={`text-[10px] font-oswald uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full ${
                    srv.ativo
                      ? 'bg-[rgba(81,117,102,0.25)] text-[#6FCF97] border border-[rgba(81,117,102,0.40)]'
                      : 'bg-[rgba(235,87,87,0.15)] text-[#EB5757] border border-[rgba(235,87,87,0.35)]'
                  }`}
                >
                  {srv.ativo ? 'Ativo' : 'Desativado'}
                </span>
              </div>

              <h3 className="font-display uppercase tracking-wide text-base text-[var(--text-primary)]">{srv.nome}</h3>
              {srv.descricao && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed font-inter">
                  {srv.descricao}
                </p>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <div>
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-1 font-inter">
                  <Clock className="w-3 h-3 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
                  {srv.duracao_minutos} minutos
                </div>
                <div className="text-lg font-display text-[var(--text-primary)] mt-0.5">
                  R$ {srv.preco.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-1.5 font-oswald uppercase">
                <button
                  onClick={() => handleToggleAtivo(srv)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                    srv.ativo
                      ? 'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]'
                      : 'border-[rgba(81,117,102,0.40)] text-[#6FCF97] bg-[rgba(81,117,102,0.20)]'
                  }`}
                  title={srv.ativo ? 'Desativar serviço' : 'Ativar serviço'}
                >
                  {srv.ativo ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => handleOpenModal(srv)}
                  className="p-1.5 text-[var(--accent-dark)] dark:text-[var(--accent)] hover:bg-[var(--accent-bg)] rounded-lg transition-colors"
                  title="Editar serviço"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[var(--bg-surface)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 my-auto text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <h3 className="font-display uppercase tracking-wide text-base sm:text-lg text-[var(--text-primary)]">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Nome do Serviço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Masculino Degradê"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Categoria *</label>
                <select
                  required
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-oswald uppercase tracking-wider font-semibold"
                >
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Descrição</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Inclui lavagem refrescante e penteado com pomada..."
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Duração (Minutos) *</label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    required
                    value={duracaoMinutos}
                    onChange={(e) => setDuracaoMinutos(parseInt(e.target.value) || 30)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-display text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={preco}
                    onChange={(e) => setPreco(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-display text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ativoCheckbox"
                  checked={ativo}
                  onChange={(e) => setAtivo(e.target.checked)}
                  className="w-4 h-4 rounded bg-[var(--bg-surface-alt)] border-[var(--border)] text-[var(--accent-dark)] dark:text-[var(--accent)] focus:ring-[#8CBDAD]"
                />
                <label htmlFor="ativoCheckbox" className="text-xs font-inter text-[var(--text-secondary)]">
                  Serviço disponível para agendamento
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] text-xs font-oswald uppercase tracking-wider font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-accent"
                >
                  <Check className="w-4 h-4" />
                  Salvar Serviço
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
