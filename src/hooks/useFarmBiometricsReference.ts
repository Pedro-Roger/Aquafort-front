import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import {
  DEFAULT_CONSUMPTION_REFERENCE,
  normalizeConsumptionReference,
  type ConsumptionReferenceRow,
} from '../lib/biometricsReference';

const STORAGE_PREFIX = 'aquafort_consumption_reference';

function storageKey(ownerId?: string | null) {
  return `${STORAGE_PREFIX}:${ownerId ?? 'default'}`;
}

function readStoredReference(ownerId?: string | null) {
  if (typeof window === 'undefined') return DEFAULT_CONSUMPTION_REFERENCE;

  const raw = window.localStorage.getItem(storageKey(ownerId));
  if (!raw) return DEFAULT_CONSUMPTION_REFERENCE;

  try {
    const parsed = JSON.parse(raw) as ConsumptionReferenceRow[];
    return normalizeConsumptionReference(parsed);
  } catch {
    return DEFAULT_CONSUMPTION_REFERENCE;
  }
}

export function useFarmBiometricsReference() {
  const { user } = useAuth();
  const ownerId = user?.id ?? null;
  const [reference, setReference] = useState<ConsumptionReferenceRow[]>(() => readStoredReference(ownerId));

  useEffect(() => {
    setReference(readStoredReference(ownerId));
  }, [ownerId]);

  const saveReference = useCallback((nextReference: ConsumptionReferenceRow[]) => {
    const normalized = normalizeConsumptionReference(nextReference);
    setReference(normalized);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey(ownerId), JSON.stringify(normalized));
    }

    return normalized;
  }, [ownerId]);

  const resetReference = useCallback(() => {
    return saveReference(DEFAULT_CONSUMPTION_REFERENCE);
  }, [saveReference]);

  return useMemo(() => ({
    reference,
    saveReference,
    resetReference,
    ownerId,
  }), [ownerId, reference, resetReference, saveReference]);
}
