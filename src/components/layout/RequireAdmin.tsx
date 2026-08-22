import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Guarda de rota pras telas admin-only (RN-04: fazendas e vínculos
 * usuário-fazenda são exclusivos do admin global). Mesmo padrão de
 * `AppLayout` — `Navigate` em vez de renderizar a página — só que checando
 * `isAdmin` em vez de `isAuthenticated`. Composto dentro do `<Route
 * element={<AppLayout />}>`, então quem cai aqui já está autenticado.
 */
export function RequireAdmin() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
