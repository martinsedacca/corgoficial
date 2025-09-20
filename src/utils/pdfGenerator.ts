import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Prescription } from '../types';
import { companyInfo } from '../data/mockData';

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
    authorization: 'AUTORIZACIÓN DE CIRUGÍA'
  };

  // Generar las prácticas en formato de dos columnas como el original
  const generatePracticesGrid = () => {
    // Crear HTML solo con las prácticas seleccionadas en la receta
    let practicesHtml = '<div style="margin: 8px 0;">';
    
    // Mostrar solo las prácticas seleccionadas en la receta
    prescription.items.forEach((item, index) => {
      const practiceName = item.practice.name.toUpperCase();
      const selectedAO = item.ao || 'AO';
      
      practicesHtml += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 3px 0; border-bottom: 1px dotted #ccc;">
          <span style="font-weight: bold; color: #152741; font-size: 10px;">✓ ${practiceName}</span>
          <span style="font-size: 10px; color: #152741; font-weight: bold; background: #f0f4f8; padding: 2px 6px; border-radius: 3px; display: flex; align-items: center; justify-content: center; min-height: 16px;">${selectedAO}</span>
        </div>
      `;
      
      // Agregar notas específicas de la práctica si las hay
      if (item.notes) {
        practicesHtml += `
          <div style="margin-top: 8px; margin-bottom: 8px; padding: 4px; background-color: #f0f4f8; border-left: 3px solid #152741; font-size: 9px; color: #333;">
            Nota: ${item.notes}
          </div>
        `;
      }
    });
    
    practicesHtml += '</div>';
    
    // Agregar observaciones generales si las hay
    if (prescription.additionalNotes) {
      practicesHtml += `
        <div style="margin-top: 12px; padding: 4px; background-color: #f0f8ff; border-left: 3px solid #1E40AF; font-size: 9px; color: #333;">
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
      <div style="font-size: 11px; margin-bottom: 2px; color: #666; letter-spacing: 1px;">${companyInfo.subtitle}</div>
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
          ${prescription.patient.affiliateNumber}
          <div style="position: absolute; bottom: -6px; left: 0; right: 0; border-bottom: 1px solid #000;"></div>
        </div>
      </div>
    </div>
    
    <!-- Solicito -->
    <div style="margin-bottom: 12px;">
      <div style="color: #4A5568; font-size: 10px; margin-bottom: 11px; border-bottom: 1px solid #666; padding-bottom: 2px;">
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
    pdf.save(`Receta_${prescription.number}_${prescription.patient.name.replace(/\s+/g, '_')}.pdf`);

  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Error al generar el PDF. Por favor, intente nuevamente.');
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
    authorization: 'AUTORIZACIÓN DE CIRUGÍA'
  };

  // Generar las prácticas en formato de dos columnas como el original
  const generatePracticesGrid = () => {
    // Crear HTML solo con las prácticas seleccionadas en la receta
    let practicesHtml = '<div style="margin: 8px 0;">';
    
    // Mostrar solo las prácticas seleccionadas en la receta
    prescription.items.forEach((item, index) => {
      const practiceName = item.practice.name.toUpperCase();
      const selectedAO = item.ao || 'AO';
      
      practicesHtml += `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding: 3px 0; border-bottom: 1px dotted #ccc;">
          <span style="font-weight: bold; color: #152741; font-size: 10px;">✓ ${practiceName}</span>
          <span style="font-size: 10px; color: #152741; font-weight: bold; background: #f0f4f8; padding: 2px 6px; border-radius: 3px; display: flex; align-items: center; justify-content: center; min-height: 16px;">${selectedAO}</span>
        </div>
      `;
      
      // Agregar notas específicas de la práctica si las hay
      if (item.notes) {
        practicesHtml += `
          <div style="margin-top: 8px; margin-bottom: 8px; padding: 4px; background-color: #f0f4f8; border-left: 3px solid #152741; font-size: 9px; color: #333;">
            Nota: ${item.notes}
          </div>
        `;
      }
    });
    
    practicesHtml += '</div>';
    
    // Agregar observaciones generales si las hay
    if (prescription.additionalNotes) {
      practicesHtml += `
        <div style="margin-top: 12px; padding: 4px; background-color: #f0f8ff; border-left: 3px solid #1E40AF; font-size: 9px; color: #333;">
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
      <div style="font-size: 11px; margin-bottom: 2px; color: #666; letter-spacing: 1px;">${companyInfo.subtitle}</div>
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
          ${prescription.patient.affiliateNumber}
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
    alert('Error al generar el PDF para imprimir. Por favor, intente nuevamente.');
  } finally {
    // Remover el contenido temporal del DOM
    document.body.removeChild(pdfContent);
  }
};

// Función para generar múltiples recetas en una hoja
export const generateMultiplePrescriptionsPDF = async (prescriptions: Prescription[]): Promise<void> => {
  if (prescriptions.length === 0) return;

  const pdf = new jsPDF('l', 'mm', 'a4'); // Formato horizontal
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const recipeWidth = pdfWidth / 2;

  for (let i = 0; i < prescriptions.length; i++) {
    const prescription = prescriptions[i];
    const isLeftSide = i % 2 === 0;
    
    // Si es el lado derecho y no es la primera receta, no agregar nueva página
    if (!isLeftSide || i === 0) {
      // Solo agregar nueva página si no es la primera receta y es lado izquierdo
      if (i > 0 && isLeftSide) {
        pdf.addPage();
      }
    }

    // Generar contenido HTML para esta receta
    const pdfContent = document.createElement('div');
    // ... (mismo código de arriba para generar el contenido)
    
    // Posición X según el lado
    const xOffset = isLeftSide ? 2 : recipeWidth + 2;
    
    // Agregar línea divisoria si hay dos recetas
    if (prescriptions.length > 1 && i % 2 === 1) {
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.line(pdfWidth / 2, 0, pdfWidth / 2, pdfHeight);
    }
  }

  pdf.save(`Recetas_Multiple_${new Date().toISOString().split('T')[0]}.pdf`);
};