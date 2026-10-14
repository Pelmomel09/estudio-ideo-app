import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  // 1. CONEXIÓN REAL: Extraemos los datos globales de la aplicación
  // (Si por algún motivo están vacíos, les ponemos un array [] por defecto para que no falle)
  const context = useOutletContext();
  const proyectos = context?.proyectos || [];
  const horas = context?.horas || [];
  const gastos = context?.gastos || [];

  const [nota, setNota] = useState('');
  const [usuario, setUsuario] = useState('Compañero');
  const [saludo, setSaludo] = useState('Bienvenido');

  // 2. EFECTO DE INICIO: Leer el usuario real y calcular el saludo
  useEffect(() => {
    // Leemos el usuario guardado en el paso de Login
    const datosGuardados = localStorage.getItem('estudioIdeoUsuario');
    if (datosGuardados) {
      const datosObj = JSON.parse(datosGuardados);
      setUsuario(datosObj.nombre);
    }

    // EL TOQUE WOW: Saludo inteligente según la hora del día
    const horaActual = new Date().getHours();
    if (horaActual < 12) setSaludo('Buenos días');
    else if (horaActual < 20) setSaludo('Buenas tardes');
    else setSaludo('Buenas noches');
  }, []);

  // 3. MATEMÁTICAS EN TIEMPO REAL: Calculamos los resúmenes automáticamente
  const cantidadProyectos = proyectos.length;
  
  const gastosEuros = gastos
    .filter(g => g.tipoGasto !== 'kilometraje')
    .reduce((total, g) => total + parseFloat(g.cantidad || 0), 0);
    
  const totalKm = gastos
    .filter(g => g.tipoGasto === 'kilometraje')
    .reduce((total, g) => total + parseFloat(g.cantidad || 0), 0);

  // 4. EL TOQUE WOW 2: Agrupamos las horas por fecha para la gráfica real
  // Si no hay horas, ponemos un dato ficticio a cero para que la gráfica no desaparezca
  let datosGraficaReal = [];
  if (horas.length === 0) {
    datosGraficaReal = [{ dia: 'Sin datos', horas: 0 }];
  } else {
    // Agrupamos las horas trabajadas por día
    const horasPorDia = horas.reduce((acc, h) => {
      acc[h.fecha] = (acc[h.fecha] || 0) + parseFloat(h.horasTotales);
      return acc;
    }, {});
    
    // Lo convertimos al formato que necesita Recharts
    datosGraficaReal = Object.keys(horasPorDia).map(fecha => ({
      dia: fecha.substring(5), // Quitamos el año para que se vea "09-23" en vez de "2026-09-23"
      horas: horasPorDia[fecha]
    })).sort((a, b) => a.dia.localeCompare(b.dia)); // Ordenamos por fecha
  }

  return (
    <main style={styles.mainContent}>
      
      {/* CABECERA CON USUARIO REAL Y AVATAR */}
      <header style={styles.header}>
        <div>
          <h1 style={styles.welcomeText}>Panel de Control</h1>
          <p style={styles.dateText}>{saludo}, {usuario}. Aquí tienes tu resumen real.</p>
        </div>
        
        {/* AVATAR + NOMBRE ARRIBA A LA DERECHA */}
        <div style={styles.userSection}>
          <span style={styles.userName}>{usuario}</span>
          <div style={styles.avatar}>
            {usuario.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="fade-in">
        {/* TARJETAS DE RESUMEN (Ahora 100% dinámicas) */}
        <div style={styles.summaryGrid}>
          <div className="summary-card" style={{...styles.card, borderBottom: '4px solid #ef4444'}}>
            <p style={styles.cardLabel}>Gastos Acumulados</p>
            <h3 style={styles.cardValue}>{gastosEuros.toFixed(2)} €</h3>
            <p style={styles.cardTrend}>Dietas y material registrados</p>
          </div>
          
          <div className="summary-card" style={{...styles.card, borderBottom: '4px solid #3b82f6'}}>
            <p style={styles.cardLabel}>Proyectos Activos</p>
            <h3 style={styles.cardValue}>{cantidadProyectos}</h3>
            {/* Pequeña barra de progreso visual para darle un toque premium */}
            <div style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginTop: '8px' }}>
               <div style={{ width: cantidadProyectos > 0 ? '100%' : '0%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
            </div>
          </div>
          
          <div className="summary-card" style={{...styles.card, borderBottom: '4px solid #f59e0b'}}>
            <p style={styles.cardLabel}>Kilómetros Registrados</p>
            <h3 style={styles.cardValue}>{totalKm.toFixed(0)} Km</h3>
            <p style={styles.cardTrend}>En tus últimos viajes</p>
          </div>
          
          <div className="summary-card" style={{...styles.card, borderBottom: '4px solid #10b981'}}>
            <p style={styles.cardLabel}>Total de Entradas</p>
            <h3 style={styles.cardValue}>{horas.length}</h3>
            <p style={styles.cardTrend}>Jornadas fichadas hasta hoy</p>
          </div>
        </div>

        <div style={styles.bottomGrid}>
          
          {/* GRÁFICA REAL CON TUS DATOS DE HORAS */}
          <div className="summary-card" style={styles.chartCard}>
            <h3 style={styles.sectionTitle}>Curva de Horas Fichadas</h3>
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={datosGraficaReal} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHoras" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="dia" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="horas" stroke="#2563eb" fillOpacity={1} fill="url(#colorHoras)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="summary-card" style={styles.notesCard}>
            <h3 style={styles.sectionTitle}>Notas de Obra Rápidas</h3>
            <textarea 
              style={styles.notepad} 
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Escribe aquí mediciones urgentes o recordatorios..."
            ></textarea>
          </div>
          
        </div>
      </div>
    </main>
  );
};

// Estilos de la interfaz
const styles = {
  mainContent: { flex: 1, padding: '40px 50px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  welcomeText: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' },
  dateText: { fontSize: '16px', color: '#64748b', margin: '8px 0 0 0' },
  
  // Novedad: Contenedor para alinear Nombre y Avatar
  userSection: { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#ffffff', padding: '8px 16px', borderRadius: '50px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  userName: { fontSize: '15px', fontWeight: '700', color: '#1e293b' },
  avatar: { width: '40px', height: '40px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', fontWeight: 'bold' },
  
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '30px' },
  card: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  cardLabel: { color: '#64748b', fontSize: '14px', fontWeight: '600', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.5px' },
  cardValue: { color: '#0f172a', fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0' },
  cardTrend: { color: '#94a3b8', fontSize: '13px', margin: 0 },
  bottomGrid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' },
  chartCard: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' },
  sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '24px', marginTop: 0 },
  notesCard: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' },
  notepad: { flex: 1, padding: '16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', color: '#1e293b', resize: 'none', outline: 'none', lineHeight: '1.5', minHeight: '200px' }
};

export default Dashboard;