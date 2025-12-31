
# Ranking filmów

Aplikacja realizująca ranking filmów na podstawie głosów użytkowników. System umożliwia dodawanie filmów oraz wystawianie ocen, które dynamicznie wpływają na średnią i pozycję w rankingu.

---

## Technologia

- **Backend:** Node.js (Express)
- **Baza danych:** SQLite
- **Interfejs:** katalog `public/` (HTML, CSS, JS)

---

## Uruchomienie

1. Zainstaluj wymagane zależności:
   ```bash
   npm install

```

2. Uruchom serwer:
```bash
node server.js

```


3. Adres aplikacji: `http://localhost:5050`

---

## Zakres funkcjonalny

### Filmy

* Dodawanie filmów (title, year).
* Listowanie filmów wraz ze statystykami.

### Oceny

* Dodawanie oceny `score` w zakresie 1–5 dla wybranego filmu.
* Walidacja zakresu oceny po stronie backendu.

### Ranking

* Zwracanie listy filmów z `avg_score` (średnia zaokrąglona do 2 miejsc) i `votes` (liczba głosów).
* Automatyczne sortowanie malejąco po średniej ocen.

---

## Model danych

* **movies**(id, title, year)
* **ratings**(id, movie_id → movies.id, score CHECK 1..5)

---

## API

* `GET /api/movies` – lista filmów z `avg_score` i `votes`
* `POST /api/movies` – dodanie filmu `{title, year}`
* `POST /api/ratings` – dodanie oceny `{movie_id, score}`
* `GET /api/movies/top` – (Bonus) lista Top-N filmów

---

## Walidacja i statusy HTTP

* **201 Created** – poprawne utworzenie zasobu.
* **200 OK** – poprawna operacja.
* **400 Bad Request** – błędne dane wejściowe (np. `score` poza zakresem).
* **404 Not Found** – brak zasobu (np. ocena nieistniejącego filmu).
* **500 Internal Server Error** – błąd serwera.

---

## Bezpieczeństwo i HTTP

* `X-Content-Type-Options: nosniff`
* `Referrer-Policy: no-referrer`
* `Cache-Control: no-store` dla endpointów API
* Wyłączony nagłówek `X-Powered-By`
* Konfiguracja **Content Security Policy (CSP)** dla skryptów inline.

---

## Testowanie

Plik `tests.rest` zawiera przykładowe wywołania endpointów API. Testy wykonano przy użyciu rozszerzenia **REST Client** dla VS Code.

### Scenariusze testowe:

* Poprawne wykonanie operacji (happy path).
* Walidacja błędnych danych (ocena spoza zakresu).
* Aktualizacja średniej ocen bez restartu aplikacji.

---

## Oddanie projektu

* Repozytorium z kodem źródłowym.
* Plik `README.md`.
* Min. 3 zrzuty ekranu prezentujące działanie aplikacji.
* Plik `tests.rest` z przykładami wywołań.
