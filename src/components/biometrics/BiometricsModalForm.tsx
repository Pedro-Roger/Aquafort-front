import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface BiometricsModalFormProps {
  open: boolean;
  onClose: () => void;
  pondCode: string;
  loading?: boolean;
  onSubmit: (data: {
    measuredAt: string;
    sampleCount: number;
    averageWeightG: number;
    survivalRatePct?: number;
    estimatedBiomass?: number;
  }) => void;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function BiometricsModalForm({
  open,
  onClose,
  pondCode,
  loading = false,
  onSubmit,
}: BiometricsModalFormProps) {
  const [form, setForm] = React.useState({
    measuredAt: todayIsoDate(),
    sampleCount: '',
    averageWeightG: '',
    survivalRatePct: '',
    estimatedBiomass: '',
  });

  const handleSave = () => {
    if (!form.measuredAt || !form.sampleCount || !form.averageWeightG) return;

    onSubmit({
      measuredAt: form.measuredAt,
      sampleCount: Number(form.sampleCount),
      averageWeightG: Number(form.averageWeightG),
      survivalRatePct: form.survivalRatePct ? Number(form.survivalRatePct) : undefined,
      estimatedBiomass: form.estimatedBiomass ? Number(form.estimatedBiomass) : undefined,
    });

    setForm({
      measuredAt: todayIsoDate(),
      sampleCount: '',
      averageWeightG: '',
      survivalRatePct: '',
      estimatedBiomass: '',
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Nova leitura — ${pondCode}`}
      width={500}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Registre os dados coletados no viveiro para atualizar a biometria.
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <Input
            label="Data"
            type="date"
            value={form.measuredAt}
            onChange={(e) => setForm((current) => ({ ...current, measuredAt: e.target.value }))}
          />
          <Input
            label="Amostras"
            type="number"
            value={form.sampleCount}
            onChange={(e) => setForm((current) => ({ ...current, sampleCount: e.target.value }))}
            placeholder="Ex: 15"
          />
          <Input
            label="Peso médio (g)"
            type="number"
            step="0.01"
            value={form.averageWeightG}
            onChange={(e) => setForm((current) => ({ ...current, averageWeightG: e.target.value }))}
            placeholder="Ex: 12.50"
          />
          <Input
            label="Sobrevivência (%)"
            type="number"
            step="0.01"
            value={form.survivalRatePct}
            onChange={(e) => setForm((current) => ({ ...current, survivalRatePct: e.target.value }))}
            placeholder="Ex: 95.50 (opcional)"
          />
          <Input
            label="Biomassa (kg) opcional"
            type="number"
            step="0.01"
            value={form.estimatedBiomass}
            onChange={(e) => setForm((current) => ({ ...current, estimatedBiomass: e.target.value }))}
            placeholder="Ex: 1250.00"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            loading={loading}
            onClick={handleSave}
            disabled={!form.sampleCount || !form.averageWeightG}
          >
            Salvar leitura
          </Button>
        </div>
      </div>
    </Modal>
  );
}
