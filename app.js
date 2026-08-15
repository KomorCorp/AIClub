"use strict";


/*
==================================================
 AI CLUB - OFFLINE ENGINE
==================================================

Ten plik:

- ładuje osobne JSON-y modeli
- nie korzysta z API
- nie posiada endpointów
- nie wysyła danych do internetu
- rozpoznaje literówki
- ignoruje wielkość liter
- ignoruje polskie znaki
- obsługuje pytania zapisane w JSON
- obsługuje punkty
*/


/*
==================================================
 KONFIGURACJA MODELI
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
 AI CLUB COMMUNITY
==================================================
*/

const COMMUNITY_INDEX =
    "community/index.json";

/*
 * ZMIEŃ NA SWÓJ GITHUB
 */

const GITHUB_OWNER =
    "KomorCorp";

const GITHUB_REPO =
    "AIClub";

/*
 * Nazwa brancha używana tylko
 * jako informacja w zgłoszeniu.
 */

const GITHUB_BRANCH =
    "main";


let communityModels = [];


/*
==================================================
 STAN
==================================================
*/

let models = [];

let selectedModel = null;

let points =
    Number(
        localStorage.getItem(
            "aiClubPoints"
        )
    ) || 100;


/*
==================================================
 ELEMENTY DOM
==================================================
*/

const modelsGrid =
    document.getElementById(
        "modelsGrid"
    );

const modelCount =
    document.getElementById(
        "modelCount"
    );

const heroModelCount =
    document.getElementById(
        "heroModelCount"
    );

const pointsElement =
    document.getElementById(
        "points"
    );

const overlay =
    document.getElementById(
        "chatOverlay"
    );

const closeChat =
    document.getElementById(
        "closeChat"
    );

const messages =
    document.getElementById(
        "messages"
    );

const examples =
    document.getElementById(
        "examples"
    );

const messageInput =
    document.getElementById(
        "messageInput"
    );

const sendButton =
    document.getElementById(
        "sendButton"
    );

const chatModelName =
    document.getElementById(
        "chatModelName"
    );

const chatModelProvider =
    document.getElementById(
        "chatModelProvider"
    );

const chatModelIcon =
    document.getElementById(
        "chatModelIcon"
    );




const PREMIUM_PRICE = 100;


let premium = localStorage.getItem("aiClubPremium") === "true";

const buyPremiumBtn = document.getElementById("buyPremiumBtn");
const premiumStatus = document.getElementById("premiumStatus");

function updatePremiumUI() {

    if (premium) {

        premiumStatus.textContent = "Aktywne ⭐";

        buyPremiumBtn.textContent = "Premium aktywne";
        buyPremiumBtn.disabled = true;

    } else {

        premiumStatus.textContent =
            `Zablokowane — ${PREMIUM_PRICE} pkt`;

        buyPremiumBtn.textContent =
            `Kup za ${PREMIUM_PRICE} pkt`;

        buyPremiumBtn.disabled = points < PREMIUM_PRICE;
    }
}

buyPremiumBtn.addEventListener("click", () => {

    if (premium) return;

    if (points < PREMIUM_PRICE) {
        alert(
            `Potrzebujesz ${PREMIUM_PRICE} pkt, aby kupić Premium.`
        );
        return;
    }

    const confirmed = confirm(
        "Kupić AI Club Premium za 100 pkt?"
    );

    if (!confirmed) return;

    points -= PREMIUM_PRICE;

    premium = true;

    localStorage.setItem(
        "aiClubPoints",
        points
    );

    localStorage.setItem(
        "aiClubPremium",
        "true"
    );

    updatePointsUI();
    updatePremiumUI();

    alert("⭐ AI Club Premium zostało odblokowane!");
});


const DAILY_REWARD = 200;

const dailyBtn = document.getElementById("dailyBtn");
const dailyStatus = document.getElementById("dailyStatus");

function getToday() {
    const now = new Date();

    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("-");
}

function updateDailyUI() {

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
        dailyBtn.textContent = "Odbierz 200 pkt";

        dailyStatus.textContent =
            "+200 pkt dziennie";
    }
}

dailyBtn.addEventListener("click", () => {

    const today = getToday();

    const lastClaim =
        localStorage.getItem("aiClubDaily");

    // zabezpieczenie przed ponownym odebraniem
    if (lastClaim === today) {
        return;
    }

    points += DAILY_REWARD;

    localStorage.setItem(
        "aiClubPoints",
        points
    );

    localStorage.setItem(
        "aiClubDaily",
        today
    );

    updatePointsUI();
    updateDailyUI();

    alert("🎁 Otrzymujesz 200 punktów!");
});

updateDailyUI();

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

    pointsElement.textContent =
        points;
}


savePoints();


function updatePointsUI() {

    localStorage.setItem(
        "aiClubPoints",
        String(points)
    );

    pointsElement.textContent = points;

    updatePremiumUI();
}

updatePointsUI()



/*
==================================================
 ŁADOWANIE COMMUNITY MODELS
==================================================
*/

async function loadCommunityModels() {

    try {

        const response =
            await fetch(
                COMMUNITY_INDEX + "?v=" + Date.now()
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const registry =
            await response.json();

        if (
            !registry.models ||
            !Array.isArray(
                registry.models
            )
        ) {

            throw new Error(
                "Niepoprawny community/index.json"
            );

        }

        const loaded = [];


        for (
            const entry
            of registry.models
        ) {

            try {

                if (!entry.file) {
                    continue;
                }


                const response =
                    await fetch(
                        "community/" +
                        encodeURIComponent(
                            entry.file
                        ) +
                        "?v=" +
                        Date.now()
                    );


                if (!response.ok) {

                    console.warn(
                        "Nie znaleziono community modelu:",
                        entry.file
                    );

                    continue;

                }


                const model =
                    await response.json();


                if (
                    !model.id ||
                    !model.name
                ) {

                    console.warn(
                        "Niepoprawny model:",
                        entry.file
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


                /*
                 * Informacja dla UI,
                 * że jest to model Community.
                 */

                model.community = true;

                model.author =
                    model.author ||
                    entry.author ||
                    "Community";


                model.version =
                    model.version ||
                    entry.version ||
                    "1.0";


                loaded.push(
                    model
                );


            } catch (error) {

                console.error(
                    `Błąd modelu ${entry.file}:`,
                    error
                );

            }

        }


        communityModels =
            loaded;


        /*
         * NIE usuwamy modeli Official.
         */

        models = [
            ...models.filter(
                model =>
                    !model.community
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
 ŁADOWANIE MODELI
==================================================
*/

async function loadModels() {

    modelsGrid.innerHTML = `

        <div class="loading">

            <div class="spinner"></div>

            <span>
                Ładowanie modeli...
            </span>

        </div>

    `;


    try {

        const loaded = [];


        for (
            const file
            of modelFiles
        ) {

            try {

                const response =
                    await fetch(
                        `models/${encodeURIComponent(file)}`
                    );


                if (!response.ok) {

                    console.warn(
                        `Nie znaleziono modelu: ${file}`
                    );

                    continue;
                }


                const model =
                    await response.json();


                /*
                    Podstawowa walidacja.
                */

                if (
                    !model.id ||
                    !model.name
                ) {

                    console.warn(
                        `Niepoprawny JSON: ${file}`
                    );

                    continue;
                }


                /*
                    Brak examples
                    nie powoduje crasha.
                */

                if (
                    !Array.isArray(
                        model.examples
                    )
                ) {

                    model.examples = [];

                }


                loaded.push(model);

            } catch (error) {

                console.error(
                    `Błąd ${file}:`,
                    error
                );

            }
        }


        models = loaded;


        renderModels();


    } catch (error) {

        console.error(error);


        modelsGrid.innerHTML = `

            <div class="loading">

                ❌ Nie udało się załadować modeli.

            </div>

        `;

    }

}


/*
==================================================
 COMMUNITY PUBLISH SYSTEM
==================================================
*/

const publishOverlay =
    document.getElementById(
        "publishOverlay"
    );

const publishModelButton =
    document.getElementById(
        "publishModelButton"
    );

const closePublish =
    document.getElementById(
        "closePublish"
    );

const submitCommunityModel =
    document.getElementById(
        "submitCommunityModel"
    );

const communityModelName =
    document.getElementById(
        "communityModelName"
    );

const communityModelAuthor =
    document.getElementById(
        "communityModelAuthor"
    );

const communityModelDescription =
    document.getElementById(
        "communityModelDescription"
    );

const communityModelJSON =
    document.getElementById(
        "communityModelJSON"
    );

const jsonValidation =
    document.getElementById(
        "jsonValidation"
    );


/*
==================================================
 OTWIERANIE
==================================================
*/

publishModelButton.addEventListener(
    "click",
    () => {

        publishOverlay.classList.remove(
            "hidden"
        );

        communityModelName.focus();

    }
);


/*
==================================================
 ZAMYKANIE
==================================================
*/

closePublish.addEventListener(
    "click",
    () => {

        publishOverlay.classList.add(
            "hidden"
        );

    }
);


publishOverlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            publishOverlay
        ) {

            publishOverlay.classList.add(
                "hidden"
            );

        }

    }
);


/*
==================================================
 WALIDACJA JSON
==================================================
*/

function validateCommunityJSON() {

    const raw =
        communityModelJSON.value.trim();


    if (!raw) {

        jsonValidation.textContent =
            "❌ Wklej JSON modelu.";

        jsonValidation.className =
            "json-validation error";

        return null;

    }


    let model;


    try {

        model =
            JSON.parse(raw);

    } catch (error) {

        jsonValidation.textContent =
            "❌ JSON jest niepoprawny.";

        jsonValidation.className =
            "json-validation error";

        return null;

    }


    if (
        !model.id ||
        typeof model.id !== "string"
    ) {

        jsonValidation.textContent =
            "❌ Model musi posiadać pole \"id\".";

        jsonValidation.className =
            "json-validation error";

        return null;

    }


    if (
        !model.name ||
        typeof model.name !== "string"
    ) {

        jsonValidation.textContent =
            "❌ Model musi posiadać pole \"name\".";

        jsonValidation.className =
            "json-validation error";

        return null;

    }


    if (
        !Array.isArray(
            model.examples
        )
    ) {

        jsonValidation.textContent =
            "❌ Pole \"examples\" musi być tablicą.";

        jsonValidation.className =
            "json-validation error";

        return null;

    }


    /*
     * Sprawdzamy każde pytanie.
     */

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

            jsonValidation.textContent =
                `❌ Błąd w examples[${i}].`;

            jsonValidation.className =
                "json-validation error";

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

            jsonValidation.textContent =
                `❌ examples[${i}] nie ma pytania.`;

            jsonValidation.className =
                "json-validation error";

            return null;

        }


        if (
            typeof example.answer !==
            "string"
        ) {

            jsonValidation.textContent =
                `❌ examples[${i}] nie ma odpowiedzi.`;

            jsonValidation.className =
                "json-validation error";

            return null;

        }

    }


    /*
     * Nadpisujemy kilka pól,
     * żeby Community miało spójny format.
     */

    model.provider =
        "AI Club Community";

    model.type =
        "community";

    model.author =
        communityModelAuthor.value.trim() ||
        "Community";

    model.description =
        communityModelDescription.value.trim() ||
        model.description ||
        "Community model for AI Club.";

    model.community =
        true;


    jsonValidation.textContent =
        `✅ JSON poprawny. ${model.examples.length} wpisów.`;

    jsonValidation.className =
        "json-validation success";


    return model;

}


/*
==================================================
 LIVE VALIDATION
==================================================
*/

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


/*
==================================================
 GITHUB ISSUE
==================================================
*/

submitCommunityModel.addEventListener(
    "click",
    () => {

        const model =
            validateCommunityJSON();


        if (!model) {
            return;
        }


        const name =
            communityModelName.value.trim();


        const author =
            communityModelAuthor.value.trim() ||
            "Community";


        const description =
            communityModelDescription.value.trim() ||
            model.description ||
            "";


        if (!name) {

            alert(
                "Podaj nazwę modelu."
            );

            communityModelName.focus();

            return;

        }


        /*
         * Ustawiamy nazwę modelu
         * z formularza.
         */

        model.name =
            name;


        /*
         * Tworzymy czytelne zgłoszenie.
         */

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

**AI Club Community submission**
`;


        const githubURL =
            `https://github.com/${encodeURIComponent(
                GITHUB_OWNER
            )}/${encodeURIComponent(
                GITHUB_REPO
            )}/issues/new?title=${encodeURIComponent(
                issueTitle
            )}&body=${encodeURIComponent(
                issueBody
            )}`;


        window.open(
            githubURL,
            "_blank",
            "noopener,noreferrer"
        );

    }
);


/*
==================================================
 RENDER MODELI
==================================================
*/

function renderModels() {

    modelsGrid.innerHTML = "";


    modelCount.textContent =
        `${models.length} modeli`;


    heroModelCount.textContent =
        models.length;


    if (
        models.length === 0
    ) {

        modelsGrid.innerHTML = `

            <div class="loading">

                <span>
                    Brak modeli.
                </span>

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

    ${
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
              `
    }

</div>

${
    model.community
        ? `
            <div class="model-author">
                👤 ${escapeHTML(
                    model.author || "Community"
                )}
            </div>
          `
        : ""
}

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
                    data-model-id="${escapeHTML(
                        model.id
                    )}"
                >
                    Użyj →
                </button>

            </div>

        `;


        modelsGrid.appendChild(
            card
        );

    }


    document
        .querySelectorAll(
            ".use-button"
        )
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

                        openChat(
                            model
                        );

                    }

                }
            );

        });

}

/*
==================================================
 COMMUNITY MODELS
==================================================
*/

const COMMUNITY_INDEX =
    "community/index.json";

let communityModels = [];


async function loadCommunityModels() {

    try {

        const response =
            await fetch(
                COMMUNITY_INDEX
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }

        const registry =
            await response.json();

        if (
            !registry.models ||
            !Array.isArray(
                registry.models
            )
        ) {

            throw new Error(
                "Niepoprawny community/index.json"
            );

        }


        const loaded = [];


        for (
            const entry
            of registry.models
        ) {

            try {

                if (!entry.file) {
                    continue;
                }


                const response =
                    await fetch(
                        `community/${encodeURIComponent(entry.file)}`
                    );


                if (!response.ok) {

                    console.warn(
                        `Nie znaleziono community modelu: ${entry.file}`
                    );

                    continue;
                }


                const model =
                    await response.json();


                if (
                    !model.id ||
                    !model.name
                ) {

                    console.warn(
                        `Niepoprawny model: ${entry.file}`
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


                loaded.push(
                    model
                );


            } catch (error) {

                console.error(
                    `Błąd community modelu ${entry.file}:`,
                    error
                );

            }

        }


        communityModels =
            loaded;


        /*
            Dodajemy modele społeczności
            do głównej listy.
        */

        models = [
            ...models,
            ...communityModels
        ];


        renderModels();


        console.log(
            `Załadowano ${communityModels.length} modeli Community.`
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
 OTWIERANIE CHATU
==================================================
*/

function openChat(model) {

    selectedModel =
        model;


    chatModelName.textContent =
        model.name;


    chatModelProvider.textContent =
        `${model.provider || "AI Club Local"} · OFFLINE`;


    chatModelIcon.textContent =
        "✦";


    messages.innerHTML = "";


    addMessage(
        "system",
        `Rozpoczęto rozmowę z ${model.name}.`
    );


    renderExamples(
        model
    );


    overlay.classList.remove(
        "hidden"
    );


    messageInput.value =
        "";


    messageInput.focus();

}


/*
==================================================
 PRZYKŁADOWE PYTANIA
==================================================

Kliknięcie pytania tylko wpisuje je
do pola tekstowego.
Nie wysyła go automatycznie.
*/

function renderExamples(model) {

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

        /*
            Nowy format:

            {
                questions: [],
                answer: ""
            }

            Obsługujemy też starszy:

            {
                question: "",
                answer: ""
            }
        */

        let question;


        if (
            Array.isArray(
                example.questions
            )
        ) {

            question =
                example.questions[0];

        } else {

            question =
                example.question;

        }


        if (!question)
            continue;


        const button =
            document.createElement(
                "button"
            );


        button.className =
            "example-question";


        button.textContent =
            question;


        button.addEventListener(
            "click",
            () => {

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


/*
==================================================
 WYSYŁANIE
==================================================
*/

async function sendMessage() {

    if (!selectedModel)
        return;


    const text =
        messageInput.value.trim();


    if (!text)
        return;


    /*
        Wyświetl pytanie.
    */

    addMessage(
        "user",
        text
    );


    messageInput.value =
        "";


    /*
        Koszt wiadomości.
    */

    const cost =
        Number(
            selectedModel.points_per_message
        ) || 1;


    if (
        points < cost
    ) {

        addMessage(
            "system",
            `Brakuje punktów. Ta wiadomość kosztuje ${cost} ⭐.`
        );

        return;

    }


    points -= cost;

    savePoints();


    /*
        SZUKAMY ODPOWIEDZI WYŁĄCZNIE
        W LOKALNYM JSON.
    */

    const answer =
        findLocalAnswer(
            text,
            selectedModel
        );


    /*
        Małe opóźnienie,
        żeby odpowiedź nie pojawiała
        się nienaturalnie natychmiast.
    */

    await sleep(250);


    if (answer) {

        addMessage(
            "ai",
            answer
        );

    } else {

        addMessage(
            "ai",
            getUnknownAnswer(
                text
            )
        );

    }

}


/*
==================================================
 SZUKANIE ODPOWIEDZI
==================================================
*/

function findLocalAnswer(
    input,
    model
) {

    if (
        !Array.isArray(
            model.examples
        )
    ) {

        return null;

    }


    const normalizedInput =
        normalizeText(
            input
        );


    let bestAnswer =
        null;

    let bestScore =
        0;


    for (
        const example
        of model.examples
    ) {

        let questions = [];


        /*
            Nowy format.
        */

        if (
            Array.isArray(
                example.questions
            )
        ) {

            questions =
                example.questions;

        }


        /*
            Stary format.
        */

        else if (
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

            if (!question)
                continue;


            const normalizedQuestion =
                normalizeText(
                    question
                );


            /*
                Dokładne dopasowanie.
            */

            if (
                normalizedInput ===
                normalizedQuestion
            ) {

                return example.answer;

            }


            /*
                Podobieństwo.
            */

            const score =
                getSimilarity(
                    normalizedInput,
                    normalizedQuestion
                );


            if (
                score >
                bestScore
            ) {

                bestScore =
                    score;

                bestAnswer =
                    example.answer;

            }

        }

    }


    /*
        Próg rozpoznania.

        1.00 = identyczne
        0.90 = prawie identyczne
        0.75 = dość podobne
    */

    if (
        bestScore >= 0.72
    ) {

        return bestAnswer;

    }


    /*
        Nie znaleziono
        odpowiedzi.
    */

    return null;

}


/*
==================================================
 NORMALIZACJA
==================================================
*/

function normalizeText(text) {

    return String(text)

        .toLowerCase()

        /*
            Usunięcie akcentów.
        */

        .normalize("NFD")

        .replace(
            /[\u0300-\u036f]/g,
            ""
        )

        /*
            Polskie znaki.
        */

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

        /*
            Usuwanie interpunkcji.
        */

        .replace(
            /[^\p{L}\p{N}\s]/gu,
            ""
        )

        /*
            Wielokrotne spacje.
        */

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

function getSimilarity(
    a,
    b
) {

    if (
        a === b
    ) {

        return 1;

    }


    if (
        !a ||
        !b
    ) {

        return 0;

    }


    /*
        Jeżeli jedno pytanie zawiera
        drugie, traktujemy je jako
        mocne dopasowanie.
    */

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
        levenshtein(
            a,
            b
        );


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


/*
==================================================
 LEVENSHTEIN
==================================================
*/

function levenshtein(
    a,
    b
) {

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

        matrix[0][j] =
            j;

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
                    matrix[
                        i - 1
                    ][
                        j - 1
                    ];

            } else {

                matrix[i][j] =
                    Math.min(

                        matrix[
                            i - 1
                        ][j] + 1,

                        matrix[i][
                            j - 1
                        ] + 1,

                        matrix[
                            i - 1
                        ][
                            j - 1
                        ] + 1

                    );

            }

        }

    }


    return matrix[
        b.length
    ][
        a.length
    ];

}


/*
==================================================
 ODPOWIEDŹ GDY BRAK WIEDZY
==================================================
*/

function getUnknownAnswer(
    text
) {

    const responses = [

        `Nie mam jeszcze odpowiedzi na „${text}”. 🤔`,

        `Tego nie mam jeszcze w mojej lokalnej bazie wiedzy.`,

        `Nie znalazłem wystarczająco podobnego pytania w moim JSON-ie.`,

        `Hmm... tego pytania jeszcze mnie nie nauczono. 😺`

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
 DODAWANIE WIADOMOŚCI
==================================================
*/

function addMessage(
    type,
    text
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        `message ${type}-message`;


    /*
        textContent zamiast innerHTML
        = bezpieczne wyświetlanie.
    */

    element.textContent =
        text;


    messages.appendChild(
        element
    );


    messages.scrollTop =
        messages.scrollHeight;


    return element;

}


/*
==================================================
 ENTER = SEND
 SHIFT + ENTER = NEW LINE
==================================================
*/

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


sendButton.addEventListener(
    "click",
    sendMessage
);


/*
==================================================
 ZAMYKANIE
==================================================
*/

closeChat.addEventListener(
    "click",
    () => {

        overlay.classList.add(
            "hidden"
        );

        selectedModel =
            null;

    }
);


overlay.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            overlay
        ) {

            overlay.classList.add(
                "hidden"
            );

            selectedModel =
                null;

        }

    }
);


/*
==================================================
 ESC
==================================================
*/

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            overlay.classList.add(
                "hidden"
            );

            selectedModel =
                null;

        }

    }
);


/*
==================================================
 SLEEP
==================================================
*/

function sleep(
    ms
) {

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
 ESCAPE HTML
==================================================
*/

function escapeHTML(
    value
) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


/*
==================================================
 START
==================================================
*/

loadModels();
loadCommunityModels();
