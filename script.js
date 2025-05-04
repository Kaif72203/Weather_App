
const API_KEY = '79f034c3616caa352bb3860653349ee9';

// DOM Elements
const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const recentList = document.getElementById('recent-list');
const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const weatherIcon = document.getElementById('weather-icon');
const temp = document.getElementById('temp');
const weatherDesc = document.getElementById('weather-desc');
const humidity = document.getElementById('humidity');
const wind = document.getElementById('wind');
const aqiCircle = document.getElementById('aqi-circle');
const aqiValue = document.getElementById('aqi-value');
const airQualityText = document.getElementById('air-quality-text');
const forecastItems = document.getElementById('forecast-items');
const hourlyScroll = document.getElementById('hourly-scroll');
const loadingOverlay = document.getElementById('loading-overlay');

// Recent searches array
let recentSearches = JSON.parse(localStorage.getItem('recentSearches')) || [];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    updateRecentSearches();
    loadLastSearch();
    
    // Set current date
    const date = new Date();
    currentDate.textContent = date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// Event listeners
searchBtn.addEventListener('click', searchWeather);
locationBtn.addEventListener('click', getLocationWeather);
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});

// Search weather by city name
function searchWeather() {
    const city = cityInput.value.trim();
    if (city) {
        showLoading(true);
        fetchWeatherData(city)
            .finally(() => showLoading(false));
    }
}

// Get weather by current location
function getLocationWeather() {
    if (navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                fetchWeatherByCoords(latitude, longitude)
                    .finally(() => showLoading(false));
            },
            (error) => {
                alert('Error getting location: ' + error.message);
                showLoading(false);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
        showLoading(false);
    }
}

// Fetch weather data by city name
async function fetchWeatherData(city) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('City not found');
        }
        
        const data = await response.json();
        updateCurrentWeather(data);
        await fetchForecastData(data.coord.lat, data.coord.lon);
        
        // Add to recent searches
        addToRecentSearches(city);
    } catch (error) {
        alert(error.message);
        console.error('Error fetching weather data:', error);
    }
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Weather data not available');
        }
        
        const data = await response.json();
        updateCurrentWeather(data);
        await fetchForecastData(lat, lon);
        
        // Add to recent searches
        addToRecentSearches(data.name);
    } catch (error) {
        alert(error.message);
        console.error('Error fetching weather data:', error);
    }
}

// Fetch forecast data
async function fetchForecastData(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );
        
        if (!response.ok) {
            throw new Error('Forecast data not available');
        }
        
        const data = await response.json();
        updateForecast(data);
        updateHourlyForecast(data);
        updateAirQuality(lat, lon);
    } catch (error) {
        console.error('Error fetching forecast data:', error);
    }
}

// Update current weather display
function updateCurrentWeather(data) {
    cityName.textContent = `${data.name}, ${data.sys.country || ''}`;
    temp.textContent = `${Math.round(data.main.temp)}°C`;
    weatherDesc.textContent = data.weather[0].description;
    humidity.textContent = `${data.main.humidity}%`;
    wind.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    weatherIcon.alt = data.weather[0].main;
}

// Update 5-day forecast
function updateForecast(data) {
    forecastItems.innerHTML = '';
    
    // Get forecast for each day at noon (or closest available time)
    for (let i = 0; i < data.list.length; i += 8) {
        const forecast = data.list[i];
        const date = new Date(forecast.dt * 1000);
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        forecastItem.innerHTML = `
            <div class="forecast-day">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="${forecast.weather[0].main}">
            <div class="forecast-temp">
                <span class="max-temp">${Math.round(forecast.main.temp_max)}°</span>
                <span class="min-temp">${Math.round(forecast.main.temp_min)}°</span>
            </div>
        `;
        
        forecastItems.appendChild(forecastItem);
    }
}

// Update hourly forecast
function updateHourlyForecast(data) {
    hourlyScroll.innerHTML = '';
    
    // Show next 24 hours of forecast (8 items, 3-hour intervals)
    for (let i = 0; i < 8; i++) {
        const forecast = data.list[i];
        const date = new Date(forecast.dt * 1000);
        
        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';
        hourlyItem.innerHTML = `
            <div class="hourly-time">${date.getHours()}:00</div>
            <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" width="30" alt="${forecast.weather[0].main}">
            <div>${Math.round(forecast.main.temp)}°</div>
        `;
        
        hourlyScroll.appendChild(hourlyItem);
    }
}

// Update air quality (mock implementation - would require separate API call)
function updateAirQuality(lat, lon) {
    // Note: Actual implementation would require Air Pollution API
    const aqi = Math.floor(Math.random() * 150) + 50; // Random AQI between 50-200
    aqiValue.textContent = aqi;
    
    // Set color based on AQI
    if (aqi <= 50) {
        aqiCircle.style.backgroundColor = '#4cc9f0';
        airQualityText.textContent = 'Air quality is excellent with no health risks expected.';
    } else if (aqi <= 100) {
        aqiCircle.style.backgroundColor = '#90be6d';
        airQualityText.textContent = 'Air quality is acceptable with minimal health risk.';
    } else if (aqi <= 150) {
        aqiCircle.style.backgroundColor = '#f9c74f';
        airQualityText.textContent = 'Air quality may be a concern for sensitive groups.';
    } else if (aqi <= 200) {
        aqiCircle.style.backgroundColor = '#f8961e';
        airQualityText.textContent = 'Unhealthy air quality for some groups.';
    } else {
        aqiCircle.style.backgroundColor = '#f94144';
        airQualityText.textContent = 'Unhealthy air quality for everyone.';
    }
}

// Recent searches functionality
function addToRecentSearches(city) {
    // Remove if already exists
    recentSearches = recentSearches.filter(item => item.toLowerCase() !== city.toLowerCase());
    
    // Add to beginning
    recentSearches.unshift(city);
    
    // Keep only last 5 searches
    if (recentSearches.length > 5) {
        recentSearches.pop();
    }
    
    // Save to localStorage and update UI
    localStorage.setItem('recentSearches', JSON.stringify(recentSearches));
    updateRecentSearches();
}

function updateRecentSearches() {
    recentList.innerHTML = '';
    recentSearches.forEach(city => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.textContent = city;
        item.addEventListener('click', () => {
            cityInput.value = city;
            searchWeather();
        });
        recentList.appendChild(item);
    });
}

function loadLastSearch() {
    if (recentSearches.length > 0) {
        cityInput.value = recentSearches[0];
        searchWeather();
    } else {
        // Default city
        cityInput.value = 'London';
        searchWeather();
    }
}

// Loading overlay
function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('active');
    } else {
        loadingOverlay.classList.remove('active');
    }
}
// Add this function to update background based on weather
function updateBackground(weatherCondition) {
    const weatherMap = {
        'Clear': 'sunny',
        'Clouds': 'cloudy',
        'Rain': 'rain',
        'Thunderstorm': 'storm',
        'Snow': 'snow',
        'Mist': 'fog',
        'Fog': 'fog',
        'Haze': 'fog'
    };
    
    const weatherTerm = weatherMap[weatherCondition] || 'weather';
    document.body.style.backgroundImage = `
        linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
        url('https://tse2.mm.bing.net/th?id=OIP.dDCLw6qRlSkqNzXYb-HdEgHaEK&pid=Api&P=0&h=180')
    `;
}

// Call this when you get weather data
updateBackground(currentWeatherCondition);

// Add these to your script.js

// First, add Leaflet.js CSS and JS to your HTML head:
// <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
// <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>

function updateWindyMap(lat, lon) {
    const iframe = document.querySelector('.weather-map-card iframe');
    iframe.src = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&zoom=5&level=surface&overlay=wind&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&metricWind=km%2Fh&metricTemp=%C2%B0C`;
}
function initWeatherMap(lat, lon) {
    // Clear existing map if any
    if (weatherMap) {
        weatherMap.remove();
    }
    
    // Initialize centered map
    weatherMap = L.map('weather-map', {
        center: [lat, lon],
        zoom: 6,
        zoomControl: false // We'll add our own control
    }).setView([lat, lon], 6);
    
    // Add controls with proper positioning
    L.control.zoom({
        position: 'topright'
    }).addTo(weatherMap);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(weatherMap);
    
    // Add weather overlay
    L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${API_KEY}`, {
        opacity: 0.7
    }).addTo(weatherMap);
    
    // Add marker with proper centering
    const marker = L.marker([lat, lon]).addTo(weatherMap);
    marker.bindPopup(`<b>${currentCity}</b><br>Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`).openPopup();
    
    // Force re-center on small screens
    setTimeout(() => {
        weatherMap.invalidateSize();
    }, 100);
}