import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase'; 
// Asegúrate de que la extensión sea la correcta (.jpg o .jpeg)
import logoOscuro from '../assets/Logo 1.jpeg';

const Login = () => {
  const [nombre, setNombre] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [errorMensaje, setErrorMensaje] = useState('');
  const [usuarioRecordado, setUsuarioRecordado] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const datosGuardados = localStorage.getItem('estudioIdeoUsuario');
    if (datosGuardados) {
      setUsuarioRecordado(JSON.parse(datosGuardados));
    }
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMensaje('');
    try {
      if (isLogin) {
        if (usuarioRecordado) {
          await signInWithEmailAndPassword(auth, usuarioRecordado.email, password);
        } else {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          localStorage.setItem('estudioIdeoUsuario', JSON.stringify({
            nombre: userCredential.user.displayName || email.split('@')[0],
            email: email
          }));
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: nombre });
        localStorage.setItem('estudioIdeoUsuario', JSON.stringify({ nombre: nombre, email: email }));
      }
      navigate('/panel');
    } catch (error) {
      console.error("Error de acceso:", error.code);
      setErrorMensaje('Datos incorrectos. Revisa tu contraseña.');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrorMensaje('');
    setEmail('');
    setPassword('');
    setNombre(''); 
  };

  const olvidarUsuario = () => {
    localStorage.removeItem('estudioIdeoUsuario');
    setUsuarioRecordado(null);
    setPassword('');
    setErrorMensaje('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.leftSide}>
        <div style={styles.formContainer}>
          
          <div style={styles.headerForm}>
            <h2 style={styles.title}>
              {usuarioRecordado && isLogin 
                ? `¡Bienvenido de nuevo, ${usuarioRecordado.nombre}!` 
                : isLogin ? 'Acceso al sistema' : 'Crea tu cuenta'}
            </h2>
            <p style={styles.subtitle}>
              {usuarioRecordado && isLogin 
                ? 'Introduce tu contraseña para acceder a tu panel.' 
                : 'Introduce tus datos para continuar en Estudio Ideo.'}
            </p>
          </div>
          
          <form onSubmit={handleAuth} style={styles.form}>
            {!isLogin && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Tu Nombre de Usuario</label>
                <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} style={styles.input} placeholder="Ej: Pelayo" required={!isLogin} />
              </div>
            )}

            {(!usuarioRecordado || !isLogin) && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Correo Electrónico</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={styles.input} placeholder="Ej: usuario@estudioideo.com" required={!usuarioRecordado || !isLogin} />
              </div>
            )}
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={styles.input} placeholder="••••••••" required />
            </div>

            {errorMensaje && <p style={styles.errorText}>{errorMensaje}</p>}

            <button type="submit" style={styles.button}>
              {isLogin ? 'Entrar al Panel' : 'Registrarme'}
            </button>
          </form>

          <div style={styles.toggleContainer}>
            {usuarioRecordado && isLogin ? (
              <p style={styles.toggleText}>¿No eres {usuarioRecordado.nombre}? <span onClick={olvidarUsuario} style={styles.toggleLink}> Entrar con otra cuenta</span></p>
            ) : (
              <p style={styles.toggleText}>
                {isLogin ? '¿Nuevo en el equipo?' : '¿Ya tienes cuenta?'}
                <span onClick={toggleMode} style={styles.toggleLink}> {isLogin ? ' Crear cuenta' : ' Iniciar sesión'}</span>
              </p>
            )}
          </div>

        </div>
      </div>

      <div style={styles.rightSide}>
        <div style={styles.brandContent}>
          {/* LOGOTIPO COMO PLACA PREMIUM */}
          <img src={logoOscuro} alt="Estudio Ideo" style={styles.brandLogo} />
          
          <div style={styles.divider}></div>
          <p style={styles.brandSubtitle}>Transformando espacios. Gestionando el talento.</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#ffffff' },
  leftSide: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' },
  formContainer: { width: '100%', maxWidth: '420px' },
  headerForm: { marginBottom: '30px' },
  title: { color: '#0f172a', fontSize: '32px', fontWeight: '800', marginBottom: '8px' },
  subtitle: { color: '#64748b', fontSize: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', color: '#334155', fontWeight: '600' },
  input: { padding: '14px 16px', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: '#f8fafc' },
  button: { marginTop: '10px', backgroundColor: '#2563eb', color: '#ffffff', padding: '16px', borderRadius: '10px', border: 'none', fontSize: '16px', fontWeight: '700', cursor: 'pointer' },
  errorText: { color: '#ef4444', fontSize: '14px', fontWeight: '500', padding: '10px', backgroundColor: '#fef2f2', borderRadius: '8px', borderLeft: '4px solid #ef4444' },
  toggleContainer: { marginTop: '24px', textAlign: 'center' },
  toggleText: { color: '#64748b', fontSize: '14px' },
  toggleLink: { color: '#2563eb', fontWeight: '700', cursor: 'pointer' },
  
  // SOLUCIÓN ESTÉTICA PARA EL LADO DERECHO: Fondo pizarra oscuro elegante
  rightSide: { 
    flex: 1.2, 
    backgroundImage: `linear-gradient(135deg, #1e293b 0%, #0f172a 100%)`, // Degradado neutro y muy elegante
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: '40px', 
    color: '#ffffff' 
  },
  
  brandContent: { maxWidth: '500px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  
  // ESTILOS PARA EL LOGOTIPO DERECHO (Efecto placa flotante)
  brandLogo: { 
    width: '240px', 
    height: 'auto', 
    marginBottom: '30px', 
    borderRadius: '16px', 
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)', // Sombra elegante para dar profundidad
    border: '1px solid rgba(255, 255, 255, 0.05)' // Brillo súper sutil en el borde
  }, 
  
  divider: { height: '4px', width: '60px', backgroundColor: '#3b82f6', margin: '0 auto 24px auto', borderRadius: '2px' }, // Cambiado a azul para destacar
  brandSubtitle: { fontSize: '20px', fontWeight: '400', color: '#94a3b8' } // Texto un poco más tenue para dar protagonismo al logo
};

export default Login;