# 🌸 Sakhi - AI-Powered Solo Female Travel Platform

Sakhi (formerly Aura) is an intelligent, safety-first travel companion specifically designed to empower solo female travelers. Built with modern web technologies, real-time safety scoring, Google Gemini AI chat companion, Supabase PostgreSQL cloud sync, and interactive transit and neighborhood mapping.

---

## ✨ Features

- 🛡️ **Dynamic Safety Index & Safety Scoring**: Evaluates cities, neighborhoods, and transit corridors using validated solo female travel indicators.
- 🤖 **Sakhi AI Companion (Gemini 1.5 Flash)**: Context-aware conversational assistant providing personalized safety recommendations, emergency support, and local advice.
- 🗺️ **Interactive Maps & Real-Time Tracking**: Leaflet-powered maps highlighting verified safe zones, well-lit routes, female-friendly stays, and emergency facilities.
- 📅 **Smart Trip Planning & Calendar Sync**: Seamless itinerary scheduling with date validation, departure countdowns, and booking tracking.
- 💱 **Live Multi-Currency Calculator**: Instant conversion across global currencies synced with user home preferences.
- ☁️ **Supabase Cloud Sync**: Encrypted, multi-user cloud persistence with auto-fallback to resilient local storage.
- 🚨 **Emergency SOS & Guardian Alerts**: Quick-access safety protocols and automated contacts dispatch.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/)
- **Icons & UI**: [Lucide React](https://lucide.dev/), Canvas Confetti
- **Maps**: [Leaflet](https://leafletjs.com/) & [React-Leaflet](https://react-leaflet.js.org/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL)
- **AI & RAG**: Google Gemini 1.5 Flash LLM
- **Deployment Target**: [Vercel](https://vercel.com/)

---

## 🚀 Getting Started Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/sakhi-solo-female-travel.git
   cd sakhi-solo-female-travel
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and configure your API keys:
   ```bash
   cp .env.example .env
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Run Evaluation Tests**:
   ```bash
   npm run eval
   ```

---

## 🌐 Deploying to Vercel

1. Push this repository to GitHub.
2. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New..."** -> **"Project"**.
3. Import this repository from GitHub.
4. Framework Preset will automatically detect **Vite**.
5. In **Environment Variables**, add the following keys from your `.env`:
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GOOGLE_MAPS_API_KEY`
   - `VITE_OPENWEATHER_API_KEY`
   - `VITE_EXCHANGE_RATE_API_KEY`
   - `VITE_HOSTELWORLD_PARTNER_KEY`
   - `VITE_BOOKING_AFFILIATE_ID`
   - `VITE_GEOSURE_SAFETY_API_KEY`
6. Click **Deploy**! 🚀

---

## 🔒 Security & Privacy

- All sensitive keys are configured via environment variables and never committed to version control.
- Supabase Row Level Security (RLS) and client isolation ensure each user's travel itinerary and chat history remain private.
