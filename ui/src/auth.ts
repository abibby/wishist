import { createStore, delMany, get, setMany } from 'idb-keyval'
import jwt from './jwt'
import { User } from './api/user'
import { FetchError, LoginResponse, authAPI } from './api'
import { signal } from '@preact/signals-core'
import { useSignalValue } from './hooks/signal'

const authStore = createStore('auth-tokens', 'auth-tokens')
const tokenKey = 'token'
const refreshKey = 'refresh'
const userKey = 'user'

const tokenSignal = signal<string | null | undefined>(undefined)

export async function getToken(): Promise<string | null> {
    try {
        let token = await getLocalAuthToken()
        if (token !== null && jwtExpired(token)) {
            token = await refreshAuthTokens()
        }
        tokenSignal.value = token

        return token ?? null
    } catch (e) {
        if (e instanceof FetchError && e.status === 401) {
            tokenSignal.value = null
            return null
        }
        console.error(e)
        return null
    }
}

async function getLocalAuthToken(): Promise<string | null> {
    let token = tokenSignal.value
    if (token === undefined) {
        token = await get<string | undefined>(tokenKey, authStore)
    }
    return token ?? null
}

async function refreshAuthTokens(): Promise<string | null> {
    const refresh = await get<string | undefined>(refreshKey, authStore)
    if (refresh === undefined || jwtExpired(refresh)) {
        return null
    }

    const result = await authAPI.refresh({ refresh: refresh })
    setAuthTokens(result)
    return result.token
}

async function setAuthTokens(data: LoginResponse): Promise<void> {
    tokenSignal.value = data.token
    await setMany(
        [
            [tokenKey, data.token],
            [refreshKey, data.refresh],
        ],
        authStore,
    )
}

function jwtExpired(token: string): boolean {
    const exp = jwt.parse(token).claims.exp
    if (exp === undefined) {
        return false
    }

    return exp * 1000 < Date.now()
}

export async function login(username: string, password: string): Promise<void> {
    const data = await authAPI.login({
        username: username,
        password: password,
    })
    tokenSignal.value = data.token

    try {
        await setMany(
            [
                [tokenKey, data.token],
                [refreshKey, data.refresh],
            ],
            authStore,
        )
    } catch (e) {
        console.error('failed to save token', e)
    }
}

export async function logout() {
    tokenSignal.value = null
    try {
        await delMany([tokenKey, refreshKey, userKey], authStore)
    } catch (e) {
        console.error(e)
    }
}

export function useUser(): [User | null, boolean] {
    const token = useSignalValue(tokenSignal)

    if (!token) {
        return [null, token !== undefined]
    }

    const claims = jwt.parse(token).claims

    return [
        {
            id: Number(claims.sub),
            username: claims.preferred_username,
            name: claims.name,
        },
        false,
    ]
}

getToken()

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
window.testSetAuthTokens = setAuthTokens
