import React, { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
// IMPORTAMOS SÓLO LO NECESARIO
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// COMPONENTE: Captura clics manuales en el mapa
const MarcadorInteractivo = ({ posicion, alHacerClic }) => {
  useMapEvents({
    click(e) {
      alHacerClic(e.latlng.lat, e.latlng.lng);
    },
  });
  return posicion ? <Marker position={[posicion.lat, posicion.lng]} /> : null;
};

const NuevoProyecto = () => {
  const { proyectos, setProyectos, mostrarToast } = useOutletContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [direccionSeleccionada, setDireccionSeleccionada] = useState(null);
  const [buscando, setBuscando] = useState(false);

  // NUEVO: ESTADO PARA CONTROLAR EL MINI-MAPA DIRECTAMENTE
  const [mapaGps, setMapaGps] = useState(null);

  // Centro por defecto (España)
  const centroPorDefecto = [40.4168, -3.7038];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const buscarDireccion = async (e) => {
    e.preventDefault();
    if (!busqueda) return;
    
    setBuscando(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=es&q=${busqueda}`);
      const data = await response.json();
      setResultados(data);
      if(data.length === 0) mostrarToast("⚠️ No se encontró la calle. Prueba a buscar solo ciudad o una calle principal.");
    } catch (error) {
      mostrarToast("❌ Error al buscar la dirección.");
    }
    setBuscando(false);
  };

  const seleccionarDireccionTextual = (lugar) => {
    const lat = parseFloat(lugar.lat);
    const lng = parseFloat(lugar.lon);

    setDireccionSeleccionada({
      direccion: lugar.display_name,
      lat: lat,
      lng: lng
    });
    setResultados([]); 
    setBusqueda(''); 

    // SOLUCIÓN: LE DAMOS LA ORDEN AL MAPA DIRECTAMENTE DESDE AQUÍ
    if (mapaGps) {
      mapaGps.flyTo([lat, lng], 18, { duration: 1.5 });
    }
  };

  const handleClicEnMapa = async (lat, lng) => {
    setDireccionSeleccionada(prev => ({
      direccion: prev ? prev.direccion : "Ubicación ajustada manualmente", 
      lat: lat,
      lng: lng
    }));
    mostrarToast("📍 Ubicación ajustada con precisión.");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!direccionSeleccionada) {
      mostrarToast("⚠️ Debes buscar y confirmar una ubicación primero.");
      return;
    }

    const nuevoProyecto = {
      id: Date.now(),
      nombre: formData.nombre,
      descripcion: formData.descripcion,
      ...direccionSeleccionada, 
      fechaCreacion: new Date().toISOString().split('T')[0]
    };

    setProyectos([...proyectos, nuevoProyecto]);
    mostrarToast("✅ Proyecto creado con ubicación exacta.");
    navigate('/panel/mapa'); 
  };

  return (
    <main style={{ flex: 1, padding: '40px 50px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#1e293b', margin: 0 }}>➕ Nuevo Proyecto</h1>
        <p style={{ color: '#64748b' }}>Da de alta una nueva obra y ubícala con precisión satelital.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        <div style={styles.card}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={styles.label}>Nombre del Proyecto</label>
              <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required style={styles.input} placeholder="Ej: Reforma Villa Sur" />
            </div>
            <div>
              <label style={styles.label}>Descripción</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} style={{...styles.input, minHeight: '80px'}} placeholder="Detalles de la obra..." />
            </div>

            <div style={{ padding: '20px', backgroundColor: '#f1f5f9', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
              <label style={styles.label}>📍 1. Busca la calle o ciudad</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={busqueda} 
                  onChange={(e) => setBusqueda(e.target.value)} 
                  style={styles.input} 
                  placeholder="Ej: Calle Gran Vía, Madrid" 
                />
                <button type="button" onClick={buscarDireccion} style={{...styles.btnAction, backgroundColor: '#0f172a', width: 'auto'}}>
                  {buscando ? '...' : 'Buscar'}
                </button>
              </div>
              
              {resultados.length > 0 && (
                <div style={{ marginTop: '10px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', maxHeight: '150px', overflowY: 'auto' }}>
                  {resultados.map((lugar, i) => (
                    <div key={i} onClick={() => seleccionarDireccionTextual(lugar)} style={styles.resultadoItem}>
                      {lugar.display_name}
                    </div>
                  ))}
                </div>
              )}
              
              {direccionSeleccionada && (
                <p style={{ margin: '15px 0 0 0', fontSize: '13px', color: '#10b981', fontWeight: 'bold' }}>
                  ✅ Zona encontrada. Puedes afinar haciendo clic en el mapa.
                </p>
              )}
            </div>

            <button type="submit" style={{ ...styles.btnAction, backgroundColor: '#2563eb', marginTop: '10px' }}>
              Crear y Localizar Proyecto
            </button>
          </form>
        </div>

        <div style={{...styles.card, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
          <div style={{ padding: '20px', backgroundColor: '#1e293b', color: 'white' }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>📍 2. Ajuste Fino Satelital</h3>
            <p style={{ margin: '5px 0 0 0', fontSize: '13px', color: '#94a3b8' }}>
              Si el número no aparece en la búsqueda, busca la calle y luego <b>haz clic sobre el edificio exacto</b> en el mapa.
            </p>
          </div>
          
          <div style={{ flex: 1, minHeight: '400px' }}>
            {/* NUEVO: AÑADIMOS ref={setMapaGps} PARA CONTROLAR LA CÁMARA */}
            <MapContainer 
              center={centroPorDefecto} 
              zoom={6} 
              style={{ width: '100%', height: '100%' }}
              ref={setMapaGps}
            >
              {/* CAPA 1: FOTOS DE SATÉLITE */}
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution='&copy; Esri' />
              
              {/* CAPA 2: NOMBRES DE CIUDADES Y FRONTERAS (Híbrido) */}
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
              
              {/* CAPA 3: CARRETERAS Y CALLES (Híbrido) */}
              <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}" />

              <MarcadorInteractivo posicion={direccionSeleccionada} alHacerClic={handleClicEnMapa} />
            </MapContainer>
          </div>
        </div>

      </div>
    </main>
  );
};

const styles = {
  card: { backgroundColor: '#ffffff', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column' },
  label: { display: 'block', marginBottom: '8px', fontWeight: '700', color: '#475569', fontSize: '13px' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #cbd5e1', fontSize: '15px', outline: 'none', boxSizing: 'border-box' },
  btnAction: { color: 'white', padding: '14px', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', transition: 'transform 0.1s', width: '100%' },
  resultadoItem: { padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', fontSize: '13px', color: '#334155' }
};

export default NuevoProyecto;