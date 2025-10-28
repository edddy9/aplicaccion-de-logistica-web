import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // redirige al dashboard
    } catch (error: any) {
      setError("Correo o contraseña incorrectos.");
      console.error(error);
    }
  };

  return (
    <div style={styles.container}>
      <h1>LOGIN</h1>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.button}>
          Entrar
        </button>
       
        
      </form>
      {error && <p style={styles.error}>{error}</p>}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#ffd392ff",
    textAlign: "center" as const,
    marginTop: "80px",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    padding: "50px",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    width: "300px",
    marginLeft: "auto",
    marginRight: "auto",
  },
  form: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    gap: "10px",
    marginTop: "20px",
  },
  input: {
    width: "250px",
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  button: {
    width: "250px",
    padding: "10px",
    borderRadius: "6px",
    backgroundColor: "#007bff",
    color: "white",
    border: "none",
    cursor: "pointer",
  },
  error: {
    color: "red",
    marginTop: "15px",
  },
};
