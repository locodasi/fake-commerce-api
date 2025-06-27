const { z } = require('zod');

const userSchema = z.object({
  email: z.string().email({ message: "Invalid email" }),
  password: z.string().min(7, { message: "The password cannot be less than 7 characters." }),
  admin: z.boolean().optional(),
  active: z.boolean().optional(),
  created_at: z.preprocess(
    (val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : undefined),
    z.date().optional()
  ),
});

const updateUserSchema = z.object({
  email: z.string().optional(),
  password: z.string().optional(),
  admin: z.boolean().optional(),
  active: z.boolean().optional(),
  created_at: z.preprocess(
    (val) => (typeof val === 'string' || val instanceof Date ? new Date(val) : undefined),
    z.date().optional()
  ),
}).superRefine((data, ctx) => {
  if ('email' in data) {
    ctx.addIssue({
      path: ['email'],
      code: z.ZodIssueCode.custom,
      message: "The 'email' can't be changed",
    });
  }
  if ('password' in data) {
    ctx.addIssue({
      path: ['password'],
      code: z.ZodIssueCode.custom,
      message: "The 'password' can't be changed in this enpoint",
    });
  }
});

const changeUserPasswordSchema = z.object({
  actualPassword: z.string(),
  newPassword: z.string().min(7, { message: "The password cannot be less than 7 characters." }),
})

module.exports = { userSchema, updateUserSchema, changeUserPasswordSchema };
