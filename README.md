# 🛡️ AI Content Moderation Platform

A Full-Stack AI-powered Content Moderation System built with **FastAPI** (Python), **React** (JavaScript), and **MongoDB**. It allows users to submit images for automated policy compliance screening, with a structured appeal process and a comprehensive admin dashboard.

## 🚀 Features

### 👤 User Features
- **JWT Authentication**: Secure login and registration.
- **Image Submission**: Upload one or multiple images (Max 5) for moderation.
- **Real-time Screening**: Background processing using a mock AI engine (6 moderation categories).
- **Submission History**: View all past submissions with verdict status (Approved, Flagged, Blocked).
- **Appeals**: File an appeal against Flagged/Blocked submissions with a justification.

### 🛠️ Admin Features
- **Policy Configuration**: Enable/Disable categories, set confidence thresholds (0-100%), and change enforcement actions (Auto-Block / Flag for Review).
- **Appeals Queue**: View pending appeals, review user justifications, accept/reject appeals with an optional admin response.
- **Analytics Dashboard**:
  - Total submissions and verdict distribution (Pie Chart).
  - Appeal statistics (Total, Pending, Accepted, Rejected).
  - User ranking based on submission count and violation count.

### 🧠 AI Screening (Mock)
- **6 Categories**: Graphic Violence, Hate Symbols, Self-Harm, Extremist Propaganda, Weapons & Contraband, Harassment & Humiliation.
- Each category returns a classification result (Detected/Clean), confidence score, and reasoning.
- Overall outcome is determined dynamically based on admin-configured policies.

---

## 🏗️ Architecture

### Tech Stack
- **Backend**: Python 3.10+, FastAPI, Motor (Async MongoDB), PyJWT, Bcrypt.
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Axios.
- **Database**: MongoDB (Atlas or Local).

### Project Structure
AI-Content-Moderation-Platform/
├── backend/
│ ├── app/
│ │ ├── core/ # Config & DB connection
│ │ ├── models/ # Database models (User, Submission, etc.)
│ │ ├── routers/ # API routes (Auth, Submissions, Admin)
│ │ ├── schemas/ # Pydantic schemas (Request/Response validation)
│ │ ├── services/ # Business logic (Screening, Policies)
│ │ └── utils/ # Helpers (JWT, Password hashing, Dependencies)
│ ├── uploads/ # Stored images
│ ├── requirements.txt
│ └── .env
├── frontend/
│ ├── src/
│ │ ├── components/ (Currently inside App.jsx)
│ │ ├── App.jsx # Main App with routing
│ │ ├── index.css # Tailwind imports
│ │ └── main.jsx # Entry point
│ ├── package.json
│ └── tailwind.config.js
└── README.md

text

---

## 🔧 Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (Atlas or Local)

### 1. Clone the Repository
```bash
git clone https://github.com/tashfeen786/AI-Content-Moderation-Platform.git
cd AI-Content-Moderation-Platform
2. Backend Setup
Navigate to the backend folder and set up the environment:

bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
Create a .env file in the backend directory and add the following variables:

env
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
DB_NAME=moderation_db
SECRET_KEY=your-super-secret-key-here
Run the FastAPI server:

bash
uvicorn app.main:app --reload --port 8000
The API documentation will be available at http://127.0.0.1:8000/docs.

3. Frontend Setup
Open a new terminal and navigate to the frontend folder:

bash
cd frontend
npm install
npm run dev
The React application will be available at http://localhost:5173.

🔐 Default Users (for Testing)
Role	Email	Password	Status
Admin	tashfeen@example.com	test123	Role set manually in DB
User	user@example.com	user123	Registered via Swagger/UI
🧪 API Endpoints
Public/User Routes
Method	Endpoint	Description
POST	/api/auth/register	User registration
POST	/api/auth/login	User login (JWT)
POST	/api/submissions/upload	Upload images (Requires Auth)
GET	/api/submissions/history	Get user's submission history
GET	/api/submissions/{id}/status	Get specific submission status
Admin Routes
Method	Endpoint	Description
GET	/api/admin/policies	Get all moderation policies
PUT	/api/admin/policies/{category}	Update a specific policy
GET	/api/admin/appeals	Get all appeals
PUT	/api/admin/appeals/{id}/review	Accept/Reject an appeal
GET	/api/admin/analytics/overview	Get platform stats
GET	/api/admin/analytics/user-ranking	Get user ranking
📸 Screenshots
User Dashboard
https://image.png

Admin Panel - Policies
https://image-1.png

Admin Panel - Appeals Queue
https://image-2.png

Admin Panel - Analytics
https://image-3.png

📦 Future Improvements
Integrate a real AI model (HuggingFace) instead of mock screening.

Add Redis + RQ for robust background job processing.

Implement pagination for submission history.

Dockerize the application (docker-compose up).

📄 License
MIT

👨‍💻 Author
Tashfeen - GitHub

🎯 Quick Start (TL;DR)
bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend (New Terminal)
cd frontend
npm install
npm run dev
