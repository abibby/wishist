import { getToken } from '../auth'

type AuthRequestInit = {
    withoutToken?: boolean
}

export class FetchError<T> extends Error {
    constructor(message: string, public status: number, public body: T) {
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
    const response = await fetch(input, init)
    const body = await response.json()

    if (!response.ok) {
        let message = response.statusText
        if (body.error) {
            message = body.error
        }
        throw new FetchError(message, response.status, body)
    }
    return body
}
