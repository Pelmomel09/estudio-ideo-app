import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Solución para que los iconos por defecto de Leaflet se vean bien en React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MisProyectosMapa = () => {
  const { proyectos = [], ajustes = {} } = useOutletContext() || {};
  const colorEmpresa = ajustes?.colorAcento || '#2563eb';

  // 1. ESTADOS PARA CONTROLAR EL MAPA Y EL PROYECTO SELECCIONADO
  const [mapaGps, setMapaGps] = useState(null);
  const [proyectoActivo, setProyectoActivo] = useState(null);

  const proyectosConUbicacion = proyectos.filter(p => p.lat && p.lng);
  const centroEspaña = [40.4168, -3.7038];

  const abrirGPS = (lat, lng) => {
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // 2. FUNCIÓN DE VUELO AUTOMÁTICO + SELECCIÓN DE DESCRIPCIÓN
  const volarAlProyecto = (proyecto) => {
    setProyectoActivo(proyecto);
    if (mapaGps && proyecto.lat && proyecto.lng) {
      mapaGps.flyTo([proyecto.lat, proyecto.lng], 18, { duration: 1.5 });
    }
  };

  // Función auxiliar para leer la descripción sea cual sea el nombre de la variable
  const obtenerTextoDescripcion = (proy) => {
    return proy.descripcion || proy.notas || proy.detalles || 'Sin descripción registrada para este proyecto.';
  };

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', height: '100vh', overflowY: 'auto' }}>
      
      <header style={{ padding: '35px 50px 20px 50px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '34px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
          <span style={{ color: colorEmpresa }}>🗺️</span> Mapa de Proyectos (Satélite)
        </h1>
        <p style={{ color: '#64748b', fontSize: '15px', marginTop: '6px', marginBottom: 0 }}>
          Selecciona una obra de la lista para viajar a ella y consultar su descripción técnica debajo del mapa.
        </p>
      </header>

      {/* DISEÑO EN DOS COLUMNAS */}
      <div style={{ flex: 1, display: 'flex', gap: '24px', padding: '0 50px 40px 50px', minHeight: '620px' }}>
        
        {/* COLUMNA IZQUIERDA: LISTA INTERACTIVA DE PROYECTOS */}
        <div style={{ 
          width: '320px', 
          backgroundColor: '#ffffff', 
          borderRadius: '24px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: '800' }}>📍 Tus Obras Ubicadas</h3>
          </div>
          
          <div style={{ overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {proyectosConUbicacion.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>No hay proyectos con geolocalización.</p>
            ) : (
              proyectosConUbicacion.map(proyecto => {
                const estaSeleccionado = proyectoActivo?.id === proyecto.id;
                return (
                  <div 
                    key={proyecto.id} 
                    onClick={() => volarAlProyecto(proyecto)}
                    style={{
                      ...styles.projectCard,
                      borderColor: estaSeleccionado ? colorEmpresa : '#e2e8f0',
                      backgroundColor: estaSeleccionado ? '#eff6ff' : '#f8fafc'
                    }}
                  >
                    <h4 style={{ margin: '0 0 5px 0', color: colorEmpresa, fontSize: '15px' }}>{proyecto.nombre}</h4>
                    <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                      📍 {(proyecto.direccion || 'Sin dirección').split(',')[0]}
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#475569', fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📝 {obtenerTextoDescripcion(proyecto)}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: MAPA ARRIBA + DESCRIPCIÓN DE PROYECTOS DEBAJO */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
          
          {/* VISOR DEL MAPA SATÉLITE */}
          <div style={{ flex: 1, minHeight: '380px', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
            <MapContainer center={centroEspaña} zoom={6} style={{ width: '100%', height: '100%' }} ref={setMapaGps}>
              
              {/* CAPA 1: FOTOS DE SATÉLITE */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              />
              
              {/* CAPA 2: NOMBRES DE CIUDADES Y FRONTERAS */}
              <TileLayer 
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" 
              />
              
              {/* CAPA 3: CARRETERAS Y CALLES */}
              <TileLayer 
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}" 
              />

              {proyectosConUbicacion.map(proyecto => (
                <Marker 
                  key={proyecto.id} 
                  position={[proyecto.lat, proyecto.lng]}
                  eventHandlers={{
                    click: () => setProyectoActivo(proyecto)
                  }}
                >
                  <Popup>
                    <div style={{ textAlign: 'center', padding: '5px', maxWidth: '220px' }}>
                      <h3 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '16px' }}>{proyecto.nombre}</h3>
                      <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 8px 0' }}>
                        {obtenerTextoDescripcion(proyecto)}
                      </p>
                      <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px 0' }}>
                        {(proyecto.direccion || '').substring(0, 45)}...
                      </p>
                      <button 
                        onClick={() => abrirGPS(proyecto.lat, proyecto.lng)}
                        style={{
                          backgroundColor: colorEmpresa, color: 'white', padding: '8px 16px', border: 'none', 
                          borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%'
                        }}
                      >
                        📍 Abrir Navegador GPS
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* NUEVA SECCIÓN DEBAJO DEL MAPA: DESCRIPCIÓN DE LOS PROYECTOS */}
          <div style={styles.descripcionPanel}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                📋 Descripción de los Proyectos
              </h3>
              {proyectoActivo && (
                <button 
                  onClick={() => setProyectoActivo(null)} 
                  style={{ background: 'none', border: 'none', color: colorEmpresa, cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                >
                  Ver todos ({proyectos.length})
                </button>
              )}
            </div>

            {proyectos.length === 0 ? (
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>No hay proyectos creados todavía.</p>
            ) : proyectoActivo ? (
              /* VISTA DESTACADA CUANDO SELECCIONAS UN PROYECTO EN EL MAPA */
              <div style={{ ...styles.descCard, borderLeft: `4px solid ${colorEmpresa}`, backgroundColor: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>
                    🏗️ {proyectoActivo.nombre}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    📍 {proyectoActivo.direccion || 'Ubicación no especificada'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: '1.6' }}>
                  {obtenerTextoDescripcion(proyectoActivo)}
                </p>
              </div>
            ) : (
              /* LISTA DE DESCRIPCIONES DE TODOS LOS PROYECTOS */
              <div style={styles.descGrid}>
                {proyectos.map((proy) => (
                  <div 
                    key={proy.id} 
                    onClick={() => volarAlProyecto(proy)}
                    style={styles.descCard}
                  >
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: colorEmpresa, fontWeight: '800' }}>
                      📁 {proy.nombre}
                    </h4>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                      {obtenerTextoDescripcion(proy)}
                    </p>
                    {proy.direccion && (
                      <span style={{ fontSize: '11px', color: '#94a3b8', display: 'block' }}>
                        📍 {proy.direccion.split(',')[0]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
};

const styles = {
  projectCard: {
    padding: '14px 16px',
    backgroundColor: '#f8fafc',
    border: '1.5px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  },
  descripcionPanel: {
    backgroundColor: '#ffffff',
    padding: '20px 24px',
    borderRadius: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
    maxHeight: '210px',
    overflowY: 'auto'
  },
  descGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '12px'
  },
  descCard: {
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  }
};

export default MisProyectosMapa;