# API Insight

**API Insight** is a comprehensive full-stack application for testing, analyzing, and monitoring APIs. It provides real-time analytics, API testing consoles, background job processing, and AI-driven insights to help developers manage and understand their API endpoints efficiently.

### 🌐 Live Links
- **Frontend App**: [https://api-insight-app.onrender.com/](https://api-insight-app.onrender.com/)
- **Backend API**: [https://api-insight-aps1.onrender.com](https://api-insight-aps1.onrender.com)

---

## 🛠️ Tech Stack & Tools

### Frontend (`/client`)
- **Core**: React 19, TypeScript, Vite
- **State Management**: Redux Toolkit, React Redux
- **Routing**: React Router DOM v7
- **Styling**: Tailwind CSS v4, Framer Motion (Animations), Class Variance Authority (CVA), Lucide React (Icons)
- **Data Visualization**: Recharts
- **Authentication**: Firebase Authentication
- **HTTP Client**: Axios

### Backend (`/server`)
- **Core**: Node.js, Express.js, TypeScript
- **Database (Relational)**: PostgreSQL via **Prisma ORM**
- **Database (NoSQL)**: MongoDB via **Mongoose** (for document storage, if applicable)
- **Caching & Rate Limiting**: Redis
- **Message Broker**: RabbitMQ (`amqplib`) for background worker tasks
- **Real-Time Communication**: Socket.io
- **AI Integration**: OpenAI API
- **Auth & Security**: Firebase Admin, Google Auth Library, JWT, Passport.js, Helmet, Zod (Validation), bcryptjs

---

## 🚀 Features

- **API Testing Console**: Send HTTP requests directly from the app and view detailed responses.
- **Real-Time Analytics**: View usage metrics, request/response times, and error rates using interactive dashboards.
- **Authentication System**: Secure user login/registration via Firebase and Google Auth.
- **Background Processing**: Heavy tasks and queue management are processed using RabbitMQ and dedicated worker processes.
- **AI-Powered Explanations**: Leveraging OpenAI to generate insights and summaries for API performances and errors.
- **Rate Limiting**: Protect endpoints from abuse using Redis-backed rate limiting.

---

## 🏃‍♂️ How to Start the Project Locally

To run API Insight on your local machine, follow these steps:

### 1. Prerequisites
Make sure you have the following installed on your system:
- **Node.js** (v18 or higher recommended)
- **PostgreSQL** (Running locally or via cloud e.g., Supabase/Neon)
- **Redis**
- **RabbitMQ**

### 2. Clone the Repository
```bash
git clone <your-repository-url>
cd "API Insight"
```

### 3. Backend Setup
Navigate to the `server` directory and install dependencies:
```bash
cd server
npm install
```

**Environment Variables**: Create a `.env` file in the `server` directory. You will need configuration strings for:
- `DATABASE_URL` (PostgreSQL connection string)
- `REDIS_URL`
- `RABBITMQ_URL`
- Firebase Admin SDK credentials
- Google Client ID / Secret
- `OPENAI_API_KEY`
- JWT Secrets

**Database Setup**: 
Generate the Prisma client and push the schema to your PostgreSQL database:
```bash
npx prisma generate
npx prisma db push
```

**Run the Server**:
You need to run the main REST API and the messaging worker in separate terminal windows.
```bash
# Terminal 1: Start the Express API server
npm run dev

# Terminal 2: Start the background worker (RabbitMQ consumer)
npm run worker
```

### 4. Frontend Setup
Open a new terminal, navigate to the `client` directory, and install dependencies:
```bash
cd client
npm install
```

**Environment Variables**: Create a `.env` file in the `client` directory. You will need:
- Firebase configuration variables (e.g., `VITE_FIREBASE_API_KEY`, etc.)
- Backend API URL (e.g., `VITE_API_URL=http://localhost:5000`)

**Run the Client**:
Start the Vite development server:
```bash
npm run dev
```

### 5. Open the Application
Once both servers are running, access the frontend at:  
`http://localhost:5173` (or the port specified by Vite).

---

## 🤝 Contributing
1. Fork the repository
2. Create a new feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request
