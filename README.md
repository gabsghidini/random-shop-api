# Random Shopping API

A REST API built with AdonisJS 5 that manages a product catalog and automated purchase system. The system integrates with GitHub's public API to randomly assign buyers to purchases, creating a unique shopping experience where items from a pre-configured catalog can be purchased by randomly selected GitHub users.

## Features

- **Product Catalog Management**: Create and list items with name, price, and stock quantity
- **Automated Purchase System**: Create purchases with random GitHub users as buyers
- **GitHub Integration**: Fetches random users from GitHub's public API
- **Stock Management**: Automatic inventory tracking and stock validation
- **Comprehensive Error Handling**: Robust error responses for various scenarios
- **Data Validation**: Input validation for all endpoints
- **Database Relationships**: Proper foreign key relationships between items and purchases

## Technology Stack

- **Framework**: AdonisJS 5 with TypeScript
- **Database**: SQLite with Lucid ORM
- **External API**: GitHub Users API
- **Testing**: Japa (AdonisJS testing framework)
- **Validation**: AdonisJS Validator

## Prerequisites

Before running this application, make sure you have the following installed:

- Node.js (v16 or higher)
- npm or yarn
- Git

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd random-shopping-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   
   Copy the example environment file and configure it:
   ```bash
   cp .env.example .env
   ```

   Update the `.env` file with your configuration:
   ```env
   PORT=3333
   HOST=0.0.0.0
   NODE_ENV=development
   APP_KEY=your-app-key-here
   DRIVE_DISK=local
   DB_CONNECTION=sqlite
   ```

4. **Generate Application Key**
   ```bash
   node ace generate:key
   ```

5. **Database Setup**
   
   Run database migrations to create the required tables:
   ```bash
   node ace migration:run
   ```

6. **Start the Development Server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:3333`

## Database Schema

### Items Table
- `id`: Primary key (auto-increment)
- `nome`: Item name (string, required)
- `preco`: Item price (decimal, required)
- `qtd_atual`: Current stock quantity (integer, required)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### Compras Table
- `id`: Primary key (auto-increment)
- `comprador_github_login`: GitHub username of the buyer (string, required)
- `item_id`: Foreign key referencing items.id (integer, required)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## API Endpoints

### Items Endpoints

#### Create Item
- **POST** `/itens`
- **Description**: Creates a new item in the catalog
- **Request Body**:
  ```json
  {
    "nome": "Smartphone Samsung Galaxy",
    "preco": 899.99,
    "qtd_atual": 10
  }
  ```
- **Response** (201):
  ```json
  {
    "id": 1,
    "nome": "Smartphone Samsung Galaxy",
    "preco": 899.99,
    "qtd_atual": 10,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
  ```

#### List All Items
- **GET** `/itens`
- **Description**: Retrieves all items in the catalog
- **Response** (200):
  ```json
  [
    {
      "id": 1,
      "nome": "Smartphone Samsung Galaxy",
      "preco": 899.99,
      "qtd_atual": 10,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
  ```

### Compras Endpoints

#### Create Purchase
- **POST** `/compras`
- **Description**: Creates a purchase with a random GitHub user as buyer
- **Request Body**:
  ```json
  {
    "item_id": 1
  }
  ```
- **Response** (201):
  ```json
  {
    "id": 1,
    "comprador_github_login": "octocat",
    "item_id": 1,
    "created_at": "2024-01-15T12:00:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z",
    "item": {
      "id": 1,
      "nome": "Smartphone Samsung Galaxy",
      "preco": 899.99,
      "qtd_atual": 9
    }
  }
  ```

#### List All Purchases
- **GET** `/compras`
- **Description**: Retrieves all purchase records with item details
- **Response** (200):
  ```json
  [
    {
      "id": 1,
      "comprador_github_login": "octocat",
      "item_id": 1,
      "created_at": "2024-01-15T12:00:00.000Z",
      "updated_at": "2024-01-15T12:00:00.000Z",
      "item": {
        "id": 1,
        "nome": "Smartphone Samsung Galaxy",
        "preco": 899.99,
        "qtd_atual": 9
      }
    }
  ]
  ```

## Error Handling

The API provides comprehensive error handling with appropriate HTTP status codes:

### Validation Errors (422)
```json
{
  "errors": [
    {
      "rule": "required",
      "field": "nome",
      "message": "nome is required"
    }
  ]
}
```

### Not Found Errors (404)
```json
{
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Item with ID 123 not found",
    "details": {
      "item_id": 123
    }
  }
}
```

### Business Logic Errors (422)
```json
{
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Item is out of stock",
    "details": {
      "item_id": 1,
      "current_stock": 0
    }
  }
}
```

### External Service Errors (503)
```json
{
  "error": {
    "code": "GITHUB_API_ERROR",
    "message": "GitHub API is currently unavailable",
    "details": {
      "service": "github"
    }
  }
}
```

## Database Commands

### Migrations
```bash
# Run all pending migrations
node ace migration:run

# Rollback the last batch of migrations
node ace migration:rollback

# Check migration status
node ace migration:status

# Create a new migration
node ace make:migration create_table_name
```

### Seeders
```bash
# Run all seeders
node ace db:seed

# Run a specific seeder
node ace db:seed --files="./database/seeders/ItemSeeder.ts"

# Refresh database and run seeders
node ace migration:refresh --seed

# Create a new seeder
node ace make:seeder ItemSeeder
```

#### Available Seeders

**ItemSeeder**: Populates the database with sample catalog items for testing and development.
- Creates 15 predefined items with realistic product data (smartphones, laptops, accessories, etc.)
- Generates 10 additional random items using the ItemFactory
- Configured to run in both `development` and `testing` environments
- Total of 25 items created per run

Example items included:
- Smartphone Samsung Galaxy S23 ($899.99, Stock: 15)
- Notebook Dell Inspiron 15 ($1299.99, Stock: 8)
- Fone de Ouvido Sony WH-1000XM4 ($349.99, Stock: 25)
- And many more...

## Testing

The application includes comprehensive test coverage for all functionality.

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test files
node ace test tests/functional/items.spec.ts
```

### Test Categories

#### Unit Tests
- Model validation and relationships
- Service layer business logic
- GitHub API integration (mocked)
- Custom exception handling

#### Integration Tests
- API endpoint functionality
- Database operations
- End-to-end purchase flow
- Error scenario handling

## API Testing Collections

### Postman Collection
Import the `Random_Shopping_API.postman_collection.json` file into Postman along with the environment file `Random_Shopping_API.postman_environment.json`.

The collection includes:
- All API endpoints with example requests
- Automated test scripts for response validation
- Environment variables for easy configuration
- Error scenario testing

### Insomnia Collection
Import the `Random_Shopping_API.insomnia_collection.json` file into Insomnia.

The collection includes:
- All API endpoints with example data
- Environment variables for base URL and test data
- Request descriptions and documentation

## Development

### Project Structure
```
app/
├── Controllers/Http/     # HTTP controllers
├── Models/              # Database models
├── Services/            # Business logic services
├── Validators/          # Request validation
└── Exceptions/          # Custom exceptions

database/
├── migrations/          # Database migrations
├── factories/           # Model factories for testing
└── seeders/            # Database seeders

tests/
├── functional/          # Integration tests
└── unit/               # Unit tests

start/
├── routes.ts           # API routes
└── kernel.ts           # Application kernel
```

### Factory Definitions

The application includes factory definitions for generating test data:

**ItemFactory**: Creates realistic item data for testing
- Generates random product names using Faker.js
- Creates prices between $1 and $1000 with 2 decimal places
- Sets stock quantities between 0 and 100 units
- Used by seeders and tests for consistent data generation

**CompraFactory**: Creates purchase records for testing
- Generates valid GitHub-style usernames
- Links to existing items (item_id must be provided)
- Used in conjunction with ItemFactory for complex test scenarios

### Adding New Features

1. **Create Migration**: Define database schema changes
2. **Create Model**: Define data model with relationships
3. **Create Validator**: Add request validation rules
4. **Create Controller**: Implement HTTP request handling
5. **Add Routes**: Define API endpoints
6. **Write Tests**: Add comprehensive test coverage

### Code Style

The project follows AdonisJS conventions:
- Use TypeScript for type safety
- Follow MVC architecture pattern
- Use Lucid ORM for database operations
- Implement proper error handling
- Write comprehensive tests

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3333` |
| `HOST` | Server host | `0.0.0.0` |
| `NODE_ENV` | Environment mode | `development` |
| `APP_KEY` | Application encryption key | Required |
| `DB_CONNECTION` | Database connection | `sqlite` |
| `DRIVE_DISK` | File storage disk | `local` |

## Troubleshooting

### Common Issues

#### Database Connection Error
- Ensure SQLite is properly configured
- Check database file permissions
- Verify migration status

#### GitHub API Rate Limiting
- The API handles rate limiting gracefully
- Implement caching for production use
- Consider using GitHub API tokens for higher limits

#### Port Already in Use
```bash
# Kill process using port 3333
npx kill-port 3333

# Or use a different port
PORT=3334 npm run dev
```

### Debugging

Enable debug mode by setting:
```env
NODE_ENV=development
```

Check application logs for detailed error information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please:
1. Check the troubleshooting section
2. Review the test files for usage examples
3. Open an issue on the repository# random-shop-api
