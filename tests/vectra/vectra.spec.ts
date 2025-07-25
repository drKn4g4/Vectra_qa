import { test, expect, Page } from '@playwright/test';
import { HomePage } from '../../pages/vectra/HomePage';
import { ContactPage } from '../../pages/vectra/ContactPage';
import Logger from '../../utils/logger';
import path from 'path';

const logger = new Logger('VectraTest');

// Konfigurujemy tryb szeregowy dla całego bloku describe
// Zapewnia, że testy w tym bloku będą uruchamiane sekwencyjnie,
// zachowując ten sam kontekst przeglądarki.
test.describe.configure({ mode: 'serial' });

test.describe('Zadanie 1 - Pełny Scenariusz Strony Vectra', () => {
    let page: Page;
    let homePage: HomePage;
    let contactPage: ContactPage;

    // Uruchamiane RAZ przed wszystkimi testami w tym bloku describe
    test.beforeAll(async ({ browser }) => {
        logger.info('Globalne przygotowanie: Otwieram przeglądarkę i tworzę nową stronę.');
        page = await browser.newPage(); // Tworzymy stronę raz
        homePage = new HomePage(page);
        contactPage = new ContactPage(page);

        // Nawigacja TYLKO RAZ na początku całego scenariusza
        await homePage.navigate();
        // Akceptacja ciasteczek TYLKO RAZ na początku
        await homePage.acceptCookies(); 
        logger.info(`Początkowe przygotowanie zakończone: Przeniesiono na ${homePage.url} i obsłużono ciasteczka.`);
    });

    // Uruchamiane RAZ po wszystkich testach w tym bloku describe
    test.afterAll(async () => {
        logger.info('Globalne sprzątanie: Zamykam stronę przeglądarki.');
        await page.close();
    });

    // --- Rozbite kroki scenariusza na oddzielne testy ---

    test('Krok 1: Nawigacja do strony głównej i zrzut ekranu', async () => {
        logger.info('Rozpoczęcie testu: Krok 1 - Nawigacja do strony głównej i zrzut ekranu.');
        // Weryfikujemy, czy jesteśmy na stronie głównej po globalnym beforeAll
        await page.waitForLoadState('load', { timeout: 30000 });
        logger.info('Strona główna zakończyła ładowanie.');

        const screenshotPathStep1 = path.join(process.cwd(), 'snapshots', 'krok_1_strona_glowna_zaladowana.png');
        await page.screenshot({ path: screenshotPathStep1, fullPage: true });
        logger.info(`Zrzut ekranu strony głównej wykonany: ${screenshotPathStep1}`);
        
        await expect(page).toHaveTitle(/Vectra/);
        logger.info('Tytuł strony głównej zweryfikowany.');
    });

    test('Krok 2: Weryfikacja cen ofert na stronie głównej', async () => {
        logger.info('Rozpoczęcie testu: Krok 2 - Weryfikacja cen ofert.');
        // Upewniamy się, że nadal jesteśmy na stronie głównej
        if (page.url() !== homePage.url) {
            logger.warn(`Strona nie jest na URL Home Page. Próbuję nawigować: ${homePage.url}`);
            await homePage.navigate();
            await homePage.acceptCookies(); // Ponowna próba akceptacji ciasteczek po nawigacji
        }
        await homePage.logHighestAndLowestPrices();
        logger.info('Zakończono: Zalogowano najwyższą i najniższą wartość ofert na stronie głównej.');
    });

    test('Krok 3: Weryfikacja pozycji "Internet" w menu', async () => {
        logger.info('Rozpoczęcie testu: Krok 3 - Weryfikacja pozycji "Internet" w menu.');
        // Upewniamy się, że nadal jesteśmy na stronie głównej
        if (page.url() !== homePage.url) {
            logger.warn(`Strona nie jest na URL Home Page. Próbuję nawigować: ${homePage.url}`);
            await homePage.navigate();
            await homePage.acceptCookies();
        }
        await homePage.verifyInternetPositionInZeroLevelMenuIsUnique();
        logger.info('Zakończono: Zweryfikowano unikalność "Internet" w menu.');
    });

    test('Krok 4: Weryfikacja pozycji "Kontakt" w menu', async () => {
        logger.info('Rozpoczęcie testu: Krok 4 - Weryfikacja pozycji "Kontakt" w menu.');
        // Upewniamy się, że nadal jesteśmy na stronie głównej
        if (page.url() !== homePage.url) {
            logger.warn(`Strona nie jest na URL Home Page. Próbuję nawigować: ${homePage.url}`);
            await homePage.navigate();
            await homePage.acceptCookies();
        }
        await homePage.verifyLastZeroLevelMenuItemText('Kontakt');
        logger.info('Zakończono: Zweryfikowano tekst ostatniej pozycji w menu zerowym ("Kontakt").');
    });

    test('Krok 5: Nawigacja do strony Kontakt i weryfikacja załadowania', async () => {
        logger.info('Rozpoczęcie testu: Krok 5 - Nawigacja do strony Kontakt i weryfikacja załadowania.');
        // Upewniamy się, że jesteśmy na stronie głównej przed kliknięciem linku Kontakt
        if (page.url() !== homePage.url) {
            logger.warn(`Strona nie jest na URL Home Page. Próbuję nawigować: ${homePage.url}`);
            await homePage.navigate();
            await homePage.acceptCookies();
        }
        await homePage.clickKontaktLink();
        logger.info('Zakończono: Kliknięto link "KONTAKT".');
        await contactPage.verifyContactPageLoaded(); 
        logger.info('Zakończono: Pomyślnie przeniesiono na stronę kontaktową i zweryfikowano URL oraz załadowanie treści.');
    });

    test('Krok 6: Weryfikacja numerów telefonów na stronie Kontakt', async () => {
        logger.info('Rozpoczęcie testu: Krok 6 - Weryfikacja numerów telefonów na stronie Kontakt.');
        // Upewniamy się, że jesteśmy na stronie Kontakt
        if (page.url() !== contactPage.url) {
            logger.warn(`Strona nie jest na URL Kontakt Page. Próbuję nawigować: ${contactPage.url}`);
            await contactPage.navigate(); // Używamy metody navigate z ContactPage
        }
        await contactPage.findAndVerifyPhoneNumbers(); 
        logger.info('Zakończono: Zweryfikowano obecność numerów telefonu na stronie kontaktowej.');
    });

    test('Krok 7: Kliknięcie linku z numerem telefonu na stronie Kontakt', async () => {
        logger.info('Rozpoczęcie testu: Krok 7 - Kliknięcie linku z numerem telefonu.');
        // Upewniamy się, że jesteśmy na stronie Kontakt
        if (page.url() !== contactPage.url) {
            logger.warn(`Strona nie jest na URL Kontakt Page. Próbuję nawigować: ${contactPage.url}`);
            await contactPage.navigate(); // Używamy metody navigate z ContactPage
        }
        await contactPage.clickPhoneNumberLink();
        logger.info('Zakończono: Kliknięto link z numerem telefonu Centrum Obsługi Klienta.');
    });
});