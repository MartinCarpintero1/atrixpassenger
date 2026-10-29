
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import Promocional from './pages/Promocional'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import Destinos from './pages/Destinos'
import Actividades from './pages/Actividades'
import Salidas from './pages/Salidas'
import Guias from './pages/Guias'
import Vehiculos from './pages/Vehiculos'
import Pasajeros from './pages/Pasajeros'
import Reservas from './pages/Reservas'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Promocional />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
        <Route path="/admin/destinos" element={<Destinos />} />
        <Route path="/admin/actividades" element={<Actividades />} />
        <Route path="/admin/salidas" element={<Salidas />} />
        <Route path="/admin/guias" element={<Guias />} />
        <Route path="/admin/vehiculos" element={<Vehiculos />} />
        <Route path="/admin/pasajeros" element={<Pasajeros />} />
        <Route path="/admin/reservas" element={<Reservas />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
