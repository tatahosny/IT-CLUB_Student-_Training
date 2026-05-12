# IT Club Management System - Professional Training Platform

An advanced, enterprise-grade training management system designed to streamline academic and technical club operations. This full-stack solution provides real-time attendance tracking, task management, grading, and a high-security anti-fraud system for educational environments.

---

## 🛠️ System Overview

This project is built using a modern full-stack architecture, separating the **Frontend (React/Vite)** from the **Backend (Express/Node.js)** to ensure scalability, security, and performance.

### 👥 User Roles & Dashboards
The system implements a granular Role-Based Access Control (RBAC) system:

*   **Super Admin**: Access to all logs, user management, system settings, and cross-session monitoring.
*   **Admin**: Controls session creation, instructor assignments, and high-level attendance reports.
*   **Instructor**: Creates workshops/lectures, monitors attendance for their sessions, and manages tasks.
*   **Mentor Manager**: Oversees mentors and quality control of the grading process.
*   **Mentor**: Accesses a grading queue to review student tasks and marks attendance on-site using the QR scanner.
*   **Student**: Generates dynamic attendance QR codes, submits tasks, and views academic progress/grades.
*   **OC (Organizational Committee)**: Access to logistical tools and basic monitoring.

---

## 🚀 Key Modules & Functionalities

### 1. 🛡️ High-Security Attendance Engine
The most critical part of the system, designed to prevent "buddy punching" and fraudulent attendance:
*   **Dynamic QR Tokens**: Student QR codes are generated on-the-fly and linked to a specific session and user.
*   **Single-Use Logic**: Once a student's QR is scanned, the token is invalidated immediately.
*   **Device Guard (Anti-Cheat)**:
    *   **Fingerprinting**: Captures a unique ID for each device (combining hardware, browser, and OS data).
    *   **Same-Device Ban**: If a device is used to log into more than one account within a specific window, both accounts are automatically flagged for fraud.
    *   **Auto-Blocking**: Detected fraud results in an automatic 24-hour ban for both accounts and immediate Socket.io alerts to all Admins.

### 2. 📝 Academic Task & Grading System
*   **Criteria-Based Evaluation**: Tasks aren't just graded with a number; mentors score students based on defined criteria (e.g., Accuracy, Performance, Design).
*   **Submission Workflow**: Students can upload multiple files (images, zip, pdf) which are stored securely on the server.
*   **Grading Queue**: Mentors have a dedicated "Inbox" for pending reviews to ensure no task is missed.

### 3. 📱 Progressive Web App (PWA)
*   **Offline Ready**: Critical assets are cached via a Service Worker.
*   **Native Feel**: Includes a `manifest.json` allowing students to "Install" the dashboard on their phone home screen as a standalone app.
*   **Responsive UI**: Optimized for tablets, mobile phones, and desktop monitors.

---

## 💻 Technical Architecture

### Frontend (Root Directory)
*   **Framework**: React 18 + Vite (for ultra-fast development and building).
*   **State Management**: **Zustand** with persistence (stores Auth state and user preferences).
*   **Navigation**: **React Router 6** with Protected and Role-based routes.
*   **Styling**: High-performance Custom CSS with **Glassmorphism** and **Framer Motion** for premium animations.
*   **API Layer**: **Axios** combined with **React Query** for intelligent caching and synchronization.

### Backend (`/server` Directory)
*   **Server**: Node.js + Express.js.
*   **Database ORM**: **Prisma** (Provides type-safe database queries).
*   **Authentication**: **JWT (JSON Web Tokens)** with Access/Refresh token rotation logic.
*   **Real-time**: **Socket.io** for instant attendance updates and security alerts.
*   **Middleware**: Custom middlewares for role validation, fraud detection, and error handling.

---

## 📁 Detailed Directory Structure

```text
├── client/                 # React Frontend
│   ├── src/
│   │   ├── App.jsx         # Main logic, Routing, and Components
│   │   ├── main.jsx        # Entry point & SW Registration
│   │   └── styles/         # Global design system & animations
│   └── public/             # PWA Assets (sw.js, manifest.json, icons)
├── server/                 # Express Backend
│   ├── src/
│   │   ├── controllers/    # Business logic (Auth, Attendance, Tasks)
│   │   ├── routes/         # API Endpoint definitions
│   │   └── middlewares/    # Security & Role guards
│   ├── prisma/             # Database schema (schema.prisma) & Seeds
│   └── uploads/            # Storage for student task files
├── index.html              # HTML Entry
└── vite.config.js          # Vite build configuration
```

---

## 🔧 Installation & Deployment

### Local Setup
1.  **Dependencies**: Run `npm install` in the root folder AND the `server` folder.
2.  **Environment**: Configure the `.env` file in the `server` directory with your `DATABASE_URL` and `JWT_SECRET`.
3.  **Database**: Sync the schema using `npx prisma migrate dev`.
4.  **Run**:
    *   Frontend: `npm run dev` (Root)
    *   Backend: `npm run dev` (inside `server/`)

### GitHub & Git Policy
*   The `node_modules` and `.env` files are automatically ignored via `.gitignore` to keep the repository clean and secure.
*   On a new machine, always run `npm install` to regenerate dependencies.

---

## 📜 License
This system is developed for the **IT Club**. All rights reserved.
