import { Routes, Route, Navigate } from 'react-router-dom'

// Placeholders — implementar em Entrega 1
const LoginPage = () => <div>Login — Aquafort</div>
const MapPage = () => <div>Mapa de Viveiros</div>
const LotsPage = () => <div>Lotes / Ciclos</div>
const WaterQualityPage = () => <div>Qualidade da Água</div>
const NutritionPage = () => <div>Manejo de Ração</div>
const BiometricsPage = () => <div>Biometria e Crescimento</div>
const FinancePage = () => <div>Financeiro e Custos</div>
const StockPage = () => <div>Estoque e Insumos</div>
const DashboardsPage = () => <div>Dashboards</div>
const ImportPage = () => <div>Importação de Dados</div>

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/mapa" replace />} />
      <Route path="/mapa" element={<MapPage />} />
      <Route path="/lotes" element={<LotsPage />} />
      <Route path="/qualidade-da-agua" element={<WaterQualityPage />} />
      <Route path="/nutricao" element={<NutritionPage />} />
      <Route path="/biometria" element={<BiometricsPage />} />
      <Route path="/financeiro" element={<FinancePage />} />
      <Route path="/estoque" element={<StockPage />} />
      <Route path="/dashboards" element={<DashboardsPage />} />
      <Route path="/importacao" element={<ImportPage />} />
    </Routes>
  )
}

export default App
