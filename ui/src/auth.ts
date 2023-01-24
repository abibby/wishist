import { createStore, delMany, get, set, setMany } from 'idb-keyval'
import jwt from './jwt'

const tokenStore = createStore('auth-tokens', 'auth-tokens')
const tokenKey = 'token'
const refreshKey = 'refresh'

export async function getToken(): Promise<string | null> {
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
        }).then(r => r.json())

        token = response.token

        await Promise.all([
            set(tokenKey, response.token, tokenStore),
            set(refreshKey, response.refresh, tokenStore),
        ])
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
    const response = await fetch('/login', {
        method: 'POST',
        body: JSON.stringify({
            username: username,
            password: password,
        }),
    }).then(r => r.json())

    await setMany(
        [
            [tokenKey, response.token],
            [refreshKey, response.refresh],
        ],
        tokenStore,
    )
}

export async function logout() {
    await delMany([tokenKey, refreshKey], tokenStore)
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
