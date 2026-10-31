import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SuspensionDetallada } from '$lib/queries/suspensiones';
import { LOGO_UNERMB_BASE64, LOGO_SISUNERMB_BASE64 } from './pdf-logos';

export interface DatosReporteSuspensionesPDF {
  tituloReporte?: string;
  fechaInicio?: string;
  fechaFin?: string;
  usuarioGenerador: string;
  suspensiones: SuspensionDetallada[];
  filtroAplicado?: string;
}

export interface ResultadoGeneracionPDF {
  nombreArchivo: string;
  blobUrl: string;
  rutaGuardada?: string;
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

export async function generarPDFSuspensiones(datos: DatosReporteSuspensionesPDF): Promise<ResultadoGeneracionPDF> {
  // Orientación horizontal (landscape) para albergar cómodamente columnas de diagnóstico, médico, fechas y reincidencia
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margen = 14;

  // Franjas decorativas institucionales UNERMB
  doc.setFillColor(0, 102, 204); // Azul UNERMB
  doc.rect(0, 0, pageWidth, 5.5, 'F');
  doc.setFillColor(11, 37, 69); // Azul marino oscuro
  doc.rect(0, 5.5, pageWidth, 1.5, 'F');

  // Logotipos oficiales UNERMB (izquierda) y SISUNERMB (derecha)
  try {
    doc.addImage(LOGO_UNERMB_BASE64, 'PNG', margen, 7.5, 15, 17);
    doc.addImage(LOGO_SISUNERMB_BASE64, 'PNG', pageWidth - margen - 18, 8, 18, 16);
  } catch (errLogos) {
    console.warn('Advertencia al incrustar logotipos en el reporte de suspensiones:', errLogos);
  }

  // Encabezado institucional
  let y = 13.5;
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

  y += 5.5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margen, y, pageWidth - margen, y);

  // Título del Reporte
  y += 6.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 85, 179);
  const titulo = datos.tituloReporte || 'REPORTE OFICIAL DE CONTROL DE REPOSOS Y SUSPENSIONES MÉDICAS';
  doc.text(titulo, pageWidth / 2, y, { align: 'center' });

  // Recuadro de Metadatos
  y += 4;
  const cajaY = y;
  const cajaHeight = 20;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margen, cajaY, pageWidth - margen * 2, cajaHeight, 3, 3, 'FD');

  const fechaHoy = new Date().toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const horaHoy = new Date().toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Estadísticas calculadas para el encabezado
  const totalRegistros = datos.suspensiones.length;
  const totalReincidentes = datos.suspensiones.filter(s => Number(s.total_suspensiones_historicas || 0) >= 2).length;
  const totalActivas = datos.suspensiones.filter(s => s.es_activa).length;
  const totalDias = datos.suspensiones.reduce((acc, s) => acc + Math.max(1, Number(s.dias_reposo || 1)), 0);

  // Columna 1 del recuadro
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Período / Criterio:', margen + 4, cajaY + 5.5);
  doc.setFont('helvetica', 'normal');
  let textoPeriodo = 'Registro Historial Completo';
  if (datos.fechaInicio && datos.fechaFin) {
    textoPeriodo = `Desde ${formatearFecha(datos.fechaInicio)} hasta ${formatearFecha(datos.fechaFin)}`;
  } else if (datos.filtroAplicado) {
    textoPeriodo = datos.filtroAplicado;
  }
  doc.text(textoPeriodo, margen + 32, cajaY + 5.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de Emisión:', margen + 4, cajaY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${fechaHoy} a las ${horaHoy}`, margen + 32, cajaY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.text('Generado por:', margen + 4, cajaY + 17);
  doc.setFont('helvetica', 'normal');
  doc.text(datos.usuarioGenerador || 'Personal Administrativo SISUNERMB', margen + 32, cajaY + 17);

  // Columna 2 del recuadro (Métricas clave)
  const col2X = pageWidth / 2 - 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Total Suspensiones:', col2X, cajaY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 102, 204);
  doc.text(`${totalRegistros} registro(s)`, col2X + 34, cajaY + 6);

  doc.setTextColor(51, 65, 85);
  doc.text('Activas Actualmente:', col2X, cajaY + 14);
  doc.setTextColor(22, 101, 52);
  doc.text(`${totalActivas} en curso`, col2X + 34, cajaY + 14);

  // Columna 3 del recuadro (Alertas de Reincidencia)
  const col3X = pageWidth - margen - 78;
  doc.setTextColor(51, 65, 85);
  doc.text('Casos Reincidentes:', col3X, cajaY + 6);
  if (totalReincidentes > 0) {
    doc.setTextColor(194, 65, 12); // Ámbar oscuro de advertencia
    doc.setFont('helvetica', 'bold');
    doc.text(`⚠ ${totalReincidentes} caso(s) reincidente(s)`, col3X + 33, cajaY + 6);
  } else {
    doc.setTextColor(71, 85, 105);
    doc.text('Ninguno en este listado', col3X + 33, cajaY + 6);
  }

  doc.setTextColor(51, 65, 85);
  doc.text('Total Días Otorgados:', col3X, cajaY + 14);
  doc.setTextColor(0, 85, 179);
  doc.text(`${totalDias} día(s) acumulados`, col3X + 33, cajaY + 14);

  // Tabla Principal de Suspensiones
  y = cajaY + cajaHeight + 5;

  const filas = datos.suspensiones.map((s, idx) => {
    const esReincidente = Number(s.total_suspensiones_historicas || 0) >= 2;
    const textoReincidencia = esReincidente 
      ? `⚠ REINCIDENTE (${s.total_suspensiones_historicas})` 
      : '1ra suspensión';

    const estadoTexto = s.es_activa ? 'ACTIVO' : 'CONCLUIDO';
    const dias = Math.max(1, Number(s.dias_reposo || 1));

    return [
      (idx + 1).toString(),
      s.cedula_paciente || 'S/C',
      s.nombre_completo_paciente || 'N/D',
      `${s.tipo_personal_paciente || 'Titular'}${s.parentesco_paciente ? ` (${s.parentesco_paciente})` : ''}`,
      s.diagnostico_consulta || 'Sin diagnóstico',
      `${s.doctor} (${s.tipo_especialidad})`,
      `${formatearFecha(s.fecha_inicio_suspension)} al ${formatearFecha(s.fecha_final_suspension)}`,
      `${dias} d`,
      `${estadoTexto}\n${textoReincidencia}`
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margen, right: margen },
    head: [[
      '#', 
      'Cédula', 
      'Paciente', 
      'Personal / Afiliación', 
      'Diagnóstico / Causa Médica', 
      'Médico Tratante', 
      'Período Reposo', 
      'Días', 
      'Estado / Control'
    ]],
    body: filas,
    theme: 'grid',
    headStyles: {
      fillColor: [11, 37, 69],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      valign: 'middle'
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 20, fontStyle: 'bold', halign: 'center' },
      2: { cellWidth: 44, fontStyle: 'bold' },
      3: { cellWidth: 32 },
      4: { cellWidth: 50 },
      5: { cellWidth: 42 },
      6: { cellWidth: 34, halign: 'center' },
      7: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 33, halign: 'center', fontSize: 7 }
    },
    didParseCell: (data) => {
      // Si la celda es de Estado/Control y contiene REINCIDENTE, resaltar en advertencia
      if (data.column.index === 8 && typeof data.cell.raw === 'string') {
        if (data.cell.raw.includes('REINCIDENTE')) {
          data.cell.styles.textColor = [194, 65, 12];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw.includes('ACTIVO')) {
          data.cell.styles.textColor = [22, 101, 52];
        }
      }
    }
  });

  // Sección de Firmas al final
  const lastTable = (doc as any).lastAutoTable;
  let firmaY = (lastTable ? lastTable.finalY : y) + 14;

  if (firmaY > pageHeight - 35) {
    doc.addPage();
    firmaY = 30;
  }

  const anchoLineaFirma = 75;
  const firma1X = margen + 20;
  const firma2X = pageWidth - margen - anchoLineaFirma - 20;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(firma1X, firmaY, firma1X + anchoLineaFirma, firmaY);
  doc.line(firma2X, firmaY, firma2X + anchoLineaFirma, firmaY);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(datos.usuarioGenerador || 'Personal Administrativo SISUNERMB', firma1X + anchoLineaFirma / 2, firmaY + 4.5, { align: 'center' });
  doc.text('Dirección de Salud SISUNERMB - UNERMB', firma2X + anchoLineaFirma / 2, firmaY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Control y Registro de Suspensiones', firma1X + anchoLineaFirma / 2, firmaY + 8.5, { align: 'center' });
  doc.text('Visto Bueno y Sello Institucional', firma2X + anchoLineaFirma / 2, firmaY + 8.5, { align: 'center' });

  // Pie de página en todas las páginas
  const totalPagsFinal = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagsFinal; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margen, pageHeight - 8, pageWidth - margen, pageHeight - 8);

    doc.text('SISUNERMB - Sistema Integral de Salud Universitario UNERMB · Control de Reposos Médicos', margen, pageHeight - 4.5);
    doc.text(`Página ${i} de ${totalPagsFinal}`, pageWidth - margen, pageHeight - 4.5, { align: 'right' });
  }

  const fechaIso = new Date().toISOString().split('T')[0];
  const nombreArchivo = `Reporte_Suspensiones_SISUNERMB_${fechaIso}.pdf`;
  const arrayBuffer = doc.output('arraybuffer');
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  let rutaGuardada: string | undefined = undefined;

  // 1. Guardar y abrir mediante comando nativo Tauri si estamos en la app de escritorio
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const bytes = Array.from(new Uint8Array(arrayBuffer));
    rutaGuardada = await invoke<string>('guardar_reporte_pdf', { nombre: nombreArchivo, bytes });
    console.log('✅ Reporte de suspensiones PDF guardado en:', rutaGuardada);
  } catch (errorTauri) {
    console.warn('Tauri no disponible o en entorno navegador:', errorTauri);
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

