import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import Viajes from "./pages/Viajes";
import Reportes from "./pages/Reportes";
import Login from "./pages/Login";
import DetalleViaje from "./pages/DetalleViaje";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página principal (home o dashboard) */}
        <Route path="/" element={<Dashboard />} />

        {/* Páginas del menú lateral */}
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/viajes" element={<Viajes />} />
        <Route path="/reportes" element={<Reportes />} />

        {/* Página de Login */}
        <Route path="/login" element={<Login />} />

        {/* Página de detalles del viaje */}
        <Route path="/DetalleViaje" element={<DetalleViaje />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
