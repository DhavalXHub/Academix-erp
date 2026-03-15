# Academix – College ERP Management System

**Complete Project Documentation & Progress Report**

## 1. Project Overview
"Academix" is a comprehensive Enterprise Resource Planning (ERP) system designed for colleges and universities. It streamlines academic and administrative processes by providing role-based portals for Students, Faculty, and Administrators. The system handles Attendance, Results, Fees/Billing, Quizzes, Announcements, Timetables, and User Management.

## 2. Technology Stack
The project is built using a custom stack emphasizing Vanilla JS and native frontend technologies paired with a modern Node.js backend.

### Frontend
- **HTML5:** Semantic structure for all pages.
- **CSS3:** Custom styling with CSS Variables for theming (Root colors, spacing), mobile-first responsiveness, and Dark Mode toggling using CSS Grid/Flexbox. No external CSS frameworks (Bootstrap/Tailwind) were used; all styles are hand-written.
- **Vanilla JavaScript (ES6+):** DOM manipulation, async/await for API calls, and local storage/session storage for state management (auth, quiz state).

### Backend
- **Node.js:** Runtime environment.
- **Express.js:** Web framework for routing and middleware (MVC Architecture).
- **MongoDB:** Database (connected via Mongoose ODM).

### Key Libraries & Dependencies
- **bcryptjs:** For hashing user passwords securely.
- **jsonwebtoken (JWT):** For secure authentication and session management.
- **cors:** To handle Cross-Origin Resource Sharing.
- **dotenv:** To manage environment variables.
- **pdfkit:** For generating downloadable PDF marksheets dynamically on the server side.

## 3. What Has Been Done Till Now (Implemented Features)

The following modules and interfaces have been fully designed and integrated:

### Core System & Authentication
- **Role-Based Access Control (RBAC):** Distinct roles for Student, Faculty, and Admin.
- **Single Page Login Flow:** A modern, seamless single-page login experience. Users first select their role via visually distinct interactive cards (Student, Faculty, Admin), which then smoothly transitions to the login form for that specific role.
- **JWT Auth & Session Management:** Complete token-based authentication flow with `localStorage` injection for maintaining persistent sessions.
- **Database schemas** mapped to models (User, Student, Attendance, Marks, Quiz, etc.).
- Robust routing and middleware protecting unauthorized access to API endpoints.

### Student Module
- **Student Dashboard (`student-dashboard.html`):** Overview with widgets and analytics charts indicating attendance risks, exam performance, active notices, and upcoming classes.
- **Attendance (`attendance.html`):** Visual calendar and chart representation of the student's monthly attendance records with color-coded safety statuses (Safe/Warning/Critical).
- **Results (`results.html`):** View performance history (Internal/External marks) across semesters with a built-in CGPA calculator and the ability to download a dynamically generated **PDF Marksheet**.
- **Billing (`billing.html`):** View term fees, pending invoices, and a simulated "Pay Now" functionality.
- **Timetable (`timetable.html`):** Interactive, dynamic schedule viewer.
- **Quizzes (`quiz.html`):** Active instant-quiz interface with a server-synced countdown timer and auto-grading on submission or timeout.

### Faculty Module
- **Faculty Dashboard (`faculty-dashboard.html`):** Specialized interface tailored for course management, featuring quick actions (Mark Attendance, Upload Notes) and low-attendance alerts.
- **Attendance Marking (`faculty-attendance.html`):** Interface to select Subject/Date, fetch the enrolled student roster, and bulk-mark Present/Absent status.
- **Grading & Results (`faculty-results.html`):** Interface to fetch class lists per subject/exam and seamlessly enter and save marks.
- **Quiz Management (`faculty-quizzes.html`):** Creation suite for new quizzes, enabling faculty to add MCQ questions, define the correct answers key, and set strict time limits.

### Admin Module
- **Admin Dashboard (`admin-dashboard.html`):** System-wide overview and health statistics (Total Users, Compliance metrics).
- **User Management (`admin-users.html`):** Interface to view all users, filter by assigned roles, and efficiently add/edit/delete distinct Student and Faculty accounts.

### Shared / Global Components
- **Announcements / Notice Board (`announcements.html`):** Global and department-level message boards categorizing alerts as Urgent, Academic, and Events.
- **Responsive Layout:** A modular left-sidebar layout with collapsible functionality, smooth hover effects, and a clean professional blue-and-white enterprise theme across all interfaces.

## 4. Setup & Execution Instructions

### Prerequisites
- Node.js installed.
- MongoDB installed locally or a MongoDB connection string.

### Steps to Run
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Configure Environment:**
   Ensure a `.env` file exists in the root directory:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
3. **Database Seeding (Optional but recommended):**
   ```bash
   node server/seeder.js
   ```
   *(Creates default Admin/Student/Faculty accounts)*
4. **Start the Server:**
   ```bash
   npm run dev
   ```
5. **Access the Application:**
   Open browser and go to `http://localhost:5000` (or `http://localhost:<PORT>`). Wait for port conflicts to be resolved if `EADDRINUSE` occurs (kill any existing processes on the port).

### Default Login Credentials (If Seeded)
- **Student**: `student@academix.edu` / `password123`
- **Faculty**: `faculty@academix.edu` / `password123`
- **Admin**: `admin@academix.edu` / `password123`

## 5. Future Enhancements Planned
- Complete AI Performance Predictor using historical data.
- Live library module for book tracking.
- Internal Messaging System for direct Faculty-to-Student chat.
- Real Payment Gateway integration for the billing module.
