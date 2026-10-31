<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { crearPaciente } from '$lib/queries/pacientes';
  import type { CrearPacienteInput } from '$lib/types/paciente';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';

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
      // Redirigir al Módulo Administrativo (pestaña Registrar Paciente)
      goto('/landing_page_user/modulo-creación?tab=paciente');
    } else {
      goto('/');
    }
  });

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
  <title>Registrar Paciente – SISUNERMB</title>
</svelte:head>

<Navbar />

<div class="div-grid-wrapper">
  <Sidebar moduloActivo="crear-paciente" {usuarioActual} />

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
            <span>Limpiar Formulario</span>
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

<Footer />

<style>
  .formulario-card {
    background: #ffffff;
    padding: 30px 32px;
    border-radius: 14px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .seccion-bloque {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 22px;
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
    font-family: 'Montserrat', sans-serif;
  }

  .seccion-titulo span.material-symbols-outlined {
    color: #007aff;
    font-size: 22px;
  }

  .condicion-card {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 14px 18px;
    border-radius: 10px;
  }

  .label-switch {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
  }

  .label-switch input {
    width: 18px;
    height: 18px;
    accent-color: #007aff;
    cursor: pointer;
  }

  .switch-texto {
    font-size: 0.92rem;
    font-weight: 600;
    color: #334155;
  }

  .grid-campos {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
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
    font-size: 0.83rem;
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
    padding: 10px 14px 10px 40px;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.92rem;
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
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
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
    gap: 14px;
    margin-top: 8px;
  }

  .btn-primario {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #0055b3 0%, #007aff 100%);
    color: #ffffff;
    border: none;
    padding: 11px 24px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.92rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 3px 8px rgba(0, 122, 255, 0.25);
  }

  .btn-primario:hover:not(:disabled) {
    background: linear-gradient(135deg, #004494 0%, #0066d6 100%);
    box-shadow: 0 5px 14px rgba(0, 122, 255, 0.35);
  }

  .btn-secundario {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: #f1f5f9;
    color: #475569;
    border: 1px solid #cbd5e1;
    padding: 11px 18px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.92rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secundario:hover:not(:disabled) {
    background-color: #e2e8f0;
    color: #0f172a;
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
