import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FaMapMarkedAlt, FaMoneyBillWave, FaTruck, FaClipboardList } from "react-icons/fa";

// Íconos de Leaflet
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function DetalleViaje() {
  const [params] = useSearchParams();
  const viajeId = params.get("id");

  const [viaje, setViaje] = useState<any>(null);
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!viajeId) return;
      try {
        const viajeRef = doc(db, "viajes", viajeId);
        const viajeSnap = await getDoc(viajeRef);
        if (viajeSnap.exists()) setViaje({ id: viajeSnap.id, ...viajeSnap.data() });

        const q = query(collection(db, "gastos"), where("viajeId", "==", viajeId));
        const gastosSnap = await getDocs(q);
        setGastos(gastosSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Error al cargar detalles:", err);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [viajeId]);

  if (loading)
    return <p style={{ textAlign: "center", marginTop: 50 }}>Cargando detalles del viaje...</p>;

  if (!viaje)
    return <p style={{ textAlign: "center", marginTop: 50 }}>No se encontró el viaje.</p>;

  const totalGasto = gastos.reduce((acc, g) => acc + (g.monto || 0), 0);
  const center =
    gastos.length > 0 && gastos[0].geo
      ? [gastos[0].geo.lat, gastos[0].geo.lng]
      : [19.4326, -99.1332];

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>
        <FaTruck style={{ marginRight: 10, color: "#1E88E5" }} /> Detalles del Viaje
      </h1>

      <div style={styles.layout}>
        {/* ==== COLUMNA IZQUIERDA ==== */}
        <div style={styles.leftColumn}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <FaClipboardList /> Información del Viaje
            </h3>
            <p><b>Empresa:</b> {viaje.empresa}</p>
            <p><b>Origen:</b> {viaje.origen}</p>
            <p><b>Destino:</b> {viaje.destino}</p>
            <p><b>Operador:</b> {viaje.operador}</p>
            <p><b>Fecha:</b> {viaje.fecha}</p>
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
          <MapContainer
            center={center as any}
            zoom={8}
            style={{ height: "500px", width: "100%", borderRadius: "12px" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {gastos.map(
              (g) =>
                g.geo && (
                  <Marker key={g.id} position={[g.geo.lat, g.geo.lng]}>
                    <Popup>
                      <strong>{g.categoria}</strong><br />
                      Empresa: {g.empresa}<br />
                      Monto: ${g.monto}<br />
                      Estado: {g.estatus}
                    </Popup>
                  </Marker>
                )
            )}
          </MapContainer>
        </div>
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
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
    transition: "transform 0.2s ease",
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
  },
};
