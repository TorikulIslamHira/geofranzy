# Contributing to Geofranzy

Thank you for your interest in contributing to Geofranzy! This document provides guidelines and instructions for contributing to the project.

## Project Structure

The project follows a modular, organized structure:

```
geofranzy-rn/
├── src/                    # Source code
│   ├── components/        # Reusable UI components
│   ├── context/           # React Context providers
│   ├── hooks/             # Custom React hooks
│   ├── navigation/        # Navigation configuration
│   ├── screens/           # Screen components
│   ├── services/          # Business logic & API calls
│   ├── theme/             # Design system (colors, fonts, spacing)
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Helper functions
├── firebase/              # Firebase Cloud Functions
├── mcp-servers/           # MCP integration
├── scripts/               # Automation scripts
├── docs/                  # Documentation
└── assets/                # Static assets
```

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/geofranzy-rn.git
   cd geofranzy-rn
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase credentials
   ```

4. **Start development server**
   ```bash
   npm start
   ```

## Coding Standards

### TypeScript
- Use TypeScript for all new files
- Define proper types in `src/types/`
- Avoid using `any` type
- Use interfaces for object shapes

### Imports
Use path aliases for cleaner imports:
```typescript
// Good
import { useAuth } from '@context';
import { Colors } from '@theme';

// Avoid
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../theme/theme';
```

Available aliases:
- `@/*` - src folder
- `@components/*` - components folder
- `@context/*` - context folder
- `@hooks/*` - hooks folder
- `@navigation/*` - navigation folder
- `@screens/*` - screens folder
- `@services/*` - services folder
- `@theme/*` - theme folder
- `@utils/*` - utils folder
- `@types/*` - types folder

### File Naming
- Components: `PascalCase.tsx` (e.g., `MapScreen.tsx`)
- Utilities: `camelCase.ts` (e.g., `distance.ts`)
- Types: `camelCase.ts` or `PascalCase.ts` (e.g., `index.ts`)
- Tests: `ComponentName.test.tsx`

### Component Structure
```typescript
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing } from '@theme';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  title: {
    color: Colors.text.primary,
  },
});

export default MyComponent;
```

### Services
- Keep business logic separate from UI components
- Use async/await for asynchronous operations
- Handle errors gracefully
- Export functions from index.ts

### Context
- Use Context for global state (auth, location)
- Provide custom hooks (e.g., `useAuth`, `useLocation`)
- Keep context focused on a single responsibility

## Git Workflow

### Branching Strategy
- `main` - Production-ready code
- `develop` - Development branch
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Commit Messages
Follow conventional commits:
```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```
feat(auth): add Google sign-in
fix(location): resolve GPS accuracy issue
docs(readme): update setup instructions
```

### Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes
3. Write or update tests
4. Ensure code follows style guidelines
5. Update documentation if needed
6. Commit with clear messages
7. Push to your branch
8. Create a pull request to `develop`

### PR Checklist
- [ ] Code follows project conventions
- [ ] Tests pass (`npm test`)
- [ ] No console warnings or errors
- [ ] Documentation updated
- [ ] Tested on iOS and Android
- [ ] No merge conflicts

## Testing

- Write tests for new features
- Update existing tests when modifying code
- Aim for high test coverage
- Test on both iOS and Android platforms

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## Documentation

When adding new features:
1. Update relevant documentation in `/docs`
2. Add JSDoc comments to functions
3. Update README if necessary
4. Add type definitions to `src/types/`

## Code Review

All contributions require code review:
- Be respectful and constructive
- Focus on code, not the person
- Explain reasoning behind suggestions
- Learn from feedback

## Questions?

If you have questions:
- Open an issue on GitHub
- Check existing documentation in `/docs`
- Review the README.md

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

---

**Thank you for contributing to Geofranzy!** 🎉
