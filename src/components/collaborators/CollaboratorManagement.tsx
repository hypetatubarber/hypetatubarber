import React, { useState, useEffect } from 'react';
import { UserPlus, Edit2, Check, X, ExternalLink, KeyRound, Eye, EyeOff, Lock, Loader2, Flame, Phone, Bell, BellOff, Sparkles, Percent, MessageCircle, Power, Tag, DollarSign, Calendar } from 'lucide-react';
import { Usuario, TipoColaborador, StatusDisponibilidade, TipoRepasse } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

export const CollaboratorManagement: React.FC = () => {
  const { showToast } = useToast();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  // Mascaramento e visualização de e-mails
  const [revealedEmails, setRevealedEmails] = useState<Record<string, boolean>>({});

  const toggleEmailReveal = (userId: string) => {
    setRevealedEmails((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const maskEmail = (emailStr: string): string => {
    if (!emailStr) return '••••••••';
    const parts = emailStr.split('@');
    if (parts.length !== 2) return '••••••••';
    const [name, domain] = parts;
    const maskedName = name.length > 2
      ? `${name[0]}${'•'.repeat(Math.min(name.length - 2, 5))}${name[name.length - 1]}`
      : `${name[0]}••••`;
    const domainParts = domain.split('.');
    const domainName = domainParts[0];
    const tld = domainParts.slice(1).join('.');
    const maskedDomain = domainName.length > 2
      ? `${domainName[0]}${'•'.repeat(Math.min(domainName.length - 2, 4))}${domainName[domainName.length - 1]}`
      : '••••';
    return `${maskedName}@${maskedDomain}.${tld}`;
  };

  // Modal de Criação / Edição de Colaborador
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'colaborador' | 'recepcionista' | 'master'>('colaborador');
  const [slug, setSlug] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [foto, setFoto] = useState('');
  const [status, setStatus] = useState<'ativo' | 'inativo'>('ativo');

  // Campos específicos de Rotativo
  const [tipoColaborador, setTipoColaborador] = useState<TipoColaborador>('fixo');
  const [estilosTatuagem, setEstilosTatuagem] = useState<string[]>([]);
  const [novoEstilo, setNovoEstilo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [comissaoPorcentagem, setComissaoPorcentagem] = useState<number>(60);
  const [comissaoBarbearia, setComissaoBarbearia] = useState<number>(50);
  const [comissaoTatuagem, setComissaoTatuagem] = useState<number>(60);
  const [comissaoPiercing, setComissaoPiercing] = useState<number>(55);
  const [tipoRepasse, setTipoRepasse] = useState<TipoRepasse>('semanal');
  const [statusDisponibilidade, setStatusDisponibilidade] = useState<StatusDisponibilidade>('disponivel');
  const [notificacoesAtivas, setNotificacoesAtivas] = useState<boolean>(true);

  // Filtro por tipo na listagem
  const [filterType, setFilterType] = useState<'todos' | 'fixo' | 'rotativo'>('todos');

  // Modal de Alteração de Senha pelo Master
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<Usuario | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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
      setTipoColaborador(u.tipo_colaborador || 'fixo');
      setEstilosTatuagem(u.estilos_tatuagem || []);
      setNovoEstilo('');
      setTelefone(u.telefone || '');
      setComissaoPorcentagem(u.comissao_porcentagem !== undefined ? u.comissao_porcentagem : 60);
      setComissaoBarbearia(u.comissao_barbearia !== undefined ? u.comissao_barbearia : (u.comissao_porcentagem || 50));
      setComissaoTatuagem(u.comissao_tatuagem !== undefined ? u.comissao_tatuagem : (u.comissao_porcentagem || 60));
      setComissaoPiercing(u.comissao_piercing !== undefined ? u.comissao_piercing : (u.comissao_porcentagem || 55));
      setTipoRepasse(u.tipo_repasse || (u.tipo_colaborador === 'rotativo' ? 'servico' : 'semanal'));
      setStatusDisponibilidade(u.status_disponibilidade || 'disponivel');
      setNotificacoesAtivas(u.notificacoes_ativas !== false);
    } else {
      setEditingUser(null);
      setNome('');
      setEmail('');
      setRole('colaborador');
      setSlug('');
      setEspecialidade('');
      setFoto('');
      setStatus('ativo');
      setTipoColaborador('fixo');
      setEstilosTatuagem([]);
      setNovoEstilo('');
      setTelefone('');
      setComissaoPorcentagem(60);
      setComissaoBarbearia(50);
      setComissaoTatuagem(60);
      setComissaoPiercing(55);
      setTipoRepasse('semanal');
      setStatusDisponibilidade('disponivel');
      setNotificacoesAtivas(true);
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
        especialidade: especialidade.trim() || (tipoColaborador === 'rotativo' ? 'Tatuador Rotativo' : undefined),
        foto: foto.trim() || undefined,
        status,
        tipo_colaborador: role === 'colaborador' ? tipoColaborador : 'fixo',
        estilos_tatuagem: role === 'colaborador' && tipoColaborador === 'rotativo' ? estilosTatuagem : undefined,
        telefone: telefone.trim() || undefined,
        comissao_porcentagem: role === 'colaborador' ? Number(tipoColaborador === 'rotativo' ? comissaoTatuagem : comissaoBarbearia) : undefined,
        comissao_barbearia: role === 'colaborador' ? Number(comissaoBarbearia) : undefined,
        comissao_tatuagem: role === 'colaborador' ? Number(comissaoTatuagem) : undefined,
        comissao_piercing: role === 'colaborador' ? Number(comissaoPiercing) : undefined,
        tipo_repasse: role === 'colaborador' ? tipoRepasse : undefined,
        status_disponibilidade: role === 'colaborador' && tipoColaborador === 'rotativo' ? statusDisponibilidade : undefined,
        notificacoes_ativas: role === 'colaborador' && tipoColaborador === 'rotativo' ? notificacoesAtivas : undefined,
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

  const handleToggleDisponibilidade = async (u: Usuario, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const novoStatus: StatusDisponibilidade =
        u.status_disponibilidade === 'indisponivel' ? 'disponivel' : 'indisponivel';
      await api.saveUsuario({ ...u, status_disponibilidade: novoStatus });
      showToast(
        novoStatus === 'disponivel'
          ? `"${u.nome}" agora está DISPONÍVEL para jobs.`
          : `"${u.nome}" agora está INDISPONÍVEL.`,
        novoStatus === 'disponivel' ? 'success' : 'info'
      );
      loadData();
    } catch (err) {
      showToast('Erro ao alternar disponibilidade.', 'error');
    }
  };

  const toggleEstiloTag = (est: string) => {
    if (estilosTatuagem.includes(est)) {
      setEstilosTatuagem(estilosTatuagem.filter((e) => e !== est));
    } else {
      setEstilosTatuagem([...estilosTatuagem, est]);
    }
  };

  const addNovoEstilo = () => {
    if (novoEstilo.trim() && !estilosTatuagem.includes(novoEstilo.trim())) {
      setEstilosTatuagem([...estilosTatuagem, novoEstilo.trim()]);
      setNovoEstilo('');
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

  const handleOpenPasswordModal = (u: Usuario) => {
    setPasswordUser(u);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordText(false);
    setIsPasswordModalOpen(true);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordUser) return;

    if (!newPassword || newPassword.length < 6) {
      showToast('A nova senha deve ter no mínimo 6 caracteres.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('As senhas não coincidem. Digite a mesma senha nos dois campos.', 'warning');
      return;
    }

    try {
      setSavingPassword(true);
      await api.changeUserPassword(passwordUser.id, newPassword);
      showToast(`Senha de "${passwordUser.nome}" atualizada com sucesso!`, 'success');
      setIsPasswordModalOpen(false);
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      showToast(err.message || 'Falha ao alterar senha do usuário.', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const filteredUsuarios = usuarios.filter((u) => {
    if (filterType === 'fixo') {
      return u.tipo_colaborador !== 'rotativo';
    }
    if (filterType === 'rotativo') {
      return u.tipo_colaborador === 'rotativo';
    }
    return true;
  });

  const countFixos = usuarios.filter((u) => u.tipo_colaborador !== 'rotativo').length;
  const countRotativos = usuarios.filter((u) => u.tipo_colaborador === 'rotativo').length;

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display uppercase tracking-wide text-xl text-[var(--text-primary)]">
            Equipe & Colaboradores
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-inter">
            Gerencie profissionais fixos e tatuadores rotativos sob demanda com links de acesso individual.
          </p>

          {/* Abas de Filtro: Todos, Fixos, Rotativos */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={() => setFilterType('todos')}
              className={`px-3 py-1 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold border transition-all ${
                filterType === 'todos'
                  ? 'bg-[var(--accent)] text-[#0B0E11] border-[var(--accent)] shadow-accent'
                  : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
              }`}
            >
              Todos ({usuarios.length})
            </button>
            <button
              onClick={() => setFilterType('fixo')}
              className={`px-3 py-1 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold border transition-all ${
                filterType === 'fixo'
                  ? 'bg-[var(--accent)] text-[#0B0E11] border-[var(--accent)] shadow-accent'
                  : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
              }`}
            >
              Equipe Fixa ({countFixos})
            </button>
            <button
              onClick={() => setFilterType('rotativo')}
              className={`px-3 py-1 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold border transition-all flex items-center gap-1.5 ${
                filterType === 'rotativo'
                  ? 'bg-[rgba(81,117,102,0.30)] text-[#6FCF97] border-[#517566] shadow-sm'
                  : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[#517566]'
              }`}
            >
              <Flame className="w-3 h-3 text-[#6FCF97]" />
              Rotativos ({countRotativos})
            </button>
          </div>
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
        {filteredUsuarios.map((u) => {
          const portalLink = u.role === 'colaborador' && u.slug ? `/equipe/${u.slug}` : null;
          const isRotativo = u.tipo_colaborador === 'rotativo';

          return (
            <div
              key={u.id}
              className={`bg-[var(--bg-surface)] rounded-xl p-5 border transition-all shadow-soft flex flex-col justify-between ${
                isRotativo
                  ? 'border-[rgba(81,117,102,0.35)] bg-[rgba(81,117,102,0.03)] hover:border-[#517566]'
                  : u.status === 'ativo'
                  ? 'border-[var(--border)] hover:border-[var(--accent)]'
                  : 'border-[var(--border)] opacity-60 bg-[var(--bg-surface-alt)]/50'
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative shrink-0">
                    <img
                      src={u.foto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'}
                      alt={u.nome}
                      className="w-12 h-12 rounded-xl object-cover border border-[var(--border)]"
                    />
                    {isRotativo && (
                      <span
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#27AE60] border-2 border-[var(--bg-surface)] flex items-center justify-center"
                        title="Tatuador Rotativo"
                      >
                        <Flame className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-display uppercase tracking-wide text-base text-[var(--text-primary)] truncate">{u.nome}</h3>
                      {isRotativo && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-oswald uppercase font-bold bg-[rgba(81,117,102,0.25)] text-[#6FCF97] border border-[rgba(81,117,102,0.40)]">
                          Rotativo
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase tracking-wider font-semibold block truncate">
                      {u.especialidade || u.role}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-[var(--text-muted)] truncate font-mono">
                        {revealedEmails[u.id] ? u.email : maskEmail(u.email)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleEmailReveal(u.id)}
                        className="p-0.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors rounded"
                        title={revealedEmails[u.id] ? 'Ocultar e-mail' : 'Visualizar e-mail completo'}
                      >
                        {revealedEmails[u.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Estilos & Informações do Rotativo */}
                {isRotativo && (
                  <div className="my-2.5 p-2.5 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border)] space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-secondary)] font-oswald uppercase">Disponibilidade:</span>
                      <button
                        type="button"
                        onClick={(e) => handleToggleDisponibilidade(u, e)}
                        className={`text-[10px] font-oswald uppercase font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition-colors ${
                          u.status_disponibilidade !== 'indisponivel'
                            ? 'bg-[rgba(81,117,102,0.25)] text-[#6FCF97] border border-[rgba(81,117,102,0.40)] hover:bg-[rgba(81,117,102,0.40)]'
                            : 'bg-[rgba(235,87,87,0.15)] text-[#EB5757] border border-[rgba(235,87,87,0.35)] hover:bg-[rgba(235,87,87,0.25)]'
                        }`}
                        title="Clique para alternar disponibilidade para jobs"
                      >
                        <Power className="w-2.5 h-2.5" />
                        {u.status_disponibilidade !== 'indisponivel' ? 'Disponível' : 'Indisponível'}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-[var(--border)] space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-secondary)] font-oswald uppercase text-[10px]">Comissões:</span>
                        <span className="text-[10px] font-mono text-[var(--accent)] font-semibold">
                          Barb: {u.comissao_barbearia ?? 50}% | Tat: {u.comissao_tatuagem ?? 60}% | Pierc: {u.comissao_piercing ?? 55}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-secondary)] font-oswald uppercase text-[10px]">Repasse:</span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-oswald uppercase font-bold bg-[rgba(140,189,173,0.15)] text-[#517566] dark:text-[#8CBDAD]">
                          {u.tipo_repasse === 'servico' ? 'Por Serviço' : u.tipo_repasse === 'quinzenal' ? 'Quinzenal' : u.tipo_repasse === 'mensal' ? 'Mensal' : 'Semanal'}
                        </span>
                      </div>
                    </div>

                    {u.telefone && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[var(--text-secondary)] font-oswald uppercase">WhatsApp:</span>
                        <a
                          href={`https://wa.me/55${u.telefone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#6FCF97] hover:underline font-mono flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          {u.telefone}
                        </a>
                      </div>
                    )}

                    {u.estilos_tatuagem && u.estilos_tatuagem.length > 0 && (
                      <div className="pt-1.5 border-t border-[var(--border)]">
                        <span className="text-[10px] text-[var(--text-muted)] font-oswald uppercase block mb-1">Estilos:</span>
                        <div className="flex flex-wrap gap-1">
                          {u.estilos_tatuagem.map((est) => (
                            <span
                              key={est}
                              className="text-[9px] font-oswald uppercase px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)]"
                            >
                              {est}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

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
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] transition-colors"
                >
                  {u.status === 'ativo' ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => handleOpenPasswordModal(u)}
                  className="px-2.5 py-1.5 bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] text-[var(--accent-dark)] dark:text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                  title="Alterar a senha deste usuário"
                >
                  <KeyRound className="w-3 h-3" />
                  Senha
                </button>
                <button
                  onClick={() => handleOpenModal(u)}
                  className="px-2.5 py-1.5 bg-[var(--bg-surface-alt)] hover:bg-[var(--border)] text-[var(--accent-dark)] dark:text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)] rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
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

              {/* Tipo de Colaborador (Fixo vs Rotativo) */}
              {role === 'colaborador' && (
                <div className="p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] space-y-3">
                  <div>
                    <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1.5">
                      Tipo de Colaborador *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setTipoColaborador('fixo')}
                        className={`py-2 px-3 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold border transition-all text-center ${
                          tipoColaborador === 'fixo'
                            ? 'bg-[var(--accent)] text-[#0B0E11] border-[var(--accent)] shadow-accent font-bold'
                            : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)]'
                        }`}
                      >
                        Colaborador Fixo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTipoColaborador('rotativo');
                          if (!especialidade) setEspecialidade('Tatuador Rotativo');
                        }}
                        className={`py-2 px-3 rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                          tipoColaborador === 'rotativo'
                            ? 'bg-[rgba(81,117,102,0.30)] text-[#6FCF97] border-[#517566] shadow-sm font-bold'
                            : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)]'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5 text-[#6FCF97]" />
                        Tatuador Rotativo
                      </button>
                    </div>
                  </div>

                  {/* CONFIGURAÇÃO DE COMISSÃO POR CATEGORIA & TIPO DE REPASSE (Para todos os colaboradores) */}
                  <div className="p-3.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[rgba(140,189,173,0.25)] space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-oswald uppercase tracking-wider font-bold text-[#517566] dark:text-[#8CBDAD]">
                      <Percent className="w-3.5 h-3.5" />
                      Comissões por Categoria & Repasse
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[11px] font-oswald uppercase tracking-wider text-[var(--text-secondary)] font-semibold block mb-1">
                          % Barbearia
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={comissaoBarbearia}
                            onChange={(e) => setComissaoBarbearia(Number(e.target.value))}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-mono font-bold text-center"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-oswald uppercase tracking-wider text-[var(--text-secondary)] font-semibold block mb-1">
                          % Tatuagem
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={comissaoTatuagem}
                            onChange={(e) => setComissaoTatuagem(Number(e.target.value))}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-mono font-bold text-center"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-oswald uppercase tracking-wider text-[var(--text-secondary)] font-semibold block mb-1">
                          % Piercing
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={comissaoPiercing}
                            onChange={(e) => setComissaoPiercing(Number(e.target.value))}
                            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-mono font-bold text-center"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-oswald uppercase tracking-wider text-[var(--text-secondary)] font-semibold block mb-1">
                        Tipo de Repasse da Comissão
                      </label>
                      <select
                        value={tipoRepasse}
                        onChange={(e) => setTipoRepasse(e.target.value as TipoRepasse)}
                        className="w-full text-xs p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-oswald uppercase tracking-wider font-semibold"
                      >
                        <option value="servico">Por Serviço (Repasse Imediato)</option>
                        <option value="semanal">Semanal (Toda Segunda-feira)</option>
                        <option value="quinzenal">Quinzenal (Dias 15 e 30)</option>
                        <option value="mensal">Mensal (5º dia útil)</option>
                      </select>
                    </div>
                  </div>

                  {/* Campos Específicos para Tatuador Rotativo */}
                  {tipoColaborador === 'rotativo' && (
                    <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                      <div>
                        <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                          WhatsApp / Telefone *
                        </label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="(71) 99999-0000"
                            value={telefone}
                            onChange={(e) => setTelefone(e.target.value)}
                            className="w-full text-xs pl-8 pr-2.5 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                          />
                        </div>
                      </div>

                      {/* Status de Disponibilidade & Notificações Ativas */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                            Status de Disponibilidade
                          </label>
                          <select
                            value={statusDisponibilidade}
                            onChange={(e) => setStatusDisponibilidade(e.target.value as any)}
                            className="w-full text-xs p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-oswald uppercase tracking-wider font-semibold"
                          >
                            <option value="disponivel">🟢 Disponível para Jobs</option>
                            <option value="indisponivel">🔴 Indisponível</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                            Notificações Push de Jobs
                          </label>
                          <select
                            value={notificacoesAtivas ? 'sim' : 'nao'}
                            onChange={(e) => setNotificacoesAtivas(e.target.value === 'sim')}
                            className="w-full text-xs p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-oswald uppercase tracking-wider font-semibold"
                          >
                            <option value="sim">🔔 Ativas (Recebe Alertas)</option>
                            <option value="nao">🔕 Desativadas</option>
                          </select>
                        </div>
                      </div>

                      {/* Estilos de Tatuagem do Rotativo */}
                      <div>
                        <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1.5">
                          Estilos de Tatuagem
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {[
                            'Fineline',
                            'Realismo',
                            'Blackwork',
                            'Old School',
                            'Tribal',
                            'Oriental',
                            'Aquarela',
                            'Lettering',
                            'Pontilhismo',
                            'Geométrico',
                            'Botânica',
                          ].map((est) => {
                            const isSelected = estilosTatuagem.includes(est);
                            return (
                              <button
                                key={est}
                                type="button"
                                onClick={() => toggleEstiloTag(est)}
                                className={`text-[10px] font-oswald uppercase tracking-wider px-2 py-1 rounded-md border transition-all ${
                                  isSelected
                                    ? 'bg-[var(--accent)] text-[#0B0E11] border-[var(--accent)] font-bold'
                                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
                                }`}
                              >
                                {isSelected ? `✓ ${est}` : `+ ${est}`}
                              </button>
                            );
                          })}
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Outro estilo... (pressione Enter ou Adicionar)"
                            value={novoEstilo}
                            onChange={(e) => setNovoEstilo(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addNovoEstilo();
                              }
                            }}
                            className="flex-1 text-xs p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                          />
                          <button
                            type="button"
                            onClick={addNovoEstilo}
                            className="px-3 py-2 bg-[var(--bg-surface-alt)] hover:bg-[var(--accent)] hover:text-[#0B0E11] text-xs font-oswald uppercase tracking-wider font-semibold rounded-lg border border-[var(--border)] transition-colors"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

      {/* MODAL ALTERAR SENHA PELO MASTER */}
      {isPasswordModalOpen && passwordUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[var(--bg-surface)] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[var(--border)] my-auto text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[var(--accent-bg)] text-[var(--accent)]">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display uppercase tracking-wide text-base sm:text-lg text-[var(--text-primary)]">
                    Alterar Senha de Acesso
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)] font-inter">
                    Redefina a senha de login deste usuário no sistema.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações do Usuário */}
            <div className="mt-4 p-3 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-oswald uppercase text-[var(--text-secondary)]">Usuário:</span>
                <span className="font-semibold text-[var(--text-primary)]">{passwordUser.nome}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-oswald uppercase text-[var(--text-secondary)]">Nível:</span>
                <span className="font-semibold text-[var(--accent)] uppercase">{passwordUser.role}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-oswald uppercase text-[var(--text-secondary)]">E-mail:</span>
                <span className="font-mono text-[var(--text-muted)] text-[11px]">{maskEmail(passwordUser.email)}</span>
              </div>
            </div>

            <form onSubmit={handleSavePassword} className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold">
                    Nova Senha *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="text-[10px] text-[var(--text-muted)] hover:text-[var(--accent)] flex items-center gap-1 font-inter"
                  >
                    {showPasswordText ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {showPasswordText ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                  Confirmar Nova Senha *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Digite a mesma senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={savingPassword}
                  className="px-4 py-2 text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] rounded-lg disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] text-xs font-oswald uppercase tracking-wider font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-accent disabled:opacity-50"
                >
                  {savingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Atualizar Senha</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
