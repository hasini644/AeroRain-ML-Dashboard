import streamlit as st
import numpy as np
import pickle

# Load model
model = pickle.load(open("rain_model.pkl", "rb"))

# Page settings
st.set_page_config(page_title="Rain Prediction", page_icon="🌧️", layout="centered")

# Custom CSS (Premium UI)
st.markdown("""
<style>
body {
    background-color: #0f172a;
}
.main {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    color: white;
    border-radius: 15px;
    padding: 20px;
}
h1 {
    text-align: center;
    color: #38bdf8;
}
.stButton>button {
    background: linear-gradient(90deg, #38bdf8, #6366f1);
    color: white;
    border-radius: 12px;
    height: 3em;
    width: 100%;
    font-size: 18px;
    font-weight: bold;
    border: none;
    transition: 0.3s;
}
.stButton>button:hover {
    background: linear-gradient(90deg, #6366f1, #38bdf8);
    transform: scale(1.05);
}
.result-box {
    text-align: center;
    padding: 15px;
    border-radius: 12px;
    font-size: 20px;
    font-weight: bold;
}
</style>
""", unsafe_allow_html=True)

# Title
st.markdown("<h1>🌧️ Rainfall Prediction System</h1>", unsafe_allow_html=True)

# Input fields
pressure = st.number_input("Pressure", value=1015.0)
maxtemp = st.number_input("Max Temperature", value=30.0)
temperature = st.number_input("Temperature", value=28.0)
mintemp = st.number_input("Min Temperature", value=25.0)
dewpoint = st.number_input("Dew Point", value=24.0)
humidity = st.number_input("Humidity", value=80)
cloud = st.number_input("Cloud", value=40)
sunshine = st.number_input("Sunshine", value=7.0)
winddirection = st.number_input("Wind Direction", value=100.0)
windspeed = st.number_input("Wind Speed", value=10.0)

# Prediction button
if st.button("✨ Predict Weather"):
    input_data = np.array([[pressure, maxtemp, temperature, mintemp, dewpoint,
                            humidity, cloud, sunshine, winddirection, windspeed]])

    prediction = model.predict(input_data)

    if prediction[0] == 1:
        st.markdown('<div class="result-box" style="background-color:#16a34a;">🌧️ Rain Expected</div>', unsafe_allow_html=True)
    else:
        st.markdown('<div class="result-box" style="background-color:#dc2626;">☀️ No Rain</div>', unsafe_allow_html=True)