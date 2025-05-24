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

shifts-app/
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── core/
│   │   │   ├── scheduling/
│   │   │   └── constraints/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   └── package.json
└── frontend/
├── src/
└── package.json
