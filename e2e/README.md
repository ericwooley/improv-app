# End-to-End Testing with Playwright

This directory contains end-to-end tests for the application using Playwright with TypeScript. The tests follow the Page Object Model pattern for better maintainability and reusability.

## Directory Structure

```
e2e/
├── pages/              # Page objects
│   ├── BasePage.ts     # Base page with common functionality
│   ├── LoginPage.ts    # Login page object
│   └── ...             # Other page objects
├── components/         # Component objects
│   ├── Alert.ts        # Alert component object
│   ├── Button.ts       # Button component object
│   ├── Checkbox.ts     # Checkbox component object
│   ├── TextField.ts    # TextField component object
│   └── ...             # Other component objects
└── tests/              # Test files
    ├── login.spec.ts   # Login page tests
    └── ...             # Other test files
```

## Page Object Model

The Page Object Model is a design pattern that creates an object repository for storing all web elements. It helps reduce code duplication and improves test maintenance.

### BasePage

The `BasePage` class provides common functionality for all page objects:

- Navigation
- Waiting for elements
- Checking element visibility
- Getting element text

### Page Objects

Page objects represent pages in the application and provide methods to interact with them:

- `LoginPage`: Handles interactions with the login page
- Other page objects will be added as needed

### Component Objects

Component objects represent reusable UI components:

- `Alert`: For alert/message components
- `Button`: For button components
- `Checkbox`: For checkbox components
- `TextField`: For text input components
- Other component objects will be added as needed

## Test IDs

All components should have test IDs following this convention:

- For components: `data-testid="component-name-element-purpose"`
- For pages: `data-testid="page-name-section-element"`

Examples:
- `data-testid="login-email-input"`
- `data-testid="login-terms-checkbox"`
- `data-testid="login-submit-button"`
- `data-testid="login-error-alert"`

## Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test e2e/tests/login.spec.ts

# Run tests in UI mode
npx playwright test --ui
```

## Debugging

```bash
# Run tests in debug mode
npx playwright test --debug

# Use Playwright Inspector
PWDEBUG=1 npx playwright test
```
