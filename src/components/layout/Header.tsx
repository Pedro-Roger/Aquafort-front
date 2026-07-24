import { useLocation, useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const titles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Painel operacional', subtitle: 'Ações rápidas e acompanhamento do dia.' },
  '/map': { title: 'Painel operacional', subtitle: 'Ações rápidas e acompanhamento do dia.' },
  '/tanques': { title: 'Viveiros', subtitle: 'Cadastro e visão dos viveiros.' },
  '/povoamento': { title: 'Povoamento', subtitle: 'Distribuição e entrada de lotes.' },
  '/transferencia': { title: 'Transferência', subtitle: 'Movimentação entre viveiros.' },
  '/nutrition': { title: 'Ração', subtitle: 'Dieta e consumo diário por viveiro.' },
  '/biometrias': { title: 'Biometrias', subtitle: 'Base para ajuste da dieta.' },
  '/water-quality': { title: 'Qualidade da água', subtitle: 'Medições e alertas do ciclo.' },
  '/despesca': { title: 'Despesca', subtitle: 'Janela e planejamento de saída.' },
  '/relatorios-operacionais': { title: 'Relatórios operacionais', subtitle: 'Exportação em Excel por fase.' },
  '/stock': { title: 'Estoque', subtitle: 'Insumos e movimentações.' },
  '/settings': { title: 'Configurações da fazenda', subtitle: 'Tabela de referência da biometria.' },
}

export function Header() {
  const { user, clearAuth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const current = titles[location.pathname] ?? { title: 'Aquafort', subtitle: 'Gestão operacional' }

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <header
      style={{
        height: '64px',
        backgroundColor: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        gap: '12px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>{current.title}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{current.subtitle}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={15} color="#fff" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user.role}</span>
            </div>
          </div>
        )}
        <div style={{ width: 1, height: 24, backgroundColor: 'var(--border)' }} />
        <button
          onClick={handleLogout}
          title="Sair"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                borderRadius: '999px',
                border: 'none',
                backgroundColor: 'rgba(2, 132, 199, 0.06)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'background-color 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(2,132,199,0.10)'
            e.currentTarget.style.color = 'var(--accent-dark)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          <LogOut size={15} />
          Sair
        </button>
      </div>
    </header>
  )
}
