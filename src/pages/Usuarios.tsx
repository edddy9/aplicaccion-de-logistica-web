import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "../firebaseConfig";
import Sidebar from "../components/Sidebar";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("");
  const [editUser, setEditUser] = useState<any | null>(null);
  const [newUser, setNewUser] = useState<any | null>(null);

  // 🔹 Cargar usuarios desde Firestore
  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsuarios(data);
      } catch (error) {
        console.error("Error al obtener usuarios:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  // 🔍 Filtrado
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const texto = `${u.nombre ?? ""} ${u.apellido ?? ""} ${u.email ?? ""}`.toLowerCase();
      const coincideBusqueda = texto.includes(busqueda.toLowerCase());
      const coincideRol = filtroRol ? u.rol === filtroRol : true;
      return coincideBusqueda && coincideRol;
    });
  }, [usuarios, busqueda, filtroRol]);

  // 📊 Contador de roles
  const resumen = useMemo(() => {
    const roles: Record<string, number> = {};
    usuarios.forEach((u) => {
      const rol = u.rol || "transportista";
      roles[rol] = (roles[rol] || 0) + 1;
    });
    return roles;
  }, [usuarios]);

  // 🗑️ Eliminar usuario
  const eliminarUsuario = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      await deleteDoc(doc(db, "usuarios", id));
      setUsuarios((prev) => prev.filter((u) => u.id !== id));
      alert("Usuario eliminado correctamente.");
    } catch (error) {
      alert("Error al eliminar usuario.");
      console.error(error);
    }
  };

  // 🧩 Modal edición
  const abrirEdicion = (usuario: any) => setEditUser(usuario);
  const cerrarModal = () => {
    setEditUser(null);
    setNewUser(null);
  };

  // 💾 Guardar cambios
  const guardarCambios = async () => {
    if (!editUser) return;
    try {
      await updateDoc(doc(db, "usuarios", editUser.id), editUser);
      setUsuarios((prev) => prev.map((u) => (u.id === editUser.id ? editUser : u)));
      alert("Usuario actualizado correctamente.");
      cerrarModal();
    } catch (error) {
      alert("Error al actualizar usuario.");
    }
  };

  // 💾 Agregar nuevo usuario (Auth + Firestore)
  const guardarNuevoUsuario = async () => {
    if (!newUser?.email || !newUser?.nombre || !newUser?.password) {
      alert("El nombre, correo y contraseña son obligatorios.");
      return;
    }

    try {
      // 1️⃣ Crear usuario en Authentication
      const cred = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      // 2️⃣ Guardar en Firestore
      const docRef = await addDoc(collection(db, "usuarios"), {
        uid: cred.user.uid,
        nombre: newUser.nombre,
        apellido: newUser.apellido || "",
        email: newUser.email,
        telefono: newUser.telefono || "",
        rol: newUser.rol || "transportista",
      });

      setUsuarios((prev) => [
        ...prev,
        { id: docRef.id, ...newUser, uid: cred.user.uid },
      ]);
      alert("✅ Usuario creado correctamente.");
      cerrarModal();
    } catch (error: any) {
      console.error(error);
      alert("Error al crear usuario: " + (error.message || ""));
    }
  };

  // ⚡ Cambio rápido de rol
  const cambiarRol = async (id: string, nuevoRol: string) => {
    try {
      await updateDoc(doc(db, "usuarios", id), { rol: nuevoRol });
      setUsuarios((prev) =>
        prev.map((u) => (u.id === id ? { ...u, rol: nuevoRol } : u))
      );
    } catch (error) {
      console.error("Error al cambiar rol:", error);
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar />
      <main style={styles.content}>
        <h1 style={styles.title}>👥 Panel de Usuarios</h1>

        {/* 📊 Resumen */}
        <div style={styles.resumenGrid}>
          {Object.entries(resumen).map(([rol, total]) => (
            <div key={rol} style={styles.card}>
              <h3 style={styles.title}>{rol.toUpperCase()}</h3>
              <p style={styles.td}>{total}</p>
            </div>
          ))}
        </div>

        {/* 🔍 Filtros */}
        <div style={styles.filters}>
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            style={styles.select}
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administrador</option>
            
            <option value="transportista">Transportista</option>
          </select>
          <button onClick={() => setNewUser({})} style={styles.btnAdd}>
            ➕ Agregar Usuario
          </button>
        </div>

        {/* 📋 Tabla */}
        {loading ? (
          <p>Cargando usuarios...</p>
        ) : usuariosFiltrados.length === 0 ? (
          <p>No se encontraron usuarios.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Nombre</th>
                  <th style={styles.th}>Apellido</th>
                  <th style={styles.th}>Correo</th>
                  <th style={styles.th}>Teléfono</th>
                  <th style={styles.th}>Rol</th>
                  <th style={styles.th}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id}>
                    <td style={styles.td}>{u.nombre}</td>
                    <td style={styles.td}>{u.apellido}</td>
                    <td style={styles.td}>{u.email}</td>
                    <td style={styles.td}>{u.telefono}</td>
                    <td style={styles.td}>
                      <select
                        value={u.rol || "transportista"}
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                        style={styles.roleSelect}
                      >
                        <option value="admin">Admin</option>
                        
                        <option value="transportista">Transportista</option>
                      </select>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => abrirEdicion(u)}
                        style={styles.btnEdit}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => eliminarUsuario(u.id)}
                        style={styles.btnDelete}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 🧩 Modal (Agregar o Editar) */}
        {(editUser || newUser) && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <h2>{editUser ? "Editar Usuario" : "Nuevo Usuario"}</h2>
              <label>Nombre</label>
              <input
                style={styles.input}
                value={editUser ? editUser.nombre || "" : newUser?.nombre || ""}
                onChange={(e) =>
                  editUser
                    ? setEditUser({ ...editUser, nombre: e.target.value })
                    : setNewUser({ ...newUser, nombre: e.target.value })
                }
              />
              <label>Apellido</label>
              <input
                style={styles.input}
                value={editUser ? editUser.apellido || "" : newUser?.apellido || ""}
                onChange={(e) =>
                  editUser
                    ? setEditUser({ ...editUser, apellido: e.target.value })
                    : setNewUser({ ...newUser, apellido: e.target.value })
                }
              />
              <label>Correo</label>
              <input
                style={styles.input}
                value={editUser ? editUser.email || "" : newUser?.email || ""}
                onChange={(e) =>
                  editUser
                    ? setEditUser({ ...editUser, email: e.target.value })
                    : setNewUser({ ...newUser, email: e.target.value })
                }
              />
              {!editUser && (
                <>
                  <label>Contraseña</label>
                  <input
                    type="password"
                    style={styles.input}
                    value={newUser?.password || ""}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                  />
                </>
              )}
              <label>Teléfono</label>
              <input
                style={styles.input}
                value={editUser ? editUser.telefono || "" : newUser?.telefono || ""}
                onChange={(e) =>
                  editUser
                    ? setEditUser({ ...editUser, telefono: e.target.value })
                    : setNewUser({ ...newUser, telefono: e.target.value })
                }
              />
              <label>Rol</label>
              <select
                style={styles.input}
                value={editUser ? editUser.rol || "transportista" : newUser?.rol || "transportista"}
                onChange={(e) =>
                  editUser
                    ? setEditUser({ ...editUser, rol: e.target.value })
                    : setNewUser({ ...newUser, rol: e.target.value })
                }
              >
                <option value="admin">Admin</option>
               
                <option value="transportista">Transportista</option>
              </select>

              <div style={styles.modalButtons}>
                <button
                  onClick={editUser ? guardarCambios : guardarNuevoUsuario}
                  style={styles.btnSave}
                >
                  💾 Guardar
                </button>
                <button onClick={cerrarModal} style={styles.btnCancel}>
                  ❌ Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// 🎨 Estilos (mismos que antes, sin cambios)
const styles = {
  container: { display: "flex", minHeight: "100vh", backgroundColor: "#f4f6f8" },
  content: { marginLeft: "220px", padding: "40px", width: "100%" },
  title: { fontSize: "28px", fontWeight: "bold", color: "#0048a6", marginBottom: "30px" },
  resumenGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "20px",
    marginBottom: "25px",
  },
  card: {
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    textAlign: "center" as const,
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
  filters: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    marginBottom: "25px",
  },
  searchInput: {
    flex: 1,
    padding: "10px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    background: "white",
  },
  select: {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    background: "white",
  },
  btnAdd: {
    background: "#28a745",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "10px 15px",
    cursor: "pointer",
    fontWeight: "bold",
  },
  btnEdit: {
    background: "#ffc107",
    border: "none",
    borderRadius: "6px",
    padding: "5px 8px",
    cursor: "pointer",
    marginRight: "0x",
        margin: "10px 0px",
    
  },
  btnDelete: {
    background: "#dc3545",
    color: "white",
    border: "none",
    borderRadius: "6px",
    padding: "5px 8px",
    cursor: "pointer",
    marginbottom: "6px",
  },
  modalOverlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "white",
    padding: "30px",
    borderRadius: "12px",
    width: "400px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "10px",
  },
  input: {
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "6px",
  },
  modalButtons: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: "10px",
  },
  btnSave: {
    background: "#007bff",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  btnCancel: {
    background: "#6c757d",
    color: "white",
    border: "none",
    padding: "8px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  th: {
    background: "#007bff",
    color: "white",
    textAlign: "center" as const,
    padding: "10px",
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #ddd",
    textAlign: "center" as const,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    background: "white",
    borderRadius: "10px",
    overflow: "hidden",
    boxShadow: "0 10px 10px rgba(0,0,0,0.1)",
  },
  roleSelect: { border: "1px solid #ccc", borderRadius: "6px", padding: "4px" },
};
