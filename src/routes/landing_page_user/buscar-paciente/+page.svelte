<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { buscarPacientePorCedula } from '$lib/queries/pacientes';
  import type { Paciente } from '$lib/types/paciente';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;
  let cedulaBusqueda: string = '';
  let resultadosPacientes: Paciente[] = [];
  let cargando: boolean = false;
  let mensajeError: string = '';

  onMount(() => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
    } else {
      goto('/');
    }
  });

  async function manejarBusqueda() {
    if (!cedulaBusqueda.trim()) {
      mensajeError = 'Por favor ingrese un número de cédula válido para buscar.';
      resultadosPacientes = [];
      return;
    }

    cargando = true;
    mensajeError = '';

    try {
      resultadosPacientes = await buscarPacientePorCedula(cedulaBusqueda);
      
      if (resultadosPacientes.length === 0) {
        mensajeError = 'No se encontró ningún paciente registrado con la cédula ingresada.';
      }
    } catch (error) {
      console.error('Error al realizar la búsqueda:', error);
      mensajeError = 'Ocurrió un error al consultar la base de datos.';
    } finally {
      cargando = false;
    }
  }
</script>

<svelte:head>
  <title>Búsqueda de Paciente – SISUNERMB</title>
</svelte:head>

<Navbar />

<div class="div-grid-wrapper">
  <Sidebar moduloActivo="buscar-paciente" {usuarioActual} />

  <main class="main-landing-user">
    <div class="contenido-modulo">
      <div class="header-seccion">
        <h2>Búsqueda de Pacientes</h2>
        <p class="subtitulo">Consulte los datos filiatorios, condición de titularidad y beneficiarios adscritos en el sistema.</p>
      </div>
      
      <div class="buscador-card">
        <form on:submit|preventDefault={manejarBusqueda} class="buscador-container">
          <div class="input-grupo">
            <span class="material-symbols-outlined icono-input">search</span>
            <input 
              type="text" 
              bind:value={cedulaBusqueda} 
              placeholder="Ingrese número de cédula del titular o beneficiario..." 
              disabled={cargando}
            />
          </div>
          <button 
            type="submit" 
            disabled={cargando}
            class="btn-buscar"
          >
            <span class="material-symbols-outlined">{cargando ? 'hourglass_top' : 'person_search'}</span>
            <span>{cargando ? 'Buscando...' : 'Buscar Paciente'}</span>
          </button>
        </form>
      </div>

      {#if mensajeError}
        <div class="alerta-mensaje">
          <span class="material-symbols-outlined">info</span>
          <p>{mensajeError}</p>
        </div>
      {/if}

      {#if resultadosPacientes.length > 0}
        <div class="tabla-container">
          <div class="tabla-header-info">
            <span class="material-symbols-outlined icono-tabla">groups</span>
            <span>Resultados encontrados: <strong>{resultadosPacientes.length}</strong></span>
          </div>
          <div class="tabla-responsive">
            <table>
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>Cédula Titular</th>
                  <th>Cédula Beneficiario</th>
                  <th>Parentesco</th>
                </tr>
              </thead>
              <tbody>
                {#each resultadosPacientes as paciente}
                  <tr>
                    <td class="texto-bold">{paciente.nombre_completo_paciente}</td>
                    <td>{paciente.ci_titular_paciente}</td>
                    <td>
                      {#if paciente.parentesco_paciente && paciente.parentesco_paciente.toLowerCase().includes('titular')}
                        <span class="badge-titular">Es Titular</span>
                      {:else}
                        {paciente.ci_beneficiario_paciente ?? 'Menor sin cédula'}
                      {/if}
                    </td>
                    <td>
                      <span class="badge-parentesco">{paciente.parentesco_paciente ?? 'Titular'}</span>
                    </td>
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

  .badge-parentesco {
    background-color: #eff6ff;
    color: #0284c7;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 700;
    border: 1px solid #bae6fd;
    white-space: nowrap;
  }

  .badge-titular {
    background-color: #f0fdf4;
    color: #16a34a;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 700;
    border: 1px solid #bbf7d0;
  }
</style>
