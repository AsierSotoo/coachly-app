# Coachly — rediseño local

Revisión visual completa preparada para validación local. No incluye despliegue ni cambios de datos.

## Cambios incluidos

- Landing nueva, responsive y orientada al trabajo real de un entrenador.
- Sistema visual más sobrio: carbón verdoso, un solo acento verde y menos brillos.
- Resumen principal reorganizado y tarjetas de equipo más compactas.
- Balance competitivo de temporada reunido en un único módulo legible, sin tres tarjetas gigantes repetidas.
- Navegación de escritorio y móvil adaptada a la nueva dirección.
- Paleta coherente aplicada también a las pantallas interiores para evitar la mezcla azul/verde anterior.
- Textos principales más concretos y menos genéricos.
- `/sw.js` y `/manifest.json` excluidos del middleware para evitar la redirección del service worker.

## Comprobación

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000` y revisar a 375 px, 768 px y 1440 px.

La compilación de producción se ha validado con `npm run build`.

## Importante

El ZIP no contiene `.env.local`, `.vercel`, `.next` ni `node_modules`. Conserva el `.env.local` de la carpeta original antes de sustituir archivos.
