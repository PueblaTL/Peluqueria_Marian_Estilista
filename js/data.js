/**
 * data.js - Datos Iniciales y Fixtures para "Marian Estilista" (San Carlos de Bariloche)
 * 
 * Estructura de entidades preparadas para migración a Spring Boot / JPA Entities.
 * Negocio orientado exclusivamente a peluquería femenina con Mariano como único profesional.
 */

const SEED_DATA = {
  // Configuración general del negocio
  negocio: {
    nombre: "Marian Estilista",
    profesional: "Mariano",
    lema: "El arte de realzar tu belleza y transformar tu cabello",
    descripcion: "Espacio exclusivo dedicado a la belleza y salud capilar femenina en San Carlos de Bariloche. Especialización en balayage, babylights, alisados de última generación, tratamientos nutritivos y peinados de autor.",
    lugar: "Galería La Catedral, San Carlos de Bariloche – Salón Marian Estilista",
    direccion: "Galería La Catedral, San Carlos de Bariloche",
    telefono: "+54 9 294 400-0000",
    whatsapp: "+54 9 294 400-0000",
    whatsappLink: "https://wa.me/5492944000000",
    instagram: "@marianestilista",
    instagramLink: "https://instagram.com",
    email: "contacto@marianestilista.com",
    experiencia: "+15 Años de Experiencia",
    horariosTexto: "Martes a Sábados de 09:00 a 19:00 hs",
    diasApertura: [2, 3, 4, 5, 6], // Martes (2) a Sábado (6)
    horaApertura: "09:00",
    horaCierre: "19:00",
    intervaloTurnosMinutos: 30
  },

  // Profesional Único (Mariano)
  profesional: {
    id: "prof-1",
    nombre: "Mariano",
    titulo: "Estilista Profesional & Colorista",
    especialidad: "Coloración, Balayage, Alisados y Peinados",
    experiencia: "+15 Años de Experiencia",
    descripcion: "Especialista en colorimetría avanzada, diseño de iluminación personalizada, alisados de alto brillo y tratamientos restauradores. Con más de 15 años de trayectoria dedicados a brindar una atención personalizada a cada clienta en Bariloche.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    diasLaborales: [2, 3, 4, 5, 6],
    horarioInicio: "09:00",
    horarioFin: "19:00",
    activo: true
  },

  // Catálogo Oficial de Servicios (7 Servicios Exclusivamente Femeninos)
  servicios: [
    {
      id: "srv-1",
      nombre: "Mechas Babylight",
      categoria: "Iluminación",
      descripcion: "Técnica de iluminación sutil que aporta luminosidad y dimensión al cabello mediante reflejos delicados y naturales.",
      precio: 38000,
      duracionMinutos: 150,
      imagen: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80",
      destacado: true,
      activo: true
    },
    {
      id: "srv-2",
      nombre: "Balayage",
      categoria: "Iluminación",
      descripcion: "Técnica de coloración que crea una iluminación progresiva y natural, adaptada a cada cabello.",
      precio: 45000,
      duracionMinutos: 180,
      imagen: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=80",
      destacado: true,
      activo: true
    },
    {
      id: "srv-3",
      nombre: "Tratamiento de Keratina",
      categoria: "Tratamientos",
      descripcion: "Tratamiento destinado a mejorar la apariencia, suavidad y manejabilidad del cabello.",
      precio: 22000,
      duracionMinutos: 90,
      imagen: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80",
      destacado: true,
      activo: true
    },
    {
      id: "srv-4",
      nombre: "Alisado 5D",
      categoria: "Alisados",
      descripcion: "Servicio de alisado profesional que brinda alineación de la fibra capilar, reducción total de frizz y brillo efecto espejo.",
      precio: 28000,
      duracionMinutos: 120,
      imagen: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80",
      destacado: true,
      activo: true
    },
    {
      id: "srv-5",
      nombre: "Alisado 6D Laser",
      categoria: "Alisados",
      descripcion: "Servicio de alisado profesional de alta definición y máxima durabilidad, restaurando la sedosidad y vitalidad del cabello.",
      precio: 35000,
      duracionMinutos: 150,
      imagen: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80",
      destacado: true,
      activo: true
    },
    {
      id: "srv-6",
      nombre: "Peinados",
      categoria: "Peinados",
      descripcion: "Peinados profesionales para eventos, ocasiones especiales y diferentes estilos.",
      precio: 18000,
      duracionMinutos: 60,
      imagen: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
      destacado: false,
      activo: true
    },
    {
      id: "srv-7",
      nombre: "Coloración",
      categoria: "Coloración",
      descripcion: "Coloración y trabajos de color personalizados según el cabello y objetivo de cada clienta.",
      precio: 25000,
      duracionMinutos: 90,
      imagen: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80",
      destacado: true,
      activo: true
    }
  ],

  // Información Oficial del Curso de Peluquería
  curso: {
    id: "cur-1",
    nombre: "CURSO COMPLETO DE PELUQUERÍA PROFESIONAL",
    tag: "✨ ¡INSCRIPCIONES ABIERTAS!",
    inicio: "10 de julio",
    lugar: "Galería La Catedral, San Carlos de Bariloche – Salón Marian Estilista",
    modalidad: "Presencial. Curso completo y 100% práctico.",
    duracion: "5 meses",
    clases: "1 vez por semana",
    formacion: "Teoría y práctica profesional",
    inversion: 350000,
    inversionTexto: "$350.000 por mes",
    certificacion: "Al finalizar el curso se entregará un certificado.",
    descripcion: "Capacitación intensiva y personalizada impartida directamente por Mariano en Bariloche. Desarrolla las técnicas de color, iluminación, alisados y diagnóstico capilar con mayor demanda en el mercado profesional.",
    contenidos: [
      {
        titulo: "Color y colorimetría",
        icono: "palette",
        temas: [
          "Colorimetría completa",
          "Tinturas y formulación del color",
          "Retoque de raíces",
          "Cubrimiento de canas",
          "Corrección de color",
          "Decoloración profesional",
          "Matización: Beige, Manteca, Ceniza, Perlado, y más"
        ]
      },
      {
        titulo: "Técnicas de iluminación",
        icono: "sparkles",
        temas: [
          "Balayage",
          "Babylights",
          "Mechas y reflejos"
        ]
      },
      {
        titulo: "Alisados y tratamientos",
        icono: "feather",
        temas: [
          "Alisados",
          "Botox capilar",
          "Shock de keratina",
          "Tratamientos de hidratación",
          "Tratamientos de nutrición",
          "Tratamientos de reconstrucción"
        ]
      },
      {
        titulo: "Diagnóstico y atención profesional",
        icono: "user-check",
        temas: [
          "Diagnóstico capilar",
          "Atención al cliente",
          "Asesoramiento profesional"
        ]
      }
    ]
  },

  // Galería de Trabajos Reales (Exclusivamente Femenina)
  galeria: [
    {
      id: "gal-1",
      titulo: "Balayage Vainilla & Golden Gloss",
      categoria: "balayage",
      categoriaNombre: "Balayage",
      imagen: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=900&q=80",
      descripcion: "Degradé suave con matices beige manteca y acabado ultra luminoso."
    },
    {
      id: "gal-2",
      titulo: "Mechas Babylight Ceniza",
      categoria: "babylights",
      categoriaNombre: "Babylights",
      imagen: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=900&q=80",
      descripcion: "Micro-reflejos de alta densidad para máxima luminosidad y naturalidad."
    },
    {
      id: "gal-3",
      titulo: "Alisado 6D Laser & Tratamiento Espejo",
      categoria: "alisados",
      categoriaNombre: "Alisados",
      imagen: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=80",
      descripcion: "Alineación capilar completa con sedosidad y cero encrespamiento."
    },
    {
      id: "gal-4",
      titulo: "Coloración Chocolate Profundo & Brillo",
      categoria: "coloracion",
      categoriaNombre: "Coloración",
      imagen: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=80",
      descripcion: "Cobertura perfecta y sellado cuticular con reflejos multidimensionales."
    },
    {
      id: "gal-5",
      titulo: "Peinado de Fiesta Ondas Glam",
      categoria: "peinados",
      categoriaNombre: "Peinados",
      imagen: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=900&q=80",
      descripcion: "Ondas marcadas y peinado sofisticado para galas y ocasiones especiales."
    },
    {
      id: "gal-6",
      titulo: "Transformación Balayage Miel Caramelo",
      categoria: "balayage",
      categoriaNombre: "Balayage",
      imagen: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=900&q=80",
      descripcion: "Iluminación cálida en base castaña con contorno frontal iluminado."
    },
    {
      id: "gal-7",
      titulo: "Tratamiento de Keratina Reconstructivo",
      categoria: "tratamientos",
      categoriaNombre: "Tratamientos",
      imagen: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
      descripcion: "Nutrición intensiva y recuperación de puntas resecas y porosas."
    },
    {
      id: "gal-8",
      titulo: "Alisado 5D Brillo Extremo",
      categoria: "alisados",
      categoriaNombre: "Alisados",
      imagen: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=900&q=80",
      descripcion: "Lacio impecable, manejable y con movimiento natural sin rigidez."
    }
  ],

  // Turnos Iniciales Simulados (Todos con Mariano en Bariloche)
  turnos: [
    {
      id: "trn-1001",
      servicioId: "srv-2",
      servicioNombre: "Balayage",
      profesionalId: "prof-1",
      profesionalNombre: "Mariano",
      fecha: new Date().toISOString().split("T")[0],
      hora: "10:00",
      duracionMinutos: 180,
      precio: 45000,
      estado: "Confirmado",
      cliente: {
        nombre: "Camila",
        apellido: "Fernández",
        telefono: "+54 9 294 455-8899",
        email: "camila.fernandez@gmail.com",
        notas: "Quiere tonos beige manteca"
      },
      creadoEn: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: "trn-1002",
      servicioId: "srv-1",
      servicioNombre: "Mechas Babylight",
      profesionalId: "prof-1",
      profesionalNombre: "Mariano",
      fecha: new Date().toISOString().split("T")[0],
      hora: "15:00",
      duracionMinutos: 150,
      precio: 38000,
      estado: "Pendiente",
      cliente: {
        nombre: "Luciana",
        apellido: "García",
        telefono: "+54 9 294 477-2233",
        email: "luciana.garcia@outlook.com",
        notas: "Primera vez en el salón"
      },
      creadoEn: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "trn-1003",
      servicioId: "srv-5",
      servicioNombre: "Alisado 6D Laser",
      profesionalId: "prof-1",
      profesionalNombre: "Mariano",
      fecha: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      hora: "11:00",
      duracionMinutos: 150,
      precio: 35000,
      estado: "Confirmado",
      cliente: {
        nombre: "Valentina",
        apellido: "Rossi",
        telefono: "+54 9 294 444-9988",
        email: "valen.rossi@yahoo.com",
        notas: "Cabello largo y con volumen"
      },
      creadoEn: new Date().toISOString()
    },
    {
      id: "trn-1004",
      servicioId: "srv-3",
      servicioNombre: "Tratamiento de Keratina",
      profesionalId: "prof-1",
      profesionalNombre: "Mariano",
      fecha: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      hora: "16:00",
      duracionMinutos: 90,
      precio: 22000,
      estado: "Completado",
      cliente: {
        nombre: "Martina",
        apellido: "Suárez",
        telefono: "+54 9 294 466-7788",
        email: "martina.suarez@gmail.com",
        notas: "Clienta habitual"
      },
      creadoEn: new Date(Date.now() - 86400000 * 3).toISOString()
    }
  ],

  // Inscripciones Iniciales al Curso
  inscripcionesCurso: [
    {
      id: "ins-2001",
      cursoId: "cur-1",
      nombre: "Florencia",
      apellido: "Méndez",
      telefono: "+54 9 294 423-4455",
      email: "flor.mendez@gmail.com",
      fecha: new Date(Date.now() - 86400000 * 4).toISOString(),
      estado: "Inscripto"
    },
    {
      id: "ins-2002",
      cursoId: "cur-1",
      nombre: "Agustina",
      apellido: "Pérez",
      telefono: "+54 9 294 489-0011",
      email: "agus.perez@hotmail.com",
      fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
      estado: "Contactado"
    },
    {
      id: "ins-2003",
      cursoId: "cur-1",
      nombre: "Micaela",
      apellido: "Romero",
      telefono: "+54 9 294 478-9900",
      email: "mica.romero@gmail.com",
      fecha: new Date().toISOString(),
      estado: "Pendiente"
    }
  ]
};

// Exportación
if (typeof window !== "undefined") {
  window.SEED_DATA = SEED_DATA;
}
if (typeof module !== "undefined" && module.exports) {
  module.exports = SEED_DATA;
}
