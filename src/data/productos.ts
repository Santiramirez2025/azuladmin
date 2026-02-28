// ============================================================================
// TIPOS Y CONFIGURACIÓN
// ============================================================================

export type CategoriaProducto = 'ancla' | 'equilibrio' | 'premium' | 'accesorio'
export type StockStatus = 'disponible' | 'consultar' | 'bajo-pedido'
export type TipoProducto = 'colchon' | 'protector' | 'almohada' | 'sabanas' | 'cubre' | 'sommier'

export interface Producto {
  id: string
  nombre: string
  tamaño: string
  precioPublico: number
  precioMercadoLibre?: number
  categoria: CategoriaProducto
  destacado?: boolean
  stock: StockStatus
  imagen?: string
  tipo?: TipoProducto
  ahorro?: number
  ahorroPorc?: number
}

export interface CategoriaConfig {
  badge: string
  colorBg: string
  colorBorder: string
  colorGlow: string
}

// ============================================================================
// CONFIGURACIÓN DE CATEGORÍAS
// ============================================================================

export const CATEGORIAS_CONFIG: Record<CategoriaProducto, CategoriaConfig> = {
  ancla: {
    badge: 'Mejor Precio',
    colorBg: 'from-rose-600 to-red-600',
    colorBorder: 'border-rose-500/30',
    colorGlow: 'shadow-rose-500/20'
  },
  equilibrio: {
    badge: 'Más Vendido',
    colorBg: 'from-blue-600 to-blue-700',
    colorBorder: 'border-blue-500/30',
    colorGlow: 'shadow-blue-500/20'
  },
  premium: {
    badge: 'Premium',
    colorBg: 'from-amber-500 to-orange-600',
    colorBorder: 'border-amber-500/30',
    colorGlow: 'shadow-amber-500/20'
  },
  accesorio: {
    badge: 'Complemento',
    colorBg: 'from-emerald-600 to-green-600',
    colorBorder: 'border-emerald-500/30',
    colorGlow: 'shadow-emerald-500/20'
  }
}

export const TIPO_EMOJI: Record<TipoProducto, string> = {
  colchon: '🛏️',
  protector: '🛡️',
  almohada: '💤',
  sabanas: '✨',
  cubre: '🧵',
  sommier: '📦'
}

// ============================================================================
// NOTA: Precios actualizados el 09-02-26 (Lista Piero Exclusivo) + 3%
// Fórmula aplicada: precioPublico = Math.round(precioListaPDF * 1.03 / 100) * 100
// ============================================================================

// ============================================================================
// BASE DE DATOS DE PRODUCTOS
// ============================================================================

// ========== MEDITARE EUROPILLOW ==========
// PDF: 199000 / 250000 / 270000 / 350000 / 370000 → +3%
const meditareEP: Producto[] = [
  {
    id: 'meditare-ep-80',
    nombre: 'Colchón Piero Meditare EuroPillow',
    tamaño: '190x80 (1 plaza)',
    precioPublico: 205000,       // 199000 * 1.03
    precioMercadoLibre: 249900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/meditare-ep-80.jpg',
    tipo: 'colchon'
  },
  {
    id: 'meditare-ep-90',
    nombre: 'Colchón Piero Meditare EuroPillow',
    tamaño: '190x90 (1 plaza)',
    precioPublico: 258000,       // 250000 * 1.03
    precioMercadoLibre: 279900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/meditare-ep-90.jpg',
    tipo: 'colchon'
  },
  {
    id: 'meditare-ep-100',
    nombre: 'Colchón Piero Meditare EuroPillow',
    tamaño: '190x100 (1 plaza)',
    precioPublico: 278000,       // 270000 * 1.03
    precioMercadoLibre: 299900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/meditare-ep-100.jpg',
    tipo: 'colchon'
  },
  {
    id: 'meditare-ep-130',
    nombre: 'Colchón Piero Meditare EuroPillow',
    tamaño: '190x130 (1½ plaza)',
    precioPublico: 361000,       // 350000 * 1.03
    precioMercadoLibre: 379900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/meditare-ep-130.jpg',
    tipo: 'colchon'
  },
  {
    id: 'meditare-ep-140',
    nombre: 'Colchón Piero Meditare EuroPillow',
    tamaño: '190x140 (2 plazas)',
    precioPublico: 381000,       // 370000 * 1.03
    precioMercadoLibre: 399900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/meditare-ep-140.jpg',
    tipo: 'colchon'
  }
]

// ========== NIRVANA ==========
// PDF: 340000 / 380000 / 430000 / 540000 / 580000 / 730000 / 800000 / 870000 → +3%
const nirvana: Producto[] = [
  {
    id: 'nirvana-80',
    nombre: 'Colchón Piero Nirvana',
    tamaño: '190x80 (1 plaza)',
    precioPublico: 350000,       // 340000 * 1.03
    precioMercadoLibre: 449900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/nirvana-80.jpg',
    tipo: 'colchon'
  },
  {
    id: 'nirvana-90',
    nombre: 'Colchón Piero Nirvana',
    tamaño: '190x90 (1 plaza)',
    precioPublico: 391000,       // 380000 * 1.03
    precioMercadoLibre: 519900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/nirvana-90.jpg',
    tipo: 'colchon'
  },
  {
    id: 'nirvana-100',
    nombre: 'Colchón Piero Nirvana',
    tamaño: '190x100 (1 plaza)',
    precioPublico: 443000,       // 430000 * 1.03
    precioMercadoLibre: 589900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/nirvana-100.jpg',
    tipo: 'colchon'
  },
  {
    id: 'nirvana-130',
    nombre: 'Colchón Piero Nirvana',
    tamaño: '190x130 (1½ plaza)',
    precioPublico: 556000,       // 540000 * 1.03
    precioMercadoLibre: 739900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/nirvana-130.jpg',
    tipo: 'colchon'
  },
  {
    id: 'nirvana-140',
    nombre: 'Colchón Piero Nirvana',
    tamaño: '190x140 (2 plazas)',
    precioPublico: 597000,       // 580000 * 1.03
    precioMercadoLibre: 709900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/nirvana-140.jpg',
    tipo: 'colchon'
  },
  {
    id: 'nirvana-160',
    nombre: 'Colchón Piero Nirvana',
    tamaño: '190x160 (2 plazas)',
    precioPublico: 752000,       // 730000 * 1.03
    precioMercadoLibre: 999900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/nirvana-160.jpg',
    tipo: 'colchon'
  },
  {
    id: 'nirvana-180',
    nombre: 'Colchón Piero Nirvana',
    tamaño: '200x180 (Queen)',
    precioPublico: 824000,       // 800000 * 1.03
    precioMercadoLibre: 1099900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/nirvana-180.jpg',
    tipo: 'colchon'
  },
  {
    id: 'nirvana-200',
    nombre: 'Colchón Piero Nirvana',
    tamaño: '200x200 (King)',
    precioPublico: 896000,       // 870000 * 1.03
    precioMercadoLibre: 1019900,
    categoria: 'ancla',
    stock: 'disponible',
    imagen: '/images/nirvana-200.jpg',
    tipo: 'colchon'
  }
]

// ========== SONNO EUROPILLOW ==========
// PDF: 300000 / 330000 / 360000 / 450000 / 490000 / 540000 → +3%
const sonnoEP: Producto[] = [
  {
    id: 'sonno-ep-80',
    nombre: 'Colchón Piero Sonno EuroPillow',
    tamaño: '190x80 (1 plaza)',
    precioPublico: 309000,       // 300000 * 1.03
    precioMercadoLibre: 339900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/sonno-ep-80.jpg',
    tipo: 'colchon'
  },
  {
    id: 'sonno-ep-90',
    nombre: 'Colchón Piero Sonno EuroPillow',
    tamaño: '190x90 (1 plaza)',
    precioPublico: 340000,       // 330000 * 1.03
    precioMercadoLibre: 369900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/sonno-ep-90.jpg',
    tipo: 'colchon'
  },
  {
    id: 'sonno-ep-100',
    nombre: 'Colchón Piero Sonno EuroPillow',
    tamaño: '190x100 (1 plaza)',
    precioPublico: 371000,       // 360000 * 1.03
    precioMercadoLibre: 399900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/sonno-ep-100.jpg',
    tipo: 'colchon'
  },
  {
    id: 'sonno-ep-130',
    nombre: 'Colchón Piero Sonno EuroPillow',
    tamaño: '190x130 (1½ plaza)',
    precioPublico: 464000,       // 450000 * 1.03
    precioMercadoLibre: 499900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/sonno-ep-130.jpg',
    tipo: 'colchon'
  },
  {
    id: 'sonno-ep-140',
    nombre: 'Colchón Piero Sonno EuroPillow',
    tamaño: '190x140 (2 plazas)',
    precioPublico: 505000,       // 490000 * 1.03
    precioMercadoLibre: 679900,
    categoria: 'equilibrio',
    destacado: true,
    stock: 'disponible',
    imagen: '/images/sonno-ep-140.jpg',
    tipo: 'colchon'
  },
  {
    id: 'sonno-ep-160',
    nombre: 'Colchón Piero Sonno EuroPillow',
    tamaño: '190x160 (2 plazas)',
    precioPublico: 556000,       // 540000 * 1.03
    precioMercadoLibre: 579900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/sonno-ep-160.jpg',
    tipo: 'colchon'
  }
]

// ========== REGNO ==========
// PDF: 310000 / 340000 / 380000 / 480000 / 570000 / 699000 → +3%
const regno: Producto[] = [
  {
    id: 'regno-80',
    nombre: 'Colchón Piero Regno',
    tamaño: '190x80 (1 plaza)',
    precioPublico: 319000,       // 310000 * 1.03
    precioMercadoLibre: 409900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/regno-80.jpg',
    tipo: 'colchon'
  },
  {
    id: 'regno-90',
    nombre: 'Colchón Piero Regno',
    tamaño: '190x90 (1 plaza)',
    precioPublico: 350000,       // 340000 * 1.03
    precioMercadoLibre: 449900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/regno-90.jpg',
    tipo: 'colchon'
  },
  {
    id: 'regno-100',
    nombre: 'Colchón Piero Regno',
    tamaño: '190x100 (1 plaza)',
    precioPublico: 391000,       // 380000 * 1.03
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/regno-100.jpg',
    tipo: 'colchon'
  },
  {
    id: 'regno-140',
    nombre: 'Colchón Piero Regno',
    tamaño: '190x140 (2 plazas)',
    precioPublico: 494000,       // 480000 * 1.03
    precioMercadoLibre: 729900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/regno-140.jpg',
    tipo: 'colchon'
  },
  {
    id: 'regno-160',
    nombre: 'Colchón Piero Regno',
    tamaño: '200x160 (Queen)',
    precioPublico: 587000,       // 570000 * 1.03
    precioMercadoLibre: 979900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/regno-160.jpg',
    tipo: 'colchon'
  },
  {
    id: 'regno-200',
    nombre: 'Colchón Piero Regno',
    tamaño: '200x200 (King)',
    precioPublico: 720000,       // 699000 * 1.03
    precioMercadoLibre: 899900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/regno-200.jpg',
    tipo: 'colchon'
  }
]

// ========== REGNO PILLOW TOP ==========
// PDF: 600000 / 690000 / 760000 / 840000 → +3%
const regnoPillow: Producto[] = [
  {
    id: 'regno-pillow-140',
    nombre: 'Colchón Piero Regno Pillow Top',
    tamaño: '190x140 (2 plazas)',
    precioPublico: 618000,       // 600000 * 1.03
    precioMercadoLibre: 629900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/regno-pillow-140.jpg',
    tipo: 'colchon'
  },
  {
    id: 'regno-pillow-160',
    nombre: 'Colchón Piero Regno Pillow Top',
    tamaño: '200x160 (Queen)',
    precioPublico: 711000,       // 690000 * 1.03
    precioMercadoLibre: 799900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/regno-pillow-160.jpg',
    tipo: 'colchon'
  },
  {
    id: 'regno-pillow-180',
    nombre: 'Colchón Piero Regno Pillow Top',
    tamaño: '200x180 (Queen XL)',
    precioPublico: 783000,       // 760000 * 1.03
    precioMercadoLibre: 979900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/regno-pillow-180.jpg',
    tipo: 'colchon'
  },
  {
    id: 'regno-pillow-200',
    nombre: 'Colchón Piero Regno Pillow Top',
    tamaño: '200x200 (King)',
    precioPublico: 865000,       // 840000 * 1.03
    precioMercadoLibre: 1079900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/regno-pillow-200.jpg',
    tipo: 'colchon'
  }
]

// ========== GRAVITA ==========
// PDF: 780000 / 970000 / 1050000 / 1100000 → +3%
const gravita: Producto[] = [
  {
    id: 'gravita-140',
    nombre: 'Colchón Piero Gravita',
    tamaño: '190x140 (2 plazas)',
    precioPublico: 803000,       // 780000 * 1.03
    precioMercadoLibre: 999900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/gravita-140.jpg',
    tipo: 'colchon'
  },
  {
    id: 'gravita-160',
    nombre: 'Colchón Piero Gravita',
    tamaño: '200x160 (Queen)',
    precioPublico: 999000,       // 970000 * 1.03
    precioMercadoLibre: 1109900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/gravita-160.jpg',
    tipo: 'colchon'
  },
  {
    id: 'gravita-180',
    nombre: 'Colchón Piero Gravita',
    tamaño: '200x180 (Queen XL)',
    precioPublico: 1082000,      // 1050000 * 1.03
    precioMercadoLibre: 1299900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/gravita-180.jpg',
    tipo: 'colchon'
  },
  {
    id: 'gravita-200',
    nombre: 'Colchón Piero Gravita',
    tamaño: '200x200 (King)',
    precioPublico: 1133000,      // 1100000 * 1.03
    precioMercadoLibre: 1319900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/gravita-200.jpg',
    tipo: 'colchon'
  }
]

// ========== NAMASTE ==========
// PDF: 270000 / 300000 / 340000 / 450000 / 570000 / 680000 → +3%
const namaste: Producto[] = [
  {
    id: 'namaste-80',
    nombre: 'Colchón Piero Namaste',
    tamaño: '190x80 (1 plaza)',
    precioPublico: 278000,       // 270000 * 1.03
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/namaste-80.jpg',
    tipo: 'colchon'
  },
  {
    id: 'namaste-90',
    nombre: 'Colchón Piero Namaste',
    tamaño: '190x90 (1 plaza)',
    precioPublico: 309000,       // 300000 * 1.03
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/namaste-90.jpg',
    tipo: 'colchon'
  },
  {
    id: 'namaste-100',
    nombre: 'Colchón Piero Namaste',
    tamaño: '190x100 (1 plaza)',
    precioPublico: 350000,       // 340000 * 1.03
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/namaste-100.jpg',
    tipo: 'colchon'
  },
  {
    id: 'namaste-140',
    nombre: 'Colchón Piero Namaste',
    tamaño: '190x140 (2 plazas)',
    precioPublico: 464000,       // 450000 * 1.03
    precioMercadoLibre: 449900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/namaste-140.jpg',
    tipo: 'colchon'
  },
  {
    id: 'namaste-160',
    nombre: 'Colchón Piero Namaste',
    tamaño: '200x160 (Queen)',
    precioPublico: 587000,       // 570000 * 1.03
    precioMercadoLibre: 579900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/namaste-160.jpg',
    tipo: 'colchon'
  },
  {
    id: 'namaste-200',
    nombre: 'Colchón Piero Namaste',
    tamaño: '200x200 (King)',
    precioPublico: 700000,       // 680000 * 1.03
    precioMercadoLibre: 699900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/namaste-200.jpg',
    tipo: 'colchon'
  }
]

// ========== NAMASTE PILLOW TOP ==========
// PDF: 570000 / 650000 → +3%
const namastePillow: Producto[] = [
  {
    id: 'namaste-pillow-140',
    nombre: 'Colchón Piero Namaste Pillow Top',
    tamaño: '190x140 (2 plazas)',
    precioPublico: 587000,       // 570000 * 1.03
    precioMercadoLibre: 579900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/namaste-pillow-140.jpg',
    tipo: 'colchon'
  },
  {
    id: 'namaste-pillow-160',
    nombre: 'Colchón Piero Namaste Pillow Top',
    tamaño: '200x160 (Queen)',
    precioPublico: 670000,       // 650000 * 1.03
    precioMercadoLibre: 659900,
    categoria: 'equilibrio',
    stock: 'disponible',
    imagen: '/images/namaste-pillow-160.jpg',
    tipo: 'colchon'
  }
]

// ========== MONTREAUX ==========
// PDF: 850000 / 1050000 / 1150000 / 1200000 → +3%
const montreaux: Producto[] = [
  {
    id: 'montreaux-140',
    nombre: 'Colchón Piero Montreaux',
    tamaño: '190x140 (2 plazas)',
    precioPublico: 876000,       // 850000 * 1.03
    precioMercadoLibre: 1369900,
    categoria: 'premium',
    stock: 'disponible',
    imagen: '/images/montreaux-140.jpg',
    tipo: 'colchon'
  },
  {
    id: 'montreaux-160',
    nombre: 'Colchón Piero Montreaux',
    tamaño: '200x160 (Queen)',
    precioPublico: 1082000,      // 1050000 * 1.03
    precioMercadoLibre: 1699900,
    categoria: 'premium',
    stock: 'disponible',
    imagen: '/images/montreaux-160.jpg',
    tipo: 'colchon'
  },
  {
    id: 'montreaux-180',
    nombre: 'Colchón Piero Montreaux',
    tamaño: '200x180 (Queen XL)',
    precioPublico: 1185000,      // 1150000 * 1.03
    categoria: 'premium',
    stock: 'disponible',
    imagen: '/images/montreaux-180.jpg',
    tipo: 'colchon'
  },
  {
    id: 'montreaux-200',
    nombre: 'Colchón Piero Montreaux',
    tamaño: '200x200 (King)',
    precioPublico: 1236000,      // 1200000 * 1.03
    precioMercadoLibre: 1929900,
    categoria: 'premium',
    stock: 'disponible',
    imagen: '/images/montreaux-200.jpg',
    tipo: 'colchon'
  }
]

// ========== MONTREAUX PILLOW TOP ==========
// PDF: 1050000 / 1250000 / 1350000 / 1450000 → +3%
const montreauxPillow: Producto[] = [
  {
    id: 'montreaux-pillow-140',
    nombre: 'Colchón Piero Montreaux Pillow Top',
    tamaño: '190x140 (2 plazas)',
    precioPublico: 1082000,      // 1050000 * 1.03
    precioMercadoLibre: 1529900,
    categoria: 'premium',
    stock: 'disponible',
    imagen: '/images/montreaux-pillow-140.jpg',
    tipo: 'colchon'
  },
  {
    id: 'montreaux-pillow-160',
    nombre: 'Colchón Piero Montreaux Pillow Top',
    tamaño: '200x160 (Queen)',
    precioPublico: 1288000,      // 1250000 * 1.03
    precioMercadoLibre: 2079900,
    categoria: 'premium',
    destacado: true,
    stock: 'disponible',
    imagen: '/images/montreaux-pillow-160.jpg',
    tipo: 'colchon'
  },
  {
    id: 'montreaux-pillow-180',
    nombre: 'Colchón Piero Montreaux Pillow Top',
    tamaño: '200x180 (Queen XL)',
    precioPublico: 1391000,      // 1350000 * 1.03
    precioMercadoLibre: 2289900,
    categoria: 'premium',
    stock: 'disponible',
    imagen: '/images/montreaux-pillow-180.jpg',
    tipo: 'colchon'
  },
  {
    id: 'montreaux-pillow-200',
    nombre: 'Colchón Piero Montreaux Pillow Top',
    tamaño: '200x200 (King)',
    precioPublico: 1494000,      // 1450000 * 1.03
    precioMercadoLibre: 2679900,
    categoria: 'premium',
    stock: 'disponible',
    imagen: '/images/montreaux-pillow-200.jpg',
    tipo: 'colchon'
  }
]

// ========== DREAM FIT POCKET ==========
// PDF: 1700000 / 2000000 / 2200000 → +3%
const dreamFitPocket: Producto[] = [
  {
    id: 'dreamfit-pocket-140',
    nombre: 'Colchón Piero Dream Fit Pocket',
    tamaño: '190x140 (2 plazas)',
    precioPublico: 1751000,      // 1700000 * 1.03
    precioMercadoLibre: 2099900,
    categoria: 'premium',
    stock: 'consultar',
    imagen: '/images/dreamfit-pocket-140.jpg',
    tipo: 'colchon'
  },
  {
    id: 'dreamfit-pocket-160',
    nombre: 'Colchón Piero Dream Fit Pocket',
    tamaño: '200x160 (Queen)',
    precioPublico: 2060000,      // 2000000 * 1.03
    precioMercadoLibre: 2399900,
    categoria: 'premium',
    stock: 'consultar',
    imagen: '/images/dreamfit-pocket-160.jpg',
    tipo: 'colchon'
  },
  {
    id: 'dreamfit-pocket-200',
    nombre: 'Colchón Piero Dream Fit Pocket',
    tamaño: '200x200 (King)',
    precioPublico: 2266000,      // 2200000 * 1.03
    precioMercadoLibre: 2749900,
    categoria: 'premium',
    stock: 'consultar',
    imagen: '/images/dreamfit-pocket-200.jpg',
    tipo: 'colchon'
  }
]

// ========== DREAM FIT FOAM ==========
// PDF: 1560000 / 1820000 / 2050000 → +3%
const dreamFitFoam: Producto[] = [
  {
    id: 'dreamfit-foam-140',
    nombre: 'Colchón Piero Dream Fit Foam',
    tamaño: '190x140x32 (2 plazas)',
    precioPublico: 1607000,      // 1560000 * 1.03
    categoria: 'premium',
    stock: 'consultar',
    imagen: '/images/dreamfit-foam-140.jpg',
    tipo: 'colchon'
  },
  {
    id: 'dreamfit-foam-160',
    nombre: 'Colchón Piero Dream Fit Foam',
    tamaño: '200x160x32 (Queen)',
    precioPublico: 1875000,      // 1820000 * 1.03
    categoria: 'premium',
    stock: 'consultar',
    imagen: '/images/dreamfit-foam-160.jpg',
    tipo: 'colchon'
  },
  {
    id: 'dreamfit-foam-200',
    nombre: 'Colchón Piero Dream Fit Foam',
    tamaño: '200x200x32 (King)',
    precioPublico: 2112000,      // 2050000 * 1.03
    categoria: 'premium',
    stock: 'consultar',
    imagen: '/images/dreamfit-foam-200.jpg',
    tipo: 'colchon'
  }
]

// ========== SOMMIERS ==========
// SIN CAMBIOS - precios ya coincidían con PDF
const sommiers: Producto[] = [
  // DREAM FIT
  {
    id: 'sommier-dreamfit-140',
    nombre: 'Sommier Piero Dream Fit',
    tamaño: '190x140',
    precioPublico: 500000,
    categoria: 'accesorio',
    stock: 'consultar',
    imagen: '/images/sommier-dreamfit-140.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-dreamfit-160',
    nombre: 'Sommier Piero Dream Fit',
    tamaño: '200x160',
    precioPublico: 800000,
    categoria: 'accesorio',
    stock: 'consultar',
    imagen: '/images/sommier-dreamfit-160.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-dreamfit-200',
    nombre: 'Sommier Piero Dream Fit',
    tamaño: '200x200',
    precioPublico: 850000,
    categoria: 'accesorio',
    stock: 'consultar',
    imagen: '/images/sommier-dreamfit-200.jpg',
    tipo: 'sommier'
  },

  // BROWN
  {
    id: 'sommier-brown-80',
    nombre: 'Sommier Piero Brown',
    tamaño: '190x80',
    precioPublico: 170000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-brown-80.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-brown-90',
    nombre: 'Sommier Piero Brown',
    tamaño: '190x90',
    precioPublico: 180000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-brown-90.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-brown-100',
    nombre: 'Sommier Piero Brown',
    tamaño: '190x100',
    precioPublico: 190000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-brown-100.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-brown-130',
    nombre: 'Sommier Piero Brown',
    tamaño: '190x130',
    precioPublico: 210000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-brown-130.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-brown-140',
    nombre: 'Sommier Piero Brown',
    tamaño: '190x140',
    precioPublico: 220000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-brown-140.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-brown-160',
    nombre: 'Sommier Piero Brown',
    tamaño: '190x160',
    precioPublico: 380000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-brown-160.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-brown-180',
    nombre: 'Sommier Piero Brown',
    tamaño: '200x180',
    precioPublico: 380000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-brown-180.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-brown-200',
    nombre: 'Sommier Piero Brown',
    tamaño: '200x200',
    precioPublico: 390000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-brown-200.jpg',
    tipo: 'sommier'
  },

  // GREY
  {
    id: 'sommier-grey-80',
    nombre: 'Sommier Piero Grey',
    tamaño: '190x80',
    precioPublico: 150000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-grey-80.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-grey-90',
    nombre: 'Sommier Piero Grey',
    tamaño: '190x90',
    precioPublico: 160000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-grey-90.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-grey-100',
    nombre: 'Sommier Piero Grey',
    tamaño: '190x100',
    precioPublico: 180000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-grey-100.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-grey-140',
    nombre: 'Sommier Piero Grey',
    tamaño: '190x140',
    precioPublico: 200000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-grey-140.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-grey-160',
    nombre: 'Sommier Piero Grey',
    tamaño: '200x160',
    precioPublico: 320000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-grey-160.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-grey-180',
    nombre: 'Sommier Piero Grey',
    tamaño: '200x180',
    precioPublico: 330000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-grey-180.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-grey-200',
    nombre: 'Sommier Piero Grey',
    tamaño: '200x200',
    precioPublico: 350000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-grey-200.jpg',
    tipo: 'sommier'
  },

  // SOGNARE
  {
    id: 'sommier-sognare-80',
    nombre: 'Sommier Piero Sognare',
    tamaño: '190x80',
    precioPublico: 160000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-sognare-80.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-sognare-90',
    nombre: 'Sommier Piero Sognare',
    tamaño: '190x90',
    precioPublico: 170000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-sognare-90.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-sognare-100',
    nombre: 'Sommier Piero Sognare',
    tamaño: '190x100',
    precioPublico: 180000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-sognare-100.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-sognare-130',
    nombre: 'Sommier Piero Sognare',
    tamaño: '190x130',
    precioPublico: 200000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-sognare-130.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-sognare-140',
    nombre: 'Sommier Piero Sognare',
    tamaño: '190x140',
    precioPublico: 220000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-sognare-140.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-sognare-160',
    nombre: 'Sommier Piero Sognare',
    tamaño: '190x160',
    precioPublico: 320000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-sognare-160.jpg',
    tipo: 'sommier'
  },

  // EXCLUSIVO
  {
    id: 'sommier-exclusivo-140',
    nombre: 'Sommier Piero Exclusivo',
    tamaño: '190x140',
    precioPublico: 200000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-exclusivo-140.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-exclusivo-160',
    nombre: 'Sommier Piero Exclusivo',
    tamaño: '200x160',
    precioPublico: 350000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-exclusivo-160.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-exclusivo-180',
    nombre: 'Sommier Piero Exclusivo',
    tamaño: '200x180',
    precioPublico: 350000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-exclusivo-180.jpg',
    tipo: 'sommier'
  },
  {
    id: 'sommier-exclusivo-200',
    nombre: 'Sommier Piero Exclusivo',
    tamaño: '200x200',
    precioPublico: 390000,
    categoria: 'accesorio',
    stock: 'disponible',
    imagen: '/images/sommier-exclusivo-200.jpg',
    tipo: 'sommier'
  }
]

// ============================================================================
// ACCESORIOS
// ============================================================================

const accesorios: Producto[] = [

  // ========== PROTECTORES IMPERMEABLES (4 ELÁSTICOS) ==========
  // PDF: 17000 / 18000 / 19000 / 23000 / 28000 / 30000 / 33000 → +3%
  {
    id: 'protector-80',
    nombre: 'Cubre Colchon Procol (4 elásticos)',
    tamaño: '190x80 cm',
    precioPublico: 18000,        // 17000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-80.jpg'
  },
  {
    id: 'protector-90',
    nombre: 'Cubre Colchon Procol (4 elásticos)',
    tamaño: '190x90 cm',
    precioPublico: 19000,        // 18000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-90.jpg'
  },
  {
    id: 'protector-100',
    nombre: 'Cubre Colchon Procol (4 elásticos)',
    tamaño: '190x100 cm',
    precioPublico: 20000,        // 19000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-100.jpg'
  },
  {
    id: 'protector-140',
    nombre: 'Cubre Colchon Procol (4 elásticos)',
    tamaño: '190x140 cm',
    precioPublico: 24000,        // 23000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-140.jpg'
  },
  {
    id: 'protector-160',
    nombre: 'Cubre Colchon Procol (4 elásticos)',
    tamaño: '200x160 cm (Queen)',
    precioPublico: 29000,        // 28000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-160.jpg'
  },
  {
    id: 'protector-180',
    nombre: 'Cubre Colchon Procol (4 elásticos)',
    tamaño: '200x180 cm',
    precioPublico: 31000,        // 30000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-180.jpg'
  },
  {
    id: 'protector-200',
    nombre: 'Cubre Colchon Procol (4 elásticos)',
    tamaño: '200x200 cm (King)',
    precioPublico: 34000,        // 33000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-200.jpg'
  },

  // ========== PROTECTORES LATERALES ==========
  // PDF: 31000 / 32000 / 33000 / 39000 / 60000 / 66000 / 78000 → +3%
  {
    id: 'protector-lateral-80',
    nombre: 'Cubre Colchon Lateral',
    tamaño: '190x80 cm',
    precioPublico: 32000,        // 31000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-lateral-80.jpg'
  },
  {
    id: 'protector-lateral-90',
    nombre: 'Cubre Colchon Lateral',
    tamaño: '190x90 cm',
    precioPublico: 33000,        // 32000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-lateral-90.jpg'
  },
  {
    id: 'protector-lateral-100',
    nombre: 'Cubre Colchon Lateral',
    tamaño: '190x100 cm',
    precioPublico: 34000,        // 33000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-lateral-100.jpg'
  },
  {
    id: 'protector-lateral-140',
    nombre: 'Cubre Colchon Lateral',
    tamaño: '190x140 cm',
    precioPublico: 40000,        // 39000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-lateral-140.jpg'
  },
  {
    id: 'protector-lateral-160',
    nombre: 'Cubre Colchon Lateral',
    tamaño: '200x160 cm (Queen)',
    precioPublico: 62000,        // 60000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-lateral-160.jpg'
  },
  {
    id: 'protector-lateral-180',
    nombre: 'Cubre Colchon Lateral',
    tamaño: '200x180 cm',
    precioPublico: 68000,        // 66000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-lateral-180.jpg'
  },
  {
    id: 'protector-lateral-200',
    nombre: 'Cubre Colchon Lateral',
    tamaño: '200x200 cm (King)',
    precioPublico: 80000,        // 78000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'protector',
    imagen: '/images/protector-lateral-200.jpg'
  },

  // ========== ALMOHADAS ==========
  // SIN CAMBIOS - precios ya coincidían con PDF

  // Visco Dream Fit Clásica
  {
    id: 'almohada-visco-clasica-62',
    nombre: 'Almohada Piero Visco Dream Fit Clásica',
    tamaño: '62x40 cm',
    precioPublico: 120000,
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'almohada',
    imagen: '/images/almohada-visco-clasica-62.jpg'
  },
  {
    id: 'almohada-visco-clasica-90',
    nombre: 'Almohada Piero Visco Dream Fit Clásica',
    tamaño: '90x40 cm',
    precioPublico: 0,
    categoria: 'accesorio',
    stock: 'consultar',
    tipo: 'almohada',
    imagen: '/images/almohada-visco-clasica-90.jpg'
  },

  // Visco Dream Fit Cervical
  {
    id: 'almohada-visco-cervical-57',
    nombre: 'Almohada Piero Visco Dream Fit Cervical',
    tamaño: '57x37 cm',
    precioPublico: 120000,
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'almohada',
    imagen: '/images/almohada-visco-cervical-57.jpg'
  },

  // Visco Dream Tech
  {
    id: 'almohada-visco-tech-70',
    nombre: 'Almohada Piero Visco Dream Tech',
    tamaño: '70x40 cm',
    precioPublico: 115000,
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'almohada',
    imagen: '/images/almohada-visco-tech-70.jpg'
  },

  // Micro Max Tech Rollo
  {
    id: 'almohada-micro-rollo-70',
    nombre: 'Almohada Piero Micro Max Tech Rollo',
    tamaño: '70x50 cm',
    precioPublico: 85000,
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'almohada',
    imagen: '/images/almohada-micro-rollo-70.jpg'
  },
  {
    id: 'almohada-micro-rollo-80',
    nombre: 'Almohada Piero Micro Max Tech Rollo',
    tamaño: '80x50 cm',
    precioPublico: 90000,
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'almohada',
    imagen: '/images/almohada-micro-rollo-80.jpg'
  },
  {
    id: 'almohada-micro-rollo-90',
    nombre: 'Almohada Piero Micro Max Tech Rollo',
    tamaño: '90x50 cm',
    precioPublico: 95000,
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'almohada',
    imagen: '/images/almohada-micro-rollo-90.jpg'
  },

  // Fibra Smart Tech Plus
  {
    id: 'almohada-fibra-plus-70',
    nombre: 'Almohada Piero Fibra Smart Tech Plus',
    tamaño: '70x50 cm',
    precioPublico: 65000,
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'almohada',
    imagen: '/images/almohada-fibra-plus-70.jpg'
  },
  {
    id: 'almohada-fibra-plus-80',
    nombre: 'Almohada Piero Fibra Smart Tech Plus',
    tamaño: '80x50 cm',
    precioPublico: 67000,
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'almohada',
    imagen: '/images/almohada-fibra-plus-80.jpg'
  },

  // Micro Max Tech Núcleo
  {
    id: 'almohada-micro-nucleo-70',
    nombre: 'Almohada Piero Micro Max Tech Núcleo',
    tamaño: '70x40 cm',
    precioPublico: 105000,
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'almohada',
    imagen: '/images/almohada-micro-nucleo-70.jpg'
  },

  // Fibra Smart Tech Confort
  {
    id: 'almohada-fibra-confort-70',
    nombre: 'Almohada Piero Fibra Smart Tech Confort',
    tamaño: '70x40 cm',
    precioPublico: 60000,
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'almohada',
    imagen: '/images/almohada-fibra-confort-70.jpg'
  },
  {
    id: 'almohada-fibra-confort-80',
    nombre: 'Almohada Piero Fibra Smart Tech Confort',
    tamaño: '80x40 cm',
    precioPublico: 60000,
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'almohada',
    imagen: '/images/almohada-fibra-confort-80.jpg'
  },

  // ========== SÁBANAS ==========
  // PDF: 92000 / 109000 / 118000 / 135000 → +3%
  {
    id: 'sabanas-100',
    nombre: 'Sábanas Piero Classic Lisa Percal 144 Hilos',
    tamaño: 'Twin (hasta 100 cm)',
    precioPublico: 95000,        // 92000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'sabanas',
    imagen: '/images/sabanas-100.jpg'
  },
  {
    id: 'sabanas-140',
    nombre: 'Sábanas Piero Classic Lisa Percal 144 Hilos',
    tamaño: '140x190 cm (Full)',
    precioPublico: 112000,       // 109000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'sabanas',
    imagen: '/images/sabanas-140.jpg'
  },
  {
    id: 'sabanas-160',
    nombre: 'Sábanas Piero Classic Lisa Percal 144 Hilos',
    tamaño: '160x200 cm (Queen)',
    precioPublico: 122000,       // 118000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'sabanas',
    imagen: '/images/sabanas-160.jpg'
  },
  {
    id: 'sabanas-200',
    nombre: 'Sábanas Piero Classic Lisa Percal 144 Hilos',
    tamaño: '200x200 cm (King)',
    precioPublico: 139000,       // 135000 * 1.03
    categoria: 'accesorio',
    stock: 'disponible',
    tipo: 'sabanas',
    imagen: '/images/sabanas-200.jpg'
  },
]

// ============================================================================
// EXPORTACIÓN PRINCIPAL
// ============================================================================

export const PRODUCTOS: Producto[] = [
  ...meditareEP,
  ...nirvana,
  ...sonnoEP,
  ...regno,
  ...regnoPillow,
  ...gravita,
  ...namaste,
  ...namastePillow,
  ...montreaux,
  ...montreauxPillow,
  ...dreamFitPocket,
  ...dreamFitFoam,
  ...sommiers,
  ...accesorios
]

export const COLECCIONES = {
  meditareEP,
  nirvana,
  sonnoEP,
  regno,
  regnoPillow,
  gravita,
  namaste,
  namastePillow,
  montreaux,
  montreauxPillow,
  dreamFitPocket,
  dreamFitFoam,
  sommiers,
  accesorios
}