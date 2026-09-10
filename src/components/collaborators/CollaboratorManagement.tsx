import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Check, X, ExternalLink } from 'lucide-react';
import { Usuario } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const CollaboratorManagement: React.FC = () => {
  const { showToast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'colaborador' | 'recepcionista' | 'master'>('colaborador');
  const [slug, setSlug] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [foto, setFoto] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');

  const loadData = async () => {
    try {
      const list = await api.getUsuarios();
      setUsuarios(list);
    } catch (err) {
      console.error('Erro ao carregar colaboradores:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (u?: Usuario) => {
    if (u) {
      setEditingUser(u);
      setNome(u.nome);
      setEmail(u.email);
      setRole(u.role);
      setSlug(u.slug || '');
      setEspecialidade(u.especialidade || '');
      setFoto(u.foto || '');
      setStatus(u.status);
    } else {
      setEditingUser(null);
      setNome('');
      setEmail('');
      setRole('colaborador');
      setSlug('');
      setEspecialidade('');
      setFoto('');
      setStatus('ativo');
    }
    setIsModalOpen(true);
  };

  const handleNomeChange = (val: string) => {
    setNome(val);
    if (!editingUser) {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) {
      showToast('Nome e e-mail são obrigatórios.', 'warning');
      return;
    }

    try {
      const userData: Usuario = {
        id: editingUser ? editingUser.id : 'user-' + Date.now(),
        nome: nome.trim(),
        email: email.trim(),
        role,
        slug: slug.trim() || undefined,
        especialidade: especialidade.trim() || undefined,
        foto: foto.trim() || undefined,
        status,
        criado_em: editingUser?.criado_em || new Date().toISOString(),
      };

      await api.saveUsuario(userData);
      showToast('Colaborador salvo com sucesso!', 'success');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar colaborador.', 'error');
    }
  };

  const handleToggleStatus = async (u: Usuario) => {
    try {
      const newStatus = u.status === 'ativo' ? 'inativo' : 'ativo';
      await api.saveUsuario({ ...u, status: newStatus });
      showToast(`Usuário "${u.nome}" alterado para ${newStatus}.`, 'info');
      loadData();
    } catch (err) {
      showToast('Erro ao alterar status.', 'error');
    }
  };

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display uppercase tracking-wide text-xl text-[var(--text-primary)]">
            Equipe & Colaboradores
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-inter">
            Gerencie tatuadores, barbeiros, piercers e recepcionistas com links de acesso individual.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] rounded-xl text-xs font-oswald uppercase tracking-wider font-bold flex items-center justify-center gap-1.5 transition-all shadow-accent"
        >
          <UserPlus className="w-4 h-4" />
          Novo Colaborador
        </button>
      </div>

      {/* Grid de Colaboradores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {usuarios.map((u) => {
          const portalLink = u.role === 'colaborador' && u.slug ? `/equipe/${u.slug}` : null;

          return (
            <div
              key={u.id}
              className={`bg-[var(--bg-surface)] rounded-xl p-5 border transition-all shadow-soft flex flex-col justify-between ${
                u.status === 'ativo' ? 'border-[var(--border)] hover:border-[var(--accent)]' : 'border-[var(--border)] opacity-60 bg-[var(--bg-surface-alt)]/50'
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={u.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                    alt={u.nome}
                    className="w-12 h-12 rounded-xl object-cover border border-[var(--border)]"
                  />
                  <div className="min-w-0">
                    <h3 className="font-display uppercase tracking-wide text-base text-[var(--text-primary)] truncate">{u.nome}</h3>
                    <span className="text-[11px] text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase tracking-wider font-semibold block truncate">
                      {u.especialidade || u.role}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)] block truncate font-inter">{u.email}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-[var(--border)] font-oswald uppercase">
                  <span className="font-semibold text-[var(--accent-dark)] dark:text-[var(--accent)] bg-[var(--bg-surface-alt)] border border-[var(--border)] px-2.5 py-0.5 rounded text-[10px]">
                    Papel: {u.role}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                      u.status === 'ativo'
                        ? 'bg-[rgba(81,117,102,0.25)] text-[#6FCF97] border border-[rgba(81,117,102,0.40)]'
                        : 'bg-[rgba(235,87,87,0.15)] text-[#EB5757] border border-[rgba(235,87,87,0.35)]'
                    }`}
                  >
                    {u.status === 'ativo' ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                {portalLink && (
                  <div className="mt-2.5 p-2 bg-[var(--bg-surface-alt)] rounded-lg border border-[var(--border)] flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-secondary)] font-mono truncate max-w-[170px]">{portalLink}</span>
                    <Link
                      to={portalLink}
                      className="text-[var(--accent-dark)] dark:text-[var(--accent)] hover:underline font-oswald uppercase tracking-wider font-bold flex items-center gap-1 shrink-0"
                      title="Acessar portal individual"
                    >
                      Acessar <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2 font-oswald uppercase">
                <button
                  onClick={() => handleToggleStatus(u)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] transition-colors"
                >
                  {u.status === 'ativo' ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => handleOpenModal(u)}
                  className="px-3.5 py-1.5 bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] text-[var(--accent-dark)] dark:text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL NOVO / EDITAR COLABORADOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[var(--bg-surface)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--border)] my-auto text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <h3 className="font-display uppercase tracking-wide text-base sm:text-lg text-[var(--text-primary)]">
                {editingUser ? 'Editar Colaborador' : 'Novo Colaborador'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Danilinho Barber"
                  value={nome}
                  onChange={(e) => handleNomeChange(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Nível de Acesso *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-oswald uppercase tracking-wider font-semibold"
                  >
                    <option value="colaborador">Colaborador</option>
                    <option value="recepcionista">Recepcionista</option>
                    <option value="master">Master (Dono)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Slug da URL (/equipe/slug)</label>
                  <input
                    type="text"
                    placeholder="danilinho-barber"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">E-mail de Login *</label>
                <input
                  type="email"
                  required
                  placeholder="profissional@hypetatu.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Especialidade / Cargo</label>
                <input
                  type="text"
                  placeholder="Ex: Tatuador (Realismo & Blackwork) ou Master Barber"
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">URL da Foto de Perfil</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={foto}
                  onChange={(e) => setFoto(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
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
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
