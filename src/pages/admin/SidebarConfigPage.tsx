import { useState } from 'react';
import { useSidebarVisibility, useUpdateSidebarVisibility } from '../../hooks/useSidebarVisibility';
import { useAuth } from '../../hooks/useAuth';
import { useFarm } from '../../hooks/useFarm';
import { Checkbox } from '../../components/ui/Checkbox';

const NAV_GROUPS = [
  {
    title: 'VISÃO GERAL',
    items: [
      { to: '/dashboard', label: 'Painel' },
      { to: '/tanques', label: 'Viveiros' },
    ],
  },
  {
    title: 'PRODUÇÃO',
    items: [
      { to: '/povoamento', label: 'Povoamento' },
      { to: '/transferencia', label: 'Transferência' },
    ],
  },
  {
    title: 'MANEJO',
    items: [
      { to: '/nutrition', label: 'Ração' },
      { to: '/biometrias', label: 'Biometrias' },
      { to: '/water-quality', label: 'Qualidade' },
      { to: '/despesca', label: 'Despesca' },
    ],
  },
  {
    title: 'ANÁLISES',
    items: [
      { to: '/mortalidade', label: 'Mortalidade' },
      { to: '/consumo', label: 'Consumo x peso' },
      { to: '/paineis', label: 'Painéis' },
    ],
  },
  {
    title: 'EQUIPE',
    items: [
      { to: '/despesca-calendario', label: 'Calendário' },
      { to: '/arracoadores', label: 'Arraçoadores' },
      { to: '/alimentadores', label: 'Alimentadores' },
    ],
  },
  {
    title: 'SISTEMA',
    items: [
      { to: '/materiais', label: 'Materiais' },
      { to: '/relatorios-operacionais', label: 'Relatórios' },
      { to: '/settings', label: 'Configurações' },
      { to: '/ajuda', label: 'Ajuda' },
    ],
  },
  {
    title: 'ADMIN',
    items: [
      { to: '/admin/fazendas', label: 'Fazendas' },
      { to: '/admin/vinculos', label: 'Vínculos' },
      { to: '/admin/sidebar', label: 'Sidebar' },
    ],
  },
];

export function SidebarConfigPage() {
  const { isAdmin } = useAuth();
  const { activeFarmId } = useFarm();
  const { data: visibility, isLoading } = useSidebarVisibility(activeFarmId ?? null);
  const updateVis = useUpdateSidebarVisibility();

  const [localHidden, setLocalHidden] = useState<string[]>(visibility?.hiddenModules ?? []);

  const handleToggle = (route: string) => {
    setLocalHidden((prev) =>
      prev.includes(route) ? prev.filter((r) => r !== route) : [...prev, route],
    );
  };

  const handleSave = () => {
    updateVis.mutate(
      { farmId: activeFarmId!, hiddenModules: localHidden },
      {
        onError: () => {
          // rollback on error
          setLocalHidden(visibility?.hiddenModules ?? []);
        },
      },
    );
  };

  if (!isAdmin) return null;

  return (
    <div style={{ padding: '24px', maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Configurar módulos da Sidebar</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Escolha quais módulos ficam visíveis na sidebar desta fazenda. Alterações afetam todos
          os usuários da fazenda. Apenas admins podem alterar.
        </p>
      </div>

      {isLoading ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
          Carregando configuração atual...
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {NAV_GROUPS.map((group) => (
            <fieldset
              key={group.title}
              style={{
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '16px 20px',
                backgroundColor: 'var(--bg-card)',
              }}
            >
              <legend
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '0 8px',
                }}
              >
                {group.title}
              </legend>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {group.items.map((item) => (
                  <label
                    key={item.to}
                    style={{
                      flex: '1 1 280px',
                      minWidth: 240,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      cursor: 'pointer',
                      padding: '10px 12px',
                      borderRadius: 8,
                      backgroundColor: 'var(--bg-primary)',
                      border: '1px solid var(--border)',
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <Checkbox
                      checked={!localHidden.includes(item.to)}
                      onChange={() => handleToggle(item.to)}
                    />
                    <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {item.to}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setLocalHidden(visibility?.hiddenModules ?? [])}
              disabled={updateVis.isPending}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateVis.isPending}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: 'var(--accent)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 14,
                cursor: updateVis.isPending ? 'not-allowed' : 'pointer',
                opacity: updateVis.isPending ? 0.7 : 1,
              }}
            >
              {updateVis.isPending ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}