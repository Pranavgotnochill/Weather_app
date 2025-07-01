// No API key needed for Open-Meteo

// DOM Elements
const searchBtn = document.getElementById('search-btn');
const cityInput = document.getElementById('city-input');
const cityName = document.getElementById('city-name');
const temperature = document.getElementById('temperature');
const weatherDesc = document.getElementById('weather-desc');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');

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
        updateUI('Loading...', '--', '--', '--', '--');
        
        // First get coordinates for the city
        const { latitude, longitude, name, country } = await getCoordinates(city);
        
        // Then get weather data
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&temperature_unit=celsius&windspeed_unit=kmh&timezone=auto`
        );
        
        if (!response.ok) {
            throw new Error('Failed to fetch weather data. Please try again.');
        }
        
        const data = await response.json();
        
        // Get current weather data
        const current = data.current_weather;
        const weatherDesc = weatherCodes[current.weathercode] || 'Unknown';
        
        // Get additional data from hourly (for humidity)
        const humidity = data.hourly.relativehumidity_2m[0];
        
        // Update UI with weather data (pass temperature as number, we'll format it in updateUI)
        updateUI(
            `${name}, ${country}`,
            Math.round(current.temperature * 10) / 10, // Keep one decimal place for temperature
            weatherDesc,
            humidity,
            Math.round(current.windspeed)
        );
        
    } catch (error) {
        console.error('Error fetching weather data:', error);
        alert(error.message || 'An error occurred. Please try again.');
        updateUI('--', '--', '--', '--', '--');
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

// Function to update the UI with weather data
function updateUI(city, temp, desc, hum, wind) {
    cityName.textContent = city;
    // Only show the number, the °C is already in the HTML
    temperature.textContent = temp === '--' ? '--' : temp;
    weatherDesc.textContent = desc;
    humidity.textContent = hum === '--' ? '--%' : `${hum}%`;
    windSpeed.textContent = wind === '--' ? '-- km/h' : `${wind} km/h`;
    
    // Update the document title
    document.title = city === '--' ? 'Weather App' : `${city} - Weather App`;
}
