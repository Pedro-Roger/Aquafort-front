import { Input } from '../ui/Input';
import { quantityFromWeight, weightFromQuantity } from '../../pages/povoamento';

interface QuantityWeightInputProps {
  quantityLabel?: string;
  quantity: number;
  weightG: number;
  plPerGram: number;
  onChange: (next: { quantity: number; weightG: number }) => void;
}

/**
 * Quantidade and Peso are two views of the same count. Editing either one
 * recalculates the other through PL/grama — the operator sometimes decides
 * the headcount first (and weighs to match), sometimes weighs first (and
 * reads off the headcount).
 */
export function QuantityWeightInput({ quantityLabel = 'Quantidade', quantity, weightG, plPerGram, onChange }: QuantityWeightInputProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <Input
        label={quantityLabel}
        type="number"
        min={0}
        step="1"
        value={quantity === 0 ? '' : quantity}
        onChange={(e) => {
          const nextQuantity = Number(e.target.value || 0);
          onChange({
            quantity: nextQuantity,
            weightG: plPerGram > 0 ? weightFromQuantity(nextQuantity, plPerGram) : weightG,
          });
        }}
      />
      <Input
        label="Peso (g)"
        type="number"
        min={0}
        step="0.1"
        value={weightG === 0 ? '' : weightG}
        onChange={(e) => {
          const nextWeight = Number(e.target.value || 0);
          onChange({
            quantity: plPerGram > 0 ? quantityFromWeight(nextWeight, plPerGram) : quantity,
            weightG: nextWeight,
          });
        }}
      />
    </div>
  );
}
