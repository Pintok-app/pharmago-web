import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { PharmacistLayout } from './pages/pharmacist/PharmacistLayout'
import { NewOrdersPage } from './pages/pharmacist/NewOrdersPage'
import { CollectingPage } from './pages/pharmacist/CollectingPage'
import { ActiveOrdersPage } from './pages/pharmacist/ActiveOrdersPage'
import { PharmacistHistoryPage } from './pages/pharmacist/HistoryPage'
import { AdminLayout } from './pages/admin/AdminLayout'
import { DashboardPage } from './pages/admin/DashboardPage'
import { PharmaciesPage } from './pages/admin/PharmaciesPage'
import { DriversPage } from './pages/admin/DriversPage'
import { PharmacistsPage } from './pages/admin/PharmacistsPage'
import { SettingsPage } from './pages/admin/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/pharmacist"
          element={
            <ProtectedRoute role="pharmacist">
              <PharmacistLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="orders" replace />} />
          <Route path="orders" element={<NewOrdersPage />} />
          <Route path="collecting" element={<CollectingPage />} />
          <Route path="active" element={<ActiveOrdersPage />} />
          <Route path="history" element={<PharmacistHistoryPage />} />
        </Route>

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="pharmacies" element={<PharmaciesPage />} />
          <Route path="drivers" element={<DriversPage />} />
          <Route path="pharmacists" element={<PharmacistsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
