/**
 * data.js - Datos Iniciales y Fixtures para "Aura Studio"
 * Proyecto de Presentación Universitaria - Sistema Integral de Peluquería & Estilismo
 */

const SEED_DATA = {
  // Configuración general del negocio
  negocio: {
    nombre: "Aura Studio",
    subtitulo: "Peluquería & Estilismo Integral",
    lema: "El arte de realzar tu belleza y transformar tu cabello",
    descripcion: "Espacio exclusivo dedicado a la belleza y salud capilar femenina. Especialización en balayage, babylights, alisados de última generación, tratamientos nutritivos y peinados de autor.",
    lugar: "Av. San Martín 450, Centro Comercial Galerías",
    direccion: "Av. San Martín 450, Galería Comercial",
    ciudad: "Centro de Estilismo & Tendencia",
    coordenadas: [-34.603722, -58.381592],
    telefono: "+54 11 4567-8900",
    whatsapp: "+54 11 4567-8900",
    whatsappLink: "https://wa.me/541145678900",
    instagram: "@aurastudio.estilismo",
    instagramLink: "https://instagram.com",
    email: "contacto@aurastudio.demo",
    experiencia: "+12 Años de Trayectoria",
    horariosTexto: "Martes a Sábados de 09:00 a 19:00 hs",
    diasApertura: [2, 3, 4, 5, 6], // Martes (2) a Sábado (6)
    horaApertura: "09:00",
    horaCierre: "19:00",
    intervaloTurnosMinutos: 30
  },

  // Equipo Profesional Multidisciplinario
  equipo: [
    {
      id: "prof-1",
      nombre: "Valeria Benítez",
      titulo: "Directora Creativa & Master Colorist",
      especialidad: "Balayage, Colorimetría de Vanguardia y Visagismo",
      experiencia: "12 Años de Trayectoria",
      descripcion: "Líder del equipo técnico de Aura Studio. Especialista en visagismo y diseño de iluminación europea a mano alzada. Su pasión es crear tonalidades armoniosas que realcen las facciones y cuiden la salud del cabello.",
      imagen: "assets/images/equipo_valeria.jpg",
      diasLaborales: [2, 3, 4, 5, 6],
      horarioInicio: "09:00",
      horarioFin: "19:00",
      activo: true
    },
    {
      id: "prof-2",
      nombre: "Lucas Morales",
      titulo: "Estilista Senior & Diseñador de Cortes",
      especialidad: "Cortes de Autor, Visagismo y Texturizado",
      experiencia: "9 Años de Trayectoria",
      descripcion: "Especialista en cortes vanguardistas adaptados a la morfología facial y estilo de vida. Experto en técnicas de corte en seco y peinado de alta durabilidad.",
      imagen: "assets/images/equipo_lucas.jpg",
      diasLaborales: [2, 3, 4, 5, 6],
      horarioInicio: "09:00",
      horarioFin: "19:00",
      activo: true
    },
    {
      id: "prof-3",
      nombre: "Sofía Carrizo",
      titulo: "Especialista en Rubios & Babylights",
      especialidad: "Microiluminación, Babylights y Tonos Fríos",
      experiencia: "7 Años de Trayectoria",
      descripcion: "Dedicada a la creación de rubios luminosos y dimensionales. Trabaja con fórmulas orgánicas y protectores de enlaces capilares para un rubio radiante y sin daño.",
      imagen: "assets/images/equipo_sofia.jpg",
      diasLaborales: [2, 3, 4, 5, 6],
      horarioInicio: "09:00",
      horarioFin: "19:00",
      activo: true
    },
    {
      id: "prof-4",
      nombre: "Camila Navarro",
      titulo: "Terapeuta Capilar & Peinados de Gala",
      especialidad: "Alisados Láser 6D, Botox Capilar y Peinados de Novia",
      experiencia: "6 Años de Trayectoria",
      descripcion: "Especializada en salud capilar intensiva, alineación de fibra y peinados sofisticados para eventos, quinceañeras y celebraciones especiales.",
      imagen: "assets/images/equipo_camila.jpg",
      diasLaborales: [2, 3, 4, 5, 6],
      horarioInicio: "09:00",
      horarioFin: "19:00",
      activo: true
    }
  ],

  // Profesional por defecto para el flujo de reservas
  profesional: {
    id: "prof-1",
    nombre: "Valeria Benítez",
    titulo: "Directora Creativa & Master Colorist",
    especialidad: "Coloración, Balayage, Alisados y Peinados",
    experiencia: "+12 Años de Trayectoria",
    descripcion: "Especialista en colorimetría avanzada, diseño de iluminación personalizada, alisados de alto brillo y tratamientos restauradores.",
    avatar: "assets/images/equipo_valeria.jpg",
    diasLaborales: [2, 3, 4, 5, 6],
    horarioInicio: "09:00",
    horarioFin: "19:00",
    activo: true
  },

  // Catálogo Oficial de Servicios
  servicios: [
    {
      id: "srv-1",
      nombre: "Alisado Láser 6D",
      categoria: "Alisados",
      descripcion: "Técnica avanzada de alisado y disciplina capilar. Incluye tratamiento termoactivo, sellado de la fibra, reducción del frizz y acabado ultra liso con brillo intenso.",
      precio: 150000,
      precioTexto: "$150.000 a $180.000",
      duracionMinutos: 150,
      imagen: "assets/images/alisado_6d.webp",
      destacado: true,
      activo: true
    },
    {
      id: "srv-2",
      nombre: "Mechas Balayage",
      categoria: "Iluminación",
      descripcion: "Técnica francesa de iluminación degradada a mano alzada. Incluye matización personalizada, baño de luz gloss, tratamiento nutritivo y peinado con ondas.",
      precio: 95000,
      precioTexto: "$95.000",
      duracionMinutos: 180,
      imagen: "assets/images/mechas_balayage_2.png",
      destacado: true,
      activo: true
    },
    {
      id: "srv-3",
      nombre: "Mechas Localizadas",
      categoria: "Iluminación",
      descripcion: "Técnica de iluminación estratégica para realzar zonas específicas del cabello y potenciar los rasgos del rostro. Incluye aclaración personalizada, matización tonal, tratamiento nutritivo y peinado.",
      precio: 85000,
      precioTexto: "$85.000",
      duracionMinutos: 120,
      imagen: "assets/images/mechas_localizadas_2.png",
      destacado: true,
      activo: true
    },
    {
      id: "srv-4",
      nombre: "Mechas Babylight",
      categoria: "Iluminación",
      descripcion: "Técnica de iluminación ultrafina inspirada en los reflejos naturales del cabello. Incluye aclaración delicada, matización personalizada, baño de luz gloss, tratamiento nutritivo y peinado.",
      precio: 88000,
      precioTexto: "$88.000",
      duracionMinutos: 150,
      imagen: "assets/images/mechas_babylight_2.jpg",
      destacado: true,
      activo: true
    },
    {
      id: "srv-5",
      nombre: "Peinados para Eventos",
      categoria: "Peinados",
      descripcion: "Peinados personalizados para quinceañeras, bodas, fiestas, celebraciones y ocasiones especiales. Diseños pensados para complementar el estilo, el vestido y la personalidad de cada clienta.",
      detalles: [
        "Ondas y peinados sueltos",
        "Recogidos elegantes",
        "Semi recogidos",
        "Peinados para 15 años",
        "Peinados para fiestas",
        "Peinados para novias",
        "Peinados con trenzas"
      ],
      precio: 48000,
      precioTexto: "$48.000",
      duracionMinutos: 60,
      imagen: "assets/images/peinados_1.jpeg",
      destacado: true,
      activo: true
    }
  ],

  // Información de la Academia & Cursos
  curso: {
    id: "cur-1",
    nombre: "CURSO COMPLETO DE PELUQUERÍA PROFESIONAL",
    tag: "✨ ¡INSCRIPCIONES ABIERTAS!",
    inicio: "10 de julio",
    lugar: "Aura Studio • Av. San Martín 450",
    modalidad: "Presencial. Curso completo y 100% práctico.",
    duracion: "5 meses",
    clases: "1 vez por semana",
    formacion: "Teoría y práctica profesional con equipo docente",
    inversion: 350000,
    inversionTexto: "$350.000 por mes",
    certificacion: "Al finalizar el curso se entregará un certificado profesional.",
    descripcion: "Capacitación intensiva impartida por el equipo docente de Aura Studio. Desarrolla las técnicas de color, iluminación, alisados y diagnóstico capilar con mayor demanda en el mercado profesional.",
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

  // Galería de Trabajos Reales
  galeria: [
    {
      id: "gal-1",
      titulo: "Mechas Balayage Miel & Golden Gloss",
      categoria: "coloracion",
      categoriaNombre: "Coloración",
      imagen: "assets/images/mechas_balayage_3.webp",
      descripcion: "Degradé suave a mano alzada con matices cálidos y acabado luminoso."
    },
    {
      id: "gal-2",
      titulo: "Alisado Láser 6D & Tratamiento Espejo",
      categoria: "alisados",
      categoriaNombre: "Alisados",
      imagen: "assets/images/alisado_6d_3.jpeg",
      descripcion: "Alineación capilar termoactiva con sedosidad y cero encrespamiento."
    },
    {
      id: "gal-3",
      titulo: "Corte y Perfilado de Puntas",
      categoria: "corte",
      categoriaNombre: "Corte",
      imagen: "assets/images/cortes_1.webp",
      descripcion: "Definición de capas y movimiento con sellado cuticular."
    },
    {
      id: "gal-4",
      titulo: "Semirrecogido Trenzado para Eventos",
      categoria: "peinados",
      categoriaNombre: "Peinados",
      imagen: "assets/images/peinados_2.jpeg",
      descripcion: "Diseño bohemio y sofisticado para quinceañeras y fiestas."
    },
    {
      id: "gal-5",
      titulo: "Rubio Ceniza Platinado & Matización",
      categoria: "coloracion",
      categoriaNombre: "Coloración",
      imagen: "assets/images/mechas_localizadas_3.webp",
      descripcion: "Aclaración precisa y matización fría personalizada."
    },
    {
      id: "gal-6",
      titulo: "Balayage Caramelo & Contorno Frontal",
      categoria: "coloracion",
      categoriaNombre: "Coloración",
      imagen: "assets/images/mechas_balayage.webp",
      descripcion: "Degradado cálido en base castaña con ondas naturales."
    },
    {
      id: "gal-7",
      titulo: "Recogido de Gala para Novias y Fiestas",
      categoria: "peinados",
      categoriaNombre: "Peinados",
      imagen: "assets/images/peinados_3.jpeg",
      descripcion: "Peinado de alta costura con fijación duradera y acabado brillante."
    },
    {
      id: "gal-8",
      titulo: "Sellado Térmico Láser 6D",
      categoria: "alisados",
      categoriaNombre: "Alisados",
      imagen: "assets/images/Alisado_6d_2 (2).jpeg",
      descripcion: "Tratamiento termoactivo con brillo espejo y nutrición profunda."
    }
  ],

  // Turnos Iniciales Simulados
  turnos: [
    {
      id: "trn-1001",
      servicioId: "srv-2",
      servicioNombre: "Mechas Balayage",
      profesionalId: "prof-1",
      profesionalNombre: "Valeria Benítez",
      fecha: new Date().toISOString().split("T")[0],
      hora: "10:00",
      duracionMinutos: 180,
      precio: 95000,
      estado: "Confirmado",
      cliente: {
        nombre: "Camila",
        apellido: "Fernández",
        telefono: "+54 9 11 4555-8899",
        email: "camila.fernandez@gmail.com",
        notas: "Quiere tonos beige manteca"
      },
      creadoEn: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      id: "trn-1002",
      servicioId: "srv-4",
      servicioNombre: "Mechas Babylight",
      profesionalId: "prof-3",
      profesionalNombre: "Sofía Carrizo",
      fecha: new Date().toISOString().split("T")[0],
      hora: "15:00",
      duracionMinutos: 150,
      precio: 88000,
      estado: "Pendiente",
      cliente: {
        nombre: "Luciana",
        apellido: "García",
        telefono: "+54 9 11 4777-2233",
        email: "luciana.garcia@outlook.com",
        notas: "Primera vez en el salón"
      },
      creadoEn: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: "trn-1003",
      servicioId: "srv-1",
      servicioNombre: "Alisado Láser 6D",
      profesionalId: "prof-4",
      profesionalNombre: "Camila Navarro",
      fecha: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      hora: "11:00",
      duracionMinutos: 150,
      precio: 150000,
      estado: "Confirmado",
      cliente: {
        nombre: "Valentina",
        apellido: "Rossi",
        telefono: "+54 9 11 4444-9988",
        email: "valen.rossi@yahoo.com",
        notas: "Cabello largo y con volumen"
      },
      creadoEn: new Date().toISOString()
    },
    {
      id: "trn-1004",
      servicioId: "srv-3",
      servicioNombre: "Mechas Localizadas",
      profesionalId: "prof-2",
      profesionalNombre: "Lucas Morales",
      fecha: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      hora: "16:00",
      duracionMinutos: 120,
      precio: 85000,
      estado: "Completado",
      cliente: {
        nombre: "Martina",
        apellido: "Suárez",
        telefono: "+54 9 11 4666-7788",
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
      telefono: "+54 9 11 4233-4455",
      email: "flor.mendez@gmail.com",
      fecha: new Date(Date.now() - 86400000 * 4).toISOString(),
      estado: "Inscripto"
    },
    {
      id: "ins-2002",
      cursoId: "cur-1",
      nombre: "Agustina",
      apellido: "Pérez",
      telefono: "+54 9 11 4899-0011",
      email: "agus.perez@hotmail.com",
      fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
      estado: "Contactado"
    },
    {
      id: "ins-2003",
      cursoId: "cur-1",
      nombre: "Micaela",
      apellido: "Romero",
      telefono: "+54 9 11 4788-9900",
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
