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
    telefono: "+54 2920 359074",
    whatsapp: "+54 2920 359074",
    whatsappLink: "https://wa.me/542920359074",
    instagram: "@marian.estilista.bariloche",
    instagramLink: "https://www.instagram.com/marian.estilista.bariloche/",
    email: "Jesusechavarria057@gmail.com",
    experiencia: "+15 Años de Experiencia",
    horariosTexto: "Martes a Sábados de 11:00 a 19:00 hs",
    diasApertura: [2, 3, 4, 5, 6], // Martes (2) a Sábado (6)
    horaApertura: "11:00",
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
    horarioInicio: "11:00",
    horarioFin: "19:00",
    activo: true
  },

  // Catálogo Oficial de Servicios (5 Servicios Exclusivamente Femeninos)
  servicios: [
    {
      id: "srv-1",
      nombre: "Alisado Láser 6D",
      categoria: "Alisados",
      descripcion: "Técnica avanzada de alisado y disciplina capilar. Incluye tratamiento termoactivo, sellado de la fibra, reducción del frizz y acabado ultra liso con brillo intenso. El valor depende del largo, volumen y cantidad de cabello.",
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
      descripcion: "Iluminación personalizada con efecto degradado y luminoso, diseñada para aportar dimensión, movimiento y un resultado natural y sofisticado. Ideal para renovar tu look y realzar la belleza del cabello. El valor depende del largo, volumen y cantidad de cabello.",
      precio: 150000,
      precioTexto: "$150.000 a $180.000",
      duracionMinutos: 180,
      imagen: "assets/images/mechas_balayage_2.webp",
      destacado: true,
      activo: true
    },
    {
      id: "srv-3",
      nombre: "Mechas Localizadas",
      categoria: "Iluminación",
      descripcion: "Técnica personalizada que aporta luminosidad y dimensión en zonas estratégicas del cabello, resaltando las facciones del rostro. Ideal para lograr un cambio sutil, elegante y natural, adaptado a tu estilo. El valor depende del largo, volumen y cantidad de cabello.",
      precio: 150000,
      precioTexto: "$150.000 a $180.000",
      duracionMinutos: 120,
      imagen: "assets/images/mechas_localizadas_2.webp",
      destacado: true,
      activo: true
    },
    {
      id: "srv-4",
      nombre: "Mechas Babylight",
      categoria: "Iluminación",
      descripcion: "Mechas finas y personalizadas que crean una iluminación natural, delicada y luminosa. Aportan brillo, dimensión y un look moderno y sofisticado, logrando un efecto sutil inspirado en los reflejos naturales del cabello. El valor depende del largo, volumen y cantidad de cabello.",
      precio: 150000,
      precioTexto: "$150.000 a $180.000",
      duracionMinutos: 150,
      imagen: "assets/images/mechas_babylight_2.webp",
      destacado: true,
      activo: true
    },
    {
      id: "srv-5",
      nombre: "Peinados para Eventos",
      categoria: "Peinados",
      descripcion: "Peinados personalizados para quinceañeras, bodas y ocasiones especiales. Diseños pensados para que luzcas increíble en cada momento importante, adaptados a tu estilo, personalidad y ocasión.",
      detalles: [
        { nombre: "Ondas / Brushing con ondas", precio: 30000, precioTexto: "$30.000", imagen: "assets/images/peinados/peinado_ondas.jpg" },
        { nombre: "Semirrecogido", precio: 40000, precioTexto: "$40.000", imagen: "assets/images/peinados/peinado_semirrecogido.jpg" },
        { nombre: "Recogido", precio: 50000, precioTexto: "$50.000", imagen: "assets/images/peinados/peinado_recogido.jpg" },
        { nombre: "Peinado social / fiesta", precio: 55000, precioTexto: "$55.000", imagen: "assets/images/peinados/peinado_social.jpg" },
        { nombre: "Peinado 15 años", precio: 65000, precioTexto: "$65.000", imagen: "assets/images/peinados/peinado_15anos.jpg" },
        { nombre: "Peinado de novia", precio: 80000, precioTexto: "Desde $80.000", imagen: "assets/images/peinados/peinado_novia.jpg" },
        { nombre: "Prueba de peinado", precio: 35000, precioTexto: "$35.000", imagen: "assets/images/peinados/peinado_prueba.jpg" }
      ],
      precio: 30000,
      precioTexto: "Desde $30.000",
      duracionMinutos: 60,
      imagen: "assets/images/peinados_1.webp",
      destacado: false,
      activo: false
    },
    {
      id: "srv-16",
      nombre: "Ondas / Brushing con ondas",
      categoria: "Peinados",
      descripcion: "Brushing con ondas suaves y definidas para lograr un acabado elegante, natural y con movimiento. Ideal para eventos, celebraciones o para darle un toque especial a tu look.",
      precio: 30000,
      precioTexto: "$30.000",
      duracionMinutos: 60,
      imagen: "assets/images/peinados/peinado_ondas.jpg",
      destacado: true,
      activo: true
    },
    {
      id: "srv-17",
      nombre: "Semirrecogido",
      categoria: "Peinados",
      descripcion: "Peinado elegante que combina el cabello suelto con secciones recogidas. Una opción versátil y delicada para eventos, fiestas y celebraciones especiales.",
      precio: 40000,
      precioTexto: "$40.000",
      duracionMinutos: 60,
      imagen: "assets/images/peinados/peinado_semirrecogido.jpg",
      destacado: true,
      activo: true
    },
    {
      id: "srv-18",
      nombre: "Recogido",
      categoria: "Peinados",
      descripcion: "Peinado completamente recogido, diseñado para lograr un look sofisticado y duradero. Ideal para eventos formales y ocasiones especiales.",
      precio: 50000,
      precioTexto: "$50.000",
      duracionMinutos: 60,
      imagen: "assets/images/peinados/peinado_recogido.jpg",
      destacado: true,
      activo: true
    },
    {
      id: "srv-19",
      nombre: "Peinado social / fiesta",
      categoria: "Peinados",
      descripcion: "Peinado personalizado para fiestas y eventos, adaptado al estilo, vestido y ocasión de cada clienta. Incluye una propuesta elegante y cuidada hasta el último detalle.",
      precio: 55000,
      precioTexto: "$55.000",
      duracionMinutos: 60,
      imagen: "assets/images/peinados/peinado_social.jpg",
      destacado: true,
      activo: true
    },
    {
      id: "srv-20",
      nombre: "Peinado 15 años",
      categoria: "Peinados",
      descripcion: "Peinado especialmente diseñado para celebraciones de 15 años, buscando un resultado elegante, juvenil y acorde al estilo elegido para una ocasión única.",
      precio: 65000,
      precioTexto: "$65.000",
      duracionMinutos: 90,
      imagen: "assets/images/peinados/peinado_15anos.jpg",
      destacado: true,
      activo: true
    },
    {
      id: "srv-21",
      nombre: "Peinado de novia",
      categoria: "Peinados",
      descripcion: "Peinado personalizado para novias, diseñado de acuerdo con el vestido, accesorios, estilo de la celebración y preferencias de cada clienta. El precio es desde $80.000 y puede variar según la complejidad del trabajo.",
      precio: 80000,
      precioTexto: "Desde $80.000",
      duracionMinutos: 90,
      imagen: "assets/images/peinados/peinado_novia.jpg",
      destacado: true,
      activo: true
    },
    {
      id: "srv-22",
      nombre: "Prueba de peinado",
      categoria: "Peinados",
      descripcion: "Prueba previa para definir y ajustar el peinado elegido antes del evento. Permite evaluar el estilo, volumen, accesorios y terminación para llegar al día especial con todo definido.",
      precio: 35000,
      precioTexto: "$35.000",
      duracionMinutos: 60,
      imagen: "assets/images/peinados/peinado_prueba.jpg",
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
      titulo: "Mechas Balayage Miel & Golden Gloss",
      categoria: "coloracion",
      categoriaNombre: "Coloración",
      imagen: "https://plus.unsplash.com/premium_photo-1669675936132-cd68d8a1ac5f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8QmFsYXlhZ2UlMjBwcm9mZXNpb25hbHxlbnwwfHwwfHx8MA%3D%3D",
      descripcion: "Degradé suave a mano alzada con matices cálidos y acabado luminoso."
    },
    {
      id: "gal-2",
      titulo: "Alisado Láser 6D & Tratamiento Espejo",
      categoria: "alisados",
      categoriaNombre: "Alisados",
      imagen: "assets/images/alisado_6d.webp",
      descripcion: "Alineación capilar termoactiva con sedosidad y cero encrespamiento."
    },
    {
      id: "gal-3",
      titulo: "Corte y Perfilado de Puntas",
      categoria: "corte",
      categoriaNombre: "Corte",
      imagen: "https://plus.unsplash.com/premium_photo-1669675935927-0ed8935e6600?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Y29ydGUlMjBtdWplciUyMHBlbHVxdWVyaWF8ZW58MHx8MHx8fDA%3D",
      descripcion: "Definición de capas y movimiento con sellado cuticular."
    },
    {
      id: "gal-4",
      titulo: "Semirrecogido Trenzado para Eventos",
      categoria: "peinados",
      categoriaNombre: "Peinados",
      imagen: "https://images.unsplash.com/photo-1575287537815-ef82dd922198?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      descripcion: "Diseño bohemio y sofisticado para quinceañeras y fiestas."
    },
    {
      id: "gal-5",
      titulo: "Rubio Ceniza Platinado & Matización",
      categoria: "coloracion",
      categoriaNombre: "Coloración",
      imagen: "https://images.unsplash.com/photo-1554519934-e32b1629d9ee?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8Y29sb3JhY2lvbiUyMHJ1YmlvJTIwY2VuaXphJTIwcGxhdGluYWRvfGVufDB8fDB8fHww",
      descripcion: "Aclaración precisa y matización fría personalizada."
    },
    {
      id: "gal-6",
      titulo: "Balayage Caramelo & Contorno Frontal",
      categoria: "coloracion",
      categoriaNombre: "Coloración",
      imagen: "https://images.unsplash.com/photo-1638064432604-8da1fc75de09?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8QmFsYXlhZ2UlMjBwZWx1cXVlcmlhfGVufDB8fDB8fHww",
      descripcion: "Degradado cálido en base castaña con ondas naturales."
    },
    {
      id: "gal-7",
      titulo: "Recogido de Gala para Novias y Fiestas",
      categoria: "peinados",
      categoriaNombre: "Peinados",
      imagen: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80",
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

  // Turnos Iniciales Simulados (Todos con Mariano en Bariloche)
  turnos: [
    {
      id: "trn-1001",
      servicioId: "srv-2",
      servicioNombre: "Mechas Balayage",
      profesionalId: "prof-1",
      profesionalNombre: "Mariano",
      fecha: new Date().toISOString().split("T")[0],
      hora: "11:00",
      duracionMinutos: 180,
      precio: 150000,
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
      servicioId: "srv-4",
      servicioNombre: "Mechas Babylight",
      profesionalId: "prof-1",
      profesionalNombre: "Mariano",
      fecha: new Date().toISOString().split("T")[0],
      hora: "15:00",
      duracionMinutos: 150,
      precio: 150000,
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
      servicioId: "srv-1",
      servicioNombre: "Alisado Láser 6D",
      profesionalId: "prof-1",
      profesionalNombre: "Mariano",
      fecha: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      hora: "11:00",
      duracionMinutos: 150,
      precio: 150000,
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
      servicioNombre: "Mechas Localizadas",
      profesionalId: "prof-1",
      profesionalNombre: "Mariano",
      fecha: new Date(Date.now() - 86400000).toISOString().split("T")[0],
      hora: "16:00",
      duracionMinutos: 120,
      precio: 150000,
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
