<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { obtenerReporteMorbilidad, obtenerConsultasDetalladas } from '$lib/queries/consultas';
  import { 
    generarPDFMorbilidad, 
    generarPDFMorbilidadNumerica, 
    type ItemMorbilidad, 
    type ConsultaDetallada 
  } from '$lib/utils/reporte-pdf';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;
  let fechaInicio = '';
  let fechaFin = '';
  let filtroBusquedaPaciente = '';
  let reporteMorbilidad: ItemMorbilidad[] = [];
  let consultasDetalladas: ConsultaDetallada[] = [];
  let tabActiva: 'resumen' | 'detalle' = 'resumen';
  let lapsoActivo: 'diario' | 'semanal' | 'mensual' | 'anual' | 'total' | null = 'diario';
  let mensaje = '';
  let mensajeExito = '';
  let cargando = false;
  let exportandoPDF = false;

  // Estado del visor modal de PDF
  let mostrarModalPDF = false;
  let urlPDFModal = '';
  let nombreArchivoPDF = '';

  $: totalCasos = reporteMorbilidad.reduce((acc, item) => acc + Number(item.total_casos || 0), 0);

  function obtenerFechaHoyVenezuela(): string {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(new Date()); // Retorna "YYYY-MM-DD"
  }

  function obtenerFechaDiasAtrasVenezuela(dias: number): string {
    const d = new Date();
    d.setDate(d.getDate() - dias);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Caracas',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(d);
  }

  onMount(() => {
    const sesion = localStorage.getItem('usuario_sesion');
    if (sesion) {
      usuarioActual = JSON.parse(sesion);
      // Auto-cargar la morbilidad diaria (de hoy en Venezuela) al entrar al módulo
      seleccionarLapso('diario');
    } else {
      goto('/');
    }
  });

  function seleccionarLapso(lapso: 'diario' | 'semanal' | 'mensual' | 'anual' | 'total') {
    lapsoActivo = lapso;
    const hoyStr = obtenerFechaHoyVenezuela();

    if (lapso === 'diario') {
      fechaInicio = hoyStr;
      fechaFin = hoyStr;
    } else if (lapso === 'semanal') {
      fechaInicio = obtenerFechaDiasAtrasVenezuela(6);
      fechaFin = hoyStr;
    } else if (lapso === 'mensual') {
      const [anio, mes] = hoyStr.split('-');
      fechaInicio = `${anio}-${mes}-01`;
      fechaFin = hoyStr;
    } else if (lapso === 'anual') {
      const [anio] = hoyStr.split('-');
      fechaInicio = `${anio}-01-01`;
      fechaFin = hoyStr;
    } else if (lapso === 'total') {
      fechaInicio = '';
      fechaFin = '';
    }

    generarReporte();
  }

  function cerrarSesion() {
    localStorage.removeItem('usuario_sesion');
    goto('/');
  }

  function formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
  }

  async function generarReporte() {
    // Si ambas fechas están definidas, validar orden cronológico
    if (fechaInicio && fechaFin && new Date(fechaInicio) > new Date(fechaFin)) {
      mensaje = 'La fecha de inicio no puede ser posterior a la fecha final.';
      reporteMorbilidad = [];
      consultasDetalladas = [];
      return;
    }

    cargando = true;
    mensaje = '';
    mensajeExito = '';

    try {
      const [datosMorbilidad, datosDetalle] = await Promise.all([
        obtenerReporteMorbilidad(fechaInicio, fechaFin, filtroBusquedaPaciente) as Promise<ItemMorbilidad[]>,
        obtenerConsultasDetalladas(fechaInicio, fechaFin, filtroBusquedaPaciente) as Promise<ConsultaDetallada[]>
      ]);

      reporteMorbilidad = datosMorbilidad;
      consultasDetalladas = datosDetalle;
      
      if (reporteMorbilidad.length === 0) {
        if (filtroBusquedaPaciente.trim()) {
          mensaje = `No se registraron atenciones médicas para "${filtroBusquedaPaciente.trim()}" en el período consultado.`;
        } else if (lapsoActivo === 'diario') {
          mensaje = 'No se registran atenciones médicas para el día de hoy hasta el momento. Puede presionar "Semanal", "Mensual" o "Histórico Total" para ver la morbilidad acumulada.';
        } else {
          mensaje = 'No se encontraron registros de morbilidad para el rango de fechas seleccionado.';
        }
      }
    } catch (error) {
      console.error('Error al generar el reporte de morbilidad:', error);
      mensaje = 'Ocurrió un error al consultar la base de datos.';
    } finally {
      cargando = false;
    }
  }

  async function descargarReportePDF() {
    if (reporteMorbilidad.length === 0) {
      mensaje = 'No hay datos disponibles para generar el reporte en PDF.';
      return;
    }

    try {
      exportandoPDF = true;
      mensaje = '';
      mensajeExito = '';

      const resultado = await generarPDFMorbilidad({
        fechaInicio,
        fechaFin,
        usuarioGenerador: usuarioActual?.nombre || 'Personal Administrativo SISUNERMB',
        morbilidad: reporteMorbilidad,
        consultasDetalladas,
        filtroPaciente: filtroBusquedaPaciente.trim() || undefined
      });

      urlPDFModal = resultado.blobUrl;
      nombreArchivoPDF = resultado.nombreArchivo;
      mostrarModalPDF = true;

      if (resultado.rutaGuardada) {
        mensajeExito = `¡Reporte oficial guardado exitosamente en Descargas! (${resultado.nombreArchivo})`;
      } else {
        mensajeExito = `¡Reporte oficial generado exitosamente! Puede visualizarlo o imprimirlo en el visor.`;
      }
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      mensaje = 'Ocurrió un error al generar el archivo PDF.';
    } finally {
      exportandoPDF = false;
    }
  }

  async function descargarReporteNumericoPDF() {
    if (reporteMorbilidad.length === 0) {
      mensaje = 'No hay datos disponibles para generar el reporte numérico en PDF.';
      return;
    }

    try {
      exportandoPDF = true;
      mensaje = '';
      mensajeExito = '';

      const resultado = await generarPDFMorbilidadNumerica({
        fechaInicio,
        fechaFin,
        usuarioGenerador: usuarioActual?.nombre || 'Personal Administrativo SISUNERMB',
        morbilidad: reporteMorbilidad,
        filtroPaciente: filtroBusquedaPaciente.trim() || undefined
      });

      urlPDFModal = resultado.blobUrl;
      nombreArchivoPDF = resultado.nombreArchivo;
      mostrarModalPDF = true;

      if (resultado.rutaGuardada) {
        mensajeExito = `¡Reporte estadístico numérico guardado exitosamente en Descargas! (${resultado.nombreArchivo})`;
      } else {
        mensajeExito = `¡Reporte numérico generado exitosamente! Puede visualizarlo o imprimirlo en el visor.`;
      }
    } catch (error) {
      console.error('Error al generar el PDF numérico:', error);
      mensaje = 'Ocurrió un error al generar el archivo PDF numérico.';
    } finally {
      exportandoPDF = false;
    }
  }

  function cerrarModalPDF() {
    mostrarModalPDF = false;
  }

  function imprimirPDFIframe() {
    const iframe = document.getElementById('iframe-visor-pdf') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }
  }
</script>

<svelte:head>
  <title>Reporte de Morbilidad – SISUNERMB</title>
</svelte:head>

<Navbar />

<div class="div-grid-wrapper">
  <Sidebar moduloActivo="reporte-morbilidad" {usuarioActual} />

  <main class="main-landing-user">
    <div class="contenido-modulo">
      <div class="header-seccion">
        <h2>Reporte de Morbilidad Diaria</h2>
        <p class="subtitulo">Genere, consulte y exporte estadísticas de diagnósticos, pacientes atendidos y morbilidad por rango de fechas.</p>
      </div>
      
      <div class="buscador-card">
        <!-- Barra de Lapsos Predeterminados -->
        <div class="lapsos-barra">
          <div class="lapsos-label">
            <span class="material-symbols-outlined">tune</span>
            <span>Lapsos Rápidos:</span>
          </div>
          <div class="lapsos-botones">
            <button 
              type="button" 
              class="btn-lapso {lapsoActivo === 'diario' ? 'lapso-activo' : ''}" 
              on:click={() => seleccionarLapso('diario')}
              disabled={cargando}
            >
              <span class="material-symbols-outlined">today</span>
              <span>Diario (Hoy)</span>
            </button>

            <button 
              type="button" 
              class="btn-lapso {lapsoActivo === 'semanal' ? 'lapso-activo' : ''}" 
              on:click={() => seleccionarLapso('semanal')}
              disabled={cargando}
            >
              <span class="material-symbols-outlined">date_range</span>
              <span>Semanal (7 Días)</span>
            </button>

            <button 
              type="button" 
              class="btn-lapso {lapsoActivo === 'mensual' ? 'lapso-activo' : ''}" 
              on:click={() => seleccionarLapso('mensual')}
              disabled={cargando}
            >
              <span class="material-symbols-outlined">calendar_month</span>
              <span>Mensual</span>
            </button>

            <button 
              type="button" 
              class="btn-lapso {lapsoActivo === 'anual' ? 'lapso-activo' : ''}" 
              on:click={() => seleccionarLapso('anual')}
              disabled={cargando}
            >
              <span class="material-symbols-outlined">event_note</span>
              <span>Anual</span>
            </button>

            <button 
              type="button" 
              class="btn-lapso {lapsoActivo === 'total' ? 'lapso-activo' : ''}" 
              on:click={() => seleccionarLapso('total')}
              disabled={cargando}
            >
              <span class="material-symbols-outlined">all_inclusive</span>
              <span>Histórico Total</span>
            </button>
          </div>
        </div>

        <div class="buscador-container">
          <label class="input-grupo-fechas">
            <span>Desde:</span>
            <input type="date" bind:value={fechaInicio} on:input={() => (lapsoActivo = null)} />
          </label>
          <label class="input-grupo-fechas">
            <span>Hasta:</span>
            <input type="date" bind:value={fechaFin} on:input={() => (lapsoActivo = null)} />
          </label>

          <label class="input-grupo-paciente">
            <span>Buscar Paciente (Cédula o Nombre/Apellido):</span>
            <div class="input-con-icono-buscador">
              <span class="material-symbols-outlined icono-input-paciente">person_search</span>
              <input 
                type="text" 
                placeholder="Ej. 12345678 o Carlos Mendoza..." 
                bind:value={filtroBusquedaPaciente} 
                on:keydown={(e) => { if (e.key === 'Enter') generarReporte(); }}
              />
              {#if filtroBusquedaPaciente}
                <button 
                  type="button" 
                  class="btn-limpiar-paciente" 
                  on:click={() => { filtroBusquedaPaciente = ''; generarReporte(); }}
                  title="Limpiar búsqueda de paciente"
                >
                  <span class="material-symbols-outlined">close</span>
                </button>
              {/if}
            </div>
          </label>

          <button type="button" on:click={generarReporte} disabled={cargando} class="btn-buscar">
            <span class="material-symbols-outlined btn-icono">{cargando ? 'hourglass_top' : 'search'}</span>
            <span>{cargando ? 'Consultando...' : 'Consultar'}</span>
          </button>

          {#if reporteMorbilidad.length > 0}
            <div class="botones-exportacion-grupo">
              <!-- Botón 1: Reporte Numérico Consolidado de Cifras (Sin Nombres) -->
              <button 
                type="button" 
                on:click={descargarReporteNumericoPDF} 
                disabled={exportandoPDF} 
                class="btn-pdf-numerico"
                title="Generar reporte estadístico institucional con cifras numéricas y patologías frecuentes (sin nombres de pacientes)"
              >
                <span class="material-symbols-outlined btn-icono">analytics</span>
                <span>{exportandoPDF ? 'Procesando...' : 'Reporte Numérico (Cifras)'}</span>
              </button>

              <!-- Botón 2: Reporte Detallado con Pacientes -->
              <button 
                type="button" 
                on:click={descargarReportePDF} 
                disabled={exportandoPDF} 
                class="btn-pdf"
                title="Descargar reporte oficial con detalle de pacientes y atenciones médicas"
              >
                <span class="material-symbols-outlined btn-icono">picture_as_pdf</span>
                <span>{exportandoPDF ? 'Procesando...' : 'Descargar PDF Detallado'}</span>
              </button>
            </div>
          {/if}
        </div>
      </div>

      {#if mensajeExito}
        <div class="alerta-exito">
          <span class="material-symbols-outlined">check_circle</span>
          <p>{mensajeExito}</p>
        </div>
      {/if}

      {#if mensaje}
        <div class="alerta-mensaje">
          <span class="material-symbols-outlined icono-alerta">info</span>
          <div class="alerta-contenido">
            <p class="alerta-texto">{mensaje}</p>
            {#if lapsoActivo === 'diario' && reporteMorbilidad.length === 0}
              <div class="sugerencias-lapsos">
                <span class="sugerencia-label">Acceso rápido a períodos acumulados:</span>
                <button type="button" class="btn-sugerencia" on:click={() => seleccionarLapso('semanal')}>
                  <span class="material-symbols-outlined">date_range</span>
                  <span>Ver Semana</span>
                </button>
                <button type="button" class="btn-sugerencia" on:click={() => seleccionarLapso('mensual')}>
                  <span class="material-symbols-outlined">calendar_month</span>
                  <span>Ver Mes</span>
                </button>
                <button type="button" class="btn-sugerencia" on:click={() => seleccionarLapso('total')}>
                  <span class="material-symbols-outlined">all_inclusive</span>
                  <span>Ver Histórico Total</span>
                </button>
              </div>
            {/if}
          </div>
        </div>
      {/if}

      {#if reporteMorbilidad.length > 0}
        <!-- Tarjetas de métricas rápidas -->
        <div class="metricas-grid">
          <div class="metrica-card">
            <span class="material-symbols-outlined metrica-icono">stethoscope</span>
            <div>
              <p class="metrica-valor">{reporteMorbilidad.length}</p>
              <p class="metrica-etiqueta">Diagnósticos Distintos</p>
            </div>
          </div>
          
          <div class="metrica-card">
            <span class="material-symbols-outlined metrica-icono icono-azul">groups</span>
            <div>
              <p class="metrica-valor">{totalCasos}</p>
              <p class="metrica-etiqueta">Total Casos Atendidos</p>
            </div>
          </div>

          <div class="metrica-card">
            <span class="material-symbols-outlined metrica-icono icono-verde">calendar_month</span>
            <div>
              <p class="metrica-valor-fecha">{fechaInicio && fechaFin ? `${formatearFecha(fechaInicio)} - ${formatearFecha(fechaFin)}` : 'Histórico Acumulado'}</p>
              <p class="metrica-etiqueta">Período Seleccionado</p>
            </div>
          </div>

          <div class="metrica-card">
            <span class="material-symbols-outlined metrica-icono icono-morado">leaderboard</span>
            <div>
              <p class="metrica-valor-destacado" title={reporteMorbilidad[0]?.diagnostico || 'N/D'}>
                {reporteMorbilidad[0]?.diagnostico ? (reporteMorbilidad[0].diagnostico.length > 20 ? reporteMorbilidad[0].diagnostico.substring(0, 20) + '...' : reporteMorbilidad[0].diagnostico) : 'N/D'}
              </p>
              <p class="metrica-etiqueta">
                Patología Más Común ({reporteMorbilidad[0]?.total_casos || 0} casos / {totalCasos > 0 ? ((Number(reporteMorbilidad[0]?.total_casos || 0) / totalCasos) * 100).toFixed(1) : 0}%)
              </p>
            </div>
          </div>
        </div>

        <div class="tabla-container">
          <!-- Barra superior de pestañas y acciones -->
          <div class="tabla-header-barra">
            <div class="tabs-container">
              <button 
                type="button" 
                class="tab-btn {tabActiva === 'resumen' ? 'activa' : ''}" 
                on:click={() => (tabActiva = 'resumen')}
              >
                <span class="material-symbols-outlined tab-icono">bar_chart</span>
                <span>Resumen por Morbilidad ({reporteMorbilidad.length})</span>
              </button>
              
              <button 
                type="button" 
                class="tab-btn {tabActiva === 'detalle' ? 'activa' : ''}" 
                on:click={() => (tabActiva = 'detalle')}
              >
                <span class="material-symbols-outlined tab-icono">patient_list</span>
                <span>Detalle de Consultas ({consultasDetalladas.length})</span>
              </button>
            </div>
          </div>

          {#if tabActiva === 'resumen'}
            <!-- Vista Resumida con Pacientes al lado del Diagnóstico -->
            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Diagnóstico / Patología</th>
                    <th>Paciente(s) Atendido(s)</th>
                    <th>Total Casos</th>
                    <th>% Relativo</th>
                    <th>Especialidad</th>
                  </tr>
                </thead>
                <tbody>
                  {#each reporteMorbilidad as item}
                    <tr>
                      <td class="texto-bold td-diagnostico">{item.diagnostico}</td>
                      <td class="td-paciente">
                        <span class="badge-paciente">
                          <span class="material-symbols-outlined icono-mini">person</span>
                          <span>{item.paciente || 'Sin paciente asignado'}</span>
                        </span>
                      </td>
                      <td class="td-casos">
                        <span class="badge-casos">{item.total_casos}</span>
                      </td>
                      <td class="td-porcentaje">
                        <span class="badge-porcentaje">
                          {totalCasos > 0 ? ((Number(item.total_casos) / totalCasos) * 100).toFixed(1) + '%' : '0%'}
                        </span>
                      </td>
                      <td>
                        <span class="badge-especialidad">{item.especialidad}</span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
                <tfoot>
                  <tr class="fila-total">
                    <td colspan="2" class="texto-bold">TOTAL GENERAL DE CASOS ATENDIDOS</td>
                    <td class="td-casos texto-bold">{totalCasos}</td>
                    <td class="td-porcentaje texto-bold">100.0%</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          {:else}
            <!-- Vista Detallada de cada consulta individual -->
            <div class="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Paciente</th>
                    <th>Cédula</th>
                    <th>Diagnóstico / Consulta</th>
                    <th>Especialidad</th>
                    <th>Doctor Tratante</th>
                  </tr>
                </thead>
                <tbody>
                  {#each consultasDetalladas as item}
                    <tr>
                      <td>
                        <div class="fecha-hora-badge">
                          <span class="fecha-texto">{formatearFecha(item.fecha_consulta)}</span>
                          {#if (item as any).hora_consulta}
                            <span class="hora-texto">
                              <span class="material-symbols-outlined icono-reloj-sm">schedule</span>
                              {(item as any).hora_consulta}
                            </span>
                          {/if}
                        </div>
                      </td>
                      <td class="texto-bold">{item.paciente}</td>
                      <td class="td-cedula">{item.cedula}</td>
                      <td class="td-diagnostico">{item.diagnostico}</td>
                      <td>
                        <span class="badge-especialidad">{item.especialidad}</span>
                      </td>
                      <td>{item.doctor}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </main>

</div>

<!-- Modal Visor de Reporte PDF -->
{#if mostrarModalPDF}
  <div class="modal-backdrop" on:click={cerrarModalPDF} on:keydown={(e) => e.key === 'Escape' && cerrarModalPDF()} role="presentation">
    <div class="modal-card" on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true" tabindex="-1">
      <div class="modal-header">
        <div class="modal-header-titulos">
          <span class="material-symbols-outlined icono-modal-pdf">picture_as_pdf</span>
          <div>
            <h3>Vista Previa del Reporte de Morbilidad</h3>
            <p class="modal-subtitulo">{nombreArchivoPDF}</p>
          </div>
        </div>

        <div class="modal-header-acciones">
          <button type="button" on:click={imprimirPDFIframe} class="btn-modal-imprimir">
            <span class="material-symbols-outlined">print</span>
            <span>Imprimir / Guardar</span>
          </button>
          <button type="button" on:click={cerrarModalPDF} class="btn-modal-cerrar" title="Cerrar ventana">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div class="modal-body">
        <iframe 
          id="iframe-visor-pdf" 
          src={urlPDFModal} 
          title="Visor PDF SISUNERMB"
          class="iframe-pdf"
        ></iframe>
      </div>
    </div>
  </div>
{/if}

<Footer />

<style>
  .buscador-card {
    background: #ffffff;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    margin-bottom: 20px;
    border: 1px solid #e2e8f0;
  }

  /* Barra de Lapsos Predeterminados */
  .lapsos-barra {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
    padding-bottom: 18px;
    border-bottom: 1px solid #e2e8f0;
    flex-wrap: wrap;
  }

  .lapsos-label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 0.85rem;
    font-weight: 700;
    color: #1e293b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .lapsos-label .material-symbols-outlined {
    font-size: 20px;
    color: #007aff;
  }

  .lapsos-botones {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .btn-lapso {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    font-size: 0.84rem;
    font-weight: 600;
    color: #334155;
    background-color: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .btn-lapso .material-symbols-outlined {
    font-size: 18px;
    color: #64748b;
  }

  .btn-lapso:hover:not(:disabled) {
    background-color: #e2e8f0;
    color: #0f172a;
    border-color: #94a3b8;
  }

  .btn-lapso.lapso-activo {
    background-color: #007aff;
    color: #ffffff;
    border-color: #007aff;
    box-shadow: 0 2px 6px rgba(0, 122, 255, 0.25);
  }

  .btn-lapso.lapso-activo .material-symbols-outlined {
    color: #ffffff;
  }

  .btn-lapso:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .buscador-container {
    display: flex;
    gap: 15px;
    align-items: flex-end;
    flex-wrap: wrap;
  }

  .input-grupo-fechas {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
  }

  .input-grupo-paciente {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #475569;
    min-width: 260px;
    flex: 1;
    max-width: 380px;
  }

  .input-con-icono-buscador {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
  }

  .icono-input-paciente {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 20px;
    color: #64748b;
    pointer-events: none;
    z-index: 2;
  }

  .btn-limpiar-paciente {
    position: absolute;
    right: 8px;
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

  .btn-limpiar-paciente:hover {
    color: #dc2626;
    background-color: #fee2e2;
  }

  .btn-limpiar-paciente .material-symbols-outlined {
    font-size: 16px;
  }

  .buscador-container input {
    padding: 10px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-size: 0.95rem;
    background-color: #f8fafc;
    color: #0f172a;
    outline: none;
    transition: all 0.2s;
  }

  /* Especificidad alta para garantizar que el icono nunca tape el texto ingresado */
  .buscador-container .input-con-icono-buscador input {
    width: 100%;
    padding: 10px 38px 10px 42px !important;
  }

  .buscador-container input:focus {
    border-color: #007aff;
    background-color: #fff;
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.15);
  }

  .btn-buscar {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #007aff;
    color: white;
    border: none;
    padding: 11px 22px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    box-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
  }

  .btn-buscar:hover {
    background-color: #0062cc;
  }

  .btn-buscar:disabled {
    background-color: #94a3b8;
    cursor: not-allowed;
    box-shadow: none;
  }

  .botones-exportacion-grupo {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-left: auto;
    flex-wrap: wrap;
  }

  .btn-pdf-numerico {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #0284c7;
    color: white;
    border: none;
    padding: 11px 18px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.92rem;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2);
  }

  .btn-pdf-numerico:hover:not(:disabled) {
    background-color: #0369a1;
  }

  .btn-pdf-numerico:disabled {
    background-color: #7dd3fc;
    cursor: not-allowed;
  }

  .btn-pdf {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #dc2626;
    color: white;
    border: none;
    padding: 11px 20px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.92rem;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
  }

  .btn-pdf:hover {
    background-color: #b91c1c;
  }

  .btn-pdf:disabled {
    background-color: #f87171;
    cursor: not-allowed;
  }

  .btn-icono {
    font-size: 20px;
  }

  .alerta-mensaje {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
    padding: 16px 20px;
    border-radius: 10px;
    margin-bottom: 20px;
  }

  .icono-alerta {
    font-size: 24px;
    color: #2563eb;
    margin-top: 2px;
    flex-shrink: 0;
  }

  .alerta-contenido {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 100%;
  }

  .alerta-texto {
    font-size: 0.95rem;
    font-weight: 500;
    margin: 0;
    line-height: 1.5;
  }

  .sugerencias-lapsos {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    padding-top: 8px;
    border-top: 1px dashed #bfdbfe;
  }

  .sugerencia-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #1e40af;
  }

  .btn-sugerencia {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 6px;
    background: #ffffff;
    border: 1px solid #93c5fd;
    color: #1d4ed8;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-sugerencia:hover {
    background: #dbeafe;
    border-color: #3b82f6;
  }

  .btn-sugerencia .material-symbols-outlined {
    font-size: 16px;
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

  /* Grid de métricas */
  .metricas-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .metrica-card {
    background: white;
    padding: 16px 20px;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .metrica-icono {
    font-size: 32px;
    color: #007aff;
    background: #eff6ff;
    padding: 8px;
    border-radius: 8px;
  }

  .icono-azul {
    color: #2563eb;
    background: #dbeafe;
  }

  .icono-verde {
    color: #059669;
    background: #d1fae5;
  }

  .metrica-valor {
    font-size: 1.4rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.2;
  }

  .metrica-valor-fecha {
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.2;
  }

  .metrica-etiqueta {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 500;
  }

  /* Contenedor de la tabla */
  .tabla-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }

  .tabla-header-barra {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 18px;
    background-color: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    flex-wrap: wrap;
    gap: 10px;
  }

  .tabs-container {
    display: flex;
    gap: 8px;
  }

  .tab-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border-radius: 6px;
    border: 1px solid #cbd5e1;
    background: white;
    color: #475569;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    background-color: #f1f5f9;
    color: #0f172a;
  }

  .tab-btn.activa {
    background-color: #007aff;
    color: white;
    border-color: #007aff;
  }

  .tab-icono {
    font-size: 18px;
  }

  .table-responsive {
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
    padding: 14px 18px;
    font-weight: 600;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    border-bottom: 2px solid #e2e8f0;
  }

  td {
    padding: 14px 18px;
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

  .fila-total {
    background-color: #f0fdf4 !important;
    border-top: 2px solid #bbf7d0;
  }

  .fila-total td {
    color: #166534;
    font-weight: 700;
  }

  .texto-bold {
    font-weight: 600;
    color: #0f172a;
  }

  .td-diagnostico {
    max-width: 240px;
    word-break: break-word;
  }

  .td-paciente {
    max-width: 320px;
  }

  .badge-paciente {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: #f1f5f9;
    color: #1e293b;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.88rem;
    font-weight: 500;
    border: 1px solid #e2e8f0;
  }

  .icono-mini {
    font-size: 16px;
    color: #007aff;
  }

  .td-casos {
    text-align: center;
  }

  .badge-casos {
    display: inline-block;
    background-color: #e0f2fe;
    color: #0369a1;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 0.88rem;
  }

  .badge-especialidad {
    display: inline-block;
    background-color: #f3e8ff;
    color: #6b21a8;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 6px;
    font-size: 0.85rem;
  }

  .td-cedula {
    font-family: monospace;
    font-size: 0.88rem;
    color: #475569;
  }

  /* Estilos del Modal Visor de PDF */
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 20px;
  }

  .modal-card {
    background: #ffffff;
    width: 95%;
    max-width: 1050px;
    height: 90vh;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    overflow: hidden;
    border: 1px solid #cbd5e1;
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: #1e293b;
    color: white;
  }

  .modal-header-titulos {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .icono-modal-pdf {
    font-size: 32px;
    color: #ef4444;
  }

  .modal-header-titulos h3 {
    font-size: 1.15rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .modal-subtitulo {
    font-size: 0.82rem;
    color: #94a3b8;
  }

  .modal-header-acciones {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .btn-modal-imprimir {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: #007aff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.88rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .btn-modal-imprimir:hover {
    background-color: #0062cc;
  }

  .btn-modal-cerrar {
    background: #334155;
    color: #cbd5e1;
    border: none;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-modal-cerrar:hover {
    background: #475569;
    color: white;
  }

  .modal-body {
    flex-grow: 1;
    width: 100%;
    background-color: #525659;
    display: flex;
  }

  .iframe-pdf {
    width: 100%;
    height: 100%;
    border: none;
  }

</style>
