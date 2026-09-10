import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Clock, DollarSign, User, Phone, CheckCircle2, AlertCircle, Users, Flame } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Cliente, Usuario, TamanhoTatuagem } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  onSuccess?: () => void;
}

const ESTILOS_COMUNS = [
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
  'Botânica / Floral',
  'Cover-up (Cobertura)',
];

const PRECOS_SUGERIDOS: Record<TamanhoTatuagem, { duracao: number; preco: number; label: string }> = {
  pequena: { duracao: 60, preco: 220, label: 'Pequena (até 6cm)' },
  media: { duracao: 120, preco: 450, label: 'Média (7 a 15cm)' },
  grande: { duracao: 240, preco: 900, label: 'Grande (Fechamento/Autoral)' },
};

export const SolicitarRotativoModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialDate,
  onSuccess,
}) => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [rotativosDisponiveis, setRotativosDisponiveis] = useState<Usuario[]>([]);
  const [loadingRotativos, setLoadingRotativos] = useState<boolean>(true);

  // Form states
  const [clienteId, setClienteId] = useState<string>('');
  const [clienteNome, setClienteNome] = useState<string>('');
  const [clienteTelefone, setClienteTelefone] = useState<string>('');
  const [estilo, setEstilo] = useState<string>('Fineline');
  const [estiloCustom, setEstiloCustom] = useState<string>('');
  const [tamanho, setTamanho] = useState<TamanhoTatuagem>('pequena');
  const [data, setData] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [horaInicio, setHoraInicio] = useState<string>('14:00');
  const [horaFim, setHoraFim] = useState<string>('15:00');
  const [valorEstimado, setValorEstimado] = useState<number>(220);
  const [observacoes, setObservacoes] = useState<string>('');
  const [enviando, setEnviando] = useState<boolean>(false);

  useEffect(() => {
    if (initialDate) {
      setData(initialDate);
    }
  }, [initialDate]);

  // Carrega clientes e rotativos disponíveis
  useEffect(() => {
    if (!isOpen) return;

    const load = async () => {
      try {
        setLoadingRotativos(true);
        const [cliList, rotList] = await Promise.all([
          api.getClientes(),
          api.getRotativosDisponiveis(),
        ]);
        setClientes(cliList);
        setRotativosDisponiveis(rotList);
      } catch (err) {
        console.error('Erro ao carregar dados do modal de rotativo:', err);
      } finally {
        setLoadingRotativos(false);
      }
    };

    load();
  }, [isOpen]);

  // Atualiza duração e valor padrão ao mudar tamanho
  const handleTamanhoChange = (novoTamanho: TamanhoTatuagem) => {
    setTamanho(novoTamanho);
    const info = PRECOS_SUGERIDOS[novoTamanho];
    setValorEstimado(info.preco);

    // Recalcula hora fim baseado na hora início
    recalcularHoraFim(horaInicio, info.duracao);
  };

  const recalcularHoraFim = (inicio: string, minutos: number) => {
    const [h, m] = inicio.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const totalMin = h * 60 + m + minutos;
      const fimH = Math.min(23, Math.floor(totalMin / 60));
      const fimM = totalMin % 60;
      setHoraFim(`${String(fimH).padStart(2, '0')}:${String(fimM).padStart(2, '0')}`);
    }
  };

  const handleHoraInicioChange = (novoInicio: string) => {
    setHoraInicio(novoInicio);
    const duracao = PRECOS_SUGERIDOS[tamanho].duracao;
    recalcularHoraFim(novoInicio, duracao);
  };

  const handleClienteSelect = (selectedId: string) => {
    setClienteId(selectedId);
    if (selectedId) {
      const cli = clientes.find((c) => c.id === selectedId);
      if (cli) {
        setClienteNome(cli.nome);
        setClienteTelefone(cli.telefone);
      }
    } else {
      setClienteNome('');
      setClienteTelefone('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const estiloFinal = estilo === 'outro' ? estiloCustom.trim() : estilo;

    if (!clienteNome.trim()) {
      showToast('Informe o nome do cliente.', 'warning');
      return;
    }

    if (!estiloFinal) {
      showToast('Selecione ou digite o estilo da tatuagem.', 'warning');
      return;
    }

    if (!valorEstimado || valorEstimado <= 0) {
      showToast('Informe um valor estimado válido.', 'warning');
      return;
    }

    if (rotativosDisponiveis.length === 0) {
      showToast('Nenhum tatuador rotativo está com status "Disponível" no momento.', 'warning');
    }

    try {
      setEnviando(true);

      await api.criarSolicitacaoRotativo({
        cliente_id: clienteId || undefined,
        cliente_nome: clienteNome.trim(),
        cliente_telefone: clienteTelefone.trim() || undefined,
        estilo: estiloFinal,
        tamanho,
        data,
        hora_inicio: horaInicio,
        hora_fim: horaFim,
        valor_estimado: Number(valorEstimado),
        observacoes: observacoes.trim() || undefined,
        criado_por_id: currentUser?.id,
        criado_por_nome: currentUser?.nome || 'Recepção',
      });

      showToast(
        `Job disparado com sucesso para ${rotativosDisponiveis.length} rotativo(s) disponível(is)!`,
        'success'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao chamar rotativo:', err);
      showToast(err.message || 'Erro ao enviar solicitação de rotativo.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[var(--bg-surface)] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-[var(--border)] my-auto text-[var(--text-primary)] relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[rgba(140,189,173,0.15)] border border-[rgba(140,189,173,0.3)] text-[#517566] dark:text-[#8CBDAD]">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-oswald uppercase tracking-wider font-semibold text-[#517566] dark:text-[#8CBDAD]">
                <Sparkles className="w-3 h-3" />
                Demanda Alta • Tatuador Convidado
              </div>
              <h3 className="font-display uppercase tracking-wide text-lg sm:text-xl text-[var(--text-primary)]">
                Chamar Tatuador Rotativo
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Card Informativo de Rotativos Disponíveis */}
        <div className="mt-4 p-3.5 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--text-primary)]">
                Rotativos Disponíveis Agora
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] font-inter">
                {loadingRotativos
                  ? 'Consultando disponibilidade...'
                  : rotativosDisponiveis.length > 0
                  ? `${rotativosDisponiveis.length} tatuador(es) pronto(s) para receber este alerta push.`
                  : 'Nenhum rotativo disponível no momento. O alerta ficará salvo para o primeiro que conectar.'}
              </div>
            </div>
          </div>

          <span
            className={`text-xs font-oswald uppercase font-bold px-2.5 py-1 rounded-full shrink-0 ${
              rotativosDisponiveis.length > 0
                ? 'bg-[rgba(81,117,102,0.25)] text-[#6FCF97] border border-[rgba(81,117,102,0.40)]'
                : 'bg-[rgba(235,87,87,0.15)] text-[#EB5757] border border-[rgba(235,87,87,0.35)]'
            }`}
          >
            {rotativosDisponiveis.length} Online
          </span>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Seção 1: Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                Cliente Cadastrado
              </label>
              <select
                value={clienteId}
                onChange={(e) => handleClienteSelect(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
              >
                <option value="">-- Cliente Novo / Avulso --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.telefone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                Nome do Cliente *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Nome e Sobrenome"
                  value={clienteNome}
                  onChange={(e) => setClienteNome(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
              WhatsApp do Cliente
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="(71) 99999-0000"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
              />
            </div>
          </div>

          {/* Seção 2: Estilo e Porte da Tatuagem */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                Estilo da Tatuagem *
              </label>
              <select
                value={estilo}
                onChange={(e) => setEstilo(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
              >
                {ESTILOS_COMUNS.map((est) => (
                  <option key={est} value={est}>
                    {est}
                  </option>
                ))}
                <option value="outro">Outro (Digitar estilo...)</option>
              </select>

              {estilo === 'outro' && (
                <input
                  type="text"
                  required
                  placeholder="Digite o estilo (ex: Cyber Sigilism)"
                  value={estiloCustom}
                  onChange={(e) => setEstiloCustom(e.target.value)}
                  className="w-full text-xs p-2 mt-2 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                Tamanho Estimado *
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['pequena', 'media', 'grande'] as TamanhoTatuagem[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTamanhoChange(t)}
                    className={`py-2 px-1 text-center rounded-lg text-xs font-oswald uppercase tracking-wider font-semibold border transition-all ${
                      tamanho === t
                        ? 'bg-[var(--accent)] text-[#0B0E11] border-[var(--accent)] shadow-accent font-bold'
                        : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--accent)]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Seção 3: Data, Horário e Valor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                Data do Atendimento *
              </label>
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                Horário de Início *
              </label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => handleHoraInicioChange(e.target.value)}
                  className="w-full text-xs pl-8 pr-2.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
                Valor Estimado (R$) *
              </label>
              <div className="relative">
                <DollarSign className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="10"
                  min="50"
                  required
                  value={valorEstimado}
                  onChange={(e) => setValorEstimado(Number(e.target.value))}
                  className="w-full text-xs pl-8 pr-2.5 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="text-xs font-oswald uppercase tracking-wider text-[var(--accent-dark)] dark:text-[var(--accent)] font-semibold block mb-1">
              Observações & Detalhes do Projeto
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Cliente quer tatuar antebraço direito. Já possui foto de referência no WhatsApp. Pele clara."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface-alt)] text-[var(--text-primary)] focus:border-[var(--accent)] outline-none font-inter resize-none"
            />
          </div>

          {/* Preview da Mensagem Push */}
          <div className="p-3 rounded-xl bg-[rgba(81,117,102,0.10)] border border-[rgba(81,117,102,0.30)] text-xs">
            <div className="font-oswald uppercase tracking-wider font-semibold text-[#517566] dark:text-[#8CBDAD] flex items-center gap-1.5 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Notificação Push Enviada aos Rotativos:
            </div>
            <div className="font-mono text-[11px] text-[var(--text-primary)] whitespace-pre-line bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border)]">
              {`🔔 Job disponível — Hype Tatu
Estilo: ${estilo === 'outro' ? estiloCustom || 'Personalizado' : estilo} | Tamanho: ${tamanho.toUpperCase()}
Data: ${data} às ${horaInicio}
Valor: R$ ${Number(valorEstimado).toFixed(2)}
Primeiro a aceitar fica com o job.`}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 font-inter">
              * Ao aceitar, o job é travado automaticamente, o agendamento é criado na agenda do dia e a recepção recebe o aviso instantâneo.
            </p>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={enviando}
              className="px-4 py-2 text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-alt)] rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[#FFFFFF] text-xs font-oswald uppercase tracking-wider font-bold rounded-xl transition-all flex items-center gap-2 shadow-accent disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {enviando ? 'Disparando Alertas...' : 'Disparar Job para Rotativos 🔔'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
