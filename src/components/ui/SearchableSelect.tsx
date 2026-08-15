import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { controlHeight, radius, space } from './surfaces';

interface SearchableSelectProps {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SearchableSelect({ label, error, options, placeholder = 'Selecione', value, onChange, disabled }: SearchableSelectProps) {
  const reactId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((opt) => opt.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function selectOption(optValue: string) {
    onChange(optValue);
    setOpen(false);
    setQuery('');
  }

  return (
    <div ref={rootRef} style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
      {label && (
        <label htmlFor={reactId} style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.03em' }}>
          {label}
        </label>
      )}
      <button
        id={reactId}
        type="button"
        onClick={() => (open ? setOpen(false) : openDropdown())}
        disabled={disabled}
        style={{
          backgroundColor: 'var(--bg-input)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: radius.control,
          height: controlHeight,
          padding: `0 ${space.inline + 4}px`,
          color: selected ? 'var(--text-primary)' : 'var(--text-muted)',
          outline: 'none',
          width: '100%',
          textAlign: 'left',
          cursor: disabled ? 'default' : 'pointer',
          boxShadow: 'inset 0 1px 2px rgba(15, 23, 42, 0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected ? selected.label : placeholder}
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" style={{ flexShrink: 0 }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            zIndex: 50,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: radius.control,
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
            overflow: 'hidden',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: 'none',
              borderBottom: '1px solid var(--border)',
              padding: `0 ${space.inline + 4}px`,
              height: controlHeight,
              backgroundColor: 'var(--bg-input)',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
          <div style={{ maxHeight: 240, overflowY: 'auto' }}>
            {filtered.length === 0 && (
              <div style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 13 }}>Nenhum resultado.</div>
            )}
            {filtered.map((opt) => (
              <div
                key={opt.value}
                onClick={() => selectOption(opt.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  backgroundColor: opt.value === value ? 'var(--bg-hover, rgba(2, 132, 199, 0.08))' : 'transparent',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(2, 132, 199, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = opt.value === value ? 'rgba(2, 132, 199, 0.08)' : 'transparent')}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
      {error && <span style={{ fontSize: '12px', color: 'var(--danger)', paddingLeft: '2px' }}>{error}</span>}
    </div>
  );
}
