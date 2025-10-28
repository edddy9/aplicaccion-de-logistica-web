import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { Home, Users, Truck, BarChart3, LogOut, Menu } from "lucide-react";
import { useState } from "react";
import type { JSX } from "react/jsx-dev-runtime";

export default function Sidebar() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <aside
      style={{
        ...styles.sidebar,
        width: collapsed ? "80px" : "220px",
        transition: "width 0.3s ease-in-out, background-color 0.3s ease",
      }}
    >
      {/* 🔹 Encabezado */}
   <div style={styles.topSection}>
  <button
    onClick={() => setCollapsed(!collapsed)}
    style={styles.actionButton}
  >
    <Menu size={20} />
    {!collapsed && <span style={styles.buttonText}></span>}
  </button>
</div>

      {/* 🔹 Navegación */}
      <nav style={styles.nav}>
        <SidebarLink
          to="/"
          icon={<Home size={20} />}
          label="Salpicadero"
          collapsed={collapsed}
        />
        <SidebarLink
          to="/usuarios"
          icon={<Users size={20} />}
          label="Usuarios"
          collapsed={collapsed}
        />
        <SidebarLink
          to="/viajes"
          icon={<Truck size={20} />}
          label="Viajes"
          collapsed={collapsed}
        />
        <SidebarLink
          to="/reportes"
          icon={<BarChart3 size={20} />}
          label="Reportes"
          collapsed={collapsed}
        />
      </nav>

   {/* 🔹 Botón de Cerrar Sesión */}
<div style={styles.bottomSection}>
  <button onClick={handleLogout} style={styles.actionButton}>
    <LogOut size={20} />
    {!collapsed && <span style={styles.buttonText}>Cerrar sesión</span>}
  </button>
</div>
    </aside>
  );
}

/* 🔹 Componente para los enlaces del menú */
function SidebarLink({
  to,
  icon,
  label,
  collapsed,
}: {
  to: string;
  icon: JSX.Element;
  label: string;
  collapsed: boolean;
}) {
  return (
    <Link
      to={to}
      style={{
        ...styles.link,
        justifyContent: collapsed ? "center" : "flex-start",
      }}
    >
      {icon}
      {!collapsed && <span style={styles.linkText}>{label}</span>}
    </Link>
  );
}

/* 🎨 Estilos */
const styles = {
  sidebar: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    height: "100vh",
    background: "linear-gradient(180deg, #007bff 0%, #0048a6 100%)",
    display: "flex",
    flexDirection: "column" as const,
    justifyContent: "space-between",
    color: "white",
    padding: "12px 0",
    boxShadow: "2px 0 10px rgba(0, 0, 0, 0.15)",
    overflowX: "hidden" as const,
  },

  menuBtn: {
    border: "none",
    color: "white",
    cursor: "pointer",
    borderRadius: "10px",
    padding: "10px 12px",
    transition: "all 0.2s ease",
  },
  topSection: {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginTop: "15px",
},

bottomSection: {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "30px",
},

actionButton: {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  backgroundColor: "white",
  color: "#007bff",
  border: "none",
  borderRadius: "10px",
  padding: "10px 15px",
  width: "85%", // 👈 igual tamaño para ambos
  cursor: "pointer",
  fontWeight: "bold",
  transition: "background 0.3s ease, transform 0.2s ease",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
},

buttonText: {
  fontSize: "14px",
  fontWeight: "500",
},

  nav: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
    marginTop: "20px",
  },
  link: {
    display: "flex",
    alignItems: "center",
    color: "white",
    textDecoration: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    margin: "0 10px",
    transition: "background 0.3s ease, transform 0.2s ease",
  },
  linkText: {
    marginLeft: "10px",
    fontSize: "15px",
    fontWeight: "500",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    color: "#007bff",
    border: "none",
    borderRadius: "10px",
      margin: "0",
    padding: "0px",
    cursor: "pointer",
    fontWeight: "bold",
    transition: "background 0.3s ease, transform 0.2s ease",
  },
};

/* 🔹 Agregar un efecto hover con CSS-in-JS */
Object.assign(styles.link, {
  ":hover": {
    background: "rgba(255, 255, 255, 0.2)",
    transform: "translateX(4px)",
  },
});
