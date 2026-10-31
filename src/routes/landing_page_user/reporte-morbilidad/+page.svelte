<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { obtenerReporteMorbilidad, obtenerConsultasDetalladas } from '$lib/queries/consultas';
  import { generarPDFMorbilidad, type ItemMorbilidad, type ConsultaDetallada } from '$lib/utils/reporte-pdf';
  import Navbar from '$lib/components/Navbar.svelte';
  import Sidebar from '$lib/components/Sidebar.svelte';
  import Footer from '$lib/components/Footer.svelte';

  let usuarioActual: { id: string; nombre: string; rol: string } | null = null;
  let fechaInicio = '';
  let fechaFin = '';
  let reporteMorbilidad: ItemMorbilidad[] = [];
  let consultasDetalladas: ConsultaDetallada[] = [];
  let tabActiva: 'resumen' | 'detalle' = 'resumen';
  let mensaje = '';
  let mensajeExito = '';
  let cargando = false;
  let exportandoPDF = false;

  // Estado del visor modal de PDF
  let mostrarModalPDF = false;
  let urlPDFModal = '';
  let nombreArchivoPDF = '';

  $: totalCasos = reporteMorbilidad.reduce((acc, item) => acc + Number(item.total_casos || 0), 0);

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

  function formatearFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return fechaStr;
  }

  async function generarReporte() {
    if (!fechaInicio || !fechaFin) {
      mensaje = 'Por favor seleccione un rango de fechas válido.';
      reporteMorbilidad = [];
      consultasDetalladas = [];
      return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
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
        obtenerReporteMorbilidad(fechaInicio, fechaFin) as Promise<ItemMorbilidad[]>,
        obtenerConsultasDetalladas(fechaInicio, fechaFin) as Promise<ConsultaDetallada[]>
      ]);

      reporteMorbilidad = datosMorbilidad;
      consultasDetalladas = datosDetalle;
      
      if (reporteMorbilidad.length === 0) {
        mensaje = 'No se encontraron registros de morbilidad para el rango de fechas seleccionado.';
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
        consultasDetalladas
      });

      urlPDFModal = resultado.blobUrl;
      nombreArchivoPDF = resultado.nombreArchivo;
      mostrarModalPDF = true;

      if (resultado.rutaGuardada) {
        mensajeExito = `¡Reporte guardado exitosamente en Descargas! (${resultado.nombreArchivo})`;
      } else {
        mensajeExito = `¡Reporte generado exitosamente! Puede visualizarlo o imprimirlo en el visor.`;
      }
    } catch (error) {
      console.error('Error al generar el PDF:', error);
      mensaje = 'Ocurrió un error al generar el archivo PDF.';
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
        <div class="buscador-container">
          <label class="input-grupo-fechas">
            <span>Desde:</span>
            <input type="date" bind:value={fechaInicio} />
          </label>
          <label class="input-grupo-fechas">
            <span>Hasta:</span>
            <input type="date" bind:value={fechaFin} />
          </label>
          <button type="button" on:click={generarReporte} disabled={cargando} class="btn-buscar">
            <span class="material-symbols-outlined btn-icono">{cargando ? 'hourglass_top' : 'search'}</span>
            <span>{cargando ? 'Generando...' : 'Generar Reporte'}</span>
          </button>

          {#if reporteMorbilidad.length > 0}
            <button 
              type="button" 
              on:click={descargarReportePDF} 
              disabled={exportandoPDF} 
              class="btn-pdf"
              title="Descargar reporte en formato PDF para el rango de fechas seleccionado"
            >
              <span class="material-symbols-outlined btn-icono">picture_as_pdf</span>
              <span>{exportandoPDF ? 'Procesando...' : 'Descargar PDF'}</span>
            </button>
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
          <span class="material-symbols-outlined">info</span>
          <p>{mensaje}</p>
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
              <p class="metrica-valor-fecha">{formatearFecha(fechaInicio)} - {formatearFecha(fechaFin)}</p>
              <p class="metrica-etiqueta">Período de Consulta</p>
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
                    <th>Paciente(s)</th>
                    <th>Total Casos</th>
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
                      <td>
                        <span class="badge-especialidad">{item.especialidad}</span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
                <tfoot>
                  <tr class="fila-total">
                    <td colspan="2" class="texto-bold">TOTAL GENERAL DE CASOS</td>
                    <td class="td-casos texto-bold">{totalCasos}</td>
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
                        <span class="badge-fecha">{formatearFecha(item.fecha_consulta)}</span>
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

  .btn-pdf {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background-color: #dc2626;
    color: white;
    border: none;
    padding: 11px 22px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
    box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
    margin-left: auto;
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
    align-items: center;
    gap: 10px;
    background-color: #eff6ff;
    border: 1px solid #bfdbfe;
    color: #1e40af;
    padding: 14px 18px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-weight: 500;
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

  .badge-fecha {
    display: inline-block;
    background-color: #f1f5f9;
    color: #475569;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.82rem;
    font-family: monospace;
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
