# Academix ERP

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MIT License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)
![Active Status](https://img.shields.io/badge/Status-Active-brightgreen.svg?style=for-the-badge)

> **College ERP Management System**

A full-stack web application for managing students, faculty, and admin operations including attendance, assignments, quizzes, messaging, and analytics.

---

## 🚀 Live Demo

**[👉 Try Academix ERP Here 👈](#)** *(Placeholder link – update with your deployment URL)*

---

## 📌 Key Highlights

- **Full-stack MERN Application:** Built with powerful, scaleable, and modern technologies.
- **Role-based Access Control:** Distinct custom experiences for Admins, Faculty, and Students.
- **Real-time Engine:** Integrated Socket.io for instant messaging capabilities.

---

## ✨ Features

- **Role-based Authentication:** Secure access for Student, Faculty, and Admin roles.
- **Student Dashboard:** Track attendance, view results, and manage enrolled courses.
- **Faculty Panel:** Effortless attendance marking, and assignment/quiz management.
- **Admin Panel:** Comprehensive user management and system-wide analytics.
- **Attendance Management System:** Track and record student attendance efficiently.
- **Assignment & Quiz System:** Create, submit, and grade assignments and quizzes.
- **Messaging System:** Real-time communication between users.
- **Finance / Fee Management:** Simplified administration of student fees and finances.
- **Analytics Dashboard:** Graphical insights into system usage, performance, and data.

---

## 🛠 Tech Stack

### Frontend
- **React.js** - UI Library
- **Vite** - Build Tool
- **HTML & CSS** - Structure & Styling

### Backend
- **Node.js** - JavaScript Runtime
- **Express.js** - Web Framework

### Database & Realtime
- **MongoDB** - NoSQL Database
- **Socket.io** - Real-time Messaging

---

## 🏗 System Architecture

The application follows a standard Client-Server Architecture:
- **Client:** A React-based SPA served via Vite, managing local states and communicating with the server via REST APIs and WebSockets.
- **Server:** An Express.js REST API node server handling business logic, authenticating endpoints via JWT, and emitting real-time events.
- **Database:** MongoDB documents modeling out Users, Courses, Attendance, Assignments, and Messages.

---

## 🔌 API Overview

Here are some of the primary API endpoints exposed by the backend:
- `POST /auth/login` - Authenticate users and receive a JWT.
- `GET /users` - Fetch user details (Admin only).
- `GET /courses` - Retrieve all enrolled or available courses.
- `POST /attendance` - Mark attendance for students (Faculty).
- `GET /messages` - Fetch chat history for real-time views.

---

## 📂 Folder Structure

```text
Academix/
├── client/                     # Frontend Workspace (React + Vite)
│   ├── public/                 # Static Assets
│   ├── src/
│   │   ├── components/         # Reusable UI Components
│   │   ├── pages/              # Page Components (Dashboards, Login, etc.)
│   │   ├── assets/             # Images, Icons, CSS
│   │   ├── App.jsx             # Main App Component
│   │   └── main.jsx            # Entry Point
│   └── package.json            # Frontend Dependencies
│
├── server/                     # Backend Workspace (Node.js + Express)
│   ├── controllers/            # Request Handlers
│   ├── models/                 # Mongoose Database Models
│   ├── routes/                 # API Endpoints
│   ├── middleware/             # Custom Express Middleware (e.g., Auth)
│   ├── server.js               # Main Server Entry Point
│   └── package.json            # Backend Dependencies
│
├── .env                        # Environment Variables
├── package.json                # Root Package Configurations
└── README.md                   # Project Documentation
```

---

## 🚀 Installation Steps

Follow these steps to set up the project locally on your machine.

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/) installed and running locally, or a MongoDB Atlas URI.

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/academix-erp.git
cd academix-erp
```

### 2. Frontend Setup
```bash
cd client
npm install
```

### 3. Backend Setup
```bash
# Open a new terminal and navigate to the project root
cd server
npm install
```

---

## ⚙️ Environment Variables

Create a `.env` file in the **root** folder (or inside the `server/` folder depending on your setup) and add the following:

```env
# Server Configuration
PORT=5000                                           # The port where the backend server runs

# Database Configuration
MONGO_URI=mongodb://localhost:27017/academix_db     # Your MongoDB connection string

# JWT Secret Key
JWT_SECRET=your_super_secret_jwt_key                # Secret string for signing JWT tokens

# Socket.io Configuration (Optional based on implementation)
CORS_ORIGIN=http://localhost:5173                   # URL for frontend to allow realtime access
```

---

## 🏃‍♂️ How to Run Project

You will need two terminal windows to run the frontend and backend concurrently.

### Run Backend (Server)
```bash
cd server
npm run dev
# or: node server.js
```
*The server should now be running on http://localhost:5000*

### Run Frontend (Client)
```bash
cd client
npm run dev
```
*The frontend should now be accessible at http://localhost:5173 (Vite default)*

*(Alternatively, you can configure a single script in the root package.json to run both using `concurrently` if available).*

---

## 📸 Screenshots

> **Note:** Replace the placeholders below with actual screenshots of your project.

| Login Page | Student Dashboard |
| :---: | :---: |
| ![Login Page Placeholder](https://via.placeholder.com/600x350?text=Login+Page) | ![Student Dashboard Placeholder](https://via.placeholder.com/600x350?text=Student+Dashboard) |

| Faculty Attendance Marker | Admin Analytics |
| :---: | :---: |
| ![Faculty Attendance Placeholder](https://via.placeholder.com/600x350?text=Faculty+Panel) | ![Admin Analytics Placeholder](https://via.placeholder.com/600x350?text=Admin+Analytics) |

---

## 🔮 Future Improvements

- Add email/SMS notifications for important alerts.
- Implement a comprehensive grading rubric system.
- Add payment gateway integration for direct fee processing.
- Build a native mobile app companion using React Native.
- Introduce AI-based insights for student performance prediction.

---

## 🧑‍💻 Author Details

> **Built with ❤️ by [Your Name / Team Name]**

- 🌐 **Website:** [yourwebsite.com](https://yourwebsite.com)
- 🐙 **GitHub:** [@your-github-username](https://github.com/your-github-username)
- 💼 **LinkedIn:** [Your Name](https://linkedin.com/in/yourprofile)
- 📧 **Email:** [your.email@example.com](mailto:your.email@example.com)

---

*If you found this project helpful, please consider leaving a ⭐ on the repository!*
