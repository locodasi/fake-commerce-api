# 🛍️ fake-commerce-api

**fake-commerce-api** is a ready-to-use RESTful API designed for frontend development and testing. It simulates a real e-commerce backend, ideal for students, instructors, and developers who need a controlled environment to build UIs, test purchase flows, or teach API consumption.

---

## 🚀 Features

- Lightweight SQLite database (easy to reset).
- Available endpoints:
  - Users (`users`)
  - Products (`products`)
  - Categories (`categories`)
  - Purchases (`purchases`)
  - Purchase Items (`purchase_items`)
- Full shopping cart → purchase flow.
- Designed for use with React, Vue, Svelte, and other frontend frameworks.

---

## 📦 Installation

```bash
git clone https://github.com/your-username/fake-commerce-api.git
cd fake-commerce-api
npm install
```

## ▶️ Usage

```bash
npm run dev
```

By default, the API runs at: http://localhost:3000

---

## 🔌 Main Endpoints

### `GET /products`
Returns all available products.

### `GET /categories`
Returns all product categories.

### `GET /users`
Returns all registered users.

### `POST /purchases`
Creates a new purchase. Requires:

```json
{
  "buyer_id": 1,
  "products": [
    { "product_id": 3, "quantity": 2 },
    { "product_id": 7, "quantity": 1 }
  ]
}
```

### `GET /purchases/:id`
Returns the full purchase details, including items, product info, and category data.

---

## 🧪 Use Cases

- 🔸 Students practicing with `fetch`, `axios`, or `react-query`.
- 🔸 Developers building product listings, cart views, and checkout flows.
- 🔸 Instructors teaching REST API consumption using realistic data.

---

## 🗃️ Database

Uses SQLite for simplicity and portability.

Current schema:
- `users`
- `products`
- `categories`
- `purchases`
- `purchase_items`

---

## 📄 License

MIT — Free to use for learning, teaching, or development.

---

## ✍️ Author

Created by [Luvas Da Silva](https://github.com/locodasi)
