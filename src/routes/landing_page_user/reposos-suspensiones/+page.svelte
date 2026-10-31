<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { 
    obtenerTodasLasSuspensiones, 
    obtenerSuspensionesPorCedula,
    type SuspensionDetallada 
  } from '$lib/queries/suspensiones';
  import { generarPDFSuspensiones } from '$lib/utils/reporte-suspensiones-pdf';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;
  
  // Datos principales
  let todasSuspensiones: SuspensionDetallada[] = [];
  let repososPacienteIndividual: SuspensionDetallada[] = [];
  let cedulaBusqueda = '';
  
  // Filtros reactivos
  let filtroEstado: 'todas' | 'activas' | 'reincidentes' = 'todas';
  let busquedaTexto = '';
  let fechaInicioFiltro = '';
  let fechaFinFiltro = '';

  // Estados de carga y mensajes
  let cargando = false;
  let cargandoIndividual = false;
  let exportandoPDF = false;
  let mensaje = '';
  let mensajeExito = '';

  // Modal PDF
  let mostrarModalPDF = false;
  let urlPDFModal = '';
  let nombreArchivoPDF = '';

  onMount(async () => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
      await cargarSuspensiones();
    } else {
      goto('/');
    }
  });

  async function cargarSuspensiones() {
    cargando = true;
    mensaje = '';
    try {
      const filtros: { fechaInicio?: string; fechaFin?: string } = {};
      if (fechaInicioFiltro) filtros.fechaInicio = fechaInicioFiltro;
      if (fechaFinFiltro) filtros.fechaFin = fechaFinFiltro;

      todasSuspensiones = await obtenerTodasLasSuspensiones(filtros);
    } catch (error) {
      console.error('Error al cargar suspensiones:', error);
      mensaje = 'Ocurrió un error al cargar el listado de suspensiones de la base de datos.';
    } finally {
      cargando = false;
    }
  }

  async function buscarRepososIndividual() {
    if (!cedulaBusqueda.trim()) {
      mensaje = 'Por favor ingrese un número de cédula para consultar el historial del paciente.';
      repososPacienteIndividual = [];
      return;
    }

    cargandoIndividual = true;
    mensaje = '';
    try {
      repososPacienteIndividual = await obtenerSuspensionesPorCedula(cedulaBusqueda);
      if (repososPacienteIndividual.length === 0) {
        mensaje = `No se encontraron registros de reposos o suspensiones médicas para la cédula ${cedulaBusqueda}.`;
      }
    } catch (error) {
      console.error('Error al buscar reposos por cédula:', error);
      mensaje = 'Error al consultar la base de datos para la cédula especificada.';
    } finally {
      cargandoIndividual = false;
    }
  }

  function limpiarFiltroFechas() {
    fechaInicioFiltro = '';
    fechaFinFiltro = '';
    cargarSuspensiones();
  }

  function formatearFecha(fechaStr: string | null | undefined): string {
    if (!fechaStr) return 'N/D';
    const soloFecha = fechaStr.includes('T') ? fechaStr.split('T')[0] : fechaStr.split(' ')[0];
    const partes = soloFecha.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return soloFecha;
  }

  // Filtrado reactivo en memoria
  $: suspensionesFiltradas = todasSuspensiones.filter(item => {
    if (filtroEstado === 'activas' && !item.es_activa) return false;
    if (filtroEstado === 'reincidentes' && Number(item.total_suspensiones_historicas || 0) < 2) return false;

    if (busquedaTexto.trim()) {
      const q = busquedaTexto.toLowerCase().trim();
      const pac = (item.nombre_completo_paciente || '').toLowerCase();
      const ci = (item.cedula_paciente || '').toLowerCase();
      const doc = (item.doctor || '').toLowerCase();
      const esp = (item.tipo_especialidad || '').toLowerCase();
      const diag = (item.diagnostico_consulta || '').toLowerCase();

      if (!pac.includes(q) && !ci.includes(q) && !doc.includes(q) && !esp.includes(q) && !diag.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Métricas reactivas
  $: totalGeneral = todasSuspensiones.length;
  $: totalActivas = todasSuspensiones.filter(s => s.es_activa).length;
  $: totalReincidentesRegistros = todasSuspensiones.filter(s => Number(s.total_suspensiones_historicas || 0) >= 2).length;
  $: pacientesReincidentesUnicos = new Set(
    todasSuspensiones
      .filter(s => Number(s.total_suspensiones_historicas || 0) >= 2)
      .map(s => s.cedula_paciente)
  ).size;
  $: totalDiasAcumulados = todasSuspensiones.reduce((acc, s) => acc + Math.max(1, Number(s.dias_reposo || 1)), 0);

  // Generación y previsualización de PDF
  async function exportarReportePDF(listaParaPDF?: SuspensionDetallada[], tituloPersonalizado?: string) {
    const datosAImprimir = listaParaPDF || suspensionesFiltradas;
    if (datosAImprimir.length === 0) {
      mensaje = 'No hay registros de suspensiones para generar el reporte PDF con los filtros actuales.';
      return;
    }

    exportandoPDF = true;
    mensaje = '';
    mensajeExito = '';

    try {
      let criterioFiltro = 'Listado General Completo';
      if (filtroEstado === 'activas') criterioFiltro = 'Solo Suspensiones Activas Actualmente';
      if (filtroEstado === 'reincidentes') criterioFiltro = 'Solo Casos Reincidentes con Múltiples Suspensiones';

      const resultado = await generarPDFSuspensiones({
        tituloReporte: tituloPersonalizado || 'REPORTE OFICIAL DE CONTROL DE REPOSOS Y SUSPENSIONES MÉDICAS',
        fechaInicio: fechaInicioFiltro,
        fechaFin: fechaFinFiltro,
        usuarioGenerador: usuarioActual?.nombre ? `${usuarioActual.nombre} (Personal Administrativo SISUNERMB)` : 'Personal Administrativo SISUNERMB',
        suspensiones: datosAImprimir,
        filtroAplicado: criterioFiltro
      });

      urlPDFModal = resultado.blobUrl;
      nombreArchivoPDF = resultado.nombreArchivo;
      mostrarModalPDF = true;

      if (resultado.rutaGuardada) {
        mensajeExito = `¡Reporte guardado exitosamente en Descargas! (${resultado.nombreArchivo})`;
      } else {
        mensajeExito = '¡Reporte generado con éxito! Puede visualizarlo e imprimirlo en el visor.';
      }
    } catch (error) {
      console.error('Error al generar el PDF de suspensiones:', error);
      mensaje = 'Ocurrió un error al generar el archivo PDF de suspensiones.';
    } finally {
      exportandoPDF = false;
    }
  }

  function cerrarModalPDF() {
    mostrarModalPDF = false;
  }

  function imprimirPDFIframe() {
    const iframe = document.getElementById('iframe-visor-pdf-susp') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  }
</script>

<svelte:head>
  <title>Control de Reposos y Suspensiones – SISUNERMB</title>
</svelte:head>

<Navbar />

<div class="div-grid-wrapper">
  <Sidebar moduloActivo="reposos-suspensiones" {usuarioActual} />

  <main class="main-landing-user">
    <div class="contenido-modulo">
      
      <!-- Encabezado con Botón de Exportación PDF -->
      <div class="header-modulo-flex">
        <div class="header-seccion">
          <h2>Control de Reposos y Suspensiones Médicas</h2>
          <p class="subtitulo">Seguimiento institucional de reposos otorgados, detección de casos reincidentes y emisión de reportes oficiales.</p>
        </div>

        <button 
          type="button" 
          class="btn-exportar-pdf-main" 
          on:click={() => exportarReportePDF()}
          disabled={exportandoPDF || suspensionesFiltradas.length === 0}
          title="Descargar o imprimir reporte PDF oficial"
        >
          <span class="material-symbols-outlined">{exportandoPDF ? 'progress_activity' : 'picture_as_pdf'}</span>
          <span>{exportandoPDF ? 'Generando PDF...' : 'Imprimir Reporte PDF'}</span>
        </button>
      </div>

      <!-- Métricas y Alertas de Reincidencia (KPIs) -->
      <div class="grid-resumen-metricas">
        <div class="card-metrica">
          <div class="icono-metrica total">
            <span class="material-symbols-outlined">event_busy</span>
          </div>
          <div class="info-metrica">
            <span class="metrica-numero">{totalGeneral}</span>
            <span class="metrica-etiqueta">Total Registros</span>
          </div>
        </div>

        <div class="card-metrica">
          <div class="icono-metrica activas">
            <span class="material-symbols-outlined">check_circle</span>
          </div>
          <div class="info-metrica">
            <span class="metrica-numero">{totalActivas}</span>
            <span class="metrica-etiqueta">Activas Actualmente</span>
          </div>
        </div>

        <div class="card-metrica reincidentes-card" class:alerta-activa={pacientesReincidentesUnicos > 0}>
          <div class="icono-metrica reincidentes">
            <span class="material-symbols-outlined">warning</span>
          </div>
          <div class="info-metrica">
            <span class="metrica-numero">{pacientesReincidentesUnicos}</span>
            <span class="metrica-etiqueta">Pacientes Reincidentes</span>
            <span class="metrica-sub">{totalReincidentesRegistros} suspensiones acumuladas</span>
          </div>
        </div>

        <div class="card-metrica">
          <div class="icono-metrica dias">
            <span class="material-symbols-outlined">date_range</span>
          </div>
          <div class="info-metrica">
            <span class="metrica-numero">{totalDiasAcumulados}</span>
            <span class="metrica-etiqueta">Días de Reposo Otorgados</span>
          </div>
        </div>
      </div>

      <!-- Alertas de éxito o error -->
      {#if mensajeExito}
        <div class="alerta-exito">
          <span class="material-symbols-outlined">check_circle</span>
          <p>{mensajeExito}</p>
        </div>
      {/if}

      {#if mensaje}
        <div class="alerta-mensaje">
          <span class="material-symbols-outlined">info</span>
          <p>{mensaje}</p>
        </div>
      {/if}

      <!-- Buscador Individual por Cédula con Alerta Automática de Reincidencia -->
      <div class="buscador-card">
        <div class="buscador-header">
          <span class="material-symbols-outlined icono-seccion">person_search</span>
          <h3 class="card-titulo">Consultar Historial Individual de un Paciente</h3>
        </div>
        
        <form on:submit|preventDefault={buscarRepososIndividual} class="buscador-container">
          <div class="input-grupo-ci">
            <label for="ci_reposo">Cédula de Identidad (Titular o Beneficiario):</label>
            <div class="input-con-icono">
              <span class="material-symbols-outlined">badge</span>
              <input 
                id="ci_reposo"
                type="text" 
                placeholder="Ej. 12345678" 
                bind:value={cedulaBusqueda} 
                disabled={cargandoIndividual}
              />
            </div>
          </div>
          <button type="submit" disabled={cargandoIndividual} class="btn-buscar">
            <span class="material-symbols-outlined">{cargandoIndividual ? 'progress_activity' : 'search'}</span>
            <span>{cargandoIndividual ? 'Consultando...' : 'Consultar Reposos'}</span>
          </button>
        </form>

        <!-- Resultados Individuales y Alerta de Reincidencia -->
        {#if repososPacienteIndividual.length > 0}
          <div class="resultado-individual-bloque">
            <!-- ALERTA DESTACADA DE REINCIDENCIA INDIVIDUAL -->
            {#if repososPacienteIndividual.length >= 2}
              <div class="banner-alerta-reincidente">
                <div class="icono-alerta-wrapper">
                  <span class="material-symbols-outlined">warning</span>
                </div>
                <div class="texto-alerta">
                  <h4>¡ALERTA DE REINCIDENCIA DETECTADA!</h4>
                  <p>
                    El paciente <strong>{repososPacienteIndividual[0].nombre_completo_paciente}</strong> (C.I. {repososPacienteIndividual[0].cedula_paciente}) es 
                    <strong>REINCIDENTE</strong> con un total de <strong>{repososPacienteIndividual.length} suspensiones médicas</strong> registradas en el sistema.
                  </p>
                </div>
                <button 
                  type="button" 
                  class="btn-imprimir-individual"
                  on:click={() => exportarReportePDF(repososPacienteIndividual, `HISTORIAL INDIVIDUAL DE SUSPENSIONES - PACIENTE ${repososPacienteIndividual[0].cedula_paciente}`)}
                >
                  <span class="material-symbols-outlined">print</span>
                  <span>Imprimir Historial del Paciente</span>
                </button>
              </div>
            {:else}
              <div class="banner-info-normal">
                <span class="material-symbols-outlined">info</span>
                <p>El paciente <strong>{repososPacienteIndividual[0].nombre_completo_paciente}</strong> registra únicamente <strong>1 suspensión médica</strong> (No reincidente).</p>
                <button 
                  type="button" 
                  class="btn-imprimir-individual"
                  on:click={() => exportarReportePDF(repososPacienteIndividual, `HISTORIAL INDIVIDUAL DE SUSPENSIONES - PACIENTE ${repososPacienteIndividual[0].cedula_paciente}`)}
                >
                  <span class="material-symbols-outlined">print</span>
                  <span>Imprimir</span>
                </button>
              </div>
            {/if}

            <div class="tabla-responsive individual-table">
              <table>
                <thead>
                  <tr>
                    <th>Fecha Consulta</th>
                    <th>Cédula</th>
                    <th>Paciente</th>
                    <th>Diagnóstico / Causa</th>
                    <th>Médico Tratante</th>
                    <th>Período de Reposo</th>
                    <th>Días</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {#each repososPacienteIndividual as item}
                    <tr>
                      <td>{formatearFecha(item.fecha_consulta)}</td>
                      <td class="texto-bold">{item.cedula_paciente}</td>
                      <td>{item.nombre_completo_paciente}</td>
                      <td class="col-diagnostico">{item.diagnostico_consulta}</td>
                      <td>{item.doctor} <span class="badge-esp-small">{item.tipo_especialidad}</span></td>
                      <td class="col-fechas">{formatearFecha(item.fecha_inicio_suspension)} al {formatearFecha(item.fecha_final_suspension)}</td>
                      <td class="texto-bold">{Math.max(1, Number(item.dias_reposo || 1))} d</td>
                      <td>
                        {#if item.es_activa}
                          <span class="badge-estado activa">En Curso</span>
                        {:else}
                          <span class="badge-estado concluida">Concluido</span>
                        {/if}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}
      </div>

      <!-- Barra de Filtros y Búsqueda para el Listado General -->
      <div class="toolbar-filtros-card">
        <!-- Pestañas de Filtro Rápido -->
        <div class="filtros-tabs">
          <button 
            type="button" 
            class="tab-filtro" 
            class:activo={filtroEstado === 'todas'}
            on:click={() => filtroEstado = 'todas'}
          >
            <span>Todas las Suspensiones</span>
            <span class="contador-tab">{totalGeneral}</span>
          </button>

          <button 
            type="button" 
            class="tab-filtro" 
            class:activo={filtroEstado === 'activas'}
            on:click={() => filtroEstado = 'activas'}
          >
            <span class="dot-verde"></span>
            <span>Activas Hoy</span>
            <span class="contador-tab">{totalActivas}</span>
          </button>

          <button 
            type="button" 
            class="tab-filtro tab-reincidentes" 
            class:activo={filtroEstado === 'reincidentes'}
            on:click={() => filtroEstado = 'reincidentes'}
          >
            <span class="material-symbols-outlined tab-icon-warn">warning</span>
            <span>Solo Reincidentes</span>
            <span class="contador-tab alerta">{totalReincidentesRegistros}</span>
          </button>
        </div>

        <!-- Filtros por Fechas y Búsqueda de Texto -->
        <div class="filtros-inputs-row">
          <div class="buscador-live-box">
            <span class="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Filtrar por paciente, cédula, diagnóstico o médico..." 
              bind:value={busquedaTexto}
            />
            {#if busquedaTexto}
              <button type="button" class="btn-clear-search" on:click={() => busquedaTexto = ''}>
                <span class="material-symbols-outlined">close</span>
              </button>
            {/if}
          </div>

          <div class="fechas-filtro-group">
            <div class="input-fecha-mini">
              <label for="fecha_ini">Desde:</label>
              <input type="date" id="fecha_ini" bind:value={fechaInicioFiltro} on:change={cargarSuspensiones} />
            </div>

            <div class="input-fecha-mini">
              <label for="fecha_fin">Hasta:</label>
              <input type="date" id="fecha_fin" bind:value={fechaFinFiltro} on:change={cargarSuspensiones} />
            </div>

            {#if fechaInicioFiltro || fechaFinFiltro}
              <button type="button" class="btn-reset-fechas" on:click={limpiarFiltroFechas} title="Restablecer rango de fechas">
                <span class="material-symbols-outlined">restart_alt</span>
                <span>Limpiar</span>
              </button>
            {/if}
          </div>
        </div>
      </div>

      <!-- Tabla Principal de Suspensiones -->
      <div class="tabla-container">
        <div class="tabla-header-info active-header">
          <div class="header-flex">
            <span class="material-symbols-outlined">table_view</span>
            <span>Listado de Suspensiones y Reposos Médicos</span>
          </div>
          <div class="info-badges-right">
            <span class="badge-contador">Mostrando: <strong>{suspensionesFiltradas.length}</strong> de {totalGeneral}</span>
          </div>
        </div>

        {#if cargando}
          <div class="empty-msg cargando-msg">
            <span class="material-symbols-outlined spin">progress_activity</span>
            <p>Cargando registros de reposos y suspensiones...</p>
          </div>
        {:else if suspensionesFiltradas.length === 0}
          <div class="empty-msg">
            <span class="material-symbols-outlined icono-vacio">inbox</span>
            <p>No se encontraron reposos o suspensiones médicas que coincidan con los filtros seleccionados.</p>
          </div>
        {:else}
          <div class="tabla-responsive">
            <table>
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Paciente</th>
                  <th>Diagnóstico / Motivo</th>
                  <th>Médico Tratante</th>
                  <th>Período Reposo</th>
                  <th>Días</th>
                  <th>Estado</th>
                  <th>Control de Reincidencia</th>
                </tr>
              </thead>
              <tbody>
                {#each suspensionesFiltradas as item}
                  {@const esReincidente = Number(item.total_suspensiones_historicas || 0) >= 2}
                  <tr class:fila-reincidente={esReincidente}>
                    <!-- Cédula (Garantizada no vacía) -->
                    <td class="texto-bold col-cedula">
                      {item.cedula_paciente}
                    </td>

                    <!-- Paciente -->
                    <td>
                      <div class="celda-paciente">
                        <span class="nombre-paciente">{item.nombre_completo_paciente}</span>
                        <span class="tipo-paciente-tag">{item.tipo_personal_paciente}{item.parentesco_paciente ? ` · ${item.parentesco_paciente}` : ''}</span>
                      </div>
                    </td>

                    <!-- Diagnóstico -->
                    <td class="col-diagnostico">
                      <span class="diagnostico-texto" title={item.diagnostico_consulta}>
                        {item.diagnostico_consulta}
                      </span>
                    </td>

                    <!-- Doctor y Especialidad -->
                    <td>
                      <div class="celda-doctor">
                        <span class="doctor-nombre">{item.doctor}</span>
                        <span class="badge-especialidad">{item.tipo_especialidad}</span>
                      </div>
                    </td>

                    <!-- Fechas -->
                    <td class="col-fechas">
                      <div class="fechas-rango">
                        <span>{formatearFecha(item.fecha_inicio_suspension)}</span>
                        <span class="flecha-fechas">→</span>
                        <span>{formatearFecha(item.fecha_final_suspension)}</span>
                      </div>
                    </td>

                    <!-- Días de Reposo -->
                    <td class="col-dias">
                      <span class="badge-dias">{Math.max(1, Number(item.dias_reposo || 1))} d</span>
                    </td>

                    <!-- Estado Activa / Concluida -->
                    <td class="col-estado">
                      {#if item.es_activa}
                        <span class="badge-estado activa">
                          <span class="dot-live"></span>
                          <span>Activa</span>
                        </span>
                      {:else}
                        <span class="badge-estado concluida">Concluido</span>
                      {/if}
                    </td>

                    <!-- ALERTA DE REINCIDENCIA EN LA TABLA -->
                    <td class="col-reincidencia">
                      {#if esReincidente}
                        <div class="badge-alerta-reincidente" title={`El paciente acumula ${item.total_suspensiones_historicas} suspensiones médicas en su historial.`}>
                          <span class="material-symbols-outlined icono-warn">warning</span>
                          <span>Reincidente ({item.total_suspensiones_historicas})</span>
                        </div>
                      {:else}
                        <span class="badge-sin-reincidencia">1er reposo</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>

    </div>
  </main>
</div>

<!-- Modal Visor e Impresor Oficial de Reportes PDF -->
{#if mostrarModalPDF}
  <div 
    class="modal-backdrop-pdf" 
    role="presentation"
    on:click|self={cerrarModalPDF}
    on:keydown={(e) => e.key === 'Escape' && cerrarModalPDF()}
  >
    <div class="modal-pdf-container">
      <div class="modal-pdf-header">
        <div class="modal-header-info">
          <span class="material-symbols-outlined icono-modal-pdf">picture_as_pdf</span>
          <div>
            <h3>Reporte Oficial de Reposos y Suspensiones SISUNERMB</h3>
            <p class="modal-pdf-subtitle">{nombreArchivoPDF}</p>
          </div>
        </div>

        <div class="modal-pdf-acciones">
          <button type="button" on:click={imprimirPDFIframe} class="btn-modal-imprimir">
            <span class="material-symbols-outlined">print</span>
            <span>Imprimir Documento</span>
          </button>

          <button type="button" on:click={cerrarModalPDF} class="btn-modal-cerrar">
            <span class="material-symbols-outlined">close</span>
            <span>Cerrar</span>
          </button>
        </div>
      </div>

      <div class="modal-pdf-body">
        <iframe 
          id="iframe-visor-pdf-susp" 
          src={urlPDFModal} 
          title="Visor Oficial de PDF SISUNERMB"
          class="iframe-pdf"
        ></iframe>
      </div>
    </div>
  </div>
{/if}

<Footer />

<style>
  .header-modulo-flex {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 22px;
    gap: 20px;
  }

  .btn-exportar-pdf-main {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #0b2545 0%, #0066cc 100%);
    color: #ffffff;
    border: none;
    padding: 11px 20px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 0.92rem;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 102, 204, 0.28);
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .btn-exportar-pdf-main:hover:not(:disabled) {
    background: linear-gradient(135deg, #081d36 0%, #0052a3 100%);
    box-shadow: 0 6px 18px rgba(0, 102, 204, 0.38);
    transform: translateY(-1px);
  }

  .btn-exportar-pdf-main:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* Grid de Métricas / KPIs */
  .grid-resumen-metricas {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 16px;
    margin-bottom: 22px;
  }

  .card-metrica {
    background: #ffffff;
    border-radius: 14px;
    padding: 18px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  .icono-metrica {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .icono-metrica span {
    font-size: 26px;
  }

  .icono-metrica.total {
    background: #eff6ff;
    color: #0066cc;
  }

  .icono-metrica.activas {
    background: #f0fdf4;
    color: #16a34a;
  }

  .icono-metrica.reincidentes {
    background: #fff7ed;
    color: #ea580c;
  }

  .icono-metrica.dias {
    background: #f8fafc;
    color: #475569;
    border: 1px solid #e2e8f0;
  }

  .info-metrica {
    display: flex;
    flex-direction: column;
  }

  .metrica-numero {
    font-family: 'Montserrat', sans-serif;
    font-size: 1.55rem;
    font-weight: 800;
    color: #0f172a;
    line-height: 1.1;
  }

  .metrica-etiqueta {
    font-size: 0.78rem;
    font-weight: 600;
    color: #64748b;
    margin-top: 2px;
  }

  .metrica-sub {
    font-size: 0.7rem;
    color: #ea580c;
    font-weight: 700;
    margin-top: 2px;
  }

  .card-metrica.reincidentes-card.alerta-activa {
    border-color: #fed7aa;
    background: linear-gradient(135deg, #ffffff 0%, #fffbf5 100%);
  }

  /* Buscador Individual por Cédula */
  .buscador-card {
    background: #ffffff;
    padding: 22px 24px;
    border-radius: 14px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    margin-bottom: 22px;
    border: 1px solid #e2e8f0;
  }

  .buscador-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .buscador-header .icono-seccion {
    color: #0066cc;
    font-size: 22px;
  }

  .card-titulo {
    font-size: 1.02rem;
    color: #1e293b;
    font-weight: 700;
    font-family: 'Montserrat', sans-serif;
  }

  .buscador-container {
    display: flex;
    gap: 14px;
    align-items: flex-end;
  }

  .input-grupo-ci {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .input-grupo-ci label {
    font-size: 0.82rem;
    font-weight: 600;
    color: #475569;
  }

  .input-con-icono {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-con-icono .material-symbols-outlined {
    position: absolute;
    left: 12px;
    color: #94a3b8;
    font-size: 20px;
    pointer-events: none;
  }

  .input-con-icono input {
    width: 100%;
    padding: 10px 14px 10px 40px;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.92rem;
    outline: none;
    transition: all 0.2s ease;
  }

  .input-con-icono input:focus {
    border-color: #007aff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
  }

  .btn-buscar {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #0066cc;
    color: #ffffff;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
    height: 42px;
  }

  .btn-buscar:hover:not(:disabled) {
    background: #0052a3;
  }

  /* Alerta Destacada de Reincidencia */
  .resultado-individual-bloque {
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px dashed #e2e8f0;
  }

  .banner-alerta-reincidente {
    background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
    border: 2px solid #f97316;
    border-radius: 12px;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.12);
  }

  .icono-alerta-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: #ea580c;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .icono-alerta-wrapper span {
    font-size: 26px;
  }

  .texto-alerta {
    flex: 1;
  }

  .texto-alerta h4 {
    font-family: 'Montserrat', sans-serif;
    font-size: 0.95rem;
    font-weight: 800;
    color: #9a3412;
    letter-spacing: 0.3px;
    margin-bottom: 2px;
  }

  .texto-alerta p {
    font-size: 0.84rem;
    color: #7c2d12;
    line-height: 1.4;
  }

  .btn-imprimir-individual {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #ffffff;
    color: #9a3412;
    border: 1.5px solid #ea580c;
    padding: 9px 16px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.84rem;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .btn-imprimir-individual:hover {
    background: #ea580c;
    color: #ffffff;
  }

  .banner-info-normal {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #166534;
    padding: 12px 18px;
    border-radius: 10px;
    margin-bottom: 14px;
    font-size: 0.88rem;
  }

  .banner-info-normal p {
    flex: 1;
    margin-left: 10px;
  }

  /* Toolbar de Filtros */
  .toolbar-filtros-card {
    background: #ffffff;
    border-radius: 14px;
    padding: 16px 20px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .filtros-tabs {
    display: flex;
    gap: 10px;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 12px;
    flex-wrap: wrap;
  }

  .tab-filtro {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 0.86rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .tab-filtro:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .tab-filtro.activo {
    background: #eff6ff;
    border-color: #0066cc;
    color: #0066cc;
    font-weight: 700;
  }

  .tab-filtro.tab-reincidentes.activo {
    background: #fff7ed;
    border-color: #ea580c;
    color: #c2410c;
  }

  .tab-icon-warn {
    font-size: 18px;
    color: #ea580c;
  }

  .dot-verde {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #16a34a;
  }

  .contador-tab {
    background: #e2e8f0;
    color: #334155;
    padding: 2px 7px;
    border-radius: 12px;
    font-size: 0.74rem;
    font-weight: 700;
  }

  .contador-tab.alerta {
    background: #fed7aa;
    color: #9a3412;
  }

  .filtros-inputs-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }

  .buscador-live-box {
    position: relative;
    flex: 1;
    min-width: 260px;
    display: flex;
    align-items: center;
  }

  .buscador-live-box .material-symbols-outlined {
    position: absolute;
    left: 12px;
    color: #94a3b8;
    font-size: 20px;
    pointer-events: none;
  }

  .buscador-live-box input {
    width: 100%;
    padding: 9px 34px 9px 38px;
    border: 1.5px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.88rem;
    outline: none;
    transition: all 0.2s ease;
  }

  .buscador-live-box input:focus {
    border-color: #007aff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.12);
  }

  .btn-clear-search {
    position: absolute;
    right: 8px;
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .fechas-filtro-group {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .input-fecha-mini {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.82rem;
    font-weight: 600;
    color: #475569;
  }

  .input-fecha-mini input {
    padding: 7px 10px;
    border: 1.5px solid #cbd5e1;
    border-radius: 6px;
    font-size: 0.82rem;
    outline: none;
  }

  .btn-reset-fechas {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    padding: 7px 12px;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-reset-fechas:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  /* Tabla Principal */
  .tabla-container {
    background: #ffffff;
    border-radius: 14px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
    overflow: hidden;
    border: 1px solid #e2e8f0;
  }

  .tabla-header-info {
    padding: 14px 20px;
    background: #0b2545;
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .header-flex {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 700;
    font-size: 0.95rem;
    font-family: 'Montserrat', sans-serif;
  }

  .badge-contador {
    font-size: 0.8rem;
    background: rgba(255, 255, 255, 0.15);
    padding: 4px 10px;
    border-radius: 6px;
  }

  .tabla-responsive {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.86rem;
  }

  th {
    background-color: #f8fafc;
    color: #475569;
    font-weight: 700;
    padding: 12px 14px;
    border-bottom: 2px solid #e2e8f0;
    white-space: nowrap;
    text-transform: uppercase;
    font-size: 0.74rem;
    letter-spacing: 0.5px;
  }

  td {
    padding: 13px 14px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: middle;
  }

  tr:hover td {
    background-color: #f8fafc;
  }

  /* Fila destacada si el paciente es reincidente */
  tr.fila-reincidente td {
    background-color: #fffaf0;
  }

  tr.fila-reincidente:hover td {
    background-color: #fff4e5;
  }

  .texto-bold {
    font-weight: 700;
  }

  .col-cedula {
    color: #0b2545;
    white-space: nowrap;
  }

  .celda-paciente {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .nombre-paciente {
    font-weight: 700;
    color: #0f172a;
  }

  .tipo-paciente-tag {
    font-size: 0.72rem;
    color: #64748b;
  }

  .col-diagnostico {
    max-width: 220px;
  }

  .diagnostico-texto {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 0.82rem;
    color: #334155;
    line-height: 1.35;
  }

  .celda-doctor {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .doctor-nombre {
    font-weight: 600;
    font-size: 0.84rem;
    color: #1e293b;
  }

  .badge-especialidad {
    font-size: 0.7rem;
    color: #0284c7;
    background: #e0f2fe;
    padding: 2px 7px;
    border-radius: 4px;
    display: inline-block;
    width: fit-content;
    font-weight: 600;
  }

  .badge-esp-small {
    font-size: 0.68rem;
    color: #0284c7;
    background: #e0f2fe;
    padding: 1px 5px;
    border-radius: 4px;
    margin-left: 4px;
  }

  .fechas-rango {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.82rem;
    white-space: nowrap;
  }

  .flecha-fechas {
    color: #94a3b8;
  }

  .col-dias {
    text-align: center;
  }

  .badge-dias {
    font-family: 'Montserrat', sans-serif;
    font-weight: 700;
    background: #f1f5f9;
    color: #334155;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.8rem;
    display: inline-block;
  }

  .badge-estado {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 9px;
    border-radius: 6px;
    font-size: 0.76rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .badge-estado.activa {
    background-color: #dcfce7;
    color: #15803d;
  }

  .dot-live {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #16a34a;
    box-shadow: 0 0 6px #16a34a;
  }

  .badge-estado.concluida {
    background-color: #f1f5f9;
    color: #64748b;
  }

  /* BADGE ALERTA DE REINCIDENCIA EN TABLA */
  .badge-alerta-reincidente {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    background-color: #ffedd5;
    border: 1px solid #fdba74;
    color: #c2410c;
    padding: 4px 10px;
    border-radius: 8px;
    font-size: 0.76rem;
    font-weight: 800;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(194, 65, 12, 0.1);
  }

  .badge-alerta-reincidente .icono-warn {
    font-size: 16px;
    color: #ea580c;
  }

  .badge-sin-reincidencia {
    font-size: 0.74rem;
    color: #94a3b8;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    padding: 3px 8px;
    border-radius: 6px;
  }

  .empty-msg {
    padding: 36px 20px;
    text-align: center;
    color: #64748b;
    font-size: 0.92rem;
  }

  .empty-msg.cargando-msg {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .icono-vacio {
    font-size: 40px;
    color: #cbd5e1;
    display: block;
    margin-bottom: 8px;
  }

  /* Modal de Visualización PDF */
  .modal-backdrop-pdf {
    position: fixed;
    inset: 0;
    background: rgba(11, 37, 69, 0.75);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .modal-pdf-container {
    background: #ffffff;
    border-radius: 16px;
    width: 95vw;
    max-width: 1100px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
    overflow: hidden;
  }

  .modal-pdf-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    background: #0b2545;
    color: #ffffff;
  }

  .modal-header-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .modal-header-info h3 {
    font-family: 'Montserrat', sans-serif;
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
  }

  .modal-pdf-subtitle {
    font-size: 0.78rem;
    color: #94a3b8;
    margin: 2px 0 0 0;
  }

  .icono-modal-pdf {
    font-size: 30px;
    color: #38bdf8;
  }

  .modal-pdf-acciones {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .btn-modal-imprimir {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #007aff;
    color: #ffffff;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 700;
    font-size: 0.86rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-modal-imprimir:hover {
    background: #0066d6;
  }

  .btn-modal-cerrar {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.12);
    color: #ffffff;
    border: none;
    padding: 8px 14px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.86rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-modal-cerrar:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .modal-pdf-body {
    flex: 1;
    background: #525659;
    padding: 0;
    overflow: hidden;
  }

  .iframe-pdf {
    width: 100%;
    height: 100%;
    border: none;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .header-modulo-flex {
      flex-direction: column;
    }
    .buscador-container {
      flex-direction: column;
      align-items: stretch;
    }
    .filtros-inputs-row {
      flex-direction: column;
      align-items: stretch;
    }
  }
</style>
