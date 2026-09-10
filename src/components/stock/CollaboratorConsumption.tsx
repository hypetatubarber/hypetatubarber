import React, { useState, useEffect } from 'react';
import { Usuario, UsoProduto, Produto } from '../../types';
import { api } from '../../services/api';
import { BarChart3, DollarSign, TrendingUp, Trophy } from 'lucide-react';

export const CollaboratorConsumption: React.FC = () => {
  const [colaboradores, setColaboradores] = useState<Usuario[]>([]);
  const [usos, setUsos] = useState<UsoProduto[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [selectedColaboradorId, setSelectedColaboradorId] = useState<string>('all');
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('mes');

  useEffect(() => {
    const load = async () => {
      try {
        const [colabList, usoList, prodList] = await Promise.all([
          api.getColaboradores(),
          api.getUsoProdutos(),
          api.getProdutos(),
        ]);
        setColaboradores(colabList);
        setUsos(usoList);
        setProdutos(prodList);
      } catch (err) {
        console.error('Erro ao carregar dados de consumo:', err);
      }
    };
    load();
  }, []);

  // Filtra usos por período
  const filteredUsos = usos.filter((u) => {
    if (selectedColaboradorId !== 'all' && u.colaborador_id !== selectedColaboradorId) {
      return false;
    }

    if (periodo === 'todos') return true;

    const todayStr = new Date().toISOString().split('T')[0];
    if (periodo === 'hoje') {
      return u.data === todayStr;
    }

    const itemDate = new Date(u.data);
    const now = new Date();
    if (periodo === 'mes') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    if (periodo === 'semana') {
      const diffTime = Math.abs(now.getTime() - itemDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    }

    return true;
  });

  // Agrupa consumo por produto para o colaborador selecionado
  const consumoPorProduto = filteredUsos.reduce((acc, uso) => {
    const prod = produtos.find((p) => p.id === uso.produto_id) || uso.produto;
    const custoUnit = prod?.custo_unitario || 0;
    const custoTotal = uso.quantidade * custoUnit;

    if (!acc[uso.produto_id]) {
      acc[uso.produto_id] = {
        nome: prod?.nome || 'Produto',
        unidade: prod?.unidade || 'un',
        quantidadeTotal: 0,
        custoTotal: 0,
      };
    }
    acc[uso.produto_id].quantidadeTotal += uso.quantidade;
    acc[uso.produto_id].custoTotal += custoTotal;
    return acc;
  }, {} as Record<string, { nome: string; unidade: string; quantidadeTotal: number; custoTotal: number }>);

  const totalGeralGasto = Object.values(consumoPorProduto).reduce((sum, item) => sum + item.custoTotal, 0);

  const rankingColaboradores = colaboradores.map((colab) => {
    const usosDoColab = usos.filter((u) => u.colaborador_id === colab.id);
    const custoTotal = usosDoColab.reduce((sum, u) => {
      const prod = produtos.find((p) => p.id === u.produto_id) || u.produto;
      return sum + u.quantidade * (prod?.custo_unitario || 0);
    }, 0);

    return {
      colaborador: colab,
      totalRegistros: usosDoColab.length,
      custoTotal,
    };
  }).sort((a, b) => b.custoTotal - a.custoTotal);

  return (
    <div className="space-y-6 text-[var(--text-primary)]">
      {/* Topo: Título & Filtro de Período */}
      <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
            <h3 className="font-display uppercase tracking-wide text-lg sm:text-xl text-[var(--text-primary)]">
              Consumo de Insumos por Colaborador
            </h3>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-inter">
            Analise o custo de materiais, agulhas, tintas e cosméticos utilizados por cada profissional.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Seletor de Colaborador */}
          <select
            value={selectedColaboradorId}
            onChange={(e) => setSelectedColaboradorId(e.target.value)}
            className="text-xs bg-[var(--bg-surface-alt)] border border-[var(--border)] rounded-lg px-3 py-2 font-inter text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
          >
            <option value="all">Todos os Colaboradores</option>
            {colaboradores.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>

          {/* Seletor de Período */}
          <div className="flex items-center bg-[var(--bg-surface-alt)] p-1 rounded-lg border border-[var(--border)] text-xs font-oswald uppercase tracking-wider font-semibold">
            <button
              onClick={() => setPeriodo('hoje')}
              className={`px-3 py-1 rounded-md transition-all ${periodo === 'hoje' ? 'bg-[var(--accent)] text-[#0B0E11] font-bold shadow-accent' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Hoje
            </button>
            <button
              onClick={() => setPeriodo('semana')}
              className={`px-3 py-1 rounded-md transition-all ${periodo === 'semana' ? 'bg-[var(--accent)] text-[#0B0E11] font-bold shadow-accent' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              7 Dias
            </button>
            <button
              onClick={() => setPeriodo('mes')}
              className={`px-3 py-1 rounded-md transition-all ${periodo === 'mes' ? 'bg-[var(--accent)] text-[#0B0E11] font-bold shadow-accent' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Este Mês
            </button>
            <button
              onClick={() => setPeriodo('todos')}
              className={`px-3 py-1 rounded-md transition-all ${periodo === 'todos' ? 'bg-[var(--accent)] text-[#0B0E11] font-bold shadow-accent' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              Geral
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Métricas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-dark)] dark:text-[var(--accent)] shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase tracking-wider font-semibold">Custo Total de Insumos</div>
            <div className="font-display text-2xl text-[var(--text-primary)] mt-0.5">
              R$ {totalGeralGasto.toFixed(2)}
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-dark)] dark:text-[var(--accent)] shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase tracking-wider font-semibold">Total de Lançamentos</div>
            <div className="font-display text-2xl text-[var(--text-primary)] mt-0.5">
              {filteredUsos.length} registros
            </div>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] p-5 rounded-xl border border-[var(--border)] shadow-soft flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-dark)] dark:text-[var(--accent)] shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase tracking-wider font-semibold">Maior Consumo</div>
            <div className="font-display text-lg text-[var(--text-primary)] mt-1 truncate max-w-[170px]">
              {rankingColaboradores[0]?.colaborador.nome || 'Nenhum'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabela de Produtos Usados no Período */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] shadow-soft overflow-hidden">
          <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-surface-alt)] flex items-center justify-between">
            <h4 className="font-oswald uppercase tracking-wider font-semibold text-sm text-[var(--text-primary)]">
              Detalhamento de Itens Utilizados
            </h4>
            <span className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase">
              {Object.keys(consumoPorProduto).length} itens distintos
            </span>
          </div>

          {Object.keys(consumoPorProduto).length === 0 ? (
            <div className="p-8 text-center text-[var(--text-muted)] text-xs font-inter">
              Nenhum material registrado no período selecionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-surface-alt)] border-b border-[var(--border)] text-[11px] font-oswald uppercase tracking-wider font-semibold text-[var(--accent-dark)] dark:text-[var(--accent)]">
                  <tr>
                    <th className="p-4">Produto</th>
                    <th className="p-4">Quantidade Utilizada</th>
                    <th className="p-4 text-right">Custo Gerado (R$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]/60">
                  {Object.entries(consumoPorProduto).map(([id, item], idx) => (
                    <tr
                      key={id}
                      className={`${idx % 2 === 0 ? 'bg-[var(--bg-surface)]' : 'bg-[var(--table-row-alt)]'} hover:bg-[var(--table-row-hover)] transition-colors`}
                    >
                      <td className="p-4 font-medium text-[var(--text-primary)] font-inter">{item.nome}</td>
                      <td className="p-4 font-inter text-[var(--text-secondary)]">
                        {item.quantidadeTotal} {item.unidade}
                      </td>
                      <td className="p-4 text-right font-display text-base text-[var(--text-primary)]">
                        R$ {item.custoTotal.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ranking Comparativo entre Colaboradores */}
        <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] shadow-soft p-5">
          <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[var(--border)]">
            <Trophy className="w-4 h-4 text-[var(--accent-dark)] dark:text-[var(--accent)]" />
            <h4 className="font-oswald uppercase tracking-wider font-semibold text-sm text-[var(--text-primary)]">
              Ranking Comparativo
            </h4>
          </div>

          <div className="space-y-3">
            {rankingColaboradores.map((rank, index) => (
              <div
                key={rank.colaborador.id}
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface-alt)] flex items-center justify-between gap-3 hover:border-[var(--accent)] transition-all"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      index === 0
                        ? 'bg-[var(--accent)] text-[#0B0E11]'
                        : index === 1
                        ? 'bg-[#517566] text-white'
                        : 'bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[rgba(140,189,173,0.2)]'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-oswald uppercase tracking-wider font-semibold text-[var(--text-primary)] truncate">
                      {rank.colaborador.nome}
                    </div>
                    <div className="text-[10px] text-[var(--text-secondary)] truncate font-inter">
                      {rank.totalRegistros} {rank.totalRegistros === 1 ? 'uso' : 'usos'}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-display text-[var(--text-primary)]">
                    R$ {rank.custoTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
