import { useContext } from 'react';
import { FarmContext } from '../store/farm';

export function useFarm() {
  return useContext(FarmContext);
}
