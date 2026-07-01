# Peace Houses API — Node.js Migration
 
> **Instrucciones para Claude Code:** Este documento describe la migración completa de una API Ruby on Rails a Node.js + TypeScript. Construye el MVP siguiendo exactamente las especificaciones de stack, estructura, schema y endpoints descritos aquí. La API original en Rails ya está en producción; esta es una reescritura 1:1.
 
---
 
## Contexto del proyecto
 
API RESTful para gestionar Casas de Paz (Peace Houses) de una iglesia. Maneja miembros, reuniones, asistencia, visitantes y reportes. La API original está en Ruby on Rails 8.1 en modo API con PostgreSQL.
 
---
 
## Stack tecnológico
 
### Runtime y lenguaje
- **Node.js 20 LTS**
- **TypeScript 5** — tipado estricto en todo el proyecto (`"strict": true` en tsconfig)
### Framework
- **Express 5** — framework HTTP principal
### Base de datos
- **PostgreSQL 16**
- **Prisma** — ORM, migraciones y generación de tipos TypeScript automáticos desde el schema
### Autenticación
- **jsonwebtoken** — generación y verificación de JWT
- **bcrypt** — hashing de contraseñas
### Validación
- **Zod** — validación de bodies de request y tipado en runtime
### Utilidades
- **cors** — soporte CORS para el frontend
- **dotenv** — variables de entorno
- **morgan** — logging de requests HTTP
### Testing
- **Vitest** — framework de tests
- **supertest** — tests de integración HTTP
### Documentación
- **swagger-jsdoc** + **swagger-ui-express** — documentación OpenAPI en `/api-docs`
### Despliegue
- **AWS Lambda** — la API corre como función Lambda empaquetada en imagen de contenedor
- **@vendia/serverless-express** — adaptador que traduce los eventos de API Gateway / Lambda al `app` de Express
- **Amazon ECR** — registro de la imagen Docker
- **GitHub Actions** — CI/CD: build, push a ECR y actualización de la Lambda en cada push a `main`
- **Docker** — también se incluye un `Dockerfile` tradicional para correr la API como servicio long-running (Docker Compose / ECS / VPS)
---
 
## Estructura de carpetas
 
Créala exactamente así:
 
```
peace-houses-api/
├── src/
│   ├── app.ts                          # Express app setup (sin listen)
│   ├── server.ts                       # Entry point local, llama app.listen
│   ├── lambda.ts                       # Entry point AWS Lambda (serverless-express)
│   ├── controllers/
│   │   └── v1/
│   │       ├── auth.controller.ts
│   │       ├── houses.controller.ts
│   │       ├── members.controller.ts
│   │       ├── meetings.controller.ts
│   │       ├── attendances.controller.ts
│   │       ├── peoples.controller.ts
│   │       ├── visitors.controller.ts
│   │       └── reports.controller.ts
│   ├── routes/
│   │   └── v1/
│   │       ├── auth.routes.ts
│   │       ├── houses.routes.ts
│   │       ├── members.routes.ts
│   │       ├── meetings.routes.ts
│   │       ├── attendances.routes.ts
│   │       ├── peoples.routes.ts
│   │       ├── visitors.routes.ts
│   │       ├── reports.routes.ts
│   │       └── index.ts               # Monta todas las rutas bajo /api/v1
│   ├── middleware/
│   │   ├── auth.middleware.ts          # Verifica JWT, adjunta currentUser al request
│   │   ├── authorize.middleware.ts     # Control de roles (admin / leader)
│   │   ├── validate.middleware.ts      # Valida body con schema Zod
│   │   └── error.middleware.ts         # Error handler global de Express
│   ├── schemas/                        # Schemas Zod por entidad
│   │   ├── auth.schema.ts
│   │   ├── house.schema.ts
│   │   ├── member.schema.ts
│   │   ├── meeting.schema.ts
│   │   ├── attendance.schema.ts
│   │   └── people.schema.ts
│   ├── services/                       # Lógica de negocio, sin HTTP
│   │   ├── authentication.service.ts
│   │   ├── attendance.service.ts
│   │   └── report.service.ts
│   ├── lib/
│   │   ├── jwt.ts                      # sign / verify tokens
│   │   └── prisma.ts                   # instancia singleton de PrismaClient
│   └── types/
│       └── express.d.ts               # Extiende Request con currentUser
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── tests/
│   ├── auth.test.ts
│   ├── houses.test.ts
│   └── attendances.test.ts
├── .github/
│   └── workflows/
│       └── deploy.yml               # CI/CD: build + push a ECR + update Lambda
├── Dockerfile                       # Imagen para servicio long-running (Compose/ECS/VPS)
├── Dockerfile.lambda                # Imagen para AWS Lambda (base public.ecr.aws/lambda/nodejs)
├── docker-compose.yml
├── docker-entrypoint.sh
├── .env.example
├── .env
├── tsconfig.json
├── package.json
└── README.md
```
 
---
 
## Schema de Prisma
 
Crea `prisma/schema.prisma` con exactamente este contenido:
 
```prisma
generator client {
  provider = "prisma-client-js"
}
 
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
 
model People {
  id           Int      @id @default(autoincrement())
  name         String
  lastName     String   @map("last_name")
  phoneNumber  String?  @map("phone_number")
  email        String?
  birthDate    DateTime? @map("birth_date")
  address      String?
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
 
  user         User?
  member       Member?
  ledHouses    House[]       @relation("HouseLeader")
  attendances  Attendance[]
 
  @@map("peoples")
}
 
model User {
  id             Int      @id @default(autoincrement())
  email          String   @unique
  passwordHash   String   @map("password_hash")
  role           Role     @default(LEADER)
  personalDataId Int      @unique @map("personal_data_id")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
 
  personalData   People   @relation(fields: [personalDataId], references: [id])
 
  @@map("users")
}
 
enum Role {
  ADMIN
  LEADER
}
 
model House {
  id          Int      @id @default(autoincrement())
  name        String
  address     String?
  leaderId    Int?     @map("leader_id")
  meetingDay  String?  @map("meeting_day")
  startTime   String?  @map("start_time")
  endTime     String?  @map("end_time")
  active      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
 
  leader      People?   @relation("HouseLeader", fields: [leaderId], references: [id])
  members     Member[]
  meetings    Meeting[]
 
  @@map("houses")
}
 
model Member {
  id             Int      @id @default(autoincrement())
  personalDataId Int      @unique @map("personal_data_id")
  houseId        Int      @map("house_id")
  memberType     MemberType @default(MEMBER) @map("member_type")
  active         Boolean  @default(true)
  joinDate       DateTime @default(now()) @map("join_date")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
 
  personalData   People   @relation(fields: [personalDataId], references: [id])
  house          House    @relation(fields: [houseId], references: [id])
 
  @@map("members")
}
 
enum MemberType {
  LEADER
  MEMBER
}
 
model Meeting {
  id          Int           @id @default(autoincrement())
  houseId     Int           @map("house_id")
  date        DateTime      @db.Date
  startTime   String?       @map("start_time")
  endTime     String?       @map("end_time")
  status      MeetingStatus @default(SCHEDULED)
  topic       String?
  notes       String?
  createdAt   DateTime      @default(now()) @map("created_at")
  updatedAt   DateTime      @updatedAt @map("updated_at")
 
  house        House        @relation(fields: [houseId], references: [id])
  attendances  Attendance[]
 
  @@map("meetings")
}
 
enum MeetingStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
}
 
model Attendance {
  id                    Int      @id @default(autoincrement())
  meetingId             Int      @map("meeting_id")
  memberId              Int?     @map("member_id")          // null si es visitante
  peopleId              Int      @map("people_id")          // siempre requerido
  isGuest               Boolean  @default(false) @map("is_guest")
  isMemberFromOtherHouse Int?    @map("is_member_from_other_house") // member_id de la otra casa
  present               Boolean  @default(true)
  arrivalTime           String?  @map("arrival_time")
  notes                 String?
  createdAt             DateTime @default(now()) @map("created_at")
  updatedAt             DateTime @updatedAt @map("updated_at")
 
  meeting  Meeting @relation(fields: [meetingId], references: [id])
  people   People  @relation(fields: [peopleId], references: [id])
 
  @@map("attendances")
}
```
 
---
 
## Los tres casos de asistencia (lógica crítica)
 
Implementa esta lógica en `src/services/attendance.service.ts`. Es la parte más importante de la API.
 
### Caso 1: Miembro regular asiste a su casa
```json
{
  "meetingId": 1,
  "memberId": 5,
  "peopleId": 10,
  "isGuest": false,
  "isMemberFromOtherHouse": null
}
```
 
### Caso 2: Miembro visita otra casa
```json
{
  "meetingId": 2,
  "memberId": null,
  "peopleId": 10,
  "isGuest": true,
  "isMemberFromOtherHouse": 5
}
```
 
### Caso 3: Visitante externo (nunca ha sido miembro)
```json
{
  "meetingId": 1,
  "memberId": null,
  "peopleId": 20,
  "isGuest": true,
  "isMemberFromOtherHouse": null
}
```
 
El servicio debe derivar el campo `attendanceType` en las respuestas:
- `"regular_member"` → `isGuest === false`
- `"visiting_member"` → `isGuest === true && isMemberFromOtherHouse !== null`
- `"external_visitor"` → `isGuest === true && isMemberFromOtherHouse === null`
---
 
## Endpoints del MVP
 
Todos bajo `/api/v1`. Respuestas siempre en formato `{ success: boolean, data: any }`.
 
### Autenticación (público)
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
GET    /api/v1/auth/me              [JWT requerido]
```
 
### Houses
```
GET    /api/v1/houses
GET    /api/v1/houses/:id
POST   /api/v1/houses               [Admin]
PUT    /api/v1/houses/:id           [Admin, Leader-propia]
DELETE /api/v1/houses/:id           [Admin]
GET    /api/v1/houses/:id/members
GET    /api/v1/houses/:id/meetings
GET    /api/v1/houses/:id/statistics
```
 
### Members
```
GET    /api/v1/members
GET    /api/v1/members/:id
POST   /api/v1/members              [Admin, Leader]
PUT    /api/v1/members/:id          [Admin, Leader]
DELETE /api/v1/members/:id          [Admin, Leader]
```
 
### Meetings
```
GET    /api/v1/meetings
GET    /api/v1/meetings/:id
POST   /api/v1/meetings             [Admin, Leader]
PUT    /api/v1/meetings/:id         [Admin, Leader]
DELETE /api/v1/meetings/:id         [Admin, Leader]
GET    /api/v1/meetings/:id/attendances
```
 
### Attendances
```
GET    /api/v1/attendances
GET    /api/v1/attendances/:id
POST   /api/v1/attendances          [Leader]
PUT    /api/v1/attendances/:id      [Leader]
DELETE /api/v1/attendances/:id      [Admin, Leader]
POST   /api/v1/attendances/bulk     [Leader]
```
 
### Peoples
```
GET    /api/v1/peoples
GET    /api/v1/peoples/:id
POST   /api/v1/peoples              [Admin, Leader]
PUT    /api/v1/peoples/:id          [Admin, Leader]
GET    /api/v1/peoples/search?q=
```
 
### Visitors
```
GET    /api/v1/visitors
GET    /api/v1/visitors/:id
POST   /api/v1/visitors             [Leader]
PUT    /api/v1/visitors/:id         [Leader]
GET    /api/v1/visitors/recurring   [Admin]
```
 
### Reports
```
GET    /api/v1/reports/dashboard          [Admin]
GET    /api/v1/reports/house/:id          [Admin, Leader]
GET    /api/v1/reports/attendance-trends
GET    /api/v1/reports/visitor-conversion
GET    /api/v1/reports/member-activity
```
 
---
 
## Autenticación y autorización
 
### JWT
- Tokens expiran en **24 horas**
- Payload: `{ userId, email, role }`
- Header: `Authorization: Bearer <token>`
### Middleware de autenticación (`auth.middleware.ts`)
Verifica el token y adjunta `currentUser` al objeto `Request` de Express. Extender el tipo en `src/types/express.d.ts`:
 
```typescript
declare global {
  namespace Express {
    interface Request {
      currentUser?: {
        id: number;
        email: string;
        role: 'ADMIN' | 'LEADER';
      };
    }
  }
}
```
 
### Niveles de autorización
- **Admin**: acceso completo a todos los endpoints
- **Leader**: solo puede operar sobre datos de su propia casa
- El middleware `authorize.middleware.ts` debe recibir los roles permitidos como argumento: `authorize('ADMIN')`, `authorize('ADMIN', 'LEADER')`
---
 
## Formato de respuestas
 
### Éxito
```json
{
  "success": true,
  "data": { ... }
}
```
 
### Éxito con paginación
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "currentPage": 1,
    "perPage": 20,
    "totalPages": 5,
    "totalCount": 98
  }
}
```
 
### Error
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": null
  }
}
```
 
### Códigos de error
| HTTP | Código | Cuándo |
|------|--------|--------|
| 400 | `BAD_REQUEST` | Body inválido |
| 401 | `UNAUTHORIZED` | Token inválido o ausente |
| 403 | `FORBIDDEN` | Permisos insuficientes |
| 404 | `NOT_FOUND` | Recurso no existe |
| 422 | `UNPROCESSABLE` | Error de lógica de negocio |
| 500 | `INTERNAL_ERROR` | Error del servidor |
 
---
 
## Filtros y paginación
 
Todos los endpoints de lista deben soportar:
 
```
GET /api/v1/members?page=2&perPage=20&houseId=3
GET /api/v1/meetings?startDate=2025-01-01&endDate=2025-01-31&houseId=3
GET /api/v1/peoples/search?q=Juan&houseId=3
```
 
Implementar paginación directamente con Prisma (`skip` y `take`), sin librerías adicionales.
 
---
 
## Variables de entorno

Hay **dos entornos**, cada uno con su propia base de datos PostgreSQL:

| Entorno | Cómo se levanta | Base de datos |
|---------|-----------------|---------------|
| **Local** | `docker compose up --build` | Postgres del servicio `db` de docker-compose (en host: `localhost:5433`, user/pass `peace`/`peace`, base `peace_houses`) |
| **Producción** | AWS Lambda (imagen en ECR) | [Neon](https://neon.tech) — PostgreSQL serverless en `sa-east-1`, con `sslmode=require` |

### Local (`.env`)

Copia `.env.example` a `.env`. El `DATABASE_URL` apunta a la base de docker-compose:

```env
DATABASE_URL=postgresql://peace:peace@localhost:5433/peace_houses
JWT_SECRET_KEY=your-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3001
PORT=3000
NODE_ENV=development
```

> El `.env` está en `.gitignore`. Cuando la app corre dentro de Compose usa la red interna (`@db:5432`); el puerto `5433` del host es para herramientas que corres en tu máquina (Prisma CLI / Studio).

### Producción (variables de entorno de la Lambda)

**No** se usa `.env` en producción. Las variables se configuran en la función Lambda (*Configuration → Environment variables*). El `DATABASE_URL` apunta a Neon:

```
DATABASE_URL=postgresql://<user>:<password>@<host>.sa-east-1.aws.neon.tech/<db>?sslmode=require
```

El resto (`JWT_SECRET_KEY`, `JWT_EXPIRES_IN`, `CORS_ORIGINS`, `NODE_ENV=production`) también se definen ahí. `PORT` no aplica en Lambda.

---
 
## Scripts del package.json
 
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "build:lambda": "tsc && cp -r node_modules dist/",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```
 
---
 
## Dependencias
 
### Producción
```json
{
  "dependencies": {
    "express": "^5.0.0",
    "@prisma/client": "^5.0.0",
    "@vendia/serverless-express": "^4.12.6",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "zod": "^3.22.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "morgan": "^1.10.0",
    "swagger-jsdoc": "^6.2.0",
    "swagger-ui-express": "^5.0.0"
  }
}
```
 
### Desarrollo
```json
{
  "devDependencies": {
    "typescript": "^5.0.0",
    "prisma": "^5.0.0",
    "tsx": "^4.0.0",
    "@types/aws-lambda": "^8.10.162",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/cors": "^2.8.0",
    "@types/morgan": "^1.9.0",
    "@types/swagger-jsdoc": "^6.0.0",
    "@types/swagger-ui-express": "^4.1.0",
    "vitest": "^1.0.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^6.0.0"
  }
}
```
 
---
 
## tsconfig.json
 
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```
 
---
 
## Despliegue en AWS Lambda

La API se despliega como una **función Lambda empaquetada en imagen de contenedor** (no como ZIP). Express se ejecuta sin cambios gracias a `@vendia/serverless-express`, que adapta los eventos de API Gateway / Lambda al `app` de Express.

### Arquitectura

```
GitHub (push a main)
   └─> GitHub Actions (.github/workflows/deploy.yml)
         ├─ docker build -f Dockerfile.lambda  (platform linux/amd64)
         ├─ docker push  -> Amazon ECR (repo: hop-backend)
         └─ aws lambda update-function-code  (función: hop-backend)

API Gateway / Function URL  ─>  Lambda (hop-backend)  ─>  Express app  ─>  Neon (PostgreSQL serverless)
```

- **Región:** `sa-east-1`
- **Repositorio ECR:** `hop-backend`
- **Función Lambda:** `hop-backend`
- **Arquitectura:** `x86_64` (la imagen se construye con `--platform linux/amd64`)

### Entry point Lambda

`src/lambda.ts` envuelve la app de Express y exporta el `handler` que invoca Lambda:

```typescript
import serverlessExpress from '@vendia/serverless-express';
import app from './app';

export const handler = serverlessExpress({ app });
```

`app.ts` no llama a `app.listen` (eso vive solo en `server.ts`, usado en local), por lo que la misma app sirve tanto para el servidor local como para Lambda.

### Imagen de contenedor (`Dockerfile.lambda`)

Build multi-stage sobre la imagen base oficial de AWS (`public.ecr.aws/lambda/nodejs:20`):

1. **build:** instala dependencias con `npm ci`, ejecuta `npx prisma generate` y compila TypeScript a `dist/`.
2. **runtime:** copia `node_modules`, `dist` y `prisma` al `LAMBDA_TASK_ROOT` e instala `openssl` (requerido por el query engine de Prisma).

El comando de la imagen apunta al handler:

```dockerfile
CMD ["dist/lambda.handler"]
```

> El `Dockerfile` tradicional (servicio long-running con `node dist/server.js`) se mantiene para correr la API vía Docker Compose / ECS / VPS.

### CI/CD con GitHub Actions

El workflow `.github/workflows/deploy.yml` se dispara en cada **push a `main`** y realiza:

1. **Checkout** del código.
2. **Configura credenciales AWS** desde secrets.
3. **Login a ECR** (`amazon-ecr-login`).
4. **Build y push** de la imagen con dos tags: `${{ github.sha }}` y `latest`.
5. **`aws lambda update-function-code`** apuntando la función a la imagen recién publicada (`--architectures x86_64`).

#### Secrets de GitHub requeridos

Configúralos en *Settings → Secrets and variables → Actions*:

| Secret | Descripción |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | Access key del usuario/rol IAM con permisos sobre ECR y Lambda |
| `AWS_SECRET_ACCESS_KEY` | Secret access key correspondiente |
| `AWS_ACCOUNT_ID` | ID de la cuenta AWS, usado para componer el registry de ECR |

El registry de ECR se compone como `${AWS_ACCOUNT_ID}.dkr.ecr.sa-east-1.amazonaws.com`.

### Variables de entorno en Lambda

Las variables se configuran en la propia función Lambda (*Configuration → Environment variables*), ya que el `.env` no se incluye en la imagen (ver [Variables de entorno](#variables-de-entorno)). Como mínimo:

- `DATABASE_URL` — cadena de **Neon** (PostgreSQL serverless) con `sslmode=require`:
  `postgresql://<user>:<password>@<host>.sa-east-1.aws.neon.tech/<db>?sslmode=require`
- `JWT_SECRET_KEY`, `JWT_EXPIRES_IN`
- `CORS_ORIGINS`
- `NODE_ENV=production`

> `PORT` no aplica en Lambda (no hay servidor escuchando un puerto).

### Despliegue manual (opcional)

Si necesitas desplegar sin el pipeline:

```bash
# 1. Build y tag de la imagen
docker build --platform linux/amd64 -f Dockerfile.lambda \
  -t <account-id>.dkr.ecr.sa-east-1.amazonaws.com/hop-backend:latest .

# 2. Login y push a ECR
aws ecr get-login-password --region sa-east-1 \
  | docker login --username AWS --password-stdin <account-id>.dkr.ecr.sa-east-1.amazonaws.com
docker push <account-id>.dkr.ecr.sa-east-1.amazonaws.com/hop-backend:latest

# 3. Actualizar la función Lambda
aws lambda update-function-code \
  --function-name hop-backend \
  --image-uri <account-id>.dkr.ecr.sa-east-1.amazonaws.com/hop-backend:latest \
  --architectures x86_64 \
  --region sa-east-1
```

---

## Orden de implementación sugerido
 
1. Setup inicial: `package.json`, `tsconfig.json`, `.env`
2. Schema de Prisma + primera migración + seed básico
3. `src/lib/prisma.ts` y `src/lib/jwt.ts`
4. Middleware: `auth.middleware.ts`, `authorize.middleware.ts`, `validate.middleware.ts`, `error.middleware.ts`
5. `src/app.ts` con Express configurado (cors, morgan, rutas, error handler)
6. Módulo de Auth (controller + routes + service)
7. Módulo de Houses
8. Módulo de Members
9. Módulo de Meetings
10. Módulo de Attendances (incluye lógica de los 3 casos)
11. Módulo de Peoples + búsqueda
12. Módulo de Visitors
13. Módulo de Reports
14. Tests de integración para Auth y Attendances
15. Swagger en `/api-docs`