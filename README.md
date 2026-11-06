# Brújula · Tu próximo paso

MVP web de KindTech con interfaz móvil. En un celular ocupa la pantalla; en escritorio presenta un marco de teléfono. Nombre provisional. No requiere instalar una aplicación.

## Lo que funciona

- Inicio, perfil de tres pasos, objetivo y disponibilidad semanal.
- Catálogo inicial de 14 oportunidades recopiladas de fuentes originales, con modalidad, costo, requisitos, enlace y fecha de revisión.
- Búsqueda por palabras, tipo, gratuidad y modalidad. Reconoce expresiones sencillas como «cursos gratis virtuales de marketing» mediante reglas, sin IA.
- Guardados y seguimiento: guardada, en proceso, postulada y completada.
- Ruta orientativa de cinco pasos, progreso persistente y descarga de texto.
- Catálogo personal: crear, editar, guardar borradores, publicar y eliminar oportunidades añadidas por el usuario.
- Comprobación de enlaces del catálogo inicial. Señala respuestas fallidas y redirecciones; una respuesta HTTP correcta no demuestra que una convocatoria siga abierta.
- Comunidad: perfiles de mentor voluntarios y solicitudes con estados. Los tres perfiles iniciales están señalados como demostración y permiten simular una aceptación.
- Opiniones, exportación de perfil/guardados/progreso/solicitudes/oportunidades propias y eliminación de datos personales.

## Arquitectura y acceso

React + TypeScript, Vinext/Vite, Worker y base de datos D1. La API `/api/app` autentica cada solicitud con la identidad proporcionada por Sites. Las consultas delimitan los datos privados por usuario. El despliegue inicial es privado para el propietario y requiere sesión de ChatGPT; aún no es un enlace abierto para todos los compañeros.

`app/mobile-app.tsx` contiene la navegación y las vistas; `app/forms.tsx`, los formularios; `app/style.css`, el diseño. `app/api/app/route.ts` implementa persistencia, validación y permisos. `lib/logic.ts` implementa filtros, vigencia y rutas. `lib/catalog.json` conserva la evidencia y las fuentes del catálogo inicial. `db/schema.ts` y `drizzle/` definen las tablas y migraciones.

Los registros añadidos por cada usuario pertenecen a su catálogo. El catálogo inicial se mantiene en código y requiere una migración de datos para modificar registros ya cargados; editar únicamente el JSON no reemplaza registros existentes. No hay todavía un panel editorial compartido con roles.

## Desarrollo local

Requiere Node 24 y npm. Las dependencias ya están instaladas en este entorno.

```powershell
npm ci
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_flawless_namorita.sql
npm run dev -- --hostname 127.0.0.1
```

La migración se ejecuta una sola vez en una base nueva. El entorno local actual ya la tiene aplicada. El servidor de desarrollo usa la identidad de prueba que suministra el starter de Sites. No traslades esa identidad simulada a producción.

Para comprobar el Worker construido, en otra terminal:

```powershell
npm run start -- --port 5174
node tests/api-smoke.mjs
```

El test usa identidades sintéticas inyectadas únicamente en el Worker local; el dominio publicado recibe la identidad del servicio de acceso de Sites. No ejecutes este test contra producción. Sus registros temporales se eliminan al terminar.

## Verificación

```powershell
npx tsc --noEmit
node --test tests/logic.test.mjs
node tests/api-smoke.mjs
```

Se comprobaron la persistencia, el aislamiento entre usuarios, guardados, publicación de borradores, permisos de edición, validación de URLs, solicitudes de demostración, opiniones y rechazo de un origen distinto. Las pruebas de lógica cubren filtros, vencimientos en horario de Lima, rutas y fuentes. También se recorrió la interfaz móvil en el navegador.

## Límites de esta entrega

La IA generativa no está conectada: falta configurar una clave autorizada. No se presenta el filtro por palabras como un modelo de IA. La propuesta es usar un único modelo económico para transformar una consulta en filtros validados, consultando después la base de datos. No debe inventar oportunidades ni enlaces. La recomendación y estimación están en `docs/RECOMENDACION_IA.md`.

La revisión de fuentes es manual, apoyada por la comprobación de enlaces a demanda. Las convocatorias con fecha conocida desaparecen de las búsquedas al vencer; las fechas desconocidas exigen revisión. No hay extracción automática, tarea programada ni garantía de vigencia. Algunas fuentes pueden bloquear comprobaciones automáticas.

Los mentores iniciales son de ejemplo. Las solicitudes reales quedan en el buzón de la aplicación; no se envían correos ni se reserva una videollamada. Todavía no se ha realizado validación con estudiantes, integrado cobros, ni medido la calidad de recomendaciones con usuarios reales.

## Operación del piloto

1. Revisar cada semana las fuentes del catálogo; para convocatorias con cierre cercano, revisar con mayor frecuencia.
2. Leer requisitos, costo, ubicación y fecha de cierre en la fuente antes de publicar. No inventar una fecha ausente.
3. Invitar a cinco estudiantes a completar su perfil, encontrar una oportunidad, guardarla y avanzar un paso. Observar dónde se atascan y recoger su opinión.
4. Evaluar si encuentran algo relevante, cuánto tardan, si vuelven y si llegan a participar. La utilidad aún es una hipótesis.
5. Explorar un piloto financiado por una universidad o institución, con acceso básico gratuito para estudiantes. Es una hipótesis de financiación, no un ingreso confirmado.

El alojamiento, la curación y el soporte deben presupuestarse aparte de los tokens de IA. No se implementaron pagos porque aún no hay un modelo de negocio validado.
