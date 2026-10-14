// Importamos las librerías principales de React
import React from 'react'
import ReactDOM from 'react-dom/client'
// Importamos nuestro componente principal de la app (que crearemos en el siguiente paso)
import App from './App.jsx'
// Importamos los estilos globales
import './index.css'

// Seleccionamos el elemento vacío con id "root" en nuestro HTML y "pintamos" la App dentro
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)