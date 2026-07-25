import type React from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRightLeft, ClipboardList, Droplets, FileSpreadsheet, Fish, FlaskConical, LayoutDashboard, List, Settings2, Waves,
  Boxes,
  Cpu,
  Users,
  TrendingUp,
  CalendarDays,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Painel', icon: <LayoutDashboard size={18} /> },
  { to: '/tanques', label: 'Viveiros', icon: <Fish size={18} /> },
  { to: '/povoamento', label: 'Povoamento', icon: <List size={18} /> },
  { to: '/transferencia', label: 'Transferência', icon: <ArrowRightLeft size={18} /> },
  { to: '/nutrition', label: 'Ração', icon: <ClipboardList size={18} /> },
  { to: '/biometrias', label: 'Biometrias', icon: <FlaskConical size={18} /> },
  { to: '/consumo', label: 'Consumo x peso', icon: <TrendingUp size={18} /> },
  { to: '/water-quality', label: 'Qualidade', icon: <Droplets size={18} /> },
  { to: '/despesca', label: 'Despesca', icon: <Waves size={18} /> },
  { to: '/despesca-calendario', label: 'Calendário', icon: <CalendarDays size={18} /> },
  { to: '/arracoadores', label: 'Arraçoadores', icon: <Users size={18} /> },
  { to: '/alimentadores', label: 'Alimentadores', icon: <Cpu size={18} /> },
  { to: '/materiais', label: 'Materiais', icon: <Boxes size={18} /> },
  { to: '/relatorios-operacionais', label: 'Relatórios', icon: <FileSpreadsheet size={18} /> },
  { to: '/settings', label: 'Configurações', icon: <Settings2 size={18} /> },
];

export function Sidebar() {
  const items = navItems;

  return (
    <aside
      style={{
        width: '248px',
        minWidth: '248px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(240,248,255,0.96))',
        backdropFilter: 'blur(18px)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 18px 16px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Aquafort" style={{ width: 122, height: 'auto', display: 'block' }} />
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '8px', flex: 1, overflow: 'auto' }}>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 14px',
              borderRadius: '14px',
              marginBottom: '6px',
              color: isActive ? 'var(--accent-dark)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
              fontWeight: isActive ? 700 : 500,
              fontSize: '14px',
              textDecoration: 'none',
              transition: 'background-color 0.15s, color 0.15s, transform 0.15s',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              if (!el.style.backgroundColor.includes('0.1')) {
                el.style.backgroundColor = 'rgba(2, 132, 199, 0.06)';
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              if (!el.style.backgroundColor.includes('0.1')) {
                el.style.backgroundColor = 'transparent';
              }
            }}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>v1.0.0 · Aquafort</span>
      </div>
    </aside>
  );
}
