# Weather App

A real-time weather app built with vanilla JavaScript using the OpenWeatherMap API. Shows current conditions, 12-hour hourly forecast, and a 5-day outlook — with geolocation, city search autocomplete, °C/°F toggle, and a dynamic day/night video background.

**Live Demo:** https://ivarunsharma.github.io/weather-app/

---

## Features

- Detects your location automatically via browser geolocation
- Search any city worldwide with autocomplete suggestions
- Current weather — temperature, description, high/low, wind speed, feels like, humidity
- 12-hour hourly forecast with weather icons
- 5-day day-wise forecast
- Toggle between °C and °F without re-fetching data
- Dynamic video background that switches between day and night based on local time
- Glassmorphism UI that works against the video backdrop

---

## Tech Stack

- HTML, CSS, Vanilla JavaScript (no frameworks)
- [OpenWeatherMap API](https://openweathermap.org/api) — Current Weather, Forecast, and Geocoding endpoints
- GitHub Pages for deployment

---

## Running Locally

This app makes API calls via `fetch()`, so it must be served over HTTP — opening `index.html` directly as a file won't work.

**Option 1 — VS Code Live Server (easiest)**

1. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. App opens at `http://127.0.0.1:5500`

**Option 2 — Python (no install needed)**

```bash
cd weather-app
python3 -m http.server 8080
```

Open `http://localhost:8080` in your browser.

**Option 3 — Node.js**

```bash
npx serve weather-app
```

---

## API Key Setup

The app uses the [OpenWeatherMap API](https://openweathermap.org/api). A key is already included for demo purposes, but if you fork this repo and plan to use it seriously:

1. Sign up at [openweathermap.org](https://openweathermap.org) (free tier is sufficient)
2. Generate an API key from your account dashboard
3. Replace the value of `API_KEY` at the top of `main.js`

> Note: For production use, API keys should be kept server-side and never exposed in client-side code.

---

## Project Structure

```
weather-app/
├── index.html        # App markup
├── main.js           # All logic — API calls, rendering, event handling
├── style.css         # Styling and glassmorphism layout
├── day-video.mp4     # Background video for daytime (6am–6pm)
└── night-video.mp4   # Background video for nighttime
```

---

## Deployment

This app is deployed via GitHub Pages. To deploy your own fork:

1. Push your code to a GitHub repository
2. Go to **Settings → Pages**
3. Under **Branch**, select `main` and folder `/ (root)`
4. Click **Save** — the site goes live at `https://<your-username>.github.io/<repo-name>/`
