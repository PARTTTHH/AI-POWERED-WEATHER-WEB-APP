
var map = L.map('map').setView([19.0760, 72.8777], 10);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const urlParams = new URLSearchParams(window.location.search);
const city = urlParams.get('city');

if (city) {
    fetchWeather(city);
}

async function fetchWeather(query) {
    const weatherDisplay = document.getElementById('weatherDisplay');
    weatherDisplay.style.display = 'flex';

    document.getElementById('cityName').innerText = "Locating " + query + "...";
    
    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
        
        const geoResponse = await fetch(geoUrl);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found');
        }

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;
        const name = location.name;
        const country = location.country;

        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=relativehumidity_2m,surface_pressure,temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,windspeed_10m_max&timezone=auto`;
        
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        const current = weatherData.current_weather;
        
        updateUI(name, country, current, weatherData);
        
        processHourlyData(weatherData);
        document.getElementById('weeklyDisplay').style.display = 'flex';

        map.setView([lat, lon], 12);
        L.marker([lat, lon]).addTo(map)
            .bindPopup(`<b>${name}</b><br>Temp: ${current.temperature}°C`)
            .openPopup();

    } catch (error) {
        console.error("Error:", error);
        document.getElementById('cityName').innerText = "Error: " + error.message;
        document.getElementById('dateInfo').innerText = "Please try again.";
    }
}

function updateUI(name, country, data, fullData) {
    document.getElementById('cityName').innerText = `${name}, ${country}`;
    const now = new Date();
    document.getElementById('dateInfo').innerText = now.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    document.getElementById('tempValue').innerText = `${data.temperature}°C`;
    document.getElementById('windValue').innerText = `${data.windspeed} km/h`;
    
    const condition = getWeatherCondition(data.weathercode);
    document.getElementById('conditionValue').innerText = condition;

    if (fullData.hourly && fullData.hourly.relativehumidity_2m) {
        const timeArray = fullData.hourly.time;
        const currentHourISO = new Date().toISOString().slice(0, 13); 
        const index = timeArray.findIndex(t => t.startsWith(currentHourISO));
        const closestIndex = index !== -1 ? index : 0; 
        const humidity = fullData.hourly.relativehumidity_2m[closestIndex];
        document.getElementById('humidityValue').innerText = `${humidity}%`;
    } else {
        document.getElementById('humidityValue').innerText = "N/A"; 
    }
}

function getWeatherCondition(code) {
    const codes = {
        0: "Clear Sky",
        1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Fog", 48: "Depositing Rime Fog",
        51: "Drizzle: Light", 53: "Drizzle: Moderate", 55: "Drizzle: Dense",
        61: "Rain: Slight", 63: "Rain: Moderate", 65: "Rain: Heavy",
        71: "Snow: Slight", 73: "Snow: Moderate", 75: "Snow: Heavy",
        95: "Thunderstorm: Slight", 96: "Thunderstorm: Slight Hail", 99: "Thunderstorm: Heavy Hail"
    };
    return codes[code] || "Unknown";
}


function processHourlyData(data) {
    if (!data.hourly) return;
    
    const hourly = data.hourly;
    const grid = document.getElementById('hourlyGrid');
    grid.innerHTML = '';
    
    const currentHourISO = new Date().toISOString().slice(0, 13);
    let startIdx = hourly.time.findIndex(t => t.startsWith(currentHourISO));
    if (startIdx === -1) startIdx = 0; 

  
    for(let i = startIdx; i < startIdx + 24; i++) {
        if (!hourly.time[i]) break;

        const timeStr = hourly.time[i];
        const dateObj = new Date(timeStr);
        const hourLabel = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }); // "2 PM"

        const temp = hourly.temperature_2m[i];
        const code = hourly.weathercode[i];
        const iconChar = getWeatherIcon(code);

        const card = document.createElement('div');
        card.className = 'day-card'; 
        card.innerHTML = `
            <div class="day-name" style="font-size: 0.9rem;">${hourLabel}</div>
            <div class="day-icon">${iconChar}</div>
            <div>
                <div class="day-value">${temp}°</div>
            </div>
        `;
        grid.appendChild(card);
    }
}

function getWeatherIcon(code) {
    if (code === 0) return '☀️'; // Clear
    if (code > 0 && code < 3) return '☁️☁️'; // Cloud
    if (code === 3) return '☁️'; // Overcast
    if (code >= 45 && code <= 48) return '🌫️'; // Fog
    if (code >= 51 && code <= 67) return '🌧️'; // Rain
    if (code >= 71 && code <= 77) return '❄️'; // Snow
    if (code >= 95) return '⛈️'; // Thunder
    return '🌥️';
}


const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;
const mainDiv = document.querySelector('.main');
const mainWeekly = document.querySelector('.main-weekly'); 
const mainTwo = document.querySelector('.main-2');
const mainThree = document.querySelector('.main-3');

themeToggle.addEventListener("click", () => {
    body.classList.toggle("dark");

    if (body.classList.contains("dark")) {
        const nightSky = "url('/static/result/RESOURCES/TEXTURES/MILKY_WAY.jpg')";
        body.style.backgroundImage = nightSky;
        mainDiv.style.backgroundImage = nightSky;
        if (mainWeekly) mainWeekly.style.backgroundImage = nightSky;
        if (mainTwo) mainTwo.style.backgroundImage = nightSky;
        if (mainThree) mainThree.style.backgroundImage = nightSky;

    } else {
        const dayCloud = "url('/static/result/RESOURCES/CLOUD_BG_1/CLOUD_1.jpg')";
        body.style.backgroundImage = dayCloud;
        mainDiv.style.backgroundImage = dayCloud;
        if (mainWeekly) mainWeekly.style.backgroundImage = "url('/static/result/RESOURCES/CLOUD_BG_1/CLOUD_1.jpg')";
        if (mainTwo) mainTwo.style.backgroundImage = "url('/static/result/RESOURCES/CLOUD_BG_1/CLOUD_1.jpg')";
        if (mainThree) mainThree.style.backgroundImage = "url('/static/result/RESOURCES/CLOUD_BG_2/CLOUD_2.jpg')";
    }
});


const AU = 18;                 
const EARTH_ECC = 0.0167;     
const MOON_ECC = 0.0549;

function toJulian(date) {
    return (date.getTime() / 86400000) + 2440587.5;
}

function normalizeAngle(radians) {
        return radians - 2 * Math.PI * Math.floor(radians / (2 * Math.PI));
    }

function getAstronomyAngles() {
        const now = new Date();
        const jd = toJulian(now);
        const d = jd - 2451545.0; 

        const gSun = (357.529 + 0.98560028 * d) % 360;
        
        const LSun = (280.459 + 0.98564736 * d) % 360;

        const lambdaSun = LSun + 1.915 * Math.sin(gSun * Math.PI/180) + 0.020 * Math.sin(2 * gSun * Math.PI/180);
        
        const earthAngle = normalizeAngle((lambdaSun + 180) * Math.PI / 180);
        
        const L_moon = (218.316 + 13.176396 * d) % 360;
        
        const M_moon = (134.963 + 13.064993 * d) % 360;
        
        const lambdaMoon = L_moon + 6.289 * Math.sin(M_moon * Math.PI/180);

        const moonAngle = normalizeAngle(lambdaMoon * Math.PI / 180);

        let GMST = 280.46061837 + 360.98564736629 * d;
        GMST %= 360;
        if (GMST < 0) GMST += 360;
        
        const earthRotation = normalizeAngle(GMST * Math.PI / 180);

        return {
            earth: earthAngle,
            moon: moonAngle,
            earthRotation: earthRotation
        };
    }

function initOrbitSimulation() {
        const canvas = document.getElementById("orbitCanvas");
        const container = canvas.parentElement;

        const scene = new THREE.Scene();
        const bgTextureLoader = new THREE.TextureLoader();

        bgTextureLoader.load(
            "/static/result/RESOURCES/TEXTURES/MILKY_WAY.jpg",
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace; 
                scene.background = texture;
            },
            undefined,
            (err) => {
                console.error("Failed to load background texture", err);
                scene.background = new THREE.Color(0x000814);
            }
        );

        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
        camera.position.set(0, 20, 35);

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;

        function resize() {
            const w = container.clientWidth;
            const h = container.clientHeight;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h, false);
        }
        resize();
        window.addEventListener("resize", resize);

        const loader = new THREE.TextureLoader();
        function loadTextureWithFallback(path, fallbackColor) {
            return loader.load(path, undefined, undefined, (error) => {
                console.warn(`Texture not found: ${path}`);
            });
        }

        const sunLight = new THREE.PointLight(0xffffff, 2.5, 300);
        scene.add(sunLight);
        scene.add(new THREE.AmbientLight(0xffffff, 0.1));
        const sunTexture = loadTextureWithFallback("/static/result/RESOURCES/TEXTURES/sun.jpg");
        const sun = new THREE.Mesh(
            new THREE.SphereGeometry(4.5, 64, 64),
            new THREE.MeshBasicMaterial({
                map: sunTexture,
                color: 0xffdd44,
                emissive: 0xffaa00,
                emissiveIntensity: 0.8
            })
        );
        scene.add(sun);
        sunLight.position.copy(sun.position);

        const canvasGlow = document.createElement('canvas');
        canvasGlow.width = 128;
        canvasGlow.height = 128;
        const context = canvasGlow.getContext('2d');
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0.1, 'rgba(255, 255, 240, 1)'); 
        gradient.addColorStop(0.2, 'rgba(255, 220, 100, 1)');
        gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);

        const glowTexture = new THREE.CanvasTexture(canvasGlow);
        const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ 
            map: glowTexture, 
            color: 0xffaa00, 
            transparent: true, 
            bgBlending: THREE.AdditiveBlending,
            opacity: 0.9,
            depthWrite: false
        }));
        sunGlow.scale.set(15, 15, 1);
        sun.add(sunGlow);

        const earthGroup = new THREE.Group();
        scene.add(earthGroup);

        const earthTexture = loadTextureWithFallback("/static/result/RESOURCES/TEXTURES/earth.jpg");
        const earth = new THREE.Mesh(
            new THREE.SphereGeometry(2, 64, 64),
            new THREE.MeshStandardMaterial({
                map: earthTexture,
                color: 0x4488ff,
                roughness: 0.8,
                metalness: 0.2
            })
        );
        earth.rotation.z = THREE.MathUtils.degToRad(23.44);
        earth.castShadow = true;
        earth.receiveShadow = true;
        earthGroup.add(earth);
        const moonGroup = new THREE.Group();
        earthGroup.add(moonGroup); 

        const moonTexture = loadTextureWithFallback("/static/result/RESOURCES/TEXTURES/moon.jpg");
        const moon = new THREE.Mesh(
            new THREE.SphereGeometry(0.7, 32, 32),
            new THREE.MeshStandardMaterial({
                map: moonTexture,
                color: 0xcccccc,
                roughness: 0.9,
                metalness: 0.1
            })
        );
        moon.castShadow = true;
        moon.receiveShadow = true;
        moonGroup.add(moon);

        const earthOrbitPoints = [];
        for (let i = 0; i <= 200; i++) {
            const angle = (i / 200) * Math.PI * 2;
            const pos = ellipsePosition(AU, EARTH_ECC, angle);
            earthOrbitPoints.push(new THREE.Vector3(pos.x, 0, pos.z));
        }
        const earthOrbitLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(earthOrbitPoints),
            new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.4 })
        );
        scene.add(earthOrbitLine);

        const moonOrbitPoints = [];
        for (let i = 0; i <= 50; i++) {
            const angle = (i / 50) * Math.PI * 2;
            const pos = ellipsePosition(4, MOON_ECC, angle);
            moonOrbitPoints.push(new THREE.Vector3(pos.x, 0, pos.z));
        }
        const moonOrbitLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(moonOrbitPoints),
            new THREE.LineBasicMaterial({ color: 0xaaaaaa, transparent: true, opacity: 0.3 })
        );
        earthGroup.add(moonOrbitLine);

        function ellipsePosition(a, e, angle) {
            const r = (a * (1 - e * e)) / (1 + e * Math.cos(angle));
            return {
                x: r * Math.cos(angle),
                z: r * Math.sin(angle)
            };
        }

        let focusTarget = sun; 
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        canvas.addEventListener("click", (e) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const hits = raycaster.intersectObjects([sun, earth]);
            if (hits.length > 0) {
                const object = hits[0].object;
                if (object === sun) focusTarget = sun;
                else if (object === earth) focusTarget = earthGroup;
            }
        });

        const EARTH_TEXTURE_OFFSET = 3 * Math.PI / 2;

        function animate() {
            requestAnimationFrame(animate);
    
            const angles = getAstronomyAngles();

            const ep = ellipsePosition(AU, EARTH_ECC, angles.earth);
            earthGroup.position.set(ep.x, 0, ep.z);
            
            earth.rotation.y = angles.earthRotation + EARTH_TEXTURE_OFFSET;

            const mp = ellipsePosition(4, MOON_ECC, angles.moon);
            moon.position.set(mp.x, 0, mp.z);

            let targetPos = new THREE.Vector3();
            let offset = new THREE.Vector3();

            if (focusTarget === sun) {
                targetPos.copy(sun.position);
                offset.set(0, 20, 35); 
            } else if (focusTarget === earthGroup) {
                targetPos.copy(earthGroup.position);
                offset.set(0, 5, 12); 
            }

            const desiredPosition = targetPos.clone().add(offset);
            camera.position.lerp(desiredPosition, 0.05);
            camera.lookAt(targetPos);

            renderer.render(scene, camera);
        }

        animate();
    }

function waitForThree() {
    if (typeof THREE !== 'undefined') {
        console.log("✅ THREE.js loaded successfully");
        window.addEventListener("load", initOrbitSimulation);
    } else {
        console.log("⏳ Waiting for THREE.js to load...");
        setTimeout(waitForThree, 100);
    }
}

waitForThree();

function initCustomScrollbar() {
    const container = document.getElementById('customScrollbar');
    if(!container) {
        console.error("Custom Scrollbar container not found!");
        return;
    }

    const sections = [
        { id: 'weatherDisplay', label: 'Current Weather' },
        { id: 'weeklyDisplay',  label: 'Hourly Forecast' }, 
        { id: 'map',            label: 'Location Map' },
        { id: 'orbitCanvas',    label: 'Orbit Simulation' }
    ];

    console.log("Initializing custom scrollbar for sections:", sections);

    sections.forEach(section => {
        const el = document.getElementById(section.id);
        if (!el) {
            console.warn(`Element #${section.id} not found, skipping marker.`);
        }

        const marker = document.createElement('div');
        marker.className = 'scroll-marker';
        marker.dataset.target = section.id;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'scroll-tooltip';
        tooltip.innerText = section.label;
        marker.appendChild(tooltip);

        marker.addEventListener('click', () => {
            const target = document.getElementById(section.id);
            if(target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        });

        container.appendChild(marker);
    });

    console.log(`Added ${container.children.length} markers.`);

    function updateActiveMarker() {
        const scrollPos = window.scrollY + window.innerHeight / 2; 
        
        let activeId = null;

        sections.forEach(section => {
            const el = document.getElementById(section.id);
            if (el && el.offsetParent !== null) {
                const top = el.getBoundingClientRect().top + window.scrollY;
                const height = el.offsetHeight;
                
                if (scrollPos >= top && scrollPos < top + height) {
                    activeId = section.id;
                }
            }
        });

        document.querySelectorAll('.scroll-marker').forEach(m => {
            m.classList.toggle('active', m.dataset.target === activeId);
        });
    }

    window.addEventListener('scroll', updateActiveMarker);
    setTimeout(updateActiveMarker, 500);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomScrollbar);
} else {
    initCustomScrollbar();
}

function updateNavigationLinks() {
    if (city) {
        const links = document.querySelectorAll('.navbar1 a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href === '/weekly' || href === '/maps' || href === '/today') {
                link.setAttribute('href', `${href}?city=${encodeURIComponent(city)}`);
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavigationLinks);
} else {
    updateNavigationLinks();
}
