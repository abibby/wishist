import { Event, EventTarget } from './events'
import { createStore, delMany, get, set, setMany } from 'idb-keyval'
import { useEffect, useState } from 'preact/hooks'
import jwt from './jwt'
import { User, currentUser } from './api/user'
import { FetchError } from './api/internal'
import { authAPI } from './api'

const authStore = createStore('auth-tokens', 'auth-tokens')
const tokenKey = 'token'
const refreshKey = 'refresh'
const userKey = 'user'

type ChangeEventMap = {
    change: Event<'change'>
}
export const authChanges = new EventTarget<ChangeEventMap, 'strict'>()

let _token: string | undefined
let _user: User | undefined
let _userPromise: Promise<User> | undefined

export async function getUser(): Promise<User | null> {
    if (_user !== undefined) {
        return _user
    }

    try {
        let u = await get<User | undefined>(userKey, authStore)
        if (u != undefined) {
            _user = u
            return u
        }
        if (_userPromise === undefined) {
            _userPromise = currentUser()
        }
        u = await _userPromise
        _userPromise = undefined
        _user = u
        await set(userKey, u, authStore)
        return u
    } catch (e) {
        if (e instanceof FetchError && e.status === 401) {
            // fallthrough
        } else {
            console.warn(e)
        }
        return null
    }
}

export async function getToken(): Promise<string | null> {
    if (_token !== undefined) {
        return _token
    }
    try {
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

            await setMany(
                [
                    [tokenKey, result.token],
                    [refreshKey, result.refresh],
                ],
                authStore,
            )
            authChanges.dispatchEvent(new Event('change'))
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

export async function login(
    username: string,
    password: string,
): Promise<boolean> {
    const data = await authAPI.login({
        username: username,
        password: password,
    })
    _token = data.token

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
    authChanges.dispatchEvent(new Event('change'))
    return true
}

export async function logout() {
    _token = undefined
    _user = undefined
    try {
        await delMany([tokenKey, refreshKey, userKey], authStore)
    } catch (e) {
        console.error(e)
    }
    authChanges.dispatchEvent(new Event('change'))
}

export async function userID(): Promise<number | undefined> {
    const token = await getToken()
    if (token === null) {
        return undefined
    }
    return Number(jwt.parse(token).claims.sub)
}

export async function username(): Promise<string | undefined> {
    const user = await getUser()
    if (user === null) {
        return undefined
    }
    return user.username
}

export function useUser(): User | null {
    const [user, setUser] = useState<User | null>(null)
    useEffect(() => {
        const change = async () => {
            setUser(await getUser())
        }
        authChanges.addEventListener('change', change)
        change()

        return () => {
            authChanges.removeEventListener('change', change)
        }
    }, [setUser])
    return user
}
