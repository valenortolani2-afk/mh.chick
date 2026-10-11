# Mami Helena

## Galería administrable

Las imágenes de las creaciones se almacenan en Vercel Blob. El panel de carga está en `/admin` y permite elegir entre Polainas, Gorros, Mitones y Ponchos. Las imágenes publicadas aparecen automáticamente en la galería principal y al seleccionar una categoría.

### Conectar Vercel Blob

1. Vinculá este repositorio con el proyecto correcto de Vercel desde el directorio del proyecto: `vercel link`.
2. En el panel de Vercel, creá un Blob Store público y conectalo al proyecto.
3. Para desarrollo local, ejecutá `vercel env pull .env.local` para obtener `BLOB_READ_WRITE_TOKEN`.
4. Publicá el proyecto. Vercel inyecta la variable de entorno en los despliegues conectados.

No agregues `BLOB_READ_WRITE_TOKEN` al repositorio. Los archivos `.env*.local` están ignorados por Git.

### Seguridad

El panel `/admin` no tiene autenticación por decisión actual. Cualquier persona que conozca la URL puede cargar imágenes mientras el sitio esté publicado. Antes de producción, agregá una contraseña o un inicio de sesión.
