// Gemini API Configuration
const GEMINI_API_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';

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
    setupFeatureCardListeners();

    // Load initial content if API key exists
    if (state.apiKey) {
        loadContent();
    } else {
        showSettingsModal();
    }
});

// Load saved settings
function loadSettings() {
    if (apiKeyInput) apiKeyInput.value = state.apiKey;
    if (sunSignSelect) sunSignSelect.value = state.sunSign;
    if (moonSignSelect) moonSignSelect.value = state.moonSign;
    if (risingSignSelect) risingSignSelect.value = state.risingSign;

    // Show current selections in UI
    console.log('Settings loaded:', {
        sunSign: state.sunSign,
        moonSign: state.moonSign,
        risingSign: state.risingSign
    });
}

// Setup Feature Card Listeners
function setupFeatureCardListeners() {
    // Add click handlers to all feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', function() {
            const title = this.querySelector('h3').textContent;
            handleFeatureCardClick(title);
        });
    });
}

// Handle feature card clicks
async function handleFeatureCardClick(cardTitle) {
    console.log('Feature card clicked:', cardTitle);

    if (!state.apiKey) {
        alert('Please set your API key in settings first');
        showSettingsModal();
        return;
    }

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    let prompt = '';
    let targetElement = '';

    // Determine which content to generate based on card title
    switch(cardTitle.toLowerCase()) {
        case 'daily tips':
            targetElement = 'horoscopeContent';
            prompt = `IMPORTANT: Today is ${dateStr}.

            As a professional astrologer, provide daily tips for ${capitalize(state.sunSign || 'all signs')} for today.

            Include:
            1. 💡 **Morning Ritual** - How to start the day with positive energy
            2. 🌟 **Power Hours** - Best times for important activities
            3. 🎯 **Focus Areas** - What to prioritize today
            4. 💬 **Communication Tips** - How to interact with others
            5. ⚠️ **Things to Watch** - Potential challenges to be aware of

            Be practical, specific, and empowering.`;
            break;

        case "do / don't":
        case "do / don\\'t":
            targetElement = 'horoscopeContent';
            prompt = `IMPORTANT: Today is ${dateStr}.

            As a professional astrologer, provide clear Do's and Don'ts for ${capitalize(state.sunSign || 'all signs')} today.

            Format:

            ✅ **DO:**
            - [List 5 positive actions to take]

            ❌ **DON'T:**
            - [List 5 things to avoid]

            Be specific and practical for today's cosmic energy.`;
            break;

        case "today's luck":
            targetElement = 'horoscopeContent';
            prompt = `IMPORTANT: Today is ${dateStr}.

            As a professional astrologer, reveal today's luck factors for ${capitalize(state.sunSign || 'all signs')}.

            Include:
            🍀 **Lucky Color** - Specific shade and how to use it
            🔢 **Lucky Numbers** - 3 numbers and their significance
            ⏰ **Lucky Hour** - Best time window for opportunities
            💎 **Lucky Crystal** - Gemstone to carry or wear
            🌍 **Lucky Direction** - Which direction brings good fortune
            🎲 **Lucky Activity** - One thing that will bring luck today

            Be mystical and specific.`;
            break;

        case 'what are transits?':
            targetElement = 'eventOfDay';
            prompt = `IMPORTANT: Today is ${dateStr}.

            As an astrology teacher, explain what planetary transits are and why they matter.

            Include:
            1. 📚 **Definition** - Simple explanation of transits
            2. 🌌 **How They Work** - Planetary movements and their effects
            3. ⏱️ **Duration** - Different transit timeframes
            4. 💫 **Why They Matter** - Real-world impact on daily life
            5. 🔍 **Current Transits** - What's happening in the sky today

            Be educational yet mystical.`;
            break;

        case 'short-term transit':
            targetElement = 'eventOfDay';
            prompt = `IMPORTANT: Today is ${dateStr}.

            As an expert astrologer, describe today's short-term planetary transits (Moon, Mercury, Venus).

            Include:
            🌙 **Moon Transit** - Where the moon is and what it means today
            ☿️ **Mercury Influence** - Communication and thinking patterns
            ♀️ **Venus Energy** - Love, beauty, and values today
            ⏳ **Duration** - How long these energies last
            💡 **Action Steps** - How to work with these transits

            Be specific to today's date.`;
            break;

        case 'long-term transit':
            targetElement = 'eventOfDay';
            prompt = `IMPORTANT: Today is ${dateStr}.

            As an expert astrologer, explain the current long-term planetary transits (Jupiter, Saturn, outer planets).

            Include:
            ♃ **Jupiter** - Where it is and growth opportunities
            ♄ **Saturn** - Lessons and responsibilities
            ♅ **Uranus** - Revolutionary changes
            ♆ **Neptune** - Dreams and illusions
            ♇ **Pluto** - Transformation themes
            📅 **Timeline** - Duration of these major transits

            Connect to broader life themes and current times.`;
            break;

        case 'moon rituals':
            targetElement = 'moonDescription';
            const moonData = calculateMoonPhase();
            prompt = `IMPORTANT: Today is ${dateStr}.

            As a spiritual guide and astrologer, provide moon rituals specifically for the ${moonData.phaseName} phase happening today.

            Include:
            🕯️ **Simple Ritual** - Easy 5-minute practice
            📿 **Full Ceremony** - Detailed 30-minute ritual
            🌿 **Materials Needed** - What to gather
            📝 **Affirmations** - Specific to this moon phase
            💭 **Meditation** - Guided visualization
            ⏰ **Best Time** - When to perform the ritual today

            Be specific, practical, and spiritually meaningful.`;
            break;

        default:
            return; // Don't do anything for unknown cards
    }

    if (targetElement && prompt) {
        // Show loading
        const element = document.getElementById(targetElement);
        if (element) {
            element.innerHTML = `
                <div class="loading">
                    <div class="stars">⭐ ⭐ ⭐</div>
                    <p>Loading ${cardTitle}...</p>
                </div>
            `;

            // Get AI response
            const response = await callGeminiAPI(prompt);

            // Display response
            element.innerHTML = `
                <div style="margin-bottom: 20px;">
                    <button onclick="location.reload()" style="background: rgba(148, 163, 184, 0.2); border: 1px solid rgba(148, 163, 184, 0.3); border-radius: 8px; padding: 8px 16px; color: var(--text-primary); cursor: pointer; font-size: 14px;">← Back</button>
                </div>
                <h2 style="font-size: 28px; margin-bottom: 20px; background: linear-gradient(135deg, var(--accent-gold), var(--accent-cyan)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${cardTitle}</h2>
                <div style="line-height: 1.8;">
                    ${formatResponse(response)}
                </div>
            `;
        }
    }
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

    // Zodiac Sign Changes - All signs trigger reload
    sunSignSelect.addEventListener('change', (e) => {
        console.log('Sun sign changed to:', e.target.value);
        state.sunSign = e.target.value;
        localStorage.setItem('sun_sign', e.target.value);

        // Reload content if on horoscope tab and API key exists
        if (state.apiKey && state.currentTab === 'horoscope') {
            loadContent();
        }
    });

    moonSignSelect.addEventListener('change', (e) => {
        console.log('Moon sign changed to:', e.target.value);
        state.moonSign = e.target.value;
        localStorage.setItem('moon_sign', e.target.value);

        // Reload moon content if on moon tab
        if (state.apiKey && state.currentTab === 'moon') {
            loadContent();
        }
    });

    risingSignSelect.addEventListener('change', (e) => {
        console.log('Rising sign changed to:', e.target.value);
        state.risingSign = e.target.value;
        localStorage.setItem('rising_sign', e.target.value);

        // Rising sign saved for future use
        console.log('Rising sign saved. All signs:', {
            sun: state.sunSign,
            moon: state.moonSign,
            rising: state.risingSign
        });
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

    hideSettingsModal();
    loadContent();
}

// List Available Models
async function listAvailableModels() {
    try {
        console.log('Fetching available models...');
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
            method: 'GET',
            headers: {
                'x-goog-api-key': state.apiKey
            }
        });

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

    // Show loading state
    document.getElementById('horoscopeContent').innerHTML = `
        <div class="loading">
            <div class="stars">⭐ ⭐ ⭐</div>
            <p>Loading ${capitalize(state.sunSign)} forecast...</p>
        </div>
    `;

    // Get current date info
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' });

    const prompt = `IMPORTANT: Today is ${dateStr}. This is the current date you must use for this horoscope.

    As a professional astrologer, provide today's (${dayOfWeek}, ${dateStr}) horoscope for ${capitalize(state.sunSign)}.

    Include:
    1. 🌟 **Overall Energy** - General forecast for the day
    2. 💕 **Love & Relationships** - Romantic and social insights
    3. 💼 **Career & Money** - Professional and financial guidance
    4. 🧘 **Health & Wellness** - Physical and mental well-being
    5. ✨ **Lucky Elements**:
       - Lucky Color
       - Lucky Number
       - Lucky Time of Day
       - Power Crystal
    6. 🎨 **Visual Mood** - Describe the day's energy using celestial imagery (like "shimmering stars", "radiant sun", "gentle moonlight")

    Format it in a beautiful, mystical way with relevant emojis. Keep it positive, insightful, and visually descriptive.`;

    const response = await callGeminiAPI(prompt);

    // Generate zodiac symbol SVG
    const zodiacSVG = generateZodiacSVG(state.sunSign);

    document.getElementById('horoscopeContent').innerHTML = `
        <div class="horoscope-header">
            ${zodiacSVG}
            <div style="text-align: center;">
                <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">${dateStr}</p>
                <h2 style="font-size: 28px; margin: 10px 0 20px 0; background: linear-gradient(135deg, var(--accent-gold), var(--accent-cyan)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${capitalize(state.sunSign)} Today</h2>
            </div>
        </div>
        <div style="line-height: 1.8;">
            ${formatResponse(response)}
        </div>
    `;
}

// Load Astro Events
async function loadAstroEvents() {
    // Show loading state
    document.getElementById('eventOfDay').innerHTML = `
        <p class="event-label">Event of the day</p>
        <h2 class="event-title">Loading...</h2>
        <div class="event-content">
            <div class="loading">
                <div class="stars">⭐ ⭐ ⭐</div>
                <p>Calculating cosmic events...</p>
            </div>
        </div>
    `;

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const monthDay = today.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });

    const prompt = `IMPORTANT: Today is ${dateStr}. This is the current date you must use.

    As an expert astrologer, tell me about the most significant astrological event happening today (${dateStr}).

    Include:
    1. 🌌 **Event Name** - The main cosmic event (e.g., Mercury Retrograde, Jupiter Transit, Full Moon, etc.)
    2. 🔮 **Cosmic Significance** - What this event means from an astrological perspective
    3. 🌍 **General Impact** - How it affects people collectively
    4. 💫 **Zodiac Focus** - Which zodiac signs are most affected
    5. ✨ **Practical Guidance** - Actionable advice for navigating this energy
    6. 🎨 **Visual Description** - Describe this cosmic event using vivid celestial imagery (planetary alignments, energy colors, cosmic patterns)

    Be mystical, poetic, and practical. Use emojis and rich visual language.`;

    const response = await callGeminiAPI(prompt);

    // Extract title from response (first line typically)
    const lines = response.split('\n').filter(line => line.trim());
    const title = lines[0].replace(/[#*]/g, '').replace(/[🌌🔮🌍💫✨🎨]/g, '').trim();
    const content = lines.slice(1).join('\n');

    // Generate planet SVG for the event
    const planetSVG = generatePlanetSVG();

    document.getElementById('eventOfDay').innerHTML = `
        <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 20px;">
            ${planetSVG}
            <div style="flex: 1;">
                <p class="event-label">${dateStr}</p>
                <h2 class="event-title">${title}</h2>
            </div>
        </div>
        <div class="event-content" style="line-height: 1.8;">
            ${formatResponse(content)}
        </div>
    `;
}

// Load Moon Information
async function loadMoonInfo() {
    // Show loading state
    document.getElementById('moonDescription').innerHTML = `
        <div class="loading">
            <div class="stars">⭐ ⭐ ⭐</div>
            <p>Calculating moon phase...</p>
        </div>
    `;

    const moonData = calculateMoonPhase();
    const moonSign = getCurrentMoonSign();

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const prompt = `IMPORTANT: Today is ${dateStr}. This is the current date.

    As an astrologer, explain the current ${moonData.phaseName} moon phase happening today (${dateStr}) and what it means.
    The moon is currently in ${moonSign} today.

    Include:
    1. 🌙 **Phase Meaning** - The spiritual and practical significance of ${moonData.phaseName}
    2. ✅ **Best Activities** - What to do during this phase (manifestation, release, planning, etc.)
    3. ⛔ **What to Avoid** - Actions that go against this lunar energy
    4. ${getZodiacSymbol(moonSign)} **Moon in ${moonSign}** - How this zodiac placement affects the moon's energy
    5. 🕯️ **Ritual Suggestions** - Simple ceremonies or practices for this phase
    6. 🎨 **Visual Imagery** - Describe the moon's energy using poetic celestial language

    Be mystical, practical, and visually descriptive. Use emojis and rich imagery.`;

    const response = await callGeminiAPI(prompt);

    document.getElementById('moonDescription').innerHTML = `
        <div style="line-height: 1.8;">
            ${formatResponse(response)}
        </div>
    `;
}

// Get zodiac symbol
function getZodiacSymbol(signName) {
    const symbols = {
        'Aries': '♈',
        'Taurus': '♉',
        'Gemini': '♊',
        'Cancer': '♋',
        'Leo': '♌',
        'Virgo': '♍',
        'Libra': '♎',
        'Scorpio': '♏',
        'Sagittarius': '♐',
        'Capricorn': '♑',
        'Aquarius': '♒',
        'Pisces': '♓'
    };
    return symbols[signName] || '🌙';
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

        const response = await fetch(GEMINI_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': state.apiKey
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

// Generate Planet SVG
function generatePlanetSVG() {
    return `
        <svg width="80" height="80" viewBox="0 0 80 80" style="filter: drop-shadow(0 0 15px rgba(244, 197, 66, 0.5));">
            <!-- Planet with rings (Saturn-like) -->
            <defs>
                <radialGradient id="planetGradient">
                    <stop offset="0%" style="stop-color:#ffd700;stop-opacity:1" />
                    <stop offset="50%" style="stop-color:#f4c542;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#daa520;stop-opacity:1" />
                </radialGradient>
                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#f4c542;stop-opacity:0.8" />
                    <stop offset="50%" style="stop-color:#ffd700;stop-opacity:0.4" />
                    <stop offset="100%" style="stop-color:#f4c542;stop-opacity:0.8" />
                </linearGradient>
            </defs>

            <!-- Ring (back) -->
            <ellipse cx="40" cy="40" rx="35" ry="12" fill="none" stroke="url(#ringGradient)" stroke-width="3" opacity="0.6"/>

            <!-- Planet -->
            <circle cx="40" cy="40" r="20" fill="url(#planetGradient)"/>
            <circle cx="40" cy="40" r="20" fill="url(#planetGradient)" opacity="0.3" style="animation: planetPulse 3s ease-in-out infinite;"/>

            <!-- Planet details -->
            <ellipse cx="35" cy="35" rx="5" ry="3" fill="rgba(218, 165, 32, 0.3)"/>
            <ellipse cx="42" cy="45" rx="6" ry="4" fill="rgba(218, 165, 32, 0.3)"/>

            <!-- Ring (front) -->
            <path d="M 5,40 Q 5,50 40,52 T 75,40" fill="none" stroke="url(#ringGradient)" stroke-width="3" opacity="0.8"/>

            <style>
                @keyframes planetPulse {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.05); opacity: 0.5; }
                }
            </style>
        </svg>
    `;
}

// Generate Zodiac SVG
function generateZodiacSVG(sign) {
    const zodiacSymbols = {
        aries: '♈',
        taurus: '♉',
        gemini: '♊',
        cancer: '♋',
        leo: '♌',
        virgo: '♍',
        libra: '♎',
        scorpio: '♏',
        sagittarius: '♐',
        capricorn: '♑',
        aquarius: '♒',
        pisces: '♓'
    };

    const symbol = zodiacSymbols[sign] || '⭐';

    return `
        <div class="zodiac-visual" style="text-align: center; margin: 20px 0;">
            <svg width="120" height="120" viewBox="0 0 120 120" style="filter: drop-shadow(0 0 20px rgba(244, 197, 66, 0.6));">
                <!-- Outer glow circle -->
                <circle cx="60" cy="60" r="55" fill="none" stroke="url(#goldGradient)" stroke-width="2" opacity="0.3"/>
                <circle cx="60" cy="60" r="50" fill="none" stroke="url(#goldGradient)" stroke-width="1" opacity="0.5"/>

                <!-- Main circle background -->
                <circle cx="60" cy="60" r="45" fill="rgba(244, 197, 66, 0.1)" stroke="url(#goldGradient)" stroke-width="2"/>

                <!-- Zodiac symbol -->
                <text x="60" y="60" text-anchor="middle" dominant-baseline="central"
                      font-size="48" fill="url(#goldGradient)" style="font-weight: bold;">
                    ${symbol}
                </text>

                <!-- Gradient definition -->
                <defs>
                    <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#f4c542;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#ffd700;stop-opacity:1" />
                    </linearGradient>
                </defs>

                <!-- Rotating stars -->
                <g style="animation: rotateStars 20s linear infinite; transform-origin: 60px 60px;">
                    <circle cx="60" cy="15" r="2" fill="#f4c542" opacity="0.8"/>
                    <circle cx="105" cy="60" r="2" fill="#f4c542" opacity="0.8"/>
                    <circle cx="60" cy="105" r="2" fill="#f4c542" opacity="0.8"/>
                    <circle cx="15" cy="60" r="2" fill="#f4c542" opacity="0.8"/>
                </g>
            </svg>

            <style>
                @keyframes rotateStars {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .zodiac-visual svg {
                    animation: float 3s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
            </style>
        </div>
    `;
}
