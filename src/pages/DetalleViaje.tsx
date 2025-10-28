import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { motion } from "framer-motion";
import MapaGoogle from "../components/MapaGoogle";
import {
  FaMapMarkedAlt,
  FaMoneyBillWave,
  FaTruck,
  FaClipboardList,
  FaArrowLeft,
} from "react-icons/fa";

// ===== Configurar íconos de Leaflet =====
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface ViajeData {
  id: string;
  empresa?: string;
  origen?: string;
  destino?: string;
  fecha?: string;
  userId?: string;
  usuarioNombre?: string;
}

export default function DetalleViaje() {
  const [params] = useSearchParams();
  const viajeId = params.get("id");

  const [viaje, setViaje] = useState<ViajeData | null>(null);
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!viajeId) {
        setError("No se proporcionó un ID de viaje.");
        setLoading(false);
        return;
      }

      try {
        // 🔹 Cargar el viaje desde Firestore
        const viajeRef = doc(db, "viajes", viajeId);
        const viajeSnap = await getDoc(viajeRef);

        if (!viajeSnap.exists()) throw new Error("No se encontró el viaje.");

        const viajeData = { id: viajeSnap.id, ...viajeSnap.data() } as any;

        // ✅ Convertir la fecha (Timestamp → string legible)
        if (viajeData.fecha?.toDate) {
          viajeData.fecha = viajeData.fecha.toDate().toLocaleString("es-MX");
        } else if (viajeData.creadoEn?.toDate) {
          // Si tu colección guarda la fecha como creadoEn
          viajeData.fecha = viajeData.creadoEn.toDate().toLocaleString("es-MX");
        }

        // 🔹 Obtener el nombre del usuario
        // 🔹 Cargar el nombre del usuario (si tiene userId)
// 🔹 Cargar el nombre y correo del usuario (si tiene userId)
if (viajeData.userId) {
  try {
    const usuarioRef = doc(db, "usuarios", viajeData.userId);
    const usuarioSnap = await getDoc(usuarioRef);

    if (usuarioSnap.exists()) {
      const data = usuarioSnap.data();

      viajeData.usuarioNombre =
        data.nombre ||
        data.nombreCompleto ||
        `${data.nombre ?? ""} ${data.apellido ?? ""}`.trim() ||
        "Sin nombre";

      // ✅ También guardamos el correo si existe
      viajeData.usuarioCorreo = data.email || data.correo || "";
    } else {
      viajeData.usuarioNombre = "Usuario no encontrado";
      viajeData.usuarioCorreo = "";
    }
  } catch (err) {
    console.error("Error obteniendo usuario:", err);
    viajeData.usuarioNombre = "Error al cargar usuario";
    viajeData.usuarioCorreo = "";
  }
} else {
  viajeData.usuarioNombre = "Sin usuario asignado";
  viajeData.usuarioCorreo = "";
}


        setViaje(viajeData);

        // 🔹 Cargar los gastos del viaje
        const q = query(collection(db, "gastos"), where("viajeId", "==", viajeId));
        const gastosSnap = await getDocs(q);
        setGastos(gastosSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error al cargar detalles:", err);
        setError("Error al cargar los datos del viaje.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [viajeId]);

  // ===== Renderizado condicional =====
  if (loading)
    return <p style={{ textAlign: "center", marginTop: 50 }}>Cargando detalles del viaje...</p>;

  if (error)
    return (
      <div style={{ textAlign: "center", marginTop: 80, color: "red" }}>
        <h3>{error}</h3>
        <button onClick={() => window.history.back()} style={styles.btnBack}>
          <FaArrowLeft /> Volver
        </button>
      </div>
    );

  if (!viaje)
    return <p style={{ textAlign: "center", marginTop: 50 }}>No se encontró el viaje.</p>;

  const totalGasto = gastos.reduce((acc, g) => acc + (g.monto || 0), 0);

  // ===== UI =====
  return (
    <div style={styles.page}>
      <motion.h1
        style={styles.title}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FaTruck style={{ marginRight: 10, color: "#1E88E5" }} /> Detalles del Viaje
      </motion.h1>

      <motion.div
        style={styles.layout}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* ==== COLUMNA IZQUIERDA ==== */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <FaClipboardList /> Información del Viaje
            </h3>
            <p><b>Empresa:</b> {viaje.empresa}</p>
            <p><b>Origen:</b> {viaje.origen}</p>
            <p><b>Destino:</b> {viaje.destino}</p>
            
            <p><b>Fecha:</b> {viaje.fecha || "Sin fecha registrada"}</p>
          </div>

          <div style={{ ...styles.card, borderTop: "4px solid #28a745" }}>
            <h3 style={{ ...styles.cardTitle, color: "#28a745" }}>
              <FaMoneyBillWave /> Resumen de Gastos
            </h3>
            <div style={styles.statsRow}>
              <div style={styles.statBox}>
                <h4>Total de gastos</h4>
                <p style={{ fontSize: 22, color: "#1E88E5" }}>{gastos.length}</p>
              </div>
              <div style={styles.statBox}>
                <h4>Monto total</h4>
                <p style={{ fontSize: 22, color: "#28a745" }}>${totalGasto}</p>
              </div>
            </div>

            <ul style={styles.list}>
              {gastos.map((g) => (
                <li key={g.id} style={styles.listItem}>
                  <b>{g.categoria}</b> — ${g.monto} <span>({g.empresa})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ==== COLUMNA DERECHA ==== */}
        <div style={styles.mapCard}>
          <h3 style={styles.cardTitle}>
            <FaMapMarkedAlt /> Ubicación de Gastos
          </h3>

          <MapaGoogle
            gastos={gastos}
            origen={{ lat: 32.6245, lng: -115.4523 }}
            destino={{ lat: 19.4326, lng: -99.1332 }}
          />

          {gastos.length === 0 && (
            <div style={styles.noDataOverlay}>No hay gastos con ubicación para este viaje.</div>
          )}
        </div>
      </motion.div>

      {/* Botón Volver */}
      <div style={{ textAlign: "center", marginTop: 30 }}>
        <button onClick={() => window.location.href = "/Viajes"} style={styles.btnBack}>
          <FaArrowLeft /> Volver
        </button>
      </div>
    </div>
  );
}

// ==== ESTILOS ====
const styles: Record<string, any> = {
  page: {
    background: "#f3f6fb",
    minHeight: "100vh",
    padding: "30px",
    fontFamily: "'Inter', sans-serif",
  },
  title: {
    textAlign: "center",
    fontSize: "28px",
    fontWeight: 700,
    color: "#0b2d69",
    marginBottom: "25px",
  },
  layout: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "center",
  },
  leftColumn: {
    flex: "1 1 350px",
    maxWidth: "480px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  },
  cardTitle: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#1E88E5",
    borderBottom: "1px solid #eee",
    paddingBottom: "8px",
    marginBottom: "12px",
  },
  statsRow: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "15px",
  },
  statBox: {
    textAlign: "center",
  },
  list: {
    listStyle: "none",
    paddingLeft: 0,
  },
  listItem: {
    padding: "6px 0",
    borderBottom: "1px solid #f0f0f0",
    color: "#333",
  },
  mapCard: {
    flex: "1 1 600px",
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    position: "relative",
  },
  noDataOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "rgba(255,255,255,0.95)",
    padding: "12px 20px",
    borderRadius: "8px",
    fontWeight: 600,
    color: "#333",
  },
  btnBack: {
    background: "#1E88E5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "16px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  },
};
