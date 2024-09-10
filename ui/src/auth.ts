import { createStore, delMany, get, setMany } from 'idb-keyval'
import jwt from './jwt'
import { User } from './api/user'
import { FetchError, authAPI } from './api'
import { computed, signal } from '@preact/signals-core'
import { useSignalValue } from './hooks/signal'

const authStore = createStore('auth-tokens', 'auth-tokens')
const tokenKey = 'token'
const refreshKey = 'refresh'
const userKey = 'user'

const tokenSignal = signal<string | null | undefined>(undefined)

export const claimsSignal = computed(() => {
    if (tokenSignal.value === null) {
        return null
    }
    if (tokenSignal.value === undefined) {
        return undefined
    }
    return jwt.parse(tokenSignal.value).claims
})

export async function getToken(): Promise<string | null> {
    const exp = (claimsSignal.value?.exp ?? 0) * 1000
    if (tokenSignal.value !== undefined && exp < Date.now()) {
        return tokenSignal.value
    }
    try {
        let token = await get<string | undefined>(tokenKey, authStore)
        if (token !== undefined && jwtExpired(token)) {
            token = undefined
        }
        if (token === undefined) {
            const refresh = await get<string | undefined>(refreshKey, authStore)
            if (refresh === undefined || jwtExpired(refresh)) {
                tokenSignal.value = null
                return null
            }

            const result = await authAPI.refresh({ refresh: refresh })

            token = result.token

            await setMany(
                [
                    [tokenKey, result.token],
                    [refreshKey, result.refresh],
                ],
                authStore,
            )
        }

        tokenSignal.value = token
        return token
    } catch (e) {
        if (e instanceof FetchError && e.status === 401) {
            tokenSignal.value = null
            return null
        }
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
    const loading = token === undefined

    if (!token) {
        return [null, loading]
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

// call getToken to populate the token signal
getToken()
