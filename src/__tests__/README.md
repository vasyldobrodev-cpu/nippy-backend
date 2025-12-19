# Unit Tests Documentation

This directory contains comprehensive unit tests for the backend services and controllers.

## 📁 Test Structure

```
src/__tests__/
├── setup.ts                    # Jest setup and environment configuration
├── helpers/
│   └── mocks.ts                # Reusable mock utilities
├── services/
│   ├── PaymentService.test.ts  # Payment service tests
│   └── EmailService.test.ts    # Email service tests
└── controllers/
    ├── AuthController.test.ts  # Authentication controller tests
    ├── PaymentController.test.ts # Payment controller tests
    └── UserController.test.ts  # User controller tests
```

## 🚀 Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run a specific test file
```bash
npm test -- PaymentService.test.ts
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="should create payment"
```

## 📊 Test Coverage

The test suite covers:

### Services
- ✅ **PaymentService**: Payment creation, retrieval, status updates, refunds, statistics
- ✅ **EmailService**: Email sending, verification emails, password reset emails, connection testing

### Controllers
- ✅ **AuthController**: User registration, login, password reset, email verification
- ✅ **PaymentController**: Payment creation, retrieval, status updates, refunds, statistics
- ✅ **UserController**: Profile management, location updates, account security

## 🧪 Test Utilities

### Mock Helpers (`helpers/mocks.ts`)

The test utilities provide reusable mocks for:

- **Express Request/Response/NextFunction**: `createMockRequest()`, `createMockResponse()`, `createMockNext()`
- **TypeORM Repository**: `createMockRepository()`
- **Query Builder**: `createMockQueryBuilder()`

### Example Usage

```typescript
import { createMockRequest, createMockResponse, createMockNext } from '../helpers/mocks';

const mockRequest = createMockRequest({
  body: { email: 'test@example.com' },
  user: { userId: 'user-123' }
});

const mockResponse = createMockResponse();
const mockNext = createMockNext();
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)

- **Preset**: `ts-jest` for TypeScript support
- **Test Environment**: Node.js
- **Coverage**: Excludes migrations, scripts, and type definition files
- **Timeout**: 10 seconds per test

### Setup File (`setup.ts`)

- Loads test environment variables
- Configures test-specific environment settings
- Sets up global test mocks

## 📝 Writing New Tests

### Service Test Template

```typescript
import { ServiceName } from '../../services/ServiceName';
import { createMockRepository } from '../helpers/mocks';

describe('ServiceName', () => {
  let service: ServiceName;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = createMockRepository();
    service = new ServiceName();
  });

  it('should perform action successfully', async () => {
    // Arrange
    mockRepository.findOne.mockResolvedValue(mockData);

    // Act
    const result = await service.method();

    // Assert
    expect(result).toEqual(expectedResult);
    expect(mockRepository.findOne).toHaveBeenCalledWith(expectedArgs);
  });
});
```

### Controller Test Template

```typescript
import { ControllerName } from '../../controllers/ControllerName';
import { createMockRequest, createMockResponse, createMockNext } from '../helpers/mocks';

describe('ControllerName', () => {
  let controller: ControllerName;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    controller = new ControllerName();
    mockRequest = createMockRequest();
    mockResponse = createMockResponse();
    mockNext = createMockNext();
  });

  it('should handle request successfully', async () => {
    mockRequest.body = { /* test data */ };
    
    await controller.method(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith(expectedResponse);
  });
});
```

## ✅ Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: Mock all external dependencies (database, services, etc.)
3. **Arrange-Act-Assert**: Structure tests clearly with setup, execution, and verification
4. **Descriptive Names**: Use clear test names that describe what is being tested
5. **Coverage**: Aim for high coverage of business logic, not just line coverage
6. **Error Cases**: Test both success and error scenarios

## 🐛 Debugging Tests

### Run tests with verbose output
```bash
npm test -- --verbose
```

### Run a single test file with debugging
```bash
npm test -- --no-coverage PaymentService.test.ts
```

### Use `console.log` in tests (they won't be suppressed)
```typescript
it('should debug test', async () => {
  console.log('Debug info:', mockData);
  // ... test code
});
```

## 📈 Coverage Reports

After running tests with coverage, view the HTML report:
```bash
# Generate coverage
npm test -- --coverage

# Open coverage report (HTML)
open coverage/index.html
```

## 🔍 Common Issues

### Issue: "Cannot find module"
**Solution**: Ensure all imports use relative paths from the test file location.

### Issue: "Mock not working"
**Solution**: Check that mocks are set up in `beforeEach` and cleared in `afterEach`.

### Issue: "Async test timeout"
**Solution**: Increase timeout in test or fix async/await usage.

### Issue: "TypeORM repository not mocked"
**Solution**: Ensure `AppDataSource.getRepository` is properly mocked before creating the service.

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript with Jest](https://jestjs.io/docs/getting-started#using-typescript)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Happy Testing! 🧪**

