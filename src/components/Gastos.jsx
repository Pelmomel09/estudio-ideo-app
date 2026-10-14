import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const Gastos = () => {
  // ESCUDO DE SEGURIDAD 🛡️: Obtenemos el contexto de forma segura.
  // Si la información tarda en llegar, React usará listas vacías ([]) en lugar de dar error.
  const context = useOutletContext() || {};
  const proyectos = context.proyectos || [];
  const gastos = context.gastos || [];
  const setGastos = context.setGastos || (() => {});
  const mostrarToast = context.mostrarToast || (() => {});

  const [formData, setFormData] = useState({
    proyectoId: '',
    fecha: new Date().toISOString().split('T')[0],
    tipoGasto: 'material',
    concepto: '',
    cantidad: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Protección de números: Evitamos que una coma rompa los cálculos
    const cantidadFormateada = String(formData.cantidad).replace(',', '.');
    const cantidadNumerica = parseFloat(cantidadFormateada);

    const nuevoGasto = {
      ...formData,
      id: Date.now(),
      // Si por algún motivo no es un número, guardamos 0
      cantidad: isNaN(cantidadNumerica) ? 0 : cantidadNumerica
    };

    // Actualizamos usando la lista segura que hemos creado arriba
    setGastos([...gastos, nuevoGasto]);
    
    // Mostramos la notificación
    mostrarToast('✅ ¡Gasto registrado correctamente!');

    // Limpiamos los campos
    setFormData((prev) => ({
      ...prev,
      concepto: '',
      cantidad: ''
    }));
  };

  return (
    <main style={{ flex: 1, padding: '40px 50px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#1e293b', letterSpacing: '-1px', margin: 0 }}>
          <span style={{ color: '#10b981' }}>💶</span> Control de Gastos
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', marginTop: '8px' }}>Registra e imputa los costes de manera inteligente.</p>
      </header>

      <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
        
        {/* FORMULARIO PRINCIPAL */}
        <div style={{ flex: 2, backgroundColor: '#ffffff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={styles.label}>Proyecto asociado</label>
                <select name="proyectoId" value={formData.proyectoId} onChange={handleChange} style={styles.input} required>
                  <option value="">-- Selecciona --</option>
                  <option value="oficina">🏢 Gasto de Oficina</option>
                  
                  {/* .map ahora es 100% seguro porque 'proyectos' nunca será indefinido */}
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>📁 {p.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Fecha</label>
                <input type="date" name="fecha" value={formData.fecha} onChange={handleChange} style={styles.input} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={styles.label}>Categoría</label>
                <select name="tipoGasto" value={formData.tipoGasto} onChange={handleChange} style={styles.input} required>
                  <option value="material">🛒 Materiales</option>
                  <option value="dieta">🍔 Dietas</option>
                  <option value="peaje">🛣️ Peajes/Parking</option>
                  <option value="kilometraje">🚗 Kilometraje</option>
                </select>
              </div>

              <div>
                <label style={{ ...styles.label, color: '#10b981' }}>
                  {formData.tipoGasto === 'kilometraje' ? 'Distancia (Km)' : 'Importe Total (€)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleChange}
                  style={{ ...styles.input, borderColor: '#10b981', backgroundColor: '#ecfdf5' }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={styles.label}>Descripción</label>
              <input
                type="text"
                name="concepto"
                value={formData.concepto}
                onChange={handleChange}
                style={styles.input}
                placeholder="Ej: Compra de pintura..."
                required
              />
            </div>

            <button type="submit" style={{ ...styles.button, backgroundColor: '#10b981' }}>
              + Registrar Gasto
            </button>
          </form>
        </div>

        {/* HISTORIAL LATERAL */}
        <div style={{ flex: 1, backgroundColor: '#ffffff', padding: '30px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>Últimos registros</h3>
          
          {/* .length ahora es 100% seguro */}
          {gastos.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>No hay gastos recientes.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {gastos
                .slice(-5)
                .reverse()
                .map((g) => (
                  <div
                    key={g.id}
                    style={{
                      padding: '15px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <p style={{ margin: 0, fontWeight: '600', color: '#334155', fontSize: '14px' }}>{g.concepto}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{g.tipoGasto}</p>
                    </div>
                    <span style={{ fontWeight: '800', color: g.tipoGasto === 'kilometraje' ? '#64748b' : '#10b981' }}>
                      {g.cantidad} {g.tipoGasto === 'kilometraje' ? 'km' : '€'}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

const styles = {
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '700',
    color: '#475569',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  input: {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    border: '2px solid #e2e8f0',
    fontSize: '15px',
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box'
  },
  button: {
    color: 'white',
    padding: '16px 24px',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'transform 0.1s',
    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)'
  }
};

export default Gastos;