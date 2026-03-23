# Meeting Room Booking System

A clean, well-architected meeting room booking system built with Node.js, TypeScript, and Express. This system provides RESTful APIs for managing rooms, bookings, and generating utilization reports with comprehensive validation and business rule enforcement.

## 🏗️ Architecture

### Overview

The system follows a **layered architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                     HTTP Layer                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │   Room Routes   │  │ Booking Routes  │  │Report Routes │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Controllers Layer                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │RoomController   │  │BookingController│  │ReportController│ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Services Layer                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  RoomService    │  │ BookingService  │  │ReportService │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                   Storage Layer                             │
│              ┌─────────────────────┐                        │
│              │  InMemoryStorage    │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

- **Routes Layer**: HTTP endpoint definitions and routing
- **Controllers Layer**: Request/response handling, input validation, error handling
- **Services Layer**: Business logic, rule enforcement, orchestration
- **Storage Layer**: Data persistence abstraction (currently in-memory)

### Key Design Principles

- **Single Responsibility**: Each layer has a clear, focused purpose
- **Dependency Injection**: Services use injected dependencies for testability
- **Interface Segregation**: Storage operations are abstracted via interfaces
- **Error Handling**: Consistent error responses across all endpoints
- **Type Safety**: Full TypeScript coverage with strict typing

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- TypeScript knowledge helpful

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd meeting-room-booking-system

# Install dependencies
npm install

# Build the project
npm run build
```

### Running the Application

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

The server will start on `http://localhost:3000`

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-08T10:00:00.000Z",
  "version": "1.0.0"
}
```

## 📚 API Documentation

### Endpoints Overview

| Method | Endpoint                    | Description                   |
| ------ | --------------------------- | ----------------------------- |
| `POST` | `/rooms`                    | Create a new room             |
| `GET`  | `/rooms`                    | List rooms with filtering     |
| `POST` | `/bookings`                 | Create a booking              |
| `GET`  | `/bookings`                 | List bookings with pagination |
| `POST` | `/bookings/:id/cancel`      | Cancel a booking              |
| `GET`  | `/reports/room-utilization` | Generate utilization report   |

### 1. Room Management

#### Create Room

```http
POST /rooms
Content-Type: application/json

{
  "name": "Conference Room A",
  "capacity": 12,
  "floor": 1,
  "amenities": ["WiFi", "Projector", "Whiteboard"]
}
```

**Response (201 Created):**

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Conference Room A",
  "capacity": 12,
  "floor": 1,
  "amenities": ["WiFi", "Projector", "Whiteboard"],
  "createdAt": "2024-01-08T10:00:00.000Z"
}
```

#### List Rooms

```http
GET /rooms?minCapacity=10&amenity=WiFi
```

**Response (200 OK):**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Conference Room A",
    "capacity": 12,
    "floor": 1,
    "amenities": ["WiFi", "Projector"],
    "createdAt": "2024-01-08T10:00:00.000Z"
  }
]
```

### 2. Booking Management

#### Create Booking

```http
POST /bookings
Content-Type: application/json
Idempotency-Key: unique-request-id-123

{
  "roomId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Team Standup",
  "organizerEmail": "john.doe@company.com",
  "startTime": "2024-01-08T09:00:00.000Z",
  "endTime": "2024-01-08T09:30:00.000Z"
}
```

**Response (201 Created):**

```json
{
  "id": "660f9500-f3ac-52e5-b827-557766551001",
  "roomId": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Team Standup",
  "organizerEmail": "john.doe@company.com",
  "startTime": "2024-01-08T09:00:00.000Z",
  "endTime": "2024-01-08T09:30:00.000Z",
  "status": "confirmed",
  "createdAt": "2024-01-08T08:00:00.000Z"
}
```

#### List Bookings

```http
GET /bookings?roomId=550e8400-e29b-41d4-a716-446655440000&limit=10&offset=0
```

**Response (200 OK):**

```json
{
  "items": [
    {
      "id": "660f9500-f3ac-52e5-b827-557766551001",
      "roomId": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Team Standup",
      "organizerEmail": "john.doe@company.com",
      "startTime": "2024-01-08T09:00:00.000Z",
      "endTime": "2024-01-08T09:30:00.000Z",
      "status": "confirmed",
      "createdAt": "2024-01-08T08:00:00.000Z"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

#### Cancel Booking

```http
POST /bookings/660f9500-f3ac-52e5-b827-557766551001/cancel
```

**Response (200 OK):**

```json
{
  "id": "660f9500-f3ac-52e5-b827-557766551001",
  "status": "cancelled",
  "cancelledAt": "2024-01-08T08:30:00.000Z"
}
```

### 3. Reporting

#### Room Utilization Report

```http
GET /reports/room-utilization?from=2024-01-01T00:00:00.000Z&to=2024-01-31T23:59:59.999Z
```

**Response (200 OK):**

```json
[
  {
    "roomId": "550e8400-e29b-41d4-a716-446655440000",
    "roomName": "Conference Room A",
    "totalBookingHours": 45.5,
    "utilizationPercent": 18.54
  }
]
```

## 🔧 Business Rules

### Room Rules

- Room names must be unique (case-insensitive)
- Capacity must be positive
- Amenities are optional

### Booking Rules

- **Working Hours**: Monday-Friday, 8:00 AM - 8:00 PM only
- **Duration**: 15 minutes minimum, 4 hours maximum
- **No Overlaps**: Confirmed bookings cannot overlap for the same room
- **Cancellation**: Must be cancelled at least 1 hour before start time

### Idempotency

- Use `Idempotency-Key` header to prevent duplicate bookings
- Keys are scoped per organizer email
- Duplicate requests return the same booking

## 🧪 Testing

### Test Coverage

- **Unit Tests**: Business logic, validation, utilities
- **Integration Tests**: End-to-end API flows
- **Coverage Target**: 80%+ lines, branches, functions

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage
```

### Test Structure

```
tests/
├── business-utils.test.ts     # Utility function tests
├── booking-service.test.ts    # Booking business logic
├── report-service.test.ts     # Utilization calculations
└── integration.test.ts        # End-to-end API tests
```

## 📂 Project Structure

```
src/
├── index.ts                   # Application entry point
├── controllers/               # HTTP request handlers
│   ├── room-controller.ts
│   ├── booking-controller.ts
│   └── report-controller.ts
├── services/                  # Business logic
│   ├── room-service.ts
│   ├── booking-service.ts
│   └── report-service.ts
├── storage/                   # Data persistence
│   └── in-memory-storage.ts
├── models/                    # Types and validation
│   ├── types.ts
│   └── validation.ts
├── routes/                    # Route definitions
│   ├── room-routes.ts
│   ├── booking-routes.ts
│   └── report-routes.ts
├── middleware/                # Express middleware
│   └── error-handler.ts
└── utils/                     # Shared utilities
    └── business-utils.ts

tests/                         # Test suite
config/                        # Configuration files
docs/                          # Additional documentation
```

## 🔄 Development Workflow

### Available Scripts

```bash
npm run dev        # Start development server with hot reload
npm run build      # Compile TypeScript to JavaScript
npm start          # Start production server
npm test           # Run test suite
npm run test:watch # Run tests in watch mode
npm run lint       # Check code style with ESLint
npm run format     # Format code with Prettier
```

### Code Quality Tools

- **TypeScript**: Strict type checking
- **ESLint**: Code style and quality enforcement
- **Prettier**: Automatic code formatting
- **Jest**: Testing framework with coverage
- **Joi**: Runtime input validation

### Git Workflow

1. Create feature branch from `main`
2. Make changes with descriptive commits
3. Run tests: `npm test`
4. Check linting: `npm run lint`
5. Create pull request

## 🚧 Current Limitations & Future Enhancements

### Known Limitations

⚠️ **In-Memory Storage**: Data doesn't persist across restarts
⚠️ **No Authentication**: Open API without user management
⚠️ **Single Instance**: Cannot scale horizontally

### Planned Enhancements

- **Database Integration**: PostgreSQL with proper transactions
- **Authentication**: JWT-based user authentication
- **WebSocket Support**: Real-time booking updates
- **Monitoring**: Health checks, metrics, logging
- **Docker Support**: Containerized deployment
- **API Documentation**: OpenAPI/Swagger integration

## 📄 Error Handling

All API errors return consistent JSON responses:

```json
{
  "error": "ValidationError",
  "message": "startTime must be before endTime"
}
```

### Error Types

| Status | Error Type            | Description             |
| ------ | --------------------- | ----------------------- |
| 400    | `ValidationError`     | Invalid input data      |
| 404    | `NotFoundError`       | Resource not found      |
| 409    | `ConflictError`       | Business rule violation |
| 500    | `InternalServerError` | Unexpected server error |

## 📖 Additional Documentation

- [Detailed Architecture & Design](./DESIGN.md)
- [API Test Collection](./tests/)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the coding standards
4. Add tests for new features
5. Submit a pull request

## 📝 License

ISC License - see LICENSE file for details
