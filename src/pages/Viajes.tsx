import { useEffect, useState, useMemo } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";
import { FaTrash, FaMapMarkerAlt, FaUser, FaFileExcel } from "react-icons/fa";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";

/* ===== Tipos ===== */
type TViaje = {
  id?: string;
  empresa: string;
  origen: string;
  destino: string;
  fecha: string;
  operador: string;
  costo: number;
  userId?: string;
  creadoEn?: any;
};

type TUsuario = {
  uid: string;
  nombre?: string;
  apellido?: string;
};

/* ===== Componente ===== */
export default function Viajes() {
  const [viajes, setViajes] = useState<TViaje[]>([]);
  const [usuarios, setUsuarios] = useState<TUsuario[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [usuarioFiltro, setUsuarioFiltro] = useState("");
  const [origenFiltro, setOrigenFiltro] = useState("");
  const [destinoFiltro, setDestinoFiltro] = useState("");

  /* ===== Cargar datos ===== */
  const fetchViajes = async () => {
    setLoading(true);
    const usersSnap = await getDocs(collection(db, "usuarios"));
    const users = usersSnap.docs.map((d) => ({
      uid: d.id,
      ...d.data(),
    })) as TUsuario[];
    setUsuarios(users);

    const querySnapshot = await getDocs(collection(db, "viajes"));
    const data = querySnapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as TViaje[];

    setViajes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchViajes();
  }, []);

  /* ===== Obtener nombre de usuario ===== */
  const nombreUsuario = (uid?: string) => {
    if (!uid) return "—";
    const u = usuarios.find((x) => x.uid === uid);
    return u
      ? `${u.nombre ?? ""} ${u.apellido ?? ""}`.trim() || "Desconocido"
      : "Desconocido";
  };

  /* ===== Filtros combinados ===== */
  const filtrados = useMemo(() => {
    return viajes.filter((v) => {
      const coincideUsuario =
        usuarioFiltro === "" || v.userId === usuarioFiltro;
      const coincideOrigen = origenFiltro === "" || v.origen === origenFiltro;
      const coincideDestino =
        destinoFiltro === "" || v.destino === destinoFiltro;
      const coincideBusqueda = Object.values(v)
        .join(" ")
        .toLowerCase()
        .includes(busqueda.toLowerCase());
      return coincideUsuario && coincideOrigen && coincideDestino && coincideBusqueda;
    });
  }, [usuarioFiltro, origenFiltro, destinoFiltro, busqueda, viajes]);

  /* ===== Listas de opciones dinámicas ===== */
  const origenes = Array.from(new Set(viajes.map((v) => v.origen).filter(Boolean)));
  const destinos = Array.from(new Set(viajes.map((v) => v.destino).filter(Boolean)));

  /* ===== Eliminar viaje ===== */
  const eliminarViaje = async (id?: string) => {
    if (!id) return;
    const confirm = await Swal.fire({
      title: "¿Eliminar viaje?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (confirm.isConfirmed) {
      await deleteDoc(doc(db, "viajes", id));
      Swal.fire("Eliminado", "El viaje fue eliminado correctamente", "success");
      fetchViajes();
    }
  };

  /* ===== Exportar Excel ===== */
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Viajes");

    // Título
    sheet.mergeCells("A1:G1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "Reporte de Viajes - G-Logística";
    titleCell.font = { size: 16, bold: true, color: { argb: "1E88E5" } };
    titleCell.alignment = { vertical: "middle", horizontal: "center" };
    sheet.addRow([]);

    // Encabezados
    const header = ["Empresa", "Origen", "Destino", "Usuario", "Fecha", "Operador", "Costo"];
    const headerRow = sheet.addRow(header);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "1E88E5" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Filas
    filtrados.forEach((v) => {
      sheet.addRow([
        v.empresa,
        v.origen,
        v.destino,
        nombreUsuario(v.userId),
        v.fecha,
        v.operador,
        v.costo,
      ]);
    });

    const total = filtrados.reduce((sum, v) => sum + (v.costo || 0), 0);
    const totalRow = sheet.addRow(["", "", "", "", "", "TOTAL:", total]);
    totalRow.getCell(7).font = { bold: true, color: { argb: "1E88E5" } };
    totalRow.getCell(7).numFmt = '"$"#,##0.00';

    sheet.columns = [
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 25 },
      { width: 20 },
      { width: 25 },
      { width: 15 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      "Reporte_Viajes.xlsx"
    );
  };

  /* ===== Render ===== */
  if (loading)
    return (
      <div style={styles.center}>
        <p>Cargando viajes...</p>
      </div>
    );

  return (
    <div style={styles.wrap}>
      <Sidebar />
      <main style={styles.main}>
        <h2 style={styles.title}>🚛 Gestión de Viajes</h2>

        {/* === FILTROS === */}
        <div style={styles.toolbar}>
          <div style={styles.filters}>
            {/* Usuario */}
            <div style={styles.filterGroup}>
              <FaUser style={styles.icon} />
              <select
                value={usuarioFiltro}
                onChange={(e) => setUsuarioFiltro(e.target.value)}
                style={styles.select}
              >
                <option value="">Todos los usuarios</option>
                {usuarios.map((u) => (
                  <option key={u.uid} value={u.uid}>
                    {u.nombre} {u.apellido}
                  </option>
                ))}
              </select>
            </div>

            {/* Origen */}
            <div style={styles.filterGroup}>
              <FaMapMarkerAlt style={styles.iconBlue} />
              <select
                value={origenFiltro}
                onChange={(e) => setOrigenFiltro(e.target.value)}
                style={styles.select}
              >
                <option value="">Todos los orígenes</option>
                {origenes.map((o, i) => (
                  <option key={i} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Destino */}
            <div style={styles.filterGroup}>
              <FaMapMarkerAlt style={styles.iconRed} />
              <select
                value={destinoFiltro}
                onChange={(e) => setDestinoFiltro(e.target.value)}
                style={styles.select}
              >
                <option value="">Todos los destinos</option>
                {destinos.map((d, i) => (
                  <option key={i} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="text"
              placeholder="Buscar..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={styles.input}
            />
          </div>

          <button onClick={exportExcel} style={styles.btnExport}>
            <FaFileExcel /> Exportar Excel
          </button>
        </div>

        {/* === RESUMEN === */}
        <p style={styles.subTitle}>
          Mostrando <b>{filtrados.length}</b> de <b>{viajes.length}</b> viajes
        </p>

        {/* === TABLA === */}
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Origen</th>
                <th>Destino</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Operador</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((v) => (
                <tr key={v.id}>
                  <td>{v.empresa}</td>
                  <td>📍 {v.origen}</td>
                  <td>📍 {v.destino}</td>
                  <td>{nombreUsuario(v.userId)}</td>
                  <td>{v.fecha}</td>
                  <td>{v.operador}</td>
                  <td>
                    <button
                      onClick={() => eliminarViaje(v.id)}
                      style={styles.btnDelete}
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

/* ===== Estilos ===== */
const styles: Record<string, any> = {
  wrap: { display: "flex", minHeight: "100vh", background: "#f3f6fb" },
  main: { marginLeft: 220, width: "100%", padding: "28px" },
  title: { fontSize: "1.6rem", fontWeight: 700, color: "#0b2d69", marginBottom: 10 },
  subTitle: { color: "#6b7a99", marginBottom: 10 },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#fff",
    padding: "14px 20px",
    borderRadius: 12,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    marginBottom: 15,
    flexWrap: "wrap",
    gap: 10,
  },
  filters: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" },
  filterGroup: { display: "flex", alignItems: "center", gap: 6 },
  icon: { color: "#0b2d69" },
  iconBlue: { color: "#1e88e5" },
  iconRed: { color: "#e53935" },
  select: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#f9fbfd",
  },
  input: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #ccc",
    background: "#f9fbfd",
  },
 btnExport: {
  backgroundColor: "#43A047",
  color: "white",
  border: "none",
  padding: "12px 20px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 600,
  fontSize: 15,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: 180,
  boxShadow: "0 4px 10px rgba(67, 160, 71, 0.4)", // sombra verde elegante
  transition: "all 0.25s ease-in-out",             // animación suave
},


  tableWrap: { overflowX: "auto" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    background: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
  },
  th: {
    background: "#0b2d69",
    color: "#fff",
    padding: "10px",
    fontWeight: 600,
    textAlign: "center",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #eef2f7",
    textAlign: "center",
  },
  btnDelete: {
    background: "transparent",
    border: "none",
    color: "#e53935",
    cursor: "pointer",
    fontSize: 18,
    transition: "0.2s",
  },
  center: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
  },
};
