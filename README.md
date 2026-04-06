# KidSure — Frontend

A location-aware paediatric hospital finder platform designed to help parents easily locate the nearest and most relevant hospitals for their child's symptoms. This repository contains the React + Vite frontend of the KidSure application.

---

## Features

- **Google OAuth 2.0 Integration**: Secure, one-tap login and registration utilizing `@react-oauth/google`.
- **AI Symptom Analyzer**: Describe your child's symptoms in plain natural language, and our Groq LPU powered backend will automatically determine the best medical specialisation and find matching hospitals.
- **Interactive Maps**: Real-time geolocation and hospital mapping using Leaflet and React-Leaflet.
- **Symptom Matching UI**: Enter a child's symptoms to instantly receive the top recommended, specialized hospitals.
- **Web Share API Support**: Easily share hospital details natively on supported devices directly from the platform.
- **Responsive Design**: Custom-styled UI with a modern, mobile-first approach built with Tailwind CSS.
- **Dynamic Routing**: Seamless client-side transitions via React Router v7.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite |
| Styling | Tailwind CSS |
| Map Services | Leaflet + React Leaflet |
| Authentication | Google OAuth 2.0 (`@react-oauth/google`) |
| Icons | Lucide React |
| API Communication | Axios |

---

## Getting Started

### Prerequisites

- Node.js v18 or above
- A running instance of the [KidSure Backend Server](../server)

### Installation

**1. Clone the repository and navigate to the frontend directory**
```bash
git clone https://github.com/Varunesh07/kidsurefrontend.git
cd kidsurefrontend
```


**2. Install dependencies**
```bash
npm install
```

**3. Create a `.env` file** in the root of the `kidsurefrontend` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
```

> Ensure that `VITE_API_URL` points to your backend server URL.
> Obtain your `VITE_GOOGLE_CLIENT_ID` from the [Google Cloud Console](https://console.cloud.google.com/) under APIs & Services > Credentials. Make sure to configure the authorized JavaScript origins (e.g., `http://localhost:5173`).

**4. Start the development server**
```bash
npm run dev
```

You should see an output indicating that the Vite server is running. Open `http://localhost:5173` in your browser.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | The REST API endpoint URL of your backend. Example: `http://localhost:5000` |
| `VITE_GOOGLE_CLIENT_ID` | Your Google OAuth 2.0 Client ID for enabling Google login on the frontend. |

---

## Building for Production

To create a production-ready build:

```bash
npm run build
```

The bundled assets will be generated in the `dist` folder. You can preview the production build locally by running:

```bash
npm run preview
```
