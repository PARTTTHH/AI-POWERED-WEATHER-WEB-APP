
const urlParams = new URLSearchParams(window.location.search);
const city = urlParams.get('city');

if (city) {
    fetchWeeklyWeather(city);
} else {
    console.log("No city specified");
}

async function fetchWeeklyWeather(query) {
    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) throw new Error('City not found');

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=auto`;
        
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        processWeeklyData(weatherData);

    } catch (error) {
        console.error("Error fetching weekly data:", error);
    }
}

let weeklyDataStore = null;
let currentView = 'TEMP'; 

function processWeeklyData(data) {
    if (!data.daily) return;
    
    const daily = data.daily;
    const hourly = data.hourly;
    
    const processed = [];
    
    for(let i=0; i<7; i++) {
        const dateStr = daily.time[i];
        const dateObj = new Date(dateStr);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

        const tempMax = daily.temperature_2m_max[i];
        const tempMin = daily.temperature_2m_min[i];
        const windMax = daily.windspeed_10m_max[i];
        const code = daily.weathercode[i];

        let humiditySum = 0;
        let count = 0;
        const startIdx = i * 24; 
        for(let h=0; h<24; h++) {
            if(hourly.relativehumidity_2m[startIdx + h] !== undefined) {
                humiditySum += hourly.relativehumidity_2m[startIdx + h];
                count++;
            }
        }
        const humidityAvg = count > 0 ? Math.round(humiditySum / count) : 0;

        processed.push({
            day: dayName,
            tempMax,
            tempMin,
            windMax,
            humidityAvg,
            code
        });
    }

    weeklyDataStore = processed;
    updateWeeklyView(currentView);
}

window.updateWeeklyView = function(view) {
    currentView = view;
    if (!weeklyDataStore) return;

    document.querySelectorAll('.toggle-btn').forEach(btn => {
        if(btn.innerText === view) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const grid = document.getElementById('weeklyGrid');
    if(grid) {
        grid.innerHTML = '';
        weeklyDataStore.forEach(day => {
            let valueHTML = '';
            let subHTML = '';
            let iconChar = getWeatherIcon(day.code);
    
            if (view === 'TEMP') {
                valueHTML = `${day.tempMax}°`;
                subHTML = `${day.tempMin}°`;
            } else if (view === 'WIND') {
                valueHTML = `${day.windMax}`;
                subHTML = `km/h`;
                iconChar = '💨';
            } else if (view === 'HUMIDITY') {
                valueHTML = `${day.humidityAvg}%`;
                subHTML = `Avg`;
                iconChar = '💧';
            }
    
            const card = document.createElement('div');
            card.className = 'day-card';
            card.innerHTML = `
                <div class="day-name">${day.day}</div>
                <div class="day-icon">${iconChar}</div>
                <div>
                    <div class="day-value">${valueHTML}</div>
                    <div class="day-sub">${subHTML}</div>
                </div>
            `;
            grid.appendChild(card);
        });
    }
};

function getWeatherIcon(code) {
    if (code === 0) return '☀️'; 
    if (code > 0 && code < 3) return '☁️☁️'; 
    if (code === 3) return '☁️'; 
    if (code >= 45 && code <= 48) return '🌫️'; 
    if (code >= 51 && code <= 67) return '🌧️'; 
    if (code >= 71 && code <= 77) return '❄️'; 
    if (code >= 95) return '⛈️'; 
    return '🌥️';
}

const links = document.querySelectorAll('.navbar1 a');
links.forEach(link => {
    if (city) {
        const href = link.getAttribute('href');
        if (href === '/weekly' || href === '/maps' || href === '/today') {
            link.setAttribute('href', `${href}?city=${encodeURIComponent(city)}`);
        }
    }
});
