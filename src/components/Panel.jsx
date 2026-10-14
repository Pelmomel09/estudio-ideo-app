import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
// IMPORTAMOS FUNCIONES CLAVE DE FIREBASE
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import Sidebar from './Sidebar';

const ajustesPorDefecto = {
  precioKm: 0.29, moneda: '€', precioHora: 45, impuesto: 21, tiposGastosCustom: false,
  nombreEmpresa: 'Estudio Ideo', nif: '', direccion: '', formatoFecha: 'DD/MM/AAAA',
  modoOscuro: false, colorAcento: '#2563eb', mostrarToasts: true, formatoExportacion: 'CSV',
  vistaCompacta: false, cierreInactividad: false, animaciones: true, sonidos: false,
  prefijoProyecto: '', redondearHoras: false
};

const Panel = () => {
  const navigate = useNavigate();
  
  // ESTADOS DE LA APLICACIÓN (Empiezan vacíos hasta que la nube los llene)
  const [proyectos, setProyectos] = useState([]);
  const [horas, setHoras] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [ajustes, setAjustes] = useState(ajustesPorDefecto);
  
  const [toast, setToast] = useState({ show: false, mensaje: '' });
  
  // ESTADOS DE CONEXIÓN A LA NUBE
  const [usuarioActivo, setUsuarioActivo] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // 1. AL ENTRAR: VERIFICAMOS QUIÉN ES Y DESCARGAMOS SUS DATOS
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUsuarioActivo(user.uid); // Guardamos la ID única del usuario
        
        // Buscamos su documento en la base de datos Firestore
        const docRef = doc(db, 'usuarios', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const datosNube = docSnap.data();
          if (datosNube.proyectos) setProyectos(datosNube.proyectos);
          if (datosNube.horas) setHoras(datosNube.horas);
          if (datosNube.gastos) setGastos(datosNube.gastos);
          if (datosNube.ajustes) setAjustes({ ...ajustesPorDefecto, ...datosNube.ajustes });
        }
        
        // Una vez descargado todo, quitamos la pantalla de carga
        setCargandoDatos(false);
      } else {
        // Si no hay usuario, lo echamos al login
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 2. AL MODIFICAR DATOS: SUBIMOS TODO A LA NUBE AUTOMÁTICAMENTE
  useEffect(() => {
    // Solo guardamos si ya hemos terminado de cargar los datos iniciales
    if (usuarioActivo && !cargandoDatos) {
      const docRef = doc(db, 'usuarios', usuarioActivo);
      // setDoc guarda o actualiza el documento del usuario en la nube
      setDoc(docRef, { proyectos, horas, gastos, ajustes }, { merge: true })
        .catch(error => console.error("Error guardando en la nube:", error));
    }
  }, [proyectos, horas, gastos, ajustes, usuarioActivo, cargandoDatos]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const mostrarToast = (mensaje) => {
    if (!ajustes.mostrarToasts) return;
    setToast({ show: true, mensaje });
    setTimeout(() => { setToast({ show: false, mensaje: '' }); }, 3000);
  };

  // PANTALLA DE CARGA MIENTRAS SE CONECTA A FIREBASE
  if (cargandoDatos) {
    return (
      <div style={{ display: 'flex', height: '100vh', width: '100vw', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <h2 style={{ color: '#64748b', fontSize: '24px', fontWeight: '700' }}>☁️ Sincronizando datos...</h2>
      </div>
    );
  }

  // INTERFAZ PRINCIPAL
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#f8fafc', fontFamily: 'system-ui, sans-serif', position: 'relative' }}>
      
      {toast.show && (
        <div style={styles.toast}>
          {toast.mensaje}
        </div>
      )}

      <Sidebar proyectos={proyectos} onLogout={handleLogout} ajustes={ajustes} />

      <Outlet context={{ 
        proyectos, setProyectos,
        horas, setHoras,
        gastos, setGastos,
        ajustes, setAjustes, 
        mostrarToast
      }} />
      
    </div>
  );
};

const styles = {
  toast: { position: 'fixed', bottom: '40px', right: '40px', backgroundColor: '#1e293b', color: '#ffffff', padding: '16px 24px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontSize: '15px', fontWeight: '600', zIndex: 1000, animation: 'fadeInUp 0.3s ease-out' }
};

export default Panel;