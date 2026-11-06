**Recomendación de IA para Brújula — 6 de noviembre de 2026**

Para el MVP acordado, la búsqueda y los filtros deben funcionar sobre un catálogo previamente curado, aunque no haya una API de IA conectada. La IA puede añadirse como una forma más cómoda de expresar la búsqueda: «quiero un curso gratis de Excel, virtual y en español». El servidor convierte esa intención en filtros y consulta los registros existentes.

**Modelo principal propuesto: GPT-6 Luna (`gpt-6-luna`).** La documentación oficial confirma salidas estructuradas, llamadas a funciones y uso mediante Responses API. Admite desactivar el razonamiento adicional con `reasoning.effort: none`, una opción razonable para clasificar consultas cortas. Su precio Standard publicado es USD 0.10 por millón de tokens de entrada y USD 0.50 por millón de salida. La recomendación es de diseño y costo; su calidad en este catálogo debe comprobarse con consultas de prueba. [Modelo oficial](https://developers.openai.com/api/docs/models/gpt-6-luna), [precios oficiales](https://developers.openai.com/api/docs/pricing).

**Alternativa: Gemini 3.1 Flash-Lite (`gemini-3.1-flash-lite`).** Google lo documenta como un modelo estable para tareas ligeras y extracción de datos, con salidas estructuradas. El precio Standard para texto es USD 0.25 por millón de tokens de entrada y USD 1.50 por millón de salida. No hace falta integrar ambos proveedores en el MVP. [Modelo oficial](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite), [precios oficiales](https://ai.google.dev/gemini-api/docs/pricing#gemini-3.1-flash-lite).

**Cómo encajaría la IA opcional**

1. El usuario escribe una búsqueda en lenguaje natural.
2. El modelo devuelve únicamente filtros permitidos: palabras clave, tipo, modalidad, idioma, costo, ubicación y área de interés. Puede devolver un campo vacío cuando no haya información suficiente.
3. El servidor valida esos filtros y consulta la base de datos. Las restricciones exactas, como «gratis» o «virtual», se aplican con código.
4. La interfaz presenta resultados procedentes del catálogo, con su enlace original y fecha de revisión. El modelo no crea oportunidades, direcciones web ni fechas.
5. Si la API falta, falla o interpreta mal la búsqueda, siguen disponibles el buscador convencional y los filtros editables. Una búsqueda ambigua puede mostrar los filtros interpretados para que el usuario los corrija.

Un único modelo basta para esta función. Para el catálogo inicial tampoco se necesita una base vectorial, entrenamiento propio ni una arquitectura de agentes. Un índice de texto, etiquetas y filtros cubre el comportamiento central; la necesidad de búsqueda semántica puede evaluarse con uso real.

Las salidas estructuradas permiten definir un esquema JSON obligatorio; el servidor debe comprobar además que sus valores pertenecen a las opciones admitidas por la aplicación. [Guía oficial de Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

**Estimación ilustrativa de consumo**

Supuesto: 20 búsquedas con IA por usuario al mes, cada una con 600 tokens de entrada y 150 de salida. Son 12,000 tokens de entrada y 3,000 de salida por usuario. La entrada contiene las opciones de filtro y la consulta, no el catálogo completo. Esta es una estimación de uso, no una medición de la aplicación.

| Modelo | 100 usuarios / mes | 1,000 usuarios / mes |
|---|---:|---:|
| GPT-6 Luna | USD 0.27 | USD 2.70 |
| Gemini 3.1 Flash-Lite | USD 0.75 | USD 7.50 |

Cálculo por usuario para Luna: `12,000 / 1,000,000 × 0.10 + 3,000 / 1,000,000 × 0.50 = USD 0.0027`. Para Gemini: `12,000 / 1,000,000 × 0.25 + 3,000 / 1,000,000 × 1.50 = USD 0.0075`. Se usan las tarifas Standard de texto citadas arriba, sin descuentos ni nivel gratuito.

Los importes cubren solo los tokens supuestos. No incluyen alojamiento, base de datos, impuestos, reintentos, búsquedas externas ni trabajo de curación. Historial largo o razonamiento adicional pueden aumentar el consumo. No se requiere búsqueda web de pago para filtrar un catálogo ya disponible.

**Actualización del catálogo**

Elegir un modelo no mantiene actualizadas las oportunidades automáticamente. Para esta versión propongo un panel de administración con creación, edición, cierre y fecha de última revisión. Un vencimiento conocido permite ocultar o marcar una convocatoria caducada automáticamente; si no se conoce, debe mostrarse «revisar convocatoria» en lugar de afirmar que sigue abierta. La automatización futura se decidiría fuente por fuente, aprovechando feeds o APIs cuando existan y revisando los cambios antes de publicarlos.

**Sostenibilidad que se puede validar después del MVP**

Una hipótesis alineada con la reunión es que el acceso básico del estudiante sea gratuito y una universidad financie un piloto institucional. Antes de fijar precios hay que comprobar interés de una universidad, costo de mantener el catálogo y uso real. El prototipo no necesita implementar cobros para probar su utilidad.

**Estado:** esta nota documenta una recomendación. No se ha autorizado ni configurado una clave, no se ha ejecutado una llamada a una API de IA y no se ha añadido código de integración. El núcleo de la aplicación puede completarse con búsqueda convencional sobre el catálogo curado.
