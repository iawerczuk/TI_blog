
# Blog API

Aplikacja realizująca prosty blog z możliwością dodawania komentarzy oraz ręcznym zatwierdzaniem komentarzy.


## Technologia

- **Backend:** Node.js (Express)
- **Baza danych:** SQLite
- **Interfejs:** katalog `public/`

---

## Uruchomienie

1. Zainstaluj zależności:
   ```bash
   npm install

```

2. Uruchom serwer:
```bash
node server.js

```


3. Adres aplikacji: [http://localhost:5050](https://www.google.com/search?q=http://localhost:5050)

---

## Zakres funkcjonalny

### Posty

* Dodawanie postów (`title`, `body`).
* Wyświetlanie listy wszystkich postów.
* Widok szczegółów konkretnego posta.

### Komentarze

* Dodawanie komentarzy do posta (`author`, `body`).
* Komentarze domyślnie otrzymują status `approved = 0`.
* Widok publiczny wyświetla wyłącznie zatwierdzone komentarze.

### Moderacja

* Lista komentarzy oczekujących na zatwierdzenie.
* Ręczne zatwierdzanie komentarzy (zmiana statusu na `approved = 1`).

## Model danych

* `posts(id, title, body, created_at)`
* `comments(id, post_id → posts.id, author, body, created_at, approved)`

## API

* `GET /api/posts` – lista wszystkich postów.
* `POST /api/posts` – dodanie nowego posta.
* `GET /api/posts/{id}/comments` – pobranie zatwierdzonych komentarzy dla danego posta.
* `POST /api/posts/{id}/comments` – dodanie nowego komentarza (domyślnie niezatwierdzony).
* `POST /api/comments/{id}/approve` – zatwierdzenie konkretnego komentarza.
* `GET /api/mod/pending` – lista wszystkich komentarzy oczekujących na moderację.


## Walidacja i statusy HTTP

* **201 Created** – poprawne utworzenie zasobu (posta lub komentarza).
* **200 OK** – poprawna operacja (pobranie danych, zatwierdzenie).
* **400 Bad Request** – błędne dane wejściowe.
* **404 Not Found** – brak zasobu (np. nieistniejący post).
* **500 Internal Server Error** – błąd serwera.

## Bezpieczeństwo

* Nagłówek `X-Content-Type-Options: nosniff`.
* Nagłówek `Referrer-Policy: no-referrer`.
* Nagłówek `Cache-Control: no-store` dla endpointów API.
* Wyłączony nagłówek `X-Powered-By`.

## Testowanie

Plik `tests.rest` zawiera przykładowe wywołania endpointów API. Testy zostały przeprowadzone przy użyciu rozszerzenia **REST Client** dla Visual Studio Code.

