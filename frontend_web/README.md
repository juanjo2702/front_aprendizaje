# Plataforma Web (`frontend-web`)

Frontend Quasar/Vue 3 del LMS gamificado.

## Instalar dependencias

```bash
npm install
```

## Levantar la app en desarrollo

```bash
npm run dev
```

## Build de producción

```bash
npm run build
```

## Suite E2E con Cypress

La suite E2E está configurada para usar:
- App Quasar: `http://localhost:9000`
- API Laravel: `http://localhost:8000/api`

Los specs disponibles están en:
- `cypress/e2e/rbac.cy.js`
- `cypress/e2e/course_lifecycle.cy.js`
- `cypress/e2e/student_journey.cy.js`
- `cypress/e2e/student_economy.cy.js`

### Opción recomendada: correr con Docker Compose

1. Ve a la raíz del proyecto:

```powershell
cd "C:\PROYECTOS\SISTEMA UDEMYBOL"
```

2. Levanta base de datos, backend y frontend:

```powershell
docker compose up -d
```

3. Verifica que estén disponibles:
- Frontend: [http://localhost:9000](http://localhost:9000)
- API: [http://localhost:8000/api](http://localhost:8000/api)

4. En otra terminal, entra al frontend:

```powershell
cd "C:\PROYECTOS\SISTEMA UDEMYBOL\front_aprendizaje\frontend_web"
```

5. Abre Cypress en modo visual:

```powershell
npm run e2e:open
```

6. O corre todo en modo headless:

```powershell
npm run e2e
```

### Correr un spec específico

```powershell
npx cypress run --spec "cypress/e2e/rbac.cy.js"
```

```powershell
npx cypress run --spec "cypress/e2e/course_lifecycle.cy.js"
```

```powershell
npx cypress run --spec "cypress/e2e/student_journey.cy.js"
```

```powershell
npx cypress run --spec "cypress/e2e/student_economy.cy.js"
```

### Opción local sin Docker

Backend:

```powershell
cd "C:\PROYECTOS\SISTEMA UDEMYBOL\back_aprendizaje\backend_api"
php artisan serve --host=0.0.0.0 --port=8000
```

Frontend:

```powershell
cd "C:\PROYECTOS\SISTEMA UDEMYBOL\front_aprendizaje\frontend_web"
npm run dev -- --host 0.0.0.0 --port 9000
```

Luego abre Cypress:

```powershell
npm run e2e:open
```

### Problemas comunes

- Si `docker compose up -d` falla con `failed to connect to the docker API`, inicia Docker Desktop y vuelve a intentar.
- Si `localhost:9000` no carga, el frontend no está levantado.
- Si Cypress abre pero la app falla por llamadas HTTP, revisa que el backend responda en `localhost:8000`.
- Si quieres reiniciar los servicios:

```powershell
docker compose down
docker compose up -d
```

## Personalizar configuración Quasar

Ver [Configuring quasar.config.js](https://v2.quasar.dev/quasar-cli-vite/quasar-config-js).
