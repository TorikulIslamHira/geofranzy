# Testing Documentation

## Overview
This document describes the testing setup and strategies for both the web and mobile applications.

## Web App Testing (Vitest)

### Setup
- **Test Runner**: Vitest
- **Test Utilities**: React Testing Library
- **Environment**: jsdom (simulates browser DOM)

### Running Tests
```bash
cd web
npm test              # Run tests in watch mode
npm run test:ui       # Run tests with UI
npm run test:coverage # Generate coverage report
```

### Test Files Location
- Unit tests: `web/src/tests/`
- Component tests: `web/src/tests/components/`
- Service tests: `web/src/tests/services/`
- Store tests: `web/src/tests/store/`
- Utils tests: `web/src/tests/utils/`

### Coverage Goals
- Statements: 80%+
- Branches: 80%+
- Functions: 80%+
- Lines: 80%+

## Mobile App Testing (Jest)

### Setup
- **Test Runner**: Jest
- **Test Utilities**: React Native Testing Library
- **Preset**: react-native

### Running Tests
```bash
npm test              # Run all tests
npm test -- --watch   # Run in watch mode
npm test -- --coverage # Generate coverage report
```

### Test Files Location
- Unit tests: `src/tests/`
- Screen tests: `src/tests/screens/`
- Service tests: `src/tests/services/`
- Utils tests: `src/tests/utils/`

### Coverage Goals
- Statements: 70%+
- Branches: 70%+
- Functions: 70%+
- Lines: 70%+

## Test Structure

### Unit Tests
Test individual functions and utilities in isolation:
- Distance calculations
- Location formatting
- Data transformations
- Helper functions

### Component Tests
Test React components:
- Render correctly
- Handle user interactions
- Display data properly
- Call callbacks appropriately

### Integration Tests
Test feature flows:
- Authentication flow
- Location tracking
- Friend management
- SOS alert system

### Service Tests
Test Firebase service integrations:
- Firestore operations
- Authentication
- Storage operations
- Real-time listeners

## Mocking Strategy

### Web App Mocks
- Firebase SDK: `web/src/tests/mocks/firebase.ts`
- Test data: `web/src/tests/mocks/mockData.ts`
- Browser APIs: Geolocation, matchMedia

### Mobile App Mocks
- expo-location
- expo-notifications
- react-native-maps
- Firebase services
- AsyncStorage

## Best Practices

1. **Test Naming**: Use descriptive names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests clearly
3. **Isolation**: Each test should be independent
4. **Coverage**: Aim for high coverage but focus on critical paths
5. **Fast Tests**: Keep tests fast by mocking external dependencies
6. **Readable**: Write tests that serve as documentation

## Example Test

```typescript
import { describe, it, expect } from 'vitest';
import { calculateDistance } from '@utils/location';

describe('calculateDistance', () => {
  it('should return 0 for same coordinates', () => {
    // Arrange
    const lat = 40.7128;
    const lon = -74.0060;
    
    // Act
    const distance = calculateDistance(lat, lon, lat, lon);
    
    // Assert
    expect(distance).toBe(0);
  });
});
```

## Current Test Coverage

### Web App
- ✅ Location utilities
- ✅ Zustand stores
- ✅ Layout component
- ⏳ Services (in progress)
- ⏳ Pages (in progress)

### Mobile App
- ✅ Distance utilities
- ⏳ Location service (in progress)
- ⏳ Screens (in progress)
- ⏳ Context providers (in progress)

## Next Steps

1. Complete service layer tests
2. Add page/screen component tests
3. Write integration tests for auth flow
4. Add E2E tests with Playwright (web) / Detox (mobile)
5. Setup CI/CD pipeline for automated testing
6. Add visual regression tests
7. Performance testing with Lighthouse

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
