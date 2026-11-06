import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Promocional from "./pages/Promocional";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";

// Portal del pasajero
import PassengerDashboard from "./pages/PassengerDashboard";
import Cupos from "./pages/Cupos";
import FichaViaje from "./pages/FichaViaje";

// Panel administrativo / operativo
import AdminDashboard from "./pages/AdminDashboard";
import Destinos from "./pages/Destinos";
import Actividades from "./pages/Actividades";
import Salidas from "./pages/Salidas";
import Guias from "./pages/Guias";
import Vehiculos from "./pages/Vehiculos";
import Pasajeros from "./pages/Pasajeros";
import Reservas from "./pages/Reservas";
import ControlPasajeros from "./pages/ControlPasajeros";
import Metricas from "./pages/Metricas";
import Ventas from "./pages/Ventas";

// Compartido por todos los roles
import Configuracion from "./pages/Configuracion";

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

          {/* USUARIO: Viajes, Cupos, Ficha de viaje, Configuración */}
          <Route element={<ProtectedRoute allowedRoles={["USUARIO"]} />}>
            <Route path="/mi-cuenta" element={<PassengerDashboard />} />
            <Route path="/mi-cuenta/cupos" element={<Cupos />} />
            <Route path="/mi-cuenta/ficha" element={<FichaViaje />} />
            <Route path="/mi-cuenta/configuracion" element={<Configuracion />} />
          </Route>

          {/* OPERADOR y ADMINISTRADOR: Reservas, Viajes, Pasajeros, Control pasajeros, Configuración */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["OPERADOR", "ADMINISTRADOR"]}
                loginPath="/admin/login"
              />
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/reservas" element={<Reservas />} />
            <Route path="/admin/salidas" element={<Salidas />} />
            <Route path="/admin/pasajeros" element={<Pasajeros />} />
            <Route path="/admin/control-pasajeros" element={<ControlPasajeros />} />
            <Route path="/admin/configuracion" element={<Configuracion />} />
          </Route>

          {/* Sólo ADMINISTRADOR: Métricas, Ventas y catálogo de viajes */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={["ADMINISTRADOR"]}
                loginPath="/admin/login"
              />
            }
          >
            <Route path="/admin/metricas" element={<Metricas />} />
            <Route path="/admin/ventas" element={<Ventas />} />
            <Route path="/admin/destinos" element={<Destinos />} />
            <Route path="/admin/actividades" element={<Actividades />} />
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
