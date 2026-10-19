
<script lang="ts">

import { goto } from '$app/navigation';

import { obtenerUsuarioPorNombre } from '$lib/queries/usuarios';

// Variables reactivas para los campos del formulario

let nombreUsuario: string = '';
let passwordUsuario: string = '';

// Estados de la interfaz

let cargando: boolean = false;
let mensajeError: string = '';


async function manejarLogin() {
mensajeError = '';

// Cuando colocas ! justo antes de una variable en una condición o expresión, 
// estás invirtiendo su valor booleano. En este caso si falta alguno de los campos surge el error
if (!nombreUsuario.trim() || !passwordUsuario.trim()) {
mensajeError = 'Por favor complete todos los campos.';
return;
}

cargando = true;

try {
// Búsqueda en la base de datos PostgreSQL
const usuario = await obtenerUsuarioPorNombre(nombreUsuario.trim());

if (!usuario) {
mensajeError = 'El usuario ingresado no existe.';
return;
}

// Validación simple de contraseña
// (sujeto a mejoras con hash)
if (usuario.password_usuario !== passwordUsuario) {
mensajeError = 'Contraseña incorrecta.';
return;
}

// Guardar sesión básica o estado global (ej. en localStorage si es app de escritorio)
localStorage.setItem('usuario_sesion', JSON.stringify({
id: usuario.id_usuario,
nombre: usuario.nombre_usuario,
rol: usuario.rol_usuario
}));

// Redirigir al panel principal (Dashboard pero en este caso landing page user)
goto('/landing_page_user');

} catch (error) {

console.error('Error durante la autenticación:', error);

mensajeError = 'Error de conexión con la base de datos.';

} finally {
cargando = false;
}
}
</script>
<!-- Inyección de fuentes e iconos en el <head> de la aplicación -->
<svelte:head>
  <title>Login - SISUNERMB</title>
  <!-- Fuentes Google -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  <!-- Material Symbols / Iconos -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=person,password_2" />
</svelte:head>

<!-- Contenedor Raíz (Sustituye al <body>) -->
<div class="page-container">
  
  <!-- Header de la pagina -->
  <nav class="nav-login">
    <a href="https://unermb.web.ve" target="_blank" rel="noreferrer" class="image-wrapper">
      <img class="img-nav-login" src="/cintillo-unermb.png" alt="Cintillo UNERMB" />
    </a>
    <div class="image-wrapper">
      <img class="img-nav-login" src="/sisunermb.png" alt="Logo SISUNERMB" />
    </div>
    <h1>BIENVENIDO AL REGISTRO MEDICO SISUNERMB</h1>
  </nav>

  <!-- Imagen de fondo -->
  <img class="img-background" src="/background.jpg" alt="Fondo SISUNERMB" />

  <!-- Inicia Formulario -->
  <div class="div-form-login">
    <form on:submit|preventDefault={manejarLogin}>

      <!-- Alerta de mensaje de error si existe -->
      {#if mensajeError}
        <p class="error-message">{mensajeError}</p>
      {/if}

      <!-- Pide Usuario -->
      <div class="div-inner-form-login">
        <label for="usuario">Usuario:</label>
        <div class="div-icon-wrapper">
          <span class="material-symbols-outlined icon-user">person</span>
          <input 
            bind:value={nombreUsuario}
            placeholder="Ingrese su Usuario" 
            type="text" 
            id="usuario" 
            name="username" 
            required 
            autocomplete="username" 
            disabled={cargando}
          />
        </div>
      </div>

      <!-- Pide Contraseña -->
      <div class="div-inner-form-login">
        <label for="contrasena">Contraseña:</label>
        <div class="div-icon-wrapper">
          <span class="material-symbols-outlined icon-user">password_2</span>
          <input 
            bind:value={passwordUsuario}
            placeholder="Ingrese su Contraseña" 
            type="password" 
            id="contrasena" 
            name="password" 
            required 
            autocomplete="current-password" 
            disabled={cargando}
          />
        </div>
      </div>

      <!-- Boton Inicio de Sesion -->
      <div class="div-inner-form-login">
        <button type="submit" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </div>
    </form>
  </div>

  <!-- Footer -->
  <footer class="footer-login">
    <p>Créditos: Miguel Contreras, Arturo Pérez, Omar Oberto Big 2026</p>
  </footer>

</div>

<style>
  /* Resets locales y contenedor principal */
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .page-container {
    min-height: 100vh;
    height: 100vh;
    font-family: 'Google Sans', sans-serif;
    background-color: ghostwhite;
    display: grid;
    grid-template-rows: 8% 1fr auto;
    grid-template-areas: 
      "header"
      "form"
      "footer";
  }

  /* HEADER */
  nav {
    background-color: #007aff;
    grid-area: header;    
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .image-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 20%;
    height: 100%;
  }

  .img-nav-login {    
    display: block;
    width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  h1 {
    color: #fff;
    text-align: right;
    font-family: 'Montserrat', sans-serif;
    font-weight: 400;
    letter-spacing: -1px;
  }

  /* BODY Y FONDO */
  .img-background {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 1;
    grid-area: form;
  }

  /* FORMULARIO */
  .div-form-login {
    grid-area: form;
    background-color: ghostwhite;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;    
    width: 100%;
    max-width: 350px;
    height: 80%;
    border-radius: 8px;
    margin: auto;
    z-index: 10; /* Asegura que el formulario quede sobre la imagen de fondo */
  }

  .div-inner-form-login {
    display: flex;
    flex-direction: column;
    margin: 15px 0;
    align-items: flex-start;
    width: 100%;
  }

  label {
    margin-bottom: 10px;
  }

  .div-icon-wrapper {
    position: relative;
    display: inline-block;
    width: 100%;
  }

  .div-icon-wrapper .icon-user {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #666;
    pointer-events: none;
  }

  input {
    width: 100%;
    padding: 8px 5px 8px 40px;
    background-color: #d8cece;
    outline: none;
    border: none;
    border-bottom: 2px solid rgba(0, 0, 0, 0);
    transition: all 0.3s ease;
  }

  input:focus {
    border: none;
    border-bottom: #007aff solid 2px;
    color: #000;
    background-color: #fff;
  }

  input:hover {
    border: none;    
    color: #000;
    background-color: #fff;
    border-bottom: #007aff solid 2px;
  }

  input::placeholder {
    color: #000;
    opacity: 0.5;
  }

  button {
    background-color: #fff;
    border: #007aff solid 1px;
    margin: auto;
    padding: 8px 16px;
    cursor: pointer;
    border-radius: 4px;
    font-weight: 600;
  }

  button:hover {
    background-color: #007aff;
    border-color: #fff;
    color: #fff;
    transition-duration: 0.3s;
  }

  /* FOOTER */
  .footer-login {
    grid-area: footer;
    background-color: #007aff;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 0.85rem;
  }
  .error-message {
    color: #d32f2f;
    background-color: #ffebee;
    border: 1px solid #ef9a9a;
    padding: 8px;
    border-radius: 4px;
    font-size: 0.85rem;
    text-align: center;
    width: 100%;
    margin-bottom: 10px;
  }

  button:disabled {
    background-color: #ccc;       /* sugerido por ia, confirmar don miguel */
    border-color: #aaa;
    color: #666;
    cursor: not-allowed;
  }
</style>