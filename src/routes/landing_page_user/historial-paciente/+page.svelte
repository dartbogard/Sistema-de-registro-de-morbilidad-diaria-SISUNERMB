<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { obtenerHistorialPorCedula } from '$lib/queries/consultas';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;
  let cedula = '';
  let historial: any[] = [];
  let mensaje = '';
  let cargando = false;

  onMount(() => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
    } else {
      goto('/');
    }
  });

  async function buscarHistorial() {
    if (!cedula.trim()) {
      mensaje = 'Por favor ingrese una cédula válida para consultar el historial.';
      historial = [];
      return;
    }

    cargando = true;
    mensaje = '';

    try {
      const resultado = await obtenerHistorialPorCedula(cedula);
      historial = resultado as any[];
      if (historial.length === 0) {
        mensaje = 'No se encontraron registros médicos para la cédula ingresada.';
      }
    } catch (error) {
      console.error('Error al consultar historial:', error);
      mensaje = 'Ocurrió un error al consultar los registros en la base de datos.';
    } finally {
      cargando = false;
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
        <p class="subtitulo">Consulte los registros de consultas diagnósticas, médicos tratantes y patologías por número de cédula.</p>
      </div>
      
      <div class="buscador-card">
        <form on:submit|preventDefault={buscarHistorial} class="buscador-container">
          <div class="input-grupo">
            <span class="material-symbols-outlined icono-input">search</span>
            <input 
              type="text" 
              bind:value={cedula} 
              placeholder="Ingrese cédula del titular o beneficiario (ej: V-12345678)..." 
              disabled={cargando}
            />
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
            <span>Registros médicos encontrados: <strong>{historial.length}</strong></span>
          </div>
          <div class="tabla-responsive">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
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
                      <span class="badge-fecha">{item.fecha_consulta}</span>
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
  }

  .buscador-container input {
    width: 100%;
    padding: 11px 14px 11px 44px;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.94rem;
    background-color: #f8fafc;
    color: #0f172a;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
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

  .badge-fecha {
    background-color: #f1f5f9;
    color: #475569;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    white-space: nowrap;
    border: 1px solid #e2e8f0;
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
