import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Prescription } from '../types';
import { companyInfo } from '../data/mockData';

// Función para generar PDF en formato A5 (hoja completa)
export const generatePrescriptionPDF_A5 = async (prescription: Prescription): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a5');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 8;

    // Header con logo y título
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyInfo.name, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 4;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(companyInfo.subtitle, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 6;
    pdf.setFontSize(7);
    pdf.text('DIRECTOR MÉDICO', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 3;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyInfo.director, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 3;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(companyInfo.license, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;

    // Línea separadora
    pdf.setLineWidth(0.5);
    pdf.line(8, yPosition, pageWidth - 8, yPosition);
    yPosition += 6;

    // Información de la receta
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`RECETA N° ${prescription.number}`, 8, yPosition);
    pdf.text(`FECHA: ${new Date(prescription.date).toLocaleDateString('es-AR')}`, pageWidth - 8, yPosition, { align: 'right' });
    
    yPosition += 6;

    // Tipo de receta
    const typeLabels = {
      studies: 'AUTORIZACIÓN DE ESTUDIOS',
      treatments: 'AUTORIZACIÓN DE TRATAMIENTOS',
      authorization: 'AUTORIZACIÓN DE CIRUGÍA'
    };
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(typeLabels[prescription.type] || 'AUTORIZACIÓN MÉDICA', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;

    // Datos del paciente
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DATOS DEL PACIENTE:', 8, yPosition);
    yPosition += 5;

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Nombre y Apellido: ${prescription.patient.name} ${prescription.patient.lastName}`, 8, yPosition);
    yPosition += 3;
    pdf.text(`Obra Social: ${prescription.patient.socialWork}${prescription.patient.plan ? ` - ${prescription.patient.plan}` : ''}`, 8, yPosition);
    yPosition += 3;
    pdf.text(`N° Afiliado: ${prescription.patient.affiliateNumber || 'No especificado'}`, 8, yPosition);
    
    yPosition += 6;

    // Prácticas solicitadas
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SOLICITO:', 8, yPosition);
    yPosition += 5;

    // Organizar prácticas en dos columnas
    const leftMargin = 8;
    const rightMargin = pageWidth - 8;
    const columnWidth = (rightMargin - leftMargin) / 2;
    const rightColumnStart = leftMargin + columnWidth + 5;
    
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    
    let leftColumnY = yPosition;
    let rightColumnY = yPosition;
    
    prescription.items.forEach((item, index) => {
      const isLeftColumn = index % 2 === 0;
      const currentY = isLeftColumn ? leftColumnY : rightColumnY;
      const xPosition = isLeftColumn ? leftMargin : rightColumnStart;
      
      // Texto de la práctica
      const practiceText = `☐ ${item.practice.name.toUpperCase()}`;
      pdf.text(practiceText, xPosition, currentY);
      
      // AO indicator
      const aoX = xPosition + columnWidth - 15;
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.ao || 'AO', aoX, currentY);
      pdf.setFont('helvetica', 'normal');
      
      if (isLeftColumn) {
        leftColumnY += 3;
      } else {
        rightColumnY += 3;
      }
    });
    
    yPosition = Math.max(leftColumnY, rightColumnY) + 5;

    // Observaciones
    if (prescription.additionalNotes) {
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OBSERVACIONES:', 8, yPosition);
      yPosition += 4;
      
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      const notesLines = pdf.splitTextToSize(prescription.additionalNotes, pageWidth - 16);
      notesLines.forEach((line: string) => {
        pdf.text(line, 8, yPosition);
        yPosition += 2.5;
      });
      yPosition += 4;
    }

    // Información del médico
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MÉDICO:', 8, yPosition);
    yPosition += 4;
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(prescription.doctor.name, 8, yPosition);
    yPosition += 3;
    pdf.text(`${prescription.doctor.specialty} - ${prescription.doctor.license}`, 8, yPosition);
    
    yPosition += 10;

    // Área de firma
    const signatureY = Math.max(yPosition, pageHeight - 30);
    
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    
    // Líneas para fecha y firma
    const dateX = 20;
    const signatureX = pageWidth - 35;
    
    pdf.line(dateX, signatureY, dateX + 20, signatureY);
    pdf.line(signatureX, signatureY, signatureX + 25, signatureY);
    
    pdf.text('FECHA', dateX + 10, signatureY + 3, { align: 'center' });
    pdf.text('FIRMA Y SELLO', signatureX + 12.5, signatureY + 3, { align: 'center' });

    // Footer
    const footerY = pageHeight - 15;
    
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    
    // Información de contacto en dos columnas
    const leftFooterX = 8;
    const rightFooterX = pageWidth - 8;
    
    pdf.text(`${companyInfo.address}`, leftFooterX, footerY);
    pdf.text(`Turnos: ${companyInfo.phone1}/${companyInfo.phone2}`, leftFooterX, footerY + 2.5);
    pdf.text(`WhatsApp: ${companyInfo.whatsapp}`, leftFooterX, footerY + 5);
    
    pdf.text(`${companyInfo.social}`, rightFooterX, footerY, { align: 'right' });
    pdf.text(`${companyInfo.location}`, rightFooterX, footerY + 2.5, { align: 'right' });

    // Descargar el PDF
    const fileName = `Receta_${prescription.number}_${prescription.patient.name}_${prescription.patient.lastName}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Error generando PDF A5:', error);
    throw new Error('Error al generar el PDF A5. Por favor, intente nuevamente.');
  }
};

// Función para imprimir directamente en formato A5
export const printPrescriptionPDF_A5 = async (prescription: Prescription): Promise<void> => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a5');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 8;

    // Header con logo y título
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyInfo.name, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 4;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(companyInfo.subtitle, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 6;
    pdf.setFontSize(7);
    pdf.text('DIRECTOR MÉDICO', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 3;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyInfo.director, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 3;
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(companyInfo.license, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;

    // Línea separadora
    pdf.setLineWidth(0.5);
    pdf.line(8, yPosition, pageWidth - 8, yPosition);
    yPosition += 6;

    // Información de la receta
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`RECETA N° ${prescription.number}`, 8, yPosition);
    pdf.text(`FECHA: ${new Date(prescription.date).toLocaleDateString('es-AR')}`, pageWidth - 8, yPosition, { align: 'right' });
    
    yPosition += 6;

    // Tipo de receta
    const typeLabels = {
      studies: 'AUTORIZACIÓN DE ESTUDIOS',
      treatments: 'AUTORIZACIÓN DE TRATAMIENTOS',
      authorization: 'AUTORIZACIÓN DE CIRUGÍA'
    };
    
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(typeLabels[prescription.type] || 'AUTORIZACIÓN MÉDICA', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;

    // Datos del paciente
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DATOS DEL PACIENTE:', 8, yPosition);
    yPosition += 5;

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Nombre y Apellido: ${prescription.patient.name} ${prescription.patient.lastName}`, 8, yPosition);
    yPosition += 3;
    pdf.text(`Obra Social: ${prescription.patient.socialWork}${prescription.patient.plan ? ` - ${prescription.patient.plan}` : ''}`, 8, yPosition);
    yPosition += 3;
    pdf.text(`N° Afiliado: ${prescription.patient.affiliateNumber || 'No especificado'}`, 8, yPosition);
    
    yPosition += 6;

    // Prácticas solicitadas
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SOLICITO:', 8, yPosition);
    yPosition += 5;

    // Organizar prácticas en dos columnas
    const leftMargin = 8;
    const rightMargin = pageWidth - 8;
    const columnWidth = (rightMargin - leftMargin) / 2;
    const rightColumnStart = leftMargin + columnWidth + 5;
    
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    
    let leftColumnY = yPosition;
    let rightColumnY = yPosition;
    
    prescription.items.forEach((item, index) => {
      const isLeftColumn = index % 2 === 0;
      const currentY = isLeftColumn ? leftColumnY : rightColumnY;
      const xPosition = isLeftColumn ? leftMargin : rightColumnStart;
      
      // Texto de la práctica
      const practiceText = `☐ ${item.practice.name.toUpperCase()}`;
      pdf.text(practiceText, xPosition, currentY);
      
      // AO indicator
      const aoX = xPosition + columnWidth - 15;
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.ao || 'AO', aoX, currentY);
      pdf.setFont('helvetica', 'normal');
      
      if (isLeftColumn) {
        leftColumnY += 3;
      } else {
        rightColumnY += 3;
      }
    });
    
    yPosition = Math.max(leftColumnY, rightColumnY) + 5;

    // Observaciones
    if (prescription.additionalNotes) {
      pdf.setFontSize(7);
      pdf.setFont('helvetica', 'bold');
      pdf.text('OBSERVACIONES:', 8, yPosition);
      yPosition += 4;
      
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'normal');
      const notesLines = pdf.splitTextToSize(prescription.additionalNotes, pageWidth - 16);
      notesLines.forEach((line: string) => {
        pdf.text(line, 8, yPosition);
        yPosition += 2.5;
      });
      yPosition += 4;
    }

    // Información del médico
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MÉDICO:', 8, yPosition);
    yPosition += 4;
    
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(prescription.doctor.name, 8, yPosition);
    yPosition += 3;
    pdf.text(`${prescription.doctor.specialty} - ${prescription.doctor.license}`, 8, yPosition);
    
    yPosition += 10;

    // Área de firma
    const signatureY = Math.max(yPosition, pageHeight - 30);
    
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    
    // Líneas para fecha y firma
    const dateX = 20;
    const signatureX = pageWidth - 35;
    
    pdf.line(dateX, signatureY, dateX + 20, signatureY);
    pdf.line(signatureX, signatureY, signatureX + 25, signatureY);
    
    pdf.text('FECHA', dateX + 10, signatureY + 3, { align: 'center' });
    pdf.text('FIRMA Y SELLO', signatureX + 12.5, signatureY + 3, { align: 'center' });

    // Footer
    const footerY = pageHeight - 15;
    
    pdf.setFontSize(5);
    pdf.setFont('helvetica', 'normal');
    
    // Información de contacto en dos columnas
    const leftFooterX = 8;
    const rightFooterX = pageWidth - 8;
    
    pdf.text(`${companyInfo.address}`, leftFooterX, footerY);
    pdf.text(`Turnos: ${companyInfo.phone1}/${companyInfo.phone2}`, leftFooterX, footerY + 2.5);
    pdf.text(`WhatsApp: ${companyInfo.whatsapp}`, leftFooterX, footerY + 5);
    
    pdf.text(`${companyInfo.social}`, rightFooterX, footerY, { align: 'right' });
    pdf.text(`${companyInfo.location}`, rightFooterX, footerY + 2.5, { align: 'right' });

    // Imprimir directamente
    pdf.autoPrint();
    window.open(pdf.output('bloburl'), '_blank');

  } catch (error) {
    console.error('Error generando PDF A5 para imprimir:', error);
    throw new Error('Error al generar el PDF A5 para imprimir. Por favor, intente nuevamente.');
  }
};

export const generatePrescriptionPDF = async (prescription: Prescription): Promise<void> => {
  // Convertir el logo a base64 para incluirlo en el PDF
  const getLogoBase64 = async (): Promise<string> => {
    try {
      const response = await fetch('/Logo-corg.png');
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return '';
    }
  };

  const logoBase64 = await getLogoBase64();

  // Crear el contenido HTML para el PDF que replica exactamente el formato original
  const pdfContent = document.createElement('div');
  pdfContent.style.width = '148mm'; // Mitad de A4 horizontal
  pdfContent.style.height = '210mm'; // Altura A4
  pdfContent.style.padding = '8mm';
  pdfContent.style.fontFamily = 'Arial, sans-serif';
  pdfContent.style.fontSize = '10px';
  pdfContent.style.lineHeight = '1.3';
  pdfContent.style.color = '#000';
  pdfContent.style.backgroundColor = '#fff';
  pdfContent.style.position = 'absolute';
  pdfContent.style.left = '-9999px';
  pdfContent.style.top = '0';
  pdfContent.style.boxSizing = 'border-box';

  const typeLabels = {
    studies: 'AUTORIZACIÓN DE ESTUDIOS',
    treatments: 'AUTORIZACIÓN DE TRATAMIENTOS',
    surgery: 'AUTORIZACIÓN DE CIRUGÍA'
  };

  // Generar las prácticas en formato de dos columnas como el original
  const generatePracticesGrid = () => {
    const practiceItems = prescription.items;
    const shouldUseColumns = practiceItems.length > 12;
    
    let practicesHtml = '<div style="margin: 8px 0;">';
    
    if (shouldUseColumns) {
      // Layout de 2 columnas para más de 12 prácticas
      const leftColumn = practiceItems.slice(0, 12);
      const rightColumn = practiceItems.slice(12);
      
      practicesHtml += '<div style="display: flex; gap: 16px;">';
      
      // Columna izquierda
      practicesHtml += '<div style="flex: 1;">';
      leftColumn.forEach((item) => {
        const practiceName = item.practice.name.toUpperCase();
        const selectedAO = item.ao || 'AO';
        
        practicesHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; padding: 1px 0; border-bottom: 1px dotted #ccc;">
            <span style="font-weight: bold; color: #152741; font-size: 8px;">✓ ${practiceName}</span>
            <span style="font-size: 8px; color: #152741; font-weight: bold;">${selectedAO}</span>
          </div>
        `;
        
        if (item.notes) {
          practicesHtml += `
            <div style="margin-top: 2px; margin-bottom: 3px; padding: 2px; background-color: #f0f4f8; border-left: 2px solid #152741; font-size: 7px; color: #333;">
              Nota: ${item.notes}
            </div>
          `;
        }
      });
      practicesHtml += '</div>';
      
      // Columna derecha
      practicesHtml += '<div style="flex: 1;">';
      rightColumn.forEach((item) => {
        const practiceName = item.practice.name.toUpperCase();
        const selectedAO = item.ao || 'AO';
        
        practicesHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; padding: 1px 0; border-bottom: 1px dotted #ccc;">
            <span style="font-weight: bold; color: #152741; font-size: 8px;">✓ ${practiceName}</span>
            <span style="font-size: 8px; color: #152741; font-weight: bold;">${selectedAO}</span>
          </div>
        `;
        
        if (item.notes) {
          practicesHtml += `
            <div style="margin-top: 2px; margin-bottom: 3px; padding: 2px; background-color: #f0f4f8; border-left: 2px solid #152741; font-size: 7px; color: #333;">
              Nota: ${item.notes}
            </div>
          `;
        }
      });
      practicesHtml += '</div>';
      
      practicesHtml += '</div>';
    } else {
      // Layout de una columna para 12 o menos prácticas
      practiceItems.forEach((item) => {
        const practiceName = item.practice.name.toUpperCase();
        const selectedAO = item.ao || 'AO';
        
        practicesHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; padding: 3px 0; border-bottom: 1px dotted #ccc;">
            <span style="font-weight: bold; color: #152741; font-size: 8px;">✓ ${practiceName}</span>
            <span style="font-size: 8px; color: #152741; font-weight: bold;">${selectedAO}</span>
          </div>
        `;
        
        if (item.notes) {
          practicesHtml += `
            <div style="margin-top: 3px; margin-bottom: 4px; padding: 2px; background-color: #f0f4f8; border-left: 2px solid #152741; font-size: 7px; color: #333;">
              Nota: ${item.notes}
            </div>
          `;
        }
      });
    }
    
    practicesHtml += '</div>';
    
    // Agregar observaciones generales si las hay
    if (prescription.additionalNotes) {
      practicesHtml += `
        <div style="margin-top: 12px; padding: 4px 4px 9px 4px; background-color: #f0f8ff; border-left: 3px solid #1E40AF; font-size: 9px; color: #333;">
          <strong>Observaciones:</strong> ${prescription.additionalNotes}
        </div>
      `;
    }
    
    return practicesHtml;
  };

  pdfContent.innerHTML = `
    <!-- Número de receta sutil arriba a la izquierda -->
    <div style="text-align: left; margin-bottom: 10px;">
      <div style="font-size: 11px; color: #000; font-weight: normal;">R: ${prescription.number}</div>
    </div>
    
    <div style="text-align: center; margin-bottom: 15px;">
      ${logoBase64 ? `
        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 8px;">
          <img src="${logoBase64}" alt="CORG Logo" style="height: 40px; width: auto;" />
        </div>
      ` : ''}
      <div style="font-size: 9px; margin-bottom: 1px; color: #666; font-weight: bold;">DIRECTOR MÉDICO</div>
      <div style="font-size: 9px; margin-bottom: 1px; color: #333;">${companyInfo.director}</div>
      <div style="font-size: 9px; color: #666;">y Equipo</div>
    </div>
    
    <!-- Campos del paciente con líneas punteadas como el original -->
    <div style="margin-bottom: 12px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px; color: #4A5568; font-size: 10px;">
        <span style="margin-right: 8px;">Nombre y Apellido:</span>
        <div style="flex: 1; font-weight: bold; color: #000; position: relative;">
          ${prescription.patient.name} ${prescription.patient.lastName}
          <div style="position: absolute; bottom: -6px; left: 0; right: 0; border-bottom: 1px dotted #666;"></div>
        </div>
      </div>
      
      <div style="display: flex; align-items: center; margin-bottom: 8px; color: #4A5568; font-size: 10px;">
        <span style="margin-right: 8px;">Obra Social:</span>
        <div style="flex: 1; font-weight: bold; color: #000; position: relative;">
          ${prescription.patient.socialWork}${prescription.patient.plan ? ` - ${prescription.patient.plan}` : ''}
          <div style="position: absolute; bottom: -6px; left: 0; right: 0; border-bottom: 1px dotted #666;"></div>
        </div>
      </div>
      
      <div style="display: flex; align-items: center; margin-bottom: 8px; color: #4A5568; font-size: 10px;">
        <span style="margin-right: 8px;">N° AFILIADO</span>
        <div style="flex: 1; font-weight: bold; color: #000; position: relative;">
          ${prescription.patient.affiliateNumber || ''}
          <div style="position: absolute; bottom: -6px; left: 0; right: 0; border-bottom: 1px solid #000;"></div>
        </div>
      </div>
    </div>
    
    <!-- Solicito -->
    <div style="margin-bottom: 12px;">
      <div style="color: #4A5568; font-size: 10px; margin-bottom: 11px; border-bottom: 1px solid #666; padding-bottom: 6px;">
        Solicito:
      </div>
      
      ${generatePracticesGrid()}
    </div>
    
    <!-- Vale por estudios -->
    <div style="margin-bottom: 15px; font-size: 9px; color: #4A5568;">
      <span>Vale X:</span>
      <span style="border-bottom: 1px dotted #666; margin-left: 8px; margin-right: 8px; display: inline-block; width: 60px; height: 12px;"></span>
      <span>Estudio/s</span>
    </div>
    
    <!-- Footer con fecha y firma pegadas -->
    <div style="position: absolute; bottom: 18mm; left: 8mm; right: 8mm;">
      <!-- Firma y fecha pegadas al footer -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px;">
        <div style="text-align: center; width: 45%; font-size: 8px;">
          <div style="font-size: 9px; color: #000; margin-bottom: 8px;">${new Date(prescription.date).toLocaleDateString('es-AR')}</div>
          <div style="border-top: 1px dotted #000; padding-top: 3px; font-weight: bold; color: #4A5568;">FECHA</div>
        </div>
        <div style="text-align: center; width: 45%; font-size: 8px;">
          <div style="height: 17px;"></div>
          <div style="border-top: 1px dotted #000; padding-top: 3px; font-weight: bold; color: #4A5568;">FIRMA Y SELLO</div>
        </div>
      </div>
      
      <!-- Footer azul -->
      <div style="background-color: #152741; color: white; padding: 6px 8px; font-size: 7px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="line-height: 1.3;">
          <div style="margin-bottom: 1px;">📍 ${companyInfo.address}</div>
          <div style="margin-bottom: 1px;">📞 Turnos al Tel.: ${companyInfo.phone1}/${companyInfo.phone2}</div>
          <div>📱 WhatsApp: ${companyInfo.whatsapp}</div>
        </div>
        <div style="text-align: right; line-height: 1.3;">
          <div style="margin-bottom: 1px;">📘📷 ${companyInfo.social}</div>
          <div>📍 ${companyInfo.location}</div>
        </div>
      </div>
      </div>
    </div>
  `;

  // Agregar el contenido al DOM temporalmente
  document.body.appendChild(pdfContent);

  try {
    // Generar el canvas del contenido
    const canvas = await html2canvas(pdfContent, {
      scale: 3, // Mayor resolución para mejor calidad
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 559, // Ancho para media página A4 horizontal
      height: 794  // Alto A4
    });

    // Crear el PDF en formato horizontal
    const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' = landscape (horizontal)
    const imgData = canvas.toDataURL('image/png');
    
    // Dimensiones para A4 horizontal
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
    
    // Cada receta ocupa la mitad del ancho
    const recipeWidth = pdfWidth / 2; // 148.5mm
    const imgWidth = recipeWidth - 4; // Margen pequeño
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Centrar verticalmente si es necesario
    const yOffset = imgHeight > pdfHeight ? 0 : (pdfHeight - imgHeight) / 2;

    // Agregar la receta en el lado izquierdo
    pdf.addImage(imgData, 'PNG', 2, yOffset, imgWidth, Math.min(imgHeight, pdfHeight));
    
    // Línea divisoria vertical punteada
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(pdfWidth / 2, 0, pdfWidth / 2, pdfHeight);

    // Descargar el PDF
    pdf.save(`Receta_${prescription.number}_${prescription.patient.name}_${prescription.patient.lastName}`.replace(/\s+/g, '_') + '.pdf');

  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error('Error al generar el PDF. Por favor, intente nuevamente.');
  } finally {
    // Remover el contenido temporal del DOM
    document.body.removeChild(pdfContent);
  }
};

// Función para imprimir directamente
export const printPrescriptionPDF = async (prescription: Prescription): Promise<void> => {
  // Convertir el logo a base64 para incluirlo en el PDF
  const getLogoBase64 = async (): Promise<string> => {
    try {
      const response = await fetch('/Logo-corg.png');
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return '';
    }
  };

  const logoBase64 = await getLogoBase64();

  // Crear el contenido HTML para el PDF que replica exactamente el formato original
  const pdfContent = document.createElement('div');
  pdfContent.style.width = '148mm'; // Mitad de A4 horizontal
  pdfContent.style.height = '210mm'; // Altura A4
  pdfContent.style.padding = '8mm';
  pdfContent.style.fontFamily = 'Arial, sans-serif';
  pdfContent.style.fontSize = '10px';
  pdfContent.style.lineHeight = '1.3';
  pdfContent.style.color = '#000';
  pdfContent.style.backgroundColor = '#fff';
  pdfContent.style.position = 'absolute';
  pdfContent.style.left = '-9999px';
  pdfContent.style.top = '0';
  pdfContent.style.boxSizing = 'border-box';

  const typeLabels = {
    studies: 'AUTORIZACIÓN DE ESTUDIOS',
    treatments: 'AUTORIZACIÓN DE TRATAMIENTOS',
    surgery: 'AUTORIZACIÓN DE CIRUGÍA'
  };

  // Generar las prácticas en formato de dos columnas como el original
  const generatePracticesGrid = () => {
    const practiceItems = prescription.items;
    const shouldUseColumns = practiceItems.length > 12;
    
    let practicesHtml = '<div style="margin: 8px 0;">';
    
    if (shouldUseColumns) {
      // Layout de 2 columnas para más de 12 prácticas
      const leftColumn = practiceItems.slice(0, 12);
      const rightColumn = practiceItems.slice(12);
      
      practicesHtml += '<div style="display: flex; gap: 16px;">';
      
      // Columna izquierda
      practicesHtml += '<div style="flex: 1;">';
      leftColumn.forEach((item) => {
        const practiceName = item.practice.name.toUpperCase();
        const selectedAO = item.ao || 'AO';
        
        practicesHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; padding: 1px 0; border-bottom: 1px dotted #ccc;">
            <span style="font-weight: bold; color: #152741; font-size: 8px;">✓ ${practiceName}</span>
            <span style="font-size: 8px; color: #152741; font-weight: bold;">${selectedAO}</span>
          </div>
        `;
        
        if (item.notes) {
          practicesHtml += `
            <div style="margin-top: 2px; margin-bottom: 3px; padding: 2px; background-color: #f0f4f8; border-left: 2px solid #152741; font-size: 7px; color: #333;">
              Nota: ${item.notes}
            </div>
          `;
        }
      });
      practicesHtml += '</div>';
      
      // Columna derecha
      practicesHtml += '<div style="flex: 1;">';
      rightColumn.forEach((item) => {
        const practiceName = item.practice.name.toUpperCase();
        const selectedAO = item.ao || 'AO';
        
        practicesHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; padding: 1px 0; border-bottom: 1px dotted #ccc;">
            <span style="font-weight: bold; color: #152741; font-size: 8px;">✓ ${practiceName}</span>
            <span style="font-size: 8px; color: #152741; font-weight: bold;">${selectedAO}</span>
          </div>
        `;
        
        if (item.notes) {
          practicesHtml += `
            <div style="margin-top: 2px; margin-bottom: 3px; padding: 2px; background-color: #f0f4f8; border-left: 2px solid #152741; font-size: 7px; color: #333;">
              Nota: ${item.notes}
            </div>
          `;
        }
      });
      practicesHtml += '</div>';
      
      practicesHtml += '</div>';
    } else {
      // Layout de una columna para 12 o menos prácticas
      practiceItems.forEach((item) => {
        const practiceName = item.practice.name.toUpperCase();
        const selectedAO = item.ao || 'AO';
        
        practicesHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; padding: 3px 0; border-bottom: 1px dotted #ccc;">
            <span style="font-weight: bold; color: #152741; font-size: 8px;">✓ ${practiceName}</span>
            <span style="font-size: 8px; color: #152741; font-weight: bold;">${selectedAO}</span>
          </div>
        `;
        
        if (item.notes) {
          practicesHtml += `
            <div style="margin-top: 3px; margin-bottom: 4px; padding: 2px; background-color: #f0f4f8; border-left: 2px solid #152741; font-size: 7px; color: #333;">
              Nota: ${item.notes}
            </div>
          `;
        }
      });
    }
    
    practicesHtml += '</div>';
    
    // Agregar observaciones generales si las hay
    if (prescription.additionalNotes) {
      practicesHtml += `
        <div style="margin-top: 12px; padding: 4px 4px 9px 4px; background-color: #f0f8ff; border-left: 3px solid #1E40AF; font-size: 9px; color: #333;">
          <strong>Observaciones:</strong> ${prescription.additionalNotes}
        </div>
      `;
    }
    
    return practicesHtml;
  };

  pdfContent.innerHTML = `
    <!-- Número de receta sutil arriba a la izquierda -->
    <div style="text-align: left; margin-bottom: 10px;">
      <div style="font-size: 11px; color: #000; font-weight: normal;">R: ${prescription.number}</div>
    </div>
    
    <div style="text-align: center; margin-bottom: 15px;">
      ${logoBase64 ? `
        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 8px;">
          <img src="${logoBase64}" alt="CORG Logo" style="height: 40px; width: auto;" />
        </div>
      ` : ''}
      <div style="font-size: 9px; margin-bottom: 1px; color: #666; font-weight: bold;">DIRECTOR MÉDICO</div>
      <div style="font-size: 9px; margin-bottom: 1px; color: #333;">${companyInfo.director}</div>
      <div style="font-size: 9px; color: #666;">y Equipo</div>
    </div>
    
    <!-- Campos del paciente con líneas punteadas como el original -->
    <div style="margin-bottom: 12px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px; color: #4A5568; font-size: 10px;">
        <span style="margin-right: 8px;">Nombre y Apellido:</span>
        <div style="flex: 1; font-weight: bold; color: #000; position: relative;">
          ${prescription.patient.name} ${prescription.patient.lastName}
          <div style="position: absolute; bottom: -6px; left: 0; right: 0; border-bottom: 1px dotted #666;"></div>
        </div>
      </div>
      
      <div style="display: flex; align-items: center; margin-bottom: 8px; color: #4A5568; font-size: 10px;">
        <span style="margin-right: 8px;">Obra Social:</span>
        <div style="flex: 1; font-weight: bold; color: #000; position: relative;">
          ${prescription.patient.socialWork}${prescription.patient.plan ? ` - ${prescription.patient.plan}` : ''}
          <div style="position: absolute; bottom: -6px; left: 0; right: 0; border-bottom: 1px dotted #666;"></div>
        </div>
      </div>
      
      <div style="display: flex; align-items: center; margin-bottom: 8px; color: #4A5568; font-size: 10px;">
        <span style="margin-right: 8px;">N° AFILIADO</span>
        <div style="flex: 1; font-weight: bold; color: #000; position: relative;">
          ${prescription.patient.affiliateNumber || ''}
          <div style="position: absolute; bottom: -6px; left: 0; right: 0; border-bottom: 1px solid #000;"></div>
        </div>
      </div>
    </div>
    
    <!-- Solicito -->
    <div style="margin-bottom: 12px;">
      <div style="color: #4A5568; font-size: 10px; margin-bottom: 11px; border-bottom: 1px solid #666; padding-bottom: 6px;">
        Solicito:
      </div>
      
      ${generatePracticesGrid()}
    </div>
    
    <!-- Vale por estudios -->
    <div style="margin-bottom: 15px; font-size: 9px; color: #4A5568;">
      <span>Vale X:</span>
      <span style="border-bottom: 1px dotted #666; margin-left: 8px; margin-right: 8px; display: inline-block; width: 60px; height: 12px;"></span>
      <span>Estudio/s</span>
    </div>
    
    <!-- Footer con fecha y firma pegadas -->
    <div style="position: absolute; bottom: 18mm; left: 8mm; right: 8mm;">
      <!-- Firma y fecha pegadas al footer -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px;">
        <div style="text-align: center; width: 45%; font-size: 8px;">
          <div style="font-size: 9px; color: #000; margin-bottom: 8px;">${new Date(prescription.date).toLocaleDateString('es-AR')}</div>
          <div style="border-top: 1px dotted #000; padding-top: 3px; font-weight: bold; color: #4A5568;">FECHA</div>
        </div>
        <div style="text-align: center; width: 45%; font-size: 8px;">
          <div style="height: 17px;"></div>
          <div style="border-top: 1px dotted #000; padding-top: 3px; font-weight: bold; color: #4A5568;">FIRMA Y SELLO</div>
        </div>
      </div>
      
      <!-- Footer azul -->
      <div style="background-color: #152741; color: white; padding: 6px 8px; font-size: 7px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="line-height: 1.3;">
            <div style="margin-bottom: 1px;">📍 ${companyInfo.address}</div>
            <div style="margin-bottom: 1px;">📞 Turnos al Tel.: ${companyInfo.phone1}/${companyInfo.phone2}</div>
            <div>📱 WhatsApp: ${companyInfo.whatsapp}</div>
          </div>
          <div style="text-align: right; line-height: 1.3;">
            <div style="margin-bottom: 1px;">📘📷 ${companyInfo.social}</div>
            <div>📍 ${companyInfo.location}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Agregar el contenido al DOM temporalmente
  document.body.appendChild(pdfContent);

  try {
    // Generar el canvas del contenido
    const canvas = await html2canvas(pdfContent, {
      scale: 3, // Mayor resolución para mejor calidad
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 559, // Ancho para media página A4 horizontal
      height: 794  // Alto A4
    });

    // Crear el PDF en formato horizontal
    const pdf = new jsPDF('l', 'mm', 'a4'); // 'l' = landscape (horizontal)
    const imgData = canvas.toDataURL('image/png');
    
    // Dimensiones para A4 horizontal
    const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
    
    // Cada receta ocupa la mitad del ancho
    const recipeWidth = pdfWidth / 2; // 148.5mm
    const imgWidth = recipeWidth - 4; // Margen pequeño
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Centrar verticalmente si es necesario
    const yOffset = imgHeight > pdfHeight ? 0 : (pdfHeight - imgHeight) / 2;

    // Agregar la receta en el lado izquierdo
    pdf.addImage(imgData, 'PNG', 2, yOffset, imgWidth, Math.min(imgHeight, pdfHeight));
    
    // Línea divisoria vertical punteada
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineDashPattern([2, 2], 0);
    pdf.line(pdfWidth / 2, 0, pdfWidth / 2, pdfHeight);

    // Imprimir directamente
    pdf.autoPrint();
    window.open(pdf.output('bloburl'), '_blank');

  } catch (error) {
    console.error('Error generando PDF para imprimir:', error);
    throw new Error('Error al generar el PDF para imprimir. Por favor, intente nuevamente.');
  } finally {
    // Remover el contenido temporal del DOM
    document.body.removeChild(pdfContent);
  }
};

// Función para generar múltiples recetas en una hoja
export const generateMultiplePrescriptionsPDF = async (prescriptions: Prescription[]): Promise<void> => {
  if (prescriptions.length === 0) return;

  // Convertir el logo a base64 para incluirlo en el PDF
  const getLogoBase64 = async (): Promise<string> => {
    try {
      const response = await fetch('/Logo-corg.png');
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading logo:', error);
      return '';
    }
  };

  const logoBase64 = await getLogoBase64();
  const pdf = new jsPDF('l', 'mm', 'a4'); // Formato horizontal
  const pdfWidth = pdf.internal.pageSize.getWidth(); // 297mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 210mm
  const recipeWidth = pdfWidth / 2; // 148.5mm cada receta

  for (let i = 0; i < prescriptions.length; i++) {
    const prescription = prescriptions[i];
    const isLeftSide = i % 2 === 0;
    
    // Agregar nueva página si es lado izquierdo y no es la primera receta
    if (i > 0 && isLeftSide) {
      pdf.addPage();
    }

    // Crear el contenido HTML para esta receta específica
    const pdfContent = document.createElement('div');
    pdfContent.style.width = '148mm'; // Mitad de A4 horizontal
    pdfContent.style.height = '210mm'; // Altura A4
    pdfContent.style.padding = '8mm';
    pdfContent.style.fontFamily = 'Arial, sans-serif';
    pdfContent.style.fontSize = '10px';
    pdfContent.style.lineHeight = '1.3';
    pdfContent.style.color = '#000';
    pdfContent.style.backgroundColor = '#fff';
    pdfContent.style.position = 'absolute';
    pdfContent.style.left = '-9999px';
    pdfContent.style.top = '0';
    pdfContent.style.boxSizing = 'border-box';

    // Generar las prácticas en formato de dos columnas
    const generatePracticesGrid = () => {
      const practiceItems = prescription.items;
      const shouldUseColumns = practiceItems.length > 12;
      
      let practicesHtml = '<div style="margin: 8px 0;">';
      
      if (shouldUseColumns) {
        // Layout de 2 columnas para más de 12 prácticas
        const leftColumn = practiceItems.slice(0, 12);
        const rightColumn = practiceItems.slice(12);
        
        practicesHtml += '<div style="display: flex; gap: 16px;">';
        
        // Columna izquierda
        practicesHtml += '<div style="flex: 1;">';
        leftColumn.forEach((item) => {
          const practiceName = item.practice.name.toUpperCase();
          const selectedAO = item.ao || 'AO';
          
          practicesHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; padding: 1px 0; border-bottom: 1px dotted #ccc;">
              <span style="font-weight: bold; color: #152741; font-size: 8px;">✓ ${practiceName}</span>
              <span style="font-size: 8px; color: #152741; font-weight: bold;">${selectedAO}</span>
            </div>
          `;
          
          if (item.notes) {
            practicesHtml += `
              <div style="margin-top: 2px; margin-bottom: 3px; padding: 2px; background-color: #f0f4f8; border-left: 2px solid #152741; font-size: 7px; color: #333;">
                Nota: ${item.notes}
              </div>
            `;
          }
        });
        practicesHtml += '</div>';
        
        // Columna derecha
        practicesHtml += '<div style="flex: 1;">';
        rightColumn.forEach((item) => {
          const practiceName = item.practice.name.toUpperCase();
          const selectedAO = item.ao || 'AO';
          
          practicesHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; padding: 1px 0; border-bottom: 1px dotted #ccc;">
              <span style="font-weight: bold; color: #152741; font-size: 8px;">✓ ${practiceName}</span>
              <span style="font-size: 8px; color: #152741; font-weight: bold;">${selectedAO}</span>
            </div>
          `;
          
          if (item.notes) {
            practicesHtml += `
              <div style="margin-top: 2px; margin-bottom: 3px; padding: 2px; background-color: #f0f4f8; border-left: 2px solid #152741; font-size: 7px; color: #333;">
                Nota: ${item.notes}
              </div>
            `;
          }
        });
        practicesHtml += '</div>';
        
        practicesHtml += '</div>';
      } else {
        // Layout de una columna para 12 o menos prácticas
        practiceItems.forEach((item) => {
          const practiceName = item.practice.name.toUpperCase();
          const selectedAO = item.ao || 'AO';
          
          practicesHtml += `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; padding: 3px 0; border-bottom: 1px dotted #ccc;">
              <span style="font-weight: bold; color: #152741; font-size: 8px;">✓ ${practiceName}</span>
              <span style="font-size: 8px; color: #152741; font-weight: bold;">${selectedAO}</span>
            </div>
          `;
          
          if (item.notes) {
            practicesHtml += `
              <div style="margin-top: 3px; margin-bottom: 4px; padding: 2px; background-color: #f0f4f8; border-left: 2px solid #152741; font-size: 7px; color: #333;">
                Nota: ${item.notes}
              </div>
            `;
          }
        });
      }
      
      practicesHtml += '</div>';
      
      // Agregar observaciones generales si las hay
      if (prescription.additionalNotes) {
        practicesHtml += `
          <div style="margin-top: 12px; padding: 4px 4px 9px 4px; background-color: #f0f8ff; border-left: 3px solid #1E40AF; font-size: 9px; color: #333;">
            <strong>Observaciones:</strong> ${prescription.additionalNotes}
          </div>
        `;
      }
      
      return practicesHtml;
    };

    pdfContent.innerHTML = `
      <!-- Número de receta sutil arriba a la izquierda -->
      <div style="text-align: left; margin-bottom: 10px;">
        <div style="font-size: 11px; color: #000; font-weight: normal;">R: ${prescription.number}</div>
      </div>
      
      <div style="text-align: center; margin-bottom: 15px;">
        ${logoBase64 ? `
          <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 8px;">
            <img src="${logoBase64}" alt="CORG Logo" style="height: 40px; width: auto;" />
          </div>
        ` : ''}
        <div style="font-size: 9px; margin-bottom: 1px; color: #666; font-weight: bold;">DIRECTOR MÉDICO</div>
        <div style="font-size: 9px; margin-bottom: 1px; color: #333;">${companyInfo.director}</div>
        <div style="font-size: 9px; color: #666;">y Equipo</div>
      </div>
      
      <!-- Campos del paciente con líneas punteadas como el original -->
      <div style="margin-bottom: 12px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px; color: #4A5568; font-size: 10px;">
          <span style="margin-right: 8px;">Nombre y Apellido:</span>
          <div style="flex: 1; font-weight: bold; color: #000; position: relative;">
            ${prescription.patient.name} ${prescription.patient.lastName}
            <div style="position: absolute; bottom: -6px; left: 0; right: 0; border-bottom: 1px dotted #666;"></div>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; margin-bottom: 8px; color: #4A5568; font-size: 10px;">
          <span style="margin-right: 8px;">Obra Social:</span>
          <div style="flex: 1; font-weight: bold; color: #000; position: relative;">
            ${prescription.patient.socialWork}${prescription.patient.plan ? ` - ${prescription.patient.plan}` : ''}
            <div style="position: absolute; bottom: -6px; left: 0; right: 0; border-bottom: 1px dotted #666;"></div>
          </div>
        </div>
        
        <div style="display: flex; align-items: center; margin-bottom: 8px; color: #4A5568; font-size: 10px;">
          <span style="margin-right: 8px;">N° AFILIADO</span>
          <div style="flex: 1; font-weight: bold; color: #000; position: relative;">
            ${prescription.patient.affiliateNumber || ''}
            <div style="position: absolute; bottom: -6px; left: 0; right: 0; border-bottom: 1px solid #000;"></div>
          </div>
        </div>
      </div>
      
      <!-- Solicito -->
      <div style="margin-bottom: 12px;">
        <div style="color: #4A5568; font-size: 10px; margin-bottom: 11px; border-bottom: 1px solid #666; padding-bottom: 6px;">
          Solicito:
        </div>
        
        ${generatePracticesGrid()}
      </div>
      
      <!-- Vale por estudios -->
      <div style="margin-bottom: 15px; font-size: 9px; color: #4A5568;">
        <span>Vale X:</span>
        <span style="border-bottom: 1px dotted #666; margin-left: 8px; margin-right: 8px; display: inline-block; width: 60px; height: 12px;"></span>
        <span>Estudio/s</span>
      </div>
      
      <!-- Footer con fecha y firma pegadas -->
      <div style="position: absolute; bottom: 18mm; left: 8mm; right: 8mm;">
        <!-- Firma y fecha pegadas al footer -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 10px;">
          <div style="text-align: center; width: 45%; font-size: 8px;">
            <div style="font-size: 9px; color: #000; margin-bottom: 8px;">${new Date(prescription.date).toLocaleDateString('es-AR')}</div>
            <div style="border-top: 1px dotted #000; padding-top: 3px; font-weight: bold; color: #4A5568;">FECHA</div>
          </div>
          <div style="text-align: center; width: 45%; font-size: 8px;">
            <div style="height: 17px;"></div>
            <div style="border-top: 1px dotted #000; padding-top: 3px; font-weight: bold; color: #4A5568;">FIRMA Y SELLO</div>
          </div>
        </div>
        
        <!-- Footer azul -->
        <div style="background-color: #152741; color: white; padding: 6px 8px; font-size: 7px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="line-height: 1.3;">
              <div style="margin-bottom: 1px;">📍 ${companyInfo.address}</div>
              <div style="margin-bottom: 1px;">📞 Turnos al Tel.: ${companyInfo.phone1}/${companyInfo.phone2}</div>
              <div>📱 WhatsApp: ${companyInfo.whatsapp}</div>
            </div>
            <div style="text-align: right; line-height: 1.3;">
              <div style="margin-bottom: 1px;">📘📷 ${companyInfo.social}</div>
              <div>📍 ${companyInfo.location}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Agregar el contenido al DOM temporalmente
    document.body.appendChild(pdfContent);
    
    try {
      // Generar el canvas del contenido
      const canvas = await html2canvas(pdfContent, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 559, // Ancho para media página A4 horizontal
        height: 794  // Alto A4
      });

      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = recipeWidth - 4; // Margen pequeño
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Centrar verticalmente si es necesario
      const yOffset = imgHeight > pdfHeight ? 0 : (pdfHeight - imgHeight) / 2;

      // Posición X según si es lado izquierdo o derecho
      const xOffset = isLeftSide ? 2 : pdfWidth / 2 + 2;

      // Agregar la receta
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, Math.min(imgHeight, pdfHeight));

      // Línea divisoria vertical punteada (solo si hay recetas en ambos lados)
      if (prescriptions.length > 1) {
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineDashPattern([2, 2], 0);
        pdf.line(pdfWidth / 2, 0, pdfWidth / 2, pdfHeight);
      }

    } catch (error) {
      console.error(`Error generando PDF para receta ${i + 1}:`, error);
    } finally {
      // Remover el contenido temporal del DOM
      document.body.removeChild(pdfContent);
    }
  }

  // Abrir PDF en nueva ventana para imprimir directamente
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  
  try {
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      // Fallback: descargar si no se puede abrir ventana
      const fileName = `Recetas_Lote_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    }
  } catch (error) {
    console.error('Error opening print window:', error);
    // Fallback: descargar
    const fileName = `Recetas_Lote_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } finally {
    // Limpiar URL después de un tiempo
    setTimeout(() => {
      URL.revokeObjectURL(pdfUrl);
    }, 1000);
  }
};