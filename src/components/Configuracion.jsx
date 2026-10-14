import React from 'react';
import { useOutletContext } from 'react-router-dom';

const Configuracion = () => {
  const { ajustes, setAjustes, mostrarToast, setTarifaKm } = useOutletContext();
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAjustes(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleGuardarConfig = (e) => {
    e.preventDefault();
    const nuevaTarifa = parseFloat(String(ajustes.precioKm).replace(',', '.'));
    
    if (isNaN(nuevaTarifa) || nuevaTarifa < 0) {
      mostrarToast("⚠️ La tarifa de kilometraje no es válida.");
      return;
    }
    setTarifaKm(nuevaTarifa); 
    mostrarToast("✅ Configuración guardada correctamente.");
  };

  const handleBackup = () => {
    const backupData = {
      proyectos: JSON.parse(localStorage.getItem('ideo_proyectos')) || [],
      horas: JSON.parse(localStorage.getItem('ideo_horas')) || [],
      gastos: JSON.parse(localStorage.getItem('ideo_gastos')) || [],
      ajustes: ajustes,
      fechaBackup: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Copia_Seguridad_${ajustes.nombreEmpresa.replace(/\s+/g,'_')}.json`;
    link.click();
    mostrarToast("💾 Copia de seguridad descargada.");
  };

  const handleReset = () => {
    const confirmar = window.confirm("¡PELIGRO! Vas a borrar TODOS los datos. ¿Estás seguro?");
    if (confirmar) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <main style={{ flex: 1, padding: '40px 50px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#1e293b', letterSpacing: '-1px', margin: 0 }}>
            <span style={{ color: '#8b5cf6' }}>⚙️</span> Ajustes del Sistema
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px', marginTop: '8px' }}>Los cambios se guardan y aplican automáticamente.</p>
        </div>
        <button onClick={handleGuardarConfig} style={{ ...styles.btnAction, backgroundColor: '#8b5cf6', width: 'auto' }}>
          💾 Guardar Todos los Ajustes
        </button>
      </header>

      <form onSubmit={handleGuardarConfig} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* FINANZAS Y GASTOS */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>💶 Finanzas y Gastos</h3>
          <div style={styles.grid2}>
            <div>
              <label style={styles.label}>Tarifa Kilometraje</label>
              <input type="number" step="0.01" name="precioKm" value={ajustes.precioKm} onChange={handleChange} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Moneda Base</label>
              <select name="moneda" value={ajustes.moneda} onChange={handleChange} style={styles.input}>
                <option value="€">Euros (€)</option>
                <option value="$">Dólares ($)</option>
                <option value="£">Libras (£)</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Impuesto Pred. (%)</label>
              <input type="number" name="impuesto" value={ajustes.impuesto} onChange={handleChange} style={styles.input} />
            </div>
            <label style={{...styles.label, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '10px'}}>
              <input type="checkbox" name="tiposGastosCustom" checked={ajustes.tiposGastosCustom} onChange={handleChange} style={{width:'20px', height:'20px'}}/>
              Añadir categorías propias
            </label>
          </div>
        </div>

        {/* EMPRESA */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🏢 Datos y Proyectos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={styles.label}>Nombre de Empresa</label>
              <input type="text" name="nombreEmpresa" value={ajustes.nombreEmpresa} onChange={handleChange} style={styles.input} />
            </div>
            <div style={styles.grid2}>
              <div>
                <label style={styles.label}>NIF / CIF</label>
                <input type="text" name="nif" value={ajustes.nif} onChange={handleChange} style={styles.input} />
              </div>
              <div>
                {/* NUEVA FUNCIÓN */}
                <label style={styles.label}>Prefijo de Proyecto</label>
                <input type="text" name="prefijoProyecto" value={ajustes.prefijoProyecto} onChange={handleChange} placeholder="Ej: IDEO-" style={styles.input} />
              </div>
            </div>
          </div>
        </div>

        {/* INTERFAZ */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🎨 Interfaz y Visualización</h3>
          <div style={styles.grid2}>
            <label style={{...styles.label, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
              <input type="checkbox" name="modoOscuro" checked={ajustes.modoOscuro} onChange={handleChange} style={{width:'20px', height:'20px'}}/>
              Modo Oscuro
            </label>
            <label style={{...styles.label, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
              <input type="checkbox" name="mostrarToasts" checked={ajustes.mostrarToasts} onChange={handleChange} style={{width:'20px', height:'20px'}}/>
              Mostrar Notificaciones
            </label>
            <label style={{...styles.label, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
              <input type="checkbox" name="vistaCompacta" checked={ajustes.vistaCompacta} onChange={handleChange} style={{width:'20px', height:'20px'}}/>
              Compactar Vista
            </label>
            {/* NUEVA FUNCIÓN */}
            <label style={{...styles.label, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
              <input type="checkbox" name="redondearHoras" checked={ajustes.redondearHoras} onChange={handleChange} style={{width:'20px', height:'20px'}}/>
              Redondear Horas (Sin dec.)
            </label>
            <div>
              <label style={styles.label}>Formato Fecha</label>
              <select name="formatoFecha" value={ajustes.formatoFecha} onChange={handleChange} style={styles.input}>
                <option value="DD/MM/AAAA">DD/MM/AAAA</option>
                <option value="MM/DD/AAAA">MM/DD/AAAA</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Formato Exportación</label>
              <select name="formatoExportacion" value={ajustes.formatoExportacion} onChange={handleChange} style={styles.input}>
                <option value="CSV">Excel (CSV)</option>
                <option value="PDF">Documento PDF</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '20px' }}>
            <label style={styles.label}>Color de Acento Corporativo</label>
            <input type="color" name="colorAcento" value={ajustes.colorAcento} onChange={handleChange} style={{width: '100px', height: '40px', border: 'none', borderRadius: '8px', cursor: 'pointer'}} />
          </div>
        </div>

        {/* SEGURIDAD */}
        <div style={{...styles.card, border: '2px solid #cbd5e1'}}>
          <h3 style={styles.cardTitle}>🔒 Seguridad y Datos</h3>
          <div style={styles.grid2}>
            <label style={{...styles.label, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
              <input type="checkbox" name="cierreInactividad" checked={ajustes.cierreInactividad} onChange={handleChange} style={{width:'20px', height:'20px'}}/>
              Auto-cierre sesión
            </label>
            <label style={{...styles.label, display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer'}}>
              <input type="checkbox" name="animaciones" checked={ajustes.animaciones} onChange={handleChange} style={{width:'20px', height:'20px'}}/>
              Activar Animaciones
            </label>
          </div>
          <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
            <button type="button" onClick={handleBackup} style={{ ...styles.btnAction, backgroundColor: '#3b82f6', flex: 1 }}>
              💾 Copia de Seguridad
            </button>
            <button type="button" onClick={handleReset} style={{ ...styles.btnAction, backgroundColor: '#ef4444', flex: 1 }}>
              🗑️ Borrar Datos
            </button>
          </div>
        </div>

      </form>
    </main>
  );
};

const styles = {
  card: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  cardTitle: { margin: '0 0 25px 0', fontSize: '20px', fontWeight: '800', color: '#1e293b', borderBottom: '2px solid #f1f5f9', paddingBottom: '15px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '700', color: '#475569', fontSize: '13px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '15px', color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
  btnAction: { color: 'white', padding: '14px', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', transition: 'transform 0.1s', width: '100%' }
};

export default Configuracion;