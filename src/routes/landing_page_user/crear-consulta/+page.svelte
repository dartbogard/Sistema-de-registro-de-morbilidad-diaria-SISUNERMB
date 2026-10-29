<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    crearConsulta, 
    obtenerEspecialidades, 
    obtenerDoctoresPorEspecialidad 
  } from '$lib/queries/consultas';

  let usuarioActual: { id: number; nombre: string; rol: string } | null = null;

  let formulario: any = {
    especialidad_consulta: '',
    usuario_consulta: 1,
    ci_beneficiario_paciente: '',
    doctor_consulta: 1,
    fecha_consulta: '',
    diagnostico_consulta: '',
    tiene_reposo: false,
    fecha_inicio_suspension: '',
    fecha_final_suspension: ''
  };

  let especialidades: any[] = [];
  let doctores: any[] = [];
  let mensajeExito = '';
  let mensajeError = '';
  let cargando = false;

  onMount(async () => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
      if (usuarioActual) {
        formulario.usuario_consulta = Number(usuarioActual.id) || 1;
      }
    } else {
      goto('/');
    }

    try {
      especialidades = (await obtenerEspecialidades()) as any[];
      doctores = (await obtenerDoctoresPorEspecialidad()) as any[];
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  });

  async function alCambiarEspecialidad() {
    formulario.doctor_consulta = 1;
    if (formulario.especialidad_consulta) {
      doctores = (await obtenerDoctoresPorEspecialidad(Number(formulario.especialidad_consulta))) as any[];
    } else {
      doctores = (await obtenerDoctoresPorEspecialidad()) as any[];
    }
  }

  async function manejarRegistroConsulta(event: Event) {
    event.preventDefault();
    mensajeExito = '';
    mensajeError = '';
    cargando = true;

    try {
      await crearConsulta(formulario);
      mensajeExito = '¡Consulta médica y reposo registrados exitosamente!';
      formulario.ci_beneficiario_paciente = '';
      formulario.diagnostico_consulta = '';
      formulario.especialidad_consulta = '';
      formulario.fecha_consulta = '';
      formulario.doctor_consulta = 1;
      formulario.tiene_reposo = false;
      formulario.fecha_inicio_suspension = '';
      formulario.fecha_final_suspension = '';
    } catch (error: any) {
      console.error('Error al registrar consulta:', error);
      mensajeError = `Error al registrar consulta: ${error.message || error}`;
    } finally {
      cargando = false;
    }
  }

  function cerrarSesion() {
    localStorage.removeItem('usuario_sesion');
    goto('/');
  }
</script>

<svelte:head>
  <title>SISUNERMB - Registrar Consulta</title>
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
          <a href="/landing_page_user/crear-paciente" class="btn-menu-item">
            <span class="material-symbols-outlined">person</span>
            <span>Registrar Paciente</span>
          </a>
        </li>

        <li>
          <a href="/landing_page_user/crear-consulta" class="btn-menu-item activo">
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
        <h2>Registro de Consulta Médica</h2>
        <p class="subtitulo">Ingrese el diagnóstico y asigne el médico tratante para la atención del paciente.</p>
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

      <form on:submit={manejarRegistroConsulta} class="formulario-card">

        <div class="seccion-bloque">
          <h3 class="seccion-titulo">
            <span class="material-symbols-outlined">medical_information</span>
            <span>Datos de la Consulta</span>
          </h3>

          <div class="grid-campos">
            <!-- Cédula del Beneficiario / Paciente -->
            <div class="campo-grupo col-span-2">
              <label for="ci_beneficiario">Cédula del Paciente (Titular o Beneficiario) *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">badge</span>
                <input 
                  type="text" 
                  id="ci_beneficiario" 
                  bind:value={formulario.ci_beneficiario_paciente} 
                  placeholder="Ej: V-12345678" 
                  disabled={cargando}
                  required 
                />
              </div>
            </div>

            <!-- Especialidad -->
            <div class="campo-grupo">
              <label for="especialidad">Especialidad Médica *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">local_hospital</span>
                <select 
                  id="especialidad" 
                  bind:value={formulario.especialidad_consulta} 
                  on:change={alCambiarEspecialidad}
                  disabled={cargando}
                  required
                >
                  <option value="">-- Seleccione especialidad --</option>
                  {#each especialidades as esp}
                    <option value={esp.id_especialidad}>{esp.tipo_especialidad}</option>
                  {/each}
                </select>
              </div>
            </div>

            <!-- Doctor Tratante -->
            <div class="campo-grupo">
              <label for="doctor">Doctor Tratante *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">stethoscope</span>
                <select 
                  id="doctor" 
                  bind:value={formulario.doctor_consulta} 
                  disabled={cargando}
                  required
                >
                  <option value="">-- Seleccione doctor --</option>
                  {#each doctores as doc}
                    <option value={doc.id_doctor}>{doc.nombre_completo}</option>
                  {/each}
                </select>
              </div>
            </div>

            <!-- Fecha de Consulta -->
            <div class="campo-grupo col-span-2">
              <label for="fecha">Fecha de la Consulta *</label>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">calendar_today</span>
                <input 
                  type="date" 
                  id="fecha" 
                  bind:value={formulario.fecha_consulta} 
                  disabled={cargando}
                  required 
                />
              </div>
            </div>

            <!-- Diagnóstico -->
            <div class="campo-grupo col-span-2">
              <label for="diagnostico">Diagnóstico Médico / Motivo *</label>
              <textarea 
                id="diagnostico" 
                bind:value={formulario.diagnostico_consulta} 
                rows="4" 
                placeholder="Describa el diagnóstico, observaciones o tratamiento indicado..."
                disabled={cargando}
                required
              ></textarea>
            </div>
          </div>
        </div>

        <!-- SECCIÓN DE REPOSO MÉDICO -->
        <div class="seccion-bloque">
          <h3 class="seccion-titulo">
            <span class="material-symbols-outlined">hotel</span>
            <span>Reposo Médico y Suspensión</span>
          </h3>

          <div class="reposo-card">
            <label class="label-switch">
              <input 
                type="checkbox" 
                bind:checked={formulario.tiene_reposo} 
                disabled={cargando}
              />
              <span class="switch-ui"></span>
              <span class="switch-texto">¿Aplica Reposo Médico / Suspensión Laboral?</span>
            </label>

            {#if formulario.tiene_reposo}
              <div class="grid-campos grid-reposo-fechas">
                <div class="campo-grupo">
                  <label for="fecha_inicio">Fecha Inicio del Reposo *</label>
                  <div class="input-con-icono">
                    <span class="material-symbols-outlined">event_available</span>
                    <input 
                      type="date" 
                      id="fecha_inicio" 
                      bind:value={formulario.fecha_inicio_suspension} 
                      required={formulario.tiene_reposo}
                      disabled={cargando}
                    />
                  </div>
                </div>

                <div class="campo-grupo">
                  <label for="fecha_fin">Fecha Final del Reposo *</label>
                  <div class="input-con-icono">
                    <span class="material-symbols-outlined">event_busy</span>
                    <input 
                      type="date" 
                      id="fecha_fin" 
                      bind:value={formulario.fecha_final_suspension} 
                      required={formulario.tiene_reposo}
                      disabled={cargando}
                    />
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>

        <!-- Botón Guardar -->
        <div class="form-acciones">
          <button type="submit" class="btn-primario" disabled={cargando}>
            <span class="material-symbols-outlined">{cargando ? 'hourglass_top' : 'save'}</span>
            <span>{cargando ? 'Guardando...' : 'Guardar Consulta y Reposo'}</span>
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
    max-width: 850px;
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
  .input-con-icono select:focus,
  textarea:focus {
    border-color: #007aff;
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
  }

  textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.95rem;
    background-color: #f8fafc;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
    resize: vertical;
  }

  .reposo-card {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 18px 20px;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .label-switch {
    display: flex;
    align-items: center;
    gap: 12px;
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

  .grid-reposo-fechas {
    border-top: 1px solid #e2e8f0;
    padding-top: 16px;
  }

  .form-acciones {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }

  .btn-primario {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #007aff;
    color: white;
    border: none;
    padding: 12px 28px;
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
