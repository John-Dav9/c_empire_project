# API Reference — C'EMPIRE (English)

> Base URL dev  : `http://localhost:3000/api`
> Base URL prod : `https://c-empire.onrender.com/api`

## Authentication

All protected routes require: `Authorization: Bearer <accessToken>`

| Method | Route | Auth | Body | Response |
|--------|-------|------|------|----------|
| `POST` | `/auth/signup` | Public | `{ email, password, firstname, lastname, phone? }` | `{ user, accessToken, refreshToken }` |
| `POST` | `/auth/signin` | Public | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| `GET` | `/auth/me` | JWT | — | `{ userId, email, role }` |
| `POST` | `/auth/refresh` | Public | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `POST` | `/auth/forgot-password` | Public | `{ email }` | `{ message }` |
| `GET` | `/auth/reset-password/validate` | Public | `?token=...` | `{ valid: boolean }` |
| `POST` | `/auth/reset-password` | Public | `{ token, newPassword }` | `{ message }` |

## C'Shop

### Products
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/cshop/products` | Public | List products (`?category=`, `?search=`) |
| `GET` | `/cshop/products/:id` | Public | Product detail |
| `POST` | `/cshop/products` | Admin | Create product |
| `PATCH` | `/cshop/products/:id` | Admin | Update product |
| `DELETE` | `/cshop/products/:id` | Admin | Delete product |

### Cart
| Method | Route | Auth | Body | Description |
|--------|-------|------|------|-------------|
| `GET` | `/cshop/cart` | JWT | — | Get my cart |
| `POST` | `/cshop/cart/items` | JWT | `{ productId, quantity }` | Add to cart |
| `PATCH` | `/cshop/cart/items/:id` | JWT | `{ quantity }` | Update quantity |
| `DELETE` | `/cshop/cart/items/:id` | JWT | — | Remove item |

### Orders
| Method | Route | Auth | Body | Description |
|--------|-------|------|------|-------------|
| `POST` | `/cshop/orders/checkout` | JWT | `{ deliveryOption, deliveryAddress?, relayPointId?, promoCode? }` | Place order |
| `GET` | `/cshop/orders/my` | JWT | — | My orders |
| `GET` | `/cshop/orders` | Admin | — | All orders |
| `PATCH` | `/cshop/orders/:id/status` | Admin | `{ status }` | Update status |

### Relay Points
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| `GET` | `/cshop/relay-points` | Public | Active relay points |
| `POST` | `/cshop/relay-points` | Admin | Create relay point |

## Payments
| Method | Route | Auth | Body | Description |
|--------|-------|------|------|-------------|
| `POST` | `/payments/init` | JWT | `{ provider, amount, currency, referenceType, referenceId }` | Initiate payment |
| `GET` | `/payments/:id` | JWT | — | Payment status |
| `POST` | `/payments/webhook/:provider` | Public | Provider payload | Webhook (from provider) |

## Health Check
| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/health` | `{ status: 'ok', timestamp }` |

## Error Codes

| Code | Meaning |
|------|---------|
| 400 | Bad Request — validation error |
| 401 | Unauthorized — missing/invalid JWT |
| 403 | Forbidden — insufficient role |
| 404 | Not Found |
| 409 | Conflict — email already used |
| 429 | Too Many Requests — rate limit exceeded |
| 500 | Internal Server Error |

## Interactive Documentation

Available in development at: `http://localhost:3000/api/docs` (Swagger UI)
