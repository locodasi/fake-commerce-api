const { z } = require('zod');

const purchaseSchema = z.object({
  name: z.string().min(1, { message: "The name cannot be empty." }),
  category_id: z.number().int({ message: "The category_id must be integer." }).positive({ message: "The category_id must be positive." }),
  price: z.number().min(0.1,{ message: "The price cannot be zero or less." })
});

const createPurchaseSchema = z.object({
  buyer_id: z.number().positive().min(1, { message: "Invalid user_id." }),
  products: z.array(
    z.object({
      product_id: z.number().positive().min(1, { message: "Invalid product_id." }),
      quantity: z.number().positive().min(1, { message: "Invalid quantity." }),
    })
  ).min(1, { message: "At least one product is required." }),
});

module.exports = { purchaseSchema, createPurchaseSchema };