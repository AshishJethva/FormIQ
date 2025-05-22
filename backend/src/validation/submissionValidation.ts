// Submission validation schema

import { z } from 'zod';

export const submitFormSchema = z.object({
  data: z.record(z.any()).refine(data => Object.keys(data).length > 0, {
    message: 'Submission data cannot be empty',
  }),
});
