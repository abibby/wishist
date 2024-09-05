import { test, expect } from '../playwright/fixtures'

test('create user', async ({ page }) => {
    const projectName = test.info().project.name
    const projectNameSlug = projectName.replace(/\s+/g, '-').toLowerCase()

    await page.getByLabel('Username').waitFor({ state: 'visible' })

    await page.goto('/create-user')

    await expect(page).toHaveScreenshot()

    await page.getByLabel('Username').fill(`user-${projectNameSlug}`)
    await page.getByLabel('Email').fill(`user-${projectNameSlug}@example.com`)
    await page.getByLabel('Full Name').fill(`User ${projectName} Name`)
    await page.getByLabel('Password', { exact: true }).fill('password')
    await page.getByLabel('Reenter Password').fill('password')

    await expect(page).toHaveScreenshot()

    await page.getByRole('button', { name: 'Create User' }).press('Enter')

    await expect(page).toHaveScreenshot()
})

test('login', async ({ page, account }) => {
    await page.goto('/')

    await page
        .getByRole('button', { name: 'login' })
        .waitFor({ state: 'visible' })

    await expect(page).toHaveScreenshot()

    await page.getByRole('button', { name: 'login' }).click()

    await expect(page).toHaveScreenshot()

    await page.getByLabel('Password').fill(account.password)
    await page
        .getByRole('button', { name: 'Login', exact: true })
        .press('Enter')

    await page.waitForTimeout(300)

    await expect(page).toHaveScreenshot()
})

test('logout', async ({ authenticatedPage: page }) => {
    await page.goto('/')

    await expect(page).toHaveScreenshot()

    await page.getByRole('link', { name: 'Account' }).click()

    await expect(page).toHaveScreenshot()

    await page.getByRole('button', { name: 'Logout' }).click()

    await page.waitForTimeout(300)

    await expect(page).toHaveScreenshot()
})
