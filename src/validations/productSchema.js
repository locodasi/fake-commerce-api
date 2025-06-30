const { z } = require('zod');

const productSchema = z.object({
  name: z.string().min(1, { message: "The name cannot be empty." }),
  category_id: z.number().int({ message: "The category_id must be integer." }).positive({ message: "The category_id must be positive." }),
  price: z.number().min(0.1,{ message: "The price cannot be zero or less." })
});

const updateProductSchema = z.object({
    name: z.string().min(1, { message: "The name cannot be empty." }).optional(),
    category_id: z.number().int({ message: "The category_id must be integer." }).positive({ message: "The category_id must be positive." }).optional(),
    price: z.number().min(0.1,{ message: "The price cannot be zero or less." }).optional()
  });

module.exports = { productSchema, updateProductSchema };