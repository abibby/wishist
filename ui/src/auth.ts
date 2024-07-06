import { Event, EventTarget } from './events'
import { createStore, delMany, get, setMany } from 'idb-keyval'
import jwt from './jwt'
import { User, currentUser } from './api/user'
import { FetchError, authAPI } from './api'
import { signal } from '@preact/signals-core'
import { useSignalValue } from './hooks/signal'
import { LoginResponse } from './api/auth'

const authStore = createStore('auth-tokens', 'auth-tokens')
const tokenKey = 'token'
const refreshKey = 'refresh'

type ChangeEventMap = {
    change: Event<'change'>
}
let _token: string | undefined
const userSignal = signal<User | null | undefined>(undefined)
export const authChanges = new EventTarget<ChangeEventMap, 'strict'>()

authChanges.addEventListener('change', async () => {
    try {
        userSignal.value = await currentUser()
    } catch (e) {
        if (e instanceof FetchError && e.status === 401) {
            userSignal.value = null
            return
        }
        throw e
    }
})
authChanges.dispatchEvent(new Event('change'))

export async function getToken(): Promise<string | null> {
    if (_token !== undefined) {
        return _token
    }

    let token = await get<string | undefined>(tokenKey, authStore)
    if (token !== undefined && jwtExpired(token)) {
        token = undefined
    }
    if (token === undefined) {
        const refresh = await get<string | undefined>(refreshKey, authStore)
        if (refresh === undefined || jwtExpired(refresh)) {
            return null
        }

        const result = await authAPI.refresh({ refresh: refresh })

        token = result.token
        _token = result.token
        setMany(
            [
                [tokenKey, result.token],
                [refreshKey, result.refresh],
            ],
            authStore,
        ).catch(console.warn)
        authChanges.dispatchEvent(new Event('change'))
    }

    return token ?? null
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

    await setAuthTokens(data)
}

export async function logout() {
    _token = undefined
    await delMany([tokenKey, refreshKey], authStore)
    authChanges.dispatchEvent(new Event('change'))
}

export function useUser(): [User | null, boolean] {
    const user = useSignalValue(userSignal)
    return [user ?? null, user !== undefined]
}

async function setAuthTokens(data: LoginResponse): Promise<void> {
    _token = data.token

    await setMany(
        [
            [tokenKey, data.token],
            [refreshKey, data.refresh],
        ],
        authStore,
    )
    authChanges.dispatchEvent(new Event('change'))
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
window.testSetAuthTokens = setAuthTokens
