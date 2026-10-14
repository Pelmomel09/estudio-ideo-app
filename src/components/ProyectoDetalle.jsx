import React from 'react';
// 1. IMPORTAMOS useNavigate
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ProyectoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate(); // Herramienta para cambiar de pantalla
  
  // 2. EXTRAEMOS LAS FUNCIONES PARA MODIFICAR DATOS (setProyectos, setHoras, setGastos)
  const context = useOutletContext() || {};
  const proyectos = context.proyectos || [];
  const setProyectos = context.setProyectos || (() => {});
  const horas = context.horas || [];
  const setHoras = context.setHoras || (() => {});
  const gastos = context.gastos || [];
  const setGastos = context.setGastos || (() => {});
  const ajustes = context.ajustes || {}; 
  const mostrarToast = context.mostrarToast || (() => {});
  
  const tarifaKm = parseFloat(ajustes.precioKm) || 0.29; 
  const impuesto = parseFloat(ajustes.impuesto) || 21;
  const moneda = ajustes.moneda || '€';
  const colorAcento = ajustes.colorAcento || '#3b82f6';
  const vistaCompacta = ajustes.vistaCompacta;
  const redondearHoras = ajustes.redondearHoras;
  
  const proyectoActual = proyectos.find(p => String(p.id) === String(id));

  const horasProyecto = horas.filter(h => String(h.proyectoId) === String(id));
  const gastosProyecto = gastos.filter(g => String(g.proyectoId) === String(id));

  const formatearFecha = (fechaISO) => {
    if (!fechaISO) return '';
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return fechaISO;
    return ajustes.formatoFecha === 'MM/DD/AAAA' ? `${partes[1]}/${partes[2]}/${partes[0]}` : `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  let totalHoras = horasProyecto.reduce((sum, h) => sum + (parseFloat(h.horasTotales) || 0), 0);
  if (redondearHoras) totalHoras = Math.round(totalHoras);

  const totalGastosFisicos = gastosProyecto.reduce((sum, g) => {
    const cantidad = parseFloat(g.cantidad || 0);
    return sum + (g.tipoGasto === 'kilometraje' ? (cantidad * tarifaKm) : cantidad);
  }, 0);

  const totalConImpuestos = totalGastosFisicos * (1 + (impuesto / 100));

  const datosGrafica = [
    { name: 'Materiales', valor: gastosProyecto.filter(g=>g.tipoGasto==='material').reduce((acc, g) => acc + parseFloat(g.cantidad || 0), 0) },
    { name: 'Dietas', valor: gastosProyecto.filter(g=>g.tipoGasto==='dieta').reduce((acc, g) => acc + parseFloat(g.cantidad || 0), 0) },
    { name: 'Peajes', valor: gastosProyecto.filter(g=>g.tipoGasto==='peaje').reduce((acc, g) => acc + parseFloat(g.cantidad || 0), 0) },
    { name: `Km (${tarifaKm}${moneda})`, valor: gastosProyecto.filter(g=>g.tipoGasto==='kilometraje').reduce((acc, g) => acc + (parseFloat(g.cantidad || 0) * tarifaKm), 0) }
  ];

  const handleImprimir = () => window.print();

  const handleExportarExcel = () => {
    const prefijo = ajustes.prefijoProyecto || '';
    const nombreDoc = `${prefijo}${proyectoActual.nombre}`;

    let contenidoCsv = `INFORME DE PROYECTO - ${ajustes.nombreEmpresa.toUpperCase()}\n`;
    contenidoCsv += `Proyecto:;${nombreDoc}\n`;
    contenidoCsv += `Fecha de Generación:;${formatearFecha(new Date().toISOString().split('T')[0])}\n\n`;
    
    contenidoCsv += `RESUMEN DE TIEMPO INVERTIDO\n`;
    contenidoCsv += `Total Horas Trabajadas:;${totalHoras} h\n\n`;

    contenidoCsv += `RESUMEN FINANCIERO (GASTOS)\n`;
    contenidoCsv += `Base Imponible (Gastos Físicos):;${totalGastosFisicos.toFixed(2)} ${moneda}\n`;
    contenidoCsv += `Total con Impuestos (${impuesto}%):;${totalConImpuestos.toFixed(2)} ${moneda}\n\n`;

    contenidoCsv += `DESGLOSE DE MOVIMIENTOS\n`;
    contenidoCsv += `Fecha;Tipo de Registro;Concepto;Valor Original;Coste Imputado (${moneda})\n`;

    gastosProyecto.forEach(g => {
      const cantidad = parseFloat(g.cantidad || 0);
      const costeMoneda = g.tipoGasto === 'kilometraje' ? (cantidad * tarifaKm) : cantidad;
      const unidad = g.tipoGasto === 'kilometraje' ? 'Km' : moneda;
      const tipoBonito = g.tipoGasto.charAt(0).toUpperCase() + g.tipoGasto.slice(1);
      contenidoCsv += `${formatearFecha(g.fecha)};Gasto - ${tipoBonito};${g.concepto || 'Sin concepto'};${cantidad} ${unidad};${costeMoneda.toFixed(2)} ${moneda}\n`;
    });

    horasProyecto.forEach(h => {
      let horasFila = parseFloat(h.horasTotales);
      if (redondearHoras) horasFila = Math.round(horasFila);
      contenidoCsv += `${formatearFecha(h.fecha)};Tiempo Invertido;${h.descripcion || h.tipo};${horasFila} h;0.00 ${moneda}\n`;
    });

    const blob = new Blob(["\ufeff", contenidoCsv], { type: 'text/csv;charset=utf-8;' }); 
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Informe_${nombreDoc.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarToast("📗 ¡Informe Excel descargado correctamente!");
  };

  // 3. NUEVA FUNCIÓN PARA BORRAR EL PROYECTO
  const handleBorrarProyecto = () => {
    const confirmar = window.confirm(`¿Estás seguro de borrar "${proyectoActual.nombre}"?\nSe eliminarán todas las horas y gastos vinculados. Esto no se puede deshacer.`);
    
    if (confirmar) {
      // Filtramos las listas globales quedándonos con todos MENOS el que estamos borrando
      const proyectosRestantes = proyectos.filter(p => String(p.id) !== String(id));
      const horasRestantes = horas.filter(h => String(h.proyectoId) !== String(id));
      const gastosRestantes = gastos.filter(g => String(g.proyectoId) !== String(id));

      // Guardamos las nuevas listas limpias
      setProyectos(proyectosRestantes);
      setHoras(horasRestantes);
      setGastos(gastosRestantes);

      mostrarToast("🗑️ Proyecto y datos asociados eliminados.");
      
      // Te devolvemos al Dashboard principal
      navigate('/panel');
    }
  };

  if (!proyectoActual) return <main style={{ padding: '40px' }}><h2>Proyecto no encontrado</h2></main>;

  return (
    <main style={{ flex: 1, padding: '40px 50px', overflowY: 'auto', backgroundColor: '#f8fafc', position: 'relative' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
            {(ajustes.prefijoProyecto || '') + proyectoActual.nombre}
          </h1>
          <p style={{ color: '#64748b' }}>Informe financiero y rendimiento del proyecto.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportarExcel} style={{ ...styles.actionBtn, backgroundColor: '#10b981' }}>
            📗 Exportar Datos
          </button>
          <button onClick={handleImprimir} style={{ ...styles.actionBtn, backgroundColor: '#0f172a' }}>
            🖨️ Imprimir
          </button>
          
          {/* 4. AÑADIMOS EL BOTÓN ROJO DE BORRAR */}
          <button onClick={handleBorrarProyecto} style={{ ...styles.actionBtn, backgroundColor: '#ef4444', marginLeft: '10px' }}>
            🗑️ Eliminar
          </button>
        </div>
      </header>

      {/* SUPER KPIs - SEPARACIÓN DE TIEMPO Y DINERO */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        <div style={styles.card}>
          <p style={styles.cardTitle}>Tiempo Invertido</p>
          <h2 style={{...styles.cardValue, color: colorAcento}}>{totalHoras} h</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Horas de trabajo totales</p>
        </div>
        <div style={styles.card}>
          <p style={styles.cardTitle}>Gastos Físicos (Base)</p>
          <h2 style={{...styles.cardValue, color: '#f59e0b'}}>{totalGastosFisicos.toFixed(2)} {moneda}</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>{gastosProyecto.length} tickets y viajes</p>
        </div>
        <div style={{...styles.card, border: `2px solid ${colorAcento}`}}>
          <p style={styles.cardTitle}>Gastos con Impuestos</p>
          <h2 style={{...styles.cardValue, color: colorAcento}}>{totalConImpuestos.toFixed(2)} {moneda}</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Incluye el {impuesto}% de impuestos</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* GRÁFICA DE GASTOS EXCLUSIVAMENTE */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#334155' }}>Distribución de Gastos Físicos ({moneda})</h3>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer>
              <BarChart data={datosGrafica}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip cursor={{fill: '#f1f5f9'}} formatter={(value) => `${value.toFixed(2)} ${moneda}`} />
                <Bar dataKey="valor" fill={colorAcento} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TABLA DE MOVIMIENTOS */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', maxHeight: '380px', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, color: '#334155' }}>Registro Completo</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '10px 0' }}>Fecha</th>
                <th>Concepto / Tipo</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {[...gastosProyecto, ...horasProyecto].sort((a,b) => new Date(b.fecha) - new Date(a.fecha)).map((item, index) => {
                
                let textoValor = '';
                if (item.horasTotales) {
                  let h = parseFloat(item.horasTotales);
                  if (redondearHoras) h = Math.round(h);
                  textoValor = `⏱️ ${h} h`; 
                } else if (item.tipoGasto === 'kilometraje') {
                  const costeEnEuros = parseFloat(item.cantidad) * tarifaKm;
                  textoValor = `🚗 ${costeEnEuros.toFixed(2)} ${moneda}`;
                } else {
                  textoValor = `💶 ${parseFloat(item.cantidad).toFixed(2)} ${moneda}`;
                }

                const paddingTabla = vistaCompacta ? '6px 0' : '14px 0';

                return (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: paddingTabla, color: '#475569' }}>{formatearFecha(item.fecha)}</td>
                    <td style={{ color: '#1e293b', fontWeight: '500' }}>{item.concepto || `Tiempo Invertido (${item.tipo})`}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: item.horasTotales ? '#475569' : colorAcento }}>
                      {textoValor}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </main>
  );
};

const styles = {
  card: { flex: 1, backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cardTitle: { margin: 0, color: '#64748b', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' },
  cardValue: { margin: '10px 0 0 0', fontSize: '30px', fontWeight: '900', letterSpacing: '-1px' },
  // Ajuste en el botón para que se vea bien agrupado
  actionBtn: { color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', border: 'none', transition: 'transform 0.1s', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }
};

export default ProyectoDetalle;