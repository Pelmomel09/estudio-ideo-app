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
  const { proyectos, ajustes } = useOutletContext();
  const colorEmpresa = ajustes?.colorAcento || '#2563eb';

  // 1. ESTADO PARA CONTROLAR EL MAPA
  const [mapaGps, setMapaGps] = useState(null);

  const proyectosConUbicacion = proyectos.filter(p => p.lat && p.lng);
  const centroEspaña = [40.4168, -3.7038];

  const abrirGPS = (lat, lng) => {
    const url = `https://maps.google.com/?q=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // 2. FUNCIÓN DE VUELO AUTOMÁTICO
  const volarAlProyecto = (lat, lng) => {
    if (mapaGps) {
      // flyTo(coordenadas, zoom, opciones de animación)
      // Un zoom de 18 es ideal para ver los edificios en vista satélite
      mapaGps.flyTo([lat, lng], 18, { duration: 1.5 });
    }
  };

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', height: '100vh' }}>
      
      <header style={{ padding: '40px 50px 20px 50px', flexShrink: 0 }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#1e293b', margin: 0 }}>
          <span style={{ color: colorEmpresa }}>🗺️</span> Mapa de Proyectos (Satélite)
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', marginTop: '8px' }}>
          Selecciona una obra de la lista para viajar a ella o usa el mapa libremente.
        </p>
      </header>

      {/* 3. NUEVO DISEÑO EN DOS COLUMNAS */}
      <div style={{ flex: 1, display: 'flex', gap: '20px', padding: '0 50px 40px 50px', minHeight: 0 }}>
        
        {/* COLUMNA IZQUIERDA: LISTA INTERACTIVA DE PROYECTOS */}
        <div style={{ 
          width: '320px', 
          backgroundColor: '#ffffff', 
          borderRadius: '24px', 
          border: '1px solid #e2e8f0', 
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f1f5f9' }}>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '16px', fontWeight: '800' }}>📍 Tus Obras Ubicadas</h3>
          </div>
          
          <div style={{ overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {proyectosConUbicacion.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', marginTop: '20px' }}>No hay proyectos con geolocalización.</p>
            ) : (
              proyectosConUbicacion.map(proyecto => (
                <div 
                  key={proyecto.id} 
                  onClick={() => volarAlProyecto(proyecto.lat, proyecto.lng)}
                  style={styles.projectCard}
                >
                  <h4 style={{ margin: '0 0 5px 0', color: colorEmpresa, fontSize: '15px' }}>{proyecto.nombre}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                    {proyecto.direccion.split(',')[0]} {/* Muestra solo la primera parte de la dirección */}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: EL MAPA */}
        <div style={{ flex: 1, borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
          
          {/* Con ref={setMapaGps} capturamos el control del mapa */}
          <MapContainer center={centroEspaña} zoom={6} style={{ width: '100%', height: '100%' }} ref={setMapaGps}>
            
            {/* CAPA 1: FOTOS DE SATÉLITE */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            />
            
            {/* CAPA 2: NOMBRES DE CIUDADES Y FRONTERAS (Híbrido) */}
            <TileLayer 
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" 
            />
            
            {/* CAPA 3: CARRETERAS Y CALLES (Híbrido) */}
            <TileLayer 
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}" 
            />

            {proyectosConUbicacion.map(proyecto => (
              <Marker key={proyecto.id} position={[proyecto.lat, proyecto.lng]}>
                <Popup>
                  <div style={{ textAlign: 'center', padding: '5px' }}>
                    <h3 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '16px' }}>{proyecto.nombre}</h3>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 15px 0' }}>
                      {proyecto.direccion.substring(0, 40)}...
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
      </div>
    </main>
  );
};

const styles = {
  projectCard: {
    padding: '16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    // Usamos boxShadow para dar sensación de que se puede pulsar
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
  }
};

export default MisProyectosMapa;