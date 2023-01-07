import { getToken } from '../auth'

export class FetchError<T> extends Error {
    constructor(message: string, public status: number, public body: T) {
        super(message)
    }
}

export async function apiFetch<T>(
    input: RequestInfo,
    init?: RequestInit,
): Promise<T> {
    const token = await getToken()
    if (token !== null) {
        init = {
            ...init,
            headers: {
                Authorization: 'Bearer ' + token,
            },
        }
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
