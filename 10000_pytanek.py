import json
import random

# ============================================================
# KOMORAI MODEL GENERATOR
# ============================================================

print("=" * 60)
print("          KOMORAI MODEL GENERATOR")
print("=" * 60)
print()

# ============================================================
# INPUT
# ============================================================

model_name = input(
    "Nazwa modelu [KomorAI 2.3 Infinity]: "
).strip()

if not model_name:
    model_name = "KomorAI 2.3 Infinity"


model_id = input(
    "ID modelu [komorai-2.3-infinity]: "
).strip()

if not model_id:
    model_id = "komorai-2.3-infinity"


provider = input(
    "Provider [Komor]: "
).strip()

if not provider:
    provider = "Komor"


description = input(
    "Opis modelu [Nasz najbardziej zaawansowany model językowy.]: "
).strip()

if not description:
    description = "Nasz najbardziej zaawansowany model językowy."


entries_input = input(
    "Liczba wpisów Q&A [500000]: "
).strip()

if entries_input:
    try:
        entries = int(entries_input)
    except ValueError:
        print("Nieprawidłowa liczba. Używam 500000.")
        entries = 500000
else:
    entries = 500000


context_input = input(
    "Context [12000000]: "
).strip()

if context_input:
    try:
        context = int(context_input)
    except ValueError:
        print("Nieprawidłowy context. Używam 12000000.")
        context = 12000000
else:
    context = 12000000


points_input = input(
    "Points per message [7]: "
).strip()

if points_input:
    try:
        points = int(points_input)
    except ValueError:
        print("Nieprawidłowa liczba. Używam 7.")
        points = 7
else:
    points = 7


premium_input = input(
    "Premium? [T/n]: "
).strip().lower()

premium = premium_input not in ["n", "nie", "no", "0"]


meow_input = input(
    "Meow mode? [n/T]: "
).strip().lower()

meow_mode = meow_input in ["t", "tak", "y", "yes", "1"]


seed_input = input(
    "Seed [2026]: "
).strip()

if seed_input:
    try:
        seed = int(seed_input)
    except ValueError:
        print("Nieprawidłowy seed. Używam 2026.")
        seed = 2026
else:
    seed = 2026


output_file = input(
    "Nazwa pliku [komorai-2.3-infinity.json]: "
).strip()

if not output_file:
    output_file = "komorai-2.3-infinity.json"


random.seed(seed)

# ============================================================
# TEMATY
# ============================================================

subjects = [

    # PROGRAMOWANIE

    "zmienna",
    "funkcja",
    "klasa",
    "obiekt",
    "pętla",
    "pętla while",
    "pętla for",
    "instrukcja if",
    "instrukcja else",
    "lista",
    "krotka",
    "słownik",
    "zbiór",
    "tablica",
    "string",
    "boolean",
    "rekurencja",
    "algorytm",
    "sortowanie",
    "wyszukiwanie binarne",
    "JSON",
    "CSV",
    "XML",
    "API",
    "HTTP",
    "HTTPS",
    "serwer",
    "klient",
    "baza danych",
    "SQL",
    "SQLite",
    "Git",
    "GitHub",
    "Docker",
    "Linux",
    "Windows",
    "Python",
    "JavaScript",
    "TypeScript",
    "C++",
    "C#",
    "Java",
    "Rust",
    "HTML",
    "CSS",
    "React",
    "Node.js",
    "Pygame",
    "Unity",
    "silnik gry",
    "modloader",
    "system zapisów",
    "system ekwipunku",
    "system questów",
    "generowanie proceduralne",
    "sztuczna inteligencja",
    "model językowy",
    "token",
    "kontekst",
    "prompt",
    "dataset",
    "machine learning",
    "neural network",
    "debugowanie",
    "test jednostkowy",
    "wydajność programu",
    "pamięć RAM",
    "procesor",
    "GPU",
    "plik konfiguracyjny",
    "zmienna środowiskowa",
    "terminal",
    "komenda",
    "proces",
    "wątek",
    "async",
    "await",
    "socket",
    "websocket",
    "frontend",
    "backend",
    "framework",
    "biblioteka",
    "moduł",
    "pakiet",
    "kompilator",
    "interpreter",
    "debugger",
    "serwis",
    "aplikacja",
    "program",
    "gra komputerowa",
    "system operacyjny",
    "plik",
    "folder",
    "ścieżka",
    "kod źródłowy",
    "repozytorium",

    # TEMATY OGÓLNE

    "kot",
    "pies",
    "lama",
    "koń",
    "krowa",
    "owca",
    "koza",
    "królik",
    "chomik",
    "papuga",
    "ryba",
    "delfin",
    "wieloryb",
    "rekin",
    "pingwin",
    "słoń",
    "żyrafa",
    "lew",
    "tygrys",
    "niedźwiedź",
    "wilk",
    "lis",
    "orzeł",
    "sowa",
    "bocian",
    "pszczółka",
    "motyl",
    "mrówka",
    "pająk",
    "żaba",

    "pizza",
    "hamburger",
    "kanapka",
    "makaron",
    "ryż",
    "ziemniaki",
    "jabłko",
    "banan",
    "pomarańcza",
    "arbuz",
    "truskawka",
    "czekolada",
    "lody",
    "ciasto",
    "ser",
    "mleko",
    "chleb",
    "jajko",
    "zupa",
    "sałatka",

    "samochód",
    "rower",
    "motocykl",
    "autobus",
    "tramwaj",
    "pociąg",
    "samolot",
    "statek",
    "łódź",
    "hulajnoga",

    "dom",
    "mieszkanie",
    "kuchnia",
    "łazienka",
    "sypialnia",
    "ogród",
    "garaż",
    "meble",
    "lodówka",
    "pralka",

    "szkoła",
    "wakacje",
    "urlop",
    "sport",
    "piłka nożna",
    "koszykówka",
    "tenis",
    "wyścigi",
    "muzyka",
    "film",

    "książka",
    "komiks",
    "fotografia",
    "malarstwo",
    "rysowanie",
    "podróż",
    "turystyka",
    "góry",
    "morze",
    "jezioro",

    "las",
    "rzeka",
    "plaża",
    "deszcz",
    "śnieg",
    "burza",
    "słońce",
    "chmura",
    "wiatr",
    "tęcza"
]

# ============================================================
# SZABLONY PYTAŃ
# ============================================================

question_templates = [

    "Co to jest {}?",
    "Jak działa {}?",
    "Do czego służy {}?",
    "Jak wygląda {}?",
    "Gdzie można spotkać {}?",
    "Dlaczego {} jest ważne?",
    "Jak powstaje {}?",
    "Jak wykorzystuje się {}?",
    "Jakie są rodzaje {}?",
    "Jakie są zalety {}?",
    "Jakie są wady {}?",
    "Jak działa {} w praktyce?",
    "Dlaczego ludzie interesują się {}?",
    "Jak opisać {}?",
    "Jak działa {} krok po kroku?",
    "Co warto wiedzieć o {}?",
    "Jakie ciekawostki dotyczą {}?",
    "Jak nauczyć się więcej o {}?",
    "Jak wygląda historia {}?",
    "Skąd pochodzi {}?",
    "Jak zmieniło się {} na przestrzeni lat?",
    "Dlaczego {} jest popularne?",
    "Czy {} jest potrzebne?",
    "Czy {} jest bezpieczne?",
    "Czy {} można znaleźć w Polsce?",
    "Jakie są przykłady {}?",
    "Czym różni się {} od innych rzeczy?",
    "Jak rozpoznać {}?",
    "Jak zadbać o {}?",
    "Jak poprawić wiedzę na temat {}?",
    "Jak wytłumaczyć {} dziecku?",
    "Jak wytłumaczyć {} początkującemu?",
    "Jakie błędy popełnia się przy {}?",
    "Jak uniknąć problemów związanych z {}?",
    "Jak przygotować się do {}?",
    "Co może być ciekawego w {}?",
    "Dlaczego {} może być interesujące?",
    "Jakie fakty dotyczą {}?",
    "Jakie są najważniejsze informacje o {}?",
    "Co trzeba wiedzieć przed {}?",
    "Jak można wykorzystać {}?",
    "Jak zacząć przygodę z {}?",
    "Jak poprawnie używać {}?",
    "Jak często występuje {}?",
    "Jakie znaczenie ma {}?",
    "Jakie są zastosowania {}?",
    "Jakie informacje warto znać o {}?",
    "Jak wyjaśnić działanie {}?",
    "Jakie są podstawy {}?",
    "Jak wygląda {} w codziennym życiu?"
]

contexts = [

    "",
    " dla początkującego",
    " dla dziecka",
    " w prosty sposób",
    " szczegółowo",
    " krótko",
    " z przykładami",
    " krok po kroku",
    " w praktyce",
    " w Polsce",
    " na świecie",
    " dla ciekawskich",
    " w codziennym życiu",
    " z ciekawostkami",
    " w formie krótkiej odpowiedzi",
    " w formie dłuższego wyjaśnienia",
    " bez trudnych słów",
    " z najważniejszymi faktami",
    " w sposób edukacyjny",
    " bardzo dokładnie",
    " w kilku zdaniach",
    " z praktycznymi informacjami"
]

# ============================================================
# ODPOWIEDZI
# ============================================================

answers = {

    "zmienna":
        "Zmienna to nazwana wartość przechowywana w pamięci programu, którą można odczytywać i zmieniać.",

    "funkcja":
        "Funkcja to wydzielony fragment programu wykonujący określone zadanie.",

    "klasa":
        "Klasa definiuje strukturę i zachowanie obiektów w programowaniu obiektowym.",

    "pętla":
        "Pętla pozwala wielokrotnie wykonywać określony fragment kodu.",

    "Python":
        "Python to popularny język programowania o czytelnej składni i szerokim zastosowaniu.",

    "JSON":
        "JSON to tekstowy format przechowywania i wymiany danych.",

    "API":
        "API to interfejs pozwalający różnym programom komunikować się ze sobą.",

    "algorytm":
        "Algorytm to uporządkowany zestaw instrukcji prowadzących do rozwiązania określonego problemu.",

    "model językowy":
        "Model językowy to system AI uczący się wzorców języka i generujący lub analizujący tekst.",

    "kot":
        "Kot to udomowiony ssak należący do rodziny kotowatych.",

    "pies":
        "Pies to udomowiony ssak należący do rodziny psowatych.",

    "lama":
        "Lama to ssak z rodziny wielbłądowatych pochodzący z Ameryki Południowej.",

    "pizza":
        "Pizza to danie składające się zwykle z ciasta, sosu i różnych dodatków.",

    "samochód":
        "Samochód to pojazd przeznaczony do transportu osób lub rzeczy.",

    "rower":
        "Rower to jednoślad napędzany siłą mięśni osoby jadącej.",

    "góry":
        "Góry to obszary terenu charakteryzujące się znacznymi wzniesieniami.",

    "morze":
        "Morze to część oceanu częściowo otoczona lądem.",

    "deszcz":
        "Deszcz to opad atmosferyczny składający się z kropli wody.",

    "śnieg":
        "Śnieg to opad atmosferyczny w postaci kryształków lodu."
}

default_answer = (
    "To interesujące zagadnienie. "
    "Jego znaczenie, właściwości i zastosowanie "
    "zależą od konkretnego kontekstu."
)

# ============================================================
# GENERATOR PYTAŃ
# ============================================================

def generate_question(index):

    subject = subjects[index % len(subjects)]

    template_index = (
        index // len(subjects)
    ) % len(question_templates)

    template = question_templates[template_index]

    context_index = (
        index //
        (len(subjects) * len(question_templates))
    ) % len(contexts)

    context_text = contexts[context_index]

    return template.format(subject) + context_text


def generate_answer(question):

    for subject, answer in answers.items():

        if subject.lower() in question.lower():
            return answer

    return default_answer


# ============================================================
# PODSUMOWANIE
# ============================================================

print()
print("=" * 60)
print("USTAWIENIA MODELU")
print("=" * 60)

print(f"Nazwa:        {model_name}")
print(f"ID:           {model_id}")
print(f"Provider:     {provider}")
print(f"Q&A:          {entries:,}")
print(f"Context:      {context:,}")
print(f"Premium:      {premium}")
print(f"Points:       {points}")
print(f"Meow mode:    {meow_mode}")
print(f"Plik:         {output_file}")
print("=" * 60)

confirm = input(
    "Rozpocząć generowanie? [T/n]: "
).strip().lower()

if confirm in ["n", "nie", "no", "0"]:
    print("Anulowano.")
    exit()

# ============================================================
# ZAPIS STRUMIENIOWY
# ============================================================

print()
print("Generowanie 1 modelu...")
print()

with open(output_file, "w", encoding="utf-8") as f:

    f.write("{\n")

    f.write(
        f'  "id": {json.dumps(model_id, ensure_ascii=False)},\n'
    )

    f.write(
        f'  "name": {json.dumps(model_name, ensure_ascii=False)},\n'
    )

    f.write(
        f'  "provider": {json.dumps(provider, ensure_ascii=False)},\n'
    )

    f.write(
        f'  "description": '
        f'{json.dumps(description, ensure_ascii=False)},\n'
    )

    f.write('  "type": "local",\n')

    f.write(
        f'  "model": {json.dumps(model_id, ensure_ascii=False)},\n'
    )

    f.write(f'  "context": {context},\n')
    f.write(f'  "premium": {str(premium).lower()},\n')
    f.write(f'  "points_per_message": {points},\n')
    f.write(f'  "meow_mode": {str(meow_mode).lower()},\n')

    f.write('  "examples": [\n')

    for i in range(entries):

        question = generate_question(i)
        answer = generate_answer(question)

        entry = {
            "question": question,
            "answer": answer
        }

        f.write(
            "    " +
            json.dumps(
                entry,
                ensure_ascii=False
            )
        )

        if i < entries - 1:
            f.write(",")

        f.write("\n")

        if (i + 1) % 10000 == 0:

            percent = (
                (i + 1) / entries
            ) * 100

            print(
                f"\rPostęp: "
                f"{i + 1:,}/{entries:,} "
                f"({percent:.1f}%)",
                end="",
                flush=True
            )

    f.write("  ]\n")
    f.write("}\n")

print()
print()
print("=" * 60)
print("GOTOWE!")
print("=" * 60)
print(f"Model:       {model_name}")
print(f"ID:          {model_id}")
print(f"Wpisów Q&A:  {entries:,}")
print(f"Plik:        {output_file}")
print("=" * 60)