# 🌩️ AeroRain: Advanced Precipitation Prediction API

A modern, machine learning-powered web application built for predicting localized rainfall probabilities using Gradient Boosting Algorithms and real-time atmospheric APIs. 

This repository was meticulously structured and designed as a Final Year Academic Project, featuring an interactive geospatial map, dynamic AI insights, and responsive glassmorphism aesthetics.

## 🚀 Key Features
- **Hyper-Local ML Predictions**: Feeds 10 atmospheric features (Pressure, Humidity, Max/Min Temp, Dew Point, Cloud Cover, Wind Direction & Speed) into a pre-trained `.pkl` ML model to predict precipitation likelihood.
- **Interactive Geolocation Mapping**: Utilizes Leaflet.js to securely pinpoint user coordinates and map the exact geographic boundaries being queried. 
- **Generative AI Insights**: Programmatically analyzes pressure thresholds and humidity loops alongside the ML probability to dynamically generate human-readable environmental summaries.
- **Responsive Web Dashboard**: A mobile-first CSS pipeline that automatically expands into a premium 2-column Grid format for laptop/desktop presentations.
- **Real Historical Context**: Open-Meteo API integration retrieves the authentic past 7 days of rainfall to plot alongside the 7-day future horizon.

## 🛠️ Stack Architecture
**Backend**
- Python 3
- FastAPI / Uvicorn (REST API routing & Static mounting)
- Scikit-Learn (Model inference)
- HTTPX (Asynchronous API data fetching)

**Frontend**
- Vanilla Javascript (ES6)
- CSS3 (Glassmorphism & Grid)
- Chart.js (Data Visualization)
- Leaflet.js (Map Overlay)

## 💻 Getting Started

1. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Boot the Server**
   ```bash
   cd "backend"
   python main.py
   ```

3. **Access the Application**
   Open your browser to: `http://127.0.0.1:8000`
