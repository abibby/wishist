import { Event, EventTarget } from 'event-target-shim'
import { createStore, delMany, get, setMany } from 'idb-keyval'
import { useEffect, useState } from 'preact/hooks'
import jwt from './jwt'

const tokenStore = createStore('auth-tokens', 'auth-tokens')
const tokenKey = 'token'
const refreshKey = 'refresh'

type ChangeEventMap = {
    change: Event<'change'>
}
const changes = new EventTarget<ChangeEventMap, 'strict'>()

let _token: string | undefined

export async function getToken(): Promise<string | null> {
    if (_token !== undefined) {
        return _token
    }
    try {
        let token = await get<string | undefined>(tokenKey, tokenStore)
        if (token !== undefined && jwtExpired(token)) {
            token = undefined
        }
        if (token === undefined) {
            let refresh = await get<string | undefined>(refreshKey, tokenStore)
            if (refresh === undefined || jwtExpired(refresh)) {
                return null
            }
            const response = await fetch('/refresh', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${refresh}`,
                },
            })

            if (!response.ok) {
                return null
            }

            const result = await response.json()

            token = result.token
            _token = result.token

            await setMany(
                [
                    [tokenKey, result.token],
                    [refreshKey, result.refresh],
                ],
                tokenStore,
            )
            changes.dispatchEvent(new Event('change'))
        }

        return token ?? null
    } catch (e) {
        console.error(e)
        return null
    }
}

function jwtExpired(token: string): boolean {
    const exp = jwt.parse(token).claims.exp
    if (exp === undefined) {
        return false
    }

    return exp * 1000 < Date.now()
}

export async function login(username: string, password: string): Promise<void> {
    const response = await fetch('/login', {
        method: 'POST',
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    }).then(r => r.json())

    _token = response.token

    try {
        await setMany(
            [
                [tokenKey, response.token],
                [refreshKey, response.refresh],
            ],
            tokenStore,
        )
        changes.dispatchEvent(new Event('change'))
    } catch (e) {
        console.error('failed to save token', e)
    }
}

export async function logout() {
    try {
        await delMany([tokenKey, refreshKey], tokenStore)
        _token = undefined
        changes.dispatchEvent(new Event('change'))
    } catch (e) {
        console.error(e)
    }
}

export async function userID(): Promise<number | undefined> {
    const token = await getToken()
    if (token === null) {
        return undefined
    }
    return jwt.parse(token).claims.sub
}

export async function username(): Promise<string | undefined> {
    const token = await getToken()
    if (token === null) {
        return undefined
    }
    return jwt.parse(token).claims.username
}

export interface UserCreatePasswordlessRequest {
    name: string
    username: string
}
interface UserCreatePasswordlessResponse {
    user: unknown
    token: string
    refresh: string
}
export async function userCreatePasswordless(
    token: string,
    request: UserCreatePasswordlessRequest,
): Promise<void> {
    const response: UserCreatePasswordlessResponse = await fetch(
        '/user/passwordless',
        {
            headers: {
                Authorization: 'Bearer ' + token,
            },
            method: 'POST',
            body: JSON.stringify(request),
        },
    ).then(r => r.json())

    _token = response.token

    try {
        await setMany(
            [
                [tokenKey, response.token],
                [refreshKey, response.refresh],
            ],
            tokenStore,
        )
        changes.dispatchEvent(new Event('change'))
    } catch (e) {
        console.error('failed to save token', e)
    }
}

export interface User {
    id: number
    username: string
}

export function useUser(): User | null {
    const [user, setUser] = useState<User | null>(null)
    useEffect(() => {
        const change = async () => {
            const token = await getToken()
            if (token !== null) {
                const claims = jwt.parse(token).claims
                setUser({
                    id: claims.sub,
                    username: claims.username,
                })
            } else {
                setUser(null)
            }
        }
        changes.addEventListener('change', change)
        change()

        return () => {
            changes.removeEventListener('change', change)
        }
    }, [setUser])
    return user
}
