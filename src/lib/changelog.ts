export type ChangeEntry = {
  version: string
  date: string
  title: string
  changes: { icon: string; text: string; detail?: string }[]
}

export const CHANGELOG: ChangeEntry[] = [
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

export const CURRENT_VERSION = 'v12'
