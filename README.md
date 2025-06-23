# Shifts App - An Intelligent Shift Scheduling System

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Sequelize](https://img.shields.io/badge/Sequelize-52B0E7?style=for-the-badge&logo=sequelize&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

This is a full-stack web application designed to automate and simplify the complex process of creating and managing work schedules. The project tackles the challenges of manual scheduling by offering a powerful algorithm for automatic staff assignment and an intuitive interface for manual adjustments.

## ✨ Key Features

-   **Automatic Schedule Generation:** The core of the application is a sophisticated algorithm that analyzes employee availability, constraints, position requirements, and legal rules to generate an optimized weekly schedule with a single click.
-   **Drag & Drop Manual Editor:** For fine-tuning and handling exceptions, managers have access to an intuitive drag-and-drop interface to manually assign or re-assign employees to different shifts.
-   **Role-Based Access Control (RBAC):** Clear separation of permissions for **Admins** (full system control) and **Employees** (viewing their schedule, submitting constraints).
-   **Employee Constraints Management:** Employees can submit their work preferences and unavailability, which are automatically factored into the schedule generation process.
-   **Core System Configuration:** Flexible setup of multiple **Work Sites**, **Positions**, and **Shifts**, allowing the system to be tailored to the specific needs of any organization.
-   **JWT Authentication:** Secure user registration and login functionality using JSON Web Tokens, ensuring protected routes and data.
-   **Responsive Design:** The user interface is fully responsive, providing a seamless experience on both desktop and mobile devices.

## 🛠️ Tech Stack

<table width="100%">
  <tr valign="top">
    <td width="50%">
      <h3>Frontend</h3>
      <ul>
        <li><b>Framework:</b> React</li>
        <li><b>Build Tool:</b> Vite</li>
        <li><b>State Management:</b> Redux Toolkit</li>
        <li><b>Routing:</b> React Router DOM</li>
        <li><b>UI Library:</b> React-Bootstrap</li>
        <li><b>Styling:</b> CSS Modules, PostCSS</li>
      </ul>
    </td>
    <td width="50%">
      <h3>Backend</h3>
      <ul>
        <li><b>Runtime:</b> Node.js</li>
        <li><b>Framework:</b> Express</li>
        <li><b>ORM:</b> Sequelize</li>
        <li><b>Database:</b> PostgreSQL</li>
        <li><b>Authentication:</b> JWT (Passport.js)</li>
      </ul>
    </td>
  </tr>
</table>

## 🏛️ Architecture

### Frontend
The frontend is architected using the **Feature-Sliced Design (FSD)** methodology. This modern approach provides:
-   **High Scalability:** New features can be added in isolation without affecting existing code.
-   **Strong Modularity:** A clear and logical separation of code into layers (`shared`, `entities`, `features`, `widgets`).
-   **Excellent Maintainability:** The codebase is easy to navigate, understand, and debug.

### Backend
The backend follows a classic **Layered Architecture** pattern, separating concerns into distinct modules:
-   **Routes:** Define the API endpoints and direct incoming HTTP requests to the appropriate controllers.
-   **Controllers:** Handle request validation and data extraction, then call the relevant service logic. They are responsible for formatting and sending the HTTP response.
-   **Services:** Contain all the core business logic, including the complex schedule generation algorithm. They interact with the database via the Sequelize ORM.
-   **Models:** Define the database schema and relationships using Sequelize.

## 🚀 Getting Started

### Prerequisites
-   Node.js (v18.x or later)
-   npm or yarn
-   PostgreSQL instance running
-   Git

