# Shifts - Shift Scheduling Application

A web application for automatic shift scheduling management, built for Israeli labor law compliance.

## Features

- Employee management
- Shift scheduling with constraints
- Israeli labor law compliance
- Automatic schedule generation
- Admin and employee interfaces

## Tech Stack

- **Backend**: Node.js, Express, Sequelize, MySQL
- **Frontend**: React, Redux, Axios
- **Authentication**: JWT

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
3. Set up environment variables in backend/.env
4.   Run the application:
   # Backend
   cd backend && npm start
   # Frontend
   cd frontend && npm start


# Project Structure

frontend/
┣ public/
┃ ┣ favicon.ico
┃ ┣ index.html
┃ ┣ logo192.png
┃ ┣ logo512.png
┃ ┣ manifest.json
┃ ┗ robots.txt
┣ src/
┃ ┣ components/
┃ ┃ ┣ admin/
┃ ┃ ┃ ┣ common/
┃ ┃ ┃ ┃ ┣ AlertMessage.js
┃ ┃ ┃ ┃ ┣ ConfirmationModal.js
┃ ┃ ┃ ┃ ┣ ErrorBoundary.js
┃ ┃ ┃ ┃ ┣ ErrorBoundaryHook.js
┃ ┃ ┃ ┃ ┗ LoadingSpinner.js
┃ ┃ ┃ ┣ schedule/
┃ ┃ ┃ ┃ ┣ CompareAlgorithmsModal.js
┃ ┃ ┃ ┃ ┣ DeleteConfirmationModal.js
┃ ┃ ┃ ┃ ┣ EmployeeSelectionModal.js
┃ ┃ ┃ ┃ ┣ GenerateScheduleModal.js
┃ ┃ ┃ ┃ ┣ NoPositionsMessage.js
┃ ┃ ┃ ┃ ┣ PositionScheduleEditor.js
┃ ┃ ┃ ┃ ┣ ScheduleActions.js
┃ ┃ ┃ ┃ ┣ ScheduleCell.js
┃ ┃ ┃ ┃ ┣ ScheduleDetailsView.js
┃ ┃ ┃ ┃ ┣ ScheduleList.js
┃ ┃ ┃ ┃ ┗ ScheduleOverviewTable.js
┃ ┃ ┃ ┣ AdminDashboard.css
┃ ┃ ┃ ┣ AdminLayout.css
┃ ┃ ┃ ┣ AdminLayout.js
┃ ┃ ┃ ┣ AlgorithmSettings.js
┃ ┃ ┃ ┣ Dashboard.js
┃ ┃ ┃ ┣ EmployeeManagement.js
┃ ┃ ┃ ┣ Reports.js
┃ ┃ ┃ ┣ ScheduleManagement.css
┃ ┃ ┃ ┣ ScheduleManagement.js
┃ ┃ ┃ ┗ SystemSettings.js
┃ ┃ ┣ auth/
┃ ┃ ┃ ┣ LoginPage.css
┃ ┃ ┃ ┗ LoginPage.js
┃ ┃ ┗ employee/
┃ ┃   ┣ constraints/
┃ ┃ ┃ ┃ ┣ ConstraintsSchedule.css
┃ ┃ ┃ ┃ ┗ ConstraintsSchedule.js
┃ ┃   ┣ schedule/
┃ ┃ ┃ ┃ ┣ WeeklySchedule.css
┃ ┃ ┃ ┃ ┗ WeeklySchedule.js
┃ ┃   ┣ Dashboard.css
┃ ┃   ┗ Dashboard.js
┃ ┣ constants/
┃ ┃ ┗ scheduleConstants.js
┃ ┣ hooks/
┃ ┃ ┣ useScheduleAPI.js
┃ ┃ ┣ useScheduleOperations.js
┃ ┃ ┗ useScheduleState.js
┃ ┣ i18n/
┃ ┃ ┗ messages.js
┃ ┣ redux/
┃ ┃ ┣ actions/
┃ ┃ ┃ ┗ authActions.js
┃ ┃ ┣ reducers/
┃ ┃ ┃ ┗ authReducer.js
┃ ┃ ┗ store.js
┃ ┣ utils/
┃ ┃ ┗ scheduleUtils.js
┃ ┣ App.css
┃ ┣ App.js
┃ ┣ index.css
┃ ┣ index.js
┃ ┗ logo.svg
┣ .gitignore
┣ package-lock.json
┣ package.json
┗ README.md

backend/
┣ src/
┃ ┣ config/
┃ ┃ ┣ db.config.js
┃ ┃ ┗ scheduling-constraints.js
┃ ┣ constants/
┃ ┃ ┗ algorithms.js
┃ ┣ controllers/
┃ ┃ ┣ auth.controller.js
┃ ┃ ┣ constraint.controller.js
┃ ┃ ┣ employee-recommendation.controller.js
┃ ┃ ┣ employee.controller.js
┃ ┃ ┣ position.controller.js
┃ ┃ ┣ schedule-settings.controller.js
┃ ┃ ┣ schedule.controller.js
┃ ┃ ┣ shift.controller.js
┃ ┃ ┣ test.controller.js
┃ ┃ ┗ worksite.controller.js
┃ ┣ middlewares/
┃ ┃ ┗ auth.middleware.js
┃ ┣ migrations/
┃ ┃ ┣ 001-simplify-constraints.js
┃ ┃ ┣ 002-fix-shift-columns.js
┃ ┃ ┗ add_default_position_to_employees.sql
┃ ┣ models/
┃ ┃ ┣ constraints/
┃ ┃ ┃ ┣ employee-constraint.model.js
┃ ┃ ┃ ┣ index.js
┃ ┃ ┃ ┗ legal-constraint.model.js
┃ ┃ ┣ core/
┃ ┃ ┃ ┣ employee-qualification.model.js
┃ ┃ ┃ ┣ employee.model.js
┃ ┃ ┃ ┣ index.js
┃ ┃ ┃ ┗ worksite.model.js
┃ ┃ ┣ scheduling/
┃ ┃ ┃ ┣ index.js
┃ ┃ ┃ ┣ position.model.js
┃ ┃ ┃ ┣ schedule-assignment.model.js
┃ ┃ ┃ ┣ schedule-period.model.js
┃ ┃ ┃ ┣ schedule-settings.model.js
┃ ┃ ┃ ┣ schedule.model.js
┃ ┃ ┃ ┣ shift.model.js
┃ ┃ ┃ ┗ workday.model.js
┃ ┃ ┣ associations.js
┃ ┃ ┗ index.js
┃ ┣ routes/
┃ ┃ ┣ auth.routes.js
┃ ┃ ┣ constraint.routes.js
┃ ┃ ┣ employee.routes.js
┃ ┃ ┣ position.routes.js
┃ ┃ ┣ schedule-settings.routes.js
┃ ┃ ┣ schedule.routes.js
┃ ┃ ┣ shift.routes.js
┃ ┃ ┣ test.routes.js
┃ ┃ ┗ worksite.routes.js
┃ ┣ scripts/
┃ ┃ ┣ check-indexes.sql
┃ ┃ ┣ clear-sequelize-cache.js
┃ ┃ ┣ createAdmin.js
┃ ┃ ┣ run-migration.js
┃ ┃ ┣ seedData.js
┃ ┃ ┣ seedLegalConstraints.js
┃ ┃ ┣ seedScheduleData.js
┃ ┃ ┣ test-all-algorithms.js
┃ ┃ ┣ test-new-constraints.js
┃ ┃ ┣ test-routes.js
┃ ┃ ┣ test-strict-schedule.sql
┃ ┃ ┣ testConnection.js
┃ ┃ ┣ testRecommendations.js
┃ ┃ ┣ testRecommendationsDebug.js
┃ ┃ ┗ testStrictGeneration.js
┃ ┣ seeders/
┃ ┃ ┣ assign-default-positions.js
┃ ┃ ┗ assign_default_positions.sql
┃ ┣ services/
┃ ┃ ┣ cp-sat-bridge.service.js
┃ ┃ ┣ cp_sat_optimizer.py
┃ ┃ ┣ employee-recommendation.service.js
┃ ┃ ┣ rest-calculator.service.js
┃ ┃ ┗ schedule-generator.service.js
┃ ┣ temp/
┃ ┣ utils/
┃ ┃ ┣ pdfGenerator.js
┃ ┃ ┗ testPDFGenerator.js
┃ ┣ server.js
┃ ┣ test_schedule_en.pdf
┃ ┗ test_schedule_ru.pdf
┣ temp/
┣ .env
┣ package-lock.json
┣ package.json
┗ test-recommendations.js