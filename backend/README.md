# IFTA Easy Tax System - Backend

[![Node.js CI](https://github.com/yourusername/ifta-easy-tax/actions/workflows/node.js.yml/badge.svg)](https://github.com/yourusername/ifta-easy-tax/actions/workflows/node.js.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![codecov](https://codecov.io/gh/yourusername/ifta-easy-tax/branch/main/graph/badge.svg?token=YOUR-TOKEN)](https://codecov.io/gh/yourusername/ifta-easy-tax)

Backend service for the IFTA Easy Tax System, providing robust and secure APIs for managing IFTA tax calculations, reporting, and compliance for commercial vehicles.

## ✨ Features

- 🔒 **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (RBAC)
  - Secure password hashing with bcrypt
  - Refresh token support

- 🚛 **Vehicle & Trip Management**
  - Vehicle registration and tracking
  - Trip logging with GPS coordinates
  - Distance and fuel calculations
  - Multi-state trip support

- 📊 **IFTA Tax Calculations**
  - Automated tax calculations
  - Multi-jurisdictional tax reporting
  - Fuel tax reporting
  - Distance-based calculations

- 📑 **Reporting & Exports**
  - IFTA quarterly returns
  - Custom report generation
  - Excel/PDF exports
  - Audit logs

- 🛡️ **Security**
  - Input validation and sanitization
  - Rate limiting and request throttling
  - CORS protection
  - Security headers
  - SQL injection prevention

- 📚 **Developer Experience**
  - Comprehensive API documentation (Swagger/OpenAPI)
  - Detailed logging
  - Unit and integration tests
  - CI/CD ready
  - Docker support

## 🚀 Tech Stack

- **Runtime**: Node.js (v18+ LTS)
- **Framework**: Express.js
- **Database**: PostgreSQL (v14+) with Sequelize ORM
- **Authentication**: JWT + Passport.js
- **API Documentation**: Swagger/OpenAPI 3.0
- **Logging**: Winston with daily rotation
- **Validation**: Joi + Express Validator
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier + Husky
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

## 📦 Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher) or Yarn (v1.22+)
- PostgreSQL (v14 or higher)
- Git
- (Optional) Docker and Docker Compose

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ifta-easy-tax.git
cd ifta-easy-tax/backend
```

### 2. Install Dependencies

Using npm:

```bash
npm install
```

Or using Yarn:

```bash
yarn
```

### 3. Environment Configuration

Copy the example environment file and update the values:

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration. Here are the key environment variables:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ifta_easy_tax
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=false
DB_LOGGING=false

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
JWT_COOKIE_EXPIRES=30

# Email Configuration (for notifications)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM="IFTA Easy Tax <noreply@iftaeasytax.com>"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100  # Limit each IP to 100 requests per window

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 4. Database Setup

#### Option 1: Using Docker (Recommended)

```bash
docker-compose up -d postgres
```

#### Option 2: Manual Setup

1. Create a new PostgreSQL database
2. Update the database configuration in `.env`

### 5. Run Database Migrations

```bash
# Run migrations
npm run db:migrate

# Seed the database with initial data (optional)
npm run db:seed
```

### 6. Start the Development Server

```bash
# Development mode with hot-reload
npm run dev

# Or with Yarn
yarn dev
```

The server will be available at `http://localhost:5000` by default.

## 📚 API Documentation

Once the server is running, you can access the interactive API documentation:

- **Swagger UI**: `http://localhost:5000/api-docs`
- **OpenAPI JSON**: `http://localhost:5000/api-docs-json`
- **Health Check**: `http://localhost:5000/api/health`
- **Database Health**: `http://localhost:5000/api/health/db`

## 🏗️ Project Structure

```
backend/
├── src/                          # Source files
│   ├── config/                   # Configuration files
│   │   ├── config.js             # Main configuration
│   │   ├── database.js           # Database configuration
│   │   ├── passport.js           # Passport authentication config
│   │   └── swagger.js            # Swagger/OpenAPI config
│   │
│   ├── controllers/             # Route controllers
│   │   ├── auth.controller.js    # Authentication endpoints
│   │   ├── user.controller.js    # User management
│   │   ├── vehicle.controller.js # Vehicle management
│   │   └── trip.controller.js    # Trip management
│   │
│   ├── middleware/              # Custom middleware
│   │   ├── auth.middleware.js    # Authentication middleware
│   │   ├── error.middleware.js   # Error handling
│   │   ├── validation.middleware.js # Request validation
│   │   └── rateLimit.middleware.js  # Rate limiting
│   │
│   ├── models/                  # Database models
│   │   ├── index.js              # Model loader
│   │   ├── user.model.js         # User model
│   │   ├── vehicle.model.js      # Vehicle model
│   │   ├── trip.model.js        # Trip model
│   │   └── base.model.js        # Base model class
│   │
│   ├── routes/                  # API routes
│   │   ├── index.js             # Main router
│   │   ├── auth.routes.js       # Auth routes
│   │   ├── user.routes.js       # User routes
│   │   ├── vehicle.routes.js    # Vehicle routes
│   │   └── trip.routes.js       # Trip routes
│   │
│   ├── services/               # Business logic
│   │   ├── auth.service.js      # Authentication service
│   │   ├── user.service.js      # User service
│   │   ├── vehicle.service.js   # Vehicle service
│   │   └── trip.service.js      # Trip service
│   │
│   ├── utils/                  # Utility functions
│   │   ├── logger.js            # Logging utility
│   │   ├── apiResponse.js       # Standard API responses
│   │   ├── errorHandler.js      # Error handling utilities
│   │   └── helpers.js           # Helper functions
│   │
│   ├── validations/            # Validation schemas
│   │   ├── auth.validation.js   # Auth validations
│   │   ├── user.validation.js   # User validations
│   │   └── trip.validation.js   # Trip validations
│   │
│   └── index.js                # Application entry point
│
├── tests/                     # Test files
│   ├── integration/            # Integration tests
│   ├── unit/                   # Unit tests
│   └── test-helpers.js         # Test utilities
│
├── migrations/                # Database migrations
├── seeders/                   # Database seeders
├── .env.example              # Example environment variables
├── .eslintrc.js              # ESLint configuration
├── .prettierrc               # Prettier configuration
├── package.json              # Project metadata and dependencies
└── README.md                 # This file
```

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🐳 Docker Support

Build and run the application using Docker:

```bash
# Build the Docker image
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Run database migrations
docker-compose exec app npm run db:migrate

# Seed the database
docker-compose exec app npm run db:seed
```

## 🔒 Security

- All passwords are hashed using bcrypt
- JWT tokens are used for authentication
- Rate limiting is enabled by default
- CORS is configured to only allow requests from trusted origins
- Security headers are set using Helmet
- Input validation and sanitization is performed on all endpoints
- SQL injection is prevented by using parameterized queries with Sequelize

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [JWT](https://jwt.io/)
- [Swagger](https://swagger.io/)
- [Winston](https://github.com/winstonjs/winston)
├── models/           # Database models
├── routes/           # Route definitions
├── utils/            # Utility classes and functions
├── validators/       # Request validation schemas
└── index.js          # Application entry point
```

### Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start the development server with hot-reload
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run db:migrate` - Run database migrations
- `npm run db:migrate:undo` - Undo the last database migration
- `npm run db:seed` - Run database seeders
- `npm run db:seed:undo` - Undo database seeders

## Testing

To run tests:

```bash
npm test
```

To run tests with coverage:

```bash
npm run test:coverage
```

## Deployment

### Production

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

### Environment Variables

See `.env.example` for a list of required environment variables.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [JWT](https://jwt.io/)
- [Winston](https://github.com/winstonjs/winston)
- [Swagger](https://swagger.io/)
