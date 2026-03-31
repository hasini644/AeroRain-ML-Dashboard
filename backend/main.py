from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import pickle
import numpy as np
import httpx
import os
import warnings

# Suppress standard sklearn warnings about missing feature names (since we pass raw arrays)
warnings.filterwarnings("ignore", category=UserWarning)

app = FastAPI(title="Rain Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_PATH = os.path.join(BASE_DIR, "rain_model.pkl")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

class Coordinates(BaseModel):
    lat: float
    lon: float

@app.post("/api/predict")
async def predict_rain(coords: Coordinates):
    url = f"https://api.open-meteo.com/v1/forecast?latitude={coords.lat}&longitude={coords.lon}&current=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,surface_pressure,cloud_cover,wind_speed_10m,wind_direction_10m&daily=temperature_2m_max,temperature_2m_min,sunshine_duration,precipitation_probability_max,precipitation_sum,uv_index_max&past_days=7&timezone=auto"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        data = response.json()
    
    try:
        current = data['current']
        daily = data['daily']
        
        pressure = current['surface_pressure']
        temperature = current['temperature_2m']
        dewpoint = current['dew_point_2m']
        humidity = current['relative_humidity_2m']
        cloud = current['cloud_cover']
        windspeed = current['wind_speed_10m']
        winddirection = current['wind_direction_10m']
        
        # Using past_days=7 makes today index 7 (0-6 are past 7 days)
        today_idx = 7
        
        maxtemp = daily['temperature_2m_max'][today_idx]
        mintemp = daily['temperature_2m_min'][today_idx]
        sunshine_sec = daily['sunshine_duration'][today_idx] if 'sunshine_duration' in daily and daily['sunshine_duration'][today_idx] is not None else 0
        sunshine = sunshine_sec / 3600.0

        features = np.array([[pressure, maxtemp, temperature, mintemp, dewpoint, humidity, cloud, sunshine, winddirection, windspeed]])
        
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        probability_rain = float(probabilities[1]) * 100
        
        # Additional Advanced Metrics
        feels_like = current.get('apparent_temperature', temperature)
        uv_index_today = daily.get('uv_index_max', [0]*14)[today_idx]
        
        # Historical Data (Past 7 days)
        hist_dates = daily['time'][0:7]
        hist_precip = daily['precipitation_sum'][0:7]
        
        return {
            "prediction": int(prediction),
            "probability": round(probability_rain, 1),
            "current_conditions": {
                "temperature": temperature,
                "humidity": humidity,
                "windspeed": windspeed,
                "pressure": pressure,
                "feels_like": feels_like,
                "uv_index": uv_index_today
            },
            "forecast_7_days": {
                "dates": daily['time'][today_idx:today_idx+7],
                "max_temps": daily['temperature_2m_max'][today_idx:today_idx+7],
                "min_temps": daily['temperature_2m_min'][today_idx:today_idx+7],
                "precip_probs": daily.get('precipitation_probability_max', [])[today_idx:today_idx+7]
            },
            "historical_data": {
                "dates": hist_dates,
                "precipitation": hist_precip
            }
        }
    except Exception as e:
        return {"error": str(e), "data": data}

FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

