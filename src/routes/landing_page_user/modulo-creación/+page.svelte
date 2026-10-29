<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { crearPaciente } from '$lib/queries/pacientes';
  import { crearEspecialidad } from '$lib/queries/especialidades';
  import { crearUsuario } from '$lib/queries/usuarios'; // Asegúrate de tener o crear esta función
  import type { CrearPacienteInput } from '$lib/types/paciente';

  // Datos de la sesión
  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;

  // Control de la pestaña activa ('paciente' | 'especialidad' | 'usuario')
  let tabActiva: 'paciente' | 'especialidad' | 'usuario' = 'paciente';

  // Mensajes de respuesta
  let mensajeExito = '';
  let mensajeError = '';

  // Formulario de Paciente
  let formPaciente: CrearPacienteInput = {
    nombre_completo_paciente: '',
    nombre_titular_paciente: '',
    ci_titular_paciente: '',
    ci_beneficiario_paciente: '',
    fecha_nacimiento_paciente: '',
    sexo_paciente: 'M',
    tipo_personal_paciente: 'DOCENTE',
    categoria_trabajador_paciente: 'ACTIVO',
    parentesco_paciente: 'TITULAR'
  };

  // Formulario de Especialidad
  let tipoEspecialidad = '';

  // Formulario de Usuario (ajustado a tu tabla USUARIO del ERD)
  let formUsuario = {
    nombre_usuario: '',
    password_usuario: '',
    rol_usuario: 'MEDICO' // o ADMINISTRADOR, etc.
  };

  onMount(() => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
    } else {
      goto('/');
    }
  });

  async function guardarPaciente() {
    mensajeExito = '';
    mensajeError = '';
    try {
      await crearPaciente(formPaciente);
      mensajeExito = '¡Paciente registrado exitosamente en la base de datos!';
      formPaciente = {
        nombre_completo_paciente: '',
        nombre_titular_paciente: '',
        ci_titular_paciente: '',
        ci_beneficiario_paciente: '',
        fecha_nacimiento_paciente: '',
        sexo_paciente: 'M',
        tipo_personal_paciente: 'DOCENTE',
        categoria_trabajador_paciente: 'ACTIVO',
        parentesco_paciente: 'TITULAR'
      };
    } catch (error: any) {
      console.error('Error al registrar paciente:', error);
      mensajeError = `Error al registrar paciente: ${error.message || error}`;
    }
  }

  async function guardarEspecialidad() {
    mensajeExito = '';
    mensajeError = '';
    try {
      await crearEspecialidad({ tipo_especialidad: tipoEspecialidad });
      mensajeExito = '¡Especialidad registrada exitosamente!';
      tipoEspecialidad = '';
    } catch (error: any) {
      console.error('Error al registrar especialidad:', error);
      mensajeError = `Error al registrar especialidad: ${error.message || error}`;
    }
  }

  async function guardarUsuario() {
    mensajeExito = '';
    mensajeError = '';
    try {
      await crearUsuario(formUsuario);
      mensajeExito = '¡Usuario del sistema registrado exitosamente!';
      formUsuario = {
        nombre_usuario: '',
        password_usuario: '',
        rol_usuario: 'MEDICO'
      };
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      mensajeError = `Error al registrar usuario: ${error.message || error}`;
    }
  }

  function cerrarSesion() {
    localStorage.removeItem('usuario_sesion');
    goto('/');
  }
</script>

<svelte:head>
  <title>SISUNERMB - Módulo de Creación</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
</svelte:head>

<!-- Header -->
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

<!-- Div Grid Contenedor -->
<div class="div-grid-wrapper">
  <!-- Sidebar -->
  <aside class="sidebar-landing-user">
    <div class="div-img-sidebar-wrapper" style="background-image: url('/background.jpg');">
      <h3>{usuarioActual ? usuarioActual.nombre : 'Cargando...'}</h3>
    </div>

    <div class="div-modulos-wrapper">
      <p>Modulos</p>
      <ul class="ul-sidebar">
        <a href="/landing_page_user/modulo-creacion">
          <li style="background-color: #34495e; color: #3498db;">
            <span class="material-symbols-outlined">add_box</span>
            Módulo de Creación
          </li>
        </a>
        <a href="/landing_page_user/crear-consulta">
          <li>
            <span class="material-symbols-outlined">medication</span>
            Consulta Diagnóstico
          </li>
        </a>
        <a href="/landing_page_user/historial-paciente">
          <li>
            <span class="material-symbols-outlined">history</span>
            Historial Paciente
          </li>
        </a>
        <a href="#reposos-suspensiones">
          <li>
            <span class="material-symbols-outlined">calendar_clock</span>
            Reposos/Suspensiones
          </li>
        </a>
        <a href="#reporte-morbilidad">
          <li>
            <span class="material-symbols-outlined">patient_list</span>
            Reporte Morbilidad
          </li>
        </a>
        <a href="/landing_page_user/buscar-paciente">
          <li>
            <span class="material-symbols-outlined">search</span>
            Búsqueda Paciente
          </li>
        </a>
        <button type="button" on:click={cerrarSesion} class="btn-logout-link">
          <li>
            <span class="material-symbols-outlined">logout</span>
            Cerrar Sesión
          </li>
        </button>
      </ul>
    </div>
  </aside>

  <!-- Sección Principal -->
  <main class="main-landing-user">
    <div class="form-container">
      <!-- Pestañas de Selección -->
      <div class="tabs-header">
        <button 
          class="tab-btn {tabActiva === 'paciente' ? 'active' : ''}" 
          on:click={() => { tabActiva = 'paciente'; mensajeExito = ''; mensajeError = ''; }}
        >
          <span class="material-symbols-outlined">person_add</span>
          Paciente
        </button>
        <button 
          class="tab-btn {tabActiva === 'especialidad' ? 'active' : ''}" 
          on:click={() => { tabActiva = 'especialidad'; mensajeExito = ''; mensajeError = ''; }}
        >
          <span class="material-symbols-outlined">medical_services</span>
          Especialidad
        </button>
        <button 
          class="tab-btn {tabActiva === 'usuario' ? 'active' : ''}" 
          on:click={() => { tabActiva = 'usuario'; mensajeExito = ''; mensajeError = ''; }}
        >
          <span class="material-symbols-outlined">badge</span>
          Usuario
        </button>
      </div>

      {#if mensajeExito}
        <div class="alert success">{mensajeExito}</div>
      {/if}
      {#if mensajeError}
        <div class="alert error">{mensajeError}</div>
      {/if}

      <!-- FORMULARIO PACIENTE -->
      {#if tabActiva === 'paciente'}
        <h2>Registrar Nuevo Paciente</h2>
        <form on:submit|preventDefault={guardarPaciente} class="form-grid">
          <div class="form-group full-width">
            <label for="nombre_paciente">Nombre Completo del Paciente</label>
            <input type="text" id="nombre_paciente" bind:value={formPaciente.nombre_completo_paciente} required placeholder="Ej. Juan Pérez" />
          </div>

          <div class="form-group">
            <label for="ci_beneficiario">Cédula del Beneficiario</label>
            <input type="text" id="ci_beneficiario" bind:value={formPaciente.ci_beneficiario_paciente} placeholder="Ej. V-12345678" />
          </div>

          <div class="form-group">
            <label for="nombre_titular">Nombre del Titular</label>
            <input type="text" id="nombre_titular" bind:value={formPaciente.nombre_titular_paciente} required placeholder="Ej. Pedro Pérez" />
          </div>

          <div class="form-group">
            <label for="ci_titular">Cédula del Titular</label>
            <input type="text" id="ci_titular" bind:value={formPaciente.ci_titular_paciente} placeholder="Ej. V-87654321" />
          </div>

          <div class="form-group">
            <label for="fecha_nac">Fecha de Nacimiento</label>
            <input type="date" id="fecha_nac" bind:value={formPaciente.fecha_nacimiento_paciente} required />
          </div>

          <div class="form-group">
            <label for="sexo">Sexo</label>
            <select id="sexo" bind:value={formPaciente.sexo_paciente}>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>

          <div class="form-group">
            <label for="tipo_personal">Tipo de Personal</label>
            <select id="tipo_personal" bind:value={formPaciente.tipo_personal_paciente}>
              <option value="DOCENTE">DOCENTE</option>
              <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
              <option value="OBRERO">OBRERO</option>
              <option value="ESTUDIANTE">ESTUDIANTE</option>
            </select>
          </div>

          <div class="form-group">
            <label for="categoria">Categoría</label>
            <select id="categoria" bind:value={formPaciente.categoria_trabajador_paciente}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="JUBILADO">JUBILADO</option>
            </select>
          </div>

          <div class="form-group">
            <label for="parentesco">Parentesco</label>
            <select id="parentesco" bind:value={formPaciente.parentesco_paciente}>
              <option value="TITULAR">TITULAR</option>
              <option value="HIJO/A">HIJO/A</option>
              <option value="ESPOSO/A">ESPOSO/A</option>
              <option value="MADRE/PADRE">MADRE/PADRE</option>
            </select>
          </div>

          <div class="form-group full-width">
            <button type="submit" class="btn-submit">Guardar Paciente</button>
          </div>
        </form>
      {/if}

      <!-- FORMULARIO ESPECIALIDAD -->
      {#if tabActiva === 'especialidad'}
        <h2>Registrar Nueva Especialidad Médica</h2>
        <form on:submit|preventDefault={guardarEspecialidad}>
          <div class="form-group full-width">
            <label for="tipo_esp">Nombre de la Especialidad</label>
            <input type="text" id="tipo_esp" bind:value={tipoEspecialidad} required placeholder="Ej. Traumatología, Cardiología" />
          </div>

          <button type="submit" class="btn-submit">Guardar Especialidad</button>
        </form>
      {/if}

      <!-- FORMULARIO USUARIO -->
      {#if tabActiva === 'usuario'}
        <h2>Registrar Nuevo Usuario del Sistema</h2>
        <form on:submit|preventDefault={guardarUsuario} class="form-grid">
          <div class="form-group full-width">
            <label for="nombre_usr">Nombre de Usuario (Login)</label>
            <input type="text" id="nombre_usr" bind:value={formUsuario.nombre_usuario} required placeholder="Ej. jperez" />
          </div>

          <div class="form-group">
            <label for="pass_usr">Contraseña</label>
            <input type="password" id="pass_usr" bind:value={formUsuario.password_usuario} required placeholder="••••••••" />
          </div>

          <div class="form-group">
            <label for="rol_usr">Rol del Usuario</label>
            <select id="rol_usr" bind:value={formUsuario.rol_usuario}>
              <option value="MEDICO">MEDICO</option>
              <option value="ADMINISTRADOR">ADMINISTRADOR</option>
              <option value="ASISTENTE">ASISTENTE</option>
            </select>
          </div>

          <div class="form-group full-width">
            <button type="submit" class="btn-submit">Guardar Usuario</button>
          </div>
        </form>
      {/if}
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

  /* GRID WRAPPER */
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

  /* MAIN & FORMULARIOS */
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
    max-width: 800px;
    margin: 0 auto;
  }

  .tabs-header {
    display: flex;
    gap: 10px;
    margin-bottom: 25px;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 10px;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    color: #7f8c8d;
    transition: all 0.2s ease;
  }

  .tab-btn:hover {
    background-color: #f1f2f6;
    color: #2c3e50;
  }

  .tab-btn.active {
    background-color: #007aff;
    color: white;
  }

  .form-container h2 {
    margin-bottom: 20px;
    color: #2c3e50;
    font-family: 'Montserrat', sans-serif;
    font-size: 1.4rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group.full-width {
    grid-column: span 2;
  }

  .form-group label {
    margin-bottom: 5px;
    font-weight: 500;
    color: #34495e;
    font-size: 0.9rem;
  }

  .form-group input,
  .form-group select {
    padding: 10px;
    border: 1px solid #dcdde1;
    border-radius: 4px;
    font-size: 0.95rem;
    font-family: 'Google Sans', sans-serif;
  }

  .form-group input:focus,
  .form-group select:focus {
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
    margin-top: 15px;
    transition: background-color 0.2s ease;
  }

  .btn-submit:hover {
    background-color: #005bb5;
  }

  .alert {
    padding: 10px 15px;
    margin-bottom: 20px;
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