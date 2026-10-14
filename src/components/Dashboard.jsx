import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const context = useOutletContext();
  const proyectos = context?.proyectos || [];
  const horas = context?.horas || [];
  const gastos = context?.gastos || [];

  const [nota, setNota] = useState('');
  const [usuario, setUsuario] = useState('Compañero');
  const [saludo, setSaludo] = useState('Bienvenido');
  const [filtroTiempo, setFiltroTiempo] = useState('total'); 
  
  const TARIFA_KM = 0.26;

  useEffect(() => {
    const datosGuardados = localStorage.getItem('estudioIdeoUsuario');
    if (datosGuardados) {
      const datosObj = JSON.parse(datosGuardados);
      setUsuario(datosObj.nombre);
    }

    const horaActual = new Date().getHours();
    if (horaActual < 12) setSaludo('Buenos días');
    else if (horaActual < 20) setSaludo('Buenas tardes');
    else setSaludo('Buenas noches');
  }, []);

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

  const gastosFiltrados = filtrarPorFecha(gastos);
  const horasFiltradas = filtrarPorFecha(horas);
  const cantidadProyectos = proyectos.length; 

  const gastosNormales = gastosFiltrados
    .filter(g => g.tipoGasto !== 'kilometraje')
    .reduce((total, g) => total + parseFloat(g.cantidad || 0), 0);
    
  const totalKm = gastosFiltrados
    .filter(g => g.tipoGasto === 'kilometraje')
    .reduce((total, g) => total + parseFloat(g.cantidad || 0), 0);

  const gastosEuros = gastosNormales + (totalKm * TARIFA_KM);

  // NUEVO: Función para generar y descargar el CSV
  const exportarCSV = () => {
    // 1. Preparamos los textos del archivo
    const cabeceras = "Concepto,Valor\n";
    const filas = [
      `Gastos Acumulados,${gastosEuros.toFixed(2)} Euros`,
      `Proyectos Activos,${cantidadProyectos}`,
      `Kilometros Recorridos,${totalKm.toFixed(0)} Km`,
      `Entradas Fichadas,${horasFiltradas.length} Jornadas`
    ].join("\n");

    const contenidoCSV = cabeceras + filas;

    // 2. Creamos el archivo virtual (Blob)
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 3. Forzamos la descarga en el navegador/Electron
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.setAttribute('download', `Resumen_Ideo_${filtroTiempo}.csv`);
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  };

  const handleReset = () => {
    const confirmar = window.confirm("⚠️ ATENCIÓN: ¿Estás seguro de que quieres borrar a cero todos los datos del Dashboard?");
    if (confirmar) {
      alert("Comando de reseteo activado.");
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
          <p style={styles.dateText}>{saludo}, {usuario}. Aquí tienes tu resumen real.</p>
        </div>
        
        <div style={styles.userSectionGroup}>
          
          {/* NUEVO BOTÓN PARA EXPORTAR */}
          <button style={styles.exportButton} onClick={exportarCSV}>
            ↓ Exportar Excel
          </button>

          <button style={styles.resetButton} onClick={handleReset}>
            ↺ Resetear Panel
          </button>
          
          <div style={styles.userSection}>
            <span style={styles.userName}>{usuario}</span>
            <div style={styles.avatar}>
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
            <p style={styles.cardLabel}>Gastos Acumulados</p>
            <h3 style={styles.cardValue}>{gastosEuros.toFixed(2)} €</h3>
            <p style={styles.cardTrend}>Incluye {totalKm.toFixed(0)} km a {TARIFA_KM}€/km</p>
          </div>
          
          <div className="summary-card" style={{...styles.card, borderBottom: '4px solid #3b82f6'}}>
            <p style={styles.cardLabel}>Proyectos Activos</p>
            <h3 style={styles.cardValue}>{cantidadProyectos}</h3>
            <div style={{ width: '100%', height: '4px', backgroundColor: '#e2e8f0', borderRadius: '2px', marginTop: '8px' }}>
               <div style={{ width: cantidadProyectos > 0 ? '100%' : '0%', height: '100%', backgroundColor: '#3b82f6', borderRadius: '2px' }}></div>
            </div>
          </div>
          
          <div className="summary-card" style={{...styles.card, borderBottom: '4px solid #f59e0b'}}>
            <p style={styles.cardLabel}>Kilómetros Recorridos</p>
            <h3 style={styles.cardValue}>{totalKm.toFixed(0)} Km</h3>
            <p style={styles.cardTrend}>En el periodo seleccionado</p>
          </div>
          
          <div className="summary-card" style={{...styles.card, borderBottom: '4px solid #10b981'}}>
            <p style={styles.cardLabel}>Total de Entradas</p>
            <h3 style={styles.cardValue}>{horasFiltradas.length}</h3>
            <p style={styles.cardTrend}>Jornadas fichadas</p>
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

const styles = {
  mainContent: { flex: 1, padding: '40px 50px', overflowY: 'auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  welcomeText: { fontSize: '32px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.5px' },
  dateText: { fontSize: '16px', color: '#64748b', margin: '8px 0 0 0' },
  
  userSectionGroup: { display: 'flex', alignItems: 'center', gap: '15px' },
  userSection: { display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#ffffff', padding: '8px 16px', borderRadius: '50px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  userName: { fontSize: '15px', fontWeight: '700', color: '#1e293b' },
  avatar: { width: '40px', height: '40px', backgroundColor: '#2563eb', color: '#ffffff', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '18px', fontWeight: 'bold' },
  
  // NUEVO ESTILO: Botón verde para exportar
  exportButton: { backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '5px' },
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
  notesCard: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', flexDirection: 'column' },
  notepad: { flex: 1, padding: '16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '15px', color: '#1e293b', resize: 'none', outline: 'none', lineHeight: '1.5', minHeight: '200px' }
};

export default Dashboard;