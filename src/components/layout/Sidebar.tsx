import type React from 'react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRightLeft, ChevronLeft, ChevronRight, ClipboardList, Droplets, FileSpreadsheet, Fish, FlaskConical, LayoutDashboard, List, Settings2, Waves,
  Boxes,
  Cpu,
  Users,
  TrendingUp,
  CalendarDays,
  HeartPulse,
  BarChart3,
  Building2,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const COLLAPSED_KEY = 'aquafort_sidebar_collapsed';
const EXPANDED_WIDTH = 248;
const COLLAPSED_WIDTH = 72;

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  /**
   * Temporarily hides the item from the sidebar without touching its route,
   * page or logic. Flip back to `false` (or drop the flag) to bring it back —
   * nothing else needs to change. Currently used for Despesca (decisão Pedro,
   * 2026-08-16: esconder, não remover).
   */
  hidden?: boolean;
  /** RN-04: só aparece pra quem é admin global — o mesmo grupo de rotas atrás de RequireAdmin. */
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'VISÃO GERAL',
    items: [
      { to: '/dashboard', label: 'Painel', icon: <LayoutDashboard size={18} /> },
      { to: '/tanques', label: 'Viveiros', icon: <Fish size={18} /> },
    ],
  },
  {
    title: 'PRODUÇÃO',
    items: [
      { to: '/povoamento', label: 'Povoamento', icon: <List size={18} /> },
      { to: '/transferencia', label: 'Transferência', icon: <ArrowRightLeft size={18} /> },
    ],
  },
  {
    title: 'MANEJO',
    items: [
      { to: '/nutrition', label: 'Ração', icon: <ClipboardList size={18} /> },
      { to: '/biometrias', label: 'Biometrias', icon: <FlaskConical size={18} /> },
      { to: '/water-quality', label: 'Qualidade', icon: <Droplets size={18} /> },
      { to: '/despesca', label: 'Despesca', icon: <Waves size={18} />, hidden: true },
    ],
  },
  {
    title: 'ANÁLISES',
    items: [
      { to: '/mortalidade', label: 'Mortalidade', icon: <HeartPulse size={18} /> },
      { to: '/consumo', label: 'Consumo x peso', icon: <TrendingUp size={18} /> },
      { to: '/paineis', label: 'Painéis', icon: <BarChart3 size={18} /> },
    ],
  },
  {
    title: 'EQUIPE',
    items: [
      { to: '/despesca-calendario', label: 'Calendário', icon: <CalendarDays size={18} /> },
      { to: '/arracoadores', label: 'Arraçoadores', icon: <Users size={18} /> },
      { to: '/alimentadores', label: 'Alimentadores', icon: <Cpu size={18} /> },
    ],
  },
  {
    // Materiais, Relatórios e Configurações não estavam no agrupamento pedido
    // por Pedro — mantidos aqui (sem outra porta de entrada no app) até
    // confirmação se devem sumir de vez. Ver relatório da tarefa.
    title: 'SISTEMA',
    items: [
      { to: '/materiais', label: 'Materiais', icon: <Boxes size={18} /> },
      { to: '/relatorios-operacionais', label: 'Relatórios', icon: <FileSpreadsheet size={18} /> },
      { to: '/settings', label: 'Configurações', icon: <Settings2 size={18} /> },
      { to: '/ajuda', label: 'Ajuda', icon: <HelpCircle size={18} /> },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { to: '/admin/fazendas', label: 'Fazendas', icon: <Building2 size={18} />, adminOnly: true },
      { to: '/admin/vinculos', label: 'Vínculos', icon: <ShieldCheck size={18} />, adminOnly: true },
    ],
  },
];

export function Sidebar() {
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === 'true');

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }

  return (
    <aside
      style={{
        width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        minWidth: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH,
        backgroundColor: 'var(--bg-primary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'width 0.15s ease, min-width 0.15s ease',
      }}
    >
      {/* Logo + collapse toggle share one compact header band. */}
      <div
        style={{
          padding: collapsed ? '14px 0' : '14px 12px 14px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          flexDirection: collapsed ? 'column' : 'row',
          gap: collapsed ? 10 : 0,
        }}
      >
        {collapsed ? (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title="Aquafort"
          >
            <Waves size={16} color="#fff" />
          </div>
        ) : (
          <img src="/logo.png" alt="Aquafort" style={{ width: 104, height: 'auto', display: 'block' }} />
        )}

        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            flexShrink: 0,
            padding: 0,
            borderRadius: 6,
            border: 'none',
            background: 'transparent',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-card-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '8px', flex: 1, overflow: 'auto' }}>
        {navGroups.map((group) => {
          const items = group.items.filter((item) => !item.hidden && (!item.adminOnly || isAdmin));
          if (!items.length) return null;

          return (
            <div key={group.title} style={{ marginBottom: 14 }}>
              {!collapsed && (
                <div
                  style={{
                    padding: '10px 14px 6px',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: 'var(--text-muted)',
                  }}
                >
                  {group.title}
                </div>
              )}
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: '10px',
                    padding: collapsed ? '10px' : '10px 14px',
                    borderRadius: 8,
                    marginBottom: '6px',
                    color: isActive ? 'var(--accent-dark)' : 'var(--text-secondary)',
                    backgroundColor: isActive ? 'var(--accent-soft)' : 'transparent',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '14px',
                    textDecoration: 'none',
                    transition: 'background-color 0.15s, color 0.15s, transform 0.15s',
                  })}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    if (!el.style.backgroundColor.includes('0.1')) {
                      el.style.backgroundColor = 'rgba(37, 99, 235, 0.06)';
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
                  {!collapsed && item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      <div style={{ padding: collapsed ? '12px 0' : '12px 16px', borderTop: '1px solid var(--border)', textAlign: collapsed ? 'center' : 'left' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.03em' }}>
          {collapsed ? 'v1' : 'v1.0.0 · Aquafort'}
        </span>
      </div>
    </aside>
  );
}
