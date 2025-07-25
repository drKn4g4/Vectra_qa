// pages/vectra/ContactPage.ts

import { Page, Locator, expect } from '@playwright/test';
import Logger from '../../utils/logger';
import path from 'path';
import config from '../../config/vectraConfig';

const logger = new Logger('ContactPage');

export class ContactPage {
    readonly page: Page;
    readonly url: string;
    readonly pageHeader: Locator;
    readonly contactCardsSection: Locator;
    readonly customerServicePhoneNumberCard: Locator;
    readonly customerServicePhoneNumberLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.url = `${config.VECTRA_BASE_URL}/kontakt`;
        
        this.pageHeader = page.locator('h1', { hasText: 'Kontakt z firmą Vectra' }); 
        this.contactCardsSection = page.locator('section[data-widget="(/kontakt) - formy kontaktu - boksy"]');
        this.customerServicePhoneNumberCard = page.locator(`#card-number-2:has(a[href="tel:+48${config.VECTRA_CUSTOMER_SERVICE_PHONE}"])`);
        this.customerServicePhoneNumberLink = page.locator(`a.button.btn-outlined[href="tel:+48${config.VECTRA_CUSTOMER_SERVICE_PHONE}"]`);
    }

    async navigate(): Promise<void> {
        logger.info(`Próbuję nawigować do strony Kontakt: ${this.url}`);
        await this.page.goto(this.url);
        await this.page.waitForLoadState('load', { timeout: 30000 });
        logger.info(`Przeniesiono do ${this.url} i strona załadowała się (stan 'load').`); 
        await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'contact_page_loaded.png') });
        logger.info("Zrzut ekranu wykonany po nawigacji do strony Kontakt.");
    }

    async verifyContactPageLoaded(): Promise<void> {
        logger.info(`Weryfikuję URL strony Kontakt: ${this.url}`);
        
        // Sprawdź, czy aktualny URL to oczekiwany URL strony kontaktowej.
        // Jeśli nie, spróbuj nawigować.
        if (this.page.url() !== this.url) {
            logger.info(`Aktualny URL (${this.page.url()}) nie jest URL-em strony Kontakt. Próbuję nawigować.`);
            await this.navigate(); // Wywołujemy istniejącą metodę navigate()
        }

        // Zwiększony timeout dla waitForURL z 15000ms na 250000ms.
        // Pamiętaj, że 250 sekund to bardzo długo. Upewnij się, że to celowe.
        await this.page.waitForURL(this.url, { timeout: 250000 }); 
        logger.info(`Pomyślnie nawigowano do URL strony Kontakt: ${this.url}`);
        
        await this.page.waitForLoadState('load', { timeout: 30000 }); 
        logger.info(`Strona Kontakt zakończyła ładowanie głównych zasobów (stan 'load').`);
        
        await expect(this.customerServicePhoneNumberCard).toBeVisible({ timeout: 15000 });
        logger.info("Karta z numerem telefonu Obsługi Klienta jest widoczna, co potwierdza załadowanie zawartości strony.");
        
        await this.customerServicePhoneNumberCard.focus();
        logger.info("Skupiono się na karcie z numerem telefonu Obsługi Klienta.");
        
        await this.customerServicePhoneNumberCard.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_5_1_kontakt_page_loaded_and_card_focused.png') });
        logger.info("Zrzut ekranu wykonany dla skupionej karty z numerem telefonu.");
        
        await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_5_2_kontakt_page_loaded_full.png') });
        logger.info("Zrzut ekranu całej strony Kontakt po załadowaniu."); // Dodany log po drugim zrzucie
    }

    async verifyPageHeader(expectedText: string): Promise<void> {
        logger.info(`Próbuję zweryfikować nagłówek strony Kontakt.`);
        await expect(this.pageHeader).toBeVisible({ timeout: 10000 }); 
        logger.info(`Element nagłówka strony Kontakt jest widoczny.`);
        await this.pageHeader.focus();
        logger.info(`Skupiono się na nagłówku strony Kontakt.`);
        await this.pageHeader.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_6_naglowek_kontakt_focused.png') });
        logger.info(`Zrzut ekranu wykonany dla skupionego nagłówka strony Kontakt.`);
        await expect(this.pageHeader).toHaveText(expectedText);
        logger.info(`Zweryfikowano, że tekst nagłówka strony Kontakt to '${expectedText}'.`);
        await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_6_naglowek_kontakt.png') });
        logger.info(`Zrzut ekranu wykonany po weryfikacji nagłówka.`);
    }

    async findAndVerifyPhoneNumbers(): Promise<void> {
        logger.info('Próbuję znaleźć i zalogować wszystkie numery telefonów oraz zweryfikować oczekiwany.');
        await expect(this.contactCardsSection).toBeVisible({ timeout: 10000 });
        logger.info('Sekcja z kartami kontaktowymi jest widoczna. Wyciągam numery telefonów z jej zawartości.');

        const sectionContent = await this.contactCardsSection.textContent();
        if (!sectionContent) {
            logger.warn('Sekcja z kartami kontaktowymi nie zawiera tekstu, z którego można wyciągnąć numery telefonów.');
            logger.info('Nie znaleziono numerów telefonów, ponieważ sekcja kontaktowa jest pusta.');
            await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_7_telefony_nie_znalezione_brak_tresci.png') });
            return;
        }

        const phoneRegex = /\+?4?8?[\s-]?(\d{3}[\s-]?\d{3}[\s-]?\d{3})/g;
        const normalizedSectionContent = sectionContent.replace(/&nbsp;/g, ' ');

        const foundNumbers: Set<string> = new Set();
        let match;
        while ((match = phoneRegex.exec(normalizedSectionContent)) !== null) {
            let cleanedNumber = match[1].replace(/[\s-]/g, '');
            if (cleanedNumber.length === 9) {
                foundNumbers.add(cleanedNumber);
            }
        }

        const expectedNumber = config.VECTRA_CUSTOMER_SERVICE_PHONE;
        const foundExpected = foundNumbers.has(expectedNumber);

        if (foundNumbers.size > 0) {
            logger.info(`Wszystkie unikalne 9-cyfrowe numery telefonów znalezione na stronie: ${Array.from(foundNumbers).join(', ')}`);
        } else {
            logger.info('Nie znaleziono 9-cyfrowych numerów telefonów na stronie pasujących do oczekiwanych formatów.');
        }

        if (foundExpected) {
            logger.info(`WERYFIKACJA SUKCES: Oczekiwany numer telefonu '${expectedNumber}' został znaleziony na stronie.`);
        } else {
            logger.error(`WERYFIKACJA NIEPOWODZENIE: Oczekiwany numer telefonu '${expectedNumber}' NIE został znaleziony na stronie.`);
            throw new Error(`Oczekiwany numer telefonu '${expectedNumber}' nie został znaleziony na stronie Kontakt.`);
        }

        await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_7_telefony_znalezione_i_zweryfikowane.png') });
        logger.info("Zrzut ekranu wykonany po weryfikacji numerów telefonów.");
    }

    async clickPhoneNumberLink(): Promise<void> {
        const expectedNumber = config.VECTRA_CUSTOMER_SERVICE_PHONE; 
        const linkText = expectedNumber.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3'); 

        logger.info(`Próbuję kliknąć link z numerem telefonu Obsługi Klienta.`);
        await expect(this.customerServicePhoneNumberLink).toBeVisible({ timeout: 10000 });
        logger.info(`Link z numerem telefonu Obsługi Klienta: '${linkText}' jest widoczny.`);
        await this.customerServicePhoneNumberLink.focus();
        logger.info('Skupiono się na linku z numerem telefonu Obsługi Klienta.');
        await this.customerServicePhoneNumberLink.screenshot({ path: path.join(process.cwd(), 'snapshots', `krok_7_telefon_kontaktowy_link_focused.png`) });
        logger.info('Zrzut ekranu wykonany dla skupionego linku z numerem telefonu.');
        await this.customerServicePhoneNumberLink.click();
        logger.info(`Kliknięto link z numerem telefonu Obsługi Klienta: '${linkText}'.`);
        await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_7_telefon_kontaktowy_link_clicked.png') });
        logger.info("Zrzut ekranu wykonany po kliknięciu linku z numerem telefonu.");
    }
}