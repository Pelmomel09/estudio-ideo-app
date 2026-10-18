import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
// IMPORTAMOS FUNCIONES CLAVE DE FIREBASE AUTH Y FIRESTORE
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
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
  
  // ESTADOS DE LA APLICACIÓN
  const [proyectos, setProyectosState] = useState([]);
  const [horas, setHorasState] = useState([]);
  const [gastos, setGastosState] = useState([]);
  const [ajustes, setAjustesState] = useState(ajustesPorDefecto);
  
  const [toast, setToast] = useState({ show: false, mensaje: '' });
  
  // ESTADOS DE CONEXIÓN A LA NUBE
  const [usuarioActivo, setUsuarioActivo] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // Referencia para recordar los documentos originales de Firestore sin causar recargas
  const mapaUsuariosRef = useRef({});

  // 1. FUNCIÓN AUXILIAR: Obtener el nombre de usuario actual en minúsculas
  const obtenerNombreUsuarioActual = (user) => {
    let nombre = '';
    const datosGuardados = localStorage.getItem('estudioIdeoUsuario');
    if (datosGuardados) {
      try {
        const obj = JSON.parse(datosGuardados);
        if (obj.nombre) nombre = obj.nombre;
      } catch (e) {
        console.error("Error leyendo usuario local:", e);
      }
    }
    if (!nombre && user?.displayName) nombre = user.displayName;
    if (!nombre && user?.email) nombre = user.email.split('@')[0];
    return nombre.trim().toLowerCase();
  };

  // 2. AL ENTRAR: VERIFICAMOS EL USUARIO Y ESCUCHAMOS PROYECTOS PROPIOS Y COMPARTIDOS
  useEffect(() => {
    let unsubscribeFirestore = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsuarioActivo(user.uid);
        const miNombre = obtenerNombreUsuarioActual(user);
        const miEmail = (user.email || '').trim().toLowerCase();

        // Escuchamos en tiempo real la colección "usuarios" para detectar proyectos compartidos
        const colRef = collection(db, 'usuarios');
        unsubscribeFirestore = onSnapshot(colRef, (snapshot) => {
          const todosLosUsuarios = {};
          snapshot.forEach((documento) => {
            todosLosUsuarios[documento.id] = documento.data();
          });

          mapaUsuariosRef.current = todosLosUsuarios;

          // A) Cargamos los ajustes personales de nuestro propio documento
          const misDatos = todosLosUsuarios[user.uid] || {};
          if (misDatos.ajustes) {
            setAjustesState({ ...ajustesPorDefecto, ...misDatos.ajustes });
          }

          // B) Reunimos nuestros proyectos + los proyectos donde somos colaboradores
          const proyectosCombinados = [];
          const idsProyectosVistos = new Set();

          Object.entries(todosLosUsuarios).forEach(([uidDoc, datosDoc]) => {
            const listaProyectosDoc = datosDoc.proyectos || [];
            listaProyectosDoc.forEach((proy) => {
              const esMio = uidDoc === user.uid;
              const colaboradoresLimpiados = (proy.colaboradores || []).map(c => String(c).trim().toLowerCase());
              const soyColaborador = (miNombre && colaboradoresLimpiados.includes(miNombre)) ||
                                     (miEmail && colaboradoresLimpiados.includes(miEmail));

              if ((esMio || soyColaborador) && !idsProyectosVistos.has(String(proy.id))) {
                idsProyectosVistos.add(String(proy.id));
                proyectosCombinados.push({
                  ...proy,
                  // Guardamos internamente quién es el dueño original del documento
                  _uidPropietario: proy._uidPropietario || uidDoc
                });
              }
            });
          });

          // C) Reunimos todos los gastos y horas asociados a nuestros proyectos activos
          const gastosCombinados = [];
          const idsGastosVistos = new Set();
          const horasCombinadas = [];
          const idsHorasVistas = new Set();

          Object.entries(todosLosUsuarios).forEach(([uidDoc, datosDoc]) => {
            const esMiDocumento = uidDoc === user.uid;

            // Filtramos Gastos
            (datosDoc.gastos || []).forEach((g) => {
              const perteneceAProyectoCompartido = idsProyectosVistos.has(String(g.proyectoId));
              if ((esMiDocumento || perteneceAProyectoCompartido) && !idsGastosVistos.has(String(g.id))) {
                idsGastosVistos.add(String(g.id));
                gastosCombinados.push({ ...g, _uidOrigen: g._uidOrigen || uidDoc });
              }
            });

            // Filtramos Horas
            (datosDoc.horas || []).forEach((h) => {
              const perteneceAProyectoCompartido = idsProyectosVistos.has(String(h.proyectoId));
              if ((esMiDocumento || perteneceAProyectoCompartido) && !idsHorasVistas.has(String(h.id))) {
                idsHorasVistas.add(String(h.id));
                horasCombinadas.push({ ...h, _uidOrigen: h._uidOrigen || uidDoc });
              }
            });
          });

          setProyectosState(proyectosCombinados);
          setGastosState(gastosCombinados);
          setHorasState(horasCombinadas);
          setCargandoDatos(false);
        }, (error) => {
          console.error("Error al sincronizar con Firestore:", error);
          setCargandoDatos(false);
        });

      } else {
        navigate('/');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, [navigate]);

  // 3. FUNCIONES DE GUARDADO EN LA NUBE (Actualizan el documento propietario correspondiente)
  const setProyectos = async (nuevoValor) => {
    const nuevaLista = typeof nuevoValor === 'function' ? nuevoValor(proyectos) : nuevoValor;
    setProyectosState(nuevaLista);
    if (!usuarioActivo) return;

    // Identificamos qué documentos de usuario necesitamos actualizar en Firestore
    const uidsAfectados = new Set([usuarioActivo]);
    proyectos.forEach(p => uidsAfectados.add(p._uidPropietario || usuarioActivo));
    nuevaLista.forEach(p => uidsAfectados.add(p._uidPropietario || usuarioActivo));

    for (const uidDestino of uidsAfectados) {
      const proyectosOriginalesDoc = mapaUsuariosRef.current[uidDestino]?.proyectos || [];
      const idsQueEranVisibles = new Set(
        proyectos.filter(p => (p._uidPropietario || usuarioActivo) === uidDestino).map(p => String(p.id))
      );

      // Mantenemos intactos los proyectos privados del compañero en los que no participamos
      const proyectosPrivadosIntactos = proyectosOriginalesDoc.filter(p => !idsQueEranVisibles.has(String(p.id)));

      // Añadimos los proyectos actualizados que pertenecen a este documento
      const proyectosActualizados = nuevaLista
        .filter(p => (p._uidPropietario || usuarioActivo) === uidDestino)
        .map(p => ({ ...p, _uidPropietario: uidDestino }));

      await setDoc(doc(db, 'usuarios', uidDestino), {
        proyectos: [...proyectosPrivadosIntactos, ...proyectosActualizados]
      }, { merge: true }).catch(err => console.error("Error guardando proyectos:", err));
    }
  };

  const setGastos = async (nuevoValor) => {
    const nuevaLista = typeof nuevoValor === 'function' ? nuevoValor(gastos) : nuevoValor;
    setGastosState(nuevaLista);
    if (!usuarioActivo) return;

    const uidsAfectados = new Set([usuarioActivo]);
    gastos.forEach(g => uidsAfectados.add(g._uidOrigen || usuarioActivo));
    nuevaLista.forEach(g => uidsAfectados.add(g._uidOrigen || usuarioActivo));

    for (const uidDestino of uidsAfectados) {
      const gastosOriginalesDoc = mapaUsuariosRef.current[uidDestino]?.gastos || [];
      const idsQueEranVisibles = new Set(
        gastos.filter(g => (g._uidOrigen || usuarioActivo) === uidDestino).map(g => String(g.id))
      );

      const gastosPrivadosIntactos = gastosOriginalesDoc.filter(g => !idsQueEranVisibles.has(String(g.id)));
      const gastosActualizados = nuevaLista
        .filter(g => (g._uidOrigen || usuarioActivo) === uidDestino)
        .map(g => ({ ...g, _uidOrigen: uidDestino }));

      await setDoc(doc(db, 'usuarios', uidDestino), {
        gastos: [...gastosPrivadosIntactos, ...gastosActualizados]
      }, { merge: true }).catch(err => console.error("Error guardando gastos:", err));
    }
  };

  const setHoras = async (nuevoValor) => {
    const nuevaLista = typeof nuevoValor === 'function' ? nuevoValor(horas) : nuevoValor;
    setHorasState(nuevaLista);
    if (!usuarioActivo) return;

    const uidsAfectados = new Set([usuarioActivo]);
    horas.forEach(h => uidsAfectados.add(h._uidOrigen || usuarioActivo));
    nuevaLista.forEach(h => uidsAfectados.add(h._uidOrigen || usuarioActivo));

    for (const uidDestino of uidsAfectados) {
      const horasOriginalesDoc = mapaUsuariosRef.current[uidDestino]?.horas || [];
      const idsQueEranVisibles = new Set(
        horas.filter(h => (h._uidOrigen || usuarioActivo) === uidDestino).map(h => String(h.id))
      );

      const horasPrivadasIntactas = horasOriginalesDoc.filter(h => !idsQueEranVisibles.has(String(h.id)));
      const horasActualizadas = nuevaLista
        .filter(h => (h._uidOrigen || usuarioActivo) === uidDestino)
        .map(h => ({ ...h, _uidOrigen: uidDestino }));

      await setDoc(doc(db, 'usuarios', uidDestino), {
        horas: [...horasPrivadasIntactas, ...horasActualizadas]
      }, { merge: true }).catch(err => console.error("Error guardando horas:", err));
    }
  };

  const setAjustes = async (nuevoValor) => {
    const nuevosAjustes = typeof nuevoValor === 'function' ? nuevoValor(ajustes) : nuevoValor;
    setAjustesState(nuevosAjustes);
    if (!usuarioActivo) return;

    await setDoc(doc(db, 'usuarios', usuarioActivo), {
      ajustes: nuevosAjustes
    }, { merge: true }).catch(err => console.error("Error guardando ajustes:", err));
  };

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
        <h2 style={{ color: '#64748b', fontSize: '24px', fontWeight: '700' }}>☁️ Sincronizando datos del equipo...</h2>
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