// Gemini API Configuration
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// State Management
let state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    sunSign: localStorage.getItem('sun_sign') || '',
    moonSign: localStorage.getItem('moon_sign') || '',
    risingSign: localStorage.getItem('rising_sign') || '',
    currentTab: 'horoscope'
};

// DOM Elements
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeSettings = document.getElementById('closeSettings');
const saveSettings = document.getElementById('saveSettings');
const apiKeyInput = document.getElementById('apiKey');
const sunSignSelect = document.getElementById('sunSign');
const moonSignSelect = document.getElementById('moonSign');
const risingSignSelect = document.getElementById('risingSign');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    setupEventListeners();
    calculateMoonPhase();

    // Load initial content if API key exists
    if (state.apiKey) {
        loadContent();
    } else {
        showSettingsModal();
    }
});

// Load saved settings
function loadSettings() {
    apiKeyInput.value = state.apiKey;
    sunSignSelect.value = state.sunSign;
    moonSignSelect.value = state.moonSign;
    risingSignSelect.value = state.risingSign;
}

// Setup Event Listeners
function setupEventListeners() {
    // Settings Modal
    settingsBtn.addEventListener('click', showSettingsModal);
    closeSettings.addEventListener('click', hideSettingsModal);
    saveSettings.addEventListener('click', saveSettingsHandler);

    // Click outside modal to close
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            hideSettingsModal();
        }
    });

    // Tab Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });

    // Zodiac Sign Changes
    sunSignSelect.addEventListener('change', (e) => {
        state.sunSign = e.target.value;
        localStorage.setItem('sun_sign', e.target.value);
        if (state.apiKey) loadContent();
    });

    moonSignSelect.addEventListener('change', (e) => {
        state.moonSign = e.target.value;
        localStorage.setItem('moon_sign', e.target.value);
    });

    risingSignSelect.addEventListener('change', (e) => {
        state.risingSign = e.target.value;
        localStorage.setItem('rising_sign', e.target.value);
    });
}

// Settings Modal Functions
function showSettingsModal() {
    settingsModal.classList.add('active');
}

function hideSettingsModal() {
    settingsModal.classList.remove('active');
}

async function saveSettingsHandler() {
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        alert('Please enter your Gemini API key');
        return;
    }

    state.apiKey = apiKey;
    localStorage.setItem('gemini_api_key', apiKey);

    // List available models - DON'T load content yet
    await listAvailableModels();

    alert('API key saved! Check the browser console (F12) to see available models.');

    hideSettingsModal();
    // Don't auto-load content - let user check console first
    // loadContent();
}

// List Available Models
async function listAvailableModels() {
    try {
        console.log('Fetching available models...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${state.apiKey}`);

        if (!response.ok) {
            console.error('Failed to fetch models');
            return;
        }

        const data = await response.json();
        console.log('Available models:', data.models);

        // Find models that support generateContent
        const generateContentModels = data.models.filter(model =>
            model.supportedGenerationMethods?.includes('generateContent')
        );

        console.log('Models supporting generateContent:');
        generateContentModels.forEach(model => {
            console.log(`  - ${model.name}`);
        });

        return generateContentModels;
    } catch (error) {
        console.error('Error listing models:', error);
    }
}

// Tab Switching
function switchTab(tabName) {
    state.currentTab = tabName;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Load content for the active tab
    if (state.apiKey) {
        loadContent();
    }
}

// Load Content Based on Current Tab
async function loadContent() {
    switch(state.currentTab) {
        case 'horoscope':
            await loadHoroscope();
            break;
        case 'astro-events':
            await loadAstroEvents();
            break;
        case 'moon':
            await loadMoonInfo();
            break;
    }
}

// Load Horoscope
async function loadHoroscope() {
    if (!state.sunSign) {
        document.getElementById('horoscopeContent').innerHTML = `
            <div class="loading">
                <p>Please select your Sun sign to get your horoscope</p>
            </div>
        `;
        return;
    }

    const prompt = `As a professional astrologer, provide today's horoscope for ${state.sunSign}.
    Include:
    1. General forecast for the day
    2. Love and relationships
    3. Career and money
    4. Health and wellness
    5. Lucky color and number

    Format it in a beautiful, engaging way with emojis. Keep it positive and insightful.`;

    const response = await callGeminiAPI(prompt);

    document.getElementById('horoscopeContent').innerHTML = `
        <div style="line-height: 1.8;">
            ${formatResponse(response)}
        </div>
    `;
}

// Load Astro Events
async function loadAstroEvents() {
    const today = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const prompt = `As an expert astrologer, tell me about the most significant astrological event happening today (${today}).

    Include:
    1. The name of the event (e.g., Mercury Retrograde, Jupiter Transit, Full Moon, etc.)
    2. A detailed explanation of what this event means
    3. How it might affect people generally
    4. Practical advice for navigating this energy

    Be mystical yet practical. Use emojis appropriately.`;

    const response = await callGeminiAPI(prompt);

    // Extract title from response (first line typically)
    const lines = response.split('\n').filter(line => line.trim());
    const title = lines[0].replace(/[#*]/g, '').trim();
    const content = lines.slice(1).join('\n');

    document.getElementById('eventOfDay').innerHTML = `
        <p class="event-label">Event of the day</p>
        <h2 class="event-title">${title}</h2>
        <div class="event-content" style="line-height: 1.8;">
            ${formatResponse(content)}
        </div>
    `;
}

// Load Moon Information
async function loadMoonInfo() {
    const moonData = calculateMoonPhase();
    const moonSign = getCurrentMoonSign();

    const prompt = `As an astrologer, explain the current ${moonData.phaseName} moon phase and what it means.
    The moon is currently in ${moonSign}.

    Include:
    1. The meaning of this moon phase
    2. Best activities during this phase
    3. What to avoid
    4. How the moon in ${moonSign} affects the energy
    5. Ritual suggestions

    Be mystical and practical. Use emojis.`;

    const response = await callGeminiAPI(prompt);

    document.getElementById('moonDescription').innerHTML = `
        <div style="line-height: 1.8;">
            ${formatResponse(response)}
        </div>
    `;
}

// Calculate Moon Phase
function calculateMoonPhase() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    // Known new moon date (January 11, 2024)
    const knownNewMoon = new Date(2024, 0, 11);
    const synodicMonth = 29.53058867; // days

    // Calculate days since known new moon
    const daysSinceNewMoon = (today - knownNewMoon) / (1000 * 60 * 60 * 24);
    const phase = (daysSinceNewMoon % synodicMonth) / synodicMonth;

    // Determine phase name and icon
    let phaseName, phaseIcon, phaseEmoji;

    if (phase < 0.0625 || phase >= 0.9375) {
        phaseName = 'New Moon';
        phaseIcon = '🌑';
        phaseEmoji = '🌑';
    } else if (phase < 0.1875) {
        phaseName = 'Waxing Crescent';
        phaseIcon = '🌒';
        phaseEmoji = '🌒';
    } else if (phase < 0.3125) {
        phaseName = 'First Quarter';
        phaseIcon = '🌓';
        phaseEmoji = '🌓';
    } else if (phase < 0.4375) {
        phaseName = 'Waxing Gibbous';
        phaseIcon = '🌔';
        phaseEmoji = '🌔';
    } else if (phase < 0.5625) {
        phaseName = 'Full Moon';
        phaseIcon = '🌕';
        phaseEmoji = '🌕';
    } else if (phase < 0.6875) {
        phaseName = 'Waning Gibbous';
        phaseIcon = '🌖';
        phaseEmoji = '🌖';
    } else if (phase < 0.8125) {
        phaseName = 'Last Quarter';
        phaseIcon = '🌗';
        phaseEmoji = '🌗';
    } else {
        phaseName = 'Waning Crescent';
        phaseIcon = '🌘';
        phaseEmoji = '🌘';
    }

    // Update UI
    document.getElementById('moonPhaseIcon').textContent = phaseIcon;
    document.getElementById('moonPhaseName').textContent = phaseName;
    document.getElementById('moonPhaseTitle').textContent = phaseName;
    document.getElementById('moonImage').textContent = phaseEmoji;

    // Calculate date range (typically 7-8 days per phase)
    const phaseStart = new Date(today);
    phaseStart.setDate(phaseStart.getDate() - 3);
    const phaseEnd = new Date(today);
    phaseEnd.setDate(phaseEnd.getDate() + 4);

    const dateRangeText = `${phaseStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${phaseEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    document.getElementById('moonDateRange').textContent = dateRangeText;

    // Create moon calendar
    createMoonCalendar();

    return { phaseName, phaseIcon, phase };
}

// Create Moon Calendar
function createMoonCalendar() {
    const calendar = document.getElementById('moonCalendar');
    const today = new Date();
    const dates = [];

    // Get 4 key dates around today
    for (let i = -1; i <= 2; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + (i * 7));
        dates.push(date);
    }

    const moonPhases = ['🌑', '🌓', '🌕', '🌗'];

    calendar.innerHTML = dates.map((date, index) => `
        <div class="moon-day">
            <div class="moon-day-icon">${moonPhases[index]}</div>
            <div class="moon-day-date">${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        </div>
    `).join('');
}

// Get Current Moon Sign
function getCurrentMoonSign() {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
                   'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
    const signSymbols = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];

    // Moon changes signs roughly every 2.5 days
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const signIndex = Math.floor((dayOfYear / 2.5) % 12);

    const sign = signs[signIndex];
    const symbol = signSymbols[signIndex];

    document.getElementById('moonInSign').textContent = `Moon in ${sign}`;
    document.getElementById('moonSignIcon').textContent = symbol;
    document.getElementById('moonSignText').textContent = `Moon in ${sign}`;

    return sign;
}

// Call Gemini API
async function callGeminiAPI(prompt) {
    if (!state.apiKey) {
        return 'Please configure your API key in settings.';
    }

    try {
        console.log('Calling Gemini API with endpoint:', GEMINI_API_ENDPOINT);

        const response = await fetch(`${GEMINI_API_ENDPOINT}?key=${state.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.4,
                    topK: 32,
                    topP: 1,
                    maxOutputTokens: 2048,
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('API Error Details:', error);
            console.error('Status:', response.status);
            console.error('Endpoint used:', GEMINI_API_ENDPOINT);
            return `Error: ${error.error?.message || 'Failed to fetch data. Please check your API key.'}<br><br>Endpoint: ${GEMINI_API_ENDPOINT}`;
        }

        const data = await response.json();
        console.log('API Response received successfully');
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error('Error calling Gemini API:', error);
        return 'Error connecting to Gemini API. Please check your internet connection and API key.';
    }
}

// Format Response
function formatResponse(text) {
    // Convert markdown-style formatting to HTML
    let formatted = text
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^#{1,3}\s+(.+)$/gm, '<h3 style="margin-top: 20px; margin-bottom: 10px; color: var(--accent-gold);">$1</h3>')
        .replace(/\n\n/g, '</p><p style="margin-bottom: 15px;">')
        .replace(/\n/g, '<br>');

    return `<p style="margin-bottom: 15px;">${formatted}</p>`;
}

// Capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
