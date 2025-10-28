import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>🚛 Control Logístico</div>
      <div style={styles.links}>
        <Link to="/" style={styles.link}>Inicio</Link>
        <Link to="/usuarios" style={styles.link}>Usuarios</Link>
        <Link to="/viajes" style={styles.link}>Viajes</Link>
        <button onClick={handleLogout} style={styles.logoutBtn}>Cerrar sesión</button>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    backgroundColor: "#007bff",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 30px",
    color: "white",
  },
  logo: {
    fontWeight: "bold",
    fontSize: "18px",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontSize: "15px",
  },
  logoutBtn: {
    backgroundColor: "white",
    color: "#007bff",
    border: "none",
    borderRadius: "5px",
    padding: "6px 12px",
    cursor: "pointer",
    fontWeight: "bold",
  },
};
