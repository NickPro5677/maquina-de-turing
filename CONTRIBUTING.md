# Cómo contribuir

1. Haz un fork y crea una rama: `git checkout -b mi-mejora`.
2. Instala lo necesario (solo para construir el archivo único): `npm install`.
3. Haz tus cambios. Si tocas el motor (`src/motor/`), añade o ajusta pruebas en `tests/`.
4. Comprueba que todo pasa: `npm test` y `npm run build`.
5. Abre un pull request explicando qué cambiaste y por qué.

Reglas de estilo:

- Código y textos en español, claros y cortos.
- Sin librerías externas por CDN: todo debe funcionar sin internet.
- El motor no debe usar el DOM, para poder probarlo con Node.
