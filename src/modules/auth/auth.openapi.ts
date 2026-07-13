// src/modules/auth/auth.openapi.ts
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import {
  sendOtpSchema,
  verifyOtpSchema,
  adminRegisterSchema,
} from './auth.validation';

export function registerAuthOpenApi(
  registry: OpenAPIRegistry,
): void {
  registry.registerPath({
    method: 'post',
    path: '/api/auth/send-otp',
    tags: ['Authentication'],
    summary: 'Send OTP',
    request: {
      body: {
        content: {
          'application/json': {
            schema: sendOtpSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'OTP sent successfully',
      },
      400: {
        description: 'Invalid phone number',
      },
      429: {
        description: 'Too many requests',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/auth/verify-otp',
    tags: ['Authentication'],
    summary: 'Verify OTP and register or log in user',
    request: {
      body: {
        content: {
          'application/json': {
            schema: verifyOtpSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'OTP verified',
      },
      400: {
        description: 'Invalid or expired OTP',
      },
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/auth/admin-register',
    tags: ['Authentication'],
    summary: 'Admin Register',
    request: {
      body: {
        content: {
          'application/json': {
            schema: adminRegisterSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Admin registered successfully',
      },
      400: {
        description: 'Invalid admin details',
      },
    },
  });
}