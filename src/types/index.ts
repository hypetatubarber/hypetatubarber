/**
 * Tipos e Interfaces do Sistema Hype Tatu
 */

export type UserRole = 'master' | 'recepcionista' | 'colaborador';
export type TipoColaborador = 'fixo' | 'rotativo';
export type StatusDisponibilidade = 'disponivel' | 'indisponivel';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  slug?: string;
  especialidade?: string;
  foto?: string;
  status: 'ativo' | 'inativo';
  criado_em?: string;
  // Campos específicos para Colaboradores / Rotativos
  tipo_colaborador?: TipoColaborador; // 'fixo' | 'rotativo' (padrão: 'fixo')
  estilos_tatuagem?: string[]; // Ex: ['Fineline', 'Realismo', 'Blackwork', 'Old School']
  telefone?: string; // WhatsApp para contato
  comissao_porcentagem?: number; // Ex: 50.0 (% de comissão)
  status_disponibilidade?: StatusDisponibilidade; // 'disponivel' | 'indisponivel'
  notificacoes_ativas?: boolean; // Se recebe alertas de jobs (padrão: true)
}

export type TamanhoTatuagem = 'pequena' | 'media' | 'grande';
export type StatusSolicitacaoRotativo = 'aberto' | 'aceito' | 'cancelado';

export interface SolicitacaoRotativo {
  id: string;
  cliente_id?: string;
  cliente_nome: string;
  cliente_telefone?: string;
  estilo: string;
  tamanho: TamanhoTatuagem;
  data: string; // YYYY-MM-DD
  hora_inicio: string; // HH:mm
  hora_fim: string; // HH:mm
  valor_estimado: number;
  observacoes?: string;
  status: StatusSolicitacaoRotativo;
  aceito_por_id?: string;
  aceito_por_nome?: string;
  aceito_em?: string;
  recusado_por_ids?: string[];
  criado_por_id?: string;
  criado_por_nome?: string;
  criado_em: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email?: string;
  avatar_url?: string;
  foto?: string;
  observacoes?: string;
  tags?: string[];
  criado_em?: string;
}

export interface CategoriaServico {
  id: string;
  nome: string; // 'Tatuagem' | 'Barbearia' | 'Piercing' | string
  cor_identificacao: string;
}

export interface Servico {
  id: string;
  categoria_id: string;
  nome: string;
  descricao?: string;
  duracao_minutos: number;
  preco: number;
  ativo: boolean;
  categoria?: CategoriaServico;
}

export type StatusAgendamento = 'agendado' | 'confirmado' | 'em_atendimento' | 'concluido' | 'cancelado';

export interface Agendamento {
  id: string;
  cliente_id: string;
  colaborador_id: string;
  servico_id: string;
  data: string; // YYYY-MM-DD
  hora_inicio: string; // HH:mm
  hora_fim: string; // HH:mm
  status: StatusAgendamento;
  observacoes?: string;
  criado_por?: string;
  criado_em?: string;
  // Joins
  cliente?: Cliente;
  colaborador?: Usuario;
  servico?: Servico;
}

export type UnidadeProduto = 'ml' | 'un' | 'g' | 'cx' | 'par';

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  unidade: UnidadeProduto;
  custo_unitario: number;
  estoque_atual: number;
  estoque_minimo: number;
}

export interface UsoProduto {
  id: string;
  colaborador_id: string;
  produto_id: string;
  quantidade: number;
  data: string; // YYYY-MM-DD
  agendamento_id?: string;
  observacao?: string;
  criado_em?: string;
  // Joins
  produto?: Produto;
  colaborador?: Usuario;
}

export interface MovimentacaoEstoque {
  id: string;
  produto_id: string;
  tipo: 'entrada' | 'saida';
  quantidade: number;
  motivo: string;
  data: string;
  usuario_id?: string;
  // Joins
  produto?: Produto;
  usuario?: Usuario;
}

export interface Notificacao {
  id: string;
  usuario_id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  link?: string;
  criado_em: string;
}

export interface PushSubscriptionData {
  id: string;
  usuario_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

// ============================================================================
// WHATSAPP & EVOLUTION API
// ============================================================================
export type DirecaoMensagem = 'enviada' | 'recebida';
export type StatusMensagem = 'enviando' | 'enviado' | 'entregue' | 'lido' | 'erro';

export interface Mensagem {
  id: string;
  conversa_id: string;
  numero: string;
  conteudo: string;
  direcao: DirecaoMensagem;
  status?: StatusMensagem;
  criado_em: string;
}

export interface Conversa {
  id: string;
  numero: string;
  nome: string;
  foto?: string;
  avatar_url?: string;
  cliente_id?: string;
  status?: string;
  ultima_mensagem?: string;
  ultima_mensagem_em: string;
  nao_lidas: number;
  criado_em?: string;
  atualizado_em?: string;
  // Joins
  cliente?: Cliente;
  mensagens?: Mensagem[];
}

export type EvolutionState = 'open' | 'connecting' | 'close' | 'disconnected';

export interface EvolutionConnectionState {
  instanceName: string;
  state: EvolutionState;
}

export interface EvolutionQrResponse {
  pairingCode?: string;
  code?: string;
  base64?: string;
  count?: number;
}

