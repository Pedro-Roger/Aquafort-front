import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
