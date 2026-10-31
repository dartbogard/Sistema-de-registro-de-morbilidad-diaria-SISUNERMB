<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    crearConsulta, 
    obtenerEspecialidades, 
    obtenerDoctoresPorEspecialidad 
  } from '$lib/queries/consultas';
  import { buscarPacientePorCedula } from '$lib/queries/pacientes';
  import { verificarReposoActivoConDoctor, type ReposoActivoInfo } from '$lib/queries/suspensiones';
  import type { Paciente } from '$lib/types/paciente';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';

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

  // Estado de previsualización en vivo de paciente
  let pacientesCoincidentes: Paciente[] = [];
  let pacienteSeleccionado: Paciente | null = null;
  let buscandoPaciente: boolean = false;
  let timeoutBusqueda: any = null;
  let cedulaNoEncontrada: boolean = false;

  function manejarInputCedula() {
    clearTimeout(timeoutBusqueda);
    const cedula = (formulario.ci_beneficiario_paciente || '').trim();

    if (cedula.length < 4) {
      pacientesCoincidentes = [];
      pacienteSeleccionado = null;
      cedulaNoEncontrada = false;
      buscandoPaciente = false;
      return;
    }

    buscandoPaciente = true;
    cedulaNoEncontrada = false;

    timeoutBusqueda = setTimeout(async () => {
      try {
        const resultados = await buscarPacientePorCedula(cedula);
        pacientesCoincidentes = resultados;
        if (resultados.length > 0) {
          pacienteSeleccionado = resultados[0];
          cedulaNoEncontrada = false;
        } else {
          pacienteSeleccionado = null;
          cedulaNoEncontrada = true;
        }
      } catch (err) {
        console.error('Error buscando paciente en vivo:', err);
      } finally {
        buscandoPaciente = false;
      }
    }, 250);
  }

  function seleccionarPaciente(paciente: Paciente) {
    pacienteSeleccionado = paciente;
    formulario.ci_beneficiario_paciente = paciente.ci_beneficiario_paciente || paciente.ci_titular_paciente || formulario.ci_beneficiario_paciente;
  }

  function calcularEdad(fechaNacStr: string | null | undefined): string {
    if (!fechaNacStr) return '';
    try {
      const soloFecha = fechaNacStr.includes('T') ? fechaNacStr.split('T')[0] : fechaNacStr.split(' ')[0];
      const partes = soloFecha.split('-');
      if (partes.length !== 3) return '';
      const [y, m, d] = partes.map(Number);
      if (!y || !m || !d) return '';
      const hoy = new Date();
      let edad = hoy.getFullYear() - y;
      const mes = hoy.getMonth() + 1 - m;
      if (mes < 0 || (mes === 0 && hoy.getDate() < d)) {
        edad--;
      }
      return edad >= 0 ? `${edad} años` : '';
    } catch {
      return '';
    }
  }

  function formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
  }

  // Detección y bloqueo de reposos médicos activos con el mismo doctor
  let reposoActivoDetectado: ReposoActivoInfo | null = null;
  let verificandoReposo: boolean = false;

  async function verificarReposoActivoExistente() {
    const ci = (formulario.ci_beneficiario_paciente || '').trim();
    const docId = formulario.doctor_consulta;
    
    if (!formulario.tiene_reposo || !ci || !docId) {
      reposoActivoDetectado = null;
      return;
    }

    verificandoReposo = true;
    try {
      const resp = await verificarReposoActivoConDoctor(
        ci,
        docId,
        formulario.fecha_inicio_suspension || undefined
      );

      if (resp.tieneReposoActivo && resp.reposoActivo) {
        reposoActivoDetectado = resp.reposoActivo;
      } else {
        reposoActivoDetectado = null;
      }
    } catch (e) {
      console.error('Error al comprobar reposo activo:', e);
      reposoActivoDetectado = null;
    } finally {
      verificandoReposo = false;
    }
  }

  $: if (formulario.tiene_reposo || formulario.doctor_consulta || formulario.ci_beneficiario_paciente || formulario.fecha_inicio_suspension) {
    if (formulario.tiene_reposo && formulario.ci_beneficiario_paciente && formulario.doctor_consulta) {
      verificarReposoActivoExistente();
    } else {
      reposoActivoDetectado = null;
    }
  }

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
    formulario.doctor_consulta = '';
    if (formulario.especialidad_consulta) {
      doctores = (await obtenerDoctoresPorEspecialidad(formulario.especialidad_consulta)) as any[];
    } else {
      doctores = (await obtenerDoctoresPorEspecialidad()) as any[];
    }
  }

  async function manejarRegistroConsulta(event: Event) {
    event.preventDefault();
    mensajeExito = '';
    mensajeError = '';

    // Validar si hay reposo activo detectado con el mismo doctor
    if (formulario.tiene_reposo && reposoActivoDetectado) {
      mensajeError = `Restricción Institucional: El paciente ya cuenta con un reposo activo otorgado por el doctor ${reposoActivoDetectado.doctor} vigente hasta el ${formatearFecha(reposoActivoDetectado.fecha_final_suspension)}. No puede registrarse un reposo superpuesto con el mismo médico.`;
      return;
    }

    cargando = true;

    try {
      await crearConsulta(formulario);
      mensajeExito = '¡Consulta médica registrada exitosamente!';
      formulario.ci_beneficiario_paciente = '';
      formulario.diagnostico_consulta = '';
      formulario.especialidad_consulta = '';
      formulario.fecha_consulta = '';
      formulario.doctor_consulta = 1;
      formulario.tiene_reposo = false;
      formulario.fecha_inicio_suspension = '';
      formulario.fecha_final_suspension = '';
      pacienteSeleccionado = null;
      pacientesCoincidentes = [];
      cedulaNoEncontrada = false;
      reposoActivoDetectado = null;
    } catch (error: any) {
      console.error('Error al registrar consulta:', error);
      mensajeError = `Error al registrar consulta: ${error.message || error}`;
    } finally {
      cargando = false;
    }
  }
</script>

<svelte:head>
  <title>Consulta Diagnóstico – SISUNERMB</title>
</svelte:head>

<Navbar />

<div class="div-grid-wrapper">
  <Sidebar moduloActivo="crear-consulta" {usuarioActual} />

  <main class="main-landing-user">
    <div class="contenido-modulo">
      <div class="header-seccion">
        <h2>Registro de Consulta Médica</h2>
        <p class="subtitulo">Ingrese el diagnóstico médico del paciente y gestione la aplicación de reposos o suspensiones.</p>
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

        <!-- SECCIÓN DE DATOS DE CONSULTA -->
        <div class="seccion-bloque">
          <h3 class="seccion-titulo">
            <span class="material-symbols-outlined">medication</span>
            <span>Datos de la Consulta</span>
          </h3>

          <div class="grid-campos">
            <!-- Cédula del Beneficiario / Paciente con Previsualizador -->
            <div class="campo-grupo col-span-2">
              <div class="label-fila-flex">
                <label for="ci_beneficiario">Cédula del Paciente (Titular o Beneficiario) *</label>
                {#if buscandoPaciente}
                  <span class="badge-buscando">
                    <span class="material-symbols-outlined spinner-icon">sync</span>
                    Verificando paciente...
                  </span>
                {/if}
              </div>
              <div class="input-con-icono">
                <span class="material-symbols-outlined">badge</span>
                <input 
                  type="text" 
                  id="ci_beneficiario" 
                  bind:value={formulario.ci_beneficiario_paciente} 
                  on:input={manejarInputCedula}
                  placeholder="Ej: 27691941 o V-27691941" 
                  disabled={cargando}
                  required 
                />
              </div>

              <!-- TARJETA PREVISUALIZADORA DE PACIENTE VERIFICADO -->
              {#if pacienteSeleccionado}
                <div class="previsualizador-card anim-fade-in">
                  <div class="previsualizador-top">
                    <div class="verificado-pill">
                      <span class="material-symbols-outlined">verified</span>
                      <span>Paciente Verificado</span>
                    </div>
                    <span class="condicion-tag {pacienteSeleccionado.ci_beneficiario_paciente && pacienteSeleccionado.ci_beneficiario_paciente !== pacienteSeleccionado.ci_titular_paciente ? 'tag-beneficiario' : 'tag-titular'}">
                      {pacienteSeleccionado.ci_beneficiario_paciente && pacienteSeleccionado.ci_beneficiario_paciente !== pacienteSeleccionado.ci_titular_paciente
                        ? `BENEFICIARIO (${pacienteSeleccionado.parentesco_paciente || 'FAMILIAR'})`
                        : 'TITULAR UNERMB'}
                    </span>
                  </div>

                  <div class="previsualizador-datos-principales">
                    <div class="avatar-badge">
                      <span class="material-symbols-outlined">person</span>
                    </div>
                    <div class="paciente-titular-bloque">
                      <h4 class="nombre-paciente-destacado">{pacienteSeleccionado.nombre_completo_paciente}</h4>
                      <p class="cedula-info">
                        Cédula: <strong>{pacienteSeleccionado.ci_beneficiario_paciente || pacienteSeleccionado.ci_titular_paciente}</strong>
                        {#if pacienteSeleccionado.ci_beneficiario_paciente && pacienteSeleccionado.nombre_titular_paciente}
                          <span class="titular-asociado">&bull; Titular: {pacienteSeleccionado.nombre_titular_paciente} (C.I. {pacienteSeleccionado.ci_titular_paciente})</span>
                        {/if}
                      </p>
                    </div>
                  </div>

                  <div class="previsualizador-detalles-grid">
                    <div class="item-detalle">
                      <span class="lbl-item">Personal UNERMB:</span>
                      <span class="val-item">{pacienteSeleccionado.tipo_personal_paciente}</span>
                    </div>
                    <div class="item-detalle">
                      <span class="lbl-item">Condición Laboral:</span>
                      <span class="val-item">{pacienteSeleccionado.categoria_trabajador_paciente}</span>
                    </div>
                    <div class="item-detalle">
                      <span class="lbl-item">Sexo:</span>
                      <span class="val-item">{pacienteSeleccionado.sexo_paciente === 'M' ? 'Masculino (M)' : 'Femenino (F)'}</span>
                    </div>
                    {#if pacienteSeleccionado.fecha_nacimiento_paciente}
                      <div class="item-detalle">
                        <span class="lbl-item">Edad / Nacimiento:</span>
                        <span class="val-item">{calcularEdad(pacienteSeleccionado.fecha_nacimiento_paciente)} ({pacienteSeleccionado.fecha_nacimiento_paciente})</span>
                      </div>
                    {/if}
                  </div>

                  <!-- Selector alternativo si hay varios pacientes asociados a la cédula -->
                  {#if pacientesCoincidentes.length > 1}
                    <div class="varias-coincidencias-alerta">
                      <p class="alerta-mult-titulo">
                        <span class="material-symbols-outlined">group</span>
                        Se encontraron {pacientesCoincidentes.length} personas asociadas a esta cédula. Confirme a cuál corresponde la consulta:
                      </p>
                      <div class="chips-container">
                        {#each pacientesCoincidentes as pac}
                          <button 
                            type="button" 
                            class="chip-seleccion {pacienteSeleccionado.id_paciente === pac.id_paciente ? 'chip-seleccion-activo' : ''}"
                            on:click={() => seleccionarPaciente(pac)}
                          >
                            <span class="material-symbols-outlined chip-icon">{pacienteSeleccionado.id_paciente === pac.id_paciente ? 'check_circle' : 'radio_button_unchecked'}</span>
                            <span>{pac.nombre_completo_paciente} ({pac.parentesco_paciente || 'TITULAR'})</span>
                          </button>
                        {/each}
                      </div>
                    </div>
                  {/if}
                </div>
              {:else if cedulaNoEncontrada && formulario.ci_beneficiario_paciente.trim().length >= 4}
                <div class="previsualizador-no-encontrado anim-fade-in">
                  <span class="material-symbols-outlined alerta-icono">warning</span>
                  <div>
                    <h5 class="no-encontrado-titulo">No se encontró paciente con la cédula "{formulario.ci_beneficiario_paciente.trim()}"</h5>
                    <p class="no-encontrado-desc">Verifique que no haya ingresado un número erróneo. Si es un nuevo ingreso que no está en la base de datos de RRHH, puede registrarlo en el <a href="/landing_page_user/modulo-creación?tab=paciente" class="enlace-admin">Módulo Administrativo</a>.</p>
                  </div>
                </div>
              {/if}
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
              <label for="diagnostico">Diagnóstico Médico / Motivo de Consulta *</label>
              <textarea 
                id="diagnostico" 
                bind:value={formulario.diagnostico_consulta} 
                rows="4" 
                placeholder="Describa el diagnóstico clínico, observaciones o tratamiento indicado..."
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
            <span>Reposo Médico y Suspensión Laboral</span>
          </h3>

          <div class="reposo-card">
            <label class="label-switch">
              <input 
                type="checkbox" 
                bind:checked={formulario.tiene_reposo} 
                disabled={cargando}
              />
              <span class="switch-texto">¿Aplica Reposo Médico / Suspensión Laboral?</span>
            </label>

            {#if formulario.tiene_reposo}
              {#if reposoActivoDetectado}
                <div class="alerta-bloqueo-reposo">
                  <div class="icono-bloqueo">
                    <span class="material-symbols-outlined">block</span>
                  </div>
                  <div class="texto-bloqueo">
                    <h4 class="bloqueo-titulo">¡ATENCIÓN: REPOSO ACTIVO DETECTADO CON ESTE DOCTOR!</h4>
                    <p class="bloqueo-desc">
                      El paciente ya posee una suspensión o reposo médico <strong>ACTIVO</strong> otorgado por el 
                      <strong>{reposoActivoDetectado.doctor}</strong> vigente hasta el 
                      <strong>{formatearFecha(reposoActivoDetectado.fecha_final_suspension)}</strong> 
                      ({reposoActivoDetectado.dias_restantes >= 0 ? `${reposoActivoDetectado.dias_restantes} días vigentes restantes` : 'en curso'}).
                    </p>
                    <p class="bloqueo-regla">
                      ⚠️ <strong>Normativa Institucional UNERMB:</strong> No está permitido asignar un nuevo reposo médico superpuesto a un paciente con el mismo médico tratante mientras el anterior siga vigente. Si se trata de una cita de revisión o control de rutina, desactive la casilla de reposo para guardar la consulta médica.
                    </p>
                  </div>
                </div>
              {:else}
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
            {/if}
          </div>
        </div>

        <!-- Botón Guardar -->
        <div class="form-acciones">
          <button 
            type="submit" 
            class="btn-primario" 
            disabled={cargando || (formulario.tiene_reposo && Boolean(reposoActivoDetectado))}
            title={formulario.tiene_reposo && reposoActivoDetectado ? 'No se puede guardar: Reposo superpuesto activo detectado con este doctor' : ''}
          >
            <span class="material-symbols-outlined">{cargando ? 'hourglass_top' : 'save'}</span>
            <span>{cargando ? 'Guardando...' : 'Guardar Consulta y Reposo'}</span>
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
    top: 50%;
    transform: translateY(-50%);
    font-size: 20px;
    color: #94a3b8;
    pointer-events: none;
    z-index: 2;
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

  textarea {
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.92rem;
    background-color: #f8fafc;
    color: #0f172a;
    outline: none;
    font-family: inherit;
    resize: vertical;
    transition: all 0.2s ease;
  }

  textarea:focus {
    border-color: #007aff;
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
  }

  .reposo-card {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 16px 20px;
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

  .grid-reposo-fechas {
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
  }

  .form-acciones {
    display: flex;
    justify-content: flex-end;
    margin-top: 8px;
  }

  .btn-primario {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #0055b3 0%, #007aff 100%);
    color: #ffffff;
    border: none;
    padding: 12px 26px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.94rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 3px 8px rgba(0, 122, 255, 0.25);
  }

  .btn-primario:hover:not(:disabled) {
    background: linear-gradient(135deg, #004494 0%, #0066d6 100%);
    box-shadow: 0 5px 14px rgba(0, 122, 255, 0.35);
  }

  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .label-fila-flex {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }

  .badge-buscando {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #007aff;
  }

  .spinner-icon {
    font-size: 16px;
    animation: rotar 1s linear infinite;
  }

  @keyframes rotar {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .anim-fade-in {
    animation: fadeIn 0.25s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }

  /* Tarjeta de Previsualización */
  .previsualizador-card {
    background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
    border: 1.5px solid #7dd3fc;
    border-radius: 12px;
    padding: 16px 20px;
    margin-top: 10px;
    box-shadow: 0 4px 12px rgba(0, 122, 255, 0.08);
  }

  .previsualizador-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    border-bottom: 1px dashed #bae6fd;
    padding-bottom: 8px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .verificado-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: #10b981;
    color: #ffffff;
    font-size: 0.82rem;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
  }

  .verificado-pill span.material-symbols-outlined {
    font-size: 16px;
  }

  .condicion-tag {
    font-size: 0.8rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 6px;
    letter-spacing: 0.3px;
  }

  .tag-titular {
    background-color: #e0f2fe;
    color: #0369a1;
    border: 1px solid #7dd3fc;
  }

  .tag-beneficiario {
    background-color: #fef3c7;
    color: #92400e;
    border: 1px solid #fcd34d;
  }

  .previsualizador-datos-principales {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 12px;
  }

  .avatar-badge {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: linear-gradient(135deg, #0055b3 0%, #007aff 100%);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.25);
  }

  .avatar-badge span {
    font-size: 26px;
  }

  .paciente-titular-bloque {
    flex: 1;
  }

  .nombre-paciente-destacado {
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
    font-family: 'Montserrat', sans-serif;
    margin: 0;
  }

  .cedula-info {
    font-size: 0.88rem;
    color: #475569;
    margin-top: 3px;
  }

  .titular-asociado {
    margin-left: 6px;
    color: #0369a1;
    font-weight: 600;
  }

  .previsualizador-detalles-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
    background-color: rgba(255, 255, 255, 0.75);
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid rgba(226, 232, 240, 0.8);
  }

  .item-detalle {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .lbl-item {
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .val-item {
    font-size: 0.88rem;
    font-weight: 700;
    color: #1e293b;
  }

  .varias-coincidencias-alerta {
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px dashed #bae6fd;
  }

  .alerta-mult-titulo {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.84rem;
    font-weight: 600;
    color: #0369a1;
    margin-bottom: 8px;
  }

  .alerta-mult-titulo span {
    font-size: 18px;
  }

  .chips-container {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .chip-seleccion {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 20px;
    background-color: #ffffff;
    border: 1.5px solid #cbd5e1;
    font-size: 0.84rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .chip-seleccion:hover {
    background-color: #f0f9ff;
    border-color: #007aff;
    color: #007aff;
  }

  .chip-seleccion-activo {
    background-color: #007aff;
    border-color: #007aff;
    color: #ffffff;
    box-shadow: 0 2px 6px rgba(0, 122, 255, 0.3);
  }

  .chip-icon {
    font-size: 16px;
  }

  /* Alerta No Encontrado */
  .previsualizador-no-encontrado {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background-color: #fffbeb;
    border: 1.5px solid #fde68a;
    border-radius: 10px;
    padding: 14px 18px;
    margin-top: 10px;
  }

  .alerta-icono {
    font-size: 24px;
    color: #d97706;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .no-encontrado-titulo {
    font-size: 0.92rem;
    font-weight: 700;
    color: #92400e;
    margin: 0;
  }

  .no-encontrado-desc {
    font-size: 0.84rem;
    color: #78350f;
    margin-top: 4px;
    line-height: 1.4;
  }

  .enlace-admin {
    color: #0284c7;
    font-weight: 700;
    text-decoration: underline;
  }

  .enlace-admin:hover {
    color: #0369a1;
  }

  /* Alerta Bloqueo Reposo Superpuesto */
  .alerta-bloqueo-reposo {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%);
    border: 2px solid #ef4444;
    border-radius: 12px;
    padding: 18px 20px;
    margin-top: 14px;
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.12);
  }

  .icono-bloqueo {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: #dc2626;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .icono-bloqueo span {
    font-size: 26px;
  }

  .texto-bloqueo {
    flex: 1;
  }

  .bloqueo-titulo {
    font-family: 'Montserrat', sans-serif;
    font-size: 0.95rem;
    font-weight: 800;
    color: #991b1b;
    margin: 0 0 4px 0;
    letter-spacing: 0.3px;
  }

  .bloqueo-desc {
    font-size: 0.88rem;
    color: #7f1d1d;
    margin: 0 0 8px 0;
    line-height: 1.45;
  }

  .bloqueo-regla {
    font-size: 0.82rem;
    color: #991b1b;
    margin: 0;
    background: rgba(255, 255, 255, 0.7);
    padding: 8px 12px;
    border-radius: 6px;
    border-left: 3px solid #dc2626;
    line-height: 1.4;
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
