import { Doctor, Patient, Practice, CompanyInfo } from '../types';

export const companyInfo: CompanyInfo = {
  name: 'CORG',
  subtitle: 'CENTRO DE OJOS RIO GALLEGOS',
  director: 'Dr. Rodrigues Da Silva, Luiz - M.P. 2552',
  license: 'y Equipo',
  address: '9 de Julio 398',
  phone1: '02966 431152',
  phone2: '421603',
  whatsapp: '2966 - 767659',
  social: '@centrodeojosriogallegos',
  location: 'Rio Gallegos - Santa Cruz'
};

export const mockDoctors: Doctor[] = [
  {
    id: '1',
    name: 'Dr. Rodrigues Da Silva, Luiz',
    specialty: 'Oftalmología',
    license: 'M.P. 2552',
    phone: '02966 431152',
    email: 'rodrigues@corg.com'
  },
  {
    id: '2',
    name: 'Dra. María González',
    specialty: 'Oftalmología',
    license: 'M.P. 1234',
    phone: '02966 431153',
    email: 'gonzalez@corg.com'
  },
  {
    id: '3',
    name: 'Dr. Carlos Pérez',
    specialty: 'Retina',
    license: 'M.P. 5678',
    phone: '02966 431154',
    email: 'perez@corg.com'
  }
];

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Juan Carlos Martínez',
    socialWork: 'OSDE',
    affiliateNumber: '123456789',
    phone: '2966 123456',
    email: 'juan.martinez@email.com',
    address: 'Av. Kirchner 456'
  },
  {
    id: '2',
    name: 'María Elena Fernández',
    socialWork: 'Swiss Medical',
    affiliateNumber: '987654321',
    phone: '2966 654321',
    email: 'maria.fernandez@email.com',
    address: 'Belgrano 789'
  },
  {
    id: '3',
    name: 'Roberto Silva',
    socialWork: 'IOMA',
    affiliateNumber: '456789123',
    phone: '2966 789456',
    email: 'roberto.silva@email.com',
    address: 'San Martín 321'
  }
];

export const mockPractices: Practice[] = [
  // Estudios
  { id: '1', name: 'Campo Visual Computarizado', code: 'CVC', category: 'study', description: 'Evaluación del campo visual' },
  { id: '2', name: 'Paquimetría', code: 'PAQ', category: 'study', description: 'Medición del grosor corneal' },
  { id: '3', name: 'Topografía Corneal Computada', code: 'TCC', category: 'study', description: 'Mapeo de la curvatura corneal' },
  { id: '4', name: 'OCT Macular', code: 'OCT-M', category: 'study', description: 'Tomografía de coherencia óptica macular' },
  { id: '5', name: 'OCT Cámara Anterior', code: 'OCT-CA', category: 'study', description: 'OCT de cámara anterior' },
  { id: '6', name: 'HRT (Tomografía Confocal de Retina)', code: 'HRT', category: 'study', description: 'Heidelberg Retina Tomograph' },
  { id: '7', name: 'Angio OCT', code: 'ANGIO', category: 'study', description: 'Angiografía OCT' },
  { id: '8', name: 'Retinografía Color', code: 'RET-C', category: 'study', description: 'Fotografía de retina a color' },
  { id: '9', name: 'Recuento Endotelial', code: 'RE', category: 'study', description: 'Conteo de células endoteliales' },
  { id: '10', name: 'Aberrometría', code: 'ABE', category: 'study', description: 'Medición de aberraciones oculares' },
  { id: '11', name: 'O.B.I.', code: 'OBI', category: 'study', description: 'Optical Biometry Interferometry' },
  { id: '12', name: 'Refractometría Computarizada', code: 'REF-C', category: 'study', description: 'Refractometría automatizada' },
  { id: '13', name: 'Screening Neonatal (0 a 3 años)', code: 'SCREEN', category: 'study', description: 'Tamizaje visual neonatal' },
  { id: '14', name: 'Test de Mirada Preferencial', code: 'TMP', category: 'study', description: 'Evaluación visual en niños' },
  { id: '15', name: 'Visión Cromática', code: 'VC', category: 'study', description: 'Test de visión de colores' },
  { id: '16', name: 'Gonioscopia con Lente de 3 o 4 Espejos', code: 'GONIO', category: 'study', description: 'Evaluación del ángulo iridocorneal' },
  { id: '17', name: 'Ecografía Oftalmológica', code: 'ECO', category: 'study', description: 'Ultrasonido ocular' },
  
  // Tratamientos
  { id: '18', name: 'SLT (Trabeculoplastia Láser Selectiva)', code: 'SLT', category: 'treatment', description: 'Trabeculoplastia láser selectiva' },
  { id: '19', name: 'YAG Láser (Capsulotomía)', code: 'YAG-CAP', category: 'treatment', description: 'Capsulotomía con láser YAG' },
  { id: '20', name: 'Iridotomía con YAG Láser', code: 'IRIDO-YAG', category: 'treatment', description: 'Iridotomía periférica con láser' },
  { id: '21', name: 'Fotocoagulación con Láser Argón', code: 'FOTO-ARG', category: 'treatment', description: 'Fotocoagulación retinal' },
  { id: '22', name: 'Iridoplastia con Láser Argón', code: 'IRIDO-ARG', category: 'treatment', description: 'Iridoplastia periférica' },
  { id: '23', name: 'Suturólisis con YAG Láser', code: 'SUT-YAG', category: 'treatment', description: 'Lisis de suturas con láser' },
  
  // Cirugías
  { id: '24', name: 'Cirugía de Catarata', code: 'CAT', category: 'surgery', description: 'Facoemulsificación de catarata' },
  { id: '25', name: 'Extracción de Cristalino', code: 'EXT-CRIS', category: 'surgery', description: 'Extracción del cristalino' },
  { id: '26', name: 'Poder Corneal Central', code: 'PCC', category: 'study', description: 'Medición de poder corneal central' },
  { id: '27', name: 'Exfoliación Glandular de Meibomio', code: 'EXF-MEIB', category: 'treatment', description: 'Tratamiento de glándulas de Meibomio' },
  { id: '28', name: 'Meibografía', code: 'MEIBO', category: 'study', description: 'Evaluación de glándulas de Meibomio' },
  { id: '29', name: 'Ojo Seco Digital', code: 'OSD', category: 'study', description: 'Evaluación digital de ojo seco' }
];