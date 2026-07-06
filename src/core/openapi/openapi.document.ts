// src/core/openapi/openapi.document.ts
import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { openApiRegistry } from './openapi.registry';
import { registerAuthOpenApi } from '../../modules/auth/auth.openapi';
// import other module registration functions

registerAuthOpenApi(openApiRegistry);

const generator = new OpenApiGeneratorV31(
  openApiRegistry.definitions,
);

export const openApiDocument = generator.generateDocument({
  openapi: '3.1.0',
  info: {
    title: 'Bus Booking API',
    version: '1.0.0',
    description: 'Bus booking backend API',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development',
    },
  ],
});