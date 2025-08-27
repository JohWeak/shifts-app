# Shifts App - Intelligent Work Schedule Planner

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Shifts App is a full-stack web application designed to automate and simplify the complex process of managing employee
work schedules.

<br>

## 🎯 About The Project

Shifts App solves a common problem for managers: the time-consuming and error-prone task of manually creating and
adjusting work schedules. It provides a centralized platform for administrators to build schedules intelligently and for
employees to view their assignments and manage their requests.

### ✨ Key Features

* 🧠 **Intelligent Schedule Generation:** Automatically create optimized schedules based on employee availability and
  pre-defined shift requirements, saving hours of manual work.
* ↔️ **Drag & Drop Interface:** A modern, intuitive calendar interface allows administrators to easily make manual
  adjustments and reassign shifts.
* 🔐 **Role-Based Access Control:** A secure authentication system with distinct roles and permissions for *
  *Administrators** and **Employees**.
* 📊 **Comprehensive Admin Dashboard:** Manage employees, configure work sites and positions, and oversee all scheduling
  operations from a single control panel.
* 👤 **Employee Self-Service Portal:** Empowers employees to view their personal schedules, submit time-off requests, and
  track their work hours.

## 🛠️ Tech Stack

This project is built with the MERN stack and containerized with Docker for easy setup and deployment.

| Area              | Technology                                   | Description                                                     |
| ----------------- | -------------------------------------------- | --------------------------------------------------------------- |
| **Frontend**      | **React, Redux Toolkit**               | A fast, responsive UI with efficient state management.          |
| **Backend**       | **Node.js, Express.js**                      | A robust and scalable server-side foundation.                   |
| **Database**      | **MySQL**                                    | An SQL database for storing all application data.     |
| **Authentication**| **JWT, bcrypt**                              | Secure, token-based authentication and password hashing.        |
| **Testing**       | **Jest, React Testing Library**              | Unit and integration tests to ensure code quality and stability.|

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

Make sure you have the following installed on your machine:

* [Node.js](https://nodejs.org/en/) (v18 or later recommended)
*

### 🐳 Installation with Docker (Recommended)

This is the easiest way to get started, as it sets up the frontend, backend, and database in one command.

### 🔧 Manual Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/JohWeak/shifts-app.git
   cd shifts-app
   ```
2. **Set up and run the Backend:**
   ```bash
   cd backend
   npm install
   # Create and configure your .env file
   npm run dev
   ```
3. **Set up and run the Frontend (in a new terminal window):**
   ```bash
   cd frontend
   npm install
   # Create and configure your .env file
   npm run dev
   ```

## 🗺️ Roadmap

Here are some features planned for the future:

- [ ] **Real-time Notifications:** Implement WebSocket or email notifications for schedule changes and requests.
- [ ] **Google Calendar Integration:** Allow employees to sync their work schedule with their personal Google Calendar.
- [ ] **Reporting Module:** Add functionality to export schedules and work reports as PDF or Excel files.
- [ ] **Mobile Application:** Develop a native mobile app using React Native for on-the-go access.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any
contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
