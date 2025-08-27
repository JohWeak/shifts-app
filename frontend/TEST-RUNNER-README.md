# 🧪 Interactive Test Runner

A command-line tool for interactively running Jest test suites for project features.

This runner provides a simple menu to select specific tests, run all tests at once, and view a clear summary of the
results.

## 🚀 How to Start

Ensure you are in the `frontend` directory of the project.

**On Windows:**

```bash
node test-runner.js
```

**On Linux/macOS:**

```bash
./test-runner.js
```

*(If you get a "permission denied" error, run `chmod +x test-runner.js` once to make the script executable.)*

## 🕹️ Usage & Controls

Once started, the runner will display a menu of available test suites.

- **Enter a number (1-8)**: Runs the tests for the corresponding feature.
- **Enter `0`**: Runs **all** available test suites sequentially and displays a final summary.
- **Enter `exit`**: Quits the test runner.
- **Press `Enter` (on its own)**: After tests complete, this will return you to the main menu.
- **`Ctrl+C`**: Forcefully stops the runner at any time.

## 📋 Available Test Suites

The following test suites can be selected from the main menu:

| #     | Feature Name               | Description                                                 |
|-------|----------------------------|-------------------------------------------------------------|
| **0** | 🚀 **Test ALL features**   | Runs all available feature tests.                           |
| **1** | 🔐 **Authentication**      | Test login, logout, session management, security.           |
| **2** | 👥 **Employee Management** | Test employee CRUD operations, modals, filters, pagination. |
| **3** | 📅 **Schedule Management** | Test schedule generation, employee assignments, drag-drop.  |
| **4** | 📊 **Admin Dashboard**     | Test metrics display, overview cards, navigation.           |
| **5** | 🏢 **Workplace Settings**  | Test work sites, positions, shifts configuration.           |
| **6** | 👤 **Employee Dashboard**  | Test personal dashboard, stats, quick actions.              |
| **7** | 📋 **Employee Schedule**   | Test schedule viewing, personal calendar, shift details.    |
| **8** | ✋ **Employee Requests**    | Test time-off requests, shift changes, approvals.           |

## ✨ Key Features

- **Interactive Menu**: Easily select which tests to run without typing long commands.
- **Detailed Logging**: See the full, colored output from Jest for every test run.
- **"All In One" Mode**: Run all tests and get a concise summary report, perfect for checking everything before a
  commit.
- **Cross-Platform**: Works on Windows, macOS, and Linux.
- **Simple Extensibility**: Easily add new test suites to the runner.

## 💡 How to Add a New Test Suite

To make a new feature's test suite available in the runner:

1. Create your test file (e.g., `src/features/new-feature/index.test.js`).
2. Open the `test-runner.js` script.
3. Add a new entry to the `features` constant at the top of the file. Follow the existing format:

   ```javascript
   // test-runner.js

   const features = {
       // ... existing features
       'new-feature-key': { // a unique key
           name: '🌟 New Feature', // display name with an emoji
           path: 'new-feature/index.test.js', // path relative to src/features/
           description: 'A short description of what this suite tests.',
           category: 'Some Category',
       },
   };
   ```
4. Save the file. The new option will automatically appear in the menu the next time you run the script.

## 📁 File Structure

```
frontend/
├── test-runner.js              # The main runner script
├── TEST-RUNNER-README.md       # This documentation file
├── src/
│   └── features/
│       ├── auth/
│       │   └── index.test.js   # Tests for Authentication
│       ├── admin-employee-management/
│       │   └── index.test.js   # Tests for Employee Management
│       └── ...                 # Other feature folders with their tests
└── package.json
```

## 🐛 Troubleshooting

1. **"Cannot find module" Error**: Make sure you have run `npm install` and that you are executing the script from the
   `frontend` directory.
2. **Permission Denied (Linux/macOS)**: Run `chmod +x test-runner.js` to grant execute permissions.
3. **Tests Fail Unexpectedly**: Try running the test command directly to isolate the issue:
   `npm test -- src/features/feature-name/index.test.js`.

---