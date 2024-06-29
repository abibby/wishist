import { getToken } from '../auth'

type AuthRequestInit = {
    withoutToken?: boolean
}

type ErrorBody = {
    error: string
    status: number
    fields?: Record<string, string[]>
}

export class FetchError extends Error {
    constructor(
        message: string,
        public status: number,
        public body: ErrorBody,
    ) {
        super(message)
    }
}

export async function apiFetch<T>(
    path: string,
    query: Record<string, string> | null = null,
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
        input += '?' + new URLSearchParams(query).toString()
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
