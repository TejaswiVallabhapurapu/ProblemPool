# ProblemPool

ProblemPool is a community-driven web application where people can share real-world problems they experience in everyday life, discover problems posted by others, and explore potential opportunities for meaningful solutions.

---

## Technology Stack

- **Frontend**:
  - React.js (v19)
  - Vite
  - JavaScript (ES Modules)
  - Tailwind CSS (v4)
  - React Router DOM (v7)
- **Backend**:
  - Node.js
  - Express.js
  - Mongoose
  - REST API
  - bcryptjs (Password hashing)
  - jsonwebtoken (JWT Authentication)
  - CORS
  - dotenv
- **Database**:
  - MongoDB Atlas (or local MongoDB for development)

---

## Folder Structure

```
ProblemPool/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProblemCard.jsx
│   │   │   ├── CategoryFilter.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Problems.jsx
│   │   │   ├── CreateProblem.jsx
│   │   │   ├── ProblemDetails.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Signup.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   │
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   └── problemController.js
│   │
│   ├── middleware/
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── Problem.js
│   │   └── User.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── problemRoutes.js
│   │
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## Environment Variables Setup

### 1. Backend (`server/.env`)

```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/problempool?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
```

### 2. Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Installation & Running

### 1. Backend

```bash
cd server
npm install
npm run dev
```

Server runs at: `http://localhost:5000`

### 2. Frontend

```bash
cd client
npm install
npm run dev
```

Client runs at: `http://localhost:5173`

---

## REST API Endpoints

Base URL: `http://localhost:5000/api`

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/signup` | Register new user account | No |
| `POST` | `/api/auth/login` | Log in user and receive JWT | No |
| `GET` | `/api/auth/me` | Fetch currently logged in user | Yes (Bearer) |

### Problem Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/api/problems` | List all problems (newest first, populated creator) | No |
| `GET` | `/api/problems/:id` | Get problem details by MongoDB ID | No |
| `POST` | `/api/problems` | Create new problem (`createdBy` from JWT) | Yes (Bearer) |
| `DELETE` | `/api/problems/:id` | Delete a problem by MongoDB ID | No / Creator |
| `GET` | `/api/problems/category/:category` | Filter problems by category | No |
