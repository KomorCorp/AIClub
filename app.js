"use strict";

/* =========================================================
   AI CLUB - OFFLINE ENGINE
   ========================================================= */

const CONFIG_FILE = "config.json";
const COMMUNITY_INDEX = "community/index.json";

const FALLBACK_MODEL_FILES = [
    "GPT-OSS-20B.json",
    "Qwen3-8B.json",
    "Gemma-3-12B.json",
    "DeepSeek-R1-14B.json",
    "Ultra Meow 4.json",
    "Dog-1.0.json"
];

const GITHUB_OWNER = "KomorCorp";
const GITHUB_REPO = "AIClub";
const GITHUB_BRANCH = "main";

let models = [];
let communityModels = [];
let selectedModel = null;

/* =========================================================
   PUNKTY
   ========================================================= */

let points =
    Number(localStorage.getItem("aiClubPoints")) || 100;

const PREMIUM_PRICE = 100;

let premium =
    localStorage.getItem("aiClubPremium") === "true";

const DAILY_REWARD = 200;

/* =========================================================
   DOM
   ========================================================= */

const modelsGrid =
    document.getElementById("modelsGrid");

const modelCount =
    document.getElementById("modelCount");

const heroModelCount =
    document.getElementById("heroModelCount");

const pointsElement =
    document.getElementById("points");

const overlay =
    document.getElementById("chatOverlay");

const closeChat =
    document.getElementById("closeChat");

const messages =
    document.getElementById("messages");

const examples =
    document.getElementById("examples");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const chatModelName =
    document.getElementById("chatModelName");

const chatModelProvider =
    document.getElementById("chatModelProvider");

const chatModelIcon =
    document.getElementById("chatModelIcon");

const buyPremiumBtn =
    document.getElementById("buyPremiumBtn");

const premiumStatus =
    document.getElementById("premiumStatus");

const dailyBtn =
    document.getElementById("dailyBtn");

const dailyStatus =
    document.getElementById("dailyStatus");

const premiumOverlay =
    document.getElementById("premiumOverlay");

const premiumMessage =
    document.getElementById("premiumMessage");

const closePremiumMessage =
    document.getElementById("closePremiumMessage");

const premiumGoButton =
    document.getElementById("premiumGoButton");

/* =========================================================
   COMMUNITY DOM
   ========================================================= */

const publishOverlay =
    document.getElementById("publishOverlay");

const publishModelButton =
    document.getElementById("publishModelButton");

const closePublish =
    document.getElementById("closePublish");

const submitCommunityModel =
    document.getElementById("submitCommunityModel");

const communityModelName =
    document.getElementById("communityModelName");

const communityModelAuthor =
    document.getElementById("communityModelAuthor");

const communityModelDescription =
    document.getElementById("communityModelDescription");

const communityModelJSON =
    document.getElementById("communityModelJSON");

const jsonValidation =
    document.getElementById("jsonValidation");

/* =========================================================
   HELPERS
   ========================================================= */

function exists(element) {
    return element !== null && element !== undefined;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function escapeHTML(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function useModel(model) {

    if (!model) {
        return;
    }

    if (model.premium === true && !premium) {

        showPremiumMessage(model);

        return;
    }

    openChat(model);
}

/* =========================================================
   SAFE FETCH
   ========================================================= */

async function fetchJSON(url) {

    console.log(
        "[AI Club] Ładowanie:",
        url
    );

    const response =
        await fetch(
            url + (
                url.includes("?")
                    ? "&"
                    : "?"
            ) + "v=" + Date.now(),
            {
                cache: "no-store"
            }
        );

    if (!response.ok) {

        throw new Error(
            `HTTP ${response.status} dla ${url}`
        );
    }

    const contentType =
        response.headers.get("content-type") || "";

    /*
     * GitHub Pages / niektóre serwery mogą zwrócić
     * HTML zamiast JSON przy błędnej ścieżce.
     */

    if (
        !contentType.includes("json") &&
        !contentType.includes("javascript") &&
        !contentType.includes("text")
    ) {

        console.warn(
            "[AI Club] Podejrzany Content-Type:",
            contentType,
            url
        );
    }

    const text =
        await response.text();

    try {

        return JSON.parse(text);

    } catch (error) {

        console.error(
            "[AI Club] Odpowiedź nie jest JSON-em:",
            url,
            text.slice(0, 300)
        );

        throw new Error(
            `Niepoprawny JSON: ${url}`
        );
    }
}

/* =========================================================
   PUNKTY
   ========================================================= */

function savePoints() {

    localStorage.setItem(
        "aiClubPoints",
        String(points)
    );

    if (exists(pointsElement)) {

        pointsElement.textContent =
            points.toLocaleString("pl-PL");
    }
}

function updatePointsUI() {

    savePoints();
    updatePremiumUI();
}

savePoints();

/* =========================================================
   PREMIUM
   ========================================================= */

function updatePremiumUI() {

    if (
        !exists(premiumStatus) ||
        !exists(buyPremiumBtn)
    ) {
        return;
    }

    if (premium) {

        premiumStatus.textContent =
            "Aktywne ⭐";

        buyPremiumBtn.textContent =
            "Premium aktywne";

        buyPremiumBtn.disabled =
            true;

    } else {

        premiumStatus.textContent =
            `Zablokowane — ${PREMIUM_PRICE} pkt`;

        buyPremiumBtn.textContent =
            `Kup za ${PREMIUM_PRICE} pkt`;

        buyPremiumBtn.disabled =
            points < PREMIUM_PRICE;
    }
}

if (exists(buyPremiumBtn)) {

    buyPremiumBtn.addEventListener(
        "click",
        () => {

            if (premium) {
                return;
            }

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
}

updatePremiumUI();


function showPremiumMessage(model) {

    if (!exists(premiumOverlay)) {
        return;
    }

    if (exists(premiumMessage)) {
        premiumMessage.textContent =
            `"${model.name}" jest dostępny tylko w AI Club Premium. Kup Premium za ${PREMIUM_PRICE} pkt, aby go odblokować.`;
    }

    premiumOverlay.classList.remove("hidden");
}

function closePremiumMessageOverlay() {

    if (exists(premiumOverlay)) {
        premiumOverlay.classList.add("hidden");
    }
}

if (exists(closePremiumMessage)) {

    closePremiumMessage.addEventListener(
        "click",
        closePremiumMessageOverlay
    );
}

if (exists(premiumOverlay)) {

    premiumOverlay.addEventListener(
        "click",
        event => {

            if (event.target === premiumOverlay) {
                closePremiumMessageOverlay();
            }
        }
    );
}

/* =========================================================
   DAILY REWARD
   ========================================================= */

function getToday() {

    const now = new Date();

    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}

function updateDailyUI() {

    if (
        !exists(dailyBtn) ||
        !exists(dailyStatus)
    ) {
        return;
    }

    const today =
        getToday();

    const lastClaim =
        localStorage.getItem(
            "aiClubDaily"
        );

    if (lastClaim === today) {

        dailyBtn.disabled = true;

        dailyBtn.textContent =
            "Odebrano ✓";

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

if (exists(dailyBtn)) {

    dailyBtn.addEventListener(
        "click",
        () => {

            const today =
                getToday();

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
}

updateDailyUI();

/* =========================================================
   CONFIG
   ========================================================= */

async function loadConfig() {

    try {

        const config =
            await fetchJSON(
                CONFIG_FILE
            );

        console.log(
            "[AI Club] config.json:",
            config
        );

        return config;

    } catch (error) {

        console.warn(
            "[AI Club] Nie udało się załadować config.json.",
            error
        );

        return null;
    }
}

/* =========================================================
   WYCIĄGANIE PLIKÓW MODELI Z CONFIG
   ========================================================= */

function getModelFilesFromConfig(config) {

    if (!config) {
        return [];
    }

    const result = [];

    /*
     * Format:
     *
     * {
     *   "models": [
     *      "GPT-OSS-20B.json",
     *      "Qwen3-8B.json"
     *   ]
     * }
     */

    if (Array.isArray(config.models)) {

        for (const item of config.models) {

            if (typeof item === "string") {

                result.push(item);

            } else if (
                item &&
                typeof item === "object"
            ) {

                const file =
                    item.file ||
                    item.json ||
                    item.path;

                if (typeof file === "string") {
                    result.push(file);
                }
            }
        }
    }

    /*
     * Format:
     *
     * {
     *   "lm": [
     *      ...
     *   ]
     * }
     */

    if (
        result.length === 0 &&
        Array.isArray(config.lm)
    ) {

        for (const item of config.lm) {

            if (typeof item === "string") {

                result.push(item);

            } else if (
                item &&
                typeof item === "object"
            ) {

                const file =
                    item.file ||
                    item.json ||
                    item.path;

                if (typeof file === "string") {
                    result.push(file);
                }
            }
        }
    }

    /*
     * Format:
     *
     * {
     *   "models": {
     *      "GPT": {
     *          "file": "GPT.json"
     *      }
     *   }
     * }
     */

    if (
        result.length === 0 &&
        config.models &&
        typeof config.models === "object" &&
        !Array.isArray(config.models)
    ) {

        for (
            const [key, value]
            of Object.entries(config.models)
        ) {

            if (typeof value === "string") {

                result.push(value);

            } else if (
                value &&
                typeof value === "object"
            ) {

                const file =
                    value.file ||
                    value.json ||
                    value.path;

                if (typeof file === "string") {

                    result.push(file);

                } else if (
                    key.endsWith(".json")
                ) {

                    result.push(key);
                }
            }
        }
    }

    return [
        ...new Set(
            result.filter(
                file =>
                    typeof file === "string" &&
                    file.trim().length > 0
            )
        )
    ];
}

/* =========================================================
   NORMALIZACJA ŚCIEŻKI MODELU
   ========================================================= */

function normalizeModelPath(file) {

    let path =
        String(file).trim();

    /*
     * Pozwalamy configowi podać:
     *
     * GPT.json
     * models/GPT.json
     * ./models/GPT.json
     */

    path =
        path.replace(/^\.\/+/, "");

    if (
        path.startsWith("models/")
    ) {

        path =
            path.slice(
                "models/".length
            );
    }

    return (
        "models/" +
        path
            .split("/")
            .map(
                part =>
                    encodeURIComponent(part)
            )
            .join("/")
    );
}

/* =========================================================
   WALIDACJA MODELU
   ========================================================= */

function validateModel(model, file) {

    if (
        !model ||
        typeof model !== "object"
    ) {

        throw new Error(
            `${file}: JSON nie jest obiektem`
        );
    }

    if (
        !model.id ||
        typeof model.id !== "string"
    ) {

        throw new Error(
            `${file}: brak poprawnego "id"`
        );
    }

    if (
        !model.name ||
        typeof model.name !== "string"
    ) {

        throw new Error(
            `${file}: brak poprawnego "name"`
        );
    }

    if (
        !Array.isArray(
            model.examples
        )
    ) {

        model.examples = [];
    }

    if (
        typeof model.provider !== "string"
    ) {

        model.provider =
            "AI Club Local";
    }

    if (
        typeof model.description !== "string"
    ) {

        model.description =
            "Lokalny model AI.";
    }

    if (
        typeof model.context !== "number"
    ) {

        model.context = 0;
    }

    model.community = false;

    return model;
}

/* =========================================================
   ŁADOWANIE OFFICIAL MODELS
   ========================================================= */

async function loadModels() {

    if (!exists(modelsGrid)) {

        console.error(
            "AI Club: brak #modelsGrid w HTML."
        );

        return;
    }

    modelsGrid.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <span>Ładowanie modeli...</span>
        </div>
    `;

    let config =
        await loadConfig();

    let modelFiles =
        getModelFilesFromConfig(
            config
        );

    /*
     * Jeżeli config nie zawiera listy modeli,
     * używamy fallbacku.
     */

    if (modelFiles.length === 0) {

        console.warn(
            "[AI Club] config.json nie zawiera listy modeli. Używam fallback."
        );

        modelFiles =
            FALLBACK_MODEL_FILES;
    }

    console.log(
        "[AI Club] Modele do załadowania:",
        modelFiles
    );

    const loaded = [];

    for (
        const file
        of modelFiles
    ) {

        try {

            const url =
                normalizeModelPath(file);

            console.log(
                "[AI Club] Próba:",
                url
            );

            const model =
                await fetchJSON(url);

            validateModel(
                model,
                file
            );

            /*
             * Jeżeli config posiada metadane,
             * zachowujemy je tylko wtedy,
             * gdy JSON modelu ich nie posiada.
             */

            if (
                config &&
                Array.isArray(config.models)
            ) {

                const configEntry =
                    config.models.find(
                        item => {

                            if (
                                typeof item ===
                                "string"
                            ) {
                                return (
                                    item === file
                                );
                            }

                            if (
                                item &&
                                typeof item ===
                                "object"
                            ) {

                                return (
                                    item.file === file ||
                                    item.json === file ||
                                    item.path === file
                                );
                            }

                            return false;
                        }
                    );

                if (
                    configEntry &&
                    typeof configEntry === "object"
                ) {

                    if (
                        !model.name &&
                        configEntry.name
                    ) {
                        model.name =
                            configEntry.name;
                    }

                    if (
                        configEntry.provider &&
                        !model.provider
                    ) {
                        model.provider =
                            configEntry.provider;
                    }

                    if (
                        configEntry.description &&
                        !model.description
                    ) {
                        model.description =
                            configEntry.description;
                    }
                }
            }

            loaded.push(model);

            console.log(
                `✅ Załadowano: ${model.name} (${file})`
            );

        } catch (error) {

            console.error(
                `❌ Nie udało się załadować ${file}:`,
                error
            );
        }
    }

    models = loaded;

    console.log(
        `[AI Club] Official: ${models.length}/${modelFiles.length}`
    );

    renderModels();

    /*
     * Community nie może zepsuć Official.
     */

    await loadCommunityModels();
}

/* =========================================================
   COMMUNITY MODELS
   ========================================================= */

async function loadCommunityModels() {

    try {

        const registry =
            await fetchJSON(
                COMMUNITY_INDEX
            );

        if (
            !registry ||
            !Array.isArray(
                registry.models
            )
        ) {

            throw new Error(
                "community/index.json musi zawierać models[]"
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
                    typeof entry.file !==
                    "string"
                ) {
                    continue;
                }

                const url =
                    "community/" +
                    entry.file
                        .replace(/^\/+/, "")
                        .split("/")
                        .map(
                            part =>
                                encodeURIComponent(part)
                        )
                        .join("/");

                const model =
                    await fetchJSON(url);

                if (
                    !model ||
                    typeof model !== "object" ||
                    !model.id ||
                    !model.name
                ) {

                    console.warn(
                        `Niepoprawny community model: ${entry.file}`
                    );

                    continue;
                }

                if (
                    !Array.isArray(
                        model.examples
                    )
                ) {

                    model.examples = [];
                }

                model.community = true;

                model.author =
                    model.author ||
                    entry.author ||
                    "Community";

                model.version =
                    model.version ||
                    entry.version ||
                    "1.0";

                model.provider =
                    model.provider ||
                    "AI Club Community";

                loaded.push(model);

            } catch (error) {

                console.error(
                    `❌ Community ${entry.file}:`,
                    error
                );
            }
        }

        communityModels =
            loaded;

        models = [
            ...models.filter(
                model =>
                    !model.community
            ),
            ...communityModels
        ];

        renderModels();

        console.log(
            `[AI Club] Community: ${communityModels.length}`
        );

    } catch (error) {

        console.warn(
            "[AI Club] Community niedostępne:",
            error
        );
    }
}

/* =========================================================
   RENDER MODELS
   ========================================================= */

function renderModels() {

    if (!exists(modelsGrid)) {
        return;
    }

    modelsGrid.innerHTML = "";

    if (exists(modelCount)) {

        modelCount.textContent =
            `${models.length} modeli`;
    }

    if (exists(heroModelCount)) {

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

    for (
        const model
        of models
    ) {

        const card =
            document.createElement(
                "article"
            );

        card.className =
            "model-card";

        const communityBadge =
            model.community
                ? `
                    <span class="community-badge">
                        COMMUNITY
                    </span>
                  `
                : `
                    <span class="official-badge">
                        OFFICIAL
                    </span>
                  `;

        const author =
            model.community
                ? `
                    <div class="model-author">
                        👤 ${escapeHTML(
                            model.author ||
                            "Community"
                        )}
                    </div>
                  `
                : "";

        card.innerHTML = `
            <div class="model-icon">
                ✦
            </div>

            <h3>
                ${escapeHTML(
                    model.name
                )}
            </h3>

            <div class="provider">
                ${escapeHTML(
                    model.provider ||
                    "AI Club Local"
                )}

                ${communityBadge}
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
                    ).toLocaleString(
                        "pl-PL"
                    )}
                    tokens
                </div>

                <button
                    type="button"
                    class="use-button"
                    data-model-id="${escapeHTML(
                        model.id
                    )}"
                >
                    Użyj →
                </button>

            </div>
        `;

        modelsGrid.appendChild(card);
    }

    modelsGrid.onclick =
        event => {

            const button =
                event.target.closest(
                    ".use-button"
                );

            if (!button) {
                return;
            }

            const id =
                button.dataset.modelId;

            const model =
                models.find(
                    item =>
                        String(item.id) ===
                        String(id)
                );

            if (model) {
                useModel(model);
            }
        };
}

/* =========================================================
   CHAT
   ========================================================= */

function openChat(model) {

    selectedModel =
        model;

    if (exists(chatModelName)) {

        chatModelName.textContent =
            model.name;
    }

    if (exists(chatModelProvider)) {

        chatModelProvider.textContent =
            `${model.provider || "AI Club Local"} · OFFLINE`;
    }

    if (exists(chatModelIcon)) {
        chatModelIcon.textContent = "✦";
    }

    if (exists(messages)) {

        messages.innerHTML = "";

        addMessage(
            "system",
            `Rozpoczęto rozmowę z ${model.name}.`
        );
    }

    renderExamples(model);

    if (exists(overlay)) {

        overlay.classList.remove(
            "hidden"
        );
    }

    if (exists(messageInput)) {

        messageInput.value = "";
        messageInput.focus();
    }
}

/* =========================================================
   EXAMPLES
   ========================================================= */

function renderExamples(model) {

    if (!exists(examples)) {
        return;
    }

    examples.innerHTML = "";

    if (
        !Array.isArray(
            model.examples
        )
    ) {
        return;
    }

    for (
        const example
        of model.examples.slice(0, 8)
    ) {

        let question = "";

        if (
            Array.isArray(
                example.questions
            )
        ) {

            question =
                example.questions[0] || "";

        } else if (
            typeof example.question ===
            "string"
        ) {

            question =
                example.question;
        }

        if (!question) {
            continue;
        }

        const button =
            document.createElement(
                "button"
            );

        button.type =
            "button";

        button.className =
            "example-question";

        button.textContent =
            question;

        button.addEventListener(
            "click",
            () => {

                if (!exists(messageInput)) {
                    return;
                }

                messageInput.value =
                    question;

                messageInput.focus();
            }
        );

        examples.appendChild(
            button
        );
    }
}

/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {

    if (!selectedModel) {
        return;
    }

    if (!exists(messageInput)) {
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

/* =========================================================
   FIND ANSWER
   ========================================================= */

function findLocalAnswer(
    input,
    model
) {

    if (
        !model ||
        !Array.isArray(
            model.examples
        )
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
            typeof example !==
            "object"
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
            typeof example.question ===
            "string"
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
                typeof question !==
                "string"
            ) {
                continue;
            }

            const normalizedQuestion =
                normalizeText(
                    question
                );

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

                bestScore =
                    score;

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

/* =========================================================
   NORMALIZE
   ========================================================= */

function normalizeText(text) {

    return String(text)
        .toLowerCase()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /ł/g,
            "l"
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

/* =========================================================
   SIMILARITY
   ========================================================= */

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
            smaller / larger >=
            0.65
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
        distance /
        maxLength
    );
}

/* =========================================================
   LEVENSHTEIN
   ========================================================= */

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

/* =========================================================
   UNKNOWN
   ========================================================= */

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

/* =========================================================
   MESSAGE
   ========================================================= */

function addMessage(type, text) {

    if (!exists(messages)) {
        return null;
    }

    const element =
        document.createElement(
            "div"
        );

    element.className =
        `message ${type}-message`;

    element.textContent =
        text;

    messages.appendChild(
        element
    );

    messages.scrollTop =
        messages.scrollHeight;

    return element;
}

/* =========================================================
   CHAT EVENTS
   ========================================================= */

if (exists(messageInput)) {

    messageInput.addEventListener(
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
}

if (exists(sendButton)) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );
}

function closeChatOverlay() {

    if (exists(overlay)) {

        overlay.classList.add(
            "hidden"
        );
    }

    selectedModel = null;
}

if (exists(closeChat)) {

    closeChat.addEventListener(
        "click",
        closeChatOverlay
    );
}

if (exists(overlay)) {

    overlay.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                overlay
            ) {

                closeChatOverlay();
            }
        }
    );
}

/* =========================================================
   ESC
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key !==
            "Escape"
        ) {
            return;
        }

        if (
            exists(publishOverlay) &&
            !publishOverlay.classList.contains(
                "hidden"
            )
        ) {

            publishOverlay.classList.add(
                "hidden"
            );

            return;
        }

        closeChatOverlay();
    }
);

/* =========================================================
   COMMUNITY PUBLISH
   ========================================================= */

function openPublish() {

    if (!exists(publishOverlay)) {

        console.error(
            "Brak #publishOverlay w HTML."
        );

        return;
    }

    publishOverlay.classList.remove(
        "hidden"
    );

    if (exists(communityModelName)) {
        communityModelName.focus();
    }
}

function closePublishOverlay() {

    if (exists(publishOverlay)) {

        publishOverlay.classList.add(
            "hidden"
        );
    }
}

if (exists(publishModelButton)) {

    publishModelButton.addEventListener(
        "click",
        openPublish
    );
}

if (exists(closePublish)) {

    closePublish.addEventListener(
        "click",
        closePublishOverlay
    );
}

if (exists(publishOverlay)) {

    publishOverlay.addEventListener(
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
}

/* =========================================================
   VALIDATE COMMUNITY JSON
   ========================================================= */

function validateCommunityJSON() {

    if (!exists(communityModelJSON)) {
        return null;
    }

    const raw =
        communityModelJSON.value.trim();

    if (!raw) {

        setJSONValidation(
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

        setJSONValidation(
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
        !model.id ||
        typeof model.id !==
        "string"
    ) {

        setJSONValidation(
            '❌ Model musi posiadać pole "id".',
            false
        );

        return null;
    }

    if (
        !model.name ||
        typeof model.name !==
        "string"
    ) {

        setJSONValidation(
            '❌ Model musi posiadać pole "name".',
            false
        );

        return null;
    }

    if (
        !Array.isArray(
            model.examples
        )
    ) {

        setJSONValidation(
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
            typeof example !==
            "object"
        ) {

            setJSONValidation(
                `❌ Błąd w examples[${i}].`,
                false
            );

            return null;
        }

        const questions =
            Array.isArray(
                example.questions
            )
                ? example.questions
                : typeof example.question ===
                  "string"
                    ? [example.question]
                    : [];

        if (
            questions.length === 0
        ) {

            setJSONValidation(
                `❌ examples[${i}] nie ma pytania.`,
                false
            );

            return null;
        }

        if (
            typeof example.answer !==
            "string"
        ) {

            setJSONValidation(
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
        exists(communityModelAuthor)
            ? communityModelAuthor.value.trim() ||
              "Community"
            : "Community";

    model.description =
        exists(communityModelDescription)
            ? communityModelDescription.value.trim() ||
              model.description ||
              "Community model for AI Club."
            : model.description ||
              "Community model for AI Club.";

    model.community = true;

    setJSONValidation(
        `✅ JSON poprawny. ${model.examples.length} wpisów.`,
        true
    );

    return model;
}

function setJSONValidation(
    text,
    success
) {

    if (!exists(jsonValidation)) {
        return;
    }

    jsonValidation.textContent =
        text;

    jsonValidation.className =
        success
            ? "json-validation success"
            : "json-validation error";
}

if (exists(communityModelJSON)) {

    communityModelJSON.addEventListener(
        "input",
        () => {

            if (
                communityModelJSON.value.trim()
            ) {

                validateCommunityJSON();
            }
        }
    );
}

/* =========================================================
   COMMUNITY SUBMIT
   ========================================================= */

if (exists(submitCommunityModel)) {

    submitCommunityModel.addEventListener(
        "click",
        () => {

            const model =
                validateCommunityJSON();

            if (!model) {
                return;
            }

            const name =
                exists(communityModelName)
                    ? communityModelName.value.trim()
                    : "";

            if (!name) {

                alert(
                    "Podaj nazwę modelu."
                );

                if (exists(communityModelName)) {
                    communityModelName.focus();
                }

                return;
            }

            const author =
                exists(communityModelAuthor)
                    ? communityModelAuthor.value.trim() ||
                      "Community"
                    : "Community";

            const description =
                exists(communityModelDescription)
                    ? communityModelDescription.value.trim() ||
                      model.description ||
                      ""
                    : model.description ||
                      "";

            model.name =
                name;

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
${JSON.stringify(
    model,
    null,
    2
)}
\`\`\`

---

### Moderacja

- [ ] JSON poprawny
- [ ] Model nie zawiera złośliwego kodu
- [ ] Model nie zawiera danych prywatnych
- [ ] Model nie zawiera spamu
- [ ] Model nadaje się do AI Club Community
`;

            const githubURL =
                `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/new` +
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
}

/* =========================================================
   START
   ========================================================= */

async function startAIClub() {

    console.log(
        "🐱 AI Club uruchomiony."
    );

    console.log(
        "[AI Club] URL strony:",
        location.href
    );

    console.log(
        "[AI Club] Base URL:",
        document.baseURI
    );

    /*
     * Ważne ostrzeżenie dla file://
     */

    if (
        location.protocol ===
        "file:"
    ) {

        console.warn(
            "⚠️ AI Club działa z file://. Fetch JSON może być blokowany przez przeglądarkę."
        );

        if (exists(modelsGrid)) {

            modelsGrid.innerHTML = `
                <div class="loading">
                    <span>
                        ⚠️ Uruchom AI Club przez localhost lub serwer WWW.
                    </span>
                </div>
            `;
        }

        return;
    }

    await loadModels();
}

/*
 * Ten zapis działa zarówno wtedy,
 * gdy skrypt jest w <head>,
 * jak i gdy jest na końcu <body>.
 */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startAIClub,
        {
            once: true
        }
    );

} else {

    startAIClub();
}
