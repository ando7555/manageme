# ManageMe — starter

Aplikacja do zarządzania projektami: Vite + TypeScript, bez frameworka.

## Uruchomienie

Wymagany Node.js zgodny z Vite (22.12+ lub 20.19+).

    npm install
    npm run dev

Kompilacja produkcyjna: npm run build
Podgląd kompilacji: npm run preview
Testy warstwy danych: npm test

## Funkcje

- Tworzenie, odczyt, edycja i usuwanie projektów.
- Model: id (UUID), nazwa, opis.
- Wyszukiwanie po nazwie i opisie, potwierdzenie usuwania.
- Walidacja: nazwa 1–100 znaków po przycięciu spacji, opis do 2000 znaków.
- Responsywny interfejs w języku polskim.

## Warstwa danych

src/projects.ts zawiera interfejs ProjectApi i implementację LocalStorageProjectApi.
Metody list, get, create, update i delete zwracają Promise. Aby przejść na
NoSQL, dodaj implementację tego interfejsu komunikującą się z API i podmień
instancję w src/main.ts. Interfejs użytkownika nie korzysta bezpośrednio z localStorage.

Dane są przechowywane pod kluczem manageme.projects.v1, wyłącznie w bieżącej
przeglądarce i dla bieżącego originu. Wyczyszczenie danych przeglądarki usuwa projekty.
Uszkodzone dane nie są automatycznie nadpisywane. Błędy dostępu i zapełnienia
pamięci są wyświetlane użytkownikowi. Zmiany z innych kart odświeżają listę;
jednoczesne zapisy z wielu kart nie mają gwarancji transakcyjności.

## Sprawdzenie ręczne

1. Dodaj projekt, odśwież stronę i sprawdź zapis.
2. Edytuj nazwę i opis, zapisz, sprawdź wyszukiwanie.
3. Anuluj usuwanie, następnie potwierdź usunięcie.
4. Sprawdź pustą nazwę, widok mobilny oraz obsługę klawiaturą.
