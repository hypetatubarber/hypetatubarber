# 💈 Hype Tatu — Sistema Full-Stack PWA & Admin

Sistema de Gestão, Agenda de Salão por Colunas, Estoque com Baixa Automática e CRM de Clientes para o estúdio de tatuagem, barbearia e piercing **Hype Tatu** (Lauro de Freitas, Bahia).

Desenvolvido com **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, **Supabase** (PostgreSQL + RLS + Edge Functions) e suporte completo a **PWA (Progressive Web App)** instalável no celular com notificações Push.

---

## 🚀 Início Rápido

### 1. Instalação e Execução Local

```bash
# Entre na pasta do projeto
cd C:\Users\pazer\.gemini\antigravity\scratch\hype-tatu-app

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O sistema abrirá automaticamente em `http://localhost:5173`.

> [!TIP]
> **Modo Demo Imediato**: O sistema já vem com dados realistas pré-carregados (colaboradores, serviços de barbearia/tattoo/piercing, produtos de estoque e agendamentos). Você pode testar todas as funcionalidades imediatamente mesmo antes de configurar suas chaves do Supabase!

---

## 👥 Níveis de Acesso e Rotas

O sistema possui 3 perfis distintos de acesso:

### 1. MASTER (Donos) — `/admin`
- Login com e-mail: `master@hypetatu.com.br` | senha: qualquer valor no modo demo
- **Acesso Total**:
  - Painel com KPIs (faturamento previsto, agendamentos do dia, alerta de estoque baixo).
  - **Agenda Geral**: Calendário mensal e grade de salão por colunas de colaboradores das 08h às 22h.
  - **Serviços & Preços**: Cadastro e edição de serviços por categoria com duração e valores.
  - **Equipe**: Cadastro de novos profissionais e geração de links individuais.
  - **Estoque**: Catálogo de produtos, alertas visuais de estoque mínimo e registro manual de compras.
  - **Relatório de Consumo**: Tabela de materiais usados por colaborador e ranking comparativo de custos.
  - **CRM de Clientes**: Busca rápida, preferências e histórico de atendimentos.

### 2. RECEPCIONISTA — `/recepcao`
- Login com e-mail: `recepcao@hypetatu.com.br`
- **Permissões**:
  - Visão geral da agenda de todos os profissionais.
  - Criação rápida de agendamentos com validação automática de conflitos de horário.
  - Cadastro de clientes na hora.
  - Consulta de níveis de estoque (somente leitura, sem acesso a dados financeiros).

### 3. COLABORADOR — `/equipe/[slug]`
- Exemplos de links diretos:
  - `http://localhost:5173/equipe/danilinho-barber` (Barbeiro)
  - `http://localhost:5173/equipe/lucas-ink` (Tatuador Realismo)
  - `http://localhost:5173/equipe/maya-ferreira` (Tatuadora Fineline)
  - `http://localhost:5173/equipe/camila-piercer` (Piercing)
- **Permissões**:
  - Vê **apenas os próprios agendamentos** do dia em ordem cronológica.
  - Botões para atualizar status do atendimento: *Confirmar* ➔ *Iniciar Atendimento* ➔ *Concluir*.
  - **Lançar Material Usado**: Escolhe o insumo utilizado (agulha, tinta, navalhete, etc.) e o sistema abate automaticamente do estoque geral.
  - **Central de Notificações**: Recebe avisos imediatos quando a recepção agenda ou altera um horário para ele.

---

## 🗄️ Integração com o Banco de Dados Supabase

Para conectar o seu próprio projeto Supabase em produção:

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor** no painel do Supabase, copie o conteúdo do arquivo `supabase/schema.sql` e clique em **Run**. Ele criará:
   - Todas as tabelas (`usuarios`, `clientes`, `categorias_servico`, `servicos`, `agendamentos`, `produtos`, `uso_produtos`, `movimentacoes_estoque`, `notificacoes`, `push_subscriptions`).
   - Índices de alto desempenho.
   - **Triggers automáticos**: baixa de estoque automática ao registrar uso e geração de notificações automáticas de agendamento.
   - Políticas de segurança **Row Level Security (RLS)**.
   - Dados iniciais (seeds) completos.
3. Crie um arquivo `.env` na raiz de `hype-tatu-app/` com as suas credenciais:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
   ```

---

## 📱 PWA (Progressive Web App) & Push Notifications

- **Instalação no Celular**: Abra o sistema no navegador do celular (Chrome ou Safari) e toque em **"Instalar App"** ou **"Adicionar à Tela de Início"**. O app funcionará em tela cheia (standalone) como um aplicativo nativo.
- **Service Worker (`public/sw.js`)**: Armazena em cache assets estáticos para carregamento instantâneo e escuta eventos de Web Push.
- **Notificações Push**: Quando a recepção agenda um atendimento para o colaborador, o sistema envia um alerta sonoro e visual para a tela do profissional.

---

## 🎨 Paleta de Cores e Identidade

- Fundo: Slate Clean (`#f8fafc` / `#ffffff`)
- Destaque Nobre: Dourado Hype (`#e5a93c` / `#d97706`)
- Superfícies Dark: Preto Grafite (`#09090b` / `#1e293b`)
- Status dos Agendamentos:
  - **Agendado**: Cinza (`#64748b`)
  - **Confirmado**: Azul (`#2563eb`)
  - **Em Atendimento**: Amarelo (`#eab308`)
  - **Concluído**: Verde (`#16a34a`)
  - **Cancelado**: Vermelho (`#dc2626`)
