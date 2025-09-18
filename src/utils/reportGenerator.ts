import jsPDF from 'jspdf';
import { Prescription, Doctor, Practice } from '../types';

interface ReportData {
  periodo: string;
  totalRecetas: number;
  estadisticasPorDia: Array<{ date: string; count: number }>;
  estadisticasPorMedico: Array<{ doctor: string; count: number }>;
  estadisticasPorPractica: Array<{ practice: string; category: string; count: number }>;
  estadisticasPorTipo: Array<{ type: string; count: number }>;
}

export const generateStatisticsReport = async (data: ReportData): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header del reporte
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('REPORTE DE ESTADÍSTICAS MÉDICAS', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('CENTRO DE OJOS RIO GALLEGOS - CORG', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Período: ${data.periodo}`, 20, yPosition);
    
    yPosition += 5;
    pdf.text(`Fecha de generación: ${new Date().toLocaleDateString('es-AR')}`, 20, yPosition);
    
    yPosition += 15;

    // Resumen general
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMEN GENERAL', 20, yPosition);
    yPosition += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`• Total de recetas emitidas: ${data.totalRecetas}`, 25, yPosition);
    yPosition += 6;
    pdf.text(`• Médicos activos: ${data.estadisticasPorMedico.length}`, 25, yPosition);
    yPosition += 6;
    pdf.text(`• Prácticas diferentes solicitadas: ${data.estadisticasPorPractica.length}`, 25, yPosition);
    yPosition += 6;
    
    const promedioDiario = data.estadisticasPorDia.length > 0 
      ? Math.round(data.totalRecetas / data.estadisticasPorDia.length) 
      : 0;
    pdf.text(`• Promedio de recetas por día: ${promedioDiario}`, 25, yPosition);
    yPosition += 15;

    // Distribución por tipo
    if (data.estadisticasPorTipo.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('DISTRIBUCIÓN POR TIPO DE RECETA', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      data.estadisticasPorTipo.forEach(stat => {
        const porcentaje = data.totalRecetas > 0 
          ? Math.round((stat.count / data.totalRecetas) * 100) 
          : 0;
        pdf.text(`• ${stat.type}: ${stat.count} recetas (${porcentaje}%)`, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    // Estadísticas por médico
    if (data.estadisticasPorMedico.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RECETAS POR MÉDICO', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      data.estadisticasPorMedico.slice(0, 15).forEach((stat, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${index + 1}. ${stat.doctor}: ${stat.count} recetas`, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 10;
    }

    // Verificar si necesitamos nueva página
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    }

    // Top 20 prácticas más solicitadas
    if (data.estadisticasPorPractica.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PRÁCTICAS MÁS SOLICITADAS', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      data.estadisticasPorPractica.slice(0, 20).forEach((stat, index) => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        
        const categoryLabel = stat.category === 'study' ? 'Estudio' : 
                             stat.category === 'treatment' ? 'Tratamiento' : 'Cirugía';
        
        pdf.text(`${index + 1}. ${stat.practice}`, 25, yPosition);
        yPosition += 4;
        pdf.setFont('helvetica', 'italic');
        pdf.text(`   ${categoryLabel} - ${stat.count} solicitudes`, 25, yPosition);
        pdf.setFont('helvetica', 'normal');
        yPosition += 8;
      });
      yPosition += 10;
    }

    // Nueva página para estadísticas diarias si hay muchos datos
    if (data.estadisticasPorDia.length > 0) {
      if (yPosition > pageHeight - 100 || data.estadisticasPorDia.length > 10) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('RECETAS POR DÍA', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      data.estadisticasPorDia.forEach(stat => {
        if (yPosition > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`• ${stat.date}: ${stat.count} recetas`, 25, yPosition);
        yPosition += 6;
      });
    }

    // Footer en todas las páginas
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text(
        `Página ${i} de ${totalPages} - Generado el ${new Date().toLocaleString('es-AR')}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Descargar el PDF
    const fileName = `Reporte_Estadisticas_${data.periodo.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generando reporte PDF:', error);
    throw new Error('Error al generar el reporte PDF. Por favor, intente nuevamente.');
  }
};