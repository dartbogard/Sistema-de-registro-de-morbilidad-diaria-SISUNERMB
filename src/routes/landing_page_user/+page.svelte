<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  // Variable para almacenar los datos del usuario autenticado
  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;

  onMount(() => {
    // Recuperar los datos de sesión guardados durante el Login
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
    } else {
      // Si no hay sesión activa, redirigir al Login
      goto('/');
    }
  });

  function cerrarSesion() {
    localStorage.removeItem('usuario_sesion');
    goto('/');
  }
</script>

<!-- Inyección de metadatos, fuentes e iconos en el <head> -->
<svelte:head>
  <title>SISUNERMB - Panel Principal</title>
  <!-- Links de fuentes -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  <!-- Links de iconos -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=calendar_clock,history,logout,medication,patient_list,person,search" />
</svelte:head>

<!-- Header de la pagina -->
<nav class="nav-landing-user">
  <div class="div-inner-nav">
    <a href="https://unermb.web.ve" class="image-wrapper">
      <img class="img-nav-login" src="/cintillo-unermb.png" alt="Cintillo UNERMB" />
    </a>
    <div class="image-wrapper">
      <img class="img-nav-login" src="/sisunermb.png" alt="Logo SISUNERMB" />
    </div>
  </div>
  <h1>BIENVENIDO AL REGISTRO MEDICO SISUNERMB</h1>
</nav>

<!-- Div Grid Contenedor de Sidebar y Secciones -->
<div class="div-grid-wrapper">
  
  <!-- Sidebar lateral -->
  <aside class="sidebar-landing-user">
    <!-- Peticion de Nombre de usuario en BD e Icono de usuario o Foto de Perfil -->
    <div class="div-img-sidebar-wrapper" style="background-image: url('/background.jpg');">
      <!-- Muestra el nombre recuperado de la sesión o un texto por defecto -->
      <h3>{usuarioActual ? usuarioActual.nombre : 'Cargando...'}</h3>
    </div>

    <!-- Modulos interactivos -->
    <div class="div-modulos-wrapper">
      <p>Modulos</p>
      
      <!-- Listado de Modulos en la pagina -->
      <ul class="ul-sidebar">
        <!-- Registrar Paciente -->
         <a href="landing_page_user/crear-paciente">
          <li>
            <span class="material-symbols-outlined">person</span>
            Registrar Paciente
          </li>
        </a>

        <!-- Consulta Diagnóstico -->
        <a href="#consulta-diagnostico">
          <li>
            <span class="material-symbols-outlined">medication</span>
            Consulta Diagnóstico
          </li>
        </a>

        <!-- Historial Paciente -->
        <a href="#historial-paciente">
          <li>
            <span class="material-symbols-outlined">history</span>
            Historial Paciente
          </li>
        </a>

        <!-- Reposos/Suspensiones -->
        <a href="#reposos-suspensiones">
          <li>
            <span class="material-symbols-outlined">calendar_clock</span>
            Reposos/Suspensiones
          </li>
        </a>

        <!-- Reporte Morbilidad -->
        <a href="#reporte-morbilidad">
          <li>
            <span class="material-symbols-outlined">patient_list</span>
            Reporte Morbilidad
          </li>
        </a>

        <!-- Busqueda Paciente -->
        <a href="landing_page_user/buscar-paciente">
          <li>
            <span class="material-symbols-outlined">search</span>
            Búsqueda Paciente
          </li>
        </a>

        <!-- Cerrar Sesion -->
        <button type="button" on:click={cerrarSesion} class="btn-logout-link">
          <li>
            <span class="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </li>
        </button>
      </ul>
    </div>
  </aside>

  <!-- Seccion Principal -->
  <main class="main-landing-user">
    <!-- Aquí irá el contenido dinámico de cada módulo -->
  </main>

</div>

<!-- Footer -->
<footer class="footer-landing-user">
  <p>Créditos: Miguel Contreras, Arturo Pérez, Omar Oberto Big 2026</p>
</footer>

<style>
  /* CSS GENERALES */
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(html, body) {
    height: 100%;
    font-family: 'Google Sans', sans-serif;
    background-color: ghostwhite;
  }

  :global(body) {
    display: grid;
    grid-template-rows: 8% 1fr auto;
    grid-template-areas: 
      "header"
      "body"
      "footer";
  }

  /* HEADER */
  nav {
    background-color: #007aff;
    grid-area: header;    
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    height: 100%;
  }

  .div-inner-nav {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 25%;
    height: 100%;
  }

  .image-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 50%;
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
    padding-right: 20px;
  }

  /* DIV GRID WRAPPER DE SIDEBAR Y MAIN */
  .div-grid-wrapper {
    grid-area: body;
    display: grid;
    grid-template-columns: 20% 1fr;
    grid-template-areas: "sidebar main";
    height: 100%;
  }

  /* SIDEBAR */
  .sidebar-landing-user {
    grid-area: sidebar;
    background-color: #2c3e50;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    height: 100%;
    color: #fff;
  }

  .div-img-sidebar-wrapper {
    width: 100%;
    height: 25%;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 15px;
  }

  .div-img-sidebar-wrapper h3 {
    background-color: rgba(0, 0, 0, 0.6);
    padding: 5px 15px;
    border-radius: 4px;
    font-size: 1.1rem;
  }

  .div-modulos-wrapper {
    width: 100%;
    padding: 20px 0;
  }

  .div-modulos-wrapper p {
    padding-left: 20px;
    font-size: 0.85rem;
    text-transform: uppercase;
    color: #bdc3c7;
    margin-bottom: 10px;
  }

  .ul-sidebar {
    list-style: none;
    width: 100%;
  }

  .ul-sidebar a,
  .btn-logout-link {
    text-decoration: none;
    color: #ecf0f1;
    display: block;
    width: 100%;
    background: none;
    border: none;
    font: inherit;
    cursor: pointer;
    text-align: left;
  }

  .ul-sidebar li {
    display: flex;
    align-items: center;
    padding: 12px 20px;
    transition: background-color 0.3s ease;
    gap: 12px;
  }

  .ul-sidebar li:hover {
    background-color: #34495e;
    color: #3498db;
  }

  /* MAIN */
  .main-landing-user {
    grid-area: main;
    background-color: #f4f6f7;
    padding: 20px;
    overflow-y: auto;
  }

  /* FOOTER */
  .footer-landing-user {
    grid-area: footer;
    background-color: #007aff;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 0.85rem;
  }
</style>