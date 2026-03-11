# Attendify – Intelligent Attendance & Academic Management Platform

Attendify is a multi-tenant, AI-powered academic management system built on the MERN stack. It enables institutions to manage attendance, assessments, marks, leave requests, feedback, and student performance—all through role-based portals for Super Admins, Admins, Teachers, Students, and Parents.

**Live Demo:** [https://attendify-roan.vercel.app/](https://attendify-roan.vercel.app/)

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [User Roles & Portals](#user-roles--portals)
- [API Reference (v2)](#api-reference-v2)
- [Database Schema](#database-schema)
- [AI & Intelligence Layer](#ai--intelligence-layer)
- [Security & Middleware](#security--middleware)
- [Logging & Observability](#logging--observability)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Deployment](#deployment)
- [Key Learnings & Patterns](#key-learnings--patterns)
- [Contributing](#contributing)

---

## Features

### 🏫 Multi-Tenant Organization Management
- Super Admin creates and manages multiple Organizations
- Each org has its own Admins, Teachers, Students, and data
- Organization-scoped data isolation via middleware

### 📋 Attendance Management
- **Manual Attendance:** Teachers mark present/absent/leave per course per lecture slot
- **AI-Verified Attendance Sessions:** Teachers start a session with a question; students submit answers verified via keyword matching or Google Gemini LLM with confidence scoring
- Weekly summaries and course-wise attendance tracking

### 📊 Marks & Assessment
- Create assessments (quiz, midsem, final, custom) linked to courses
- Enter and publish marks per student
- Student marks dashboard with analytics (distribution charts, trend charts)
- Percentile and ranks calculation

### 📝 Question Paper Builder
- **Manual Mode:** Teachers create question papers with MCQ, Short, Long, and Numerical question types
- **AI Mode:** Generate question papers using Google Gemini LLM
- Pre-save validation ensures total marks equal sum of individual question marks

### 📈 Performance Analytics
- **Student Performance:** Personal attendance percentage, marks overview, course-wise trends
- **Teacher Summary:** Course-wise aggregated attendance and marks analytics
- **Admin Performance Dashboard:** Institute-wide, course-level, and individual student performance views

### 🏆 Gamification & Leaderboards
- XP-based student progression system
- Achievement badges (e.g., Perfect Attendance, Top Score, Perfect Week)
- Assessment leaderboards with rank and percentile display

### 📄 Leave Management
- Students submit leave requests with date range, reason, and document uploads
- Teachers/Admins approve or reject with comments
- Leave status reflected in attendance as "Leave" status

### 💬 AI Advisor (Chatbot)
- Conversational AI assistant powered by Google Gemini
- Intent detection, entity extraction, and context-aware responses
- Chat history with 30-day auto-expiry (MongoDB TTL)
- AI guardrails to keep conversations within academic scope
- Rate-limited to prevent abuse and cost overruns

### 📢 Alerts & Notifications
- In-app alert system for absences, low attendance, marks published, and general announcements
- Multi-portal read tracking (student/parent see the same alerts independently)
- Telegram bot integration for push notifications

### 📱 Telegram Bot Integration
- Students link their Telegram accounts to receive notifications
- Webhook-based bot running alongside the web server
- Link/unlink accounts through the Settings page

### 📝 Feedback System
- Teachers create feedback forms (post-assessment or end-of-course)
- Supports RATING and TEXT question types
- Students submit anonymous feedback; teachers/admins view aggregated summaries
- Expiration dates for time-limited feedback collection

### 🎨 Premium UI/UX
- Glassmorphism-inspired dark theme
- Framer Motion transitions and page animations
- Canvas Confetti celebrations for achievements
- Fully responsive design (mobile & desktop)
- Skeleton loaders, modals, and micro-interactions

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 (Vite 7) | Single-page application framework |
| **Language** | JavaScript (ES6+ Modules) | Full-stack language |
| **Styling** | Tailwind CSS 3 | Utility-first CSS framework |
| **Animations** | Framer Motion | Page transitions and micro-interactions |
| **Charts** | Recharts | Marks distribution, trends, and analytics charts |
| **Icons** | Lucide React | Consistent icon set across the UI |
| **Celebrations** | Canvas Confetti | Achievement unlock animations |
| **Routing** | React Router DOM 7 | Client-side routing with protected routes |
| **State Management** | React Context API | Global auth state and portal tracking |
| **HTTP Client** | Axios | API communication with interceptors |
| **Backend** | Node.js + Express.js 4 | RESTful API server |
| **Database** | MongoDB + Mongoose 8 | Document database with schemas and indexes |
| **AI / LLM** | Google Gemini (`@google/generative-ai`) | AI chat, attendance verification, question paper generation |
| **Authentication** | JSON Web Tokens (jsonwebtoken) | Stateless token-based authentication |
| **Password Hashing** | bcryptjs | Secure password encryption |
| **Logging** | Winston + Winston Daily Rotate File | Structured logging with daily file rotation |
| **HTTP Logging** | Morgan | Request logging (dev and production modes) |
| **Security** | Helmet, express-mongo-sanitize, sanitize-html | HTTP headers, NoSQL injection prevention, XSS prevention |
| **Rate Limiting** | express-rate-limit | Global, auth, and chat rate limiters |
| **File Uploads** | Multer | Multipart form-data handling for document uploads |
| **Date Handling** | Moment.js | Date formatting and manipulation |
| **Deployment** | Vercel (Frontend) | SPA hosting with rewrites |

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  Browser / Mobile (React SPA on Vercel)                      │
└──────────────────┬───────────────────────────────────────────┘
                   │ HTTPS (Axios + JWT Bearer Token)
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                   Backend API Layer                           │
│  Express.js Server (Node.js)                                 │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐             │
│  │  Middleware │ │  Routes    │ │  Controllers │             │
│  │  ─ Helmet  │ │  21 route  │ │  21 controller│            │
│  │  ─ CORS    │ │  modules   │ │  modules      │            │
│  │  ─ Auth    │ │  (API v2)  │ │               │            │
│  │  ─ Scope   │ └────────────┘ └──────┬───────┘             │
│  │  ─ Rate    │                       │                      │
│  │    Limiter │                       ▼                      │
│  │  ─ Sanitize│          ┌────────────────────┐             │
│  └────────────┘          │     Services       │             │
│                          │  ─ AI Response     │             │
│                          │  ─ Chat Intent     │             │
│                          │  ─ Answer Valid.   │             │
│                          │  ─ Achievement     │             │
│                          │  ─ Alert           │             │
│                          │  ─ Telegram        │             │
│                          │  ─ LLM Queue       │             │
│                          │  ─ Question Gen.   │             │
│                          └────────┬───────────┘             │
└───────────────────────────────────┼──────────────────────────┘
                                    │
                   ┌────────────────┼───────────────┐
                   ▼                ▼               ▼
          ┌──────────────┐  ┌─────────────┐  ┌───────────┐
          │   MongoDB    │  │ Google      │  │ Telegram  │
          │   Atlas      │  │ Gemini API  │  │ Bot API   │
          │  (16 models) │  │ (LLM/Vision)│  │ (Webhook) │
          └──────────────┘  └─────────────┘  └───────────┘
```

**Data Flow:**
1. Client sends requests with JWT token in the `Authorization` header
2. Express middleware validates the token, resolves the user, attaches organization scope
3. Controllers execute business logic, delegating to services for AI/complex operations
4. Mongoose models interact with MongoDB; responses are returned as JSON
5. Telegram bot runs as a side-process via polling, also receiving webhooks

---

## Project Structure

```
Attendify/
├── client/                            # Frontend (Vite + React SPA)
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js               # Axios instance with interceptors
│   │   ├── assets/                    # Static assets (images, logos)
│   │   ├── components/                # Reusable UI components
│   │   │   ├── achievements/          # Achievement badge components
│   │   │   ├── alerts/                # Alert list & notification UI
│   │   │   ├── auth/                  # Auth-related components
│   │   │   ├── feedback/              # Feedback form & response components
│   │   │   ├── leaderboard/           # Leaderboard display components
│   │   │   ├── marks/                 # Marks cards & analytics charts
│   │   │   │   └── analytics/         # Distribution & trend chart components
│   │   │   ├── Card.jsx               # Generic card component
│   │   │   ├── CourseCard.jsx          # Course display card
│   │   │   ├── Modal.jsx              # Reusable modal dialog
│   │   │   ├── PageTransition.jsx     # Framer Motion page wrapper
│   │   │   ├── ProtectedRoute.jsx     # RBAC route guard
│   │   │   ├── Sidebar.jsx            # Navigation sidebar
│   │   │   ├── SkeletonCard.jsx       # Loading skeleton placeholder
│   │   │   ├── StudentActiveSessionCard.jsx   # AI session card for students
│   │   │   ├── TeacherActiveSessionWidget.jsx # AI session widget for teachers
│   │   │   └── TeacherSessionModal.jsx        # Session start/stop modal
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Authentication state & portal tracking
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx         # Common layout with sidebar
│   │   ├── pages/
│   │   │   ├── student/               # Student-specific pages
│   │   │   │   ├── AssessmentLeaderboardPage.jsx
│   │   │   │   └── StudentAchievementsPage.jsx
│   │   │   ├── teacher/               # Teacher-specific pages
│   │   │   │   ├── AssessmentLeaderboardPage.jsx
│   │   │   │   └── QuestionPaperBuilderPage.jsx
│   │   │   ├── superAdmin/            # Super Admin pages
│   │   │   │   ├── SuperAdminDashboard.jsx
│   │   │   │   ├── OrganizationManagementPage.jsx
│   │   │   │   ├── AdminManagementPage.jsx
│   │   │   │   └── UsageDashboard.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminStudentPerformancePage.jsx
│   │   │   ├── AIAdvisor.jsx
│   │   │   ├── CreateAssessment.jsx
│   │   │   ├── CreateFeedbackForm.jsx
│   │   │   ├── EnterMarks.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── MarksAnalyticsPage.jsx
│   │   │   ├── MyPerformancePage.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── StudentDashboard.jsx
│   │   │   ├── StudentLeaves.jsx
│   │   │   ├── StudentMarks.jsx
│   │   │   ├── StudentPerformancePage.jsx
│   │   │   ├── TeacherAttendance.jsx
│   │   │   ├── TeacherCourses.jsx
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── TeacherFeedbackSummary.jsx
│   │   │   ├── TeacherLeaves.jsx
│   │   │   ├── TeacherMarks.jsx
│   │   │   └── TeacherSummary.jsx
│   │   ├── utils/
│   │   │   ├── marksAnalytics.util.js # Marks statistics calculations
│   │   │   └── percentile.util.js     # Percentile computation
│   │   ├── App.jsx                    # Root component with all routes
│   │   └── main.jsx                   # Application entry point
│   ├── vercel.json                    # Vercel SPA rewrite config
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                            # Backend (Node.js + Express)
│   ├── config/
│   │   └── db.js                      # MongoDB connection (Mongoose)
│   ├── controllers/                   # Business logic (21 controllers)
│   │   ├── authController.js          # Register, login, logout, password
│   │   ├── adminController.js         # Manage teachers, semesters, courses, enrollment
│   │   ├── adminPerformanceController.js # Institute/course/student performance
│   │   ├── academicController.js      # Semesters and courses queries
│   │   ├── attendanceController.js    # Mark and retrieve attendance
│   │   ├── aiAttendanceController.js  # AI session start/stop/submit/stats
│   │   ├── aiController.js            # General AI utilities
│   │   ├── alertController.js         # User alerts (get, read, read-all)
│   │   ├── achievementController.js   # Student achievement retrieval
│   │   ├── chatController.js          # AI chatbot query and history
│   │   ├── feedbackController.js      # Create forms, submit, view summaries
│   │   ├── healthController.js        # API health check
│   │   ├── leaderboardController.js   # Assessment leaderboard generation
│   │   ├── leaveController.js         # Leave requests (submit, list, handle)
│   │   ├── marksController.js         # Assessments and marks CRUD
│   │   ├── organizationController.js  # Organization CRUD
│   │   ├── questionPaperController.js # Manual & AI question paper builder
│   │   ├── superAdminController.js    # Admin management by super admin
│   │   ├── superAdminMetricsController.js # Platform usage metrics
│   │   ├── telegramController.js      # Telegram link/unlink/webhook
│   │   └── userController.js          # User profile operations
│   ├── middleware/
│   │   ├── authMiddleware.js          # JWT verification + role authorization
│   │   ├── scopeMiddleware.js         # Organization scoping (multi-tenancy)
│   │   ├── rateLimiter.js             # Global, auth, and chat rate limiters
│   │   └── errorMiddleware.js         # 404 handler + global error handler
│   ├── models/                        # Mongoose schemas (16 models)
│   ├── routes/                        # Express routers (21 route files)
│   ├── services/                      # Business logic services (13 files)
│   │   ├── achievement.service.js     # Achievement checking & awarding
│   │   ├── aiResponse.service.js      # AI response generation
│   │   ├── alert.service.js           # Alert creation and dispatch
│   │   ├── answerValidation.service.js# AI attendance answer verification
│   │   ├── attendanceTruth.service.js # Attendance ground truth resolver
│   │   ├── chatIntent.service.js      # Chatbot intent classification
│   │   ├── chatResponse.service.js    # Chatbot response composition
│   │   ├── entityExtraction.service.js# Named entity extraction from chat
│   │   ├── geminiQuestionGenerator.service.js # AI question paper generation
│   │   ├── llm.service.js             # LLM client wrapper
│   │   ├── llmCostGuard.service.js    # LLM usage throttling
│   │   ├── llmQueue.service.js        # Queued LLM request processing
│   │   └── telegram.service.js        # Telegram API integration
│   ├── utils/
│   │   ├── logger.js                  # Winston logger configuration
│   │   ├── aiGuardrails.js            # AI safety and topic restrictions
│   │   ├── analyticsEngine.js         # Attendance analytics computations
│   │   ├── attendanceCalculator.js    # Attendance percentage calculation
│   │   ├── intentDetection.util.js    # Intent pattern matching
│   │   └── responseComposer.util.js   # Chat response formatting
│   ├── scripts/
│   │   ├── telegramBot.js             # Telegram bot polling entry point
│   │   └── migrateAttendanceIndex.js  # Database migration script
│   ├── server.js                      # Application entry point
│   └── package.json
│
├── scripts/                           # Root-level scripts (currently empty)
├── .gitignore
└── README.md
```

---

## User Roles & Portals

| Role | Portal | Key Capabilities |
|---|---|---|
| **Super Admin** | `/super-admin` | Create/manage organizations, create/manage admins, view platform-wide usage metrics |
| **Admin** | `/admin` | Manage teachers, semesters, courses, enroll students, view institute performance, create feedback forms |
| **Teacher** | `/teacher` | Mark attendance (manual & AI sessions), manage marks & assessments, approve/reject leaves, create feedback forms, build question papers (manual & AI), view course summaries |
| **Student** | `/student` | View attendance, view marks & analytics, submit leave requests, submit AI attendance answers, participate in leaderboards, earn achievements, chat with AI advisor, submit feedback |
| **Parent** | `/login/parent` | Access student dashboard (read-only), view alerts, chat with AI advisor (shared portal with student role) |

---

## API Reference (v2)

Base URL: `/api/v2`

### Authentication (`/auth`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register new student | Public |
| POST | `/auth/login` | Login (all roles) | Public |
| POST | `/auth/logout` | Logout | Protected |
| GET | `/auth/me` | Get current user profile | Protected |
| PUT | `/auth/password` | Change password | Protected |

### Admin Management (`/admin`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/admin/teachers` | List teachers in org | Admin |
| GET | `/admin/students` | List students in org | Admin |
| POST | `/admin/teachers` | Create teacher account | Admin |
| DELETE | `/admin/teachers/:id` | Delete teacher | Admin |
| POST | `/admin/semesters` | Create semester | Admin |
| PUT | `/admin/semesters/:id` | Update semester | Admin |
| POST | `/admin/courses` | Create course | Admin |
| DELETE | `/admin/courses/:id` | Delete course | Admin |
| POST | `/admin/enroll` | Enroll student in course | Admin |

### Admin Performance (`/admin/performance`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/admin/performance/institute` | Institute-wide analytics | Admin |
| GET | `/admin/performance/courses/:courseId` | Course-level performance | Admin |
| GET | `/admin/performance/students/:studentId` | Individual student metrics | Admin |

### Academic (`/academic`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/academic/semesters` | List all semesters | Protected |
| GET | `/academic/courses` | List all courses | Protected |
| GET | `/academic/courses/:id` | Get course details | Protected |

### Attendance (`/attendance`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/attendance/mark` | Mark attendance for a lecture | Teacher |
| GET | `/attendance/weekly-summary` | Get weekly attendance summary | Teacher |
| GET | `/attendance/course/:courseId` | Get attendance records | Teacher/Student |

### AI Attendance (`/attendance/ai`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/attendance/ai/session/start` | Start AI attendance session | Teacher |
| POST | `/attendance/ai/session/stop` | Stop active session | Teacher |
| POST | `/attendance/ai/session/submit` | Submit answer to session | Student |
| GET | `/attendance/ai/session/active/:courseId` | Get active session for course | Protected |
| GET | `/attendance/ai/session/:sessionId/stats` | Get session statistics | Protected |

### Marks & Assessments (`/marks`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/marks/assessment/teacher/all` | List teacher's assessments | Teacher/Admin |
| GET | `/marks/assessment/course/:courseId` | Assessments by course | Teacher/Admin |
| POST | `/marks/assessment/create` | Create assessment | Teacher/Admin |
| POST | `/marks/assessment/:assessmentId/enter` | Enter student marks | Teacher/Admin |
| GET | `/marks/assessment/:assessmentId` | Get assessment marks | Teacher/Admin |
| GET | `/marks/my` | Get student's own marks | Student |

### Leaves (`/leaves`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/leaves` | Submit leave request | Student |
| GET | `/leaves` | List leave requests | Teacher/Student |
| PUT | `/leaves/:id` | Approve/reject leave | Teacher |

### Feedback (`/feedback`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/feedback/create` | Create feedback form | Teacher/Admin |
| GET | `/feedback/active` | Get active feedback forms | Student |
| POST | `/feedback/submit` | Submit feedback | Student |
| GET | `/feedback/summary/:courseId` | Get aggregated feedback | Teacher/Admin |

### Question Papers (`/question-paper`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/question-paper/manual/create` | Create paper manually | Teacher/Admin |
| POST | `/question-paper/llm/generate` | Generate paper via AI | Teacher/Admin |
| POST | `/question-paper/save` | Save generated paper | Teacher/Admin |
| GET | `/question-paper/list` | List teacher's papers | Teacher/Admin |
| GET | `/question-paper/:id` | Get paper details | Teacher/Admin |
| PUT | `/question-paper/:id` | Update paper | Teacher/Admin |

### Leaderboard (`/leaderboard`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/leaderboard/assessment/:assessmentId` | Assessment leaderboard | Student/Teacher/Admin |

### Achievements (`/achievements`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/achievements/my-achievements` | Get student's achievements | Protected |

### Alerts (`/alerts`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/alerts/my` | Get user's alerts | Protected |
| PUT | `/alerts/read-all` | Mark all alerts read | Protected |
| PUT | `/alerts/:alertId/read` | Mark single alert read | Protected |

### AI Chat (`/chat`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/chat/query` | Send message to AI advisor | Protected |
| GET | `/chat/history` | Get chat history | Protected |

### Telegram (`/telegram`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/telegram/webhook` | Telegram webhook handler | Public |
| GET | `/telegram/status` | Get link status | Protected |
| POST | `/telegram/link` | Link Telegram account | Protected |
| DELETE | `/telegram/link` | Unlink Telegram account | Protected |
| POST | `/telegram/register-webhook` | Register webhook URL | Protected |

### Super Admin (`/super-admin`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/super-admin/admins` | Create admin account | Super Admin |
| GET | `/super-admin/admins` | List all admins | Super Admin |
| PATCH | `/super-admin/admins/:id/toggle-status` | Enable/disable admin | Super Admin |
| PUT | `/super-admin/admins/:id/password` | Reset admin password | Super Admin |

### Super Admin Organizations (`/super-admin/organizations`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| | (managed via organizationController) | CRUD for organizations | Super Admin |

### Super Admin Metrics (`/super-admin/metrics`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| | (managed via superAdminMetricsController) | Platform usage dashboard | Super Admin |

### Health (`/health`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| GET | `/health` | API health check | Public |

### Users (`/users`)
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| | (managed via userController) | User profile operations | Protected |

---

## Database Schema

**16 MongoDB Collections** (Mongoose models):

| Collection | Purpose | Key Relationships |
|---|---|---|
| **User** | All users (students, teachers, admins, parents, super admins) with role-based fields, gamification XP, and earned achievements | → Organization, → Achievement (embedded), → User (linkedChildren for parents) |
| **Organization** | Multi-tenant institution entity with unique code | ← User, ← Course, ← Semester |
| **Semester** | Academic term with start/end dates and status lifecycle | → Organization; ← Course, ← Attendance, ← LeaveRequest |
| **Course** | Academic course with code, credits, enrolled student list | → Organization, → Semester, → User (teacher), → User[] (students) |
| **Attendance** | Individual attendance record per student/course/date/time-slot | → User (student), → Course, → Semester, → User (markedBy) |
| **AttendanceSession** | AI-verified attendance session with question, keywords, expiry, and LLM config | → Organization, → Course, → User (teacher) |
| **AttendanceSubmission** | Student's answer to an AI session with verification method and confidence score | → User (student), → AttendanceSession |
| **Assessment** | Exam/quiz definition with type (quiz, midsem, final, custom) and max marks | → Organization, → Course, → User (teacher) |
| **StudentMark** | Individual student's obtained marks for an assessment | → Organization, → Assessment, → User (student), → Course |
| **LeaveRequest** | Student leave application with date range, reason, documents, and approval status | → User (student), → Course, → Semester, → User (handledBy) |
| **FeedbackForm** | Teacher-created feedback form with rating/text questions | → Organization, → Course, → Assessment (optional), → User (teacher) |
| **FeedbackResponse** | Student's submitted feedback answers | → Organization, → Course, → User (student), → FeedbackForm |
| **QuestionPaper** | Exam paper with questions (MCQ, Short, Long, Numerical) | → Organization, → Course, → Assessment (optional), → User (teacher) |
| **Achievement** | Badge template with condition triggers and XP reward | Referenced by User.details.earnedAchievements |
| **Alert** | In-app notification (absent, marks published, low attendance, general) | → Organization, → User |
| **ChatHistory** | AI advisor conversation logs with 30-day TTL auto-expiry | → User |

---

## AI & Intelligence Layer

Attendify integrates **Google Gemini** (`@google/generative-ai`) across multiple features:

| Feature | Service | How It Works |
|---|---|---|
| **AI Attendance Verification** | `answerValidation.service.js` | Two-tier: fast keyword matching, then LLM validation with confidence scoring (0.0–1.0) |
| **AI Chatbot (Advisor)** | `chatIntent.service.js`, `chatResponse.service.js`, `entityExtraction.service.js` | Intent detection → entity extraction → context-aware response composition |
| **Question Paper Generation** | `geminiQuestionGenerator.service.js` | Teacher provides topic/config → Gemini generates structured questions with marks |
| **AI Guardrails** | `aiGuardrails.js` | Topic restriction to keep AI within academic scope |
| **LLM Cost Guard** | `llmCostGuard.service.js` | Rate limiting per session to cap API costs |
| **LLM Queue** | `llmQueue.service.js` | Queued request processing to manage concurrency |

---

## Security & Middleware

| Layer | Implementation | Details |
|---|---|---|
| **Authentication** | JWT (`jsonwebtoken`) | Bearer token in `Authorization` header, verified on every protected route |
| **Password Security** | bcryptjs | Passwords hashed before storage; never stored in plaintext |
| **Role-Based Access Control** | `authorize()` middleware | Routes restricted to specific roles (student, teacher, admin, super_admin) |
| **Multi-Tenant Scoping** | `attachOrganizationScope()` | Ensures data isolation per organization; super admins can scope optionally |
| **HTTP Security Headers** | Helmet | Sets security-related HTTP headers (CSP, HSTS, etc.) |
| **NoSQL Injection Prevention** | express-mongo-sanitize | Strips `$` and `.` operators from user input |
| **XSS Prevention** | sanitize-html | Sanitizes all request body, query, and params recursively |
| **Rate Limiting** | express-rate-limit | Global: 100 req/15min, Auth: 15 req/15min, Chat: 30 req/min |
| **CORS** | Dynamic origin matching | Configurable allowed origins via `CLIENT_URL` env variable |
| **Soft Deletes** | `isActive` flag | Users, courses, and organizations use soft-delete pattern |
| **Automatic Token Cleanup** | Axios interceptor | Client-side 401 response handling with automatic redirect |

---

## Logging & Observability

- **Winston Logger** with custom severity levels: `error`, `warn`, `info`, `http`, `debug`
- **Daily Rotate File** transport for production:
  - `logs/error-YYYY-MM-DD.log` — Error-level only
  - `logs/combined-YYYY-MM-DD.log` — All levels
  - `logs/exceptions-YYYY-MM-DD.log` — Uncaught exceptions
  - `logs/rejections-YYYY-MM-DD.log` — Unhandled promise rejections
- **Log rotation:** Compressed archives, 5–10 MB max size, 14-day retention
- **Development mode:** Colorized console output via Morgan (`dev` format)
- **Production mode:** Morgan piped through Winston's `http` level

---

## Environment Variables

### Server (`server/.env`)

| Variable | Description | Required |
|---|---|---|
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | `development` or `production` | No |
| `MONGO_URI` | MongoDB connection string | **Yes** |
| `JWT_SECRET` | Secret key for signing JWT tokens | **Yes** |
| `GOOGLE_API_KEY` | Google Gemini API key for AI features | **Yes** |
| `CLIENT_URL` | Comma-separated allowed CORS origins | **Yes** |
| `SUPER_ADMIN_EMAIL` | Email for env-only super admin login | No |
| `ADMIN_EMAIL` | Fallback super admin email | No |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API token | No |
| `TELEGRAM_WEBHOOK_URL` | Webhook URL for Telegram bot | No |

### Client (`client/.env`)

| Variable | Description | Required |
|---|---|---|
| `VITE_API_URL` | Backend API base URL (e.g., `http://localhost:5000/api/v2`) | **Yes** |

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **MongoDB** (local instance or MongoDB Atlas)
- **Google Cloud API Key** with Gemini / Generative AI access

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd Attendify
   ```

2. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies:**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables:**

   Create `server/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secure_jwt_secret
   GOOGLE_API_KEY=your_gemini_api_key
   CLIENT_URL=http://localhost:5173
   ```

   Create `client/.env`:
   ```env
   VITE_API_URL=http://localhost:5000/api/v2
   ```

5. **Run the development servers:**
   ```bash
   # Terminal 1: Backend
   cd server
   npm run dev

   # Terminal 2: Frontend
   cd client
   npm run dev
   ```

6. **Open** [http://localhost:5173](http://localhost:5173) in your browser.

---

## Deployment

- **Frontend:** Deployed to **Vercel** as a static SPA with `vercel.json` rewrite rules for client-side routing
- **Backend:** Can be deployed to any Node.js hosting platform (Render, Railway, Heroku, AWS, etc.)
- **Database:** MongoDB Atlas recommended for production
- **Telegram Bot:** Supports both polling mode (development) and webhook mode (production)

---

## Key Learnings & Patterns

### Architecture & Design
- **Multi-Tenant Architecture:** Organization-scoped middleware ensures complete data isolation between institutions without separate databases
- **Role-Based Access Control (RBAC):** Single `User` model with a `role` field and `authorize()` middleware; avoids separate tables per role
- **API Versioning:** All routes under `/api/v2`, enabling future backward-compatible upgrades
- **Service Layer Pattern:** Controllers delegate complex business logic to dedicated service modules, keeping controllers thin

### AI Integration
- **Two-Tier AI Verification:** Keyword matching as a fast-path before expensive LLM calls—reduces cost and latency
- **LLM Cost Control:** Per-session call limits (`llmCostGuard`) and request queuing (`llmQueue`) prevent runaway API costs
- **AI Guardrails:** Content filtering keeps the chatbot within academic topics

### Security
- **Defense in Depth:** Multiple sanitization layers (mongo-sanitize, sanitize-html, Helmet) rather than relying on a single mechanism
- **Tiered Rate Limiting:** Different limits for different endpoint sensitivity (auth vs. global vs. chat)
- **Soft Deletes:** `isActive` flag preserves data integrity while allowing logical deletion

### Frontend
- **Interceptor Pattern:** Axios interceptors handle token attachment and automatic 401 redirect globally
- **Portal-Aware Auth:** A single login component dynamically adapts to the portal context (student, teacher, admin, parent)
- **Context API for Global State:** Lightweight alternative to Redux, sufficient for auth/session state

### Logging & Reliability
- **Structured Logging with Winston:** JSON logs in production, colored console in development; daily rotation with size limits and retention
- **Global Error Handling:** Centralized error middleware catches Mongoose validation errors, cast errors, and unhandled exceptions

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
