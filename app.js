"use strict";

/*
==================================================
 AI CLUB - OFFLINE ENGINE
==================================================
*/

const modelFiles = [
    "GPT-OSS-20B.json",
    "Qwen3-8B.json",
    "Gemma-3-12B.json",
    "DeepSeek-R1-14B.json",
    "Ultra Meow 4.json",
    "Dog-1.0.json"
];

/*
==================================================
 COMMUNITY
==================================================
*/

const COMMUNITY_INDEX = "community/index.json";

const GITHUB_OWNER = "KomorCorp";
const GITHUB_REPO = "AIClub";
const GITHUB_BRANCH = "main";

/*
==================================================
 STAN
==================================================
*/

let models = [];
let communityModels = [];
let selectedModel = null;

let points =
    Number(localStorage.getItem("aiClubPoints")) || 100;

let premium =
    localStorage.getItem("aiClubPremium") === "true";

const PREMIUM_PRICE = 100;
const DAILY_REWARD = 200;

/*
==================================================
 DOM
==================================================
*/

const $ = id => document.getElementById(id);

const modelsGrid = $("modelsGrid");
const modelCount = $("modelCount");
const heroModelCount = $("heroModelCount");
const pointsElement = $("points");

const overlay = $("chatOverlay");
const closeChat = $("closeChat");
const messages = $("messages");
const examples = $("examples");
const messageInput = $("messageInput");
const sendButton = $("sendButton");

const chatModelName = $("chatModelName");
const chatModelProvider = $("chatModelProvider");
const chatModelIcon = $("chatModelIcon");

const buyPremiumBtn = $("buyPremiumBtn");
const premiumStatus = $("premiumStatus");

const dailyBtn = $("dailyBtn");
const dailyStatus = $("dailyStatus");

const publishOverlay = $("publishOverlay");
const publishModelButton = $("publishModelButton");
const closePublish = $("closePublish");
const submitCommunityModel = $("submitCommunityModel");

const communityModelName = $("communityModelName");
const communityModelAuthor = $("communityModelAuthor");
const communityModelDescription =
    $("communityModelDescription");
const communityModelJSON = $("communityModelJSON");
const jsonValidation = $("jsonValidation");

/*
==================================================
 BEZPIECZNE EVENTY
==================================================
*/

function on(element, event, callback) {
    if (!element) return;
    element.addEventListener(event, callback);
}

/*
==================================================
 PUNKTY
==================================================
*/

function savePoints() {
    localStorage.setItem(
        "aiClubPoints",
        String(points)
    );

    if (pointsElement) {
        pointsElement.textContent = points;
    }
}

function updatePointsUI() {
    savePoints();
    updatePremiumUI();
}

savePoints();

/*
==================================================
 PREMIUM
==================================================
*/

function updatePremiumUI() {

    if (!premiumStatus || !buyPremiumBtn) {
        return;
    }

    if (premium) {

        premiumStatus.textContent =
            "Aktywne ⭐";

        buyPremiumBtn.textContent =
            "Premium aktywne";

        buyPremiumBtn.disabled = true;

    } else {

        premiumStatus.textContent =
            `Zablokowane — ${PREMIUM_PRICE} pkt`;

        buyPremiumBtn.textContent =
            `Kup za ${PREMIUM_PRICE} pkt`;

        buyPremiumBtn.disabled =
            points < PREMIUM_PRICE;
    }
}

on(
    buyPremiumBtn,
    "click",
    () => {

        if (premium) return;

        if (points < PREMIUM_PRICE) {

            alert(
                `Potrzebujesz ${PREMIUM_PRICE} pkt.`
            );

            return;
        }

        if (
            !confirm(
                `Kupić AI Club Premium za ${PREMIUM_PRICE} pkt?`
            )
        ) {
            return;
        }

        points -= PREMIUM_PRICE;
        premium = true;

        localStorage.setItem(
            "aiClubPremium",
            "true"
        );

        updatePointsUI();

        alert(
            "⭐ AI Club Premium zostało odblokowane!"
        );
    }
);

/*
==================================================
 DAILY REWARD
==================================================
*/

function getToday() {

    const now = new Date();

    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}

function updateDailyUI() {

    if (!dailyBtn || !dailyStatus) {
        return;
    }

    const today = getToday();

    const lastClaim =
        localStorage.getItem("aiClubDaily");

    if (lastClaim === today) {

        dailyBtn.disabled = true;
        dailyBtn.textContent = "Odebrano ✓";

        dailyStatus.textContent =
            "Wróć jutro po kolejne 200 pkt";

    } else {

        dailyBtn.disabled = false;
        dailyBtn.textContent =
            "Odbierz 200 pkt";

        dailyStatus.textContent =
            "+200 pkt dziennie";
    }
}

on(
    dailyBtn,
    "click",
    () => {

        const today = getToday();

        if (
            localStorage.getItem(
                "aiClubDaily"
            ) === today
        ) {
            return;
        }

        points += DAILY_REWARD;

        localStorage.setItem(
            "aiClubDaily",
            today
        );

        updatePointsUI();
        updateDailyUI();

        alert(
            "🎁 Otrzymujesz 200 punktów!"
        );
    }
);

updateDailyUI();

/*
==================================================
 FETCH JSON
==================================================
*/

async function fetchJSON(url) {

    const separator =
        url.includes("?") ? "&" : "?";

    const response =
        await fetch(
            url +
            separator +
            "v=" +
            Date.now(),
            {
                cache: "no-store"
            }
        );

    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status}: ${url}`
        );
    }

    return await response.json();
}

/*
==================================================
 WALIDACJA MODELU
==================================================
*/

function prepareModel(model, options = {}) {

    if (
        !model ||
        typeof model !== "object"
    ) {
        return null;
    }

    if (
        typeof model.id !== "string" ||
        !model.id.trim()
    ) {
        return null;
    }

    if (
        typeof model.name !== "string" ||
        !model.name.trim()
    ) {
        return null;
    }

    if (!Array.isArray(model.examples)) {
        model.examples = [];
    }

    if (options.community) {

        model.community = true;

        model.provider =
            model.provider ||
            "AI Club Community";

        model.author =
            model.author ||
            options.author ||
            "Community";

        model.version =
            model.version ||
            options.version ||
            "1.0";
    }

    return model;
}

/*
==================================================
 ŁADOWANIE OFFICIAL MODELS
==================================================
*/

async function loadModels() {

    if (modelsGrid) {

        modelsGrid.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                <span>Ładowanie modeli...</span>
            </div>
        `;
    }

    const loaded = [];

    for (const file of modelFiles) {

        try {

            const model =
                await fetchJSON(
                    "models/" +
                    encodeURIComponent(file)
                );

            const prepared =
                prepareModel(model);

            if (!prepared) {

                console.warn(
                    "Niepoprawny model:",
                    file
                );

                continue;
            }

            loaded.push(prepared);

        } catch (error) {

            console.error(
                `Błąd ${file}:`,
                error
            );
        }
    }

    models = loaded;

    renderModels();
}

/*
==================================================
 ŁADOWANIE COMMUNITY MODELS
==================================================
*/

async function loadCommunityModels() {

    try {

        const registry =
            await fetchJSON(
                COMMUNITY_INDEX
            );

        if (
            !registry ||
            !Array.isArray(registry.models)
        ) {

            throw new Error(
                "community/index.json musi posiadać tablicę models"
            );
        }

        const loaded = [];

        for (
            const entry
            of registry.models
        ) {

            try {

                if (
                    !entry ||
                    typeof entry.file !== "string"
                ) {
                    continue;
                }

                const path =
                    "community/" +
                    entry.file
                        .split("/")
                        .map(encodeURIComponent)
                        .join("/");

                const model =
                    await fetchJSON(path);

                const prepared =
                    prepareModel(
                        model,
                        {
                            community: true,
                            author: entry.author,
                            version: entry.version
                        }
                    );

                if (!prepared) {

                    console.warn(
                        "Niepoprawny Community Model:",
                        entry.file
                    );

                    continue;
                }

                loaded.push(prepared);

            } catch (error) {

                console.error(
                    `Błąd community/${entry.file}:`,
                    error
                );
            }
        }

        communityModels = loaded;

        models = [
            ...models.filter(
                model => !model.community
            ),
            ...communityModels
        ];

        renderModels();

        console.log(
            `Community Models: ${communityModels.length}`
        );

    } catch (error) {

        /*
         * Brak Community nie blokuje
         * oficjalnych modeli.
         */

        console.warn(
            "Community Models niedostępne:",
            error
        );

        renderModels();
    }
}

/*
==================================================
 RENDER MODELS
==================================================
*/

function renderModels() {

    if (!modelsGrid) {
        return;
    }

    modelsGrid.innerHTML = "";

    if (modelCount) {
        modelCount.textContent =
            `${models.length} modeli`;
    }

    if (heroModelCount) {
        heroModelCount.textContent =
            models.length;
    }

    if (models.length === 0) {

        modelsGrid.innerHTML = `
            <div class="loading">
                <span>Brak modeli.</span>
            </div>
        `;

        return;
    }

    for (const model of models) {

        const card =
            document.createElement("article");

        card.className =
            "model-card";

        const badge =
            model.community
                ? `<span class="community-badge">COMMUNITY</span>`
                : `<span class="official-badge">OFFICIAL</span>`;

        const author =
            model.community
                ? `
                    <div class="model-author">
                        👤 ${escapeHTML(
                            model.author || "Community"
                        )}
                    </div>
                `
                : "";

        card.innerHTML = `
            <div class="model-icon">
                ✦
            </div>

            <h3>
                ${escapeHTML(model.name)}
            </h3>

            <div class="provider">
                ${escapeHTML(
                    model.provider ||
                    "AI Club Local"
                )}

                ${badge}
            </div>

            ${author}

            <p class="description">
                ${escapeHTML(
                    model.description ||
                    "Lokalny model AI."
                )}
            </p>

            <div class="model-footer">

                <div class="model-info">
                    LOCAL ·
                    ${Number(
                        model.context || 0
                    ).toLocaleString("pl-PL")}
                    tokens
                </div>

                <button
                    type="button"
                    class="use-button"
                    data-model-id="${escapeHTML(model.id)}"
                >
                    Użyj →
                </button>

            </div>
        `;

        modelsGrid.appendChild(card);
    }

    modelsGrid
        .querySelectorAll(".use-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const model =
                        models.find(
                            item =>
                                item.id ===
                                button.dataset.modelId
                        );

                    if (model) {
                        openChat(model);
                    }
                }
            );
        });
}

/*
==================================================
 CHAT
==================================================
*/

function openChat(model) {

    selectedModel = model;

    if (chatModelName) {
        chatModelName.textContent =
            model.name;
    }

    if (chatModelProvider) {

        chatModelProvider.textContent =
            `${model.provider || "AI Club Local"} · OFFLINE`;
    }

    if (chatModelIcon) {
        chatModelIcon.textContent =
            "✦";
    }

    if (messages) {
        messages.innerHTML = "";
    }

    addMessage(
        "system",
        `Rozpoczęto rozmowę z ${model.name}.`
    );

    renderExamples(model);

    if (overlay) {
        overlay.classList.remove("hidden");
    }

    if (messageInput) {

        messageInput.value = "";

        setTimeout(
            () => messageInput.focus(),
            50
        );
    }
}

/*
==================================================
 EXAMPLES
==================================================
*/

function renderExamples(model) {

    if (!examples) {
        return;
    }

    examples.innerHTML = "";

    if (
        !Array.isArray(model.examples)
    ) {
        return;
    }

    for (
        const example
        of model.examples.slice(0, 8)
    ) {

        let question = null;

        if (
            Array.isArray(
                example.questions
            )
        ) {

            question =
                example.questions[0];

        } else if (
            typeof example.question === "string"
        ) {

            question =
                example.question;
        }

        if (!question) {
            continue;
        }

        const button =
            document.createElement("button");

        button.type = "button";

        button.className =
            "example-question";

        button.textContent =
            question;

        button.addEventListener(
            "click",
            () => {

                if (!messageInput) {
                    return;
                }

                messageInput.value =
                    question;

                messageInput.focus();
            }
        );

        examples.appendChild(button);
    }
}

/*
==================================================
 SEND MESSAGE
==================================================
*/

async function sendMessage() {

    if (!selectedModel || !messageInput) {
        return;
    }

    const text =
        messageInput.value.trim();

    if (!text) {
        return;
    }

    const cost =
        Number(
            selectedModel.points_per_message
        ) || 1;

    if (points < cost) {

        addMessage(
            "system",
            `Brakuje punktów. Ta wiadomość kosztuje ${cost} ⭐.`
        );

        return;
    }

    addMessage(
        "user",
        text
    );

    messageInput.value = "";

    points -= cost;

    updatePointsUI();

    const answer =
        findLocalAnswer(
            text,
            selectedModel
        );

    await sleep(250);

    if (answer) {

        addMessage(
            "ai",
            answer
        );

    } else {

        addMessage(
            "ai",
            getUnknownAnswer(text)
        );
    }
}

/*
==================================================
 LOCAL ANSWER
==================================================
*/

function findLocalAnswer(input, model) {

    if (
        !model ||
        !Array.isArray(model.examples)
    ) {
        return null;
    }

    const normalizedInput =
        normalizeText(input);

    let bestAnswer = null;
    let bestScore = 0;

    for (
        const example
        of model.examples
    ) {

        if (
            !example ||
            typeof example !== "object"
        ) {
            continue;
        }

        let questions = [];

        if (
            Array.isArray(
                example.questions
            )
        ) {

            questions =
                example.questions;

        } else if (
            typeof example.question === "string"
        ) {

            questions = [
                example.question
            ];
        }

        for (
            const question
            of questions
        ) {

            if (
                typeof question !== "string"
            ) {
                continue;
            }

            const normalizedQuestion =
                normalizeText(question);

            if (
                normalizedInput ===
                normalizedQuestion
            ) {

                return example.answer;
            }

            const score =
                getSimilarity(
                    normalizedInput,
                    normalizedQuestion
                );

            if (
                score > bestScore
            ) {

                bestScore = score;
                bestAnswer =
                    example.answer;
            }
        }
    }

    if (
        bestScore >= 0.72
    ) {
        return bestAnswer;
    }

    return null;
}

/*
==================================================
 NORMALIZE
==================================================
*/

function normalizeText(text) {

    return String(text)
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[ąćęłńóśźż]/g,
            char => {

                const map = {
                    "ą": "a",
                    "ć": "c",
                    "ę": "e",
                    "ł": "l",
                    "ń": "n",
                    "ó": "o",
                    "ś": "s",
                    "ź": "z",
                    "ż": "z"
                };

                return map[char] || char;
            }
        )
        .replace(
            /[^\p{L}\p{N}\s]/gu,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim();
}

/*
==================================================
 SIMILARITY
==================================================
*/

function getSimilarity(a, b) {

    if (a === b) {
        return 1;
    }

    if (!a || !b) {
        return 0;
    }

    if (
        a.includes(b) ||
        b.includes(a)
    ) {

        const smaller =
            Math.min(
                a.length,
                b.length
            );

        const larger =
            Math.max(
                a.length,
                b.length
            );

        if (
            smaller / larger >= 0.65
        ) {
            return 0.90;
        }
    }

    const distance =
        levenshtein(a, b);

    const maxLength =
        Math.max(
            a.length,
            b.length
        );

    return Math.max(
        0,
        1 -
        distance / maxLength
    );
}

/*
==================================================
 LEVENSHTEIN
==================================================
*/

function levenshtein(a, b) {

    const matrix = [];

    for (
        let i = 0;
        i <= b.length;
        i++
    ) {

        matrix[i] = [i];
    }

    for (
        let j = 0;
        j <= a.length;
        j++
    ) {

        matrix[0][j] = j;
    }

    for (
        let i = 1;
        i <= b.length;
        i++
    ) {

        for (
            let j = 1;
            j <= a.length;
            j++
        ) {

            if (
                b[i - 1] ===
                a[j - 1]
            ) {

                matrix[i][j] =
                    matrix[i - 1][j - 1];

            } else {

                matrix[i][j] =
                    Math.min(
                        matrix[i - 1][j] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j - 1] + 1
                    );
            }
        }
    }

    return matrix[b.length][a.length];
}

/*
==================================================
 UNKNOWN
==================================================
*/

function getUnknownAnswer(text) {

    const responses = [

        `Nie mam jeszcze odpowiedzi na „${text}”. 🤔`,

        "Tego nie mam jeszcze w mojej lokalnej bazie wiedzy.",

        "Nie znalazłem wystarczająco podobnego pytania w moim JSON-ie.",

        "Hmm... tego pytania jeszcze mnie nie nauczono. 😺"
    ];

    return responses[
        Math.floor(
            Math.random() *
            responses.length
        )
    ];
}

/*
==================================================
 MESSAGE
==================================================
*/

function addMessage(type, text) {

    if (!messages) {
        return null;
    }

    const element =
        document.createElement("div");

    element.className =
        `message ${type}-message`;

    element.textContent =
        text;

    messages.appendChild(element);

    messages.scrollTop =
        messages.scrollHeight;

    return element;
}

/*
==================================================
 PUBLISH COMMUNITY MODEL
==================================================
*/

function openPublishOverlay() {

    if (!publishOverlay) {
        return;
    }

    publishOverlay.classList.remove(
        "hidden"
    );

    if (communityModelName) {
        communityModelName.focus();
    }
}

function closePublishOverlay() {

    if (!publishOverlay) {
        return;
    }

    publishOverlay.classList.add(
        "hidden"
    );
}

on(
    publishModelButton,
    "click",
    openPublishOverlay
);

on(
    closePublish,
    "click",
    closePublishOverlay
);

on(
    publishOverlay,
    "click",
    event => {

        if (
            event.target ===
            publishOverlay
        ) {
            closePublishOverlay();
        }
    }
);

/*
==================================================
 VALIDATE COMMUNITY JSON
==================================================
*/

function validateCommunityJSON() {

    if (!communityModelJSON) {
        return null;
    }

    const raw =
        communityModelJSON.value.trim();

    if (!raw) {

        setValidation(
            "❌ Wklej JSON modelu.",
            false
        );

        return null;
    }

    let model;

    try {

        model =
            JSON.parse(raw);

    } catch (error) {

        setValidation(
            "❌ JSON jest niepoprawny.",
            false
        );

        console.error(
            "Community JSON:",
            error
        );

        return null;
    }

    if (
        typeof model.id !== "string" ||
        !model.id.trim()
    ) {

        setValidation(
            '❌ Model musi posiadać pole "id".',
            false
        );

        return null;
    }

    if (
        typeof model.name !== "string" ||
        !model.name.trim()
    ) {

        setValidation(
            '❌ Model musi posiadać pole "name".',
            false
        );

        return null;
    }

    if (
        !Array.isArray(model.examples)
    ) {

        setValidation(
            '❌ Pole "examples" musi być tablicą.',
            false
        );

        return null;
    }

    for (
        let i = 0;
        i < model.examples.length;
        i++
    ) {

        const example =
            model.examples[i];

        if (
            !example ||
            typeof example !== "object"
        ) {

            setValidation(
                `❌ Błąd w examples[${i}].`,
                false
            );

            return null;
        }

        const questions =
            Array.isArray(example.questions)
                ? example.questions
                : (
                    typeof example.question === "string"
                        ? [example.question]
                        : []
                );

        if (
            questions.length === 0
        ) {

            setValidation(
                `❌ examples[${i}] nie ma pytania.`,
                false
            );

            return null;
        }

        if (
            typeof example.answer !== "string"
        ) {

            setValidation(
                `❌ examples[${i}] nie ma odpowiedzi.`,
                false
            );

            return null;
        }
    }

    model.provider =
        "AI Club Community";

    model.type =
        "community";

    model.author =
        communityModelAuthor?.value.trim() ||
        "Community";

    model.description =
        communityModelDescription?.value.trim() ||
        model.description ||
        "Community model for AI Club.";

    model.community = true;

    setValidation(
        `✅ JSON poprawny. ${model.examples.length} wpisów.`,
        true
    );

    return model;
}

function setValidation(text, success) {

    if (!jsonValidation) {
        return;
    }

    jsonValidation.textContent = text;

    jsonValidation.className =
        success
            ? "json-validation success"
            : "json-validation error";
}

on(
    communityModelJSON,
    "input",
    () => {

        if (
            communityModelJSON.value.trim()
        ) {
            validateCommunityJSON();
        }
    }
);

/*
==================================================
 GITHUB COMMUNITY SUBMISSION
==================================================
*/

on(
    submitCommunityModel,
    "click",
    () => {

        const model =
            validateCommunityJSON();

        if (!model) {
            return;
        }

        const name =
            communityModelName?.value.trim();

        if (!name) {

            alert(
                "Podaj nazwę modelu."
            );

            communityModelName?.focus();

            return;
        }

        model.name = name;

        const author =
            communityModelAuthor?.value.trim() ||
            "Community";

        const description =
            communityModelDescription?.value.trim() ||
            model.description ||
            "";

        const issueTitle =
            `[Community Model] ${name}`;

        const issueBody =
`# 🌐 AI Club Community Model

## Informacje

**Model:** ${name}

**Autor:** ${author}

**Opis:**
${description}

## JSON

\`\`\`json
${JSON.stringify(model, null, 2)}
\`\`\`

## Moderacja

- [ ] JSON poprawny
- [ ] Model nie zawiera kodu JavaScript
- [ ] Model nie zawiera danych prywatnych
- [ ] Model nie zawiera spamu

---

AI Club Community submission
`;

        const githubURL =
            `https://github.com/${encodeURIComponent(GITHUB_OWNER)}/${encodeURIComponent(GITHUB_REPO)}/issues/new` +
            `?title=${encodeURIComponent(issueTitle)}` +
            `&body=${encodeURIComponent(issueBody)}` +
            `&labels=community-model`;

        window.open(
            githubURL,
            "_blank",
            "noopener,noreferrer"
        );
    }
);

/*
==================================================
 CHAT CONTROLS
==================================================
*/

on(
    sendButton,
    "click",
    sendMessage
);

on(
    messageInput,
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();
        }
    }
);

function closeChatOverlay() {

    if (overlay) {
        overlay.classList.add("hidden");
    }

    selectedModel = null;
}

on(
    closeChat,
    "click",
    closeChatOverlay
);

on(
    overlay,
    "click",
    event => {

        if (
            event.target === overlay
        ) {
            closeChatOverlay();
        }
    }
);

on(
    document,
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            closeChatOverlay();
            closePublishOverlay();
        }
    }
);

/*
==================================================
 UTILS
==================================================
*/

function sleep(ms) {

    return new Promise(
        resolve =>
            setTimeout(resolve, ms)
    );
}

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/*
==================================================
 START
==================================================
*/

async function startAIClub() {

    console.log(
        "🐱 AI Club uruchamianie..."
    );

    await loadModels();

    /*
     * Community ładuje się dopiero
     * po oficjalnych modelach.
     */

    await loadCommunityModels();

    console.log(
        "✅ AI Club gotowy."
    );
}

startAIClub();
