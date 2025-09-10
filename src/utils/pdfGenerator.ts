import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Prescription } from '../types';
import { companyInfo } from '../data/mockData';

export const generatePrescriptionPDF = async (prescription: Prescription): Promise<void> => {
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
    const allPractices = [
      'CAMPO VISUAL COMPUTARIZADO', 'ABERROMETRÍA',
      'PAQUIMETRÍA', 'O.B.I.',
      'TOPOGRAFÍA CORNEAL COMPUTADA', 'REFRACTOMETRÍA COMPUTARIZADA',
      'OCT MACULAR', 'SCREENING NEONATAL (0 A 3 AÑOS)',
      'OCT CÁMARA ANTERIOR', 'TEST DE MIRADA PREFERENCIAL',
      'HRT (TOMOGRAFÍA CONFOCAL DE RETINA)', 'VISIÓN CROMÁTICA',
      'ANGIO OCT', 'GONIOSCOPIA CON LENTE DE 3 O 4 ESPEJOS',
      'RETINOGRAFÍA COLOR', 'ECOGRAFÍA OFTALMOLÓGICA',
      'RECUENTO ENDOTELIAL', ''
    ];

    const selectedPractices = prescription.items.map(item => item.practice.name.toUpperCase());
    
    let practicesHtml = '<div style="display: flex; justify-content: space-between; margin: 8px 0;">';
    practicesHtml += '<div style="width: 48%; font-size: 8px; line-height: 1.4;">';
    
    // Columna izquierda
    for (let i = 0; i < Math.ceil(allPractices.length / 2); i++) {
      const practice = allPractices[i];
      if (practice) {
        const isSelected = selectedPractices.includes(practice);
        const selectedItem = prescription.items.find(item => item.practice.name.toUpperCase() === practice);
        
        practicesHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; color: #4A5568;">
            <span style="font-weight: ${isSelected ? 'bold' : 'normal'}; color: ${isSelected ? '#1E40AF' : '#4A5568'};">${practice}</span>
            <div style="display: flex; gap: 2px;">
              <span style="border: 1px solid #666; width: 8px; height: 8px; display: inline-block; text-align: center; font-size: 6px; background: ${selectedItem?.ao === 'AO' ? '#1E40AF' : 'white'}; color: ${selectedItem?.ao === 'AO' ? 'white' : 'black'};">${selectedItem?.ao === 'AO' ? '✓' : ''}</span>
              <span style="border: 1px solid #666; width: 8px; height: 8px; display: inline-block; text-align: center; font-size: 6px; background: ${selectedItem?.ao === 'OI' ? '#1E40AF' : 'white'}; color: ${selectedItem?.ao === 'OI' ? 'white' : 'black'};">${selectedItem?.ao === 'OI' ? '✓' : ''}</span>
              <span style="border: 1px solid #666; width: 8px; height: 8px; display: inline-block; text-align: center; font-size: 6px; background: ${selectedItem?.ao === 'OD' ? '#1E40AF' : 'white'}; color: ${selectedItem?.ao === 'OD' ? 'white' : 'black'};">${selectedItem?.ao === 'OD' ? '✓' : ''}</span>
            </div>
          </div>
        `;
      }
    }
    
    practicesHtml += '</div><div style="width: 48%; font-size: 8px; line-height: 1.4;">';
    
    // Columna derecha
    for (let i = Math.ceil(allPractices.length / 2); i < allPractices.length; i++) {
      const practice = allPractices[i];
      if (practice) {
        const isSelected = selectedPractices.includes(practice);
        const selectedItem = prescription.items.find(item => item.practice.name.toUpperCase() === practice);
        
        practicesHtml += `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; color: #4A5568;">
            <span style="font-weight: ${isSelected ? 'bold' : 'normal'}; color: ${isSelected ? '#1E40AF' : '#4A5568'};">${practice}</span>
            <div style="display: flex; gap: 2px;">
              <span style="border: 1px solid #666; width: 8px; height: 8px; display: inline-block; text-align: center; font-size: 6px; background: ${selectedItem?.ao === 'AO' ? '#1E40AF' : 'white'}; color: ${selectedItem?.ao === 'AO' ? 'white' : 'black'};">${selectedItem?.ao === 'AO' ? '✓' : ''}</span>
              <span style="border: 1px solid #666; width: 8px; height: 8px; display: inline-block; text-align: center; font-size: 6px; background: ${selectedItem?.ao === 'OI' ? '#1E40AF' : 'white'}; color: ${selectedItem?.ao === 'OI' ? 'white' : 'black'};">${selectedItem?.ao === 'OI' ? '✓' : ''}</span>
              <span style="border: 1px solid #666; width: 8px; height: 8px; display: inline-block; text-align: center; font-size: 6px; background: ${selectedItem?.ao === 'OD' ? '#1E40AF' : 'white'}; color: ${selectedItem?.ao === 'OD' ? 'white' : 'black'};">${selectedItem?.ao === 'OD' ? '✓' : ''}</span>
            </div>
          </div>
        `;
      }
    }
    
    practicesHtml += '</div></div>';
    
    // Agregar notas adicionales si las hay
    const additionalNotes = prescription.items
      .filter(item => item.notes)
      .map(item => `★ ${item.notes}`)
      .join('<br>');
    
    if (additionalNotes || prescription.additionalNotes) {
      practicesHtml += `
        <div style="margin-top: 8px; font-size: 8px; color: #1E40AF;">
          ${additionalNotes ? additionalNotes + '<br>' : ''}
          ${prescription.additionalNotes ? `★ ${prescription.additionalNotes}` : ''}
        </div>
      `;
    }
    
    return practicesHtml;
  };

  pdfContent.innerHTML = `
    <!-- Header exacto como el original -->
    <div style="text-align: center; margin-bottom: 15px;">
      <div style="color: #1E40AF; font-size: 32px; font-weight: bold; margin-bottom: 3px; letter-spacing: 2px;">CORG</div>
      <div style="font-size: 11px; margin-bottom: 2px; color: #666; letter-spacing: 1px;">${companyInfo.subtitle}</div>
      <div style="font-size: 9px; margin-bottom: 1px; color: #666; font-weight: bold;">DIRECTOR MÉDICO</div>
      <div style="font-size: 9px; margin-bottom: 1px; color: #333;">${companyInfo.director}</div>
      <div style="font-size: 9px; color: #666;">y Equipo</div>
    </div>
    
    <!-- Campos del paciente con líneas punteadas como el original -->
    <div style="margin-bottom: 12px;">
      <div style="display: flex; align-items: center; margin-bottom: 8px; color: #4A5568; font-size: 10px;">
        <span style="margin-right: 8px;">Nombre y Apellido:</span>
        <div style="flex: 1; border-bottom: 1px dotted #666; padding-bottom: 2px; font-weight: bold; color: #000;">
          ${prescription.patient.name}
        </div>
      </div>
      
      <div style="display: flex; align-items: center; margin-bottom: 8px; color: #4A5568; font-size: 10px;">
        <span style="margin-right: 8px;">Obra Social:</span>
        <div style="flex: 1; border-bottom: 1px dotted #666; padding-bottom: 2px; font-weight: bold; color: #000;">
          ${prescription.patient.socialWork}
        </div>
      </div>
      
      <div style="display: flex; align-items: center; margin-bottom: 8px; color: #4A5568; font-size: 10px;">
        <span style="margin-right: 8px;">N° AFILIADO</span>
        <div style="flex: 1; border-bottom: 1px solid #000; padding-bottom: 2px; font-weight: bold; color: #000;">
          ${prescription.patient.affiliateNumber}
        </div>
      </div>
    </div>
    
    <!-- Solicito -->
    <div style="margin-bottom: 12px;">
      <div style="color: #4A5568; font-size: 10px; margin-bottom: 6px; border-bottom: 1px solid #666; padding-bottom: 2px;">
        Solicito:
      </div>
      
      <!-- Header de columnas AO OI OD -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 8px; color: #4A5568; font-weight: bold;">
        <div style="width: 48%; text-align: right; padding-right: 25px;">AO OI OD</div>
        <div style="width: 48%; text-align: right; padding-right: 25px;">AO OI OD</div>
      </div>
      
      ${generatePracticesGrid()}
    </div>
    
    <!-- Vale por estudios -->
    <div style="margin-bottom: 15px; font-size: 9px; color: #4A5568;">
      <span>Vale X:</span>
      <span style="border-bottom: 1px dotted #666; padding-bottom: 1px; margin-left: 8px; margin-right: 8px; display: inline-block; width: 60px;"></span>
      <span>Estudio/s</span>
    </div>
    
    <!-- Médico -->
    <div style="margin-bottom: 20px; font-size: 9px; color: #4A5568;">
      <span>Dx:</span>
      <div style="margin-top: 4px; font-weight: bold; color: #000; font-size: 10px;">
        ${prescription.doctor.name}
      </div>
    </div>
    
    <!-- Firma y fecha -->
    <div style="display: flex; justify-content: space-between; margin-bottom: 15px; margin-top: 25px;">
      <div style="text-align: center; width: 45%; font-size: 8px;">
        <div style="border-top: 1px dotted #000; padding-top: 3px; font-weight: bold; color: #4A5568;">FECHA</div>
      </div>
      <div style="text-align: center; width: 45%; font-size: 8px;">
        <div style="border-top: 1px dotted #000; padding-top: 3px; font-weight: bold; color: #4A5568;">FIRMA Y SELLO</div>
      </div>
    </div>
    
    <!-- Footer azul exacto como el original -->
    <div style="background-color: #1E40AF; color: white; padding: 6px 8px; margin-top: auto; font-size: 7px; position: absolute; bottom: 8mm; left: 8mm; right: 8mm;">
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