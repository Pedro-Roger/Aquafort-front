import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { AppLayout } from './components/layout/AppLayout'
import { RequireAdmin } from './components/layout/RequireAdmin'
import { LoginPage } from './pages/LoginPage'
import { OperationsDashboardPage } from './pages/OperationsDashboardPage'
import { WaterQualityPage } from './pages/WaterQualityPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { HarvestPlanningPage } from './pages/HarvestPlanningPage'
import { HarvestCalendarPage } from './pages/HarvestCalendarPage'
import { NutritionPage } from './pages/NutritionPage'
import { BiometricsPage } from './pages/BiometricsPage'
import { InventoryPage } from './pages/InventoryPage'
import { PovoamentoPage } from './pages/PovoamentoPage'
import { TransferenciaPage } from './pages/TransferenciaPage'
import { TanquesPage } from './pages/TanquesPage'
import { FeedersPage } from './pages/FeedersPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { ConsumptionChartPage } from './pages/ConsumptionChartPage';
import { AutoFeedersPage } from './pages/AutoFeedersPage';
import { SettingsPage } from './pages/SettingsPage'
import { HelpPage } from './pages/HelpPage'
import { OperationalReportsPage } from './pages/OperationalReportsPage'
import { MortalidadePage } from './pages/MortalidadePage'
import { CustomDashboardsPage } from './pages/CustomDashboardsPage'
import { FarmsAdminPage } from './pages/FarmsAdminPage'
import { UserFarmRolesPage } from './pages/UserFarmRolesPage'
import { SidebarConfigPage } from './pages/admin/SidebarConfigPage'

function RootRedirect() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}

function RedirectTo({ to }: { to: string }) {
  return <Navigate to={to} replace />
}

function App() {
  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<OperationsDashboardPage />} />
          <Route path="/map" element={<RedirectTo to="/dashboard" />} />
          <Route path="/tanques" element={<TanquesPage />} />
          <Route path="/povoamento" element={<PovoamentoPage />} />
          <Route path="/transferencia" element={<TransferenciaPage />} />
          <Route path="/bercario" element={<RedirectTo to="/povoamento" />} />
          <Route path="/cycles" element={<RedirectTo to="/povoamento" />} />
          <Route path="/nutrition" element={<NutritionPage />} />
          <Route path="/stock" element={<InventoryPage />} />
          <Route path="/biometrias" element={<BiometricsPage />} />
          <Route path="/biometrics" element={<RedirectTo to="/biometrias" />} />
          <Route path="/mortalidade" element={<MortalidadePage />} />
          <Route path="/paineis" element={<CustomDashboardsPage />} />
          <Route path="/water-quality" element={<WaterQualityPage />} />
          <Route path="/despesca" element={<HarvestPlanningPage />} />
          <Route path="/despesca-calendario" element={<HarvestCalendarPage />} />
          <Route path="/relatorios-operacionais" element={<OperationalReportsPage />} />
          <Route path="/harvest-planning" element={<RedirectTo to="/despesca" />} />
          <Route path="/viveiros" element={<RedirectTo to="/tanques" />} />
          <Route path="/arracoadores" element={<FeedersPage />} />
          <Route path="/materiais" element={<MaterialsPage />} />
          <Route path="/consumo" element={<ConsumptionChartPage />} />
          <Route path="/alimentadores" element={<AutoFeedersPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/ajuda" element={<HelpPage />} />

          {/* RN-04: admin global apenas — RequireAdmin redireciona quem não for. */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin/fazendas" element={<FarmsAdminPage />} />
            <Route path="/admin/vinculos" element={<UserFarmRolesPage />} />
            <Route path="/admin/sidebar" element={<SidebarConfigPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
