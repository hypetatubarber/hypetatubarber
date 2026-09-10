import React, { useState, useEffect } from 'react';
import {
  Search,
  UserPlus,
  Phone,
  Mail,
  Tag,
  X,
  Check,
  History,
  Users,
  Award,
  DollarSign,
  TrendingUp,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Cliente, Agendamento } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { AppointmentStatusBadge } from '../appointments/AppointmentStatusBadge';

export const ClientList: React.FC = () => {
  const { showToast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterTag, setSelectedFilterTag] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal Novo / Editar Cliente
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  // Modal Histórico
  const [selectedClientForHistory, setSelectedClientForHistory] = useState<Cliente | null>(null);

  const PRESET_TAGS = ['Cliente VIP', 'Barbearia', 'Tatuagem', 'Piercing', 'Pele Sensível', 'Alergia a Iodo'];

  const loadData = async () => {
    try {
      const [cliList, agList] = await Promise.all([api.getClientes(), api.getAgendamentos()]);
      setClientes(cliList);
      setAgendamentos(agList);
    } catch (err) {
      console.error('Erro ao carregar base de clientes:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (cli?: Cliente) => {
    if (cli) {
      setEditingClient(cli);
      setNome(cli.nome);
      setTelefone(cli.telefone);
      setEmail(cli.email || '');
      setObservacoes(cli.observacoes || '');
      setSelectedTags(cli.tags || []);
    } else {
      setEditingClient(null);
      setNome('');
      setTelefone('');
      setEmail('');
      setObservacoes('');
      setSelectedTags(['Barbearia']);
    }
    setCustomTagInput('');
    setIsModalOpen(true);
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    if (customTagInput.trim() && !selectedTags.includes(customTagInput.trim())) {
      setSelectedTags([...selectedTags, customTagInput.trim()]);
      setCustomTagInput('');
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !telefone.trim()) {
      showToast('Nome e Telefone são obrigatórios.', 'warning');
      return;
    }

    try {
      const clientData: Cliente = {
        id: editingClient ? editingClient.id : 'cli-' + Date.now(),
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim() || undefined,
        observacoes: observacoes.trim() || undefined,
        tags: selectedTags,
        criado_em: editingClient?.criado_em || new Date().toISOString(),
      };

      await api.saveCliente(clientData);
      showToast('Cliente salvo na base com sucesso!', 'success');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar cliente.', 'error');
    }
  };

  // Métricas da base de clientes
  const totalClientes = clientes.length;
  const vipCount = clientes.filter((c) => c.tags?.includes('Cliente VIP')).length;
  const totalAtendimentosBase = agendamentos.filter((a) => a.status !== 'cancelado').length;
  const totalFaturamentoAcumulado = agendamentos
    .filter((a) => a.status === 'concluido' || a.status === 'confirmado' || a.status === 'em_atendimento')
    .reduce((sum, a) => sum + (a.servico?.preco || 0), 0);

  // Filtragem da base
  const filtered = clientes.filter((c) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      c.nome.toLowerCase().includes(term) ||
      c.telefone.includes(term) ||
      (c.email && c.email.toLowerCase().includes(term));

    if (!matchesSearch) return false;

    if (selectedFilterTag !== 'all') {
      return c.tags?.includes(selectedFilterTag);
    }

    return true;
  });

  // Histórico do cliente selecionado
  const clientHistory = selectedClientForHistory
    ? agendamentos.filter((a) => a.cliente_id === selectedClientForHistory.id)
    : [];

  const clientTotalSpent = clientHistory
    .filter((a) => a.status !== 'cancelado')
    .reduce((sum, a) => sum + (a.servico?.preco || 0), 0);

  return (
    <div className="space-y-6">
      {/* Topo Principal: Título, Métricas & Ações */}
      <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4 text-[var(--text-primary)]">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
            <h2 className="font-display uppercase tracking-wide text-xl text-[var(--text-primary)]">
              Base de Clientes & CRM
            </h2>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-inter">
            Cadastre, acompanhe o histórico de visitas e mantenha toda a base de clientes do Hype Tatu segura e centralizada.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] rounded-xl text-xs font-oswald uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all shadow-accent shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          + Cadastrar Novo Cliente
        </button>
      </div>

      {/* Cards de Métricas da Base */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-dark)] dark:text-[var(--accent)] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase tracking-wider font-semibold">Total na Base</div>
            <div className="font-display text-2xl text-[var(--text-primary)] mt-0.5">
              {totalClientes} clientes
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-dark)] dark:text-[var(--accent)] shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase tracking-wider font-semibold">Clientes VIP</div>
            <div className="font-display text-2xl text-[var(--text-primary)] mt-0.5">
              {vipCount} fidelizados
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-dark)] dark:text-[var(--accent)] shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase tracking-wider font-semibold">Atendimentos na Base</div>
            <div className="font-display text-2xl text-[var(--text-primary)] mt-0.5">
              {totalAtendimentosBase} visitas
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-dark)] dark:text-[var(--accent)] shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase tracking-wider font-semibold">Faturamento Acumulado</div>
            <div className="font-display text-2xl text-[var(--text-primary)] mt-0.5">
              R$ {totalFaturamentoAcumulado.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros, Busca & Alternador de Visão */}
      <div className="bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border)] shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Chips de Tags */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl">
          <button
            onClick={() => setSelectedFilterTag('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider font-bold whitespace-nowrap transition-all ${
              selectedFilterTag === 'all'
                ? 'bg-[var(--accent)] text-[#0B0E11] shadow-accent'
                : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
            }`}
          >
            Todos ({totalClientes})
          </button>
          {['Cliente VIP', 'Barbearia', 'Tatuagem', 'Piercing'].map((tag) => {
            const count = clientes.filter((c) => c.tags?.includes(tag)).length;
            const isSelected = selectedFilterTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedFilterTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-oswald uppercase tracking-wider font-bold whitespace-nowrap transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[var(--accent)] text-[#0B0E11] shadow-accent'
                    : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
                }`}
              >
                <Tag className="w-3 h-3" />
                {tag} ({count})
              </button>
            );
          })}
        </div>

        {/* Busca e Botões de Visão (Tabela / Cards) */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por nome ou fone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[var(--bg-surface-alt)] border border-[var(--border)] rounded-xl text-xs font-inter text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors"
            />
          </div>

          <div className="flex items-center border border-[var(--border)] rounded-xl overflow-hidden p-0.5 bg-[var(--bg-surface-alt)] shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-[var(--bg-surface)] text-[var(--accent-dark)] dark:text-[var(--accent)] font-bold shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Visualizar em Tabela"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'cards' ? 'bg-[var(--bg-surface)] text-[var(--accent-dark)] dark:text-[var(--accent)] font-bold shadow-xs' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="Visualizar em Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* VISÃO 1: TABELA COMPLETA DA BASE DE CLIENTES */}
      {viewMode === 'table' && (
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-surface-alt)] border-b border-[var(--border)] text-[var(--text-secondary)] font-oswald uppercase tracking-wider text-[12px] font-semibold">
                <tr>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">WhatsApp / Telefone</th>
                  <th className="p-4">E-mail</th>
                  <th className="p-4">Tags & Preferências</th>
                  <th className="p-4 text-center">Atendimentos</th>
                  <th className="p-4 text-right">Saldo Gasto</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]/60">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[var(--text-muted)] font-inter">
                      Nenhum cliente encontrado com os filtros informados.
                    </td>
                  </tr>
                ) : (
                  filtered.map((cli, idx) => {
                    const cleanPhone = cli.telefone.replace(/\D/g, '');
                    const history = agendamentos.filter((a) => a.cliente_id === cli.id);
                    const spent = history
                      .filter((a) => a.status !== 'cancelado')
                      .reduce((sum, a) => sum + (a.servico?.preco || 0), 0);

                    return (
                      <tr
                        key={cli.id}
                        className={`${idx % 2 === 0 ? 'bg-[var(--bg-surface)]' : 'bg-[var(--table-row-alt)]'} hover:bg-[var(--table-row-hover)] transition-colors`}
                      >
                        <td className="p-4 font-medium text-[var(--text-primary)] font-inter">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-[var(--bg-surface-alt)] border border-[var(--border)] text-[var(--accent-dark)] dark:text-[var(--accent)] text-xs font-display flex items-center justify-center shrink-0">
                              {cli.nome.charAt(0)}
                            </div>
                            <span className="truncate max-w-[170px]">{cli.nome}</span>
                          </div>
                        </td>

                        <td className="p-4 font-inter">
                          <a
                            href={`https://wa.me/55${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--accent-dark)] dark:text-[var(--accent)] hover:underline font-medium flex items-center gap-1"
                            title="Abrir WhatsApp"
                          >
                            <Phone className="w-3 h-3 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
                            {cli.telefone}
                          </a>
                        </td>

                        <td className="p-4 text-[var(--text-secondary)] font-inter">
                          {cli.email || '—'}
                        </td>

                        <td className="p-4 font-inter">
                          <div className="flex items-center gap-1 flex-wrap max-w-xs">
                            {cli.tags && cli.tags.length > 0 ? (
                              cli.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-oswald uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent-dark)] dark:text-[var(--accent)] border border-[var(--border)]"
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-[var(--text-muted)] text-[11px]">—</span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-center font-inter text-[var(--text-primary)]">
                          <span className="bg-[var(--bg-surface-alt)] border border-[var(--border)] px-2.5 py-0.5 rounded-md font-medium">
                            {history.length}
                          </span>
                        </td>

                        <td className="p-4 text-right font-display text-base text-[var(--text-primary)]">
                          R$ {spent.toFixed(2)}
                        </td>

                        <td className="p-4 text-right whitespace-nowrap font-oswald uppercase">
                          <button
                            onClick={() => setSelectedClientForHistory(cli)}
                            className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold px-2 py-1 rounded hover:bg-[var(--bg-surface-alt)] transition-colors mr-1"
                          >
                            Histórico
                          </button>
                          <button
                            onClick={() => handleOpenModal(cli)}
                            className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] hover:bg-[var(--accent-bg)] font-semibold px-2 py-1 rounded transition-colors"
                          >
                            Editar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISÃO 2: CARDS DA BASE DE CLIENTES */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cli) => {
            const cleanPhone = cli.telefone.replace(/\D/g, '');
            const history = agendamentos.filter((a) => a.cliente_id === cli.id);
            const spent = history
              .filter((a) => a.status !== 'cancelado')
              .reduce((sum, a) => sum + (a.servico?.preco || 0), 0);

            return (
              <div
                key={cli.id}
                className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border)] shadow-soft flex flex-col justify-between hover:border-[var(--accent)] transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-surface-alt)] border border-[var(--border)] text-[var(--accent-dark)] dark:text-[var(--accent)] font-display flex items-center justify-center shrink-0">
                        {cli.nome.charAt(0)}
                      </div>
                      <h3 className="font-display uppercase tracking-wide text-base text-[var(--text-primary)] truncate">
                        {cli.nome}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleOpenModal(cli)}
                      className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] hover:bg-[var(--accent-bg)] font-oswald uppercase tracking-wider font-semibold px-2 py-0.5 rounded"
                    >
                      Editar
                    </button>
                  </div>

                  <div className="space-y-1 text-xs text-[var(--text-secondary)] mt-2 font-inter">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[var(--accent-dark)] dark:text-[var(--accent)] shrink-0" />
                      <a
                        href={`https://wa.me/55${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-[var(--accent-dark)] dark:text-[var(--accent)] font-medium"
                      >
                        {cli.telefone}
                      </a>
                    </div>
                    {cli.email && (
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <Mail className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                        <span className="truncate">{cli.email}</span>
                      </div>
                    )}
                  </div>

                  {cli.tags && cli.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mt-3">
                      {cli.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-oswald uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-bg)] text-[var(--accent-dark)] dark:text-[var(--accent)] border border-[var(--border)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {cli.observacoes && (
                    <p className="text-[11px] text-[var(--text-secondary)] mt-3 bg-[var(--bg-surface-alt)] p-2 rounded-lg border border-[var(--border)] italic line-clamp-2 font-inter">
                      "{cli.observacoes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                  <div className="text-xs text-[var(--text-secondary)] font-inter">
                    {history.length} visitas • <strong className="text-[var(--text-primary)]">R$ {spent.toFixed(2)}</strong>
                  </div>
                  <button
                    onClick={() => setSelectedClientForHistory(cli)}
                    className="text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--accent-dark)] dark:text-[var(--accent)] hover:underline flex items-center gap-1"
                  >
                    <History className="w-3.5 h-3.5" />
                    Histórico
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL NOVO / EDITAR CLIENTE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[var(--bg-surface)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--border)] my-auto text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <h3 className="font-display uppercase tracking-wide text-base sm:text-lg text-[var(--text-primary)]">
                {editingClient ? 'Editar Perfil do Cliente' : 'Cadastrar Novo Cliente na Base'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mateus Alencar"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">WhatsApp / Telefone *</label>
                  <input
                    type="text"
                    required
                    placeholder="(71) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">E-mail (opcional)</label>
                  <input
                    type="email"
                    placeholder="email@cliente.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                  />
                </div>
              </div>

              {/* Tags / Etiquetas Pré-definidas */}
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1.5">
                  Etiquetas & Preferências
                </label>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {PRESET_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className={`text-[11px] font-oswald uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full border transition-all ${
                          isSelected
                            ? 'bg-[var(--accent)] text-[#0B0E11] border-[var(--accent)] shadow-accent'
                            : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '}
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {/* Tag Personalizada */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Outra etiqueta..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    className="flex-1 text-xs p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-2 bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] text-[var(--text-primary)] text-xs font-oswald uppercase tracking-wider font-semibold rounded-lg border border-[var(--border)]"
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Observações & Cuidados</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Prefere toalha quente extra, traz referências de arte..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] text-xs font-oswald uppercase tracking-wider font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-accent"
                >
                  <Check className="w-4 h-4" />
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL HISTÓRICO COMPLETO DO CLIENTE */}
      {selectedClientForHistory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[var(--bg-surface)] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--border)] my-auto max-h-[85vh] flex flex-col text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div>
                <h3 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
                  {selectedClientForHistory.nome}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-0.5 font-inter">
                  <span>{selectedClientForHistory.telefone}</span>
                  <span>•</span>
                  <span className="font-bold text-[var(--accent-dark)] dark:text-[var(--accent)]">
                    Total gasto: R$ {clientTotalSpent.toFixed(2)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedClientForHistory(null)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2.5">
              {clientHistory.length === 0 ? (
                <div className="text-center py-8 text-[var(--text-muted)] text-xs font-inter">
                  Nenhum agendamento registrado para este cliente até o momento.
                </div>
              ) : (
                clientHistory.map((ag) => (
                  <div key={ag.id} className="p-3.5 bg-[var(--bg-surface-alt)] rounded-xl border border-[var(--border)] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[var(--text-primary)] font-inter">
                        {ag.servico?.nome || 'Serviço'}
                      </span>
                      <AppointmentStatusBadge status={ag.status} size="sm" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] font-inter">
                      <span>Profissional: <strong className="text-[var(--text-primary)]">{ag.colaborador?.nome}</strong></span>
                      <span>{ag.data} às {ag.hora_inicio}</span>
                    </div>
                    {ag.servico?.preco && (
                      <div className="text-[11px] font-bold text-[var(--accent-dark)] dark:text-[var(--accent)] text-right font-inter">
                        Valor: R$ {ag.servico.preco.toFixed(2)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between">
              <a
                href={`https://wa.me/55${selectedClientForHistory.telefone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 bg-[#517566] hover:bg-[var(--accent)] text-white hover:text-[#0B0E11] rounded-lg text-xs font-oswald uppercase tracking-wider font-bold flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                Conversar no WhatsApp
              </a>

              <button
                onClick={() => setSelectedClientForHistory(null)}
                className="px-4 py-2 bg-[var(--bg-surface-alt)] text-[var(--text-primary)] hover:bg-[var(--border)] border border-[var(--border)] rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
