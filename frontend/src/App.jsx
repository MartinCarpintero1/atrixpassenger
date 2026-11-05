import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Promocional from "./pages/Promocional";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import PassengerDashboard from "./pages/PassengerDashboard";

import AdminDashboard from "./pages/AdminDashboard";
import Destinos from "./pages/Destinos";
import Actividades from "./pages/Actividades";
import Salidas from "./pages/Salidas";
import Guias from "./pages/Guias";
import Vehiculos from "./pages/Vehiculos";
import Pasajeros from "./pages/Pasajeros";
import Reservas from "./pages/Reservas";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Página pública */}
          <Route path="/" element={<Promocional />} />

          {/* Acceso de pasajeros */}
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />

          {/* Acceso administrativo */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/registro" element={<AdminRegister />} />

          {/* Área de pasajeros */}
          <Route element={<ProtectedRoute allowedRoles={["USUARIO"]} />}>
            <Route path="/mi-cuenta" element={<PassengerDashboard />} />
          </Route>

          {/* Área de operadores y administradores */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["OPERADOR", "ADMINISTRADOR"]}
              />
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/pasajeros" element={<Pasajeros />} />
            <Route path="/admin/reservas" element={<Reservas />} />
          </Route>

          {/* Área exclusiva de administradores */}
          <Route element={<ProtectedRoute allowedRoles={["ADMINISTRADOR"]} />}>
            <Route path="/admin/destinos" element={<Destinos />} />
            <Route path="/admin/actividades" element={<Actividades />} />
            <Route path="/admin/salidas" element={<Salidas />} />
            <Route path="/admin/guias" element={<Guias />} />
            <Route path="/admin/vehiculos" element={<Vehiculos />} />
          </Route>

          {/* Página no encontrada */}
          <Route path="*" element={<Promocional />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;