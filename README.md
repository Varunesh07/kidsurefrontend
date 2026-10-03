# KidSure — Frontend

The modern, responsive web application for **KidSure** — a location-aware paediatric healthcare discovery platform. Built with **React 19**, **Vite**, **Tailwind CSS**, and **Leaflet GIS**, KidSure helps parents and caregivers quickly find the most suitable pediatric medical care for their children based on symptoms, specialized facilities, and geographic proximity.

> **Latest Update**: Recently merged with `feature/hospital-discovery`, introducing state-wide GIS hospital discovery across 38 Tamil Nadu districts, interactive polygon boundary overlays, hardware-accelerated mobile Leaflet rendering, and automatic 50 km proximity fallback.

---

## Features

### 🌟 Recently Integrated (`feature/hospital-discovery`)
- **Full-Screen GIS Hospital Discovery Explorer (`/explore-hospitals`)**:
  - Interactive spatial discovery interface covering **1,021 pediatric facilities** across Tamil Nadu.
  - Real-time district filtering across all 38 districts with dynamic camera re-centering.
  - Multi-tier facility categorization: Primary Health Centres (PHC), Community Health Centres (CHC), Sub-District Hospitals, District Headquarters, and Government Medical Colleges.
  - Pediatric capability filters: **NICU**, **PICU**, **24/7 Emergency**, **Ventilator Ready**, and **Pediatric Surgery**.
- **Interactive District Boundary Overlays**:
  - High-precision GeoJSON polygon boundaries dynamically rendered on the map with boundary highlights and interactive district tooltips.
- **Mobile Hardware Acceleration & GIS Optimization**:
  - Configured with **HTML5 Canvas rendering** (`preferCanvas: true`) for lightweight, lag-free marker rendering on mobile devices.
  - Debounced tile loading (`updateWhenZooming={false}`, `updateWhenIdle={true}`) and selective popup mounting preventing UI stutter on high-density displays.
  - Dynamic map dimension invalidation (`map.invalidateSize()`) preventing grey or clipped tiles when switching views or rotating mobile devices.
- **Adaptive Proximity Fallback Engine (10 km ➔ 50 km)**:
  - Both the Home Dashboard and Symptom Match Results pages automatically detect when fewer than minimum facilities exist within 10 km and seamlessly expand the search radius to 50 km with an informative visual indicator.
- **Network-Adaptive Mobile Testing**:
  - Axios client dynamically detects mobile device connections on local networks (Wi-Fi), routing requests to the local server without manual configuration.

### 🛡️ Core & Existing Features
- **AI Symptom Checker & Clinical Triage**:
  - Enter natural language descriptions of symptoms (e.g., *"Baby has high fever and breathing rapidly"*) to receive instant severity analysis and matching facility recommendations.
  - Curated clinical symptom selector organized by body system (General/Fever, Respiratory, Gastrointestinal, Neurological, ENT, Skin).
- **Google OAuth 2.0 Integration**:
  - Instant, one-tap authentication and registration using `@react-oauth/google`.
- **Interactive Maps & Real-Time Geolocation**:
  - Real-time GPS location detection with interactive Leaflet map views, customized facility markers, and live route navigation links via Google Maps.
- **Star Ratings & Reviews**:
  - Interactive star rating system with instant visual averages and verified user reviews.
- **Bookmarked / Saved Hospitals**:
  - Save hospitals to your user profile for rapid one-tap access during emergencies.
- **Native Web Share API**:
  - Instant sharing of hospital addresses, phone numbers, and location links directly to WhatsApp, SMS, or native mobile share sheets.
- **Administrative Portals**:
  - Dedicated dashboards for Hospital Admins (listing management) and Superadmins (approval/rejection workflows and user management).
- **Modern Responsive Design**:
  - Mobile-first interface designed with Tailwind CSS, supporting dark/light contrasts, accessible buttons, and fluid mobile navigation drawers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + Vite |
| **Routing** | React Router v7 |
| **Styling** | Tailwind CSS |
| **GIS / Mapping** | Leaflet + React Leaflet (HTML5 Canvas Engine) |
| **Authentication** | Google OAuth 2.0 (`@react-oauth/google`) + JWT |
| **Icons** | Lucide React |
| **HTTP Client** | Axios (with dynamic network hostname detection) |

---

## Project Structure

```text
kidsurefrontend/
├── public/                 # Static assets, logos, and favicons
├── src/
│   ├── api/
│   │   └── axios.js        # Adaptive Axios client with token interceptor
│   ├── components/
│   │   ├── MapView.jsx     # High-performance Canvas Leaflet GIS component
│   │   ├── Navbar.jsx      # Navigation header with auth controls
│   │   ├── Sidebar.jsx     # Responsive mobile navigation drawer
│   │   └── ProtectedRoute.jsx # Role-based route guard
│   ├── pages/
│   │   ├── HomePage.jsx              # Hero, nearest emergency search & fallback
│   │   ├── HospitalDiscoveryPage.jsx # State-wide GIS spatial explorer
│   │   ├── SymptomCheckerPage.jsx    # Pediatric AI triage & symptom selector
│   │   ├── ResultsPage.jsx           # Filtered hospital listings & distance cards
│   │   ├── HospitalDetailPage.jsx    # Hospital facilities, ratings, and contact
│   │   ├── SavedHospitalsPage.jsx    # User bookmarked facilities
│   │   ├── AdminDashboard.jsx        # Superadmin approval queue
│   │   ├── HospitalAdminDashboard.jsx# Facility admin submission portal
│   │   ├── LoginPage.jsx             # Email/Password + Google Sign-In
│   │   └── RegisterPage.jsx          # User registration
│   ├── App.jsx             # Main application layout and route tree
│   ├── main.jsx            # Application entry point
│   └── index.css           # Tailwind base styles and Leaflet overrides
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js v18.x or above
- A running instance of the [KidSure Backend Server](https://github.com/Varunesh07/KidSure-Backend)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Varunesh07/kidsurefrontend.git
   cd kidsurefrontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (`.env`):**
   Create a `.env` file in the root directory:
   ```env
   # Backend API Endpoint
   VITE_API_URL=http://localhost:5000

   # Google OAuth 2.0 Client ID
   VITE_GOOGLE_CLIENT_ID=585275357206-fq0d4jopcoljdck8c0j1ch7u49koo30v.apps.googleusercontent.com
   ```

   > **Note for Production (Vercel)**: Set `VITE_API_URL` to your production backend URL (e.g. `https://your-backend.onrender.com` without a trailing slash).

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

5. **(Optional) Testing on a Mobile Phone over Local Wi-Fi:**
   ```bash
   npm run dev -- --host
   ```
   Open the displayed Network address (e.g. `http://192.168.x.x:5173`) from your mobile device connected to the same Wi-Fi.

---

## Production Build

To build the application for deployment:

```bash
npm run build
```

The optimized static assets will be output to the `dist/` directory, ready for deployment on platforms such as **Vercel**, **Netlify**, or **Cloudflare Pages**.

To preview the production build locally:

```bash
npm run preview
```

---

## Deployment Guidelines (Vercel)

When deploying on Vercel:
1. Connect your GitHub repository.
2. In **Settings ➔ Environment Variables**, ensure:
   - `VITE_API_URL` is set to your live Render backend URL.
   - `VITE_GOOGLE_CLIENT_ID` is set to your Google Cloud client ID.
3. Deploy!
