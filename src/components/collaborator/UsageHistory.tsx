import React from 'react';
import { UsoProduto } from '../../types';
import { Package, Calendar } from 'lucide-react';

interface Props {
  usages: UsoProduto[];
}

export const UsageHistory: React.FC<Props> = ({ usages }) => {
  if (usages.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] rounded-xl p-6 text-center border border-[var(--border)] shadow-soft text-[var(--text-primary)]">
        <Package className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
        <p className="text-xs text-[var(--text-secondary)] font-inter">
          Nenhum registro de consumo de material realizado até o momento.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-xl border border-[var(--border)] shadow-soft overflow-hidden text-[var(--text-primary)]">
      <div className="p-4 border-b border-[var(--border)] bg-[var(--bg-surface-alt)] flex items-center justify-between">
        <h4 className="font-oswald uppercase tracking-wider font-semibold text-sm text-[var(--text-primary)]">
          Histórico de Insumos Utilizados
        </h4>
        <span className="text-xs text-[var(--accent-dark)] dark:text-[var(--accent)] font-oswald uppercase font-semibold">
          Total de {usages.length} {usages.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      <div className="divide-y divide-[var(--border)]/60 max-h-96 overflow-y-auto">
        {usages.map((uso, idx) => (
          <div
            key={uso.id}
            className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 ${idx % 2 === 0 ? 'bg-[var(--bg-surface)]' : 'bg-[var(--table-row-alt)]'} hover:bg-[var(--table-row-hover)] transition-colors`}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--bg-surface-alt)] border border-[var(--border)] flex items-center justify-center text-[var(--accent-dark)] dark:text-[var(--accent)] shrink-0 mt-0.5">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-semibold text-[var(--text-primary)] font-inter">
                  {uso.produto?.nome || 'Produto'}
                </h5>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--text-secondary)] flex-wrap font-inter">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[var(--text-muted)]" />
                    {uso.data}
                  </span>
                  {uso.observacao && (
                    <span className="text-[var(--text-secondary)] bg-[var(--bg-surface-alt)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[10px]">
                      {uso.observacao}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-display text-[var(--accent-dark)] dark:text-[var(--accent)] bg-[var(--bg-surface-alt)] border border-[var(--border)] px-2.5 py-1 rounded-md">
                {uso.quantidade} {uso.produto?.unidade || 'un'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
