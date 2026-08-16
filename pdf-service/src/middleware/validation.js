import { z } from 'zod';

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`),
      });
    }
    next(error);
  }
};

// Schemas
export const createJobSchema = z.object({
  body: z.object({
    paperId: z.string().min(1, 'paperId is required'),
    userId: z.string().min(1, 'userId is required'),
    type: z.enum(['view', 'download']).default('view'),
  }),
});

export const jobIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Job ID is required'),
  }),
});

export const pdfViewSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Paper ID is required'),
  }),
  query: z.object({
    type: z.enum(['pyq', 'syllabus']).default('pyq'),
    token: z.string().optional(),
  }),
});

export const uploadSchema = z.object({
  body: z.object({
    departmentId: z.string().min(1),
    branchId: z.string().min(1),
    sessionId: z.string().min(1),
    semester: z.coerce.number().min(1).max(10),
    subjectName: z.string().min(1),
    subjectCode: z.string().optional(),
    examType: z.enum(['mid-term', 'end-term']),
    year: z.coerce.number().min(2000).max(2100),
  }),
});