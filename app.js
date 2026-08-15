"use strict";

/*
==================================================
 AI CLUB - OFFLINE ENGINE
==================================================
*/

document.addEventListener("DOMContentLoaded", () => {

    /*
    ==================================================
    KONFIGURACJA
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

    const COMMUNITY_INDEX = "community/index.json";

    const GITHUB_OWNER = "KomorCorp";
    const GITHUB_REPO = "AIClub";
    const GITHUB_BRANCH = "main";

    const PREMIUM_PRICE = 100;
    const DAILY_REWARD = 200;

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
    const communityModelDescription = $("communityModelDescription");
    const communityModelJSON = $("communityModelJSON");
    const jsonValidation = $("jsonValidation");

    /*
    ==================================================
    POMOCNICZE
    ==================================================
    */

    function exists(element) {
        return element !== null && element !== undefined;
    }

    function showOverlay(element) {
        if (!exists(element)) return;

        element.classList.remove("hidden");
    }

    function hideOverlay(element) {
        if (!exists(element)) return;

        element.classList.add("hidden");
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

        updatePointsUI();
    }

    function updatePointsUI() {

        if (exists(pointsElement)) {
            pointsElement.textContent =
                points.toLocaleString("pl-PL");
        }

        updatePremiumUI();
    }

    /*
    ==================================================
    PREMIUM
    ==================================================
    */

    function updatePremiumUI() {

        if (!exists(premiumStatus) ||
            !exists(buyPremiumBtn)) {
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

    if (exists(buyPremiumBtn)) {

        buyPremiumBtn.addEventListener(
            "click",
            () => {

                if (premium) return;

                if (points < PREMIUM_PRICE) {

                    alert(
                        `Potrzebujesz ${PREMIUM_PRICE} pkt.`
                    );

                    return;
                }

                if (!confirm(
                    `Kupić AI Club Premium za ${PREMIUM_PRICE} pkt?`
                )) {
                    return;
                }

                points -= PREMIUM_PRICE;

                premium = true;

                localStorage.setItem(
                    "aiClubPremium",
                    "true"
                );

                savePoints();

                updatePremiumUI();

                alert(
                    "⭐ AI Club Premium zostało odblokowane!"
                );
            }
        );
    }

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

        if (!exists(dailyBtn) ||
            !exists(dailyStatus)) {
            return;
        }

        const today = getToday();

        const lastClaim =
            localStorage.getItem("aiClubDaily");

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

                const today = getToday();

                const lastClaim =
                    localStorage.getItem("aiClubDaily");

                if (lastClaim === today) {
                    return;
                }

                points += DAILY_REWARD;

                localStorage.setItem(
                    "aiClubDaily",
                    today
                );

                savePoints();

                updateDailyUI();

                alert(
                    "🎁 Otrzymujesz 200 punktów!"
                );
            }
        );
    }

    /*
    ==================================================
    ŁADOWANIE OFFICIAL MODELS
    ==================================================
    */

    async function loadModels() {

        if (exists(modelsGrid)) {

            modelsGrid.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <span>Ładowanie modeli...</span>
                </div>
            `;
        }

        const loaded = [];

        await Promise.all(
            modelFiles.map(
                async file => {

                    try {

                        const response =
                            await fetch(
                                `models/${encodeURIComponent(file)}?v=${Date.now()}`
                            );

                        if (!response.ok) {

                            console.warn(
                                `Nie znaleziono modelu: ${file}`
                            );

                            return;
                        }

                        const model =
                            await response.json();

                        if (
                            !model ||
                            !model.id ||
                            !model.name
                        ) {

                            console.warn(
                                `Niepoprawny JSON: ${file}`
                            );

                            return;
                        }

                        if (
                            !Array.isArray(
                                model.examples
                            )
                        ) {
                            model.examples = [];
                        }

                        model.community = false;

                        loaded.push(model);

                    } catch (error) {

                        console.error(
                            `Błąd ${file}:`,
                            error
                        );
                    }
                }
            )
        );

        models = loaded;

        renderModels();
    }

    /*
    ==================================================
    COMMUNITY INDEX
    ==================================================
    */

    async function loadCommunityModels() {

        try {

            const response =
                await fetch(
                    `${COMMUNITY_INDEX}?v=${Date.now()}`
                );

            if (!response.ok) {

                console.warn(
                    `Community index HTTP ${response.status}`
                );

                return;
            }

            const registry =
                await response.json();

            if (
                !registry ||
                !Array.isArray(registry.models)
            ) {

                console.warn(
                    "community/index.json nie posiada tablicy models."
                );

                return;
            }

            const loaded = [];

            await Promise.all(
                registry.models.map(
                    async entry => {

                        try {

                            if (
                                !entry ||
                                !entry.file
                            ) {
                                return;
                            }

                            const safeFile =
                                String(entry.file)
                                    .replace(/^\/+/, "")
                                    .replace(/^community\//, "");

                            const response =
                                await fetch(
                                    `community/${safeFile}?v=${Date.now()}`
                                );

                            if (!response.ok) {

                                console.warn(
                                    `Nie znaleziono community modelu: ${safeFile}`
                                );

                                return;
                            }

                            const model =
                                await response.json();

                            if (
                                !model ||
                                !model.id ||
                                !model.name
                            ) {

                                console.warn(
                                    `Niepoprawny community model: ${safeFile}`
                                );

                                return;
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

                            loaded.push(model);

                        } catch (error) {

                            console.error(
                                `Błąd community modelu ${entry?.file}:`,
                                error
                            );
                        }
                    }
                )
            );

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

            console.warn(
                "Community Models niedostępne:",
                error
            );
        }
    }

    /*
    ==================================================
    RENDER MODELI
    ==================================================
    */

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

        for (const model of models) {

            const card =
                document.createElement("article");

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
                                model.author || "Community"
                            )}
                        </div>
                    `
                    : "";

            card.innerHTML = `

                <div class="model-icon">
                    ${model.community ? "🌐" : "✦"}
                </div>

                <h3>
                    ${escapeHTML(model.name)}
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
                        ).toLocaleString("pl-PL")}
                        tokens
                    </div>

                    <button
                        class="use-button"
                        type="button"
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
                                    String(item.id) ===
                                    String(
                                        button.dataset.modelId
                                    )
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
    COMMUNITY FILTER / BUTTON
    ==================================================
    */

    function showCommunityModels() {

        if (!exists(modelsGrid)) {
            return;
        }

        if (communityModels.length === 0) {

            modelsGrid.innerHTML = `
                <div class="loading">
                    <span>Brak modeli Community.</span>
                </div>
            `;

            return;
        }

        modelsGrid.innerHTML = "";

        for (const model of communityModels) {

            const card =
                document.createElement("article");

            card.className =
                "model-card";

            card.innerHTML = `

                <div class="model-icon">
                    🌐
                </div>

                <h3>
                    ${escapeHTML(model.name)}
                </h3>

                <div class="provider">

                    ${escapeHTML(
                        model.provider ||
                        "AI Club Community"
                    )}

                    <span class="community-badge">
                        COMMUNITY
                    </span>

                </div>

                <div class="model-author">
                    👤 ${escapeHTML(
                        model.author || "Community"
                    )}
                </div>

                <p class="description">
                    ${escapeHTML(
                        model.description ||
                        "Community model."
                    )}
                </p>

                <div class="model-footer">

                    <div class="model-info">
                        ${escapeHTML(
                            model.version || "1.0"
                        )}
                    </div>

                    <button
                        class="use-button"
                        type="button"
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
                            communityModels.find(
                                item =>
                                    String(item.id) ===
                                    String(
                                        button.dataset.modelId
                                    )
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
    COMMUNITY MODELS BUTTON
    ==================================================
    */

    const communityButtons = [
        $("communityModelsButton"),
        $("communityButton"),
        $("showCommunityModels")
    ];

    communityButtons
        .filter(Boolean)
        .forEach(button => {

            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    showCommunityModels();

                    if (exists(modelsGrid)) {

                        modelsGrid.scrollIntoView({
                            behavior: "smooth",
                            block: "start"
                        });
                    }
                }
            );
        });

    /*
    ==================================================
    OPEN CHAT
    ==================================================
    */

    function openChat(model) {

        selectedModel = model;

        if (exists(chatModelName)) {

            chatModelName.textContent =
                model.name;
        }

        if (exists(chatModelProvider)) {

            chatModelProvider.textContent =
                `${model.provider || "AI Club Local"} · OFFLINE`;
        }

        if (exists(chatModelIcon)) {

            chatModelIcon.textContent =
                model.community ? "🌐" : "✦";
        }

        if (exists(messages)) {

            messages.innerHTML = "";

            addMessage(
                "system",
                `Rozpoczęto rozmowę z ${model.name}.`
            );
        }

        renderExamples(model);

        showOverlay(overlay);

        if (exists(messageInput)) {

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

        if (!exists(examples)) {
            return;
        }

        examples.innerHTML = "";

        if (
            !model.examples ||
            model.examples.length === 0
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
                example.question
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

                    if (!exists(messageInput)) {
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

        if (!selectedModel ||
            !exists(messageInput)) {
            return;
        }

        const text =
            messageInput.value.trim();

        if (!text) {
            return;
        }

        addMessage(
            "user",
            text
        );

        messageInput.value = "";

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

        points -= cost;

        savePoints();

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

            let questions = [];

            if (
                Array.isArray(
                    example.questions
                )
            ) {

                questions =
                    example.questions;

            } else if (
                example.question
            ) {

                questions = [
                    example.question
                ];
            }

            for (
                const question
                of questions
            ) {

                if (!question) {
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

                if (score > bestScore) {

                    bestScore = score;

                    bestAnswer =
                        example.answer;
                }
            }
        }

        if (bestScore >= 0.72) {
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
            1 - distance / maxLength
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
                Math.random() * responses.length
            )
        ];
    }

    /*
    ==================================================
    ADD MESSAGE
    ==================================================
    */

    function addMessage(type, text) {

        if (!exists(messages)) {
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
    CHAT EVENTS
    ==================================================
    */

    if (exists(sendButton)) {

        sendButton.addEventListener(
            "click",
            sendMessage
        );
    }

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

    if (exists(closeChat)) {

        closeChat.addEventListener(
            "click",
            () => {

                hideOverlay(overlay);

                selectedModel = null;
            }
        );
    }

    if (exists(overlay)) {

        overlay.addEventListener(
            "click",
            event => {

                if (
                    event.target === overlay
                ) {

                    hideOverlay(overlay);

                    selectedModel = null;
                }
            }
        );
    }

    /*
    ==================================================
    PUBLISH COMMUNITY MODEL
    ==================================================
    */

    if (exists(publishModelButton)) {

        publishModelButton.addEventListener(
            "click",
            event => {

                event.preventDefault();

                showOverlay(
                    publishOverlay
                );

                if (exists(communityModelName)) {

                    setTimeout(
                        () =>
                            communityModelName.focus(),
                        50
                    );
                }
            }
        );
    }

    if (exists(closePublish)) {

        closePublish.addEventListener(
            "click",
            () => {

                hideOverlay(
                    publishOverlay
                );
            }
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

                    hideOverlay(
                        publishOverlay
                    );
                }
            }
        );
    }

    /*
    ==================================================
    VALIDATE COMMUNITY JSON
    ==================================================
    */

    function validateCommunityJSON() {

        if (!exists(communityModelJSON)) {
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
                "❌ JSON jest niepoprawny. Sprawdź cudzysłowy i znaki nowej linii.",
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
            typeof model.id !== "string"
        ) {

            setValidation(
                '❌ Model musi posiadać pole "id".',
                false
            );

            return null;
        }

        if (
            !model.name ||
            typeof model.name !== "string"
        ) {

            setValidation(
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
                Array.isArray(
                    example.questions
                )
                    ? example.questions
                    : example.question
                        ? [example.question]
                        : [];

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
                typeof example.answer !==
                "string"
            ) {

                setValidation(
                    `❌ examples[${i}] nie ma odpowiedzi.`,
                    false
                );

                return null;
            }

            for (
                const question
                of questions
            ) {

                if (
                    typeof question !== "string"
                ) {

                    setValidation(
                        `❌ examples[${i}] zawiera niepoprawne pytanie.`,
                        false
                    );

                    return null;
                }
            }
        }

        model.provider =
            "AI Club Community";

        model.type =
            "community";

        model.author =
            exists(communityModelAuthor)
                ? (
                    communityModelAuthor.value.trim() ||
                    "Community"
                )
                : "Community";

        model.description =
            exists(communityModelDescription)
                ? (
                    communityModelDescription.value.trim() ||
                    model.description ||
                    "Community model for AI Club."
                )
                : (
                    model.description ||
                    "Community model for AI Club."
                );

        model.community = true;

        setValidation(
            `✅ JSON poprawny. ${model.examples.length} wpisów.`,
            true
        );

        return model;
    }

    function setValidation(text, success) {

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

    /*
    ==================================================
    PUBLISH -> GITHUB ISSUE
    ==================================================
    */

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
                        ? (
                            communityModelAuthor.value.trim() ||
                            "Community"
                        )
                        : "Community";

                const description =
                    exists(communityModelDescription)
                        ? (
                            communityModelDescription.value.trim() ||
                            model.description ||
                            ""
                        )
                        : (
                            model.description ||
                            ""
                        );

                model.name = name;

                model.author = author;

                model.description =
                    description;

                const issueTitle =
                    `[Community Model] ${name}`;

                const issueBody =
`# 🌐 AI Club Community Model

## Informacje

**Model:** ${name}

**Autor:** ${author}

**Opis:**

${description}

## Wersja

Community submission

## JSON

\`\`\`json
${JSON.stringify(model, null, 2)}
\`\`\`

---

## Moderacja

- [ ] JSON poprawny
- [ ] Model nie zawiera złośliwego kodu
- [ ] Model nie zawiera danych prywatnych
- [ ] Model nie zawiera spamu
- [ ] Model nadaje się do AI Club Community

**AI Club Community submission**
`;

                const githubURL =
                    `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/new` +
                    `?title=${encodeURIComponent(issueTitle)}` +
                    `&body=${encodeURIComponent(issueBody)}`;

                window.open(
                    githubURL,
                    "_blank",
                    "noopener,noreferrer"
                );
            }
        );
    }

    /*
    ==================================================
    ESC
    ==================================================
    */

    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key !== "Escape"
            ) {
                return;
            }

            hideOverlay(overlay);
            hideOverlay(publishOverlay);

            selectedModel = null;
        }
    );

    /*
    ==================================================
    ESCAPE HTML
    ==================================================
    */

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
    SLEEP
    ==================================================
    */

    function sleep(ms) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    ms
                )
        );
    }

    /*
    ==================================================
    START
    ==================================================
    */

    updatePointsUI();
    updateDailyUI();

    /*
     * Najpierw official.
     * Potem community.
     *
     * Dzięki temu nawet jeśli community
     * nie istnieje, oficjalne modele nadal
     * działają.
     */

    loadModels()
        .then(
            () => loadCommunityModels()
        )
        .catch(
            error => {

                console.error(
                    "Błąd startu AI Club:",
                    error
                );

                if (exists(modelsGrid)) {

                    modelsGrid.innerHTML = `
                        <div class="loading">
                            ❌ Nie udało się załadować modeli.
                        </div>
                    `;
                }
            }
        );

});
