# AgentForge / Mindful Muse — Frontend

This is the frontend application for the AI Chatbot Platform assignment. It is built using React 18, TypeScript, Vite, Tailwind CSS, and Shadcn UI.

## Features

- **Authentication**: User registration and login using Supabase Auth (Email & Password).
- **Agent Dashboard**: Create, edit, and delete your AI agents.
- **Knowledge Base**: Upload files (PDF, TXT, CSV) to give your agents custom knowledge contexts.
- **Streaming Chat**: Real-time token-by-token streaming chat interface connected to the FastAPI backend.
- **Responsive Design**: Beautiful, mobile-friendly UI with smooth animations using Framer Motion.

## Prerequisites

- Node.js 18+ and npm
- A running instance of the FastAPI backend.
- A Supabase project (for authentication and database).

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Create a `.env` file in the root directory and add the following keys (you can copy `.env.example` if available):
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:3001
   ```
   *Note: `VITE_API_URL` should point to your running FastAPI backend.*

3. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Architecture & Communication

The frontend interacts with two main services:
1. **Supabase**: Direct interaction for user authentication (signup/login) and fetching user data (projects, prompts, conversations) using the Supabase JS client.
2. **FastAPI Backend**: API calls to `VITE_API_URL` for LLM chat streaming (`/api/chat/stream`) and knowledge base file uploads (`/api/projects/{id}/files`). Authentication is handled by passing the Supabase JWT token in the `Authorization` header.
