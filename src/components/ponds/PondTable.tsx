import type { Pond } from '../../types';

const STATUS_COLORS: Record<string, string> = {
  VAZIO: '#94a3b8', PREPARANDO: '#7dd3fc', POVOADO: '#38bdf8', DESPESCANDO: '#0ea5e9', INATIVO: '#cbd5e1',
};
const STATUS_LABELS: Record<string, string> = {
  VAZIO: 'Vazio', PREPARANDO: 'Preparando', POVOADO: 'Povoado', DESPESCANDO: 'Despescando', INATIVO: 'Inativo',
};
const TYPE_LABELS: Record<string, string> = {
  PRE_BERCARIO: 'Pré-berçário', BERCARIO: 'Berçário', ENGORDA: 'Engorda', REPRODUTOR: 'Reprodutor',
};

interface Props {
  ponds: Pond[];
  onEdit?: (pond: Pond) => void;
}

export function PondTable({ ponds, onEdit }: Props) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr>
            {['Código', 'Nome', 'Tipo', 'Área', 'Status', 'Ações'].map(label => (
              <th key={label} style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-secondary)', fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ponds.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontFamily: 'monospace', fontWeight: 600 }}>{p.code}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{p.name}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{TYPE_LABELS[p.type] ?? p.type}</td>
              <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{p.areaHa} ha</td>
              <td style={{ padding: '10px 12px' }}>
                <span style={{ backgroundColor: 'var(--bg-elevated)', color: STATUS_COLORS[p.status], border: `1px solid ${STATUS_COLORS[p.status]}`, borderRadius: 12, padding: '2px 10px', fontSize: 11 }}>
                  {STATUS_LABELS[p.status] ?? p.status}
                </span>
              </td>
              <td style={{ padding: '10px 12px' }}>
                {onEdit && <button onClick={() => onEdit(p)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>Editar</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!ponds.length && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>Nenhum viveiro cadastrado.</div>
      )}
    </div>
  );
}
