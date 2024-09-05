import { test, expect } from '../playwright/fixtures'

test('add item', async ({ authenticatedPage: page, account }) => {
    await page.goto('/list/' + account.username)

    await page.getByRole('textbox').waitFor({ state: 'visible' })

    await expect(page).toHaveScreenshot()

    await page.getByRole('textbox').click()
    await page.getByRole('textbox').fill('Item 1')

    await expect(page).toHaveScreenshot()

    await page.getByRole('textbox').press('Enter')

    await expect(page).toHaveScreenshot()
})
