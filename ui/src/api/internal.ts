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
    init = addHeader(init, 'Accept', 'application/json')
    init = addHeader(init, 'Content-Type', 'application/json')
    if (init?.withoutToken !== true) {
        const token = await getToken()
        if (token !== null) {
            init = addHeader(init, 'Authorization', 'Bearer ' + token)
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
    let cause: Error | undefined
    try {
        response = await fetch(input, init)
    } catch (e) {
        let body: { error: string }
        if (e instanceof Error) {
            cause = e
            body = { error: e.message }
        } else {
            cause = new Error('unknown error')
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
        if (e instanceof Error) {
            cause = e
        } else {
            cause = new Error('unknown error')
        }
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
        throw new FetchError(message, response.status, body, cause)
    }
    return body
}

function addHeader(
    init: RequestInit | undefined,
    name: string,
    value: string,
): RequestInit {
    if (init === undefined) {
        init = {}
    }
    let headers = init.headers
    if (headers === undefined) {
        headers = {}
    }
    if (headers instanceof Array) {
        headers.push([name, value])
    } else if (headers instanceof Headers) {
        headers.append(name, value)
    } else {
        headers[name] = value
    }
    init.headers = headers

    return init
}
