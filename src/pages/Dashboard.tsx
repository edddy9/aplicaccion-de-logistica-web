import { useEffect, useState, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { FaTruck, FaUser, FaMoneyBillWave, FaBuilding} from "react-icons/fa";

export default function Dashboard() {
  const [viajes, setViajes] = useState<any[]>([]);
  const [gastos, setGastos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Cargar datos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [viajesSnap, gastosSnap, usuariosSnap] = await Promise.all([
          getDocs(collection(db, "viajes")),
          getDocs(collection(db, "gastos")),
          getDocs(collection(db, "usuarios")),
        ]);

        setViajes(viajesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setGastos(gastosSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setUsuarios(usuariosSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔹 Cálculos de resumen
  const totalViajes = viajes.length;
  const totalGastos = gastos.length;
  const totalUsuarios = usuarios.length;

  const gastoPromedio = useMemo(() => {
    if (gastos.length === 0) return 0;
    const suma = gastos.reduce((acc, g) => acc + (g.monto || 0), 0);
    return suma / gastos.length;
  }, [gastos]);

  // 🔹 Agrupar gastos por empresa
  const gastosPorEmpresa = useMemo(() => {
    const data: Record<string, number> = {};
    gastos.forEach((g) => {
      const empresa = g.empresa || "Sin empresa";
      data[empresa] = (data[empresa] || 0) + (g.monto || 0);
    });
    return Object.entries(data).map(([empresa, total]) => ({ empresa, total }));
  }, [gastos]);

  // 🔹 Últimos gastos y viajes
  const ultimosGastos = useMemo(
    () => gastos.slice(-5).reverse(),
    [gastos]
  );
  const ultimosViajes = useMemo(
    () => viajes.slice(-5).reverse(),
    [viajes]
  );

  // 🔹 Alertas inteligentes
  const alertas: string[] = [];
  if (gastoPromedio > 3000) {
    alertas.push(`⚠️ Gasto promedio elevado: $${gastoPromedio.toFixed(2)}`);
  }
  if (totalViajes === 0) {
    alertas.push("⚠️ No hay viajes registrados.");
  }
  if (usuarios.length < 2) {
    alertas.push("ℹ️ Pocos usuarios activos. Agrega más transportistas.");
  }

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.content}>
        <h1 style={styles.title}>
          📊 Panel de Control
        </h1>

        {loading ? (
          <p>Cargando información...</p>
        ) : (
          <>
            {/* 🔹 Tarjetas de resumen */}
            <div style={styles.cardsGrid}>
              <DashboardCard
                icon={<FaTruck color="#007bff" size={28} />}
                title="Total de Viajes"
                value={totalViajes}
              />
              <DashboardCard
                icon={<FaMoneyBillWave color="#28a745" size={28} />}
                title="Total de Gastos"
                value={totalGastos}
              />
              <DashboardCard
                icon={<FaUser color="#6f42c1" size={28} />}
                title="Total de Usuarios"
                value={totalUsuarios}
              />
              <DashboardCard
                icon={<FaBuilding color="#17a2b8" size={28} />}
                title="Gasto Promedio"
                value={`$${gastoPromedio.toFixed(2)}`}
              />
            </div>

            {/* 🔹 Gráfico rápido */}
            <section style={styles.section}>
              <h2>💼 Gastos por Empresa</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gastosPorEmpresa}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="empresa" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#007bff" />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* 🔹 Actividad reciente */}
            <section style={styles.section}>
              <h2>🕒 Actividad Reciente</h2>
              <div style={styles.activityGrid}>
                <div>
                  <h3>Últimos Gastos</h3>
                  <ul style={styles.list}>
                    {ultimosGastos.map((g) => (
                      <li key={g.id}>
                        💰 <b>{g.categoria}</b> — ${g.monto} ({g.empresa || "Sin empresa"})
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Últimos Viajes</h3>
                  <ul style={styles.list}>
                    {ultimosViajes.map((v) => (
                      <li key={v.id}>
                        🚛 {v.empresa || "Empresa desconocida"} — {v.origen} ➜ {v.destino}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {/* 🔹 Alertas */}
            {alertas.length > 0 && (
              <section style={styles.section}>
                <h2>🔔 Alertas</h2>
                <ul>
                  {alertas.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </section>
            )}

          
          </>
        )}
      </main>
    </div>
  );
}

// 🧱 Componente de Tarjeta
function DashboardCard({ icon, title, value }: { icon: any; title: string; value: any }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        {icon}
        <h3>{title}</h3>
      </div>
      <p style={styles.cardValue}>{value}</p>
    </div>
  );
}

// 🎨 Estilos
const styles = {
  container: { display: "flex", minHeight: "100vh", backgroundColor: "#f8f9fa" },
  content: { marginLeft: "220px", padding: "40px", width: "100%" },
  title: { fontSize: "28px", fontWeight: "bold", color: "#0048a6", marginBottom: "30px" },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },
  card: {
    background: "white",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    padding: "20px",
    textAlign: "center" as const,
    transition: "transform 0.2s ease",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  cardValue: { fontSize: "26px", color: "#007bff", fontWeight: "bold", marginTop: "10px" },
  section: {
    background: "white",
    borderRadius: "10px",
    padding: "20px",
    marginBottom: "30px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  },
  activityGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px",
  },
  list: {
    listStyle: "none",
    padding: 0,
    lineHeight: "1.8em",
  },
  quickActions: {
    display: "flex",
    gap: "15px",
    flexWrap: "wrap" as const,
  },
  
  btnAction: {
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: "bold",
  },
};
