import { getTodayISO } from '../lib/utils'

const DB_NAME = 'glamstudio_enterprise_db'
const DB_VERSION = 2

export const STORES = {
  PRODUCTS: 'products',
  SERVICES: 'services',
  APPOINTMENTS: 'appointments',
  SALES: 'sales',
  CUSTOMERS: 'customers',
  EMPLOYEES: 'employees',
  CASH_SESSIONS: 'cash_sessions',
  INVENTORY_LOGS: 'inventory_logs',
  DAILY_CLOSES: 'daily_closes',
}

const LS_PREFIX = 'glamstudio_store_'
const SEED_FLAG_KEY = 'glamstudio_seeded_v7'

export const INITIAL_SERVICES = [
  {
    id: 'srv-1',
    name: 'Corte de Autor & Visagismo',
    category: 'Corte & Styling',
    duration: 60,
    price: 32000,
    commissionPct: 40,
    description: 'Diagnóstico morfológico facial, lavado spa con masaje craneal, corte de precisión y modelado final.',
    image: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=80',
    featured: true,
  },
  {
    id: 'srv-2',
    name: 'Brushing Couture & Ondas al Agua',
    category: 'Corte & Styling',
    duration: 45,
    price: 24000,
    commissionPct: 35,
    description: 'Lavado nutritivo, protección térmica de alta gama y brushing pulido o diseño de ondas red carpet.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
    featured: true,
  },
  {
    id: 'srv-3',
    name: 'Coloración Global Inoa Sin Amoníaco',
    category: 'Coloración',
    duration: 90,
    price: 58000,
    commissionPct: 38,
    description: 'Fórmula a base de óleos sin amoníaco con cobertura 100%, brillo espejo y máxima suavidad dérmica.',
    image: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80',
    featured: true,
  },
  {
    id: 'srv-4',
    name: 'Balayage Haute Couture + Matiz',
    category: 'Coloración',
    duration: 120,
    price: 98000,
    commissionPct: 42,
    description: 'Diseño de iluminación tridimensional a mano alzada con protección Plex integrada y baño de luz personalizado.',
    image: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=80',
    featured: true,
  },
  {
    id: 'srv-5',
    name: 'Ritual Kérastase Fusio-Dose & Olaplex',
    category: 'Tratamientos',
    duration: 60,
    price: 46000,
    commissionPct: 35,
    description: 'Reconstrucción molecular profunda de puentes disulfuro combinada con ampolla concentrada a medida.',
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=80',
    featured: true,
  },
  {
    id: 'srv-6',
    name: 'Alisado Orgánico de Caviar & Seda',
    category: 'Tratamientos',
    duration: 120,
    price: 85000,
    commissionPct: 40,
    description: 'Disciplinado progresivo libre de formol con aminoácidos de seda y extracto de caviar imperial.',
    image: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=900&q=80',
    featured: false,
  },
]

export const INITIAL_EMPLOYEES = [
  {
    id: 'emp-1',
    name: 'Camila Moreau',
    email: 'estilista@glamstudio.com',
    role: 'ESTILISTA',
    specialty: 'Master Colorist & Balayage Couture',
    station: 'Sillón 1 - VIP Gold',
    commissionRate: 40,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    workStart: '09:00',
    workEnd: '20:00',
    active: true,
  },
  {
    id: 'emp-2',
    name: 'Mateo Lombardo',
    email: 'mateo@glamstudio.com',
    role: 'ESTILISTA',
    specialty: 'Corte de Autor & Visagismo',
    station: 'Sillón 2 - Studio',
    commissionRate: 38,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    workStart: '09:00',
    workEnd: '20:00',
    active: true,
  },
  {
    id: 'emp-3',
    name: 'Valentina Duarte',
    email: 'valentina@glamstudio.com',
    role: 'ESTILISTA',
    specialty: 'Rituales Kérastase & Brushing Couture',
    station: 'Sillón 3 - Spa Capilar',
    commissionRate: 35,
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    workStart: '09:00',
    workEnd: '20:00',
    active: true,
  },
  {
    id: 'emp-4',
    name: 'Julián Rossi',
    email: 'julian@glamstudio.com',
    role: 'ESTILISTA',
    specialty: 'Coloración Global & Alisados Orgánicos',
    station: 'Sillón 4 - Color Lab',
    commissionRate: 36,
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    workStart: '09:00',
    workEnd: '20:00',
    active: true,
  },
]

export const INITIAL_PRODUCTS = [
  {
    id: 'prd-1',
    sku: 'KER-ELX-100',
    name: "Kérastase Elixir Ultime L'Huile Originale 100ml",
    brand: 'Kérastase',
    category: 'Óleos & Finalizadores',
    price: 64000,
    cost: 38000,
    stock: 14,
    minStock: 5,
    description: 'Óleo sublimador multiuso con camelia sagrada y argán para brillo instantáneo y protección 230°C.',
    image: 'https://images.unsplash.com/photo-1754735289896-1fa3c2d61255?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prd-2',
    sku: 'OLA-NO3-100',
    name: 'Olaplex Nº3 Hair Perfector 100ml',
    brand: 'Olaplex',
    category: 'Reconstrucción',
    price: 52000,
    cost: 31000,
    stock: 3,
    minStock: 5,
    description: 'Tratamiento pre-shampoo concentrado que repara enlaces capilares dañados por procesos químicos.',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prd-3',
    sku: 'LOR-ABS-250',
    name: "L'Oréal Absolut Repair Gold Mask 250ml",
    brand: "L'Oréal Professionnel",
    category: 'Máscaras & Nutrición',
    price: 44000,
    cost: 25000,
    stock: 11,
    minStock: 4,
    description: 'Máscara dorada reestructurante con proteína de quinoa dorada para cabellos muy sensibilizados.',
    image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prd-4',
    sku: 'MOR-OIL-100',
    name: 'Moroccanoil Tratamiento Original 100ml',
    brand: 'Moroccanoil',
    category: 'Óleos & Finalizadores',
    price: 59000,
    cost: 35000,
    stock: 0,
    minStock: 4,
    description: 'Tratamiento icónico con aceite de argán antioxidante que desenreda, acelera el secado y potencia el brillo.',
    image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prd-5',
    sku: 'KER-BLD-250',
    name: 'Kérastase Blond Absolu Bain Ultra-Violet 250ml',
    brand: 'Kérastase',
    category: 'Shampoos Profesionales',
    price: 49000,
    cost: 29000,
    stock: 9,
    minStock: 4,
    description: 'Shampoo matizador rico en agentes neutralizantes ultravioleta y ácido hialurónico para rubios luminosos.',
    image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'prd-6',
    sku: 'RED-ABC-150',
    name: 'Redken Acidic Bonding Concentrate Leave-In 150ml',
    brand: 'Redken',
    category: 'Reconstrucción',
    price: 47000,
    cost: 27000,
    stock: 2,
    minStock: 4,
    description: 'Acondicionador sin enjuague con ácido cítrico al 5% que sella la cutícula y equilibra el pH.',
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
  },
]

// --- Catálogo ampliado de peluquería y estética (100% imágenes únicas sin repeticiones) ---
const EXTRA_SERVICES = [
  [
    'Corte Caballero Clásico & Fade',
    'Barbería',
    40,
    18000,
    'Corte con máquina y tijera, degradado a elección, lavado y styling con pomada.',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Perfilado de Barba & Toalla Caliente',
    'Barbería',
    30,
    12000,
    'Diseño de barba con navaja, toalla caliente, aceite y bálsamo hidratante.',
    'https://images.unsplash.com/photo-1621607512214-68297480165e?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Corte Infantil',
    'Corte & Styling',
    30,
    14000,
    'Corte para niños hasta 12 años en ambiente relajado y divertido.',
    'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Retoque de Flequillo',
    'Corte & Styling',
    15,
    6000,
    'Mantenimiento rápido de flequillo entre cortes.',
    'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Lavado + Secado Express',
    'Corte & Styling',
    30,
    15000,
    'Lavado con productos profesionales y secado con cepillo.',
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Retoque de Raíz',
    'Coloración',
    75,
    38000,
    'Cobertura de canas y crecimiento con fórmula personalizada.',
    'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Mechas / Reflejos con Papel',
    'Coloración',
    120,
    72000,
    'Iluminación clásica con papel aluminio y matiz incluido.',
    'https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Babylights Ultra Finas',
    'Coloración',
    150,
    89000,
    'Mechas micro-finas para un rubio natural y luminoso.',
    'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Baño de Color / Matiz',
    'Coloración',
    45,
    22000,
    'Reaviva el tono, neutraliza reflejos no deseados y aporta brillo.',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Decoloración Global con Plex',
    'Coloración',
    180,
    110000,
    'Aclarado total con protección de enlaces para cambios de look extremos.',
    'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Keratina Brasileña',
    'Tratamientos',
    150,
    78000,
    'Elimina el frizz y aporta brillo duradero hasta 4 meses.',
    'https://images.unsplash.com/photo-1522337094846-8a818192de1f?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Botox Capilar',
    'Tratamientos',
    90,
    52000,
    'Relleno de fibra capilar con ácido hialurónico y colágeno.',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Hidratación Profunda',
    'Tratamientos',
    45,
    26000,
    'Máscara nutritiva con vapor para cabellos secos y opacos.',
    'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Permanente / Ondulado Natural',
    'Tratamientos',
    120,
    64000,
    'Ondas o rizos definidos con fórmula de bajo daño.',
    'https://images.unsplash.com/photo-1580618864180-f6d7d39b8ff6?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Peinado de Fiesta',
    'Peinados & Eventos',
    60,
    35000,
    'Ondas, semi-recogidos o brushing de gala para eventos.',
    'https://images.pexels.com/photos/3992877/pexels-photo-3992877.jpeg?auto=compress&cs=tinysrgb&w=900',
  ],
  [
    'Recogido de Novia + Prueba',
    'Peinados & Eventos',
    120,
    120000,
    'Diseño exclusivo con prueba previa y fijación de accesorios.',
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Trenzas de Diseño',
    'Peinados & Eventos',
    45,
    20000,
    'Trenzas boxeadoras, espiga o diseño libre.',
    'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Manicura Semipermanente',
    'Estética',
    60,
    16000,
    'Limado, cutículas y esmaltado semipermanente de larga duración.',
    'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Perfilado y Laminado de Cejas',
    'Estética',
    45,
    18000,
    'Diseño de cejas con laminado para un efecto peinado y lleno.',
    'https://images.unsplash.com/photo-1583001931096-959e9a1a6223?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Lifting de Pestañas',
    'Estética',
    60,
    22000,
    'Curvatura natural de pestañas con tinte incluido.',
    'https://images.unsplash.com/photo-1588514912908-8f5891714f8d?auto=format&fit=crop&w=900&q=80',
  ],
].map(([name, category, duration, price, description, image], i) => ({
  id: `srv-x${i + 1}`,
  name,
  category,
  duration,
  price,
  commissionPct: 35,
  description,
  image,
  featured: false,
}))

const EXTRA_PRODUCTS = [
  ['KER-BSA-250', 'Kérastase Bain Satin Nutritive 250ml', 'Kérastase', 'Shampoos Profesionales', 42000, 12, 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=800&q=80'],
  ['KER-LAI-200', 'Kérastase Lait Vital Acondicionador 200ml', 'Kérastase', 'Acondicionadores', 45000, 8, 'https://images.unsplash.com/photo-1599305090598-fe179d501227?auto=format&fit=crop&w=800&q=80'],
  ['LOR-SIL-500', "L'Oréal Silver Shampoo Matizador 500ml", "L'Oréal Professionnel", 'Shampoos Profesionales', 38000, 10, 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?auto=format&fit=crop&w=800&q=80'],
  ['RED-ALL-300', 'Redken All Soft Acondicionador 300ml', 'Redken', 'Acondicionadores', 36000, 3, 'https://images.unsplash.com/photo-1760647422523-f532034a49ce?auto=format&fit=crop&w=800&q=80'],
  ['KER-THE-150', 'Kérastase Thermique Protector Térmico 150ml', 'Kérastase', 'Styling & Fijación', 47000, 9, 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=800&q=80'],
  ['ELN-SPR-400', "L'Oréal Elnett Spray Fijación Fuerte 400ml", "L'Oréal Paris", 'Styling & Fijación', 14000, 20, 'https://images.unsplash.com/photo-1629198688000-71f23e745b6e?auto=format&fit=crop&w=800&q=80'],
  ['SCH-OSI-100', 'Schwarzkopf OSiS+ Mess Up Cera Mate 100ml', 'Schwarzkopf', 'Styling & Fijación', 22000, 7, 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=800&q=80'],
  ['MOR-VOL-250', 'Moroccanoil Mousse Volumen 250ml', 'Moroccanoil', 'Styling & Fijación', 41000, 5, 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=800&q=80'],
  ['OLA-NO7-30', 'Olaplex Nº7 Bonding Oil 30ml', 'Olaplex', 'Óleos & Finalizadores', 39000, 11, 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?auto=format&fit=crop&w=800&q=80'],
  ['KER-GEN-90', 'Kérastase Genesis Sérum Anticaída 90ml', 'Kérastase', 'Tratamientos Cuero Cabelludo', 68000, 4, 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80'],
  ['VIC-AMP-12', 'Vichy Dercos Aminexil Ampollas x12', 'Vichy', 'Tratamientos Cuero Cabelludo', 58000, 6, 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?auto=format&fit=crop&w=800&q=80'],
  ['BAR-OIL-30', 'Aceite para Barba Cedro & Sándalo 30ml', 'GlamStudio Barber', 'Barbería', 16000, 14, 'https://images.pexels.com/photos/9146943/pexels-photo-9146943.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ['BAR-POM-100', 'Pomada Brillo Medio Barber 100g', 'GlamStudio Barber', 'Barbería', 15000, 0, 'https://images.pexels.com/photos/13631868/pexels-photo-13631868.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ['GHD-PLT-01', 'Plancha GHD Platinum+', 'ghd', 'Herramientas', 320000, 2, 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?auto=format&fit=crop&w=800&q=80'],
  ['PAR-SEC-01', 'Secador Parlux Advance Light 2200W', 'Parlux', 'Herramientas', 210000, 3, 'https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=800&q=80'],
  ['TAN-CEP-01', 'Cepillo Tangle Teezer Original', 'Tangle Teezer', 'Herramientas', 19000, 15, 'https://images.unsplash.com/photo-1590159763121-7c9fd312190d?auto=format&fit=crop&w=800&q=80'],
  ['KER-CHR-250', 'Kérastase Chronologiste Bain Régénérant 250ml', 'Kérastase', 'Shampoos Profesionales', 52000, 6, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&w=800&q=80'],
  ['KER-RES-200', 'Kérastase Résistance Masque Force Architecte 200ml', 'Kérastase', 'Máscaras & Nutrición', 56000, 7, 'https://images.unsplash.com/photo-1556228852-80b6e5eeff06?auto=format&fit=crop&w=800&q=80'],
  ['KER-CUR-150', 'Kérastase Curl Manifesto Crème de Jour 150ml', 'Kérastase', 'Styling & Fijación', 48000, 5, 'https://images.unsplash.com/photo-1778331883876-5dc2a279ca4e?auto=format&fit=crop&w=800&q=80'],
  ['OLA-NO4-250', 'Olaplex Nº4 Bond Maintenance Shampoo 250ml', 'Olaplex', 'Shampoos Profesionales', 46000, 9, 'https://images.unsplash.com/photo-1580870069867-74c57ee1bb07?auto=format&fit=crop&w=800&q=80'],
  ['OLA-NO5-250', 'Olaplex Nº5 Bond Maintenance Conditioner 250ml', 'Olaplex', 'Acondicionadores', 46000, 8, 'https://images.pexels.com/photos/7440133/pexels-photo-7440133.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ['OLA-NO6-100', 'Olaplex Nº6 Bond Smoother Leave-In 100ml', 'Olaplex', 'Reconstrucción', 44000, 3, 'https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=800&q=80'],
  ['OLA-NO8-100', 'Olaplex Nº8 Bond Intense Moisture Mask 100ml', 'Olaplex', 'Máscaras & Nutrición', 49000, 6, 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=800&q=80'],
  ['LOR-VIT-300', "L'Oréal Vitamino Color Shampoo 300ml", "L'Oréal Professionnel", 'Shampoos Profesionales', 29000, 14, 'https://images.unsplash.com/photo-1619451334792-150fd785ee74?auto=format&fit=crop&w=800&q=80'],
  ['LOR-PRO-250', "L'Oréal Pro Longer Máscara 250ml", "L'Oréal Professionnel", 'Máscaras & Nutrición', 34000, 10, 'https://images.unsplash.com/photo-1625772452859-1c03d5bf1137?auto=format&fit=crop&w=800&q=80'],
  ['LOR-TNT-150', "L'Oréal Tecni.Art Pli Spray Termomodelador 190ml", "L'Oréal Professionnel", 'Styling & Fijación', 26000, 12, 'https://images.unsplash.com/photo-1583209814683-c023dd293cc6?auto=format&fit=crop&w=800&q=80'],
  ['MOR-HYD-250', 'Moroccanoil Shampoo Hidratante 250ml', 'Moroccanoil', 'Shampoos Profesionales', 43000, 7, 'https://images.unsplash.com/photo-1567721913486-6585f069b332?auto=format&fit=crop&w=800&q=80'],
  ['MOR-MSK-250', 'Moroccanoil Mascarilla Hidratante Intensa 250ml', 'Moroccanoil', 'Máscaras & Nutrición', 62000, 4, 'https://images.unsplash.com/photo-1590439471364-192aa70c0b53?auto=format&fit=crop&w=800&q=80'],
  ['MOR-CRL-75', 'Moroccanoil Crema Definidora de Rizos 75ml', 'Moroccanoil', 'Styling & Fijación', 39000, 6, 'https://images.unsplash.com/photo-1552046122-03184de85e08?auto=format&fit=crop&w=800&q=80'],
  ['RED-EXT-300', 'Redken Extreme Shampoo Fortificante 300ml', 'Redken', 'Shampoos Profesionales', 35000, 11, 'https://images.pexels.com/photos/4440650/pexels-photo-4440650.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ['RED-COL-300', 'Redken Color Extend Magnetics Shampoo 300ml', 'Redken', 'Shampoos Profesionales', 35000, 0, 'https://images.unsplash.com/photo-1629198735660-e39ea93f5c18?auto=format&fit=crop&w=800&q=80'],
  ['RED-ONE-150', 'Redken One United Tratamiento Multibeneficio 150ml', 'Redken', 'Óleos & Finalizadores', 38000, 9, 'https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=800&q=80'],
  ['SCH-BCB-250', 'Schwarzkopf BC Bonacure Repair Shampoo 250ml', 'Schwarzkopf', 'Shampoos Profesionales', 27000, 13, 'https://images.unsplash.com/photo-1631730359585-38a4935cbec4?auto=format&fit=crop&w=800&q=80'],
  ['SCH-SIL-300', 'Schwarzkopf Session Label Spray Ultra Fuerte 300ml', 'Schwarzkopf', 'Styling & Fijación', 24000, 10, 'https://images.unsplash.com/photo-1576426863848-c21f53c60b19?auto=format&fit=crop&w=800&q=80'],
  ['SCH-DST-100', 'Schwarzkopf OSiS+ Dust It Polvo Texturizante 10g', 'Schwarzkopf', 'Styling & Fijación', 21000, 8, 'https://images.pexels.com/photos/3992874/pexels-photo-3992874.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ['KMS-DRY-200', 'KMS Hair Play Dry Shampoo 200ml', 'KMS', 'Styling & Fijación', 25000, 6, 'https://images.pexels.com/photos/3916358/pexels-photo-3916358.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ['MAT-TOT-300', 'Matrix Total Results So Silver Shampoo 300ml', 'Matrix', 'Shampoos Profesionales', 24000, 12, 'https://images.pexels.com/photos/3065209/pexels-photo-3065209.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ['DAV-OI-280', 'Davines OI Shampoo Absolute Beauty 280ml', 'Davines', 'Shampoos Profesionales', 41000, 5, 'https://images.pexels.com/photos/8867400/pexels-photo-8867400.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ['DAV-OIL-50', 'Davines OI All In One Milk 135ml', 'Davines', 'Óleos & Finalizadores', 39000, 7, 'https://images.pexels.com/photos/14615064/pexels-photo-14615064.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ['BAR-SHV-150', 'Gel de Afeitar Transparente Barber 150ml', 'GlamStudio Barber', 'Barbería', 12000, 16, 'https://images.pexels.com/photos/35157699/pexels-photo-35157699.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ['BAR-BAL-60', 'Bálsamo para Barba Hidratante 60ml', 'GlamStudio Barber', 'Barbería', 15000, 9, 'https://images.pexels.com/photos/35013087/pexels-photo-35013087.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ['BAR-SHM-250', 'Shampoo para Barba y Rostro 250ml', 'GlamStudio Barber', 'Barbería', 13000, 3, 'https://images.unsplash.com/photo-1672257493393-7456f8aa76b6?auto=format&fit=crop&w=800&q=80'],
  ['GHD-CRV-01', 'Rizador GHD Curve Classic Curl 26mm', 'ghd', 'Herramientas', 260000, 2, 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?auto=format&fit=crop&w=800&q=80'],
  ['DYS-AIR-01', 'Dyson Airwrap Multi-Styler Complete', 'Dyson', 'Herramientas', 890000, 1, 'https://images.unsplash.com/photo-1675034741473-afed58a142e8?auto=format&fit=crop&w=800&q=80'],
  ['TAN-WET-01', 'Cepillo Tangle Teezer Wet Detangler', 'Tangle Teezer', 'Herramientas', 18000, 20, 'https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&w=800&q=80'],
  ['ACC-SCR-03', 'Set Scrunchies de Seda x3', 'GlamStudio', 'Accesorios', 15000, 18, 'https://images.unsplash.com/photo-1571875257727-256c39da42af?auto=format&fit=crop&w=800&q=80'],
  ['ACC-TOA-01', 'Toalla de Microfibra para Cabello', 'GlamStudio', 'Accesorios', 17000, 11, 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=800&q=80'],
  ['ACC-PIN-01', 'Set Pinzas y Clips Profesionales', 'GlamStudio', 'Accesorios', 9000, 25, 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80'],
  ['EST-ESM-01', 'Esmalte Semipermanente OPI GelColor 15ml', 'OPI', 'Estética', 22000, 14, 'https://images.pexels.com/photos/7750137/pexels-photo-7750137.jpeg?auto=compress&cs=tinysrgb&w=800'],
  ['EST-CEJ-01', 'Gel Fijador de Cejas Transparente', 'GlamStudio Beauty', 'Estética', 11000, 10, 'https://images.unsplash.com/photo-1512207736890-6ffed8a84e8d?auto=format&fit=crop&w=800&q=80'],
].map(([sku, name, brand, category, price, stock, image], i) => ({
  id: `prd-x${i + 1}`,
  sku,
  name,
  brand,
  category,
  price,
  cost: Math.round(price * 0.6),
  stock,
  minStock: 4,
  description: `${name} de ${brand}, línea profesional recomendada por nuestros estilistas.`,
  image,
}))

INITIAL_SERVICES.push(...EXTRA_SERVICES)
INITIAL_PRODUCTS.push(...EXTRA_PRODUCTS)

export const INITIAL_CUSTOMERS = [
  {
    id: 'cust-1',
    name: 'Sofía Mendizábal',
    email: 'cliente@glamstudio.com',
    phone: '+54 9 11 5842-9011',
    hairFormula: 'Base Inoa 6.0 (20vol) + Balayage contornos 9.13 + 8.3 Dialight (9vol). Olaplex Nº1 3.75ml.',
    allergies: 'Sensibilidad leve en nuca: aplicar óleo protector dérmico antes del tinte.',
    preferences: 'Café Nespresso corto con leche de almendras. Prefiere ondas suaves, no rulos marcados.',
    visits: 14,
    favorites: ['srv-4', 'prd-1', 'prd-2'],
  },
  {
    id: 'cust-2',
    name: 'Lucía Alvear',
    email: 'lucia.alvear@gmail.com',
    phone: '+54 9 11 4920-3312',
    hairFormula: 'Babylights ceniza perlado 10.12 + Matiz Dialight 9.02 (6vol). Porosidad media en puntas.',
    allergies: 'Ninguna registrada.',
    preferences: 'Agua mineral con gas y rodaja de limón. Sillón cerca de luz natural.',
    visits: 9,
    favorites: ['srv-1', 'prd-5'],
  },
  {
    id: 'cust-3',
    name: 'Martina Anchorena',
    email: 'martina.anchorena@gmail.com',
    phone: '+54 9 11 6112-8874',
    hairFormula: 'Coloración Global 5.35 Castaño Luminoso Inoa + Ampolla Fusio-Dose Oléo-Fusion.',
    allergies: 'Alergia al látex (utilizar guantes de nitrilo).',
    preferences: 'Té verde jazmín. Le gusta revisar revista de tendencias antes de iniciar.',
    visits: 21,
    favorites: ['srv-3', 'srv-5'],
  },
  {
    id: 'cust-4',
    name: 'Elena Blaquier',
    email: 'elena.blaquier@gmail.com',
    phone: '+54 9 11 5004-7721',
    hairFormula: 'Corte Bob Italiano + Tratamiento Kérastase Première descalcificante.',
    allergies: 'Ninguna.',
    preferences: 'Atención rápida ejecutiva.',
    visits: 6,
    favorites: ['srv-1'],
  },
]

export function getInitialAppointments() {
  const today = getTodayISO()
  return [
    {
      id: 'apt-101',
      customerId: 'cust-1',
      customerName: 'Sofía Mendizábal',
      customerEmail: 'cliente@glamstudio.com',
      customerPhone: '+54 9 11 5842-9011',
      serviceId: 'srv-4',
      serviceName: 'Balayage Haute Couture + Matiz',
      servicePrice: 98000,
      duration: 120,
      employeeId: 'emp-1',
      employeeName: 'Camila Moreau',
      station: 'Sillón 1 - VIP Gold',
      date: today,
      startTime: '10:00',
      endTime: '12:00',
      salonStatus: 'En proceso',
      status: 'CONFIRMADO',
      technicalNotes: 'Base Inoa 6.0 (20vol) + Balayage contornos 9.13 + 8.3 Dialight. Aplicar protector dérmico en nuca.',
      paid: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt-102',
      customerId: 'cust-2',
      customerName: 'Lucía Alvear',
      customerEmail: 'lucia.alvear@gmail.com',
      customerPhone: '+54 9 11 4920-3312',
      serviceId: 'srv-5',
      serviceName: 'Ritual Kérastase Fusio-Dose & Olaplex',
      servicePrice: 46000,
      duration: 60,
      employeeId: 'emp-3',
      employeeName: 'Valentina Duarte',
      station: 'Sillón 3 - Spa Capilar',
      date: today,
      startTime: '10:00',
      endTime: '11:00',
      salonStatus: 'En bacha',
      status: 'CONFIRMADO',
      technicalNotes: 'Porosidad media en puntas. Aplicar Concentré Vita-Ciment + Booster Reconstruction.',
      paid: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt-103',
      customerId: 'cust-3',
      customerName: 'Martina Anchorena',
      customerEmail: 'martina.anchorena@gmail.com',
      customerPhone: '+54 9 11 6112-8874',
      serviceId: 'srv-3',
      serviceName: 'Coloración Global Inoa Sin Amoníaco',
      servicePrice: 58000,
      duration: 90,
      employeeId: 'emp-1',
      employeeName: 'Camila Moreau',
      station: 'Sillón 1 - VIP Gold',
      date: today,
      startTime: '15:00',
      endTime: '16:30',
      salonStatus: 'En espera',
      status: 'CONFIRMADO',
      technicalNotes: 'Fórmula 5.35 Castaño Luminoso Inoa. ¡IMPORTANTE! Usar guantes de nitrilo (alergia al látex).',
      paid: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt-104',
      customerId: 'cust-4',
      customerName: 'Elena Blaquier',
      customerEmail: 'elena.blaquier@gmail.com',
      customerPhone: '+54 9 11 5004-7721',
      serviceId: 'srv-1',
      serviceName: 'Corte de Autor & Visagismo',
      servicePrice: 32000,
      duration: 60,
      employeeId: 'emp-2',
      employeeName: 'Mateo Lombardo',
      station: 'Sillón 2 - Studio',
      date: today,
      startTime: '11:00',
      endTime: '12:00',
      salonStatus: 'Listo / Finalizado',
      status: 'CONFIRMADO',
      technicalNotes: 'Corte Bob Italiano texturizado en seco + serum Elixir Ultime en puntas.',
      paid: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'apt-105',
      customerId: 'cust-1',
      customerName: 'Sofía Mendizábal',
      customerEmail: 'cliente@glamstudio.com',
      customerPhone: '+54 9 11 5842-9011',
      serviceId: 'srv-2',
      serviceName: 'Brushing Couture & Ondas al Agua',
      servicePrice: 24000,
      duration: 45,
      employeeId: 'emp-2',
      employeeName: 'Mateo Lombardo',
      station: 'Sillón 2 - Studio',
      date: today,
      startTime: '16:00',
      endTime: '16:45',
      salonStatus: 'En espera',
      status: 'CONFIRMADO',
      technicalNotes: 'Ondas al agua suaves con protector térmico Kérastase.',
      paid: false,
      createdAt: new Date().toISOString(),
    },
  ]
}

export function getInitialSales() {
  const today = getTodayISO()
  return [
    {
      id: 'sale-901',
      ticketNumber: 'GS-000101',
      date: today,
      createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      customerName: 'Carolina Santillán',
      paymentMethod: 'Tarjeta de Crédito',
      items: [
        {
          id: 'srv-4',
          type: 'service',
          name: 'Balayage Haute Couture + Matiz',
          price: 98000,
          quantity: 1,
          employeeId: 'emp-1',
          employeeName: 'Camila Moreau',
          commissionPct: 42,
        },
        {
          id: 'prd-1',
          type: 'product',
          name: "Kérastase Elixir Ultime L'Huile Originale 100ml",
          price: 64000,
          quantity: 1,
          employeeId: 'emp-1',
          employeeName: 'Camila Moreau',
          commissionPct: 10,
        },
      ],
      subtotal: 162000,
      discount: 0,
      total: 162000,
      cashierEmail: 'recepcion@glamstudio.com',
    },
    {
      id: 'sale-902',
      ticketNumber: 'GS-000102',
      date: today,
      createdAt: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString(),
      customerName: 'Victoria Ocampo',
      paymentMethod: 'Efectivo',
      items: [
        {
          id: 'srv-1',
          type: 'service',
          name: 'Corte de Autor & Visagismo',
          price: 32000,
          quantity: 1,
          employeeId: 'emp-2',
          employeeName: 'Mateo Lombardo',
          commissionPct: 40,
        },
        {
          id: 'srv-5',
          type: 'service',
          name: 'Ritual Kérastase Fusio-Dose & Olaplex',
          price: 46000,
          quantity: 1,
          employeeId: 'emp-3',
          employeeName: 'Valentina Duarte',
          commissionPct: 35,
        },
      ],
      subtotal: 78000,
      discount: 0,
      total: 78000,
      cashierEmail: 'recepcion@glamstudio.com',
    },
    {
      id: 'sale-903',
      ticketNumber: 'GS-000103',
      date: today,
      createdAt: new Date(Date.now() - 3600 * 1000 * 0.5).toISOString(),
      customerName: 'Sofía Mendizábal',
      paymentMethod: 'Transferencia / QR',
      items: [
        {
          id: 'srv-3',
          type: 'service',
          name: 'Coloración Global Inoa Sin Amoníaco',
          price: 58000,
          quantity: 1,
          employeeId: 'emp-4',
          employeeName: 'Julián Rossi',
          commissionPct: 38,
        },
        {
          id: 'prd-3',
          type: 'product',
          name: "L'Oréal Absolut Repair Gold Mask 250ml",
          price: 44000,
          quantity: 1,
          employeeId: 'emp-4',
          employeeName: 'Julián Rossi',
          commissionPct: 10,
        },
      ],
      subtotal: 102000,
      discount: 0,
      total: 102000,
      cashierEmail: 'recepcion@glamstudio.com',
    },
  ]
}

export function getInitialCashSessions() {
  const today = getTodayISO()
  return [
    {
      id: 'cash-session-active',
      date: today,
      openedAt: `${today}T08:45:00.000Z`,
      openedBy: 'recepcion@glamstudio.com',
      initialCash: 50000,
      status: 'OPEN',
      notes: 'Apertura turno mañana GlamStudio',
    },
  ]
}

export function getInitialDailyCloses() {
  return [
    {
      id: 'close-prev-1',
      date: '2026-11-14',
      closedAt: '2026-11-14T20:15:00.000Z',
      closedBy: 'recepcion@glamstudio.com',
      initialCash: 50000,
      expectedCash: 164000,
      countedCash: 164000,
      cardTotal: 295000,
      transferTotal: 142000,
      difference: 0,
      totalRevenue: 551000,
      notes: 'Cierre perfecto sin diferencias de arqueo.',
    },
  ]
}

let dbPromise = null

export function openGlamDatabase() {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null)
  }

  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      Object.values(STORES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' })
        }
      })
    }

    request.onsuccess = (event) => {
      resolve(event.target.result)
    }

    request.onerror = (event) => {
      console.warn('IndexedDB fallback to localStorage:', event.target.error)
      resolve(null)
    }
  })

  return dbPromise
}

function readLocalCache(storeName) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + storeName)
    return raw ? JSON.parse(raw) : null
  } catch (e) {
    console.warn(`Error reading localStorage for ${storeName}:`, e)
    return null
  }
}

function writeLocalCache(storeName, items) {
  try {
    localStorage.setItem(LS_PREFIX + storeName, JSON.stringify(items))
  } catch (e) {
    console.warn(`Error writing localStorage for ${storeName}:`, e)
  }
}

export async function getAllFromStore(storeName) {
  const localItems = readLocalCache(storeName)
  const db = await openGlamDatabase()

  if (!db) {
    return localItems || []
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, 'readonly')
      const store = tx.objectStore(storeName)
      const req = store.getAll()

      req.onsuccess = () => {
        const result = req.result || []
        if (result.length > 0) {
          writeLocalCache(storeName, result)
          resolve(result)
        } else if (localItems && localItems.length > 0) {
          resolve(localItems)
        } else {
          resolve([])
        }
      }

      req.onerror = () => {
        resolve(localItems || [])
      }
    } catch (err) {
      resolve(localItems || [])
    }
  })
}

export async function putInStore(storeName, item) {
  const current = await getAllFromStore(storeName)
  const idx = current.findIndex((x) => x.id === item.id)
  let updated
  if (idx >= 0) {
    updated = [...current]
    updated[idx] = item
  } else {
    updated = [...current, item]
  }
  writeLocalCache(storeName, updated)

  const db = await openGlamDatabase()
  if (db) {
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).put(item)
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
      } catch (e) {
        resolve(false)
      }
    })
  }
  return item
}

export async function bulkPutInStore(storeName, items) {
  writeLocalCache(storeName, items)
  const db = await openGlamDatabase()
  if (db) {
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        store.clear()
        items.forEach((item) => store.put(item))
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
      } catch (e) {
        resolve(false)
      }
    })
  }
  return items
}

export async function deleteFromStore(storeName, id) {
  const current = await getAllFromStore(storeName)
  const updated = current.filter((x) => x.id !== id)
  writeLocalCache(storeName, updated)

  const db = await openGlamDatabase()
  if (db) {
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).delete(id)
        tx.oncomplete = () => resolve(true)
        tx.onerror = () => resolve(false)
      } catch (e) {
        resolve(false)
      }
    })
  }
  return true
}

let seedPromise = null

export async function ensureSeedData() {
  if (typeof window === 'undefined') return
  if (seedPromise) return seedPromise

  seedPromise = (async () => {
    const alreadySeeded = localStorage.getItem(SEED_FLAG_KEY)
    const existingServices = readLocalCache(STORES.SERVICES)

    if (!alreadySeeded || !existingServices || existingServices.length === 0) {
      await bulkPutInStore(STORES.SERVICES, INITIAL_SERVICES)
      await bulkPutInStore(STORES.EMPLOYEES, INITIAL_EMPLOYEES)
      await bulkPutInStore(STORES.PRODUCTS, INITIAL_PRODUCTS)
      await bulkPutInStore(STORES.CUSTOMERS, INITIAL_CUSTOMERS)
      await bulkPutInStore(STORES.APPOINTMENTS, getInitialAppointments())
      await bulkPutInStore(STORES.SALES, getInitialSales())
      await bulkPutInStore(STORES.CASH_SESSIONS, getInitialCashSessions())
      await bulkPutInStore(STORES.DAILY_CLOSES, getInitialDailyCloses())
      await bulkPutInStore(STORES.INVENTORY_LOGS, [
        {
          id: 'log-init-1',
          productId: 'prd-2',
          productName: 'Olaplex Nº3 Hair Perfector 100ml',
          type: 'ALERTA_PREVENTIVA',
          quantityChange: -1,
          newStock: 3,
          reason: 'Venta mostrador - Stock en nivel preventivo',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'log-init-2',
          productId: 'prd-4',
          productName: 'Moroccanoil Tratamiento Original 100ml',
          type: 'AGOTADO',
          quantityChange: -2,
          newStock: 0,
          reason: 'Últimas unidades vendidas - Requiere reposición urgente',
          createdAt: new Date().toISOString(),
        },
      ])
      localStorage.setItem(SEED_FLAG_KEY, 'true')
    }
  })()

  try {
    await seedPromise
  } finally {
    seedPromise = null
  }
}

export async function resetDatabaseToSeed() {
  localStorage.removeItem(SEED_FLAG_KEY)
  await ensureSeedData()
}
