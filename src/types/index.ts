/**
 * Tipos e Interfaces do Sistema Hype Tatu
 */

export type UserRole = 'master' | 'recepcionista' | 'colaborador';

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

