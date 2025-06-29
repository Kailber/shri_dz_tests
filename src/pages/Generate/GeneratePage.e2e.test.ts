import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests for GeneratePage
 *
 * Tests the CSV generation functionality including:
 * - Page rendering and navigation
 * - API integration with success/error scenarios
 * - Loading states and user feedback
 * - File download functionality
 * - Error handling and display
 */

test.describe('GeneratePage E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/generate');
    });

    test.describe('Page Rendering', () => {
        test('отображает элементы страницы корректно', async ({ page }) => {
            await expect(
                page.getByRole('heading', {
                    name: 'Сгенерируйте готовый csv-файл нажатием одной кнопки',
                })
            ).toBeVisible();

            const generateButton = page.getByTestId('generate-button');
            await expect(generateButton).toBeVisible();
            await expect(generateButton).toBeEnabled();

            await expect(page.getByText('Отчёт успешно сгенерирован!')).not.toBeVisible();
            await expect(page.getByText(/Произошла ошибка/)).not.toBeVisible();
        });

        test('доступен через навигацию', async ({ page }) => {
            await page.goto('/');

            await page.getByRole('link', { name: /CSV Генератор/i }).click();

            await expect(page).toHaveURL('/generate');
            await expect(
                page.getByRole('heading', {
                    name: 'Сгенерируйте готовый csv-файл нажатием одной кнопки',
                })
            ).toBeVisible();
        });
    });

    test.describe('CSV Generation Flow', () => {
        test('успешно генерирует и скачать CSV файл', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 100));

                const csvContent = 'id,name,value\n1,Test,100\n2,Example,200';
                const buffer = Buffer.from(csvContent, 'utf-8');

                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': 'attachment; filename=report.csv',
                    },
                    body: buffer,
                });
            });

            const downloadPromise = page.waitForEvent('download');

            const generateButton = page.getByTestId('generate-button');
            await generateButton.click();

            await expect(page.locator('[data-testid="loader"]')).toBeVisible();
            await expect(generateButton).toBeDisabled();

            const download = await downloadPromise;
            expect(download.suggestedFilename()).toBe('report.csv');

            await expect(page.getByText('Отчёт успешно сгенерирован!')).toBeVisible();

            await expect(generateButton).toBeEnabled();
            await expect(generateButton).toHaveText('Начать генерацию');
        });

        test('показывает состояние загрузки во время генерации', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await new Promise((resolve) => setTimeout(resolve, 1000));

                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': 'attachment; filename=report.csv',
                    },
                    body: 'id,name\n1,test',
                });
            });

            const generateButton = page.getByTestId('generate-button');

            await generateButton.click();

            await expect(page.locator('[data-testid="loader"]')).toBeVisible();
            await expect(generateButton).toBeDisabled();

            await expect(generateButton).not.toHaveText('Начать генерацию');

            await expect(page.getByText('Отчёт успешно сгенерирован!')).toBeVisible();
            await expect(generateButton).toBeEnabled();
        });

        test('обрабатывает ошибки API корректно', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 500,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        error: 'Internal server error during CSV generation',
                    }),
                });
            });

            const generateButton = page.getByTestId('generate-button');

            await generateButton.click();

            await expect(page.getByText(/Произошла ошибка: Internal server error during CSV generation/)).toBeVisible();

            await expect(generateButton).toBeEnabled();

            await expect(page.getByText('Отчёт успешно сгенерирован!')).not.toBeVisible();
        });

        test('обрабатывает сетевые ошибки', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 503,
                    contentType: 'application/json',
                    body: JSON.stringify({ message: 'Service Unavailable' }),
                });
            });

            const generateButton = page.getByTestId('generate-button');

            await generateButton.click();

            await expect(page.getByText('Неизвестная ошибка при попытке сгенерировать отчёт')).toBeVisible();

            await expect(generateButton).toBeEnabled();
        });

        test('обрабатывает некорректные ответы с ошибками', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 400,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        message: 'Bad request',
                    }),
                });
            });

            const generateButton = page.getByTestId('generate-button');

            await generateButton.click();

            await expect(page.getByText('Неизвестная ошибка при попытке сгенерировать отчёт')).toBeVisible();
        });
    });

    test.describe('User Experience', () => {
        test('очищает сообщение об успехе после тайм-аута', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': 'attachment; filename=report.csv',
                    },
                    body: 'test,data\n1,2',
                });
            });

            const downloadPromise = page.waitForEvent('download');

            const generateButton = page.getByTestId('generate-button');

            await generateButton.click();

            await downloadPromise;
            await expect(page.getByText('Отчёт успешно сгенерирован!')).toBeVisible();

            await expect(page.getByText('Отчёт успешно сгенерирован!')).not.toBeVisible({ timeout: 3000 });
        });

        test('допускает множественную генерацию', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': 'attachment; filename=report.csv',
                    },
                    body: 'test\n1',
                });
            });

            const generateButton = page.getByTestId('generate-button');

            const download1Promise = page.waitForEvent('download');
            await generateButton.click();
            await download1Promise;
            await expect(page.getByText('Отчёт успешно сгенерирован!')).toBeVisible();

            await expect(generateButton).toBeEnabled();

            const download2Promise = page.waitForEvent('download');
            await generateButton.click();

            await download2Promise;

            await expect(page.getByText('Отчёт успешно сгенерирован!')).toBeVisible();
        });
    });

    test.describe('File Download Functionality', () => {
        test('устанавливает имя файла для загрузки из Content-Disposition', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': 'attachment; filename=report.csv',
                    },
                    body: 'id,name\n1,test',
                });
            });

            const downloadPromise = page.waitForEvent('download');
            const generateButton = page.getByTestId('generate-button');
            await generateButton.click();

            const download = await downloadPromise;
            expect(download.suggestedFilename()).toBe('report.csv');
        });

        test('использует имя файла по умолчанию, когда Content-Disposition отсутствует', async ({ page }) => {
            await page.route('**/report?size=0.01', async (route) => {
                await route.fulfill({
                    status: 200,
                    headers: {
                        'Content-Type': 'text/csv',
                    },
                    body: 'id,name\n1,test',
                });
            });

            const downloadPromise = page.waitForEvent('download');
            const generateButton = page.getByTestId('generate-button');
            await generateButton.click();

            const download = await downloadPromise;
            expect(download.suggestedFilename()).toBe('report.csv');
        });
    });
});
