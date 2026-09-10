import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent-dark)] dark:text-[var(--accent)] font-display font-black text-3xl flex items-center justify-center mb-4 tracking-wider">
        404
      </div>
      <h2 className="font-heading font-semibold text-2xl uppercase tracking-wider text-[var(--text-primary)] mb-2">Página Não Encontrada</h2>
      <p className="text-sm font-sans text-[var(--text-secondary)] max-w-sm mb-6">
        A rota solicitada não existe ou você não possui permissão para acessá-la.
      </p>
      <Link
        to="/admin"
        className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-dark)] text-[#0B0E11] hover:text-[var(--text-primary)] font-heading font-semibold text-sm uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all shadow-md"
      >
        <Home className="w-4 h-4" />
        Voltar para a Página Inicial
      </Link>
    </div>
  );
};
