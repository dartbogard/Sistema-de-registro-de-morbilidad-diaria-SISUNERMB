import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LOGO_UNERMB_BASE64, LOGO_SISUNERMB_BASE64 } from './pdf-logos';

export interface ItemMorbilidad {
  diagnostico: string;
  total_casos: number;
  especialidad: string;
  paciente?: string;
}

export interface ConsultaDetallada {
  id_consulta?: string | number;
  fecha_consulta: string;
  diagnostico: string;
  paciente: string;
  cedula: string;
  especialidad: string;
  doctor: string;
}

export interface DatosReportePDF {
  fechaInicio: string;
  fechaFin: string;
  usuarioGenerador: string;
  morbilidad: ItemMorbilidad[];
  consultasDetalladas?: ConsultaDetallada[];
  filtroPaciente?: string;
}

export interface ResultadoGeneracionPDF {
  nombreArchivo: string;
  blobUrl: string;
  rutaGuardada?: string;
}

function formatearFecha(fechaStr: string): string {
  if (!fechaStr) return '';
  const partes = fechaStr.split('-');
  if (partes.length === 3) {
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }
  return fechaStr;
}

export async function generarPDFMorbilidad(datos: DatosReportePDF): Promise<ResultadoGeneracionPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margen = 14;

  // Franja decorativa superior institucional
  doc.setFillColor(0, 122, 255); // Azul UNERMB
  doc.rect(0, 0, pageWidth, 6, 'F');
  doc.setFillColor(44, 62, 80); // Azul oscuro decorativo
  doc.rect(0, 6, pageWidth, 1.5, 'F');

  // Logotipos oficiales UNERMB (izquierda) y SISUNERMB (derecha)
  try {
    doc.addImage(LOGO_UNERMB_BASE64, 'PNG', margen, 8, 16, 18);
    doc.addImage(LOGO_SISUNERMB_BASE64, 'PNG', pageWidth - margen - 18, 9, 18, 16);
  } catch (errLogos) {
    console.warn('Advertencia al incrustar logotipos en el reporte:', errLogos);
  }

  // Encabezado institucional
  let y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('REPÚBLICA BOLIVARIANA DE VENEZUELA', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(10);
  doc.text('UNIVERSIDAD NACIONAL EXPERIMENTAL "RAFAEL MARÍA BARALT"', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text('SISTEMA INTEGRAL DE SALUD - SISUNERMB', pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margen, y, pageWidth - margen, y);

  // Título del Reporte
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.text('REPORTE OFICIAL DE MORBILIDAD MÉDICA', pageWidth / 2, y, { align: 'center' });

  // Recuadro de Metadatos
  y += 4;
  const cajaY = y;
  const tieneFiltro = Boolean(datos.filtroPaciente && datos.filtroPaciente.trim());
  const cajaHeight = tieneFiltro ? 27 : 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margen, cajaY, pageWidth - margen * 2, cajaHeight, 3, 3, 'FD');

  const fechaInicioFormateada = formatearFecha(datos.fechaInicio);
  const fechaFinFormateada = formatearFecha(datos.fechaFin);
  const fechaHoy = new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const horaHoy = new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalCasosGlobal = datos.morbilidad.reduce((acc, item) => acc + Number(item.total_casos || 0), 0);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Rango de Fechas:', margen + 4, cajaY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(`Desde ${fechaInicioFormateada}  hasta  ${fechaFinFormateada}`, margen + 34, cajaY + 6);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de Emisión:', margen + 4, cajaY + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${fechaHoy} a las ${horaHoy}`, margen + 34, cajaY + 12);

  doc.setFont('helvetica', 'bold');
  doc.text('Generado por:', margen + 4, cajaY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.usuarioGenerador || 'Personal Administrativo SISUNERMB', margen + 34, cajaY + 18);

  if (tieneFiltro) {
    doc.setFont('helvetica', 'bold');
    doc.text('Filtro Paciente:', margen + 4, cajaY + 23.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 102, 204);
    doc.text(datos.filtroPaciente!, margen + 34, cajaY + 23.5);
    doc.setTextColor(51, 65, 85);
  }

  // Columna derecha del recuadro
  const colDerX = pageWidth / 2 + 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnósticos Registrados:', colDerX, cajaY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 122, 255);
  doc.text(`${datos.morbilidad.length} patología(s)`, colDerX + 42, cajaY + 8);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Casos Atendidos:', colDerX, cajaY + 15);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(16, 185, 129);
  doc.text(`${totalCasosGlobal} caso(s)`, colDerX + 42, cajaY + 15);

  y = cajaY + cajaHeight + 8;

  // Sección 1: Resumen de Morbilidad por Diagnóstico
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. RESUMEN ESTADÍSTICO DE MORBILIDAD POR PATOLOGÍA', margen, y);
  y += 3;

  const filasMorbilidad = datos.morbilidad.map((item, idx) => [
    (idx + 1).toString(),
    item.diagnostico || 'Sin diagnóstico',
    item.paciente || 'N/A',
    item.total_casos.toString(),
    item.especialidad || 'General'
  ]);

  // Fila de totales
  filasMorbilidad.push([
    '',
    'TOTAL GENERAL DE CASOS',
    '',
    totalCasosGlobal.toString(),
    ''
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    head: [['#', 'Diagnóstico / Patología', 'Paciente(s) Atendido(s)', 'Total Casos', 'Especialidad']],
    body: filasMorbilidad,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 122, 255],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 78 },
      3: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 38 }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (data) => {
      // Estilizar la última fila como resumen
      if (data.row.index === filasMorbilidad.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [224, 242, 254];
        data.cell.styles.textColor = [3, 105, 161];
      }
    }
  });

  // Sección 2: Detalle individual de consultas (si existen)
  if (datos.consultasDetalladas && datos.consultasDetalladas.length > 0) {
    const lastTable = (doc as any).lastAutoTable;
    let nextY = (lastTable ? lastTable.finalY : y) + 9;

    // Si queda poco espacio para la siguiente sección, añadir página
    if (nextY > pageHeight - 50) {
      doc.addPage();
      nextY = 20;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. REGISTRO DETALLADO DE CONSULTAS MÉDICAS', margen, nextY);
    nextY += 3;

    const filasDetalle = datos.consultasDetalladas.map((item, idx) => [
      (idx + 1).toString(),
      formatearFecha(item.fecha_consulta),
      item.paciente,
      item.cedula,
      item.diagnostico,
      item.especialidad,
      item.doctor
    ]);

    autoTable(doc, {
      startY: nextY,
      margin: { left: margen, right: margen },
      head: [['#', 'Fecha', 'Paciente', 'Cédula', 'Diagnóstico / Motivo', 'Especialidad', 'Médico']],
      body: filasDetalle,
      theme: 'grid',
      headStyles: {
        fillColor: [44, 62, 80],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left'
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 7, halign: 'center' },
        1: { cellWidth: 18, halign: 'center' },
        2: { cellWidth: 44, fontStyle: 'bold' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 40 },
        5: { cellWidth: 27 },
        6: { cellWidth: 30 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });
  }

  // Firmas institucionales al final
  const totalPaginas = doc.getNumberOfPages();
  const lastTableFinal = (doc as any).lastAutoTable;
  let firmaY = (lastTableFinal ? lastTableFinal.finalY : y) + 20;

  if (firmaY > pageHeight - 35) {
    doc.addPage();
    firmaY = 40;
  }

  const anchoLineaFirma = 60;
  const firma1X = margen + 15;
  const firma2X = pageWidth - margen - 15 - anchoLineaFirma;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  // Línea 1
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(firma1X, firmaY, firma1X + anchoLineaFirma, firmaY);
  doc.text('Firma y Sello del Médico Tratante', firma1X + anchoLineaFirma / 2, firmaY + 5, { align: 'center' });
  doc.text('SISUNERMB', firma1X + anchoLineaFirma / 2, firmaY + 9, { align: 'center' });

  // Línea 2
  doc.line(firma2X, firmaY, firma2X + anchoLineaFirma, firmaY);
  doc.text('Coordinación Médica / Dirección', firma2X + anchoLineaFirma / 2, firmaY + 5, { align: 'center' });
  doc.text('Servicio de Salud SISUNERMB', firma2X + anchoLineaFirma / 2, firmaY + 9, { align: 'center' });

  // Pie de página en todas las páginas
  const totalPagsFinal = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagsFinal; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margen, pageHeight - 10, pageWidth - margen, pageHeight - 10);

    doc.text('SISUNERMB - Sistema Integral de Salud Universitario UNERMB', margen, pageHeight - 6);
    doc.text(`Página ${i} de ${totalPagsFinal}`, pageWidth - margen, pageHeight - 6, { align: 'right' });
  }

  const nombreArchivo = `Reporte_Morbilidad_${datos.fechaInicio}_al_${datos.fechaFin}.pdf`;
  const arrayBuffer = doc.output('arraybuffer');
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  let rutaGuardada: string | undefined = undefined;

  // 1. Guardar y abrir mediante el comando nativo de Tauri si estamos en la aplicación de escritorio
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const bytes = Array.from(new Uint8Array(arrayBuffer));
    rutaGuardada = await invoke<string>('guardar_reporte_pdf', { nombre: nombreArchivo, bytes });
    console.log('✅ Archivo PDF guardado y abierto con éxito:', rutaGuardada);
  } catch (errorTauri) {
    console.warn('Comando nativo de guardado de Tauri no disponible:', errorTauri);
  }

  // 2. Disparar enlace de descarga HTML5 de respaldo
  try {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = nombreArchivo;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 1000);
  } catch (errorDom) {
    console.warn('Descarga por enlace DOM falló:', errorDom);
  }

  return {
    nombreArchivo,
    blobUrl,
    rutaGuardada
  };
}


export async function generarPDFMorbilidadNumerica(datos: DatosReportePDF): Promise<ResultadoGeneracionPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margen = 14;

  // Franja decorativa superior institucional
  doc.setFillColor(0, 102, 204); // Azul UNERMB
  doc.rect(0, 0, pageWidth, 5.5, 'F');
  doc.setFillColor(11, 37, 69); // Azul marino decorativo
  doc.rect(0, 5.5, pageWidth, 1.5, 'F');

  // Logotipos oficiales UNERMB (izquierda) y SISUNERMB (derecha)
  try {
    doc.addImage(LOGO_UNERMB_BASE64, 'PNG', margen, 8, 16, 18);
    doc.addImage(LOGO_SISUNERMB_BASE64, 'PNG', pageWidth - margen - 18, 9, 18, 16);
  } catch (errLogos) {
    console.warn('Advertencia al incrustar logotipos en el reporte numérico:', errLogos);
  }

  // Encabezado institucional
  let y = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  doc.text('REPÚBLICA BOLIVARIANA DE VENEZUELA', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(9.5);
  doc.text('UNIVERSIDAD NACIONAL EXPERIMENTAL "RAFAEL MARÍA BARALT"', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('SISTEMA INTEGRAL DE SALUD - SISUNERMB', pageWidth / 2, y, { align: 'center' });

  y += 6;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margen, y, pageWidth - margen, y);

  // Título del Reporte Numérico
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 85, 179);
  doc.text('REPORTE ESTADÍSTICO DE MORBILIDAD MÉDICA', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('CONSOLIDADO NUMÉRICO EPIDEMIOLÓGICO Y FRECUENCIA DE CASOS (SIN DATOS PERSONALES)', pageWidth / 2, y, { align: 'center' });

  // Recuadro de Metadatos Estadísticos
  y += 4;
  const cajaY = y;
  const tieneFiltro = Boolean(datos.filtroPaciente && datos.filtroPaciente.trim());
  const cajaHeight = tieneFiltro ? 27 : 22;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margen, cajaY, pageWidth - margen * 2, cajaHeight, 3, 3, 'FD');

  const fechaInicioFormateada = datos.fechaInicio ? formatearFecha(datos.fechaInicio) : 'Histórico Inicial';
  const fechaFinFormateada = datos.fechaFin ? formatearFecha(datos.fechaFin) : 'Fecha Actual';
  const fechaHoy = new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const horaHoy = new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Caracas'
  });

  const totalCasosGlobal = datos.morbilidad.reduce((acc, m) => acc + Number(m.total_casos || 0), 0);
  const patologiaTop = datos.morbilidad.length > 0 ? datos.morbilidad[0] : null;
  const porcentajeTop = patologiaTop && totalCasosGlobal > 0 ? ((Number(patologiaTop.total_casos) / totalCasosGlobal) * 100).toFixed(1) : '0';

  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);

  // Columna 1
  doc.setFont('helvetica', 'bold');
  doc.text('Período Analizado:', margen + 4, cajaY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${fechaInicioFormateada}  al  ${fechaFinFormateada}`, margen + 32, cajaY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Total Consultas:', margen + 4, cajaY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalCasosGlobal} atenciones registradas`, margen + 32, cajaY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Patologías Distintas:', margen + 4, cajaY + 16.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${datos.morbilidad.length} diagnósticos clínicos`, margen + 32, cajaY + 16.5);

  if (tieneFiltro) {
    doc.setFont('helvetica', 'bold');
    doc.text('Filtro Paciente:', margen + 4, cajaY + 22);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 102, 204);
    doc.text(datos.filtroPaciente!, margen + 32, cajaY + 22);
    doc.setTextColor(30, 41, 59);
  }

  // Columna 2
  const col2X = pageWidth / 2 + 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Emisión (VET):', col2X, cajaY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${fechaHoy} - ${horaHoy}`, col2X + 28, cajaY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Patología Frecuente #1:', col2X, cajaY + 11);
  doc.setFont('helvetica', 'normal');
  const textoPatologia = patologiaTop ? `${patologiaTop.diagnostico.substring(0, 32)} (${patologiaTop.total_casos} casos / ${porcentajeTop}%)` : 'Ninguna';
  doc.text(textoPatologia, col2X + 28, cajaY + 11);

  doc.setFont('helvetica', 'bold');
  doc.text('Personal Emisor:', col2X, cajaY + 16.5);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.usuarioGenerador || 'Personal Administrativo SISUNERMB', col2X + 28, cajaY + 16.5);

  y = cajaY + cajaHeight + 8;

  // Filas estadísticas sin nombres de pacientes
  const filasEstadisticas = datos.morbilidad.map((item, idx) => {
    const casos = Number(item.total_casos || 0);
    const porcentaje = totalCasosGlobal > 0 ? ((casos / totalCasosGlobal) * 100).toFixed(1) + '%' : '0.0%';
    let nivelIncidencia = 'Baja (< 10%)';
    if (totalCasosGlobal > 0) {
      const pNum = (casos / totalCasosGlobal) * 100;
      if (pNum >= 25) nivelIncidencia = 'Alta (>= 25%)';
      else if (pNum >= 10) nivelIncidencia = 'Moderada (10-24%)';
    }
    return [
      (idx + 1).toString(),
      item.diagnostico,
      item.especialidad,
      casos.toString(),
      porcentaje,
      nivelIncidencia
    ];
  });

  // Fila de total general
  filasEstadisticas.push([
    '',
    'TOTAL GENERAL DE ATENCIONES MÉDICAS CONSOLIDADAS',
    'Todas las especialidades',
    totalCasosGlobal.toString(),
    '100.0%',
    'Total Acumulado'
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    head: [['#', 'Diagnóstico / Patología Clínica', 'Especialidad', 'Total Casos', '% del Total', 'Incidencia']],
    body: filasEstadisticas,
    theme: 'grid',
    headStyles: {
      fillColor: [0, 85, 179],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left'
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 70, fontStyle: 'bold' },
      2: { cellWidth: 40 },
      3: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 22, halign: 'center' },
      5: { cellWidth: 24, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    didParseCell: (data) => {
      // Estilizar la última fila como resumen
      if (data.row.index === filasEstadisticas.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [224, 242, 254];
        data.cell.styles.textColor = [3, 105, 161];
      }
    }
  });

  // Firmas institucionales
  const lastTableFinal = (doc as any).lastAutoTable;
  let firmaY = (lastTableFinal ? lastTableFinal.finalY : y) + 20;

  if (firmaY > pageHeight - 35) {
    doc.addPage();
    firmaY = 40;
  }

  const anchoLineaFirma = 65;
  const firma1X = margen + 15;
  const firma2X = pageWidth - margen - 15 - anchoLineaFirma;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);

  // Línea 1
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(firma1X, firmaY, firma1X + anchoLineaFirma, firmaY);
  doc.text('Departamento de Estadística Médica', firma1X + anchoLineaFirma / 2, firmaY + 5, { align: 'center' });
  doc.text('SISUNERMB', firma1X + anchoLineaFirma / 2, firmaY + 9, { align: 'center' });

  // Línea 2
  doc.line(firma2X, firmaY, firma2X + anchoLineaFirma, firmaY);
  doc.text('Dirección de Salud Integral UNERMB', firma2X + anchoLineaFirma / 2, firmaY + 5, { align: 'center' });
  doc.text('Coordinación Médica General', firma2X + anchoLineaFirma / 2, firmaY + 9, { align: 'center' });

  // Pie de página en todas las páginas
  const totalPagsFinal = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagsFinal; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margen, pageHeight - 10, pageWidth - margen, pageHeight - 10);

    doc.text('SISUNERMB - Sistema Integral de Salud Universitario UNERMB (Reporte Estadístico Numérico)', margen, pageHeight - 6);
    doc.text(`Página ${i} de ${totalPagsFinal}`, pageWidth - margen, pageHeight - 6, { align: 'right' });
  }

  const lapsoNombre = datos.fechaInicio && datos.fechaFin ? `${datos.fechaInicio}_al_${datos.fechaFin}` : 'Historico_Total';
  const nombreArchivo = `Reporte_Estadistico_Morbilidad_${lapsoNombre}.pdf`;
  const arrayBuffer = doc.output('arraybuffer');
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  let rutaGuardada: string | undefined = undefined;

  // 1. Guardar y abrir mediante el comando nativo de Tauri si estamos en la aplicación de escritorio
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const bytes = Array.from(new Uint8Array(arrayBuffer));
    rutaGuardada = await invoke<string>('guardar_reporte_pdf', { nombre: nombreArchivo, bytes });
    console.log('✅ Archivo PDF Estadístico guardado y abierto con éxito:', rutaGuardada);
  } catch (errorTauri) {
    console.warn('Comando nativo de guardado de Tauri no disponible:', errorTauri);
  }

  // 2. Disparar enlace de descarga HTML5 de respaldo
  try {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = nombreArchivo;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (document.body.contains(a)) {
        document.body.removeChild(a);
      }
    }, 1000);
  } catch (errorDom) {
    console.warn('Descarga por enlace DOM falló:', errorDom);
  }

  return {
    nombreArchivo,
    blobUrl,
    rutaGuardada
  };
}
