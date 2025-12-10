import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

type TGasto = {
  monto: number;
  creadoEn?: Timestamp;
  empresa?: string;
  userId?: string;
  categoria?: string;
  descripcion?: string;
  tamaño?: string;
};

type TUsuario = {
  uid: string;
  nombre?: string;
  apellido?: string;
};

const COLORS = [
  "#1E88E5",
  "#43A047",
  "#FB8C00",
  "#E53935",
  "#8E24AA",
  "#00ACC1",
  "#FDD835",
  "#5E35B1",
];

export default function Reportes() {
  // ================= Filtros =================
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [fEmpresa, setFEmpresa] = useState("");
  const [fUsuario, setFUsuario] = useState("");
  const [fCategoria, setFCategoria] = useState("");
  const [ftamaño, setTamaño] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // ================= Datos =================
  const [gastosRaw, setGastosRaw] = useState<TGasto[]>([]);
  const [usuarios, setUsuarios] = useState<TUsuario[]>([]);
  const [tamanosOpt, setTamanosOpt] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // ================= Cargar datos =================
  const fetchAll = async () => {
    setLoading(true);

    // Usuarios
    const usersSnap = await getDocs(collection(db, "usuarios"));
    const users = usersSnap.docs.map((d) => {
      const data = d.data() as any;
      return {
        uid: data.uid,
        nombre: data.nombre || "",
        apellido: data.apellido || "",
      };
    });
    setUsuarios(users);

    // Gastos
    const gastosRef = collection(db, "gastos");
    const wheres: any[] = [];

    if (fechaInicio) {
      const start = new Date(fechaInicio);
      wheres.push(where("creadoEn", ">=", Timestamp.fromDate(start)));
    }
    if (fechaFin) {
      const end = new Date(fechaFin);
      end.setHours(23, 59, 59, 999);
      wheres.push(where("creadoEn", "<=", Timestamp.fromDate(end)));
    }
    if (fEmpresa) wheres.push(where("empresa", "==", fEmpresa));
    if (fUsuario) wheres.push(where("userId", "==", fUsuario));
    if (fCategoria) wheres.push(where("categoria", "==", fCategoria));
    if (ftamaño) wheres.push(where("tamaño", "==", ftamaño));

    const qRef = query(gastosRef, ...wheres);
    const gastosSnap = await getDocs(qRef);

    const gastos = gastosSnap.docs.map((d) => {
      const g = d.data() as any;
      return {
        monto: Number(g.monto || 0),
        creadoEn: g.creadoEn,
        empresa: g.empresa || "Sin empresa",
        userId: g.userId || "",
        categoria: g.categoria || "Otros",
        descripcion: g.descripcion || "",
        tamaño: g.tamaño || "",
      };
    });

    setGastosRaw(gastos);

    // ⭐ Crear lista única de tamaños desde BD
    const listaTamanos = Array.from(
      new Set(gastos.map((g) => g.tamaño || ""))
    ).filter((t) => t !== "");

    setTamanosOpt(listaTamanos);

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [fechaInicio, fechaFin, fEmpresa, fUsuario, fCategoria, ftamaño]);

  // ================= Helpers =================
  const nombreUsuario = (uid?: string) => {
    const u = usuarios.find((x) => x.uid === uid);
    return u ? `${u.nombre} ${u.apellido}`.trim() : "—";
  };

  // ================= KPIs =================
  const kpis = useMemo(() => {
    const total = gastosRaw.reduce((s, g) => s + (g.monto || 0), 0);
    const count = gastosRaw.length;
    const avg = count ? total / count : 0;

    const porUsuario: Record<string, number> = {};
    gastosRaw.forEach((g) => {
      if (!g.userId) return;
      porUsuario[g.userId] = (porUsuario[g.userId] || 0) + g.monto;
    });

    const top = Object.entries(porUsuario)
      .map(([uid, tot]) => ({ uid, tot }))
      .sort((a, b) => b.tot - a.tot)[0];

    return {
      total,
      count,
      avg,
      topUser: top ? { nombre: nombreUsuario(top.uid), total: top.tot } : null,
    };
  }, [gastosRaw, usuarios]);

  // ================= Gráficos =================
  const chartMensual = useMemo(() => {
    const porMes: Record<string, number> = {};
    gastosRaw.forEach((g) => {
      const f = g.creadoEn?.toDate ? g.creadoEn.toDate() : new Date();
      const clave = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      porMes[clave] = (porMes[clave] || 0) + g.monto;
    });
    return Object.entries(porMes)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([mes, total]) => ({ mes, total }));
  }, [gastosRaw]);

  const chartEmpresa = useMemo(() => {
    const porEmpresa: Record<string, number> = {};
    gastosRaw.forEach((g) => {
      porEmpresa[g.empresa || "Sin empresa"] =
        (porEmpresa[g.empresa || "Sin empresa"] || 0) + g.monto;
    });
    return Object.entries(porEmpresa).map(([empresa, total]) => ({
      empresa,
      total,
    }));
  }, [gastosRaw]);

  const chartCategoriaPie = useMemo(() => {
    const porCategoria: Record<string, number> = {};
    gastosRaw.forEach((g) => {
      porCategoria[g.categoria || "Otros"] =
        (porCategoria[g.categoria || "Otros"] || 0) + g.monto;
    });
    return Object.entries(porCategoria).map(([categoria, total]) => ({
      categoria,
      total,
    }));
  }, [gastosRaw]);

  const chartTopUsuarios = useMemo(() => {
    const porUsuario: Record<string, number> = {};
    gastosRaw.forEach((g) => {
      if (!g.userId) return;
      porUsuario[g.userId] = (porUsuario[g.userId] || 0) + g.monto;
    });
    return Object.entries(porUsuario)
      .map(([uid, total]) => ({
        usuario: nombreUsuario(uid),
        total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [gastosRaw, usuarios]);

  // ================= Tabla =================
  const tabla = useMemo(() => {
    return gastosRaw
      .filter((g) =>
        busqueda
          ? g.descripcion?.toLowerCase().includes(busqueda.toLowerCase())
          : true
      )
      .map((g) => {
        const f = g.creadoEn?.toDate ? g.creadoEn.toDate() : new Date();
        return {
          fecha: f,
          fechaTxt: f.toLocaleString("es-MX"),
          empresa: g.empresa,
          usuario: nombreUsuario(g.userId),
          categoria: g.categoria,
          descripcion: g.descripcion,
          monto: g.monto,
          tamaño: g.tamaño,
        };
      })
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [gastosRaw, usuarios, busqueda]);

  // ================= Exportar Excel =================
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Reporte de Gastos");

    sheet.mergeCells("A1:F1");
    const titleCell = sheet.getCell("A1");
    
  // rango de fechas en el título
    const f1 = fechaInicio ? new Date(fechaInicio).toLocaleDateString("es-MX") : "";
    const f2 = fechaFin ? new Date(fechaFin).toLocaleDateString("es-MX") : "";

    let rango = "";

    if (f1 && f2) {
      rango = ` (${f1} - ${f2})`;
    }

    titleCell.value = "Reporte de Gastos" + rango;
    titleCell.font = { size: 16, bold: true, color: { argb: "1E88E5" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.addRow([]);

    const header = [
      "Fecha",
      "Empresa",
      "Usuario",
      "Categoría",
      "tamaño",
      "Monto",
    ];
    const headerRow = sheet.addRow(header);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "1E88E5" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    tabla.forEach((r) => {
      const row = sheet.addRow([
        r.fechaTxt,
        r.empresa,
        r.usuario,
        r.categoria,
        r.tamaño,
        r.monto,
      ]);
      row.getCell(6).numFmt = '"$"#,##0.00;[Red]\\-"$"#,##0.00';
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const totalRow = sheet.addRow(["", "", "", "", "TOTAL:", kpis.total]);
    totalRow.getCell(5).font = { bold: true };
    totalRow.getCell(6).font = { bold: true, color: { argb: "1E88E5" } };
    totalRow.getCell(6).numFmt = '"$"#,##0.00';

    sheet.columns = [
      { width: 20 },
      { width: 25 },
      { width: 25 },
      { width: 20 },
      { width: 40 },
      { width: 15 },
    ];
    sheet.views = [{ state: "frozen", ySplit: 2 }];

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Reporte_Gastos.xlsx"
    );
  };

  // ================= Listas dinámicas =================
  const empresasOpt = Array.from(
    new Set(gastosRaw.map((g) => g.empresa || "Sin empresa"))
  );

  const categoriasOpt = Array.from(
    new Set(gastosRaw.map((g) => g.categoria || "Sin categoría"))
  );

  if (loading)
    return (
      <div style={styles.center}>
        <p>Cargando datos...</p>
      </div>
    );

  return (
    <div style={styles.wrap}>
      <Sidebar />
      <main style={styles.main}>
        {/* ================= Filtros ================= */}
        <section style={styles.filtersCard}>
          <h2 style={styles.filtersTitle}>Filtros</h2>
          <div style={styles.filtersGrid}>
            <div style={styles.fItem}>
              <label>Desde</label>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.fItem}>
              <label>Hasta</label>
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.fItem}>
              <label>Empresa</label>
              <select
                value={fEmpresa}
                onChange={(e) => setFEmpresa(e.target.value)}
                style={styles.input}
              >
                <option value="">Todas</option>
                {empresasOpt.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fItem}>
              <label>Usuario</label>
              <select
                value={fUsuario}
                onChange={(e) => setFUsuario(e.target.value)}
                style={styles.input}
              >
                <option value="">Todos</option>
                {usuarios.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {`${u.nombre} ${u.apellido}`}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fItem}>
              <label>Categoría</label>
              <select
                value={fCategoria}
                onChange={(e) => setFCategoria(e.target.value)}
                style={styles.input}
              >
                <option value="">Todas</option>
                {categoriasOpt.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* === FILTRO DE TAMAÑO (DINÁMICO DESDE BD) === */}
            <div style={styles.fItem}>
              <label>Tamaño del vehículo</label>
              <select
                value={ftamaño}
                onChange={(e) => setTamaño(e.target.value)}
                style={styles.input}
              >
                <option value="">Todos</option>
                {tamanosOpt.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.fItem}>
              <label>Buscar descripción</label>
              <input
                type="text"
                placeholder="Buscar..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.exportContainer}>
              <button onClick={exportExcel} style={styles.btnExport}>
                📊 Exportar a Excel
              </button>
            </div>
          </div>
        </section>

        {/* ================= KPIs ================= */}
        <div style={styles.gridKPI}>
          <Kpi title="Gasto total" value={`$${kpis.total.toFixed(2)}`} />
          <Kpi title="N° de gastos" value={kpis.count.toString()} />
          <Kpi title="Ticket promedio" value={`$${kpis.avg.toFixed(2)}`} />
          <Kpi
            title="Top usuario"
            value={
              kpis.topUser
                ? `${kpis.topUser.nombre} ($${kpis.topUser.total.toFixed(2)})`
                : "—"
            }
          />
        </div>

        {/* ================= Gráficos ================= */}
        <div style={styles.gridCharts}>
          <Card title="Gasto total por mes">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartMensual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#1E88E5" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Total por empresa">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartEmpresa}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="empresa" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#43A047" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Distribución por categoría">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartCategoriaPie}
                  dataKey="total"
                  nameKey="categoria"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {chartCategoriaPie.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card title="Top 10 usuarios por gasto">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartTopUsuarios} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="usuario" type="category" width={140} />
                <Tooltip />
                <Bar dataKey="total" fill="#8E24AA" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* ================= Tabla ================= */}
        <Card title="Detalle de gastos (filtrado)">
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Fecha</th>
                  <th style={styles.th}>Empresa</th>
                  <th style={styles.th}>Usuario</th>
                  <th style={styles.th}>Categoría</th>
                  <th style={styles.th}>Descripción</th>
                  <th style={styles.th}>Monto</th>
                </tr>
              </thead>
              <tbody>
                {tabla.map((r, i) => (
                  <tr key={i}>
                    <td style={styles.td}>{r.fechaTxt}</td>
                    <td style={styles.td}>{r.empresa}</td>
                    <td style={styles.td}>{r.usuario}</td>
                    <td style={styles.td}>{r.categoria}</td>
                    <td style={styles.td}>{r.descripcion}</td>
                    <td style={styles.td}>${r.monto.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}

/* ================= Subcomponentes ================= */

function Card({ title, children }: any) {
  return (
    <section style={styles.card}>
      <div style={styles.cardHeader}>{title}</div>
      <div style={{ padding: 12 }}>{children}</div>
    </section>
  );
}

function Kpi({ title, value }: { title: string; value: string }) {
  return (
    <div style={styles.kpi}>
      <div style={styles.kpiTitle}>{title}</div>
      <div style={styles.kpiValue}>{value}</div>
    </div>
  );
}

/* ================= Estilos ================= */
const styles: Record<string, any> = {
  wrap: { display: "flex", minHeight: "100vh", background: "#f3f6fb" },
  main: { marginLeft: 220, width: "100%", padding: "28px" },
  filtersCard: {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 4px 14px rgba(0,0,0,.06)",
    marginBottom: 20,
    padding: "20px 25px",
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0b2d69",
    marginBottom: 15,
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 6,
  },
  filtersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px 40px",
    alignItems: "center",
  },
  fItem: { display: "flex", flexDirection: "column", gap: 10 },
  input: {
    height: 41,
    border: "1px solid #d0d7e2",
    borderRadius: 8,
    padding: "0 10px",
    background: "#f9fbfd",
    fontSize: 14,
  },
  exportContainer: {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  btnExport: {
    backgroundColor: "#1E88E5",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
    transition: "0.3s",
  },
  gridKPI: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 14,
    marginBottom: 18,
  },
  kpi: {
    background: "#fff",
    borderRadius: 12,
    padding: "16px 18px",
    boxShadow: "0 4px 14px rgba(0,0,0,.06)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  kpiTitle: { color: "#6b7a99", fontWeight: 600, fontSize: 13 },
  kpiValue: { color: "#0b2d69", fontWeight: 800, fontSize: 22 },
  gridCharts: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 16,
    marginBottom: 18,
  },
  card: {
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 4px 14px rgba(0,0,0,.06)",
  },
  cardHeader: {
    padding: "12px 16px",
    background: "#f8fafc",
    borderBottom: "1px solid #eef2f7",
    fontWeight: 700,
    color: "#0b2d69",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "center",
    background: "#0b2d69",
    color: "#fff",
    padding: "10px",
    fontWeight: 700,
  },
  td: {
    textAlign: "center",
    padding: "10px",
    borderBottom: "1px solid #eef2f7",
    color: "#223354",
  },
  center: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
