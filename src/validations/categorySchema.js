const { z } = require('zod');

const categorySchema = z.object({
  name: z.string().min(1, { message: "The name cannot be empty." }),
});

module.exports = { categorySchema };