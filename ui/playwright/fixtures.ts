/* eslint-disable no-empty-pattern */
import { Page, test as baseTest } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import type { LoginRequest, LoginResponse } from '../src/api/auth'

export * from '@playwright/test'

export const test = baseTest.extend<
    {
        authenticatedPage: Page
        account: LoginRequest
        userTokens: LoginResponse
    },
    NonNullable<unknown>
>({
    authenticatedPage: async ({ context, userTokens }, use) => {
        const newPage = await context.newPage()
        await newPage.goto('/')
        await newPage.evaluate(tokens => {
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            window.testSetAuthTokens(tokens)
        }, userTokens)
        await use(newPage)
    },

    account: async ({}, use) => {
        const id = index()
        use({
            username: `user${id}`,
            password: `pass${id}`,
        })
    },

    userTokens: async ({ account }, use) => {
        const id = index()
        const fileName = path.resolve(
            test.info().project.outputDir,
            `.auth/${id}.json`,
        )

        let resp: LoginResponse
        if (!fs.existsSync(fileName)) {
            resp = await login({
                username: account.username,
                password: account.password,
            })

            fs.mkdirSync(path.dirname(fileName), { recursive: true })
            fs.writeFileSync(fileName, JSON.stringify(resp), 'utf-8')
        } else {
            resp = JSON.parse(fs.readFileSync(fileName).toString())
        }
        use(resp)
    },
})

function index(): number {
    return test.info().parallelIndex
}

function url(path: string): string {
    const url = test.info().config.webServer?.url
    if (!url) {
        throw new Error('no url in config')
    }
    return url + path
}

async function login(req: LoginRequest): Promise<LoginResponse> {
    const resp = await fetch(url('/api/login'), {
        method: 'POST',
        body: JSON.stringify(req),
    })

    if (resp.status !== 200) {
        throw new Error('could not log in: ' + (await resp.text()))
    }

    return (await resp.json()) as LoginResponse
}
