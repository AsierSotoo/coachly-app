export type ChangeEntry = {
  version: string
  date: string
  title: string
  changes: { icon: string; text: string; detail?: string }[]
}

export const CHANGELOG: ChangeEntry[] = [
  {
    version: 'v25',
    date: '24 agosto 2025',
    title: 'Disponibilidad por enlace mágico',
    changes: [
      {
        icon: 'event_available',
        text: 'Enlace mágico de disponibilidad por partido',
        detail: 'Activa la función en Ajustes del equipo. Se genera un enlace público único por partido: cópialo y pégalo en el grupo de WhatsApp. Las jugadoras abren el enlace, pulsan su nombre y confirman si van (✓), tienen duda (?) o no pueden (✗), sin necesitar cuenta.',
      },
      {
        icon: 'dashboard',
        text: 'Nueva sección Disponibilidad en el menú',
        detail: 'Accede desde el menú lateral (escritorio) o la barra inferior (móvil). Muestra los próximos y últimos partidos con el recuento de respuestas en tiempo real y el botón de compartir enlace.',
      },
    ],
  },
  {
    version: 'v24',
    date: '24 agosto 2025',
    title: 'Gráficos con fuente de datos correcta',
    changes: [
      {
        icon: 'show_chart',
        text: 'Evolución de puntos: solo Liga',
        detail: 'El gráfico de evolución de puntos ahora usa exclusivamente partidos de Liga, independientemente del filtro de competición activo. Los amistosos y copa no dan puntos clasificatorios, por lo que no distorsionan el acumulado.',
      },
      {
        icon: 'emoji_events',
        text: 'Carrera goleadora: Liga + Copa',
        detail: 'El gráfico de carrera goleadora usa Liga y Copa (sin amistosos). Los goles en amistosos no cuentan en la clasificación competitiva. Se añade una etiqueta discreta en cada gráfico que indica su fuente de datos.',
      },
    ],
  },
  {
    version: 'v23',
    date: '24 agosto 2025',
    title: 'Once inicial, puntos de liga y análisis post-partido',
    changes: [
      {
        icon: 'sports_soccer',
        text: 'Formación visual del once inicial',
        detail: 'Tras registrar las apariciones de un partido, la ficha muestra el once inicial en un campo de fútbol agrupado por líneas (Delantera / Centrocampistas / Defensa / Portera). Se marcan con estrella el MVP y con iconos los goleadores y amonestados. Los suplentes aparecen debajo del campo.',
      },
      {
        icon: 'emoji_events',
        text: 'Puntos de Liga en el espejo de estadísticas',
        detail: 'El espejo ahora muestra los puntos acumulados en Liga (3 por victoria, 1 por empate) como un badge justo bajo el donut, siempre visible independientemente del filtro de competición activo.',
      },
      {
        icon: 'rate_review',
        text: 'Análisis post-partido visible en la ficha',
        detail: 'Si rellenaste el campo de notas al registrar el partido, el texto aparece ahora en la ficha del partido justo después del resumen de goles y tarjetas, sin necesidad de entrar al formulario.',
      },
      {
        icon: 'star',
        text: 'Valoración media por temporada en la ficha de jugadora',
        detail: 'La tabla de estadísticas por temporada muestra ahora la valoración media del entrenador para esa temporada concreta, además del promedio global ya existente.',
      },
    ],
  },
  {
    version: 'v22',
    date: '23 agosto 2025',
    title: 'Filtros por competición y valoración en ficha',
    changes: [
      {
        icon: 'filter_list',
        text: 'Filtro por tipo de competición en la lista de partidos',
        detail: 'Si tienes partidos de Liga, Copa y Amistosos mezclados, aparecen chips de filtro (Liga / Copa / Amistoso) sobre la lista de resultados. Se combinan con el filtro de resultado (V/E/D) y el buscador de rival.',
      },
      {
        icon: 'analytics',
        text: 'Espejo de estadísticas filtrado por competición',
        detail: 'Si registras partidos de Copa además de Liga, aparecen chips en la página de estadísticas para ver los datos de Liga, Copa o todos los competitivos por separado. Los amistosos nunca aparecen en el espejo.',
      },
      {
        icon: 'star',
        text: 'Valoración media en la ficha de jugadora',
        detail: 'La ficha individual de cada jugadora muestra ahora la valoración media del entrenador (escala 1-5 estrellas) calculada de todos los partidos en que se le dio nota.',
      },
    ],
  },
  {
    version: 'v21',
    date: '23 agosto 2025',
    title: 'Tipos de partido: Liga, Copa y Amistoso',
    changes: [
      {
        icon: 'emoji_events',
        text: 'Clasifica cada partido: Liga, Copa o Amistoso',
        detail: 'Al crear o editar un partido puedes indicar si es de Liga, Copa o Amistoso. Los amistosos aparecen en la lista con una etiqueta gris y no cuentan en ninguna estadística. Los de Copa cuentan en victorias/empates/derrotas pero no suman puntos. Los puntos de clasificación (3 × V + E) solo se calculan de los partidos de Liga.',
      },
    ],
  },
  {
    version: 'v20',
    date: '23 agosto 2025',
    title: 'Pulido: scroll, hover y microinteracciones',
    changes: [
      {
        icon: 'keyboard_arrow_up',
        text: 'Botón de volver arriba',
        detail: 'Al hacer scroll hacia abajo más de 360px aparece un botón flotante en la esquina inferior derecha para volver al inicio de la página con un scroll suave. Muy útil en la temporada con muchos partidos o la ficha con muchas jugadoras.',
      },
      {
        icon: 'touch_app',
        text: 'Microinteracciones mejoradas',
        detail: 'Los ítems de la navegación móvil y los botones de acción tienen ahora una animación de pulsación (escala) para dar feedback visual inmediato al tocar. El sidebar desktop muestra ahora un hover sutil en los ítems inactivos.',
      },
    ],
  },
  {
    version: 'v19',
    date: '23 agosto 2025',
    title: 'Próximo partido en el dashboard + colores semánticos',
    changes: [
      {
        icon: 'sports_soccer',
        text: 'Próximo partido visible en el dashboard',
        detail: 'En la tarjeta de cada equipo del dashboard aparece ahora el próximo partido programado: rival y fecha. Es un enlace directo a la ficha del partido para poder marcar la disponibilidad o finalizar el resultado rápidamente.',
      },
      {
        icon: 'palette',
        text: 'Colores semánticos: victoria verde, empate ámbar, derrota roja',
        detail: 'Ahora los resultados siguen un código de color consistente en toda la app: victoria en verde, empate en ámbar/amarillo y derrota en rojo. Afecta a las burbujas de forma reciente, los filtros de resultado, los gráficos de estadísticas, los marcadores de partido y los contadores de temporada.',
      },
    ],
  },
  {
    version: 'v18',
    date: '23 agosto 2025',
    title: 'Disponibilidad de jugadoras por partido',
    changes: [
      {
        icon: 'how_to_reg',
        text: 'Marca quién está disponible antes del partido',
        detail: 'En la ficha de cada partido programado aparece ahora una sección "Disponibilidad". Para cada jugadora puedes marcar si está ✓ Disponible, ? Duda o ✗ No disponible. Se guarda al instante, sin necesidad de pulsar guardar. En la lista de próximos partidos se muestran los contadores de disponibilidad de un vistazo.',
      },
    ],
  },
  {
    version: 'v17',
    date: '23 agosto 2025',
    title: 'Análisis post-partido y valoraciones',
    changes: [
      {
        icon: 'edit_note',
        text: 'Análisis post-partido del entrenador',
        detail: 'En la ficha de cada partido hay ahora un campo de texto libre para que el entrenador anote sus observaciones: formación usada, qué funcionó, qué mejorar, momentos clave. Es privado, solo lo ve el entrenador. Se guarda junto con el resto de estadísticas.',
      },
      {
        icon: 'grade',
        text: 'Valoración por jugadora (1-5 estrellas)',
        detail: 'Al registrar un partido puedes dar una valoración de 1 a 5 estrellas a cada jugadora. Es opcional y rápido — solo toca las estrellas. Al final de temporada aparece un nuevo ranking "Valoración ★" en las estadísticas con la media de cada jugadora.',
      },
    ],
  },
  {
    version: 'v16',
    date: '22 agosto 2025',
    title: 'Convocatoria con hora y lugar + borrar partidos',
    changes: [
      {
        icon: 'schedule',
        text: 'Hora de convocatoria y lugar en la convocatoria',
        detail: 'En la página de cada convocatoria puedes rellenar la hora a la que se cita a las jugadoras y el lugar de concentración. Estos datos aparecen en la hoja impresa y en el texto que se copia para WhatsApp.',
      },
      {
        icon: 'delete',
        text: 'Borrar partidos programados ya funciona',
        detail: 'Los partidos que estaban en estado "Programado" no tenían botón de borrar. Ahora el botón de eliminar aparece directamente en la ficha de cualquier partido, ya sea programado o finalizado.',
      },
    ],
  },
  {
    version: 'v15',
    date: '21 agosto 2025',
    title: 'Calendario de partidos',
    changes: [
      {
        icon: 'calendar_month',
        text: 'Añade partidos antes de jugarlos',
        detail: 'Ya puedes programar todos los partidos de la temporada desde el principio. Los partidos programados aparecen en un calendario y no cuentan en las estadísticas. Cuando acabe un partido, entra en él y pulsa "Finalizar partido" para registrar el resultado y las estadísticas.',
      },
      {
        icon: 'view_month',
        text: 'Página de calendario en la navegación',
        detail: 'El calendario ahora tiene su propia sección en el menú lateral y en la barra de navegación del móvil. Muestra partidos y entrenamientos del mes en un mismo sitio, con navegación por meses.',
      },
    ],
  },
  {
    version: 'v14',
    date: '16 agosto 2025',
    title: 'Posición en la liga',
    changes: [
      {
        icon: 'leaderboard',
        text: 'Posición en la clasificación de liga',
        detail: 'En la página de cada temporada aparece ahora un campo para anotar la posición de tu equipo en la clasificación. Pon el número de posición y el total de equipos (por ejemplo "3 de 12") y se mostrará como un badge verde. Lo actualizas tú manualmente tras cada jornada.',
      },
    ],
  },
  {
    version: 'v13',
    date: '16 agosto 2025',
    title: '¡Gran tanda de mejoras!',
    changes: [
      {
        icon: 'calculate',
        text: 'Goles del equipo calculados automáticamente',
        detail: 'Ya no hace falta introducir el marcador a mano. Cuando registras goles por jugadora, el número en el marcador se actualiza en tiempo real mientras rellenas el formulario y se guarda automáticamente al enviar. El marcador rival sigue siendo manual.',
      },
      {
        icon: 'install_mobile',
        text: 'Instala Coachly en tu móvil como una app',
        detail: 'Coachly ahora se puede instalar en la pantalla de inicio de tu teléfono. En Android aparecerá un botón "Instalar" en la cabecera y en el perfil. En iPhone, usa Safari → Compartir → Añadir a pantalla de inicio. Una vez instalada, se abre sin barras del navegador como una app nativa.',
      },
      {
        icon: 'sort',
        text: 'Tabla de rendimiento ordenable por cualquier columna',
        detail: 'En las estadísticas de temporada, la tabla de rendimiento ahora tiene cabeceras clicables. Pulsa en PJ, Min\', G, G/90, A, G+A, tarjetas para ordenar al instante. Pulsa de nuevo para invertir el orden. Los nombres son enlaces directos a la ficha de cada jugadora.',
      },
      {
        icon: 'filter_list',
        text: 'Filtro por resultado en la lista de partidos',
        detail: 'En la página de temporada, encima de la lista de partidos hay chips para filtrar por Victoria, Empate o Derrota. Así puedes ver de un vistazo todos los partidos que has ganado o perdido sin buscar uno a uno.',
      },
      {
        icon: 'local_fire_department',
        text: 'Racha actual del equipo visible en temporada y dashboard',
        detail: 'Cuando el equipo lleva 2 o más resultados consecutivos del mismo tipo, aparece un chip junto a la racha reciente indicando "3 victorias seguidas", "2 derrotas seguidas", etc. También se muestra en las tarjetas del dashboard cuando hay 3 o más.',
      },
      {
        icon: 'share',
        text: 'Compartir imagen de resultado con el botón nativo del móvil',
        detail: 'Al pulsar "Compartir resultado" en la ficha de un partido, si tu móvil lo soporta (Android Chrome, iOS Safari) se abre el menú nativo de compartir para enviar la imagen directamente por WhatsApp, Telegram o donde quieras. Si no, se descarga como siempre.',
      },
    ],
  },
  {
    version: 'v12',
    date: '16 agosto 2025',
    title: 'Convocatorias y estadísticas completas',
    changes: [
      {
        icon: 'groups',
        text: 'Convocatorias: gestiona el roster antes del partido',
        detail: 'En la página de cada temporada hay un nuevo botón "Convocatorias". Desde ahí puedes crear la lista de convocadas para cada partido, marcando quién es titular, quién va convocada y quién no. La lista se refleja en el formulario del partido y ordena automáticamente a las jugadoras.',
      },
      {
        icon: 'table_chart',
        text: 'Tabla completa de rendimiento con Goles/90 min',
        detail: 'En las estadísticas de temporada aparece ahora una tabla con todas las jugadoras: PJ, minutos, goles, goles por 90 minutos, asistencias, G+A y tarjetas. La columna G/90 permite comparar la eficiencia real sin importar los minutos jugados.',
      },
      {
        icon: 'share',
        text: 'Tarjeta de resultado compartible por WhatsApp',
        detail: 'En la ficha de cada partido, cuando hay goles o datos registrados, aparece una sección "Compartir resultado". Genera una imagen con el marcador, goleadoras y MVP lista para guardar y enviar por WhatsApp al equipo o a la familia.',
      },
    ],
  },
  {
    version: 'v11',
    date: '16 agosto 2025',
    title: '¡Nueva tanda de mejoras!',
    changes: [
      {
        icon: 'moving',
        text: 'Carrera goleadora: gráfico de líneas con las top 5 goleadoras',
        detail: 'En las estadísticas de temporada hay un nuevo gráfico que muestra cómo cada una de las 5 máximas goleadoras ha ido acumulando goles partido a partido. Pasa el dedo o el ratón por encima para ver el detalle.',
      },
      {
        icon: 'filter_list',
        text: 'Filtro por posición en la plantilla',
        detail: 'En la pantalla de Plantilla puedes filtrar las jugadoras por posición (Portera, Defensa, Centrocampista, Delantera) además de ordenarlas. Los filtros solo aparecen si hay jugadoras en esa posición.',
      },
      {
        icon: 'history',
        text: 'Historial global del equipo en Ajustes',
        detail: 'En la página de Ajustes del equipo aparece ahora un resumen de toda la historia: partidos totales, victorias, puntos acumulados, diferencia de goles y el desglose por temporadas con un enlace directo a cada una.',
      },
      {
        icon: 'sports_score',
        text: 'Puntos acumulados visibles en el dashboard',
        detail: 'La tarjeta de cada equipo en el dashboard ahora muestra los puntos totales de la temporada activa (3 por victoria, 1 por empate) en un badge verde, junto con los goles a favor y en contra.',
      },
    ],
  },
  {
    version: 'v10',
    date: '15 agosto 2025',
    title: '¡Muchas novedades!',
    changes: [
      {
        icon: 'leaderboard',
        text: 'Tu posición en la plantilla: ¿1ª goleadora? ¿2ª en minutos?',
        detail: 'En la ficha de cada jugadora aparece su ranking dentro del equipo para la temporada actual: posición en goles, asistencias y minutos. Las tres primeras posiciones salen con 🥇🥈🥉.',
      },
      {
        icon: 'trending_up',
        text: 'Racha reciente de cada jugadora — últimos 5 partidos de un vistazo',
        detail: 'Debajo del ranking verás cinco burbujas: verde con ⚽ si marcó, azul si jugó sin gol, gris si no jugó. Si hubo tarjeta aparece un cuadradito amarillo o rojo debajo.',
      },
      {
        icon: 'arrow_forward',
        text: 'Navegar entre jugadoras con las flechas ← →',
        detail: 'En la ficha de una jugadora aparecen flechas arriba a la derecha para pasar a la anterior o siguiente sin volver a la lista. Muestra "3/15" para saber dónde estás.',
      },
      {
        icon: 'style',
        text: 'Historial de tarjetas por jugadora: cuándo y contra quién',
        detail: 'Al final de la ficha de cada jugadora, si tiene tarjetas, aparece una lista cronológica con la fecha, el rival y las tarjetas de ese partido. Muy útil para seguir las sanciones.',
      },
      {
        icon: 'download',
        text: 'Exportar estadísticas a CSV para Excel o WhatsApp',
        detail: 'En la pantalla de estadísticas de la temporada hay un botón "CSV" junto al de compartir. Descarga un archivo con todos los datos (PJ, goles, asistencias, minutos, tarjetas) que se abre directamente en Excel.',
      },
    ],
  },
  {
    version: 'v9',
    date: '15 agosto 2025',
    title: '¡Novidades en la app!',
    changes: [
      {
        icon: 'sports_soccer',
        text: 'Los goleadores de cada partido aparecen en la lista de resultados',
        detail: 'En la pantalla de Resultados de la temporada, debajo del nombre del rival verás en verde quién marcó. Si alguien metió más de uno aparece como "María ×2". Solo sale cuando el partido tiene estadísticas registradas.',
      },
      {
        icon: 'sort',
        text: 'Puedes ordenar la plantilla por Goles, Asistencias o Partidos jugados',
        detail: 'En la pantalla de Plantilla, encima de las tarjetas hay cuatro botones: Dorsal (orden por defecto), Goles, Asist. y PJ. Pulsa cualquiera y las tarjetas se reordenan al instante sin recargar la página.',
      },
      {
        icon: 'summarize',
        text: 'La ficha de cada partido muestra un resumen: goles, tarjetas y jugadora del partido',
        detail: 'Al abrir un partido que ya tiene datos, verás una barra resumen antes del formulario de edición: quién marcó (⚽), quién vio tarjeta amarilla o roja, y la jugadora del partido (⭐) si la elegiste.',
      },
      {
        icon: 'star',
        text: 'La "Jugadora del partido" ya guarda correctamente',
        detail: 'Tras actualizar la base de datos, el selector de Jugadora del partido en la ficha ya guarda y persiste. La MVP elegida aparece en el ranking de estadísticas de la temporada y en el perfil individual de la jugadora.',
      },
    ],
  },
  {
    version: 'v8',
    date: '2 agosto 2025',
    title: 'Correcciones y mejoras',
    changes: [
      {
        icon: 'delete',
        text: 'Arreglado: borrar jugadora y borrar entrenamiento ya funcionan correctamente',
        detail: 'Había un fallo técnico que hacía que el botón de borrar preguntara la confirmación pero no borrara nada. Ya está corregido: al confirmar, se elimina de verdad.',
      },
      {
        icon: 'search',
        text: 'Buscador de jugadoras en la plantilla ahora es visible',
        detail: 'El buscador existía en el código pero no se mostraba en pantalla. Ahora aparece en la cabecera de la plantilla para filtrar por nombre o dorsal.',
      },
      {
        icon: 'arrow_forward',
        text: 'Navegación ← → entre partidos de la temporada',
        detail: 'En la ficha de un partido aparecen flechas arriba a la derecha para ir al anterior o al siguiente sin volver a la lista. También muestra "3/8" para saber en qué posición estás.',
      },
      {
        icon: 'star',
        text: 'Nueva sección "Jugadora del partido" en la ficha de partido',
        detail: 'Puedes elegir qué jugadora fue la mejor del partido. Aparece en el ranking de estadísticas de la temporada como "Del Partido ⭐" y se acumula en el perfil individual de cada jugadora.',
      },
      {
        icon: 'bar_chart',
        text: 'Estadísticas mejoradas: ranking G+A, rendimiento por posición y más',
        detail: 'En las estadísticas de la temporada hay nuevas tarjetas: ranking combinado de Goles+Asistencias, y una sección de Rendimiento por Posición con barras que muestra cuánto aportan las delanteras, centrocampistas, etc.',
      },
      {
        icon: 'warning',
        text: 'Aviso cuando hay partidos sin estadísticas registradas',
        detail: 'En la lista de partidos de la temporada, los partidos sin datos muestran un chip amarillo "Sin datos". Además aparece un aviso en la parte superior indicando cuántos partidos te quedan por rellenar.',
      },
    ],
  },
]

export const CURRENT_VERSION = 'v25'
