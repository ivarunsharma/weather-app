const API_KEY = "3cf22086f8a0675f2b355805b9f82727"; // Note: move to server-side in production

const DAYS_OF_THE_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

let selectedCityText;
let selectedCity;
let currentUnit = 'C';
let cachedWeather = null;
let cachedHourly = null;

// --- API ---

const getCitiesUsingGeolocation = async (searchText) => {
    const response = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${searchText}&limit=5&appid=${API_KEY}`);
    if (!response.ok) throw new Error('Failed to fetch cities');
    return response.json();
};

const getCurrentWeatherData = async ({ lat, lon, name: city }) => {
    const url = lat && lon
        ? `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        : `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('City not found');
    return response.json();
};

const getHourlyForecast = async ({ name: city }) => {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
    if (!response.ok) throw new Error('Failed to fetch forecast');
    const data = await response.json();
    return data.list.map(({ main: { temp, temp_max, temp_min }, dt, dt_txt, weather: [{ description, icon }] }) => ({
        temp, temp_max, temp_min, dt, dt_txt, description, icon
    }));
};

// --- Helpers ---

const convertTemp = (tempC) => currentUnit === 'C' ? tempC : (tempC * 9 / 5 + 32);
const formatTemperature = (temp) => `${convertTemp(temp)?.toFixed(1)}°${currentUnit}`;
const createIconUrl = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

// --- UI State ---

const setLoading = (isLoading) => {
    document.querySelector('#loading').classList.toggle('hidden', !isLoading);
};

const showError = (msg) => {
    const el = document.querySelector('#error-message');
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 4000);
};

// --- Render ---

const loadCurrentForecast = ({ name, sys: { country }, main: { temp, temp_max, temp_min }, weather: [{ description }], wind: { speed } }) => {
    const el = document.querySelector("#current-forecast");
    el.querySelector(".city").textContent = `${name}, ${country}`;
    el.querySelector(".temp").textContent = formatTemperature(temp);
    el.querySelector(".description").textContent = description;
    el.querySelector(".min-max-temp").textContent = `H: ${formatTemperature(temp_max)} L: ${formatTemperature(temp_min)}`;
    el.querySelector(".wind").textContent = `Wind: ${speed} m/s`;
};

const loadHourlyForecast = ({ main: { temp: tempNow }, weather: [{ icon: iconNow }] }, hourlyForecast) => {
    const timeFormatter = Intl.DateTimeFormat("en", { hour12: true, hour: "numeric" });
    const dataFor12Hours = hourlyForecast.slice(2, 14);
    const hourlyContainer = document.querySelector(".hourly-container");

    let html = `<article>
        <h3 class="time">Now</h3>
        <img class="icon" src="${createIconUrl(iconNow)}" alt="current weather" />
        <p class="hourly-temp">${formatTemperature(tempNow)}</p>
    </article>`;

    for (const { temp, icon, dt_txt } of dataFor12Hours) {
        html += `<article>
            <h3 class="time">${timeFormatter.format(new Date(dt_txt))}</h3>
            <img class="icon" src="${createIconUrl(icon)}" alt="weather icon" />
            <p class="hourly-temp">${formatTemperature(temp)}</p>
        </article>`;
    }
    hourlyContainer.innerHTML = html;
};

const calculateDayWiseForecast = (hourlyForecast) => {
    const dayWiseForecast = new Map();
    for (const forecast of hourlyForecast) {
        const [date] = forecast.dt_txt.split(" ");
        const dayOfTheWeek = DAYS_OF_THE_WEEK[new Date(date).getDay()];
        if (dayWiseForecast.has(dayOfTheWeek)) {
            dayWiseForecast.get(dayOfTheWeek).push(forecast);
        } else {
            dayWiseForecast.set(dayOfTheWeek, [forecast]);
        }
    }
    for (const [key, value] of dayWiseForecast) {
        const temp_min = Math.min(...value.map(v => v.temp_min));
        const temp_max = Math.max(...value.map(v => v.temp_max));
        const iconEntry = value.find(v => v.icon);
        dayWiseForecast.set(key, { temp_min, temp_max, icon: iconEntry?.icon ?? '01d' });
    }
    return dayWiseForecast;
};

const loadFiveDayForecast = (hourlyForecast) => {
    const dayWiseForecast = calculateDayWiseForecast(hourlyForecast);
    const container = document.querySelector(".five-day-forecast-container");
    let html = "";
    Array.from(dayWiseForecast).slice(0, 5).forEach(([day, { temp_max, temp_min, icon }], index) => {
        html += `<article class="day-wise-forecast">
            <h3 class="day">${index === 0 ? "today" : day}</h3>
            <img class="icon" src="${createIconUrl(icon)}" alt="forecast icon" />
            <p class="min-temp">${formatTemperature(temp_min)}</p>
            <p class="max-temp">${formatTemperature(temp_max)}</p>
        </article>`;
    });
    container.innerHTML = html;
};

const loadFeelsLike = ({ main: { feels_like } }) => {
    document.querySelector("#feels-like .feels-like-temp").textContent = formatTemperature(feels_like);
};

const loadHumidity = ({ main: { humidity } }) => {
    document.querySelector("#humidity .humidity-value").textContent = `${humidity}%`;
};

const renderAll = () => {
    if (!cachedWeather || !cachedHourly) return;
    loadCurrentForecast(cachedWeather);
    loadHourlyForecast(cachedWeather, cachedHourly);
    loadFiveDayForecast(cachedHourly);
    loadFeelsLike(cachedWeather);
    loadHumidity(cachedWeather);
};

// --- Data Loading ---

const loadData = async () => {
    if (!selectedCity) return;
    setLoading(true);
    try {
        cachedWeather = await getCurrentWeatherData(selectedCity);
        cachedHourly = await getHourlyForecast(cachedWeather);
        renderAll();
    } catch (err) {
        showError(err.message || 'Failed to load weather data. Please try again.');
    } finally {
        setLoading(false);
    }
};

const loadForecastUsingGeoLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
        const { latitude: lat, longitude: lon } = coords;
        selectedCity = { lat, lon };
        loadData();
    }, () => {
        showError('Could not get your location. Search for a city above.');
    });
};

// --- Search ---

function debounce(func, delay = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
}

const onSearchChange = async (event) => {
    const { value } = event.target;
    if (!value) {
        selectedCity = null;
        selectedCityText = "";
        return;
    }
    if (selectedCityText === value) return;
    try {
        const listOfCities = await getCitiesUsingGeolocation(value);
        let options = "";
        for (const { lat, lon, name, state, country } of listOfCities) {
            options += `<option data-city-details='${JSON.stringify({ lat, lon, name })}' value="${name}, ${state}, ${country}"></option>`;
        }
        document.querySelector("#cities").innerHTML = options;
    } catch {
        // silently ignore mid-type failures
    }
};

const handleCitySelection = (event) => {
    selectedCityText = event.target.value;
    const options = document.querySelectorAll("#cities > option");
    if (!options?.length) return;
    const selectedOption = Array.from(options).find(opt => opt.value === selectedCityText);
    if (!selectedOption) return;
    selectedCity = JSON.parse(selectedOption.getAttribute("data-city-details"));
    loadData();
};

const debounceSearch = debounce(onSearchChange);

// --- Init ---

document.addEventListener("DOMContentLoaded", () => {
    const videoElement = document.getElementById('background-video');
    const sourceElement = document.getElementById('video-source');
    const currentHour = new Date().getHours();
    const isNight = currentHour < 6 || currentHour >= 18;

    sourceElement.src = isNight ? 'night-video.mp4' : 'day-video.mp4';
    document.body.classList.add(isNight ? 'night-mode' : 'day-mode');
    videoElement.load();
    videoElement.play().catch(() => {});

    document.querySelector('#unit-toggle').addEventListener('click', () => {
        currentUnit = currentUnit === 'C' ? 'F' : 'C';
        document.querySelector('#unit-toggle').textContent = currentUnit === 'C' ? '°F' : '°C';
        renderAll();
    });

    const searchInput = document.querySelector("#search");
    searchInput.addEventListener("input", debounceSearch);
    searchInput.addEventListener("change", handleCitySelection);

    loadForecastUsingGeoLocation();
});
