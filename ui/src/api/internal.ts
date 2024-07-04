import { getToken } from '../auth'
import { FetchError } from './fetch-error'

type AuthRequestInit = {
    withoutToken?: boolean
}

export async function apiFetch<T>(
    path: string,
    query: Record<string, unknown> | null = null,
    init?: RequestInit & AuthRequestInit,
): Promise<T> {
    if (init?.withoutToken !== true) {
        const token = await getToken()
        if (token !== null) {
            init = {
                ...init,
                headers: {
                    ...init?.headers,
                    Authorization: 'Bearer ' + token,
                },
            }
        }
    }

    let input = path
    if (input.startsWith('/')) {
        input = '/api' + input
    }
    if (query !== null) {
        input +=
            '?' +
            new URLSearchParams(
                Object.entries(query).map(([k, v]) => [k, String(v)]),
            ).toString()
    }

    let response: Response
    try {
        response = await fetch(input, init)
    } catch (e) {
        let body: { error: string }
        if (e instanceof Error) {
            body = { error: e.message }
        } else {
            body = { error: 'unknown error' }
        }
        response = new Response(JSON.stringify(body), {
            status: 500,
            headers: { 'x-custom': 'true' },
        })
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let body: any
    try {
        body = await response.json()
    } catch (e) {
        if (response.ok && e instanceof Error) {
            body = { error: e.message }
        } else {
            body = { error: response.statusText }
            console.warn(e)
        }
    }

    if (!response.ok) {
        let message = response.statusText

        if (body.error) {
            message = body.error
        }
        throw new FetchError(message, response.status, body)
    }
    return body
}
