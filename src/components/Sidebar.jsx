import React from 'react';
import { NavLink } from 'react-router-dom';
// Asegúrate de que la extensión sea la correcta (.jpg o .jpeg)
import logoClaro from '../assets/Logo 2.jpeg';

const Sidebar = ({ proyectos, onLogout, ajustes }) => {
  
  const navLinkStyle = ({ isActive }) => {
    return isActive 
      ? { ...styles.navItem, ...styles.navItemActive } 
      : styles.navItem;
  };

  return (
    <aside style={styles.sidebar}>
      <div>
        
        {/* CONTENEDOR DE MARCA: Logo + Nombre dinámico */}
        <div style={styles.brandContainer}>
          <img src={logoClaro} alt="Logo Estudio Ideo" style={styles.logoImg} />
          <h2 style={styles.logoText}>{ajustes?.nombreEmpresa || 'Estudio Ideo'}</h2>
        </div>
        
        <p style={styles.sidebarSectionTitle}>HERRAMIENTAS</p>
        <nav style={styles.nav}>
          <NavLink to="/panel" end style={navLinkStyle}>📊 Dashboard</NavLink>
          <NavLink to="/panel/horas" style={navLinkStyle}>⏱️ Fichar Horas</NavLink>
          <NavLink to="/panel/gastos" style={navLinkStyle}>💶 Añadir Gasto</NavLink>
          <NavLink to="/panel/nuevo-proyecto" style={navLinkStyle}>➕ Crear Proyecto</NavLink>
          <NavLink to="/panel/mapa" style={navLinkStyle}>🗺️ Mapa de Proyectos</NavLink>
          <NavLink to="/panel/configuracion" style={navLinkStyle}>⚙️ Configuración</NavLink>
        </nav>

        <div style={styles.divider}></div>

        <p style={styles.sidebarSectionTitle}>MIS PROYECTOS</p>
        <nav style={styles.navProyectos}>
          {proyectos.length === 0 && (
            <p style={{ fontSize: '13px', color: '#94a3b8', padding: '0 16px' }}>No hay proyectos</p>
          )}
          {proyectos.map((proyecto) => (
            <NavLink 
              key={proyecto.id} 
              to={`/panel/proyecto/${proyecto.id}`}
              style={({ isActive }) => isActive 
                ? { ...styles.navItemProject, backgroundColor: '#eff6ff', color: '#2563eb' } 
                : styles.navItemProject}
            >
              📁 {proyecto.nombre}
            </NavLink>
          ))}
        </nav>
      </div>
      
      <button onClick={onLogout} style={styles.logoutBtn}>Cerrar Sesión</button>
    </aside>
  );
};

const styles = {
  sidebar: { width: '260px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '30px 20px', zIndex: 10 },
  
  // NUEVOS ESTILOS PARA LA MARCA (LOGO + TEXTO)
  brandContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', padding: '0 10px' },
  logoImg: { width: '90px', height: 'auto', mixBlendMode: 'multiply', marginBottom: '12px' }, 
  logoText: { fontSize: '20px', fontWeight: '900', color: '#0f172a', margin: 0, letterSpacing: '-0.5px', textAlign: 'center' },
  
  sidebarSectionTitle: { fontSize: '12px', fontWeight: '700', color: '#94a3b8', paddingLeft: '10px', marginBottom: '10px', marginTop: '10px', letterSpacing: '1px' },
  divider: { height: '1px', backgroundColor: '#e2e8f0', margin: '20px 0' },
  nav: { display: 'flex', flexDirection: 'column', gap: '8px' },
  navProyectos: { display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' },
  navItem: { padding: '14px 16px', color: '#64748b', fontWeight: '600', borderRadius: '10px', cursor: 'pointer', fontSize: '15px', transition: 'background 0.2s', textDecoration: 'none', display: 'block' },
  navItemProject: { padding: '10px 16px', color: '#475569', fontWeight: '500', borderRadius: '10px', fontSize: '14px', textDecoration: 'none', display: 'block' },
  navItemActive: { backgroundColor: '#eff6ff', color: '#2563eb' },
  logoutBtn: { padding: '14px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '15px', width: '100%', textAlign: 'left' },
};

export default Sidebar;