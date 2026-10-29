<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { crearPaciente } from '$lib/queries/pacientes';
  import type { CrearPacienteInput } from '$lib/types/paciente';

  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;

  // Control del formulario
  let esTitular: boolean = true;
  let cargando: boolean = false;
  let mensajeExito: string = '';
  let mensajeError: string = '';

  let formulario: CrearPacienteInput = {
    nombre_completo_paciente: '',
    nombre_titular_paciente: '',
    ci_titular_paciente: '',
    ci_beneficiario_paciente: null,
    fecha_nacimiento_paciente: '',
    sexo_paciente: 'M',
    tipo_personal_paciente: 'DOCENTE',
    categoria_trabajador_paciente: 'ACTIVO',
    parentesco_paciente: null
  };

  onMount(() => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
    } else {
      goto('/');
    }
  });

  function cerrarSesion() {
    localStorage.removeItem('usuario_sesion');
    goto('/');
  }

  function alCambiarCondicion() {
    if (esTitular) {
      formulario.ci_beneficiario_paciente = null;
      formulario.parentesco_paciente = null;
      formulario.nombre_titular_paciente = formulario.nombre_completo_paciente;
    } else {
      formulario.nombre_titular_paciente = '';
      formulario.parentesco_paciente = 'HIJO(A)';
    }
  }

  async function manejarRegistro() {
    mensajeError = '';
    mensajeExito = '';

    const nombreCompleto = formulario.nombre_completo_paciente?.trim() || '';
    const ciTitular = formulario.ci_titular_paciente?.trim() || '';
    const fechaNac = formulario.fecha_nacimiento_paciente?.trim() || '';

    if (!nombreCompleto || !ciTitular || !fechaNac) {
      mensajeError = 'Por favor complete todos los campos obligatorios marcados con (*).';
      return;
    }

    if (!esTitular) {
      if (!formulario.nombre_titular_paciente?.trim()) {
        mensajeError = 'Debe indicar el nombre completo del titular del beneficio.';
        return;
      }
      if (!formulario.parentesco_paciente) {
        mensajeError = 'Debe seleccionar el parentesco del beneficiario con el titular.';
        return;
      }
    }

    cargando = true;

    try {
      const datosAEnviar: CrearPacienteInput = {
        nombre_completo_paciente: nombreCompleto,
        nombre_titular_paciente: esTitular ? nombreCompleto : formulario.nombre_titular_paciente.trim(),
        ci_titular_paciente: ciTitular,
        ci_beneficiario_paciente: esTitular ? null : (formulario.ci_beneficiario_paciente?.trim() || null),
        fecha_nacimiento_paciente: fechaNac,
        sexo_paciente: formulario.sexo_paciente,
        tipo_personal_paciente: formulario.tipo_personal_paciente,
        categoria_trabajador_paciente: formulario.categoria_trabajador_paciente,
        parentesco_paciente: esTitular ? null : formulario.parentesco_paciente
      };

      await crearPaciente(datosAEnviar);
      mensajeExito = `¡Paciente ${nombreCompleto} registrado exitosamente en el sistema!`;
      limpiarFormulario();
    } catch (error: any) {
      console.error('Error al registrar paciente:', error);
      mensajeError = error?.message || 'Ocurrió un error al guardar el registro en la base de datos.';
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
      parentesco_paciente: null
    };
    esTitular = true;
  }
</script>

<svelte:head>
  <title>SISUNERMB - Registrar Paciente</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
</svelte:head>

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

<div class="div-grid-wrapper">
  
  <aside class="sidebar-landing-user">
    <div class="div-img-sidebar-wrapper" style="background-image: url('/background.jpg');">
      <h3>{usuarioActual ? usuarioActual.nombre : 'Cargando...'}</h3>
    </div>

    <div class="div-modulos-wrapper">
      <p>Módulos</p>
      
      <ul class="ul-sidebar">
        <li>
          <a href="/landing_page_user/crear-paciente" class="btn-menu-item activo">
            <span class="material-symbols-outlined">person</span>
            <span>Registrar Paciente</span>
          </a>
        </li>

        <li>
          <a href="/landing_page_user/crear-consulta" class="btn-menu-item">
            <span class="material-symbols-outlined">medication</span>
            <span>Consulta Diagnóstico</span>
          </a>
        </li>

        <li>
          <a href="/landing_page_user/historial-paciente" class="btn-menu-item">
            <span class="material-symbols-outlined">history</span>
            <span>Historial Paciente</span>
          </a>
        </li>

        <li>
          <a href="/landing_page_user/reposos-suspensiones" class="btn-menu-item">
            <span class="material-symbols-outlined">calendar_clock</span>
            <span>Reposos/Suspensiones</span>
          </a>
        </li>

        <li>
          <a href="/landing_page_user/reporte-morbilidad" class="btn-menu-item">
            <span class="material-symbols-outlined">patient_list</span>
            <span>Reporte Morbilidad</span>
          </a>
        </li>

        <li>
          <a href="/landing_page_user/buscar-paciente" class="btn-menu-item">
            <span class="material-symbols-outlined">search</span>
            <span>Búsqueda Paciente</span>
          </a>
        </li>

        <li>
          <button type="button" on:click={cerrarSesion} class="btn-menu-item btn-logout">
            <span class="material-symbols-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </li>
      </ul>
    </div>
  </aside>

  <main class="main-landing-user">
    <div class="contenido-modulo">
      <div class="header-seccion">
        <h2>Registro de Nuevo Paciente</h2>
        <p class="subtitulo">Ingrese los datos para registrar a un titular o beneficiario en el sistema médico SISUNERMB.</p>
      </div>

      {#if mensajeExito}
        <div class="alerta-exito">
          <span class="material-symbols-outlined">check_circle</span>
          <p>{mensajeExito}</p>
        </div>
      {/if}

      {#if mensajeError}
        <div class="alerta-error">
          <span class="material-symbols-outlined">error</span>
          <p>{mensajeError}</p>
        </div>
      {/if}

      <form on:submit|preventDefault={manejarRegistro} class="formulario-card">

        <!-- SECCIÓN 1: Condición del Paciente -->
        <div class="seccion-bloque">
          <h3 class="seccion-titulo">
            <span class="material-symbols-outlined">verified_user</span>
            <span>Condición del Paciente</span>
          </h3>

          <div class="condicion-card">
            <label class="label-switch">
              <input 
                type="checkbox" 
                bind:checked={esTitular} 
                on:change={alCambiarCondicion}
                disabled={cargando} 
              />
              <span class="switch-ui"></span>
              <span class="switch-texto">
                {esTitular 
                  ? 'El paciente es el propio Titular del beneficio universitario' 
                  : 'El paciente es un Beneficiario asignado a un Titular'}
              </span>
            </label>
          </div>
        </div>

        <!-- SECCIÓN 2: Datos Personales -->
        <div class="seccion-bloque">
          <h3 class="seccion-titulo">
            <span class="material-symbols-outlined">badge</span>
            <span>Datos Personales</span>
          </h3>

          <div class="grid-campos">
            <!-- Nombre Completo del Paciente -->
            <div class="campo-grupo col-span-2">
              <label for="nombre">Nombre Completo del Paciente *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">person</span>
                <input 
                  type="text" 
                  id="nombre" 
                  bind:value={formulario.nombre_completo_paciente} 
                  placeholder="Ej. Miguel José Contreras Coronado"
                  disabled={cargando}
                  required 
                />
              </div>
            </div>

            <!-- Cédula del Titular -->
            <div class="campo-grupo">
              <label for="ci_titular">Cédula del Titular *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">fingerprint</span>
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

            <!-- Cédula del Beneficiario -->
            <div class="campo-grupo">
              <label for="ci_beneficiario">
                Cédula del Beneficiario {esTitular ? '(No aplica)' : '(Opcional)'}
              </label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">badge</span>
                <input 
                  type="text" 
                  id="ci_beneficiario" 
                  bind:value={formulario.ci_beneficiario_paciente} 
                  placeholder={esTitular ? 'No aplica para Titular' : 'Ej. V-28765432'}
                  disabled={cargando || esTitular}
                />
              </div>
            </div>

            <!-- Campos adicionales si es Beneficiario -->
            {#if !esTitular}
              <div class="campo-grupo col-span-2">
                <label for="nombre_titular">Nombre Completo del Titular *</label>
                <div class="input-con-icono">
                  <span class="material-symbols-outlined">supervisor_account</span>
                  <input 
                    type="text" 
                    id="nombre_titular" 
                    bind:value={formulario.nombre_titular_paciente} 
                    placeholder="Nombre completo del titular que posee el beneficio"
                    disabled={cargando}
                    required
                  />
                </div>
              </div>

              <div class="campo-grupo">
                <label for="parentesco">Parentesco con el Titular *</label>
                <div class="input-con-icono">
                  <span class="material-symbols-outlined">family_restroom</span>
                  <select id="parentesco" bind:value={formulario.parentesco_paciente} disabled={cargando} required>
                    <option value="HIJO(A)">HIJO(A)</option>
                    <option value="CÓNYUGE">CÓNYUGE</option>
                    <option value="PADRE/MADRE">PADRE/MADRE</option>
                    <option value="HERMANO(A)">HERMANO(A)</option>
                    <option value="OTRO">OTRO</option>
                  </select>
                </div>
              </div>
            {/if}

            <!-- Fecha de Nacimiento -->
            <div class="campo-grupo">
              <label for="fecha_nac">Fecha de Nacimiento *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">calendar_today</span>
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
            <div class="campo-grupo">
              <label for="sexo">Sexo *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">wc</span>
                <select id="sexo" bind:value={formulario.sexo_paciente} disabled={cargando} required>
                  <option value="M">Masculino (M)</option>
                  <option value="F">Femenino (F)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- SECCIÓN 3: Clasificación Institucional (UNERMB) -->
        <div class="seccion-bloque">
          <h3 class="seccion-titulo">
            <span class="material-symbols-outlined">domain</span>
            <span>Clasificación Institucional UNERMB</span>
          </h3>

          <div class="grid-campos">
            <!-- Tipo de Personal -->
            <div class="campo-grupo">
              <label for="tipo_personal">Tipo de Personal *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">groups</span>
                <select id="tipo_personal" bind:value={formulario.tipo_personal_paciente} disabled={cargando} required>
                  <option value="DOCENTE">DOCENTE</option>
                  <option value="ADMINISTRATIVO">ADMINISTRATIVO</option>
                  <option value="OBRERO">OBRERO</option>
                  <option value="ESTUDIANTE">ESTUDIANTE</option>
                </select>
              </div>
            </div>

            <!-- Categoría de Trabajador -->
            <div class="campo-grupo">
              <label for="categoria">Categoría del Trabajador *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">work</span>
                <select id="categoria" bind:value={formulario.categoria_trabajador_paciente} disabled={cargando} required>
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="JUBILADO">JUBILADO</option>
                  <option value="PENSIONADO">PENSIONADO</option>
                  <option value="CONTRATADO">CONTRATADO</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="form-acciones">
          <button type="button" class="btn-secundario" on:click={limpiarFormulario} disabled={cargando}>
            <span class="material-symbols-outlined">restart_alt</span>
            <span>Limpiar</span>
          </button>
          
          <button type="submit" class="btn-primario" disabled={cargando}>
            <span class="material-symbols-outlined">{cargando ? 'hourglass_top' : 'save'}</span>
            <span>{cargando ? 'Guardando...' : 'Registrar Paciente'}</span>
          </button>
        </div>

      </form>
    </div>
  </main>

</div>

<footer class="footer-landing-user">
  <p>Créditos: Miguel Contreras, Arturo Pérez, Omar Oberto Big 2026</p>
</footer>

<style>
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(html, body) {
    height: 100vh;
    font-family: 'Google Sans', sans-serif;
    background-color: ghostwhite;
    overflow: hidden;
  }

  :global(body) {
    display: grid;
    grid-template-rows: 60px 1fr 30px;
    grid-template-areas: 
      "header"
      "body"
      "footer";
  }

  nav {
    background-color: #007aff;
    grid-area: header;    
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 0 20px;
  }

  .div-inner-nav {
    display: flex;
    align-items: center;
    gap: 15px;
    height: 100%;
  }

  .image-wrapper {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .img-nav-login {    
    display: block;
    height: 40px;
    object-fit: contain;
  }

  h1 {
    color: #fff;
    font-family: 'Montserrat', sans-serif;
    font-size: 1.1rem;
    font-weight: 500;
  }

  .div-grid-wrapper {
    grid-area: body;
    display: grid;
    grid-template-columns: 240px 1fr;
    grid-template-areas: "sidebar main";
    height: 100%;
    overflow: hidden;
  }

  .sidebar-landing-user {
    grid-area: sidebar;
    background-color: #2c3e50;
    display: flex;
    flex-direction: column;
    height: 100%;
    color: #fff;
    overflow-y: auto;
    position: relative;
    z-index: 50;
  }

  .div-img-sidebar-wrapper {
    width: 100%;
    height: 120px;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 12px;
    flex-shrink: 0;
  }

  .div-img-sidebar-wrapper h3 {
    background-color: rgba(0, 0, 0, 0.6);
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.95rem;
  }

  .div-modulos-wrapper {
    width: 100%;
    padding: 15px 0;
    flex-grow: 1;
  }

  .div-modulos-wrapper p {
    padding-left: 20px;
    font-size: 0.8rem;
    text-transform: uppercase;
    color: #bdc3c7;
    margin-bottom: 10px;
    font-weight: 600;
  }

  .ul-sidebar {
    list-style: none;
    width: 100%;
  }

  .btn-menu-item {
    text-decoration: none;
    color: #ecf0f1;
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 20px;
    background: none;
    border: none;
    font: inherit;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  .btn-menu-item:hover,
  .btn-menu-item.activo {
    background-color: #34495e;
    color: #3498db;
  }

  .btn-menu-item span.material-symbols-outlined {
    font-size: 20px;
    flex-shrink: 0;
  }

  .main-landing-user {
    grid-area: main;
    background-color: #f1f5f9;
    padding: 30px;
    overflow-y: auto;
    height: 100%;
  }

  .contenido-modulo {
    max-width: 900px;
    margin: 0 auto;
  }

  .header-seccion {
    margin-bottom: 24px;
  }

  .contenido-modulo h2 {
    font-size: 1.8rem;
    color: #1e293b;
    font-weight: 700;
    font-family: 'Montserrat', sans-serif;
  }

  .subtitulo {
    color: #64748b;
    font-size: 0.95rem;
    margin-top: 4px;
  }

  .formulario-card {
    background: #ffffff;
    padding: 30px;
    border-radius: 14px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 26px;
  }

  .seccion-bloque {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 24px;
  }

  .seccion-bloque:last-of-type {
    border-bottom: none;
    padding-bottom: 0;
  }

  .seccion-titulo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.05rem;
    font-weight: 700;
    color: #1e293b;
  }

  .seccion-titulo span.material-symbols-outlined {
    color: #007aff;
    font-size: 22px;
  }

  .condicion-card {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 16px 20px;
    border-radius: 10px;
  }

  .label-switch {
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
  }

  .label-switch input {
    width: 20px;
    height: 20px;
    accent-color: #007aff;
    cursor: pointer;
  }

  .switch-texto {
    font-size: 0.95rem;
    font-weight: 600;
    color: #334155;
  }

  .grid-campos {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 18px;
  }

  .col-span-2 {
    grid-column: span 2;
  }

  .campo-grupo {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .campo-grupo label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
  }

  .input-con-icono {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-con-icono span.material-symbols-outlined {
    position: absolute;
    left: 12px;
    font-size: 20px;
    color: #94a3b8;
    pointer-events: none;
  }

  .input-con-icono input,
  .input-con-icono select {
    width: 100%;
    padding: 11px 14px 11px 40px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.95rem;
    background-color: #f8fafc;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .input-con-icono input:focus,
  .input-con-icono select:focus {
    border-color: #007aff;
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
  }

  .input-con-icono input:disabled,
  .input-con-icono select:disabled {
    background-color: #f1f5f9;
    color: #94a3b8;
    cursor: not-allowed;
    border-color: #e2e8f0;
  }

  .form-acciones {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    margin-top: 10px;
  }

  .btn-primario {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #007aff;
    color: white;
    border: none;
    padding: 12px 26px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background-color 0.2s, box-shadow 0.2s;
    box-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
  }

  .btn-primario:hover:not(:disabled) {
    background-color: #0062cc;
    box-shadow: 0 4px 6px rgba(0, 122, 255, 0.3);
  }

  .btn-secundario {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  .btn-secundario:hover:not(:disabled) {
    background-color: #e2e8f0;
    color: #0f172a;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .alerta-exito {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
    padding: 14px 18px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-weight: 500;
  }

  .alerta-error {
    display: flex;
    align-items: center;
    gap: 10px;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    color: #991b1b;
    padding: 14px 18px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-weight: 500;
  }

  .footer-landing-user {
    grid-area: footer;
    background-color: #007aff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 0.85rem;
  }

  @media (max-width: 768px) {
    .grid-campos {
      grid-template-columns: 1fr;
    }
    .col-span-2 {
      grid-column: span 1;
    }
  }
</style>
