import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MonthCalendar } from '../../components/calendar/MonthCalendar';
import { SalonDayColumns } from '../../components/calendar/SalonDayColumns';
import { AppointmentModal } from '../../components/appointments/AppointmentModal';
import { SolicitarRotativoModal } from '../../components/appointments/SolicitarRotativoModal';
import { ServiceList } from '../../components/services/ServiceList';
import { ProductList } from '../../components/stock/ProductList';
import { CollaboratorConsumption } from '../../components/stock/CollaboratorConsumption';
import { ClientList } from '../../components/clients/ClientList';
import { CollaboratorManagement } from '../../components/collaborators/CollaboratorManagement';
import { AdminFinanceiroView } from '../../components/financeiro/AdminFinanceiroView';
import { RegistrarPagamentoModal } from '../../components/financeiro/RegistrarPagamentoModal';
import { api } from '../../services/api';
import { Agendamento, Usuario, CategoriaServico, Produto } from '../../types';
import { Calendar, DollarSign, Users, AlertTriangle, Plus, Sparkles, Flame, Package, ArrowRight, CheckCircle2, TrendingDown } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Estados principais
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [colaboradores, setColaboradores] = useState<Usuario[]>([]);
  const [categorias, setCategorias] = useState<CategoriaServico[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [stockFilterFolder, setStockFilterFolder] = useState<string>('TODAS');

  // Modais
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [isRotativoModalOpen, setIsRotativoModalOpen] = useState(false);
  const [appointmentToEdit, setAppointmentToEdit] = useState<Agendamento | null>(null);
  const [initialSlotData, setInitialSlotData] = useState<{ colabId?: string; time?: string }>({});
  const [pagamentoModalAgendamento, setPagamentoModalAgendamento] = useState<Agendamento | null>(null);

  // Aba ativa conforme a URL
  const getTabFromPath = () => {
    if (location.pathname.includes('/financeiro')) return 'financeiro';
    if (location.pathname.includes('/agenda')) return 'agenda';
    if (location.pathname.includes('/servicos')) return 'servicos';
    if (location.pathname.includes('/equipe')) return 'equipe';
    if (location.pathname.includes('/estoque')) return 'estoque';
    if (location.pathname.includes('/clientes')) return 'clientes';
    if (location.pathname.includes('/relatorios')) return 'relatorios';
    return 'overview';
  };

  const activeTab = getTabFromPath();

  const loadData = async () => {
    try {
      const [agList, colabList, catList, prodList] = await Promise.all([
        api.getAgendamentos(),
        api.getColaboradores(),
        api.getCategorias(),
        api.getProdutos(),
      ]);
      setAgendamentos(agList);
      setColaboradores(colabList);
      setCategorias(catList);
      setProdutos(prodList);
    } catch (err) {
      console.error('Erro ao carregar dados do admin:', err);
    }
  };

  useEffect(() => {
    loadData();

    const handleSync = () => {
      loadData();
    };

    window.addEventListener('hype_agendamentos_changed', handleSync);
    window.addEventListener('hype_usuarios_changed', handleSync);
    window.addEventListener('hype_servicos_changed', handleSync);
    window.addEventListener('hype_produtos_changed', handleSync);
    window.addEventListener('hype_movimentacoes_estoque_changed', handleSync);
    window.addEventListener('hype_uso_produtos_changed', handleSync);

    return () => {
      window.removeEventListener('hype_agendamentos_changed', handleSync);
      window.removeEventListener('hype_usuarios_changed', handleSync);
      window.removeEventListener('hype_servicos_changed', handleSync);
      window.removeEventListener('hype_produtos_changed', handleSync);
      window.removeEventListener('hype_movimentacoes_estoque_changed', handleSync);
      window.removeEventListener('hype_uso_produtos_changed', handleSync);
    };
  }, []);

  // Cálculos para os cards de métricas
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAgendamentos = agendamentos.filter((a) => a.data === todayStr && a.status !== 'cancelado');
  
  const faturamentoPrevistoHoje = todayAgendamentos.reduce((sum, a) => {
    return sum + (a.servico?.preco || 0);
  }, 0);

  // Cálculos de Estoque em Tempo Real
  const totalUnidadesEstoque = useMemo(() => {
    return produtos.reduce((sum, p) => sum + (Number(p.estoque_atual) || 0), 0);
  }, [produtos]);

  const itensCriticos = useMemo(() => {
    return produtos.filter((p) => Number(p.estoque_atual) <= Number(p.estoque_minimo));
  }, [produtos]);

  const dashboardProdutosFiltrados = useMemo(() => {
    if (stockFilterFolder === 'TODAS') return produtos;
    return produtos.filter((p) => {
      const catKey = p.categoria === 'Geral' ? 'Descartáveis' : p.categoria;
      return catKey.toLowerCase() === stockFilterFolder.toLowerCase();
    });
  }, [produtos, stockFilterFolder]);

  const itensCriticosFiltrados = useMemo(() => {
    return dashboardProdutosFiltrados.filter((p) => Number(p.estoque_atual) <= Number(p.estoque_minimo));
  }, [dashboardProdutosFiltrados]);

  const handleSlotClick = (colaboradorId: string, time: string) => {
    setAppointmentToEdit(null);
    setInitialSlotData({ colabId: colaboradorId, time });
    setIsAppModalOpen(true);
  };

  const handleAppointmentClick = (ag: Agendamento) => {
    setAppointmentToEdit(ag);
    setInitialSlotData({});
    setIsAppModalOpen(true);
  };

  useEffect(() => {
    const handleOpenModal = () => {
      setAppointmentToEdit(null);
      setInitialSlotData({});
      setIsAppModalOpen(true);
    };
    window.addEventListener('open-appointment-modal', handleOpenModal);
    return () => window.removeEventListener('open-appointment-modal', handleOpenModal);
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Topo do Painel Master */}
      <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] p-4 sm:p-6 rounded-2xl border border-[var(--border)] shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--accent-bg)] border border-[var(--accent)]/30 text-[var(--accent)] text-[10px] sm:text-xs font-oswald uppercase tracking-wider font-semibold mb-1.5 sm:mb-2">
              <Sparkles className="w-3 h-3 text-[var(--accent)]" />
              Painel Master de Controle
            </div>
            <h1 className="font-display uppercase text-xl sm:text-2xl lg:text-3xl tracking-wide text-[var(--text-primary)]">
              HYPE TATU — GESTÃO GERAL
            </h1>
            <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-0.5 sm:mt-1 max-w-lg font-inter leading-relaxed">
              Acompanhe a agenda do salão, faturamento diário, estoque e consumo de materiais da equipe.
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap sm:flex-nowrap mt-2 sm:mt-0 w-full sm:w-auto">
            <button
              onClick={() => setIsRotativoModalOpen(true)}
              className="flex-1 sm:flex-none justify-center bg-[var(--accent-bg)] hover:bg-[var(--accent)]/30 text-[#27AE60] dark:text-[#6FCF97] border border-[var(--accent)]/40 font-oswald uppercase font-bold text-xs py-2 sm:py-2.5 px-3 sm:px-4 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Flame className="w-3.5 h-3.5 text-[#27AE60]" />
              <span>Chamar Rotativo</span>
            </button>

            <button
              onClick={() => {
                setAppointmentToEdit(null);
                setInitialSlotData({});
                setIsAppModalOpen(true);
              }}
              className="flex-1 sm:flex-none justify-center bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] font-oswald uppercase font-bold text-xs py-2 sm:py-2.5 px-3.5 sm:px-5 rounded-xl flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Novo Agendamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Métricas Principais (visíveis em Overview e Agenda) - Grid 2x2 no Mobile, 4 colunas no Desktop */}
      {(activeTab === 'overview' || activeTab === 'agenda') && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="bg-[var(--bg-surface)] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[11px] text-[var(--text-secondary)] font-oswald uppercase tracking-wider font-semibold truncate">Agendamentos Hoje</div>
              <div className="font-display text-lg sm:text-[28px] lg:text-[32px] text-[var(--text-primary)] mt-0.5 leading-tight">
                {todayAgendamentos.length}
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <DollarSign className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[11px] text-[var(--text-secondary)] font-oswald uppercase tracking-wider font-semibold truncate">Previsão de Hoje</div>
              <div className="font-display text-base sm:text-2xl lg:text-[28px] text-[var(--accent)] mt-0.5 leading-tight truncate">
                R$ {faturamentoPrevistoHoje.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-[var(--bg-surface)] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-2.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--accent)]" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] sm:text-[11px] text-[var(--text-secondary)] font-oswald uppercase tracking-wider font-semibold truncate">Profissionais Ativos</div>
              <div className="font-display text-lg sm:text-[28px] lg:text-[32px] text-[var(--text-primary)] mt-0.5 leading-tight">
                {colaboradores.length}
              </div>
            </div>
          </div>

          {/* Card 4: Estoque no Salão com Navegação Direta */}
          <div
            onClick={() => navigate('/admin/estoque')}
            className="bg-[var(--bg-surface)] p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-[var(--border)] shadow-sm flex items-center gap-2.5 sm:gap-4 cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--bg-surface-alt)]/40 transition-all group"
            title="Clique para abrir o almoxarifado completo"
          >
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)] shrink-0 group-hover:scale-105 transition-transform">
              <Package className="w-4 h-4 sm:w-6 sm:h-6 text-[var(--accent)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] sm:text-[11px] text-[var(--text-secondary)] font-oswald uppercase tracking-wider font-semibold truncate flex items-center justify-between">
                <span>Estoque do Salão</span>
                <ArrowRight className="w-3 h-3 text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="font-display text-lg sm:text-[28px] lg:text-[32px] text-[var(--text-primary)] mt-0.5 leading-tight flex items-baseline gap-1">
                <span>{totalUnidadesEstoque}</span>
                <span className="text-xs sm:text-sm font-oswald font-normal text-[var(--text-muted)]">itens</span>
              </div>
              <div className="text-[10px] truncate mt-0.5 font-inter">
                {itensCriticos.length > 0 ? (
                  <span className="text-amber-500 font-semibold">{itensCriticos.length} itens abaixo do mín.</span>
                ) : (
                  <span className="text-[var(--text-secondary)]">{produtos.length} produtos cadastrados</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RENDERIZAÇÃO DO CONTEÚDO CONFORME A ABA/ROTA */}
      {(activeTab === 'overview' || activeTab === 'agenda') && (
        <div className="space-y-6">
          {/* Calendário Mensal */}
          <MonthCalendar
            selectedDate={selectedDate}
            onSelectDate={(dStr) => setSelectedDate(dStr)}
            agendamentos={agendamentos}
          />

          {/* Agenda do Dia por Colunas (Salão / Barbearia / Tattoo) */}
          <SalonDayColumns
            selectedDate={selectedDate}
            colaboradores={colaboradores}
            agendamentos={agendamentos}
            categorias={categorias}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
            onChamarRotativo={() => setIsRotativoModalOpen(true)}
            onRegistrarPagamento={(ag) => setPagamentoModalAgendamento(ag)}
          />

          {/* Seção Exclusiva: Estoque & Almoxarifado em Tempo Real na Dashboard */}
          <div className="bg-[var(--bg-surface)] text-[var(--text-primary)] rounded-xl sm:rounded-2xl border border-[var(--border)] shadow-sm p-4 sm:p-6 transition-colors space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[var(--accent-bg)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
                    <Package className="w-4 h-4" />
                  </div>
                  <h2 className="font-display uppercase tracking-wide text-lg sm:text-xl text-[var(--text-primary)]">
                    Estoque & Almoxarifado em Destaque
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1 font-inter">
                  Produtos, insumos e materiais disponíveis no salão com contagem de unidades e níveis de segurança.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => navigate('/admin/estoque')}
                  className="px-3.5 py-2 rounded-xl text-xs font-oswald uppercase tracking-wider font-bold bg-[var(--accent-bg)] hover:bg-[var(--accent)] text-[var(--accent-dark)] dark:text-[var(--accent)] hover:text-[#0B0E11] border border-[var(--accent)]/30 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span>Abrir Almoxarifado Completo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pastas de Filtro de Categoria */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['TODAS', 'Barbearia', 'Tatuagem', 'Piercing', 'Descartáveis', 'Bebidas'].map((catKey) => {
                const count = catKey === 'TODAS'
                  ? produtos.length
                  : produtos.filter((p) => (p.categoria === 'Geral' ? 'Descartáveis' : p.categoria).toLowerCase() === catKey.toLowerCase()).length;
                const isSelected = stockFilterFolder === catKey;
                return (
                  <button
                    key={catKey}
                    onClick={() => setStockFilterFolder(catKey)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-oswald uppercase tracking-wider font-semibold whitespace-nowrap transition-all border flex items-center gap-2 ${
                      isSelected
                        ? 'bg-[var(--accent)] text-[#0B0E11] border-[var(--accent)] shadow-sm'
                        : 'bg-[var(--bg-surface-alt)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border)]'
                    }`}
                  >
                    <span>{catKey}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-black/20 text-[#0B0E11]' : 'bg-[var(--border)] text-[var(--text-muted)]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Alerta de Itens Críticos na Categoria */}
            {itensCriticosFiltrados.length > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-500">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-inter">
                  <strong>Atenção de Reposição:</strong> {itensCriticosFiltrados.length} produto(s) nesta visualização estão abaixo da quantidade mínima necessária.
                </span>
              </div>
            )}

            {/* Tabela de Produtos da Dashboard */}
            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-left text-xs font-inter border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-surface-alt)] text-[var(--text-muted)] font-oswald uppercase tracking-wider text-[11px] border-b border-[var(--border)]">
                    <th className="py-2.5 px-3">Produto / Material</th>
                    <th className="py-2.5 px-3">Pasta / Categoria</th>
                    <th className="py-2.5 px-3">Setor</th>
                    <th className="py-2.5 px-3 text-center">Qtd Atual</th>
                    <th className="py-2.5 px-3 text-center">Mínimo</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Custo Unitário</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {dashboardProdutosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-xs text-[var(--text-muted)]">
                        Nenhum produto cadastrado nesta categoria.
                      </td>
                    </tr>
                  ) : (
                    dashboardProdutosFiltrados.slice(0, 10).map((prod) => {
                      const isLow = Number(prod.estoque_atual) <= Number(prod.estoque_minimo);
                      return (
                        <tr key={prod.id} className="hover:bg-[var(--bg-surface-alt)]/50 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-[var(--text-primary)]">
                            <div className="font-semibold text-xs">{prod.nome}</div>
                            {prod.subcategoria && (
                              <div className="text-[10px] text-[var(--text-muted)] font-inter">{prod.subcategoria}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-oswald uppercase tracking-wider font-semibold bg-[var(--bg-surface-alt)] border border-[var(--border)] text-[var(--text-secondary)]">
                              {prod.categoria}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-[var(--text-secondary)] capitalize text-xs">
                            {prod.setor_destinado || 'Geral'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`font-display text-sm ${isLow ? 'text-amber-500 font-bold' : 'text-[var(--text-primary)]'}`}>
                              {prod.estoque_atual}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] ml-1 font-inter">{prod.unidade}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-[var(--text-muted)] font-inter">
                            {prod.estoque_minimo} {prod.unidade}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isLow ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-oswald uppercase tracking-wider font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                <TrendingDown className="w-3 h-3" />
                                Baixo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-oswald uppercase tracking-wider font-bold bg-[var(--accent-bg)] text-[var(--accent-dark)] dark:text-[var(--accent)] border border-[var(--accent)]/30">
                                <CheckCircle2 className="w-3 h-3" />
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-display text-xs text-[var(--text-primary)]">
                            R$ {Number(prod.custo_unitario).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {dashboardProdutosFiltrados.length > 10 && (
              <div className="pt-2 flex items-center justify-between text-xs text-[var(--text-muted)] font-inter">
                <span>Exibindo 10 de {dashboardProdutosFiltrados.length} produtos desta pasta.</span>
                <button
                  onClick={() => navigate('/admin/estoque')}
                  className="text-[var(--accent)] hover:underline font-oswald uppercase tracking-wider font-semibold text-xs flex items-center gap-1"
                >
                  Ver todos os {dashboardProdutosFiltrados.length} itens no Almoxarifado Completo &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'servicos' && <ServiceList />}
      {activeTab === 'equipe' && <CollaboratorManagement />}
      {activeTab === 'estoque' && <ProductList />}
      {activeTab === 'clientes' && <ClientList />}
      {activeTab === 'relatorios' && <CollaboratorConsumption />}
      {activeTab === 'financeiro' && <AdminFinanceiroView />}

      {/* Modal de Agendamento */}
      <AppointmentModal
        isOpen={isAppModalOpen}
        onClose={() => setIsAppModalOpen(false)}
        appointmentToEdit={appointmentToEdit}
        initialDate={selectedDate}
        initialTime={initialSlotData.time}
        initialColaboradorId={initialSlotData.colabId}
        onSaved={loadData}
        onRegistrarPagamento={(ag) => setPagamentoModalAgendamento(ag)}
      />

      {/* Modal de Solicitação de Tatuador Rotativo */}
      <SolicitarRotativoModal
        isOpen={isRotativoModalOpen}
        onClose={() => setIsRotativoModalOpen(false)}
        initialDate={selectedDate}
        onSuccess={loadData}
      />

      {/* Modal Registrar Pagamento (PIX, Crédito à Vista, Parcelado, Débito ou Dinheiro) */}
      <RegistrarPagamentoModal
        isOpen={!!pagamentoModalAgendamento}
        onClose={() => setPagamentoModalAgendamento(null)}
        agendamento={pagamentoModalAgendamento}
        onSuccess={loadData}
      />
    </div>
  );
};
