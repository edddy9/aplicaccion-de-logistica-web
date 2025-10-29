import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import Viajes from "./pages/Viajes";
import Reportes from "./pages/Reportes";
import Login from "./pages/Login";
import DetalleViaje from "./pages/DetalleViaje";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página de inicio de sesión (pública) */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas: requieren que el usuario esté autenticado */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute>
              <Usuarios />
            </ProtectedRoute>
          }
        />

        <Route
          path="/viajes"
          element={
            <ProtectedRoute>
              <Viajes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reportes"
          element={
            <ProtectedRoute>
              <Reportes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/DetalleViaje"
          element={
            <ProtectedRoute>
              <DetalleViaje />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
