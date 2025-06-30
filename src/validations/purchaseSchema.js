const { z } = require('zod');

const purchaseSchema = z.object({
  name: z.string().min(1, { message: "The name cannot be empty." }),
  category_id: z.number().int({ message: "The category_id must be integer." }).positive({ message: "The category_id must be positive." }),
  price: z.number().min(0.1,{ message: "The price cannot be zero or less." })
});

module.exports = { purchaseSchema };