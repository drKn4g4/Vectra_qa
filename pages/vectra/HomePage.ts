// pages/vectra/HomePage.ts

import { Page, Locator, expect } from '@playwright/test';
import Logger from '../../utils/logger';
import path from 'path';
import config from '../../config/vectraConfig';

const logger = new Logger('HomePage');

export class HomePage {
    readonly page: Page;
    readonly url: string;
    readonly acceptCookiesButton: Locator;
    readonly cookiesConsentBanner: Locator;
    readonly offersContainer: Locator;
    
    readonly internetMenuItem: Locator; 
    readonly zeroLevelMenuItems: Locator; 
    readonly kontaktLink: Locator;

    constructor(page: Page) {
        this.page = page;
        this.url = config.VECTRA_BASE_URL; 
        this.acceptCookiesButton = page.locator("//*[normalize-space(text())='Akceptuj wszystkie']"); 
        this.cookiesConsentBanner = page.locator("//*[@id='cookiescript_injected_wrapper']");
        this.offersContainer = page.locator("//div[contains(@class, 'mainPrice')]"); 
        this.internetMenuItem = page.locator("//span[normalize-space(text())='Internet' and contains(@class, 'firstMenuItem')]");
        this.zeroLevelMenuItems = page.locator('//li[contains(@class, "menu-level-one-item")]/a/span[contains(@class, "firstMenuItem")]');
        this.kontaktLink = page.locator("//span[normalize-space(text())='Kontakt' and contains(@class, 'firstMenuItem')]");
    }

    async navigate(): Promise<void> {
        logger.info(`Próbuję nawigować do: ${this.url}`);
        await this.page.goto(this.url);
        await this.page.waitForLoadState('load', { timeout: 30000 }); 
        // Poprawka w logu: "Mapsd" na "Przeniesiono"
        logger.info(`Przeniesiono do ${this.url} i strona załadowała się ('load' state).`);
        await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_1_nawigacja.png') });
        logger.info("Zrzut ekranu wykonany po nawigacji.");
    }

    async acceptCookies(): Promise<void> {
        logger.info('Próbuję zaakceptować ciasteczka.');
        try {
            await this.cookiesConsentBanner.waitFor({ state: 'visible', timeout: 5000 });
            logger.info("Baner zgody na ciasteczka ('cookiescript_injected_wrapper') jest teraz widoczny. Przechodzę do akceptacji.");

            await this.acceptCookiesButton.waitFor({ state: 'visible', timeout: 5000 });
            logger.info("Przycisk akceptacji ciasteczek jest widoczny. Próbuję zaakceptować ciasteczka.");

            await this.acceptCookiesButton.scrollIntoViewIfNeeded(); 
            await this.acceptCookiesButton.focus();
            logger.info('Skupiono się na przycisku akceptacji ciasteczek.');
            await this.acceptCookiesButton.screenshot({ path: path.join(process.cwd(), 'snapshots', 'cookies_accept_button_focused.png') });
            logger.info('Zrzut ekranu wykonany dla skupionego przycisku akceptacji ciasteczek.');

            await this.acceptCookiesButton.click({ timeout: 5000 }); 
            logger.info("Przycisk 'Akceptuj wszystkie' został kliknięty.");

            await expect(this.cookiesConsentBanner).toBeHidden({ timeout: 10000 });
            logger.info("Baner zgody na ciasteczka zniknął po akceptacji.");
            await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'cookies_accepted.png') });
            logger.info("Zrzut ekranu wykonany po akceptacji ciasteczek.");
        } catch (error: any) {
            if (error.name === 'TimeoutError' && (error.message.includes('waiting for selector') || error.message.includes('waiting for element'))) {
                 logger.info('Baner zgody na ciasteczka lub przycisk akceptacji nie pojawił się/nie stał się klikalny w wyznaczonym czasie. Zakładam, że ciasteczka są już zaakceptowane lub baner nie jest obecny.');
            } else {
                 logger.warn(`Wystąpił nieoczekiwany błąd podczas akceptacji ciasteczek: ${error.message}`);
                 await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'cookie_acceptance_error_debug.png'), fullPage: true });
            }
        }
    }

    // --- Zmodyfikowana metoda logHighestAndLowestPrices ---
    // Zwraca obiekt z najwyższą i najniższą ceną
    async logHighestAndLowestPrices(): Promise<{ highest: number; lowest: number }> {
        logger.info('Próbuję znaleźć i zalogować najwyższe i najniższe ceny ofert internetowych.');
        
        await this.offersContainer.first().waitFor({ state: 'visible', timeout: 10000 }); 
        
        const priceElements = await this.page.locator('.mainPrice').all();

        if (priceElements.length === 0) {
            logger.warn('Nie znaleziono żadnych elementów z klasą "mainPrice". Nie można zalogować cen.');
            throw new Error('Nie znaleziono żadnych prawidłowych cen na stronie.');
        }

        let highestPrice = 0;
        let lowestPrice = Infinity; 
        const foundPrices: number[] = []; 

        for (const priceElement of priceElements) {
            const priceText = await priceElement.textContent();
            
            if (priceText) {
                // --- Kluczowa zmiana w parsowaniu ceny ---
                // Używamy regexa do wyciągnięcia liczby, która może mieć opcjonalnie dwa miejsca po przecinku/kropce.
                // To powinno odciąć dodatkowe cyfry.
                const match = priceText.match(/(\d+(?:[.,]\d{1,2})?)/); 
                if (match && match[1]) {
                    const cleanPrice = match[1].replace(/,/g, '.'); // Zamień przecinki na kropki
                    const price = parseFloat(cleanPrice);

                    if (!isNaN(price)) {
                        foundPrices.push(price); 
                        if (price > highestPrice) {
                            highestPrice = price;
                        }
                        if (price < lowestPrice) {
                            lowestPrice = price;
                        }
                        logger.info(`Znaleziono cenę: ${price}`); 
                    } else {
                        logger.warn(`Nie można sparsować liczby z wyciągniętego tekstu: '${cleanPrice}'.`);
                    }
                } else {
                    logger.warn(`Nie znaleziono wzorca ceny (liczba z opcjonalnymi dwoma miejscami po przecinku) w tekście: '${priceText}'.`);
                }
            } else {
                logger.warn('Element .mainPrice nie zawiera tekstu ceny.');
            }
        }

        if (foundPrices.length === 0) {
            logger.warn('Po parsowaniu nie znaleziono żadnych prawidłowych liczb w elementach z klasą "mainPrice".');
            throw new Error('Nie znaleziono prawidłowych cen, aby określić najwyższą i najniższą.');
        }

        logger.info(`Wszystkie znalezione ceny: [${foundPrices.join(', ')}]`); 
        logger.info(`Najwyższa znaleziona cena: ${highestPrice}`);
        logger.info(`Najniższa znaleziona cena: ${lowestPrice}`);
        
        await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_2_ceny_ofert_zaladowane.png') });
        logger.info("Zrzut ekranu wykonany po zalogowaniu najwyższych i najniższych cen.");

        return { highest: highestPrice, lowest: lowestPrice };
    }
    
    async verifyInternetPositionInZeroLevelMenuIsUnique(): Promise<void> {
        logger.info('Próbuję zweryfikować unikalność pozycji "Internet" w menu zerowym.');
        const internetItems = await this.internetMenuItem.all();
        await expect(internetItems.length).toBe(1);
        logger.info(`Zweryfikowano: Znaleziono dokładnie 1 pozycję "Internet" w menu zerowym.`);
        await this.internetMenuItem.focus();
        logger.info('Skupiono się na pozycji menu "Internet".');
        await this.internetMenuItem.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_3_internet_menu_focused.png') });
        logger.info('Zrzut ekranu wykonany dla skupionej pozycji menu "Internet".');
        await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_3_internet_menu_verified.png') });
        logger.info('Zrzut ekranu wykonany po weryfikacji pozycji "Internet".');
    }

    async verifyLastZeroLevelMenuItemText(expectedText: string): Promise<void> {
        logger.info(`Próbuję zweryfikować, czy ostatnia pozycja w menu zerowym to '${expectedText}'.`);
        const allMenuItems = await this.zeroLevelMenuItems.all();
        if (allMenuItems.length === 0) {
            throw new Error('Nie znaleziono żadnych pozycji w menu zerowym.');
        }
        const lastMenuItem = allMenuItems[allMenuItems.length - 1];
        const lastMenuItemText = await lastMenuItem.textContent();
        expect(lastMenuItemText?.trim()).toBe(expectedText);
        logger.info(`Zweryfikowano: Ostatnia pozycja w menu zerowym to '${lastMenuItemText?.trim()}'.`);
        await lastMenuItem.focus();
        logger.info('Skupiono się na ostatniej pozycji menu.');
        await lastMenuItem.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_4_ostatni_menu_item_focused.png') });
        logger.info('Zrzut ekranu wykonany dla skupionej ostatniej pozycji menu.');
        await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_4_ostatni_menu_item_verified.png') });
        logger.info('Zrzut ekranu wykonany po weryfikacji ostatniej pozycji menu.');
    }

    async clickKontaktLink(): Promise<void> {
        logger.info('Próbuję kliknąć link "Kontakt".');
        await this.kontaktLink.waitFor({ state: 'visible', timeout: 10000 });
        await this.kontaktLink.focus();
        logger.info('Skupiono się na linku "Kontakt".');
        await this.kontaktLink.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_5_kontakt_link_focused.png') });
        logger.info('Zrzut ekranu wykonany dla skupionego linku "Kontakt".');
        await this.kontaktLink.click();
        logger.info('Link "Kontakt" został kliknięty.');
        await this.page.screenshot({ path: path.join(process.cwd(), 'snapshots', 'krok_5_kontakt_link_clicked.png') });
        logger.info('Zrzut ekranu wykonany po kliknięciu linku "Kontakt".');
    }
}