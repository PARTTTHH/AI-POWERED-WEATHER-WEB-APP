
const urlParams = new URLSearchParams(window.location.search);
const city = urlParams.get("city");

const now = new Date();
document.getElementById("dateInfo").innerText = now.toLocaleString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

if (city) {
  document.getElementById(
    "cityNameHeader"
  ).innerText = `${city} - DAILY INSIGHTS`;
  fetchDetailedWeather(city);
} else {
  document.getElementById("cityNameHeader").innerText = "DAILY INSIGHTS";
}

async function fetchDetailedWeather(query) {
  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
      query
    )}&count=1&language=en&format=json`;
    const geoResponse = await fetch(geoUrl);
    const geoData = await geoResponse.json();

    if (!geoData.results || geoData.results.length === 0)
      throw new Error("CITY NOT FOUND");

    const location = geoData.results[0];
    const lat = location.latitude;
    const lon = location.longitude;
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=pressure_msl,visibility,uv_index,apparent_temperature&daily=sunrise,sunset&timezone=auto`;
    const airUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=us_aqi&timezone=auto`;

    const [weatherRes, airRes] = await Promise.all([
      fetch(weatherUrl),
      fetch(airUrl),
    ]);

    const weatherData = await weatherRes.json();
    const airData = await airRes.json();

    updateWidgets(weatherData, airData);
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

function updateWidgets(weather, air) {
  const currentHourISO = new Date().toISOString().slice(0, 13);
  const wTimeArray = weather.hourly.time;
  let idx = wTimeArray.findIndex((t) => t.startsWith(currentHourISO));
  if (idx === -1) idx = 0;

  const aTimeArray = air.hourly.time;
  let aIdx = aTimeArray.findIndex((t) => t.startsWith(currentHourISO));
  if (aIdx === -1) aIdx = 0;

  const aqi = air.hourly.us_aqi[aIdx];
  updateAQI(aqi);

  const uv = weather.hourly.uv_index[idx];
  updateUV(uv);

  const pressure = weather.hourly.pressure_msl[idx];
  document.getElementById("pressureValue").innerText = `${Math.round(
    pressure
  )} hPa`;
  const arrow = document.getElementById("pressureArrow");
  if (pressure > 1015) {
    arrow.innerText = "↑";
    arrow.title = "High Pressure";
  }
  else if (pressure < 1010) {
    arrow.innerText = "↓";
    arrow.title = "Low Pressure";
  }
  else {
    arrow.innerText = "→";
    arrow.title = "Steady";
  }

  const sunriseStr = weather.daily.sunrise[0];
  const sunsetStr = weather.daily.sunset[0];
  document.getElementById("sunriseVal").innerText = formatTime(sunriseStr);
  document.getElementById("sunsetVal").innerText = formatTime(sunsetStr);

  const visibilityMeters = weather.hourly.visibility[idx];
  const visibilityKm = (visibilityMeters / 1000).toFixed(1);
  document.getElementById("visibilityValue").innerText = `${visibilityKm} km`;

  let vizStatus = "Clear";
  if (visibilityKm < 1) vizStatus = "Foggy";
  else if (visibilityKm < 5) vizStatus = "Haze";
  else if (visibilityKm > 10) vizStatus = "Excellent";
  document.getElementById("visibilityStatus").innerText = vizStatus;

  const feelsLike = weather.hourly.apparent_temperature[idx];
  const actual = weather.current_weather.temperature;
  document.getElementById("feelsLikeValue").innerText = `${feelsLike}°`;
  document.getElementById("actualTemp").innerText = `${actual}°`;
}

function updateAQI(aqi) {
  const elVal = document.getElementById("aqiValue");
  const elStatus = document.getElementById("aqiStatus");
  const elFill = document.getElementById("aqiFill");

  elVal.innerText = aqi;

  let status = "Good";
  let color = "#00e676";
  let pct = (aqi / 300) * 100;
  if (pct > 100) pct = 100;

  if (aqi <= 50) {
    status = "Good";
    color = "#00e676";
  } else if (aqi <= 100) {
    status = "Moderate";
    color = "#ffd600";
  } else if (aqi <= 150) {
    status = "Unhealthy for Groups";
    color = "#ff9100";
  } else if (aqi <= 200) {
    status = "Unhealthy";
    color = "#ff3d00";
  } else {
    status = "Hazardous";
    color = "#d50000";
  }

  elStatus.innerText = status;
  elFill.style.width = `${pct}%`;
  elFill.style.backgroundColor = color;
}

function updateUV(uv) {
  const elVal = document.getElementById("uvValue");
  const elStatus = document.getElementById("uvStatus");
  const elFill = document.getElementById("uvFill");

  elVal.innerText = uv;

  let status = "Low";
  let pct = (uv / 11) * 100;
  if (pct > 100) pct = 100;

  if (uv <= 2) status = "Low";
  else if (uv <= 5) status = "Moderate";
  else if (uv <= 7) status = "High";
  else if (uv <= 10) status = "Very High";
  else status = "Extreme";

  elStatus.innerText = status;
  elFill.style.width = `${pct}%`;

  elFill.style.background = "linear-gradient(90deg, #4caf50, #ffeb3b, #f44336)";
}

function formatTime(isoStr) {
  if (!isoStr) return "--:--";
  const date = new Date(isoStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
const links = document.querySelectorAll(".navbar1 a");
links.forEach((link) => {
  if (city) {
    const href = link.getAttribute("href");
    if (href === "/weekly" || href === "/maps" || href === "/today") {
      link.setAttribute("href", `${href}?city=${encodeURIComponent(city)}`);
    }
  }
});
