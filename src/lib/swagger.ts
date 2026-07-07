import swaggerJsdoc from 'swagger-jsdoc';

/**
 * Configuración OpenAPI. Las rutas se documentan vía anotaciones @openapi
 * en los archivos de routes (apis); aquí va la metadata base, los tags que
 * ordenan las secciones y los schemas compartidos del contrato.
 */
export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Peace Houses API',
      version: '1.0.0',
      description:
        'API RESTful para gestionar Casas de Paz: miembros, reuniones, asistencia, visitantes y reportes. Migración 1:1 desde Ruby on Rails.\n\n**Cómo autenticarse:** llamá a `POST /auth/login` con un usuario del seed (`admin@peacehouses.test` / `password123`), copiá el `token` de la respuesta y pegalo en el botón **Authorize** (solo el token, sin `Bearer`).',
    },
    servers: [{ url: '/api/v1', description: 'API v1' }],
    tags: [
      { name: 'Auth', description: 'Autenticación y sesión' },
      { name: 'Houses', description: 'Casas de Paz' },
      { name: 'Members', description: 'Miembros de las casas' },
      { name: 'Meetings', description: 'Reuniones' },
      { name: 'Attendances', description: 'Asistencias (los 3 casos)' },
      { name: 'Peoples', description: 'Personas / datos personales' },
      { name: 'Visitors', description: 'Visitantes' },
      { name: 'Reports', description: 'Reportes y estadísticas' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: { type: 'integer', default: 1, minimum: 1 },
          description: 'Número de página',
        },
        PerPageParam: {
          in: 'query',
          name: 'perPage',
          schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 },
          description: 'Elementos por página',
        },
        IdParam: {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'integer' },
          description: 'Identificador numérico del recurso',
        },
      },
      schemas: {
        // ----- Envelopes -----
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {},
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: {} },
            meta: {
              type: 'object',
              properties: {
                currentPage: { type: 'integer', example: 1 },
                perPage: { type: 'integer', example: 20 },
                totalPages: { type: 'integer', example: 5 },
                totalCount: { type: 'integer', example: 98 },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'UNAUTHORIZED' },
                message: { type: 'string', example: 'Invalid or expired token' },
                details: { nullable: true },
              },
            },
          },
        },
        // ----- Entidades -----
        People: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            lastName: { type: 'string' },
            phoneNumber: { type: 'string', nullable: true },
            email: { type: 'string', nullable: true },
            birthDate: { type: 'string', format: 'date-time', nullable: true },
            address: { type: 'string', nullable: true },
          },
        },
        House: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            address: { type: 'string', nullable: true },
            leaderId: { type: 'integer', nullable: true },
            meetingDay: { type: 'string', nullable: true },
            startTime: { type: 'string', nullable: true },
            endTime: { type: 'string', nullable: true },
            active: { type: 'boolean' },
          },
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            personalDataId: { type: 'integer' },
            houseId: { type: 'integer' },
            memberType: { type: 'string', enum: ['LEADER', 'MEMBER'] },
            active: { type: 'boolean' },
            joinDate: { type: 'string', format: 'date-time' },
          },
        },
        Meeting: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            houseId: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            startTime: { type: 'string', nullable: true },
            endTime: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'] },
            topic: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
          },
        },
        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            meetingId: { type: 'integer' },
            memberId: { type: 'integer', nullable: true },
            peopleId: { type: 'integer' },
            isGuest: { type: 'boolean' },
            isMemberFromOtherHouse: { type: 'integer', nullable: true },
            present: { type: 'boolean' },
            arrivalTime: { type: 'string', nullable: true },
            notes: { type: 'string', nullable: true },
            attendanceType: {
              type: 'string',
              enum: ['regular_member', 'visiting_member', 'external_visitor'],
              description: 'Campo derivado a partir de isGuest e isMemberFromOtherHouse',
            },
          },
        },
        // ----- Request bodies -----
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'admin@peacehouses.test' },
            password: { type: 'string', example: 'password123' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'name', 'lastName'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            name: { type: 'string' },
            lastName: { type: 'string' },
            phoneNumber: { type: 'string' },
            birthDate: { type: 'string', format: 'date' },
            address: { type: 'string' },
            role: { type: 'string', enum: ['ADMIN', 'LEADER'] },
          },
        },
        RefreshRequest: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string', description: 'Refresh token vigente (se rota en cada uso)' },
          },
        },
        LogoutRequest: {
          type: 'object',
          properties: {
            refreshToken: { type: 'string', description: 'Refresh token a revocar' },
          },
        },
        HouseInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            address: { type: 'string' },
            leaderId: { type: 'integer' },
            meetingDay: { type: 'string' },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            active: { type: 'boolean' },
          },
        },
        MemberInput: {
          type: 'object',
          required: ['personalDataId', 'houseId'],
          properties: {
            personalDataId: { type: 'integer' },
            houseId: { type: 'integer' },
            memberType: { type: 'string', enum: ['LEADER', 'MEMBER'] },
            active: { type: 'boolean' },
            joinDate: { type: 'string', format: 'date' },
          },
        },
        MeetingInput: {
          type: 'object',
          required: ['houseId', 'date'],
          properties: {
            houseId: { type: 'integer' },
            date: { type: 'string', format: 'date' },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            status: { type: 'string', enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'] },
            topic: { type: 'string' },
            notes: { type: 'string' },
          },
        },
        AttendanceInput: {
          type: 'object',
          required: ['meetingId', 'peopleId'],
          properties: {
            meetingId: { type: 'integer' },
            memberId: { type: 'integer', nullable: true },
            peopleId: { type: 'integer' },
            isGuest: { type: 'boolean' },
            isMemberFromOtherHouse: { type: 'integer', nullable: true },
            present: { type: 'boolean' },
            arrivalTime: { type: 'string' },
            notes: { type: 'string' },
          },
        },
        BulkAttendanceInput: {
          type: 'object',
          required: ['meetingId', 'attendances'],
          properties: {
            meetingId: { type: 'integer' },
            attendances: {
              type: 'array',
              items: { $ref: '#/components/schemas/AttendanceInput' },
            },
          },
        },
        PeopleInput: {
          type: 'object',
          required: ['name', 'lastName'],
          properties: {
            name: { type: 'string' },
            lastName: { type: 'string' },
            phoneNumber: { type: 'string' },
            email: { type: 'string', format: 'email' },
            birthDate: { type: 'string', format: 'date' },
            address: { type: 'string' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Token inválido o ausente',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        Forbidden: {
          description: 'Permisos insuficientes',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        NotFound: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
        BadRequest: {
          description: 'Body o parámetros inválidos',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // En dev se leen los .ts; en el contenedor (solo dist) se leen los .js
  // compilados, que conservan los comentarios @openapi (removeComments:false).
  apis: ['./src/routes/v1/*.ts', './dist/routes/v1/*.js'],
});
