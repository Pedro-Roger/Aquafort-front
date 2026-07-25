export const UserRole = {
  ADMIN: 'ADMIN',
  TECNICO: 'TECNICO',
  OPERADOR: 'OPERADOR',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const PondStatus = {
  VAZIO: 'VAZIO',
  PREPARANDO: 'PREPARANDO',
  POVOADO: 'POVOADO',
  DESPESCANDO: 'DESPESCANDO',
  INATIVO: 'INATIVO',
} as const;

export type PondStatus = (typeof PondStatus)[keyof typeof PondStatus];

export const PondType = {
  PRE_BERCARIO: 'PRE_BERCARIO',
  BERCARIO: 'BERCARIO',
  ENGORDA: 'ENGORDA',
  REPRODUTOR: 'REPRODUTOR',
} as const;

export type PondType = (typeof PondType)[keyof typeof PondType];

export const CyclePhase = {
  PREPARACAO: 'PREPARACAO',
  BERCARIO: 'BERCARIO',
  ENGORDA: 'ENGORDA',
  PRE_COLHEITA: 'PRE_COLHEITA',
  ENCERRADO: 'ENCERRADO',
} as const;

export type CyclePhase = (typeof CyclePhase)[keyof typeof CyclePhase];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Pond {
  id: string;
  code: string;
  name: string;
  type: PondType;
  status: PondStatus;
  areaHa: number;
  volumeM3: number;
  /** Automatic feeders installed in this pond. */
  feederCount?: number;
  activeCycleId?: string;
  farmId: string;
  createdAt: string;
}

export interface Cycle {
  id: string;
  pondId: string;
  pond?: Pond;
  lotCode?: string;
  larvaeLotCode?: string | null;
  supplier: string;
  phase: CyclePhase;
  status?: 'ATIVO' | 'ENCERRADO';
  stockDate: string;
  plCount: number;
  currentPopulation?: number;
  remainingPopulation?: number;
  biomassKg?: number;
  avgWeightG?: number;
  fca?: number;
  survivalRate?: number;
  remainingSurvivalRate?: number;
  cultivationDays?: number;
  costInCultivation?: number;
  costPerM2?: number;
  closedAt?: string;
  createdAt: string;
}

export interface HarvestProjectionPoint {
  week: number;
  date: string;
  avgWeightG: number;
  biomassKg: number;
  projectedCost: number;
  costPerKg: number;
}

export interface HarvestProjection {
  id: string;
  pondId: string;
  cycleId: string;
  optimalWeekStart: number;
  optimalWeekEnd: number;
  idealDate: string;
  idealWeightG: number;
  minCostPerKg: number;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  weeklyCurve: HarvestProjectionPoint[];
  assumptions: {
    biometricPoints: number;
    growthRateGPerDay: number;
    survivalPct: number;
    currentCost: number;
    weeklyCost: number;
    tolerancePct: number;
    costBasis: string;
  };
  calculatedAt: string;
}

export type OperationalReportPhase = 'BERCARIOS' | 'VIVEIROS' | 'REPRODUTORES' | 'TODAS';

export interface OperationalReportsRow {
  phase: Exclude<OperationalReportPhase, 'TODAS'>;
  label: string;
  cycleLabel: string;
  feedInKg: number;
  feedOutKg: number;
  partialHarvests: number;
  totalHarvests: number;
}

export interface OperationalReportsSummary {
  feedInKg: number;
  feedOutKg: number;
  partialHarvests: number;
  totalHarvests: number;
  stockInKg: number;
  stockOutKg: number;
}

export interface OperationalReportsResponse {
  summary: OperationalReportsSummary;
  rows: OperationalReportsRow[];
}

export interface OperationalReportsQuery {
  phase?: OperationalReportPhase;
  from?: string;
  to?: string;
  pondId?: string;
  cycleId?: string;
}

export type HarvestType = 'PARTIAL' | 'TOTAL';

export interface HarvestRecord {
  id: string;
  cycleId: string;
  pondId: string;
  harvestedKg: number;
  harvestType: HarvestType;
  closesCycle: boolean;
  harvestedAt: string;
  observation?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface CreateHarvestDto {
  cycleId: string;
  pondId: string;
  harvestedKg: number;
  harvestType: HarvestType;
  harvestedAt: string;
  closesCycle?: boolean;
  observation?: string;
}

export interface Aerator {
  id: number;
  xPct: number;
  yPct: number;
}

export interface CanvasLayout {
  id: string;
  pondId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  aerators: Aerator[];
  updatedAt?: string;
}

export interface PondWithCanvas extends Pond {
  canvasLayout: CanvasLayout | null;
  cycles: Array<{
    id: string;
    larvaeLotCode: string | null;
    larvaeSupplier: string | null;
    larvaeStage: string | null;
    plCount: number;
    density: number;
    stockDate: string;
    targetWeightG: number | null;
    initialWeightG: number | null;
    weeklyGrowthGTarget: number | null;
  }>;
}

export interface GrowthPoint {
  day: number;
  weight: number;
  date?: string;
}

export interface GrowthChartData {
  cycleId: string;
  stockDate: string;
  initialWeightG: number | null;
  targetWeightG: number | null;
  weeklyGrowthGTarget: number | null;
  expectedCurve: GrowthPoint[];
  realCurve: GrowthPoint[];
  projectedHarvestDay: number | null;
  projectedHarvestDate: string | null;
}

export interface GrowthTarget {
  initialWeightG?: number;
  targetWeightG?: number;
  weeklyGrowthGTarget?: number;
}

export interface Biometric {
  id: string;
  cycleId: string;
  measuredAt: string;
  sampleCount: number;
  averageWeightG: number;
  survivalRatePct?: number | null;
  estimatedBiomass?: number | null;
  createdAt: string;
}

export interface NurseryActivity {
  id: string;
  pondId: string;
  measuredAt: string;
  plGram: number;
  probioticKg?: number | null;
  bicarbonateKg?: number | null;
  chlorineKg?: number | null;
  bokashiKg?: number | null;
  waterManagementType?: string | null;
  waterManagementNote?: string | null;
  observation?: string | null;
  createdBy?: string | null;
  createdAt: string;
  pond: Pond;
  creator?: User | null;
}

export interface BiometricSeriesPoint {
  biometriaId: string;
  semana: number;
  pesoMedioG: number;
  ganhoSemanaG: number | null;
  measuredAt: string;
}

export interface BiometricSeries {
  cycleId: string;
  points: BiometricSeriesPoint[];
}

export interface BiometricKpis {
  cycleId: string;
  pesoMedioG: number | null;
  survivalPct: number | null;
  biomassaAtualKg: number;
  biomassaGanhaKg: number;
  racaoConsumidaKg: number;
  fca: number | null;
  ultimaBiometriaEm: string | null;
}

export interface FeedProduct {
  id: string;
  name: string;
  priceKg?: number | null;
  bagWeightKg?: number | null;
  active: boolean;
  createdAt: string;
}

export const InventoryLocationType = {
  ALMOXARIFADO: 'ALMOXARIFADO',
  SETOR: 'SETOR',
  FAZENDA: 'FAZENDA',
} as const;

export type InventoryLocationType = (typeof InventoryLocationType)[keyof typeof InventoryLocationType];

export const InventoryMovementType = {
  INBOUND: 'INBOUND',
  OUTBOUND: 'OUTBOUND',
  TRANSFER: 'TRANSFER',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;

export type InventoryMovementType = (typeof InventoryMovementType)[keyof typeof InventoryMovementType];

export interface InventoryLocation {
  id: string;
  code: string;
  name: string;
  type: InventoryLocationType;
  parentId?: string | null;
  active: boolean;
  createdAt: string;
  parent?: InventoryLocation | null;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  movementType: InventoryMovementType;
  quantityKg: number;
  unitCost?: number | null;
  fromLocationId?: string | null;
  toLocationId?: string | null;
  effectiveAt: string;
  notes?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdBy?: string | null;
  createdAt: string;
  product: FeedProduct;
  fromLocation?: InventoryLocation | null;
  toLocation?: InventoryLocation | null;
}

export interface InventoryBalanceRow {
  locationId: string;
  locationName: string;
  locationType: InventoryLocationType;
  productId: string;
  productName: string;
  quantityKg: number;
}

export interface InventorySummary {
  activeLocations: number;
  productsWithBalance: number;
  positiveBalanceRows: number;
  movementCount: number;
  totalQuantityKg: number;
}

export interface FeedingLogItem {
  id: string;
  feedKg: number;
  feedCost: number;
  product: FeedProduct;
}

export interface FeedingRecord {
  id: string;
  cycleId: string;
  pondId: string;
  mode: 'EXPRESS' | 'MIXTURE' | 'PROPORTIONAL' | 'EQUAL';
  feedKg: number;
  feedCost: number;
  fedAt: string;
  observation?: string | null;
  pond: Pond;
  product?: FeedProduct | null;
  responsible: User;
  items: FeedingLogItem[];
}

export interface FeedingTableRow {
  pondId: string;
  pondCode: string;
  pondName: string;
  pondStatus: PondStatus;
  cycleId: string;
  lotCode: string;
  lastFedAt: string;
  lastFeedKg: number;
  responsibleName: string;
  productName: string;
  dailyFeedKg: number;
  racaoAcumuladaKg: number;
  estimatedBagsUsed: number;
  /** Live biomass from the latest biometric, null before any reading. */
  biomassaKg: number | null;
  /** Feed offered per kilo produced. Null while biomass is unknown. */
  fca: number | null;
}

export interface FeedingTableResponse {
  date: string;
  rows: FeedingTableRow[];
  totals: {
    dailyFeedKg: number;
    racaoAcumuladaKg: number;
    estimatedBagsUsed: number;
  };
}

export interface WaterQuality {
  id: string;
  cycleId: string;
  pondId: string;
  measuredAt: string;
  oxygenMgL: number;
  ph: number;
  salinityPpt: number;
  temperatureC: number;
  ammoniaMgL: number;
  responsibleId?: string;
  responsibleName?: string;
  outOfRange: boolean;
  outOfRangeParams: string[];
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface PondTransfer {
  id: string;
  fromPondId: string;
  toPondId: string;
  quantity: number;
  transferredAt: string;
  responsible: string;
  reason?: string | null;
  note?: string | null;
  createdBy?: string | null;
  createdAt: string;
  fromPond: Pick<Pond, 'id' | 'code' | 'name' | 'status'>;
  toPond: Pick<Pond, 'id' | 'code' | 'name' | 'status'>;
}

export type MaterialUnit = 'UN' | 'KG' | 'L' | 'SC';

export interface Material {
  id: string;
  name: string;
  unit: MaterialUnit;
  packageWeightKg?: number | null;
  unitPrice?: number | null;
  /** How much is on hand. Entries add to it, pond usage takes from it. */
  stockQuantity?: number | null;
  active: boolean;
}

export interface MaterialUsage {
  id: string;
  pondId: string;
  materialId: string;
  quantity: number;
  totalCost?: number | null;
  usedAt: string;
  responsible?: string | null;
  note?: string | null;
  pond: Pick<Pond, 'id' | 'code' | 'name'>;
  material: Pick<Material, 'id' | 'name' | 'unit' | 'unitPrice'>;
}

export interface Feeder {
  id: string;
  name: string;
  document?: string | null;
  phone?: string | null;
  active: boolean;
  ponds: Pick<Pond, 'id' | 'code' | 'name' | 'type' | 'status'>[];
}

export interface FeederPondPerformance {
  pondId: string;
  pondCode: string;
  averageWeightG: number;
  survivalPct: number | null;
  biomassKg: number;
  weeklyGrowthG: number | null;
}

export interface FeederRanking {
  position: number;
  feederId: string;
  feederName: string;
  pondCount: number;
  pondCodes: string[];
  weeklyGrowthG: number | null;
  /** Weight of the heaviest pond under this feeder, not an average. */
  averageWeightG: number | null;
  heaviestPondCode: string | null;
  survivalPct: number | null;
  biomassKg: number;
  ponds: FeederPondPerformance[];
}
