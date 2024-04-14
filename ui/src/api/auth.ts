import { apiFetch } from './internal'

export interface LoginRequest {
    username: string
    password: string
}
export interface LoginResponse {
    expires_in: number
    refresh: string
    token: string
    token_type: string
}
export async function login(request: LoginRequest): Promise<LoginResponse> {
    return await apiFetch(
        '/login',
        {},
        {
            method: 'POST',
            body: JSON.stringify(request),
            withoutToken: true,
        },
    )
}

export interface RefreshRequest {
    refresh: string
}
export async function refresh(request: RefreshRequest): Promise<LoginResponse> {
    return await apiFetch(
        '/login/refresh',
        {},
        {
            method: 'POST',
            body: JSON.stringify(request),
            withoutToken: true,
        },
    )
}
