# Attendify – Smart Attendance Manager

Attendify is an AI-powered student attendance management system built using the MERN stack. It helps students track attendance, extract timetables via OCR, and gain actionable academic insights through an intelligent assistant.

Demo Link:https://attendify-roan.vercel.app/
---

## Features

- 🔐 **Authentication & Security**
  - Secure user registration and login
  - JWT-based authentication with persistent sessions
  - Protected routes and API endpoints
  - Scalable role-based access control (future-ready)

- 🤖 **AI-Powered Intelligence**
  - **AI Advisor**: Chat with Attendify AI for attendance planning and academic guidance
  - **Timetable OCR**: Automatically extract schedules from timetable images using Gemini Vision
  - **Smart Insights**: Personalized recommendations based on attendance history

- 📊 **Advanced Analytics**
  - **Smart Dashboard**: Real-time attendance overview
  - **Interactive Charts**: Subject-wise attendance and trend analysis
  - **Attendance Heatmap**: GitHub-style visualization of attendance frequency

- 🎨 **Premium UI / UX**
  - Glassmorphism-inspired modern interface
  - Smooth micro-interactions and animated transitions
  - Framer Motion–powered page navigation
  - Fully responsive design for mobile and desktop

---

## Tech Stack

- **Frontend**: React (Vite)
- **Language**: JavaScript (ES6+)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion, Canvas Confetti
- **Icons**: Lucide React
- **State Management**: React Context API
- **Charts & Visuals**: Recharts
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **AI & OCR**: Google Gemini (Generative AI & Vision)

---

## Prerequisites

- Node.js v18 or higher
- MongoDB (local or cloud)
- Google Cloud API Key (Gemini access)

---

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Attendify
```

2. Install dependencies for both Server and Client:
```bash
# Server
cd server
npm install

# Client
cd ../client
npm install
```

3. Set up environment variables:
Create a `.env` file in the `server/` directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
GOOGLE_API_KEY=your_gemini_api_key
```

4. Run the development environment:
You need to run both backend and frontend.

```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
Attendify/
├── client/                     # Frontend (Vite + React)
│   ├── src/
│   │   ├── components/         # Reusable UI (SubjectCard, Modal, Sidebar)
│   │   ├── pages/             # App Pages (Dashboard, Analytics, AIAdvisor)
│   │   ├── context/           # AuthGlobal Context
│   │   ├── api/               # Axios Configuration
│   │   └── assets/            # Static Assets
│   └── ...
├── server/                     # Backend (Node/Express)
│   ├── config/                # Database Connection
│   ├── controllers/           # Business Logic (Auth, Subj, Timetable, AI)
│   ├── models/                # Mongoose Schemas
│   ├── routes/                # API Routes
│   ├── middleware/            # Auth Protection
│   └── ...
├── README.md
└── ...
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new student
- `POST /api/v1/auth/login` - Login student
- `GET /api/v1/auth/me` - Get current profile
- `POST /api/v1/auth/logout` - Secure logout

### Subjects & Attendance
- `GET /api/v1/subjects` - Get all subjects
- `POST /api/v1/subjects` - Add new subject
- `DELETE /api/v1/subjects/:id` - Delete subject
- `POST /api/v1/attendance/logs/:id` - Mark attendance (Present/Absent)

### Timetable & AI
- `POST /api/v1/timetable/upload` - Upload timetable image (OCR)
- `POST /api/v1/timetable/bulk` - Bulk save schedule entries
- `POST /api/v1/ai/chat` - Chat with AI Advisor
- `GET /api/v1/ai/history` - Get chat history

### Analytics
- `GET /api/v1/analytics/dashboard` - Get aggregated stats and heathen data

## Usage

### 1. Dashboard
- Use the **+** button to add manual subjects.
- Use the **Check/Cross** buttons on cards for quick attendance marking.

### 2. Timetable OCR
- Navigate to the **Timetable** tab.
- Upload a screenshot of your class schedule.
- Use the **Generate with AI** feature to auto-fill the entries.
- Click **Save Selected** to persist them to your dashboard.

### 3. Analytics
- Check the **Analytics** tab for detailed insights.
- View your "Attendance Heatmap" to see activity patterns.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGO_URI` | MongoDB Connection String | Yes |
| `JWT_SECRET` | Secret key for signing tokens | Yes |
| `GOOGLE_API_KEY` | Gemini API Key for AI/OCR | Yes |
| `PORT` | Server Port (Default: 5000) | No |

## Security and Data Safety

- **JWT Authentication**: Stateless, secure token-based auth.
- **Password Hashing**: Bcryptjs used for password encryption.
- **Protected Routes**: Middleware ensures private data access.
- **Input Validation**: Backend validation for all critical inputs.
- **Data Safety (Backups)**: It is highly recommended to set up scheduled MongoDB database dumps (e.g., using a CRON job with `mongodump`) in production environments.
- **Data Safety (Soft Deletes)**: The admin and course models (database entities) utilize Soft-Deletes (`isActive` flag) to prevent accidental data loss.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

