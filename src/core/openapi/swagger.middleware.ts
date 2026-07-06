// src/core/openapi/swagger.middleware.ts
import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';
import { openApiDocument } from './openapi.document';

export const swaggerRouter = Router();

swaggerRouter.get('/openapi.json', (_req, res) => {
  res.json(openApiDocument);
});

swaggerRouter.use(
  '/',
  swaggerUi.serve,
  swaggerUi.setup(openApiDocument, {
    explorer: true,
    swaggerOptions: {
      persistAuthorization: true,
    },
  }),
);