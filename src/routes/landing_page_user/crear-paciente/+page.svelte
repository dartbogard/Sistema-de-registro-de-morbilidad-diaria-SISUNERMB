<script lang="ts">
  import { crearPaciente } from '$lib/queries/pacientes';
  
  import type { CrearPacienteInput } from '$lib/types/paciente';
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
  // Objeto reactivo para el formulario
  let formulario: CrearPacienteInput = {
    nombre_completo_paciente: '',
    nombre_titular_paciente: '',
    ci_titular_paciente: '',
    ci_beneficiario_paciente: null,
    fecha_nacimiento_paciente: '',
    sexo_paciente: 'M',
    tipo_personal_paciente: 'DOCENTE',
    categoria_trabajador_paciente: 'ACTIVO',
    parentesco_paciente: null,
    // Se agrega opcionalmente o se deja omitido si se marcó con ? en la interfaz
    fecha_actualización_paciente: null
  };

  let esTitular: boolean = true;
  let cargando: boolean = false;
  let mensajeExito: string = '';
  let mensajeError: string = '';

  async function manejarRegistro() {
    mensajeError = '';
    mensajeExito = '';

    // Solución al error 18047: Usar ?.trim() o verificar que exista el string
    const ciTitular = formulario.ci_titular_paciente?.trim() || '';
    const nombreCompleto = formulario.nombre_completo_paciente?.trim() || '';

    if (!nombreCompleto || !ciTitular || !formulario.fecha_nacimiento_paciente) {
      mensajeError = 'Por favor complete todos los campos obligatorios (*).';
      return;
    }

    cargando = true;

    try {
      // Preparación limpia del objeto a enviar
      const datosAEnviar: CrearPacienteInput = {
        ...formulario,
        nombre_completo_paciente: nombreCompleto,
        nombre_titular_paciente: formulario.nombre_titular_paciente?.trim() || nombreCompleto,
        ci_titular_paciente: ciTitular,
        ci_beneficiario_paciente: esTitular ? null : formulario.ci_beneficiario_paciente?.trim() || null,
        parentesco_paciente: esTitular ? null : formulario.parentesco_paciente,
        fecha_actualización_paciente: new Date().toISOString()
      };

      await crearPaciente(datosAEnviar);
      mensajeExito = '¡Paciente registrado exitosamente!';
      limpiarFormulario();

    } catch (error) {
      console.error('Error al registrar paciente:', error);
      mensajeError = 'Ocurrió un error al guardar el registro en la base de datos.';
    } finally {
      cargando = false;
    }
  }

  function limpiarFormulario() {
    formulario = {
      nombre_completo_paciente: '',
      nombre_titular_paciente: '',
      ci_titular_paciente: '',
      ci_beneficiario_paciente: null,
      fecha_nacimiento_paciente: '',
      sexo_paciente: 'M',
      tipo_personal_paciente: 'DOCENTE',
      categoria_trabajador_paciente: 'ACTIVO',
      parentesco_paciente: null,
      fecha_actualización_paciente: null
    };
    esTitular = true;
  }
</script>

<svelte:head>
  <title>Registrar Paciente - SISUNERMB</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"/>
</svelte:head>
  <!-- Sidebar lateral -->
   <div class="div-grid-wrapper">
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
        <!-- Consulta Diagnóstico -->
        <a href="/landing_page_user/crear-consulta">
          <li>
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
</div>
<div class="modulo-container">
  <!-- Cabecera del Módulo -->
  <header class="modulo-header">
    <div class="div-inner-nav">
    <a href="https://unermb.web.ve" class="image-wrapper">
      <img class="img-nav-login" src="/cintillo-unermb.png" alt="Cintillo UNERMB" />
    </a>
    <div class="image-wrapper">
      <img class="img-nav-login" src="/sisunermb.png" alt="Logo SISUNERMB" />
    </div>
  </div>
    <a href="/landing_page_user" class="btn-regresar">
      <span class="material-symbols-outlined arrow-back">arrow_back</span>
    </a>
    <h2>
      Registro de Nuevo Paciente
    </h2>
  </header>

  <!-- Formulario Principal -->
  <form on:submit|preventDefault={manejarRegistro} class="form-registrar-paciente">
    
    {#if mensajeError}
      <div class="alert alert-error">{mensajeError}</div>
    {/if}

    {#if mensajeExito}
      <div class="alert alert-exito">{mensajeExito}</div>
    {/if}

    <!-- SECCIÓN 1: Condición del Paciente -->
    <fieldset class="form-section">
      <legend>Condición del Paciente</legend>
      <div class="checkbox-wrapper">
        <label class="label-checkbox">
          <input type="checkbox" bind:checked={esTitular} disabled={cargando} />
          <span>El paciente es el mismo Titular del beneficio</span>
        </label>
      </div>
    </fieldset>

    <!-- SECCIÓN 2: Datos Personales del Paciente -->
    <fieldset class="form-section">
      <legend>Datos Personales</legend>
      <div class="grid-form">
        
        <!-- Nombre Completo Paciente -->
        <div class="form-group col-span-2">
          <label for="nombre">Nombre Completo del Paciente *</label>
          <div class="div-icon-wrapper">
            <span class="material-symbols-outlined icon-input">&#xe7fd;</span>
            <input 
              type="text" 
              id="nombre" 
              bind:value={formulario.nombre_completo_paciente} 
              placeholder="Ej. Miguel Jose Contreras Coronado"
              disabled={cargando}
              required 
            />
          </div>
        </div>

        <!-- Cédula Titular -->
        <div class="form-group">
          <label for="ci_titular">Cédula del Titular *</label>
          <div class="div-icon-wrapper">
            <span class="material-symbols-outlined icon-input">badge</span>
            <input 
              type="text" 
              id="ci_titular" 
              bind:value={formulario.ci_titular_paciente} 
              placeholder="Ej. V-12345678"
              disabled={cargando}
              required 
            />
          </div>
        </div>

        <!-- Cédula Beneficiario (Si aplica) -->
        <div class="form-group">
          <label for="ci_beneficiario">Cédula del Beneficiario {esTitular ? '(N/A)' : '*'}</label>
          <div class="div-icon-wrapper">
            <span class="material-symbols-outlined icon-input">badge</span>
            <input 
              type="text" 
              id="ci_beneficiario" 
              bind:value={formulario.ci_beneficiario_paciente} 
              placeholder={esTitular ? 'No aplica para Titular' : 'Ej. V-28765432'}
              disabled={cargando || esTitular}
              required={!esTitular}
            />
          </div>
        </div>

        <!-- Nombre Titular (Inhabilitado si esTitular es true) -->
        {#if !esTitular}
          <div class="form-group col-span-2">
            <label for="nombre_titular">Nombre Completo del Titular *</label>
            <div class="div-icon-wrapper">
              <span class="material-symbols-outlined icon-input">person</span>
              <input 
                type="text" 
                id="nombre_titular" 
                bind:value={formulario.nombre_titular_paciente} 
                placeholder="Nombre del titular asignado"
                disabled={cargando}
                required
              />
            </div>
          </div>

          <!-- Parentesco -->
          <div class="form-group">
            <label for="parentesco">Parentesco *</label>
            <div class="div-icon-wrapper">
              <span class="material-symbols-outlined icon-input">family_restroom</span>
              <select id="parentesco" bind:value={formulario.parentesco_paciente} disabled={cargando} required>
                <option value={null} disabled selected>Seleccione...</option>
                <option value="HIJO(A)">HIJO(A)</option>
                <option value="CÓNYUGE">CÓNYUGE</option>
                <option value="PADRE/MADRE">PADRE/MADRE</option>
              </select>
            </div>
          </div>
        {/if}

        <!-- Fecha Nacimiento -->
        <div class="form-group">
          <label for="fecha_nac">Fecha de Nacimiento *</label>
          <div class="div-icon-wrapper">
            <span class="material-symbols-outlined icon-input">calendar_today</span>
            <input 
              type="date" 
              id="fecha_nac" 
              bind:value={formulario.fecha_nacimiento_paciente} 
              disabled={cargando}
              required 
            />
          </div>
        </div>

        <!-- Sexo -->
        <div class="form-group">
          <label for="sexo">Sexo *</label>
          <select id="sexo" bind:value={formulario.sexo_paciente} disabled={cargando} required>
            <option value="M">Masculino (M)</option>
            <option value="F">Femenino (F)</option>
          </select>
        </div>

      </div>
    </fieldset>

    <!-- SECCIÓN 3: Clasificación Institucional (UNERMB) -->
    <fieldset class="form-section zona-colapsable" class:oculto={!esTitular}>
      <legend>Clasificación Institucional</legend>
      <div class="grid-form">
        
        <!-- Tipo de Personal -->
        <div class="form-group" >
          <label for="tipo_personal">Tipo de Personal *</label>
          <select id="tipo_personal" bind:value={formulario.tipo_personal_paciente} disabled={cargando || !esTitular} required>
            <option value="DOCENTE">DOCENTE</option>
            <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
            <option value="OBRERO">OBRERO</option>
            <option value="ESTUDIANTE">ESTUDIANTE</option>
          </select>
        </div>

        <!-- Categoría de Trabajador -->
        <div class="form-group">
          <label for="categoria">Categoría del Trabajador *</label>
          <select id="categoria" bind:value={formulario.categoria_trabajador_paciente} disabled={cargando || !esTitular} required>
            <option value="ACTIVO">ACTIVO</option>
            <option value="JUBILADO">JUBILADO</option>
            <option value="PENSIONADO">PENSIONADO</option>
            <option value="CONTRATADO">CONTRATADO</option>
          </select>
        </div>

      </div>
    </fieldset>

    <!-- Botones de Acción -->
    <div class="form-actions">
      <button type="button" class="btn-cancelar" on:click={limpiarFormulario} disabled={cargando}>
        Limpiar
      </button>
      <button type="submit" class="btn-guardar" disabled={cargando}>
        {cargando ? 'Guardando...' : 'Registrar Paciente'}
      </button>
    </div>

  </form>
</div>

<style>

  .div-inner-nav {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    width: 25%;
    height: 10%;
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

  .modulo-container {
    background-color: #007aff;
    border-radius: 8px;
    padding: 25px;
    padding-bottom: 45px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-bottom: 2px solid #eef2f5;
    width: 100%;
    margin: 0 auto;
  }

  .modulo-header {
    display: flex;
    align-items:space-between ;
    justify-content: flex-start;
    padding-bottom: 20px;
    margin-bottom: 20px;
    gap: 1em;
    width: 100%;
  }

  .btn-regresar {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #fff;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .btn-regresar:hover {
    text-decoration: underline;
  }

  .modulo-header h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #fff;
    font-size: 1.4rem;
  }

  .form-section {
    border: 1px solid #0959af;
    border-radius: 6px;
    padding: 18px;
    width: 40%;
    margin: auto;
    margin-bottom: 20px;
  }

  .form-section legend {
    font-weight: 600;
    color: #007aff;
    padding: 0 8px;
    font-size: 0.95rem;
  }

  .grid-form {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
  }

  .col-span-2 {
    grid-column: span 2;
  }

  .form-group {
    display: flex;
    flex-direction: column;
  }

  .form-group label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 6px;
  }

  .div-icon-wrapper {
    position: relative;
    width: 100%;
  }

  .icon-input {
    position: absolute;
    left: 10px;
    top: 50%;
    transform: translateY(-50%);
    color: #7f8c8d;
    font-size: 20px;
    pointer-events: none;
  }

  input[type="text"],
  input[type="date"],
  select {
    width: 100%;
    padding: 9px 10px 9px 38px;
    border: 1px solid #00448c;
    border-radius: 5px;
    font-size: 0.95rem;
    outline: none;
    background-color: #fcfcfc;
    transition: all 0.2s ease;
  }
 input[type="text"]:focus,
  input[type="date"]:focus,
  select:focus {
    border: 1px solid #00448c;
    box-shadow: none;
    outline: none;
  }
  select {
    padding-left: 10px; /* Sin icono para selects simples */
  }

  .div-icon-wrapper select {
    padding-left: 38px;
  }

  input:focus, select:focus {
    border-color: #007aff;
    background-color: #fff;
    box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.1);
  }

  input:disabled, select:disabled {
    background-color: #eef2f5;
    cursor: not-allowed;
  }

  .label-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    font-size: 0.95rem;
    font-weight: 600;
    color: #2c3e50;
  }

  .label-checkbox input {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }

  .form-actions {
    display: flex;
    justify-content:center ;
    margin: auto;
    margin-top: 10px;
    gap: 40px;
  }

  .btn-guardar {
    background-color: #007aff;
    color: white;
    border: none;
    padding: 10px 24px;
    border-radius: 5px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 175px;
  }

  .btn-guardar:hover:not(:disabled) {
    background-color: #0056b3;
  }

  .btn-cancelar {
    background-color: #e0e0e0;
    color: #333;
    border: none;
    padding: 10px 18px;
    border-radius: 5px;
    font-weight: 600;
    cursor: pointer;
    width: 175px;
  }

  .btn-cancelar:hover:not(:disabled) {
    background-color: #d0d0d0;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  

  /* Alertas */
  .alert {
    padding: 12px;
    border-radius: 5px;
    margin-bottom: 15px;
    font-size: 0.9rem;
    text-align: center;
    font-weight: 600;
  }

  .alert-error {
    background-color: #fde8e8;
    color: #9b1c1c;
    border: 1px solid #fbd5d5;
  }

  .alert-exito {
    background-color: #def7ec;
    color: #03543f;
    border: 1px solid #bcf0da;
  }
  .zona-colapsable {
  max-height: 500px; /* Un alto mayor al contenido de la zona */
  opacity: 1;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, padding 0.3s ease;
}

.zona-colapsable.oculto {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  border: none; /* Oculta los bordes del fieldset cuando se contrae */
  margin: 0;
  pointer-events: none;
}
</style>