<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { obtenerHistorialPorCedula } from '$lib/queries/consultas';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;
  let busquedaPaciente = '';
  $: cedula = busquedaPaciente; // retrocompatibilidad
  let historial: any[] = [];
  let mensaje = '';
  let cargando = false;

  $: pacientesEnHistorial = Array.from(new Set(historial.map(h => h.nombre_completo_paciente)));

  onMount(() => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
    } else {
      goto('/');
    }
  });

  async function buscarHistorial() {
    const termino = busquedaPaciente.trim();
    if (!termino) {
      mensaje = 'Por favor ingrese la cédula o nombre y apellido del paciente para consultar su historial.';
      historial = [];
      return;
    }

    cargando = true;
    mensaje = '';

    try {
      const resultado = await obtenerHistorialPorCedula(termino);
      historial = resultado as any[];
      if (historial.length === 0) {
        mensaje = `No se encontraron registros médicos para "${termino}".`;
      }
    } catch (error) {
      console.error('Error al consultar historial:', error);
      mensaje = 'Ocurrió un error al consultar los registros en la base de datos.';
    } finally {
      cargando = false;
    }
  }

  function limpiarBusqueda() {
    busquedaPaciente = '';
    historial = [];
    mensaje = '';
  }

  function formatearFecha(fechaStr: string | null | undefined): string {
    if (!fechaStr) return 'N/D';
    try {
      const d = new Date(fechaStr);
      return d.toLocaleDateString('es-VE', { timeZone: 'America/Caracas', day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return fechaStr || 'N/D';
    }
  }

  function formatearHora(fechaStr: string | null | undefined): string {
    if (!fechaStr) return '';
    try {
      const d = new Date(fechaStr);
      return d.toLocaleTimeString('es-VE', { timeZone: 'America/Caracas', hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return '';
    }
  }
</script>

<svelte:head>
  <title>Historial de Paciente – SISUNERMB</title>
</svelte:head>

<Navbar />

<div class="div-grid-wrapper">
  <Sidebar moduloActivo="historial-paciente" {usuarioActual} />

  <main class="main-landing-user">
    <div class="contenido-modulo">
      <div class="header-seccion">
        <h2>Historial Médico del Paciente</h2>
        <p class="subtitulo">Consulte los registros de consultas diagnósticas, médicos tratantes y patologías por cédula o nombre y apellido.</p>
      </div>
      
      <div class="buscador-card">
        <form on:submit|preventDefault={buscarHistorial} class="buscador-container">
          <div class="input-grupo">
            <span class="material-symbols-outlined icono-input">person_search</span>
            <input 
              type="text" 
              bind:value={busquedaPaciente} 
              placeholder="Ingrese cédula o nombre y apellido del paciente (ej: 12345678 o Carlos Mendoza)..." 
              disabled={cargando}
            />
            {#if busquedaPaciente}
              <button 
                type="button" 
                class="btn-limpiar-historial" 
                on:click={limpiarBusqueda}
                title="Limpiar búsqueda"
              >
                <span class="material-symbols-outlined">close</span>
              </button>
            {/if}
          </div>
          <button type="submit" class="btn-buscar" disabled={cargando}>
            <span class="material-symbols-outlined">{cargando ? 'hourglass_top' : 'manage_search'}</span>
            <span>{cargando ? 'Consultando...' : 'Consultar Historial'}</span>
          </button>
        </form>
      </div>

      {#if mensaje}
        <div class="alerta-mensaje">
          <span class="material-symbols-outlined">info</span>
          <p>{mensaje}</p>
        </div>
      {/if}

      {#if historial.length > 0}
        <div class="tabla-container">
          <div class="tabla-header-info">
            <span class="material-symbols-outlined icono-tabla">clinical_notes</span>
            <span>
              Registros médicos encontrados: <strong>{historial.length}</strong>
              {#if pacientesEnHistorial.length > 1}
                &nbsp;—&nbsp;({pacientesEnHistorial.length} pacientes coincidentes)
              {/if}
            </span>
          </div>
          <div class="tabla-responsive">
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Paciente</th>
                  <th>Cédula</th>
                  <th>Especialidad</th>
                  <th>Doctor Tratante</th>
                  <th>Diagnóstico</th>
                </tr>
              </thead>
              <tbody>
                {#each historial as item}
                  <tr>
                    <td>
                      <div class="fecha-hora-badge">
                        <span class="fecha-texto">{item.fecha_formateada || formatearFecha(item.fecha_consulta)}</span>
                        <span class="hora-texto" title="Hora local oficial de Venezuela (VET)">
                          <span class="material-symbols-outlined icono-reloj">schedule</span>
                          {item.hora_formateada || formatearHora(item.fecha_creacion_consulta || item.fecha_consulta)}
                        </span>
                      </div>
                    </td>
                    <td class="texto-bold">{item.nombre_completo_paciente}</td>
                    <td>{item.ci_titular_paciente || item.ci_beneficiario_paciente}</td>
                    <td>
                      <span class="badge-especialidad">{item.tipo_especialidad}</span>
                    </td>
                    <td>{item.nombre_doctor}</td>
                    <td class="td-diagnostico">{item.diagnostico_consulta}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </div>
  </main>
</div>

<Footer />

<style>
  .buscador-card {
    background: #ffffff;
    padding: 22px 26px;
    border-radius: 14px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    margin-bottom: 22px;
    border: 1px solid #e2e8f0;
  }

  .buscador-container {
    display: flex;
    gap: 14px;
    align-items: center;
  }

  .input-grupo {
    position: relative;
    flex-grow: 1;
  }

  .icono-input {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    font-size: 20px;
    pointer-events: none;
    z-index: 2;
  }

  .buscador-container input {
    width: 100%;
    padding: 11px 38px 11px 44px !important;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.94rem;
    background-color: #f8fafc;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .btn-limpiar-historial {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: 50%;
    transition: all 0.2s;
    z-index: 2;
  }

  .btn-limpiar-historial:hover {
    color: #dc2626;
    background-color: #fee2e2;
  }

  .btn-limpiar-historial .material-symbols-outlined {
    font-size: 16px;
  }

  .buscador-container input:focus {
    border-color: #007aff;
    background-color: #ffffff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
  }

  .btn-buscar {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #0055b3 0%, #007aff 100%);
    color: white;
    border: none;
    padding: 11px 24px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.92rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 3px 8px rgba(0, 122, 255, 0.25);
    white-space: nowrap;
  }

  .btn-buscar:hover:not(:disabled) {
    background: linear-gradient(135deg, #004494 0%, #0066d6 100%);
    box-shadow: 0 5px 14px rgba(0, 122, 255, 0.35);
  }

  .btn-buscar:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .tabla-container {
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }

  .tabla-header-info {
    padding: 14px 22px;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    font-size: 0.9rem;
    color: #334155;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icono-tabla {
    color: #007aff;
    font-size: 20px;
  }

  .tabla-responsive {
    width: 100%;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  th {
    background-color: #f8fafc;
    color: #475569;
    padding: 14px 20px;
    font-weight: 700;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    border-bottom: 2px solid #e2e8f0;
  }

  td {
    padding: 15px 20px;
    color: #334155;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.92rem;
    vertical-align: middle;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background-color: #f8fafc;
  }

  .texto-bold {
    font-weight: 700;
    color: #0f172a;
  }

  .fecha-hora-badge {
    display: inline-flex;
    flex-direction: column;
    gap: 3px;
  }

  .fecha-texto {
    font-weight: 700;
    color: #0055b3;
    font-size: 0.88rem;
  }

  .hora-texto {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 0.78rem;
    font-weight: 600;
    color: #475569;
    background-color: #f1f5f9;
    padding: 2px 7px;
    border-radius: 4px;
    border: 1px solid #cbd5e1;
    width: fit-content;
  }

  .icono-reloj {
    font-size: 13px;
    color: #0284c7;
  }

  .badge-especialidad {
    background-color: #eff6ff;
    color: #0284c7;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 700;
    border: 1px solid #bae6fd;
    white-space: nowrap;
  }

  .td-diagnostico {
    max-width: 320px;
    color: #475569;
    line-height: 1.4;
  }
</style>
