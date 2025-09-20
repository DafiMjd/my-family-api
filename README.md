# Family API

A clean, scalable Express.js API built with TypeScript using feature-based architecture. This project demonstrates best practices for building maintainable Node.js applications.

## 🏗️ Architecture

This project follows a **Feature-Based Architecture** pattern, which organizes code by business features rather than technical layers. Each feature is self-contained with its own controller, service, repository, and routes.

```
src/
├── features/           # Feature modules
│   └── users/         # Users feature
│       ├── user.controller.ts    # HTTP request handling
│       ├── user.service.ts       # Business logic
│       ├── user.repository.ts    # Data access layer
│       └── user.routes.ts        # Route definitions
├── shared/            # Shared code
│   ├── types/         # TypeScript type definitions
│   ├── middleware/    # Custom middleware
│   └── utils/         # Utility functions
└── app.ts             # Main application file
```

## 🚀 Features

- **TypeScript** - Full type safety and modern JavaScript features
- **Express.js** - Fast, unopinionated web framework
- **Clean Architecture** - Separation of concerns with clear boundaries
- **Security** - Helmet for security headers, CORS enabled
- **Logging** - Morgan for HTTP request logging
- **Error Handling** - Comprehensive error handling middleware
- **Hot Reload** - Development server with automatic restarts
- **Path Aliases** - Clean imports with `@/features/*` and `@/shared/*`

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd my-family-api
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📜 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented)

## 🔗 API Endpoints

### Health Check
- **GET** `/health` - Check if the API is running

### Users
- **GET** `/api/users` - Get all users
- **GET** `/api/users/:id` - Get user by ID
- **POST** `/api/users` - Create new user
- **PUT** `/api/users/:id` - Update user
- **DELETE** `/api/users/:id` - Delete user

## 📝 API Usage Examples

### Get all users
```bash
curl http://localhost:3000/api/users
```

### Create a new user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 35,
    "role": "parent"
  }'
```

### Get user by ID
```bash
curl http://localhost:3000/api/users/1
```

### Update user
```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "age": 36
  }'
```

### Delete user
```bash
curl -X DELETE http://localhost:3000/api/users/1
```

## 📊 Data Models

### User
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  role: 'parent' | 'child' | 'grandparent';
  createdAt: Date;
  updatedAt: Date;
}
```

### Create User Request
```typescript
interface CreateUserRequest {
  name: string;
  email: string;
  age: number;
  role: 'parent' | 'child' | 'grandparent';
}
```

## 🏛️ Architecture Layers

### Controller Layer (`user.controller.ts`)
- Handles HTTP requests and responses
- Validates input data
- Calls service layer methods
- Returns appropriate HTTP status codes

### Service Layer (`user.service.ts`)
- Contains business logic
- Validates business rules
- Orchestrates data operations
- Maps data between layers

### Repository Layer (`user.repository.ts`)
- Handles data access
- Abstracts data storage
- Currently uses in-memory storage
- Easy to replace with database

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development
```

### TypeScript Configuration
The project uses strict TypeScript configuration with:
- Path aliases for clean imports
- Strict type checking
- Source maps for debugging
- Declaration files generation

## 🧪 Testing

Testing setup is ready to be implemented. You can add:
- Unit tests for services and repositories
- Integration tests for API endpoints
- End-to-end tests for complete workflows

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## 📈 Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Authentication and authorization
- [ ] Input validation with Joi or Zod
- [ ] API documentation with Swagger
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Rate limiting
- [ ] Request caching
- [ ] Logging with Winston

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Created with ❤️ using clean architecture principles.
