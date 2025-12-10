# IntelliScan

IntelliScan is a serverless, full-stack cloud application designed to solve information overload. It allows users to upload documents in various formats (PDF, Word, Text, Images), automatically extracts the text (using OCR if necessary), and generates concise, AI-powered abstractive summaries.

🚀 Features
Multi-Format Support: Upload and process .pdf, .docx, .txt, .png, .jpg, and .jpeg files.

Intelligent Text Extraction: Uses native parsing for digital documents and Google Cloud Vision API (OCR) for scanned documents and images.

AI-Powered Summarization: Leverages Google Gemini 1.5 Flash to generate coherent abstractive summaries with adjustable lengths (Short, Medium, Long).

Secure Authentication: Custom user registration and login system with password hashing (bcrypt).

Persistent History: Saves user summaries and upload history in Google Firestore.

Secure Downloads: Provides time-limited Signed URLs for securely downloading original documents from Google Cloud Storage.

Responsive UI: Modern React frontend built with Vite and TypeScript.

oa Architecture
The application follows a decoupled, serverless architecture deployed on Google Cloud Platform (GCP):

Frontend: React (Vite) Single Page Application hosted on Firebase Hosting.

Backend: Python FastAPI service containerized with Docker and running on Google Cloud Run.

Database: Cloud Firestore (NoSQL) for user data and metadata.

Storage: Cloud Storage buckets for raw file storage.

DevOps: Automated CI/CD pipelines using GitHub Actions (Frontend) and Google Cloud Build (Backend).

🛠️ Tech Stack
Frontend
Framework: React 19 + TypeScript

Build Tool: Vite

Hosting: Firebase Hosting

Styling: CSS Modules

Backend
Framework: FastAPI (Python 3.9)

Server: Uvicorn

Containerization: Docker

Compute: Google Cloud Run

Cloud Services (GCP)
AI/ML: Gemini API, Cloud Vision API

Data: Firestore, Cloud Storage

Security: Secret Manager, IAM

📋 Prerequisites
Before running the project locally, ensure you have:

Node.js (v18+) and npm

Python (v3.9+)

Google Cloud Platform Account with the following APIs enabled:

Cloud Run API

Cloud Build API

Cloud Firestore API

Cloud Storage API

Cloud Vision API

Gemini API (Generative Language API)
⚙️ Installation & Local Development
1. Clone the Repository
Bash

git clone https://github.com/your-username/Document-Summarizer.git
cd Document-Summarizer

2. Backend Setup
Navigate to the backend directory and set up the Python environment.

Bash

cd backend
python -m venv venv
# Activate virtual environment:
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
Configuration:

Place your Service Account Key JSON file in backend/service_account.json (Ensure this file is in .gitignore).

Set your environment variables (or create a .env file):

GOOGLE_APPLICATION_CREDENTIALS="service_account.json"

GEMINI_API_KEY="your_api_key_here"

Run the Server:

Bash

uvicorn app.main:app --reload
The backend will start at http://localhost:8000.

3. Frontend Setup
Open a new terminal and navigate to the frontend directory.

Bash

cd frontend
npm install
Configuration: Create a .env file in the frontend root:

Code snippet

VITE_BACKEND_URL=http://localhost:8000
Run the Application:

Bash

npm run dev
The frontend will start at http://localhost:5173.

🚀 Deployment
The project is configured for continuous deployment.

Frontend (Firebase Hosting)
Commits to the main branch trigger a GitHub Action workflow defined in .github/workflows/firebase-hosting-merge.yml.

It builds the React app (npm run build).

It deploys the dist folder to Firebase Hosting.

Backend (Google Cloud Run)
Commits to the main branch trigger a Google Cloud Build trigger (configured in GCP Console).

It builds the Docker image from backend/Dockerfile.

It pushes the image to Google Container Registry.

It updates the Cloud Run service with the new image.

📂 Project Structure
Document-Summarizer/
├── backend/
│   ├── app/
│   │   ├── main.py          # API endpoints & logic
│   │   ├── auth.py          # Authentication handlers
│   │   └── Summarizer.py    # Gemini AI integration
│   ├── Dockerfile           # Backend container config
│   ├── requirements.txt     # Python dependencies
│   └── service_account.json # (Ignored) GCP Credentials
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Main application logic
│   │   ├── Login.tsx        # Auth UI
│   │   └── ...
│   ├── firebase.json        # Hosting configuration
│   └── vite.config.ts       # Vite configuration
└── .github/workflows/       # CI/CD pipelines

🛡️ Security
Secrets: API keys and credentials are not stored in the repository. In production, they are managed via Google Secret Manager and injected as environment variables.

Identity: Passwords are hashed using bcrypt before storage.

Access Control: Backend services run with the principle of least privilege using dedicated IAM Service Accounts.
