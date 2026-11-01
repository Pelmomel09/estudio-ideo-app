import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

const Gastos = () => {
  // Extraemos el contexto de Panel.jsx en la app de escritorio
  const context = useOutletContext() || {};
  const proyectos = context.proyectos || [];
  const gastos = context.gastos || [];
  const setGastos = context.setGastos || (() => {});
  const mostrarToast = context.mostrarToast || (() => {});
  const nombreUsuarioActual = context.nombreUsuarioActual || 'Yo';

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

    const cantidadFormateada = String(formData.cantidad).replace(',', '.');
    const cantidadNumerica = parseFloat(cantidadFormateada);

    if (isNaN(cantidadNumerica) || cantidadNumerica <= 0) {
      mostrarToast('⚠️ Introduce un importe válido.');
      return;
    }

    // Buscamos a quién pertenece el proyecto (para sincronización cooperativa en Panel.jsx)
    const proyectoElegido = proyectos.find(p => String(p.id) === String(formData.proyectoId));
    const uidDestino = proyectoElegido?._uidPropietario || null;

    const nuevoGasto = {
      ...formData,
      id: Date.now(),
      cantidad: cantidadNumerica,
      fechaRegistro: new Date().toISOString(),
      creadoPor: nombreUsuarioActual,
      _uidOrigen: uidDestino // Permite a Panel.jsx saber a qué documento de Firebase enviarlo
    };

    setGastos(prev => [...prev, nuevoGasto]);
    mostrarToast('✅ ¡Gasto registrado correctamente!');

    setFormData((prev) => ({
      ...prev,
      concepto: '',
      cantidad: ''
    }));
  };

  // Filtramos y ordenamos los últimos 5 gastos globales para previsualización
  const ultimosGastos = [...gastos].sort((a, b) => b.id - a.id).slice(0, 5);

  return (
    <main style={{ flex: 1, padding: '40px 50px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      
      <header style={{ marginBottom: '35px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
          <span style={{ color: '#10b981' }}>💶</span> Registro de Gastos
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginTop: '8px' }}>
          Añade nuevos movimientos a tus proyectos o a proyectos compartidos.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
        
        {/* FORMULARIO */}
        <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={styles.label}>Proyecto asociado</label>
                <select name="proyectoId" value={formData.proyectoId} onChange={handleChange} style={styles.input} required>
                  <option value="">-- Selecciona --</option>
                  {/* ELIMINADA LA OPCIÓN FIJA DE OFICINA */}
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.esCompartido ? `👥 ${p.nombre} (Compartido)` : `📁 ${p.nombre || 'Proyecto'}`}
                    </option>
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
                  style={{ ...styles.input, borderColor: '#10b981', backgroundColor: '#ecfdf5', fontSize: '18px', fontWeight: 'bold' }}
                  placeholder="Ej: 45.50"
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

            <button type="submit" style={{ ...styles.button, backgroundColor: '#10b981', marginTop: '10px' }}>
              + Registrar Gasto
            </button>
          </form>
        </div>

        {/* HISTORIAL LATERAL EN LA APP DE ESCRITORIO */}
        <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '18px' }}>Últimos registros</h3>
          
          {ultimosGastos.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', marginTop: '30px' }}>No hay gastos recientes.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {ultimosGastos.map((g) => (
                <div
                  key={g.id}
                  style={{
                    padding: '15px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: '700', color: '#334155', fontSize: '14px' }}>{g.concepto}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                      <span style={{ textTransform: 'capitalize' }}>{g.tipoGasto}</span> · 👤 {g.creadoPor || nombreUsuarioActual}
                    </p>
                  </div>
                  <span style={{ fontWeight: '800', fontSize: '16px', color: g.tipoGasto === 'kilometraje' ? '#64748b' : '#10b981' }}>
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
  label: { display: 'block', marginBottom: '8px', fontWeight: '700', color: '#475569', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '15px', color: '#0f172a', backgroundColor: '#f8fafc', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' },
  button: { color: 'white', padding: '16px 24px', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer', fontSize: '16px', transition: 'transform 0.1s', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.4)', width: '100%' }
};

export default Gastos;