<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { crearConsulta } from '$lib/queries/consultas'; // Ajusta la ruta a tu archivo de queries
  import { type CrearConsultaInput } from '$lib/types/consulta';
  // Variable para almacenar los datos del usuario autenticado
  let usuarioActual: { id: number; nombre: string; rol: string } | null = null;

  // Estado del formulario de consulta adaptado con la cédula del beneficiario
  let formulario: CrearConsultaInput = {
    especialidad_consulta: '',
    usuario_consulta: 1, // Se puede asignar dinámicamente según usuarioActual.id si aplica
    ci_beneficiario_paciente: '',
    doctor_consulta: 1, // ID o valor numérico del doctor según tu esquema
    fecha_consulta: '',
    diagnostico_consulta: ''
  };

  let mensajeExito = '';
  let mensajeError = '';

  onMount(() => {
    // Recuperar los datos de sesión guardados durante el Login
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
      if (usuarioActual) {
        formulario.usuario_consulta = Number(usuarioActual.id) || 1;
      }
    } else {
      // Si no hay sesión activa, redirigir al Login
      goto('/');
    }
  });

  async function manejarRegistroConsulta(event: Event) {
    event.preventDefault();
    mensajeExito = '';
    mensajeError = '';

    try {
      await crearConsulta(formulario);
      mensajeExito = '¡Consulta registrada exitosamente!';
      // Limpiar formulario o mantener según prefieras
      formulario.ci_beneficiario_paciente = '';
      formulario.diagnostico_consulta = '';
      formulario.especialidad_consulta = '';
      formulario.fecha_consulta = '';
    } catch (error: any) {
      console.error('Error al registrar consulta:', error);
      mensajeError = `Error al registrar consulta: ${error.message || error}`;
    }
  }

  function cerrarSesion() {
    localStorage.removeItem('usuario_sesion');
    goto('/');
  }
</script>

<!-- Inyección de metadatos, fuentes e iconos en el <head> -->
<svelte:head>
  <title>SISUNERMB - Registrar Consulta</title>
  <!-- Links de fuentes -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  <!-- Links de iconos -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
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
    <div class="div-img-sidebar-wrapper" style="background-image: url('/background.jpg');">
      <h3>{usuarioActual ? usuarioActual.nombre : 'Cargando...'}</h3>
    </div>

    <!-- Modulos interactivos -->
    <div class="div-modulos-wrapper">
      <p>Modulos</p>
      
      <ul class="ul-sidebar">
        <!-- Registrar Paciente -->
        <a href="/landing_page_user/crear-paciente">
          <li>
            <span class="material-symbols-outlined">person</span>
            Registrar Paciente
          </li>
        </a>

        <!-- Consulta Diagnóstico (Activo actual) -->
        <a href="/landing_page_user/crear-consulta">
          <li style="background-color: #34495e; color: #3498db;">
            <span class="material-symbols-outlined">medication</span>
            Consulta Diagnóstico
          </li>
        </a>

        <!-- Historial Paciente -->
        <a href="/landing_page_user/historial-paciente">
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
        <a href="/landing_page_user/buscar-paciente">
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
    <div class="form-container">
      <h2>Registro de Nueva Consulta Médica</h2>
      
      {#if mensajeExito}
        <div class="alert success">{mensajeExito}</div>
      {/if}
      {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
      {/if}

      <form on:submit={manejarRegistroConsulta}>
        <div class="form-group">
          <label for="ci_beneficiario">Cédula del Beneficiario (Paciente)</label>
          <input 
            type="text" 
            id="ci_beneficiario" 
            bind:value={formulario.ci_beneficiario_paciente} 
            placeholder="Ej: V-12345678" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="especialidad">Especialidad</label>
          <input 
            type="text" 
            id="especialidad" 
            bind:value={formulario.especialidad_consulta} 
            placeholder="Ej: Medicina General" 
            required 
          />
        </div>

        <div class="form-group">
          <label for="doctor">ID Doctor</label>
          <input 
            type="number" 
            id="doctor" 
            bind:value={formulario.doctor_consulta} 
            required 
          />
        </div>

        <div class="form-group">
          <label for="fecha">Fecha de Consulta</label>
          <input 
            type="date" 
            id="fecha" 
            bind:value={formulario.fecha_consulta} 
            required 
          />
        </div>

        <div class="form-group">
          <label for="diagnostico">Diagnóstico</label>
          <textarea 
            id="diagnostico" 
            bind:value={formulario.diagnostico_consulta} 
            rows="4" 
            placeholder="Detalles del diagnóstico médico..."
            required
          ></textarea>
        </div>

        <button type="submit" class="btn-submit">Guardar Consulta</button>
      </form>
    </div>
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

  /* MAIN & FORMULARIO */
  .main-landing-user {
    grid-area: main;
    background-color: #f4f6f7;
    padding: 30px;
    overflow-y: auto;
  }

  .form-container {
    background-color: #ffffff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.05);
    max-width: 700px;
    margin: 0 auto;
  }

  .form-container h2 {
    margin-bottom: 20px;
    color: #2c3e50;
    font-family: 'Montserrat', sans-serif;
  }

  .form-group {
    margin-bottom: 15px;
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    margin-bottom: 5px;
    font-weight: 500;
    color: #34495e;
  }

  .form-group input,
  .form-group textarea {
    padding: 10px;
    border: 1px solid #dcdde1;
    border-radius: 4px;
    font-size: 1rem;
    font-family: 'Google Sans', sans-serif;
  }

  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #007aff;
  }

  .btn-submit {
    background-color: #007aff;
    color: white;
    border: none;
    padding: 12px 20px;
    font-size: 1rem;
    border-radius: 4px;
    cursor: pointer;
    width: 100%;
    transition: background-color 0.2s ease;
  }

  .btn-submit:hover {
    background-color: #005bb5;
  }

  .alert {
    padding: 10px;
    margin-bottom: 15px;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .alert.success {
    background-color: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }

  .alert.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
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