import { z } from 'zod';
import { updateDriverVerificationStatusSchema } from './admin.validation';

export type UpdateDriverVerificationStatusDto = z.infer<typeof updateDriverVerificationStatusSchema>;
