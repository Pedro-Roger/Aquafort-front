import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at top, #ffffff 0, #f4f8fc 42%, #eaf2f9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        color: 'var(--text-muted)',
      }}
    >
      <div style={{ fontSize: '80px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>404</div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>Página não encontrada</h1>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
        A página que você está procurando não existe ou foi removida.
      </p>
      <Link
        to="/map"
        style={{
          marginTop: '8px',
          padding: '10px 20px',
          backgroundColor: 'var(--accent)',
          color: '#fff',
          borderRadius: '8px',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '14px',
        }}
      >
        Voltar ao início
      </Link>
    </div>
  );
}
