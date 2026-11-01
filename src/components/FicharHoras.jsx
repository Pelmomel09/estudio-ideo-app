import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";

const FicharHoras = () => {
  const context = useOutletContext() || {};
  const proyectos = context.proyectos || [];
  const horas = context.horas || [];
  const setHoras = context.setHoras || (() => {});
  const mostrarToast = context.mostrarToast || (() => {});
  const nombreUsuarioActual = context.nombreUsuarioActual || "Yo";

  const [formData, setFormData] = useState({
    proyectoId: "",
    fecha: new Date().toISOString().split("T")[0],
    horaInicio: "",
    horaFin: "",
    descripcion: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const calcularHorasDiferencia = (inicio, fin) => {
    if (!inicio || !fin) return 0;
    const [hInicio, mInicio] = inicio.split(":").map(Number);
    const [hFin, mFin] = fin.split(":").map(Number);
    
    let minutosTotales = (hFin * 60 + mFin) - (hInicio * 60 + mInicio);
    
    if (minutosTotales < 0) {
      minutosTotales += 24 * 60; 
    }
    
    return minutosTotales / 60;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const horasCalculadas = calcularHorasDiferencia(formData.horaInicio, formData.horaFin);

    if (horasCalculadas <= 0) {
      mostrarToast("⚠️ Las horas calculadas deben ser mayores a 0.");
      return;
    }

    const proyectoElegido = proyectos.find(p => String(p.id) === String(formData.proyectoId));
    const uidDestino = proyectoElegido?._uidPropietario || null;

    const nuevoRegistro = {
      id: Date.now(),
      proyectoId: formData.proyectoId,
      fecha: formData.fecha,
      horasTotales: parseFloat(horasCalculadas.toFixed(2)),
      tramoHorario: `${formData.horaInicio} - ${formData.horaFin}`,
      descripcion: formData.descripcion || "Jornada de trabajo",
      tipo: "Manual",
      fechaRegistro: new Date().toISOString(),
      creadoPor: nombreUsuarioActual,
      _uidOrigen: uidDestino 
    };

    setHoras(prev => [...prev, nuevoRegistro]);
    mostrarToast(`✅ ¡Jornada de ${horasCalculadas.toFixed(2)}h registrada correctamente!`);

    setFormData((prev) => ({
      ...prev,
      horaInicio: "",
      horaFin: "",
      descripcion: ""
    }));
  };

  const ultimasHoras = [...horas].sort((a, b) => b.id - a.id).slice(0, 5);

  return (
    <main style={styles.mainContainer}>
      
      <header style={styles.headerBox}>
        <h1 style={styles.title}>
          <span style={styles.iconBlue}>⏱️</span> Registro de Jornada
        </h1>
        <p style={styles.subtitle}>
          Registra tu tramo horario diario en tus obras o en proyectos compartidos.
        </p>
      </header>

      <div style={styles.gridContainer}>
        
        <div style={styles.formBox}>
          <form onSubmit={handleSubmit} style={styles.form}>
            
            <div style={styles.formGrid}>
              <div>
                <label style={styles.label}>Proyecto asociado</label>
                <select 
                  name="proyectoId" 
                  value={formData.proyectoId} 
                  onChange={handleChange} 
                  style={styles.input} 
                  required
                >
                  <option value="">-- Selecciona una obra --</option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.esCompartido ? `👥 ${p.nombre} (Compartido)` : `📁 ${p.nombre || "Proyecto"}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>Fecha</label>
                <input 
                  type="date" 
                  name="fecha" 
                  value={formData.fecha} 
                  onChange={handleChange} 
                  style={styles.input} 
                  required 
                />
              </div>
            </div>

            <div style={styles.timeSection}>
              <div>
                <label style={styles.labelBlue}>Hora de Entrada</label>
                <input 
                  type="time" 
                  name="horaInicio" 
                  value={formData.horaInicio} 
                  onChange={handleChange} 
                  required 
                  style={styles.inputTime} 
                />
              </div>
              <div>
                <label style={styles.labelBlue}>Hora de Salida</label>
                <input 
                  type="time" 
                  name="horaFin" 
                  value={formData.horaFin} 
                  onChange={handleChange} 
                  required 
                  style={styles.inputTime} 
                />
              </div>
            </div>

            <div>
              <label style={styles.label}>Descripción de las tareas (Opcional)</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                style={styles.textarea}
                placeholder="Ej: Replanteo, reunión con el cliente..."
              />
            </div>

            <button type="submit" style={styles.button}>
              💾 Registrar Jornada
            </button>
          </form>
        </div>

        <div style={styles.historyBox}>
          <h3 style={styles.historyTitle}>Últimos registros</h3>
          
          {ultimasHoras.length === 0 ? (
            <p style={styles.emptyText}>No hay jornadas recientes.</p>
          ) : (
            <div style={styles.historyList}>
              {ultimasHoras.map((h) => (
                <div key={h.id} style={styles.historyCard}>
                  <div style={styles.historyCardHeader}>
                    <p style={styles.historyCardTramo}>
                      {h.tramoHorario || "Jornada Manual"}
                    </p>
                    <span style={styles.historyCardHours}>
                      {h.horasTotales} h
                    </span>
                  </div>
                  <p style={styles.historyCardAuthor}>
                    👤 {h.creadoPor || nombreUsuarioActual} · 📅 {h.fecha.split("-").reverse().join("/")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

// Formato vertical para evitar que las líneas largas se corten al copiar y pegar
const styles = {
  mainContainer: { 
    flex: 1, 
    padding: "40px 50px", 
    overflowY: "auto", 
    backgroundColor: "#f8fafc" 
  },
  headerBox: { 
    marginBottom: "35px" 
  },
  title: { 
    fontSize: "32px", 
    fontWeight: "900", 
    color: "#1e293b", 
    margin: 0 
  },
  iconBlue: { 
    color: "#3b82f6" 
  },
  subtitle: { 
    color: "#64748b", 
    fontSize: "15px", 
    marginTop: "8px" 
  },
  gridContainer: { 
    display: "grid", 
    gridTemplateColumns: "1.5fr 1fr", 
    gap: "30px" 
  },
  formBox: { 
    backgroundColor: "#ffffff", 
    padding: "30px", 
    borderRadius: "24px", 
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", 
    border: "1px solid #f1f5f9" 
  },
  form: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "22px" 
  },
  formGrid: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: "20px" 
  },
  timeSection: { 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr", 
    gap: "20px", 
    padding: "20px", 
    backgroundColor: "#eff6ff", 
    borderRadius: "16px", 
    border: "1px solid #bfdbfe" 
  },
  historyBox: { 
    backgroundColor: "#ffffff", 
    padding: "30px", 
    borderRadius: "24px", 
    border: "1px solid #f1f5f9", 
    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" 
  },
  historyTitle: { 
    margin: "0 0 20px 0", 
    color: "#1e293b", 
    fontSize: "18px" 
  },
  emptyText: { 
    color: "#94a3b8", 
    fontSize: "14px", 
    textAlign: "center", 
    marginTop: "30px" 
  },
  historyList: { 
    display: "flex", 
    flexDirection: "column", 
    gap: "15px" 
  },
  historyCard: { 
    padding: "15px", 
    backgroundColor: "#f8fafc", 
    borderRadius: "12px", 
    display: "flex", 
    flexDirection: "column", 
    justifyContent: "center", 
    border: "1px solid #e2e8f0" 
  },
  historyCardHeader: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: "6px" 
  },
  historyCardTramo: { 
    margin: 0, 
    fontWeight: "700", 
    color: "#334155", 
    fontSize: "14px" 
  },
  historyCardHours: { 
    fontWeight: "900", 
    fontSize: "15px", 
    color: "#3b82f6" 
  },
  historyCardAuthor: { 
    margin: 0, 
    fontSize: "12px", 
    color: "#64748b" 
  },
  label: { 
    display: "block", 
    marginBottom: "8px", 
    fontWeight: "700", 
    color: "#475569", 
    fontSize: "13px", 
    textTransform: "uppercase", 
    letterSpacing: "0.5px" 
  },
  labelBlue: { 
    display: "block", 
    marginBottom: "8px", 
    fontWeight: "700", 
    color: "#1d4ed8", 
    fontSize: "13px", 
    textTransform: "uppercase", 
    letterSpacing: "0.5px" 
  },
  input: { 
    width: "100%", 
    padding: "14px", 
    borderRadius: "12px", 
    border: "2px solid #e2e8f0", 
    fontSize: "15px", 
    color: "#0f172a", 
    backgroundColor: "#f8fafc", 
    outline: "none", 
    transition: "border-color 0.2s", 
    boxSizing: "border-box" 
  },
  inputTime: { 
    width: "100%", 
    padding: "14px", 
    borderRadius: "12px", 
    border: "2px solid #3b82f6", 
    fontSize: "16px", 
    color: "#0f172a", 
    backgroundColor: "#f8fafc", 
    outline: "none", 
    boxSizing: "border-box", 
    fontWeight: "bold" 
  },
  textarea: { 
    width: "100%", 
    padding: "14px", 
    borderRadius: "12px", 
    border: "2px solid #e2e8f0", 
    fontSize: "15px", 
    color: "#0f172a", 
    backgroundColor: "#f8fafc", 
    outline: "none", 
    transition: "border-color 0.2s", 
    boxSizing: "border-box", 
    minHeight: "80px", 
    resize: "none" 
  },
  button: { 
    color: "white", 
    padding: "16px 24px", 
    border: "none", 
    borderRadius: "12px", 
    fontWeight: "800", 
    cursor: "pointer", 
    fontSize: "16px", 
    transition: "transform 0.1s", 
    boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.4)", 
    width: "100%", 
    backgroundColor: "#3b82f6", 
    marginTop: "10px" 
  }
};

export default FicharHoras;