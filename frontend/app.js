lucide.createIcons();

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                updateLocationName(lat, lon);
                await fetchWeatherData(lat, lon);
            },
            async (err) => {
                console.warn("Geolocation denied/insecure, attempting IP fallback...");
                await useIPFallback();
            }
        );
    } else {
        await useIPFallback();
    }
    
    setupModal();
}

async function useIPFallback() {
    try {
        const res = await fetch('https://get.geojs.io/v1/ip/geo.json');
        const data = await res.json();
        const lat = parseFloat(data.latitude);
        const lon = parseFloat(data.longitude);
        document.getElementById('location-name').innerHTML = `<i data-lucide="map-pin"></i> ${data.city || 'Network Location'}`;
        lucide.createIcons();
        await fetchWeatherData(lat, lon);
    } catch (e) {
        document.getElementById('location-name').innerHTML = `<i data-lucide="map-pin"></i> London (Default)`;
        fetchWeatherData(51.5074, -0.1278);
        lucide.createIcons();
    }
}

async function updateLocationName(lat, lon) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
        const data = await res.json();
        const addr = data.address || {};
        
        // Prioritize major geographic entities over tiny neighbourhoods which can sometimes map incorrectly
        const placeName = addr.city || addr.town || addr.municipality || addr.village;
        const fallback = addr.suburb || addr.county || addr.state || "Unknown Location";
        const finalPlace = placeName ? placeName : fallback;
        
        document.getElementById('location-name').innerHTML = `<i data-lucide="map-pin"></i> ${finalPlace}`;
        lucide.createIcons();
    } catch(e) {
        console.error(e);
    }
}

async function fetchWeatherData(lat, lon) {
    try {
        const res = await fetch('/api/predict', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({lat, lon})
        });
        const data = await res.json();
        
        if (data.error) throw new Error(data.error);
        updateUI(data);
        renderMap(lat, lon);
    } catch (e) {
        document.getElementById('status-text').innerText = "Simulating Location...";
        const mockData = {
            probability: 82, 
            current_conditions: {temperature: 24, humidity: 80, windspeed: 15, uv_index: 6, feels_like: 26, pressure: 1008},
            forecast_7_days: {
                dates: [new Date().toISOString(), new Date(Date.now() + 86400000).toISOString(), new Date(Date.now() + 86400000*2).toISOString()],
                max_temps: [25, 22, 28]
            },
            historical_data: {
                dates: ['2023-01-01', '2023-01-02', '2023-01-03', '2023-01-04', '2023-01-05', '2023-01-06', '2023-01-07'],
                precipitation: [12, 5, 0, 15, 2, 3, 20]
            }
        };
        updateUI(mockData);
        renderMap(lat || 51.5074, lon || -0.1278);
    }
}

function updateUI(data) {
    document.getElementById('curr-temp').innerText = `${data.current_conditions.temperature}°C`;
    document.getElementById('curr-hum').innerText = `${data.current_conditions.humidity}%`;
    document.getElementById('curr-wind').innerText = `${data.current_conditions.windspeed} km/h`;
    document.getElementById('curr-uv').innerText = data.current_conditions.uv_index;
    document.getElementById('curr-feels').innerText = `${Math.round(data.current_conditions.feels_like)}°C`;
    document.getElementById('curr-pres').innerText = `${Math.round(data.current_conditions.pressure)} hPa`;
    
    updateMainRing(parseFloat(data.probability), "Right Now");
    generateAIInsight(data);
    renderChart(data.historical_data);
    
    const forecastList = document.getElementById('forecast-list');
    forecastList.innerHTML = '';
    const dates = data.forecast_7_days.dates;
    const maxTemps = data.forecast_7_days.max_temps;
    const precipProbs = data.forecast_7_days.precip_probs || Array(7).fill(data.probability);
    
    dates.forEach((dateStr, i) => {
        const d = new Date(dateStr);
        const dayName = i === 0 ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' });
        
        const card = document.createElement('div');
        card.className = 'forecast-card';
        card.style.cursor = 'pointer';
        
        const dayProb = i === 0 ? parseFloat(data.probability) : precipProbs[i];
        
        card.innerHTML = `
            <span class="day">${dayName}</span>
            <i data-lucide="${maxTemps[i] > 24 && dayProb < 50 ? 'sun' : 'cloud-rain'}"></i>
            <span class="temp">${Math.round(maxTemps[i])}°</span>
        `;
        
        card.addEventListener('click', () => {
            updateMainRing(dayProb, dayName);
            document.querySelectorAll('.forecast-card').forEach(c => c.style.borderColor = 'var(--glass-border)');
            card.style.borderColor = 'var(--accent-blue)';
        });
        
        forecastList.appendChild(card);
    });
    lucide.createIcons();
}

function updateMainRing(prob, title) {
    const ring = document.getElementById('prediction-ring');
    const chanceText = document.getElementById('rain-chance');
    const statusText = document.getElementById('status-text');
    
    chanceText.innerText = `${Math.round(prob)}%`;
    ring.style.background = `conic-gradient(var(--accent-blue) ${prob}%, transparent 0%)`;
    
    let timeContext = title === "Right Now" ? "Soon" : `on ${title}`;
    if (title === "Today") timeContext = "Today";
    
    if (prob > 50) {
        statusText.innerText = `Rain Expected ${title === "Right Now" ? "Soon" : timeContext}`;
        document.getElementById('bg-layer').classList.add('rainy');
        document.querySelector('.prediction-ring').style.boxShadow = '0 0 40px rgba(129, 140, 248, 0.4)';
    } else {
        statusText.innerText = `Clear Skies Expected ${title === "Right Now" ? "" : " " + timeContext}`;
        document.getElementById('bg-layer').classList.remove('rainy');
        document.querySelector('.prediction-ring').style.boxShadow = '0 0 40px rgba(56, 189, 248, 0.2)';
    }
}

function generateAIInsight(data) {
    const prob = parseFloat(data.probability);
    const press = parseFloat(data.current_conditions.pressure);
    const hum = parseFloat(data.current_conditions.humidity);
    
    let text = "";
    if (prob > 70) {
        text = `High probability of rain (${prob}%). `;
        if (press < 1010) text += "Dropping barometric pressure indicates an incoming storm system. ";
        text += "Carry an umbrella and expect wet conditions.";
    } else if (prob > 30) {
        text = `Moderate rain chance (${prob}%). `;
        if (hum > 70) text += "High humidity might lead to scattered showers. ";
        text += "Keep an eye on the sky.";
    } else {
        text = `Low probability of rain (${prob}%). `;
        if (press > 1015) text += "High pressure system is keeping the skies clear. ";
        text += "Great conditions for outdoor activities!";
    }
    
    document.getElementById('ai-insight-text').innerText = text;
}

let mapInstance = null;
let currentMarker = null;

function renderMap(lat, lon) {
    if (!mapInstance) {
        mapInstance = L.map('weather-map', { attributionControl: false }).setView([lat, lon], 10);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19
        }).addTo(mapInstance);
        
        currentMarker = L.marker([lat, lon]).addTo(mapInstance)
            .bindPopup('Analyzing this area.')
            .openPopup();
            
        mapInstance.on('click', async (e) => {
            const clickLat = e.latlng.lat;
            const clickLon = e.latlng.lng;
            document.getElementById('status-text').innerText = "Fetching new location data...";
            updateLocationName(clickLat, clickLon);
            await fetchWeatherData(clickLat, clickLon);
        });
    } else {
        mapInstance.setView([lat, lon], 10);
        if (currentMarker) mapInstance.removeLayer(currentMarker);
        currentMarker = L.marker([lat, lon]).addTo(mapInstance)
            .bindPopup('Analyzing this area.')
            .openPopup();
    }
    
    // Fix leaflet map not fully loading initially if it was hidden
    setTimeout(() => { mapInstance.invalidateSize(); }, 500);
}

let historyChartInstance = null;
function renderChart(historical_data) {
    const ctx = document.getElementById('historyChart').getContext('2d');
    
    if (historyChartInstance) {
        historyChartInstance.destroy();
    }
    
    let labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let dataPoints = [12, 5, 0, 15, 2, 3, 20];
    
    if (historical_data && historical_data.dates) {
        labels = historical_data.dates.map(d => new Date(d).toLocaleDateString('en-US', {weekday: 'short'}));
        dataPoints = historical_data.precipitation;
    }

    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Historical Rainfall (mm)',
                data: dataPoints,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#fff' } } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

function setupModal() {
    const modal = document.getElementById('notif-modal');
    document.getElementById('settings-btn').addEventListener('click', () => modal.classList.add('active'));
    document.getElementById('close-modal').addEventListener('click', () => modal.classList.remove('active'));
    
    const slider = document.getElementById('alert-slider');
    const val = document.getElementById('alert-val');
    slider.addEventListener('input', (e) => val.innerText = `${e.target.value}%`);
    
    document.getElementById('save-alert').addEventListener('click', () => {
        alert("Alert preferences saved successfully!");
        modal.classList.remove('active');
    });
}
