import React, { useState, useEffect } from 'react';
import { X, UserPlus, Calendar, Clock, DollarSign, Check, AlertTriangle, Trash2 } from 'lucide-react';
import { Agendamento, Cliente, Usuario, Servico, CategoriaServico, StatusAgendamento } from '../../types';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  appointmentToEdit?: Agendamento | null;
  initialDate?: string;
  initialTime?: string;
  initialColaboradorId?: string;
  onSaved: () => void;
}

export const AppointmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  appointmentToEdit,
  initialDate,
  initialTime,
  initialColaboradorId,
  onSaved,
}) => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [colaboradores, setColaboradores] = useState<Usuario[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);

  // Estado do formulário
  const [clienteId, setClienteId] = useState<string>('');
  const [categoriaId, setCategoriaId] = useState<string>('');
  const [servicoId, setServicoId] = useState<string>('');
  const [colaboradorId, setColaboradorId] = useState<string>('');
  const [data, setData] = useState<string>('');
  const [horaInicio, setHoraInicio] = useState<string>('09:00');
  const [horaFim, setHoraFim] = useState<string>('09:45');
  const [status, setStatus] = useState<StatusAgendamento>('agendado');
  const [observacoes, setObservacoes] = useState<string>('');

  // Modo de cadastro rápido de novo cliente inline
  const [isCreatingClient, setIsCreatingClient] = useState<boolean>(false);
  const [newClientNome, setNewClientNome] = useState<string>('');
  const [newClientTelefone, setNewClientTelefone] = useState<string>('');
  const [newClientEmail, setNewClientEmail] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [conflitoAviso, setConflitoAviso] = useState<string | null>(null);

  // Carrega listas de suporte
  useEffect(() => {
    const loadSupportData = async () => {
      try {
        const [cliList, colabList, catList, srvList] = await Promise.all([
          api.getClientes(),
          api.getColaboradores(),
          api.getCategorias(),
          api.getServicos(),
        ]);
        setClientes(cliList);
        setColaboradores(colabList);
        setCategorias(catList);
        setServicos(srvList);
      } catch (err) {
        console.error('Erro ao carregar dados do agendamento:', err);
      }
    };

    if (isOpen) {
      loadSupportData();
    }
  }, [isOpen]);

  // Inicializa dados do formulário
  useEffect(() => {
    if (appointmentToEdit) {
      setClienteId(appointmentToEdit.cliente_id);
      setColaboradorId(appointmentToEdit.colaborador_id);
      setServicoId(appointmentToEdit.servico_id);
      setData(appointmentToEdit.data);
      setHoraInicio(appointmentToEdit.hora_inicio);
      setHoraFim(appointmentToEdit.hora_fim);
      setStatus(appointmentToEdit.status);
      setObservacoes(appointmentToEdit.observacoes || '');

      // Localiza a categoria do serviço
      const srv = servicos.find((s) => s.id === appointmentToEdit.servico_id);
      if (srv) setCategoriaId(srv.categoria_id);
    } else {
      setClienteId('');
      setCategoriaId(categorias[0]?.id || '');
      setServicoId('');
      setColaboradorId(initialColaboradorId || colaboradores[0]?.id || '');
      setData(initialDate || new Date().toISOString().split('T')[0]);
      setHoraInicio(initialTime || '09:00');
      setStatus('agendado');
      setObservacoes('');
    }
    setIsCreatingClient(false);
    setConflitoAviso(null);
  }, [appointmentToEdit, initialDate, initialTime, initialColaboradorId, isOpen, categorias, colaboradores, servicos]);

  // Recalcula hora fim automaticamente com base na duração do serviço selecionado
  const handleServiceChange = (sId: string) => {
    setServicoId(sId);
    const selectedSrv = servicos.find((s) => s.id === sId);
    if (selectedSrv && horaInicio) {
      const [h, m] = horaInicio.split(':').map(Number);
      const startMinutes = h * 60 + m;
      const endMinutes = startMinutes + selectedSrv.duracao_minutos;

      const endH = Math.floor(endMinutes / 60);
      const endM = endMinutes % 60;
      setHoraFim(`${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`);
    }
  };

  // Checa conflito de horário ao mudar dados
  useEffect(() => {
    const checkConflict = async () => {
      if (colaboradorId && data && horaInicio && horaFim) {
        const conflict = await api.checkConflitoHorario(
          colaboradorId,
          data,
          horaInicio,
          horaFim,
          appointmentToEdit?.id
        );
        if (conflict) {
          setConflitoAviso('Atenção: Este profissional já possui outro agendamento neste mesmo horário!');
        } else {
          setConflitoAviso(null);
        }
      }
    };
    checkConflict();
  }, [colaboradorId, data, horaInicio, horaFim, appointmentToEdit]);

  // Criação rápida de cliente
  const handleQuickCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientNome.trim() || !newClientTelefone.trim()) {
      showToast('Preencha pelo menos Nome e Telefone do cliente.', 'warning');
      return;
    }

    try {
      const created = await api.saveCliente({
        id: 'cli-' + Date.now(),
        nome: newClientNome.trim(),
        telefone: newClientTelefone.trim(),
        email: newClientEmail.trim() || undefined,
        tags: ['Novo Cliente'],
        criado_em: new Date().toISOString(),
      });

      setClientes((prev) => [created, ...prev]);
      setClienteId(created.id);
      setIsCreatingClient(false);
      showToast(`Cliente ${created.nome} cadastrado com sucesso!`, 'success');
    } catch (err) {
      showToast('Erro ao cadastrar cliente.', 'error');
    }
  };

  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clienteId) {
      showToast('Selecione ou cadastre o cliente.', 'warning');
      return;
    }
    if (!servicoId) {
      showToast('Selecione o serviço.', 'warning');
      return;
    }
    if (!colaboradorId) {
      showToast('Selecione o profissional.', 'warning');
      return;
    }

    setLoading(true);
    try {
      const agendamentoData: Agendamento = {
        id: appointmentToEdit ? appointmentToEdit.id : 'ag-' + Date.now(),
        cliente_id: clienteId,
        colaborador_id: colaboradorId,
        servico_id: servicoId,
        data,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        status,
        observacoes: observacoes.trim() || undefined,
        criado_por: currentUser?.id,
        criado_em: appointmentToEdit?.criado_em || new Date().toISOString(),
      };

      await api.saveAgendamento(agendamentoData);

      // Dispara push notification para o colaborador
      const colab = colaboradores.find((c) => c.id === colaboradorId);
      const cli = clientes.find((c) => c.id === clienteId);
      const srv = servicos.find((s) => s.id === servicoId);

      if (colab) {
        api.sendPushNotification(
          colab.id,
          'Novo Agendamento Marcado!',
          `Cliente: ${cli?.nome || 'Cliente'} às ${horaInicio} — ${srv?.nome || 'Serviço'}`
        );
      }

      showToast(
        appointmentToEdit ? 'Agendamento atualizado com sucesso!' : 'Agendamento criado com sucesso!',
        'success'
      );
      onSaved();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Erro ao salvar agendamento.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointmentToEdit) return;
    if (confirm('Deseja realmente cancelar este agendamento?')) {
      await api.updateAgendamentoStatus(appointmentToEdit.id, 'cancelado');
      showToast('Agendamento marcado como cancelado.', 'info');
      onSaved();
      onClose();
    }
  };

  if (!isOpen) return null;

  // Serviços filtrados pela categoria selecionada
  const filteredServices = categoriaId
    ? servicos.filter((s) => s.categoria_id === categoriaId)
    : servicos;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--border)] animate-in fade-in zoom-in-95 my-auto text-[var(--text-primary)]">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div>
            <h3 className="font-display uppercase tracking-wide text-lg text-[var(--text-primary)]">
              {appointmentToEdit ? 'Editar Agendamento' : 'Novo Agendamento'}
            </h3>
            <p className="text-xs text-[var(--text-secondary)] font-inter">
              Preencha os detalhes e o profissional receberá a notificação imediatamente.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerta de Conflito de Horário */}
        {conflitoAviso && (
          <div className="mt-4 p-3 bg-[rgba(255,193,7,0.12)] border border-[rgba(255,193,7,0.30)] rounded-xl flex items-center gap-2.5 text-xs text-[#FFC107] font-semibold font-inter">
            <AlertTriangle className="w-4 h-4 text-[#FFC107] shrink-0" />
            <span>{conflitoAviso}</span>
          </div>
        )}

        {/* Modo de Cadastro Rápido de Cliente */}
        {isCreatingClient ? (
          <form onSubmit={handleQuickCreateClient} className="mt-4 p-4 bg-[var(--bg-surface-alt)] rounded-xl border border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-bold">
                Cadastrar Novo Cliente
              </span>
              <button
                type="button"
                onClick={() => setIsCreatingClient(false)}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-oswald uppercase"
              >
                Voltar à busca
              </button>
            </div>
            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Gabriel Bastos"
                  value={newClientNome}
                  onChange={(e) => setNewClientNome(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] block mb-1">WhatsApp com DDD *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: (71) 99876-5432"
                  value={newClientTelefone}
                  onChange={(e) => setNewClientTelefone(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] block mb-1">E-mail (opcional)</label>
                <input
                  type="email"
                  placeholder="cliente@email.com"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] rounded-lg text-xs font-oswald uppercase tracking-wider font-bold transition-colors mt-2"
              >
                Salvar Cliente e Continuar
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSaveAppointment} className="mt-4 space-y-4">
            {/* Cliente */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold">Cliente *</label>
                <button
                  type="button"
                  onClick={() => setIsCreatingClient(true)}
                  className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] hover:text-[var(--text-primary)] font-oswald uppercase tracking-wider font-semibold flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  + Novo Cliente
                </button>
              </div>
              <select
                required
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
              >
                <option value="">Selecione um cliente cadastrado...</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} — {c.telefone}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoria e Serviço em Cascata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Categoria *</label>
                <select
                  value={categoriaId}
                  onChange={(e) => {
                    setCategoriaId(e.target.value);
                    setServicoId('');
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                >
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Serviço *</label>
                <select
                  required
                  value={servicoId}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                >
                  <option value="">Selecione o serviço...</option>
                  {filteredServices.map((srv) => (
                    <option key={srv.id} value={srv.id}>
                      {srv.nome} ({srv.duracao_minutos}m — R$ {srv.preco.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Profissional */}
            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Profissional / Colaborador *</label>
              <select
                required
                value={colaboradorId}
                onChange={(e) => setColaboradorId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
              >
                <option value="">Selecione quem irá atender...</option>
                {colaboradores.map((colab) => (
                  <option key={colab.id} value={colab.id}>
                    {colab.nome} — {colab.especialidade}
                  </option>
                ))}
              </select>
            </div>

            {/* Data e Horários */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Data *</label>
                <input
                  type="date"
                  required
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Hora Início *</label>
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>

              <div>
                <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Hora Fim *</label>
                <input
                  type="time"
                  required
                  value={horaFim}
                  onChange={(e) => setHoraFim(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>
            </div>

            {/* Status (em edição ou criação) */}
            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Status do Agendamento</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusAgendamento)}
                className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-oswald uppercase tracking-wider font-semibold"
              >
                <option value="agendado">Agendado</option>
                <option value="confirmado">Confirmado</option>
                <option value="em_atendimento">Em Atendimento</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>

            {/* Observações */}
            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">Observações</label>
              <textarea
                rows={2}
                placeholder="Ex: Cliente prefere toalha quente extra, traz referência de arte..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] outline-none font-inter"
              />
            </div>

            {/* Ações */}
            <div className="flex items-center justify-between pt-2">
              {appointmentToEdit ? (
                <button
                  type="button"
                  onClick={handleCancelAppointment}
                  className="px-3 py-2 text-xs font-oswald uppercase tracking-wider font-semibold text-[#EB5757] hover:bg-[rgba(235,87,87,0.15)] rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Cancelar Agendamento
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] rounded-lg transition-colors"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] text-xs font-oswald uppercase tracking-wider font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-accent"
                >
                  <Check className="w-4 h-4" />
                  {loading ? 'Salvando...' : appointmentToEdit ? 'Salvar Alterações' : 'Confirmar Agendamento'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
