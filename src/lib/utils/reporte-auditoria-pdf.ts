import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { RegistroAuditoria } from '$lib/types/auditoria';
import { LOGO_UNERMB_BASE64, LOGO_SISUNERMB_BASE64 } from './pdf-logos';

export interface DatosReporteAuditoriaPDF {
  tituloReporte?: string;
  usuarioGenerador: string;
  registros: RegistroAuditoria[];
  filtroAccion?: string;
  filtroEntidad?: string;
  filtroTexto?: string;
}

export interface ResultadoGeneracionPDF {
  nombreArchivo: string;
  blobUrl: string;
  rutaGuardada?: string;
}

export async function generarPDFAuditoria(datos: DatosReporteAuditoriaPDF): Promise<ResultadoGeneracionPDF> {
  // Orientación horizontal (landscape) para máxima legibilidad de detalles y trazabilidad
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
    console.warn('Advertencia al incrustar logotipos en el reporte de auditoría:', errLogos);
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
  const titulo = datos.tituloReporte || 'REPORTE OFICIAL DE AUDITORÍA Y TRAZABILIDAD OPERATIVA';
  doc.text(titulo, pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Registro cronológico de altas, modificaciones y bajas lógicas (ocultamiento) de registros institucionales', pageWidth / 2, y, { align: 'center' });

  // Recuadro de Metadatos
  y += 4;
  const cajaY = y;
  const cajaHeight = 18;
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
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  const col1X = margen + 6;
  const col2X = margen + 70;
  const col3X = margen + 140;
  const col4X = margen + 205;

  let metaY = cajaY + 6;
  doc.text(`Fecha de Emisión: ${fechaHoy} - ${horaHoy} (VET)`, col1X, metaY);
  doc.text(`Generado por: ${datos.usuarioGenerador || 'Administrador'}`, col2X, metaY);
  doc.text(`Filtro Acción: ${datos.filtroAccion || 'Todas las acciones'}`, col3X, metaY);
  doc.text(`Total Eventos: ${datos.registros.length} registros`, col4X, metaY);

  metaY += 5.5;
  doc.text('Seguridad: Bajas lógicas (datos preservados)', col1X, metaY);
  doc.text(`Módulo/Entidad: ${datos.filtroEntidad || 'Todos los módulos'}`, col2X, metaY);
  if (datos.filtroTexto && datos.filtroTexto.trim()) {
    doc.text(`Criterio: "${datos.filtroTexto.trim()}"`, col3X, metaY);
  } else {
    doc.text('Criterio: Registro histórico general', col3X, metaY);
  }
  doc.text('Estado: Auditado', col4X, metaY);

  y = cajaY + cajaHeight + 5;

  // Estadísticas rápidas de auditoría
  const totalAltas = datos.registros.filter(r => r.accion_auditoria === 'AGREGÓ').length;
  const totalModificaciones = datos.registros.filter(r => r.accion_auditoria === 'EDITÓ').length;
  const totalBajas = datos.registros.filter(r => r.accion_auditoria === 'ELIMINÓ').length;

  const anchoCajaEst = (pageWidth - margen * 2 - 9) / 4;
  const altoCajaEst = 10;

  const metricas = [
    { label: 'TOTAL EVENTOS', valor: datos.registros.length.toString(), color: [0, 85, 179] },
    { label: 'REGISTROS NUEVOS (AGREGÓ)', valor: totalAltas.toString(), color: [21, 128, 61] },
    { label: 'MODIFICACIONES (EDITÓ)', valor: totalModificaciones.toString(), color: [29, 78, 216] },
    { label: 'BAJAS LÓGICAS (ELIMINÓ)', valor: totalBajas.toString(), color: [185, 28, 28] }
  ];

  metricas.forEach((m, idx) => {
    const xPos = margen + idx * (anchoCajaEst + 3);
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(xPos, y, anchoCajaEst, altoCajaEst, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(m.color[0], m.color[1], m.color[2]);
    doc.text(m.label, xPos + anchoCajaEst / 2, y + 4, { align: 'center' });

    doc.setFontSize(9.5);
    doc.text(m.valor, xPos + anchoCajaEst / 2, y + 8.5, { align: 'center' });
  });

  y += altoCajaEst + 4;

  // Preparación de los datos de la tabla
  const cuerpoTabla = datos.registros.map((reg, index) => {
    return [
      (index + 1).toString(),
      reg.fecha_formateada || reg.fecha_auditoria || 'N/D',
      reg.usuario_auditoria || 'Administrador',
      reg.accion_auditoria,
      reg.entidad_auditoria,
      reg.detalle_auditoria
    ];
  });

  // Generación de la tabla principal
  autoTable(doc, {
    startY: y,
    head: [[
      'N°',
      'Fecha / Hora (VET)',
      'Usuario Operativo',
      'Acción',
      'Entidad',
      'Detalle Descriptivo de la Operación Realizada'
    ]],
    body: cuerpoTabla,
    theme: 'grid',
    margin: { left: margen, right: margen, bottom: 22 },
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica',
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [0, 85, 179],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      1: { cellWidth: 32, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 26, halign: 'left', fontStyle: 'bold' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 'auto', halign: 'left' }
    },
    didParseCell: (data) => {
      // Estilización visual para la columna de acción
      if (data.section === 'body' && data.column.index === 3) {
        const val = data.cell.raw;
        if (val === 'AGREGÓ') {
          data.cell.styles.textColor = [21, 128, 61];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'EDITÓ') {
          data.cell.styles.textColor = [29, 78, 216];
          data.cell.styles.fontStyle = 'bold';
        } else if (val === 'ELIMINÓ') {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      }
      if (data.section === 'body' && data.column.index === 4) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [71, 85, 105];
      }
    }
  });

  // Sección de firmas institucionales al pie
  const finalY = (doc as any).lastAutoTable.finalY || y;
  const firmaY = Math.min(finalY + 12, pageHeight - 20);

  if (firmaY > pageHeight - 24) {
    doc.addPage();
  }

  const firmaActualY = (firmaY > pageHeight - 24) ? 35 : firmaY;
  const anchoLineaFirma = 65;
  const firma1X = margen + 30;
  const firma2X = pageWidth - margen - anchoLineaFirma - 30;

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.4);
  doc.line(firma1X, firmaActualY, firma1X + anchoLineaFirma, firmaActualY);
  doc.line(firma2X, firmaActualY, firma2X + anchoLineaFirma, firmaActualY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text(datos.usuarioGenerador || 'Personal Administrativo SISUNERMB', firma1X + anchoLineaFirma / 2, firmaActualY + 4.5, { align: 'center' });
  doc.text('Coordinación de Salud / Auditoría UNERMB', firma2X + anchoLineaFirma / 2, firmaActualY + 4.5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Responsable de Auditoría y Trazabilidad', firma1X + anchoLineaFirma / 2, firmaActualY + 8.5, { align: 'center' });
  doc.text('Firma y Sello de Certificación', firma2X + anchoLineaFirma / 2, firmaActualY + 8.5, { align: 'center' });

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

    doc.text('SISUNERMB - Sistema Integral de Salud Universitario UNERMB · Historial Oficial de Auditoría y Trazabilidad', margen, pageHeight - 4.5);
    doc.text(`Página ${i} de ${totalPagsFinal}`, pageWidth - margen, pageHeight - 4.5, { align: 'right' });
  }

  const fechaIso = new Date().toISOString().split('T')[0];
  const nombreArchivo = `Reporte_Auditoria_SISUNERMB_${fechaIso}.pdf`;
  const arrayBuffer = doc.output('arraybuffer');
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const blobUrl = URL.createObjectURL(blob);

  let rutaGuardada: string | undefined = undefined;

  // 1. Guardar y abrir mediante comando nativo Tauri si estamos en la app de escritorio
  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const bytes = Array.from(new Uint8Array(arrayBuffer));
    rutaGuardada = await invoke<string>('guardar_reporte_pdf', { nombre: nombreArchivo, bytes });
    console.log('✅ Reporte de auditoría PDF guardado en:', rutaGuardada);
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

