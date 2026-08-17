import { radius } from './surfaces';

interface UnitToggleOption<TUnit extends string> {
  unit: TUnit;
  label: string;
}

interface UnitToggleProps<TUnit extends string> {
  ariaLabel: string;
  value: TUnit;
  options: UnitToggleOption<TUnit>[];
  onChange: (unit: TUnit) => void;
}

/**
 * Par de botões de seleção de unidade (ex.: PL/g vs. Peso (g)). Mesmo padrão
 * visual já usado em BiometricsModalForm.tsx (RN-10) — extraído aqui para
 * reuso em TransferenciaPage.tsx sem duplicar o markup, sem tocar no arquivo
 * de biometria (fora de escopo/paralelo a outra tarefa).
 */
export function UnitToggle<TUnit extends string>({ ariaLabel, value, options, onChange }: UnitToggleProps<TUnit>) {
  return (
    <div role="group" aria-label={ariaLabel} style={{ display: 'flex', gap: 8 }}>
      {options.map(({ unit, label }) => {
        const selected = value === unit;
        return (
          <button
            key={unit}
            type="button"
            onClick={() => onChange(unit)}
            aria-pressed={selected}
            style={{
              padding: '5px 10px',
              borderRadius: radius.pill,
              backgroundColor: selected ? 'var(--accent-soft)' : 'var(--bg-card)',
              border: selected ? '1px solid var(--accent)' : '1px solid var(--border)',
              color: selected ? 'var(--accent-dark)' : 'var(--text-secondary)',
              fontSize: 12,
              fontWeight: selected ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
