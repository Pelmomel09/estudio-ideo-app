import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importamos todas las pantallas de nuestra aplicación
import Login from './components/Login';
import Panel from './components/Panel';
import Dashboard from './components/Dashboard';
import FicharHoras from './components/FicharHoras';
import Gastos from './components/Gastos';
import NuevoProyecto from './components/NuevoProyecto';
import Configuracion from './components/Configuracion';
import ProyectoDetalle from './components/ProyectoDetalle';
import MisProyectosMapa from './components/MisProyectosMapa';

function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Ruta pública: Inicio de sesión */}
        <Route path="/" element={<Login />} />
        
        {/* Rutas privadas: Todo lo que está dentro del Panel */}
        <Route path="/panel" element={<Panel />}>
          <Route index element={<Dashboard />} />
          <Route path="horas" element={<FicharHoras />} />
          <Route path="gastos" element={<Gastos />} />
          <Route path="nuevo-proyecto" element={<NuevoProyecto />} />
          
          {/* Registro de la ruta del mapa */}
          <Route path="mapa" element={<MisProyectosMapa />} />
          
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="proyecto/:id" element={<ProyectoDetalle />} />
        </Route>
        
        {/* Regla de seguridad: Si la ruta no existe, vuelve al Login */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;