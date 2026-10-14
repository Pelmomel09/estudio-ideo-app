import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const FicharHoras = () => {
  // ESCUDO DE SEGURIDAD 🛡️: Protegemos la carga de datos
  const context = useOutletContext() || {};
  const proyectos = context.proyectos || [];
  const horas = context.horas || [];
  const setHoras = context.setHoras || (() => {});
  const mostrarToast = context.mostrarToast || (() => {});

  const [modoManual, setModoManual] = useState(false); 
  
  // --- ESTADOS PARA EL CRONÓMETRO ---
  const [proyectoActivo, setProyectoActivo] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [segundos, setSegundos] = useState(0);

  // --- ESTADOS PARA EL MODO MANUAL ---
  const [formData, setFormData] = useState({ 
    proyectoId: '', 
    fecha: new Date().toISOString().split('T')[0], 
    horasTrabajadas: '', 
    descripcion: '' 
  });

  // Lógica del Cronómetro
  useEffect(() => {
    let intervalo;
    if (isTracking) {
      intervalo = setInterval(() => {
        setSegundos((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [isTracking]);

  const formatoTiempo = (totalSegundos) => {
    const h = Math.floor(totalSegundos / 3600);
    const m = Math.floor((totalSegundos % 3600) / 60);
    const s = totalSegundos % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const iniciarTurno = () => {
    if (!proyectoActivo) {
      mostrarToast("⚠️ Por favor, selecciona un proyecto primero.");
      return;
    }
    setIsTracking(true);
    mostrarToast("▶️ Turno iniciado. ¡A por todas!");
  };

  const finalizarTurno = () => {
    setIsTracking(false);
    const horasCalculadas = (segundos / 3600).toFixed(2);
    
    const nuevoRegistro = {
      id: Date.now(),
      proyectoId: proyectoActivo,
      fecha: new Date().toISOString().split('T')[0],
      horasTotales: parseFloat(horasCalculadas),
      tipo: 'Cronómetro',
      descripcion: 'Turno en tiempo real'
    };
    
    setHoras([...horas, nuevoRegistro]);
    mostrarToast(`✅ Turno finalizado. Guardadas ${horasCalculadas} horas.`);
    
    // Reseteamos el cronómetro
    setSegundos(0);
    setProyectoActivo('');
  };

  // Lógica del Modo Manual
  const handleChangeManual = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardarManual = (e) => {
    e.preventDefault();
    
    // Protegemos el número por si el usuario usa coma en lugar de punto
    const horasFormateadas = String(formData.horasTrabajadas).replace(',', '.');
    const horasNumericas = parseFloat(horasFormateadas);

    if (isNaN(horasNumericas) || horasNumericas <= 0) {
      mostrarToast("⚠️ Introduce un número de horas válido.");
      return;
    }

    const nuevoRegistro = {
      id: Date.now(),
      proyectoId: formData.proyectoId,
      fecha: formData.fecha,
      horasTotales: horasNumericas,
      descripcion: formData.descripcion || 'Registro manual',
      tipo: 'Manual'
    };

    setHoras([...horas, nuevoRegistro]);
    mostrarToast("✅ Horas manuales registradas con éxito.");
    
    // Limpiamos el formulario
    setFormData(prev => ({ ...prev, horasTrabajadas: '', descripcion: '', proyectoId: '' }));
  };

  return (
    <main style={{ flex: 1, padding: '40px 50px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      
      {/* CABECERA Y PESTAÑAS (TABS) */}
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#1e293b', letterSpacing: '-1px', margin: 0 }}>
            <span style={{ color: '#3b82f6' }}>⏱️</span> Registro de Jornada
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px', marginTop: '8px' }}>Controla tu tiempo en tiempo real o añade registros pasados.</p>
        </div>
        
        {/* Interruptor elegante */}
        <div style={styles.tabsContainer}>
          <button 
            onClick={() => setModoManual(false)} 
            style={!modoManual ? styles.tabActive : styles.tabInactive}
          >
            ⏱️ Cronómetro
          </button>
          <button 
            onClick={() => setModoManual(true)} 
            style={modoManual ? styles.tabActive : styles.tabInactive}
          >
            ✍️ Manual
          </button>
        </div>
      </header>
      
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {!modoManual ? (
          /* =========================================
             VISTA CRONÓMETRO PREMIUM
             ========================================= */
          <div style={styles.cardCenter}>
            <h3 style={{ margin: '0 0 20px 0', color: '#334155' }}>¿En qué estás trabajando?</h3>
            <select 
              value={proyectoActivo} 
              onChange={(e) => setProyectoActivo(e.target.value)} 
              disabled={isTracking}
              style={{ ...styles.input, backgroundColor: isTracking ? '#f1f5f9' : '#ffffff' }}
            >
              <option value="">-- Selecciona el proyecto --</option>
              <option value="oficina">🏢 Trabajo de Oficina / General</option>
              {proyectos.map(p => <option key={p.id} value={p.id}>📁 {p.nombre}</option>)}
            </select>

            <div style={{ 
              fontSize: '85px', 
              fontWeight: '900', 
              fontFamily: 'monospace', 
              color: isTracking ? '#3b82f6' : '#0f172a', 
              margin: '30px 0',
              textShadow: isTracking ? '0px 0px 20px rgba(59, 130, 246, 0.3)' : 'none',
              transition: 'all 0.3s'
            }}>
              {formatoTiempo(segundos)}
            </div>

            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
              {!isTracking ? (
                <button onClick={iniciarTurno} style={{ ...styles.btnAction, backgroundColor: '#3b82f6', width: '100%' }}>
                  ▶ Iniciar Turno
                </button>
              ) : (
                <button onClick={finalizarTurno} style={{ ...styles.btnAction, backgroundColor: '#ef4444', width: '100%' }}>
                  ⏹ Finalizar Turno
                </button>
              )}
            </div>
          </div>
        ) : (
          /* =========================================
             VISTA MANUAL PREMIUM
             ========================================= */
          <div style={styles.cardCenter}>
            <form onSubmit={handleGuardarManual} style={{ display: 'grid', gap: '24px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={styles.label}>Proyecto</label>
                  <select name="proyectoId" value={formData.proyectoId} onChange={handleChangeManual} required style={styles.input}>
                    <option value="">-- Selecciona --</option>
                    <option value="oficina">🏢 Oficina / General</option>
                    {proyectos.map(p => <option key={p.id} value={p.id}>📁 {p.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Fecha</label>
                  <input type="date" name="fecha" value={formData.fecha} onChange={handleChangeManual} required style={styles.input} />
                </div>
              </div>

              <div>
                <label style={styles.label}>Total de Horas</label>
                <input 
                  type="number" 
                  step="0.1" 
                  name="horasTrabajadas" 
                  value={formData.horasTrabajadas} 
                  onChange={handleChangeManual} 
                  placeholder="Ej: 4.5" 
                  required 
                  style={{...styles.input, borderColor: '#3b82f6', backgroundColor: '#eff6ff', fontSize: '18px', fontWeight: 'bold'}} 
                />
              </div>

              <div>
                <label style={styles.label}>Descripción de las tareas (Opcional)</label>
                <textarea 
                  name="descripcion" 
                  value={formData.descripcion} 
                  onChange={handleChangeManual} 
                  placeholder="Ej: Replanteo, reunión, planos..." 
                  style={{...styles.input, minHeight: '100px', resize: 'none'}} 
                />
              </div>

              <button type="submit" style={{ ...styles.btnAction, backgroundColor: '#3b82f6' }}>
                💾 Guardar Registro Manual
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
};

// --- ESTILOS MEJORADOS ---
const styles = {
  // Estilos de las pestañas
  tabsContainer: { display: 'flex', gap: '8px', backgroundColor: '#e2e8f0', padding: '6px', borderRadius: '14px' },
  tabActive: { backgroundColor: '#ffffff', color: '#0f172a', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', cursor: 'default', transition: 'all 0.2s' },
  tabInactive: { backgroundColor: 'transparent', color: '#64748b', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s' },
  
  // Estilo del contenedor principal centrado
  cardCenter: { width: '100%', maxWidth: '650px', backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  
  // Estilos de formularios
  label: { display: 'block', marginBottom: '8px', fontWeight: '700', color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '15px', color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
  btnAction: { color: 'white', padding: '16px 32px', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '16px', transition: 'transform 0.1s', boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.4)' }
};

export default FicharHoras;