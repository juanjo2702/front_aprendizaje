# Frontend Web - Plataforma de Aprendizaje

Aplicación web moderna construida con Quasar Framework (Vue.js) para la plataforma de e-learning con gamificación y certificaciones.

## Características

- **Interfaz de usuario moderna**: Diseño responsivo y adaptable a móviles y escritorio
- **Catálogo de cursos**: Navegación, filtrado, búsqueda y detalles de cursos
- **Gamificación**: Juegos educativos integrados (memoria, puzzles, quizzes)
- **Dashboard de usuario**: Progreso, actividad reciente, cursos inscritos
- **Panel de administración**: Gestión de usuarios, cursos, categorías (acceso restringido)
- **Autenticación**: Login/registro tradicional + SSO (Google, GitHub, etc.)
- **Certificados**: Visualización y descarga de certificados PDF

## Tecnologías

- Vue.js 3, Composition API
- Quasar Framework 2 (UI component library)
- Pinia (gestión de estado)
- Axios (cliente HTTP)
- Vite (build tool)
- Docker + Docker Compose

## Requisitos

- Docker y Docker Compose (recomendado)
- Node.js 22+ (solo para desarrollo sin Docker)
- npm o pnpm

## Instalación con Docker (Recomendado)

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/juanjo2702/front_aprendizaje.git
   cd front_aprendizaje
   ```

2. **Configurar variables de entorno**
   
   Copiar el archivo de entorno adecuado según el entorno:

   - Desarrollo: `cp .env.example .env.local`
   - Producción: `cp .env.production.example .env`

   Luego editar el archivo `.env.local` para ajustar la URL del backend API (VITE_API_BACKEND_URL).

3. **Iniciar servicios (desarrollo)**
   ```bash
   docker-compose up -d
   ```

4. **Acceder a la aplicación**
   - Frontend Web: http://localhost:9000

5. **Nota**: El frontend requiere un backend API funcionando. Asegúrate de tener el backend ejecutándose en la URL configurada en `VITE_API_BACKEND_URL`.

## Instalación manual (sin Docker)

1. Copiar `.env.example` a `.env.local` y configurar `VITE_API_BACKEND_URL`
2. Instalar dependencias: `npm install`
3. Iniciar desarrollo: `npm run dev`

## Comandos útiles

```bash
npm run dev           # Servidor de desarrollo
npm run build         # Build para producción
npm run lint          # Verificar estilo con ESLint
npm run lint:fix      # Corregir problemas de estilo automáticamente
npm run format        # Formatear código con Prettier
npm run test          # Ejecutar pruebas (Vitest)
```

## Docker

```bash
docker-compose up -d          # Iniciar servicios en segundo plano (desarrollo)
docker-compose down           # Detener servicios
docker-compose logs -f        # Ver logs
docker-compose exec frontend bash  # Acceder a contenedor frontend
```

## Estructura del proyecto

```
front_aprendizaje/
├── frontend_web/
│   ├── src/
│   │   ├── pages/           # Páginas Vue (admin, auth, public, user, etc.)
│   │   ├── components/      # Componentes reutilizables
│   │   ├── layouts/         # Layouts principales (AdminLayout, MainLayout)
│   │   ├── router/          # Configuración de rutas
│   │   ├── stores/          # Stores Pinia (auth, etc.)
│   │   └── services/        # Servicios (API client)
│   ├── .docker/            # Configuración Docker (nginx.conf)
│   ├── Dockerfile          # Multi-stage (development, production)
│   └── quasar.config.js    # Configuración Quasar
├── docker-compose.yml      # Orquestación Docker (desarrollo)
├── docker-compose.prod.yml # Orquestación Docker (producción)
└── README.md              # Este archivo
```

## Calidad de código

- **Linting**: ESLint con configuración Vue 3 (ejecutar `npm run lint`)
- **Formato**: Prettier (ejecutar `npm run format`)
- **Pruebas**: Vitest + Vue Test Utils (ejecutar `npm run test`)
- **Tipado**: TypeScript opcional (configuración preparada)

## CI/CD

El proyecto incluye workflows de GitHub Actions:

- **Frontend CI**: Ejecuta linting, pruebas (Vitest) y build en cada push

Ver `.github/workflows/` para más detalles.

## Despliegue

### Opción 1: Docker Compose (producción)
1. Construir imágenes con `docker-compose -f docker-compose.prod.yml build`
2. Configurar variables de entorno de producción
3. Ejecutar `docker-compose -f docker-compose.prod.yml up -d`

### Opción 2: Servidor estático
- Construir con `npm run build`
- Servir archivos de `dist/spa` con Nginx, Apache, o cualquier servidor web

### Opción 3: Plataformas cloud
- **Netlify / Vercel**
- **AWS S3 + CloudFront**
- **Google Firebase Hosting**
- **GitHub Pages**

## Configuración del backend

El frontend necesita conectarse a un backend API. Por defecto, la URL es `http://localhost:8000`. Para producción, configurar `VITE_API_BACKEND_URL` con la URL del backend en producción.

## Licencia

Este proyecto está bajo la licencia MIT.

## Contribución

1. Fork el repositorio
2. Crear rama (`git checkout -b feature/mejora`)
3. Commit cambios (`git commit -am 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/mejora`)
5. Crear Pull Request

## Contacto

Para preguntas o soporte, abrir un issue en el repositorio.

---

**Nota**: Este es el frontend del proyecto completo. Para el backend, consulta [back_aprendizaje](https://github.com/juanjo2702/back_aprendizaje).
