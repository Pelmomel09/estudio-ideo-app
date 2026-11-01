import React, { useState } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const ProyectoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [nuevoColaborador, setNuevoColaborador] = useState('');
  // NUEVO ESTADO: Controla si vemos los datos de todo el equipo ('colectivo') o solo los nuestros ('individual')
  const [vistaModo, setVistaModo] = useState('colectivo');

  const context = useOutletContext() || {};
  const proyectos = context.proyectos || [];
  const setProyectos = context.setProyectos || (() => {});
  const horas = context.horas || [];
  const setHoras = context.setHoras || (() => {});
  const gastos = context.gastos || [];
  const setGastos = context.setGastos || (() => {});
  const ajustes = context.ajustes || {}; 
  const mostrarToast = context.mostrarToast || (() => {});
  const nombreUsuarioActual = context.nombreUsuarioActual || 'Yo';
  
  const tarifaKm = parseFloat(ajustes.precioKm) || 0.29; 
  const impuesto = parseFloat(ajustes.impuesto) || 21;
  const moneda = ajustes.moneda || '€';
  const colorAcento = ajustes.colorAcento || '#3b82f6';
  const vistaCompacta = ajustes.vistaCompacta;
  const redondearHoras = ajustes.redondearHoras;
  
  const proyectoActual = proyectos.find(p => String(p.id) === String(id));

  // 1. TODOS LOS MOVIMIENTOS DEL PROYECTO (COLECTIVOS)
  const todasHorasProyecto = horas.filter(h => String(h.proyectoId) === String(id));
  const todosGastosProyecto = gastos.filter(g => String(g.proyectoId) === String(id));

  // 2. FILTRADO SEGÚN EL PANEL SELECCIONADO (COLECTIVO vs INDIVIDUAL)
  const horasProyecto = vistaModo === 'individual'
    ? todasHorasProyecto.filter(h => h._esMio || (h.creadoPor || '').toLowerCase() === nombreUsuarioActual.toLowerCase())
    : todasHorasProyecto;

  const gastosProyecto = vistaModo === 'individual'
    ? todosGastosProyecto.filter(g => g._esMio || (g.creadoPor || '').toLowerCase() === nombreUsuarioActual.toLowerCase())
    : todosGastosProyecto;

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

  // 3. RESUMEN POR MIEMBRO DEL EQUIPO (Para ver cuánto ha aportado cada persona)
  const resumenPorUsuario = {};
  todosGastosProyecto.forEach(g => {
    const autor = g.creadoPor || 'Compañero';
    if (!resumenPorUsuario[autor]) resumenPorUsuario[autor] = { gastos: 0, horas: 0 };
    const cant = parseFloat(g.cantidad || 0);
    resumenPorUsuario[autor].gastos += (g.tipoGasto === 'kilometraje' ? cant * tarifaKm : cant);
  });
  todasHorasProyecto.forEach(h => {
    const autor = h.creadoPor || 'Compañero';
    if (!resumenPorUsuario[autor]) resumenPorUsuario[autor] = { gastos: 0, horas: 0 };
    resumenPorUsuario[autor].horas += parseFloat(h.horasTotales || 0);
  });

  const datosGrafica = [
    { name: 'Materiales', valor: gastosProyecto.filter(g=>g.tipoGasto==='material').reduce((acc, g) => acc + parseFloat(g.cantidad || 0), 0) },
    { name: 'Dietas', valor: gastosProyecto.filter(g=>g.tipoGasto==='dieta').reduce((acc, g) => acc + parseFloat(g.cantidad || 0), 0) },
    { name: 'Peajes', valor: gastosProyecto.filter(g=>g.tipoGasto==='peaje').reduce((acc, g) => acc + parseFloat(g.cantidad || 0), 0) },
    { name: `Km (${tarifaKm}${moneda})`, valor: gastosProyecto.filter(g=>g.tipoGasto==='kilometraje').reduce((acc, g) => acc + (parseFloat(g.cantidad || 0) * tarifaKm), 0) }
  ];

  const handleImprimir = () => window.print();

  // 4. EXPORTAR A EXCEL INCLUYENDO LA PERSONA QUE AÑADIÓ CADA GASTO Y HORA
  const handleExportarExcel = () => {
    const prefijo = ajustes.prefijoProyecto || '';
    const nombreDoc = `${prefijo}${proyectoActual.nombre}`;
    const modoTexto = vistaModo === 'individual' ? `INDIVIDUAL (${nombreUsuarioActual})` : 'COLECTIVO (EQUIPO COMPLETO)';

    let contenidoCsv = `INFORME DE PROYECTO - ${(ajustes.nombreEmpresa || 'ESTUDIO IDEO').toUpperCase()}\n`;
    contenidoCsv += `Proyecto:;${nombreDoc}\n`;
    contenidoCsv += `Modo del Informe:;${modoTexto}\n`;
    contenidoCsv += `Fecha de Generación:;${formatearFecha(new Date().toISOString().split('T')[0])}\n\n`;
    
    contenidoCsv += `RESUMEN GENERAL\n`;
    contenidoCsv += `Total Horas Trabajadas:;${totalHoras} h\n`;
    contenidoCsv += `Base Imponible (Gastos Físicos):;${totalGastosFisicos.toFixed(2)} ${moneda}\n`;
    contenidoCsv += `Total con Impuestos (${impuesto}%):;${totalConImpuestos.toFixed(2)} ${moneda}\n\n`;

    // Añadimos tabla de desglose por cada usuario en el Excel
    contenidoCsv += `DESGLOSE COLECTIVO POR INTEGRANTE DEL PROYECTO\n`;
    contenidoCsv += `Usuario;Horas Aportadas;Gastos Aportados (${moneda})\n`;
    Object.entries(resumenPorUsuario).forEach(([autor, totales]) => {
      contenidoCsv += `${autor};${totales.horas.toFixed(1)} h;${totales.gastos.toFixed(2)} ${moneda}\n`;
    });
    contenidoCsv += `\n`;

    // Tabla detallada con la nueva columna "Registrado Por"
    contenidoCsv += `DESGLOSE DETALLADO DE MOVIMIENTOS\n`;
    contenidoCsv += `Fecha;Registrado Por;Tipo de Registro;Concepto;Valor Original;Coste Imputado (${moneda})\n`;

    gastosProyecto.forEach(g => {
      const cantidad = parseFloat(g.cantidad || 0);
      const costeMoneda = g.tipoGasto === 'kilometraje' ? (cantidad * tarifaKm) : cantidad;
      const unidad = g.tipoGasto === 'kilometraje' ? 'Km' : moneda;
      const tipoBonito = (g.tipoGasto || 'Gasto').charAt(0).toUpperCase() + (g.tipoGasto || 'gasto').slice(1);
      const autor = g.creadoPor || nombreUsuarioActual;
      contenidoCsv += `${formatearFecha(g.fecha)};${autor};Gasto - ${tipoBonito};${g.concepto || 'Sin concepto'};${cantidad} ${unidad};${costeMoneda.toFixed(2)} ${moneda}\n`;
    });

    horasProyecto.forEach(h => {
      let horasFila = parseFloat(h.horasTotales || 0);
      if (redondearHoras) horasFila = Math.round(horasFila);
      const autor = h.creadoPor || nombreUsuarioActual;
      contenidoCsv += `${formatearFecha(h.fecha)};${autor};Tiempo Invertido;${h.descripcion || h.tipo || 'Jornada'};${horasFila} h;0.00 ${moneda}\n`;
    });

    const blob = new Blob(["\ufeff", contenidoCsv], { type: 'text/csv;charset=utf-8;' }); 
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Informe_${nombreDoc.replace(/\s+/g, '_')}_${vistaModo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarToast("📗 ¡Informe Excel con autores descargado correctamente!");
  };

  const handleBorrarProyecto = () => {
    const confirmar = window.confirm(`¿Estás seguro de borrar "${proyectoActual.nombre}"?\nSe eliminarán todas las horas y gastos vinculados. Esto no se puede deshacer.`);
    
    if (confirmar) {
      const proyectosRestantes = proyectos.filter(p => String(p.id) !== String(id));
      const horasRestantes = horas.filter(h => String(h.proyectoId) !== String(id));
      const gastosRestantes = gastos.filter(g => String(g.proyectoId) !== String(id));

      setProyectos(proyectosRestantes);
      setHoras(horasRestantes);
      setGastos(gastosRestantes);

      mostrarToast("🗑️ Proyecto y datos asociados eliminados.");
      navigate('/panel');
    }
  };

  const handleEliminarMovimiento = (item) => {
    const esHora = Boolean(item.horasTotales);
    const nombreElemento = item.concepto || item.descripcion || item.tipoGasto || 'este registro';
    
    const confirmar = window.confirm(`¿Seguro que quieres eliminar "${nombreElemento}" añadido por ${item.creadoPor || 'ti'}?`);
    if (!confirmar) return;

    if (esHora) {
      const nuevasHoras = horas.filter(h => String(h.id) !== String(item.id));
      setHoras(nuevasHoras);
      mostrarToast("🗑️ Registro de horas eliminado.");
    } else {
      const nuevosGastos = gastos.filter(g => String(g.id) !== String(item.id));
      setGastos(nuevosGastos);
      mostrarToast("🗑️ Gasto eliminado correctamente.");
    }
  };

  const handleAgregarColaborador = (e) => {
    e.preventDefault();
    const nombreLimpio = nuevoColaborador.trim();
    if (!nombreLimpio) return;

    const listaActual = proyectoActual.colaboradores || [];
    if (listaActual.some(u => u.toLowerCase() === nombreLimpio.toLowerCase())) {
      alert("Este usuario ya forma parte del proyecto.");
      return;
    }

    const proyectosActualizados = proyectos.map(p => {
      if (String(p.id) === String(id)) {
        return { ...p, colaboradores: [...listaActual, nombreLimpio] };
      }
      return p;
    });

    setProyectos(proyectosActualizados);
    setNuevoColaborador('');
    mostrarToast(`👥 ¡Usuario "${nombreLimpio}" añadido al proyecto!`);
  };

  const handleQuitarColaborador = (usuarioBorrar) => {
    const confirmar = window.confirm(`¿Quitar a "${usuarioBorrar}" de este proyecto?`);
    if (!confirmar) return;

    const proyectosActualizados = proyectos.map(p => {
      if (String(p.id) === String(id)) {
        const nuevaLista = (p.colaboradores || []).filter(u => u !== usuarioBorrar);
        return { ...p, colaboradores: nuevaLista };
      }
      return p;
    });

    setProyectos(proyectosActualizados);
    mostrarToast(`👤 Usuario "${usuarioBorrar}" eliminado del proyecto.`);
  };

  if (!proyectoActual) return <main style={{ padding: '40px' }}><h2>Proyecto no encontrado</h2></main>;

  const colaboradoresProyecto = proyectoActual.colaboradores || [];

  return (
    <main style={{ flex: 1, padding: '40px 50px', overflowY: 'auto', backgroundColor: '#f8fafc', position: 'relative' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: 0 }}>
            {(ajustes.prefijoProyecto || '') + proyectoActual.nombre}
          </h1>
          <p style={{ color: '#64748b', margin: '6px 0 0 0' }}>
            Creado por <strong>{proyectoActual.creadorNombre || nombreUsuarioActual}</strong> · Informe financiero y colaborativo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportarExcel} style={{ ...styles.actionBtn, backgroundColor: '#10b981' }}>
            📗 Exportar Excel ({vistaModo === 'colectivo' ? 'Colectivo' : 'Individual'})
          </button>
          <button onClick={handleImprimir} style={{ ...styles.actionBtn, backgroundColor: '#0f172a' }}>
            🖨️ Imprimir
          </button>
          <button onClick={handleBorrarProyecto} style={{ ...styles.actionBtn, backgroundColor: '#ef4444', marginLeft: '10px' }}>
            🗑️ Eliminar
          </button>
        </div>
      </header>

      {/* BARRA DE EQUIPO Y COLABORADORES */}
      <div style={styles.colaboradoresCard}>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#0f172a', fontSize: '15px' }}>
            👥 Equipo del Proyecto
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ ...styles.badgeUsuario, backgroundColor: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}>
              👑 {proyectoActual.creadorNombre || nombreUsuarioActual} (Propietario)
            </span>
            {colaboradoresProyecto.map((user, idx) => (
              <span key={idx} style={styles.badgeUsuario}>
                👤 {user}
                <button onClick={() => handleQuitarColaborador(user)} style={styles.btnQuitarUsuario} title="Quitar">×</button>
              </span>
            ))}
          </div>
        </div>

        <form onSubmit={handleAgregarColaborador} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Añadir usuario (ej. juan)..."
            value={nuevoColaborador}
            onChange={(e) => setNuevoColaborador(e.target.value)}
            style={styles.inputColaborador}
          />
          <button type="submit" style={{ ...styles.actionBtn, backgroundColor: colorAcento, padding: '10px 16px' }}>
            + Invitar
          </button>
        </form>
      </div>

      {/* NUEVO SELECTOR: PANEL COLECTIVO VS PANEL INDIVIDUAL */}
      <div style={styles.selectorVistaContainer}>
        <button
          onClick={() => setVistaModo('colectivo')}
          style={vistaModo === 'colectivo' ? { ...styles.tabBtn, ...styles.tabBtnActivo, backgroundColor: colorAcento } : styles.tabBtn}
        >
          👥 Panel Colectivo (Todo el Equipo)
        </button>
        <button
          onClick={() => setVistaModo('individual')}
          style={vistaModo === 'individual' ? { ...styles.tabBtn, ...styles.tabBtnActivo, backgroundColor: colorAcento } : styles.tabBtn}
        >
          👤 Mi Panel Individual ({nombreUsuarioActual})
        </button>
      </div>

      {/* DESGLOSE RÁPIDO DE APORTACIONES POR INTEGRANTE (Visible en modo Colectivo) */}
      {vistaModo === 'colectivo' && Object.keys(resumenPorUsuario).length > 0 && (
        <div style={styles.equipoGrid}>
          {Object.entries(resumenPorUsuario).map(([autor, datos], idx) => (
            <div key={idx} style={styles.autorMiniCard}>
              <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>👤 {autor}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '13px', color: '#475569' }}>
                <span>⏱️ {datos.horas.toFixed(1)} h</span>
                <span style={{ fontWeight: '700', color: '#0f172a' }}>💶 {datos.gastos.toFixed(2)} {moneda}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUPER KPIs */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={styles.card}>
          <p style={styles.cardTitle}>Tiempo Invertido ({vistaModo})</p>
          <h2 style={{...styles.cardValue, color: colorAcento}}>{totalHoras} h</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>{horasProyecto.length} jornadas registradas</p>
        </div>
        <div style={styles.card}>
          <p style={styles.cardTitle}>Gastos Físicos ({vistaModo})</p>
          <h2 style={{...styles.cardValue, color: '#f59e0b'}}>{totalGastosFisicos.toFixed(2)} {moneda}</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>{gastosProyecto.length} tickets y viajes</p>
        </div>
        <div style={{...styles.card, border: `2px solid ${colorAcento}`}}>
          <p style={styles.cardTitle}>Total con Impuestos ({vistaModo})</p>
          <h2 style={{...styles.cardValue, color: colorAcento}}>{totalConImpuestos.toFixed(2)} {moneda}</h2>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Incluye el {impuesto}% de impuestos</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px' }}>
        
        {/* GRÁFICA DE GASTOS */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ marginTop: 0, color: '#334155' }}>
            Gastos Físicos - {vistaModo === 'colectivo' ? 'Equipo' : nombreUsuarioActual} ({moneda})
          </h3>
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

        {/* TABLA DE MOVIMIENTOS CON COLUMNA DE AUTOR Y PAPELERA */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', maxHeight: '380px', overflowY: 'auto' }}>
          <h3 style={{ marginTop: 0, color: '#334155' }}>
            Registro de Movimientos ({vistaModo === 'colectivo' ? 'Colectivo' : 'Individual'})
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '10px 0' }}>Fecha</th>
                <th>Usuario</th>
                <th>Concepto / Tipo</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th style={{ textAlign: 'center', width: '45px' }}>Borrar</th>
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

                const paddingTabla = vistaCompacta ? '6px 0' : '12px 0';
                const nombreAutor = item.creadoPor || nombreUsuarioActual;

                return (
                  <tr key={item.id || index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: paddingTabla, color: '#475569' }}>{formatearFecha(item.fecha)}</td>
                    <td>
                      <span style={styles.autorTag}>👤 {nombreAutor}</span>
                    </td>
                    <td style={{ color: '#1e293b', fontWeight: '500' }}>{item.concepto || `Tiempo (${item.tipo || item.descripcion})`}</td>
                    <td style={{ textAlign: 'right', fontWeight: '800', color: item.horasTotales ? '#475569' : colorAcento }}>
                      {textoValor}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => handleEliminarMovimiento(item)}
                        style={styles.btnBorrarFila}
                        title="Eliminar este registro"
                      >
                        🗑️
                      </button>
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
  cardTitle: { margin: 0, color: '#64748b', fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  cardValue: { margin: '10px 0 0 0', fontSize: '30px', fontWeight: '900', letterSpacing: '-1px' },
  actionBtn: { color: 'white', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' },
  
  colaboradoresCard: { backgroundColor: '#ffffff', padding: '18px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' },
  inputColaborador: { padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', outline: 'none', minWidth: '210px' },
  badgeUsuario: { backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px' },
  btnQuitarUsuario: { background: 'none', border: 'none', color: '#ef4444', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', padding: '0 2px', lineHeight: 1 },
  
  selectorVistaContainer: { display: 'flex', gap: '12px', marginBottom: '20px' },
  tabBtn: { padding: '10px 20px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#475569', fontSize: '14px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' },
  tabBtnActivo: { color: '#ffffff', border: 'none', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)' },
  
  equipoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' },
  autorMiniCard: { backgroundColor: '#ffffff', padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' },
  autorTag: { backgroundColor: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
  btnBorrarFila: { backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', fontSize: '13px' }
};

export default ProyectoDetalle;