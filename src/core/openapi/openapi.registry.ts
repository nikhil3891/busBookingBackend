// src/core/openapi/openapi.registry.ts
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

export const openApiRegistry = new OpenAPIRegistry();

openApiRegistry.registerComponent(
  'securitySchemes',
  'bearerAuth',
  {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  },
);
