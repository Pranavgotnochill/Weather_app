// No API key needed for Open-Meteo

// DOM Elements
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const weatherDesc = document.getElementById('weather-desc');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');

// Function to get user's current location
function getCurrentLocation() {
    // Show loading state
    updateUI('Detecting your location...', '--', '--', '--', '--', '--');
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Get weather for current location
                getWeatherByCoordinates(latitude, longitude);
            },
            (error) => {
                console.error('Error getting location:', error);
                alert('Unable to retrieve your location. Please enable location services and try again.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Get weather by coordinates
async function getWeatherByCoordinates(lat, lon) {
    try {
        updateUI('Loading...', '--', '--', '--', '--', '--');
        
        // Get location name using reverse geocoding
        const locationResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=en&count=1`);
        const locationData = await locationResponse.json();
        const name = locationData.results?.[0]?.name || 'Current Location';
        const country = locationData.results?.[0]?.country_code || '';
        
        // Get weather data
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,surface_pressure&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data. Please try again.');
        }
        
        const data = await response.json();
        const current = data.current_weather;
        const weatherDesc = weatherCodes[current.weathercode] || 'Unknown';
        const humidity = data.hourly.relativehumidity_2m[0];
        const pressureHpa = Math.round(data.hourly.surface_pressure[0]);
        
        updateUI(
            `${name}${country ? ', ' + country : ''}`,
            Math.round(current.temperature * 10) / 10,
            weatherDesc,
            humidity,
            Math.round(current.windspeed),
            pressureHpa
        );
        
    } catch (error) {
        console.error('Error:', error);
        alert('Error getting weather data. Please try again.');
        updateUI('--', '--', '--', '--', '--', '--');
    }
}

// Add event listeners with touch support
searchBtn.addEventListener('touchstart', () => {
    searchBtn.style.transform = 'scale(0.95)';
});

searchBtn.addEventListener('touchend', () => {
    searchBtn.style.transform = '';
});

// Search button click handler
searchBtn.addEventListener('click', searchWeather);

// Handle search on Enter key
cityInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

// Location button click handler
document.getElementById('location-btn').addEventListener('click', getCurrentLocation);

// Initialize with user's location if allowed
window.addEventListener('load', () => {
    // Show a loading message
    updateUI('Detecting your location...', '--', '--', '--', '--', '--');
    
    // Try to get user's location
    getCurrentLocation();
});

// Prevent zooming on double-tap
document.documentElement.addEventListener('dblclick', (e) => {
    e.preventDefault();
}, { passive: false });

// Prevent zooming on input focus on mobile
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Weather code to description mapping
const weatherCodes = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow fall',
    73: 'Moderate snow fall',
    75: 'Heavy snow fall',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail'
};

// Initialize with a default city
window.onload = () => {
    getWeatherByLocation('London');
};

// Function to get coordinates for a city
async function getCoordinates(city) {
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            throw new Error('City not found. Please try another city.');
        }
        
        const { latitude, longitude, name, country } = data.results[0];
        return { latitude, longitude, name, country };
    } catch (error) {
        console.error('Error getting coordinates:', error);
        throw new Error('Failed to get location data. Please try again.');
    }
}

// Function to fetch weather data from Open-Meteo API
async function getWeatherByLocation(city) {
    try {
        // Show loading state
        updateUI('Loading...', '--', '--', '--', '--', '--');
        
        // First, get coordinates for the city
        const { latitude, longitude, name, country } = await getCoordinates(city);
        
        // Then, get weather data with pressure included
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m,surface_pressure&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data. Please try again.');
        }
        
        const data = await response.json();
        const current = data.current_weather;
        const weatherDesc = weatherCodes[current.weathercode] || 'Unknown';
        
        // Get humidity and pressure from hourly data (first hour)
        const humidity = data.hourly.relativehumidity_2m[0];
        const pressureHpa = Math.round(data.hourly.surface_pressure[0]); // Round to nearest integer
        
        // Update UI with weather data
        updateUI(
            `${name}, ${country}`,
            Math.round(current.temperature * 10) / 10,
            weatherDesc,
            humidity,
            Math.round(current.windspeed),
            pressureHpa
        );
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert(error.message || 'An error occurred. Please try again.');
        updateUI('--', '--', '--', '--', '--', '--');
    }
}

// Function to handle search button click
function searchWeather() {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherByLocation(city);
    } else {
        alert('Please enter a city name');
    }
}

// Function to update UI
function updateUI(city, temp, desc, hum, wind, press) {
    cityName.textContent = city;
    temperature.textContent = temp === '--' ? '--' : temp;
    weatherDesc.textContent = desc;
    humidity.textContent = hum === '--' ? '--%' : `${hum}%`;
    windSpeed.textContent = wind === '--' ? '-- km/h' : `${wind} km/h`;
    pressure.textContent = press === '--' ? '-- hPa' : `${press} hPa`;
    document.title = city === '--' ? 'Weather App' : `${city} - Weather App`;
}
