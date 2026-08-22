import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useFarm } from '../../hooks/useFarm';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

/**
 * Além de `isAuthenticated`, também espera `farmsLoading` (GET /me/farms,
 * via `FarmContext`) antes de renderizar `<Outlet/>`. Sem esse segundo gate,
 * no primeiro login (antes de `aquafort_active_farm_id` existir no
 * localStorage) as páginas de domínio disparam suas queries antes do
 * interceptor do axios (src/lib/api.ts) ter um farmId pra enviar em
 * `X-Farm-Id` — o backend (FarmScopeGuard) responde 403 e, como a maioria
 * das telas só trata `isLoading`, isso vira um estado vazio enganoso em vez
 * de um erro visível.
 */
export function AppLayout() {
  const { isAuthenticated } = useAuth();
  const { farmsLoading } = useFarm();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (farmsLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100svh',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: 28,
            height: 28,
            border: '3px solid var(--accent-dark, #b45309)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100svh',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0.08))',
      }}
    >
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header />
        <main style={{ flex: 1, overflow: 'auto', padding: '24px 24px 28px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
