// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ⚠️ Usa tus propias credenciales de Firebase (las mismas que tu app móvil)
const firebaseConfig = {
  apiKey: "AIzaSyAvhzkGwB7uyF7A6pLxnmkR5CmtnEyperI",
  authDomain: "sgt-logistica.firebaseapp.com",
  projectId: "sgt-logistica",
  storageBucket: "sgt-logistica.firebasestorage.app",
  messagingSenderId: "372545254861",
  appId: "1:372545254861:web:xxxxxxxxxxxxxxxxxxxxxx"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta los servicios
export const auth = getAuth(app);
export const db = getFirestore(app);
