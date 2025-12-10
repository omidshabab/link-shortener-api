# Link Shortener API

A robust, TypeScript-based URL shortener API built with Express, Prisma, and PostgreSQL. Features custom short codes, click tracking, and API key management.

## Features

- 🔗 Create short links with random or custom aliases
- 📊 Track click statistics for each link
- 🔑 API Key management system (create, deactivate, delete)
- 🌍 Custom domain support
- 🛡️ Built with TypeScript for type safety
- 🐘 PostgreSQL database with Prisma ORM

## Prerequisites

- Node.js (v18+)
- PostgreSQL
- Bun (optional, but recommended for scripts)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd link-shortener-api
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure Environment Variables**

   Copy `.env.example` to `.env` and update the values:

   ```bash
   cp .env.example .env
   ```

   Update the following variables in `.env`:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `MASTER_API_KEY`: A secure key for accessing admin routes
   - `CUSTOM_DOMAIN`: The base URL for your short links (e.g., https://sho.rt)

4. **Database Setup**

   Run Prisma migrations to set up the database schema:

   ```bash
   npm run prisma:migrate
   # or
   bun run prisma:migrate
   ```

5. **Start the Server**

   Development mode:
   ```bash
   npm run dev
   ```

   Production build:
   ```bash
   npm run build
   npm start
   ```

## API Documentation

### Authentication

The API uses two types of authentication:
1. **Master Key**: Used for admin routes (managing API keys). Passed via `x-master-key` header.
2. **API Key**: Used for link management. Passed via `x-api-key` header.

### Admin Routes
**Auth Required**: `x-master-key` header

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/api/admin/keys` | Create a new API key | `{ "name": "My App" }` |
| `GET` | `/api/admin/keys` | List all API keys | - |
| `PATCH` | `/api/admin/keys/:id/deactivate` | Deactivate an API key | - |
| `DELETE` | `/api/admin/keys/:id` | Delete an API key | - |

#### Create API Key Response
```json
{
  "id": "cm...xx",
  "key": "sk_...",
  "name": "My App",
  "isActive": true,
  "createdAt": "2024-..."
}
```

### Link Routes
**Auth Required**: `x-api-key` header

#### 1. Shorten a Link

**Endpoint**: `POST /api/shorten`

**Body Parameters**:
- `url` (required): The original URL to shorten
- `customCode` (optional): Custom alias (max 5 alphanumeric chars)

**Example Request**:
```json
{
  "url": "https://www.example.com/very/long/url",
  "customCode": "cool"
}
```

**Response**:
```json
{
  "id": "cm...yy",
  "shortCode": "cool",
  "shortUrl": "https://yourdomain.com/cool",
  "originalUrl": "https://www.example.com/very/long/url",
  "clicks": 0,
  "createdAt": "2024-..."
}
```

#### 2. Get Link Stats

**Endpoint**: `GET /api/stats/:shortCode`

**Response**:
```json
{
  "id": "cm...yy",
  "shortCode": "cool",
  "originalUrl": "https://www.example.com/very/long/url",
  "clicks": 42,
  "createdAt": "2024-...",
  "updatedAt": "2024-...",
  "shortUrl": "https://yourdomain.com/cool"
}
```

#### 3. List Links

**Endpoint**: `GET /api/links`

**Query Parameters**:
- `page` (optional, default: 1)
- `limit` (optional, default: 50)

**Response**:
```json
{
  "links": [
    {
      "id": "...",
      "shortCode": "...",
      "originalUrl": "...",
      "clicks": 10,
      "createdAt": "...",
      "shortUrl": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "totalPages": 1
  }
}
```

#### 4. Delete Link

**Endpoint**: `DELETE /api/:shortCode`

**Response**:
```json
{
  "message": "Link deleted successfully"
}
```

### Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server health check |
| `GET` | `/:shortCode` | Redirect to original URL |

## Development

- **Run migrations**: `npm run prisma:migrate`
- **Open Prisma Studio**: `npm run prisma:studio` (GUI for database)
- **Lint/Format**: (Check package.json for available scripts)

## License

MIT
