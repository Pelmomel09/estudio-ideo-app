import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// 1. AÑADIMOS arrayUnion A LAS IMPORTACIONES DE FIREBASE
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';

const Dashboard = () => {
  const context = useOutletContext() || {};
  const proyectos = context.proyectos || [];
  const horas = context.horas || [];
  const gastos = context.gastos || [];
  const ajustes = context.ajustes || {};
  const nombreUsuarioActual = context.nombreUsuarioActual || 'Compañero';

  const [usuario, setUsuario] = useState('Compañero');
  const [saludo, setSaludo] = useState('Bienvenido');
  const [filtroTiempo, setFiltroTiempo] = useState('total'); 
  const [fechaCalendario, setFechaCalendario] = useState(new Date());
  
  const TARIFA_KM = parseFloat(ajustes.precioKm) || 0.29;
  const MONEDA = ajustes.moneda || '€';
  const COLOR_ACENTO = ajustes.colorAcento || '#2563eb';

  useEffect(() => {
    const datosGuardados = localStorage.getItem('estudioIdeoUsuario');
    if (datosGuardados) {
      try {
        const datosObj = JSON.parse(datosGuardados);
        if (datosObj.nombre) setUsuario(datosObj.nombre);
      } catch (e) {
        console.error(e);
      }
    } else if (nombreUsuarioActual) {
      setUsuario(nombreUsuarioActual);
    }

    const horaActual = new Date().getHours();
    if (horaActual < 12) setSaludo('Buenos días');
    else if (horaActual < 20) setSaludo('Buenas tardes');
    else setSaludo('Buenas noches');
  }, [nombreUsuarioActual]);

  const filtrarPorFecha = (lista) => {
    if (filtroTiempo === 'total') return lista;
    
    const ahora = new Date();
    return lista.filter(item => {
      if (!item.fecha) return true; 
      const fechaItem = new Date(item.fecha);
      
      if (filtroTiempo === 'año') {
        return fechaItem.getFullYear() === ahora.getFullYear();
      }
      if (filtroTiempo === 'mes') {
        return fechaItem.getMonth() === ahora.getMonth() && fechaItem.getFullYear() === ahora.getFullYear();
      }
      if (filtroTiempo === 'semana') {
        const unDia = 24 * 60 * 60 * 1000;
        const diferenciaDias = Math.round(Math.abs((ahora - fechaItem) / unDia));
        return diferenciaDias <= 7;
      }
      return true;
    });
  };

  const miNombreMin = (nombreUsuarioActual || '').trim().toLowerCase();

  const misGastos = gastos.filter(g => {
    const esMioFlag = g._esMio === true;
    const autorGasto = (g.creadoPor || '').trim().toLowerCase();
    return esMioFlag || (autorGasto && miNombreMin && autorGasto === miNombreMin);
  });

  const misHoras = horas.filter(h => {
    const esMioFlag = h._esMio === true;
    const autorHora = (h.creadoPor || '').trim().toLowerCase();
    return esMioFlag || (autorHora && miNombreMin && autorHora === miNombreMin);
  });

  const gastosFiltrados = filtrarPorFecha(misGastos);
  const horasFiltradas = filtrarPorFecha(misHoras);
  const cantidadProyectos = proyectos.length; 

  const fechaHoyStr = new Date().toISOString().split('T')[0];
  const totalHorasHoy = misHoras
    .filter(h => h.fecha === fechaHoyStr)
    .reduce((total, h) => total + (parseFloat(h.horasTotales) || 0), 0);

  const gastosNormales = gastosFiltrados
    .filter(g => g.tipoGasto !== 'kilometraje')
    .reduce((total, g) => total + parseFloat(g.cantidad || 0), 0);
    
  const totalKm = gastosFiltrados
    .filter(g => g.tipoGasto === 'kilometraje')
    .reduce((total, g) => total + parseFloat(g.cantidad || 0), 0);

  const gastosTotales = gastosNormales + (totalKm * TARIFA_KM);

  // 2. FUNCIÓN DE ARCHIVADO (Soft Delete) CONECTADA A FIREBASE
  const handleReset = async () => {
    const confirmar1 = window.confirm("⚠️ ATENCIÓN: Vas a reiniciar tu panel. Los datos se archivarán en la base de datos de forma segura pero desaparecerán de la vista actual. ¿Continuar?");
    
    if (confirmar1) {
      const confirmar2 = window.confirm("🚨 ÚLTIMO AVISO: Tu panel se pondrá a cero. ¿Archivar y limpiar ahora?");
      
      if (confirmar2) {
        try {
          const usuario = auth.currentUser;
          if (!usuario) {
            alert("❌ Error: No se detectó al usuario activo.");
            return;
          }

          const userDocRef = doc(db, "usuarios", usuario.uid);
          
          // Preparamos los datos a actualizar en la base de datos
          const actualizaciones = {
            horas: [], // Vaciamos la vista principal de horas
            gastos: [] // Vaciamos la vista principal de gastos
          };

          // Si hay datos, los movemos al archivo histórico de Firebase
          if (horas.length > 0) {
            actualizaciones.horasArchivadas = arrayUnion(...horas);
          }
          if (gastos.length > 0) {
            actualizaciones.gastosArchivados = arrayUnion(...gastos);
          }
          
          // Enviamos la orden a la base de datos
          await updateDoc(userDocRef, actualizaciones);

          alert("✅ Panel reseteado con éxito. Tus datos antiguos han sido archivados de forma segura.");
        } catch (error) {
          console.error("Error al archivar datos:", error);
          alert("❌ Hubo un error al intentar archivar los datos en la nube.");
        }
      }
    }
  };

  let datosGraficaReal = [];
  if (horasFiltradas.length === 0) {
    datosGraficaReal = [{ dia: 'Sin datos', horas: 0 }];
  } else {
    const horasPorDia = horasFiltradas.reduce((acc, h) => {
      acc[h.fecha] = (acc[h.fecha] || 0) + parseFloat(h.horasTotales);
      return acc;
    }, {});
    
    datosGraficaReal = Object.keys(horasPorDia).map(fecha => ({
      dia: fecha.substring(5), 
      horas: horasPorDia[fecha]
    })).sort((a, b) => a.dia.localeCompare(b.dia)); 
  }

  return (
    <main style={styles.mainContent}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.welcomeText}>Panel de Control</h1>
          <p style={styles.dateText}>{saludo}, {usuario}. Tus gastos personales y actividad real.</p>
        </div>
        
        <div style={styles.userSectionGroup}>
          <button style={styles.resetButton} onClick={handleReset}>
            ↺ Resetear Panel
          </button>
          
          <div style={styles.userSection}>
            <span style={styles.userName}>{usuario}</span>
            <div style={{ ...styles.avatar, backgroundColor: COLOR_ACENTO }}>
              {usuario.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <div className="fade-in">
        <div style={styles.tabsContainer}>
          <button style={filtroTiempo === 'semana' ? {...styles.tab, ...styles.tabActive} : styles.tab} onClick={() => setFiltroTiempo('semana')}>Últimos 7 días</button>
          <button style={filtroTiempo === 'mes' ? {...styles.tab, ...styles.tabActive} : styles.tab} onClick={() => setFiltroTiempo('mes')}>Este Mes</button>
          <button style={filtroTiempo === 'año' ? {...styles.tab, ...styles.tabActive} : styles.tab} onClick={() => setFiltroTiempo('año')}>Este Año</button>
          <button style={filtroTiempo === 'total' ? {...styles.tab, ...styles.tabActive} : styles.tab} onClick={() => setFiltroTiempo('total')}>Histórico Total</button>
        </div>

        <div style={styles.summaryGrid}>
          <div className="summary-card" style={{...styles.card, borderBottom: '4px solid #ef4444'}}>
            <p style={styles.cardLabel}>Mis Gastos Personales</p>
            <h3 style={styles.cardValue}>{gastosTotales.toFixed(2)} {MONEDA}</h3>
            <p style={styles.cardTrend}>Incluye {totalKm.toFixed(0)} km a {TARIFA_KM}{MONEDA}/km</p>
          </div>
          
          <div className="summary-card" style={{...styles.card, borderBottom: '4px solid #3b82f6'}}>
            <p style={styles.cardLabel}>Proyectos Accesibles</p>
            <h3 style={styles.cardValue}>{cantidadProyectos}</h3>
            <div style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginTop: '8px' }}>
               <div style={{ width: cantidadProyectos > 0 ? '100%' : '0%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
            </div>
          </div>
          
          <div className="summary-card" style={{...styles.card, borderBottom: '4px solid #f59e0b'}}>
            <p style={styles.cardLabel}>Mis Kilómetros</p>
            <h3 style={styles.cardValue}>{totalKm.toFixed(0)} Km</h3>
            <p style={styles.cardTrend}>Tarifa activa: {TARIFA_KM} {MONEDA}/km</p>
          </div>
          
          <div className="summary-card" style={{...styles.card, borderBottom: '4px solid #10b981'}}>
            <p style={styles.cardLabel}>Horas de Hoy</p>
            <h3 style={styles.cardValue}>{totalHorasHoy.toFixed(2)} h</h3>
            <p style={styles.cardTrend}>{horasFiltradas.length} fichajes en total</p>
          </div>
        </div>

        <div style={styles.bottomGrid}>
          <div className="summary-card" style={styles.chartCard}>
            <h3 style={styles.sectionTitle}>Curva de Horas Fichadas</h3>
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={datosGraficaReal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHoras" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLOR_ACENTO} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLOR_ACENTO} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="dia" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="horas" stroke={COLOR_ACENTO} fillOpacity={1} fill="url(#colorHoras)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="summary-card" style={styles.calendarCard}>
            <h3 style={styles.sectionTitle}>Calendario de Actividad</h3>
            <div style={styles.calendarContainer}>
              <Calendar 
                onChange={setFechaCalendario} 
                value={fechaCalendario} 
                className="custom-calendar"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

const styles = {
  mainContent: { flex: 1, padding: '40px 50px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  welcomeText: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' },
  dateText: { fontSize: '16px', color: '#64748b', margin: '8px 0 0 0' },
  
  userSectionGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
  userSection: { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#ffffff', padding: '8px 16px', borderRadius: '50px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  userName: { fontSize: '15px', fontWeight: '700', color: '#1e293b' },
  avatar: { width: '40px', height: '40px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', fontWeight: 'bold' },
  
  resetButton: { backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #f87171', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px' },
  
  tabsContainer: { display: 'flex', gap: '10px', marginBottom: '25px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' },
  tab: { padding: '8px 16px', borderRadius: '20px', border: 'none', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  tabActive: { backgroundColor: '#1e293b', color: '#ffffff' },

  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '30px' },
  card: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  cardLabel: { color: '#64748b', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  cardValue: { color: '#0f172a', fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0' },
  cardTrend: { color: '#94a3b8', fontSize: '13px', margin: 0 },
  
  bottomGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
  chartCard: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '24px', marginTop: 0 },
  
  calendarCard: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' },
  calendarContainer: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }
};

export default Dashboard;