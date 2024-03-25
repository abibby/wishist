import { apiFetch } from './internal'

export interface CreateUserRequest {
    name: string
    email: string
    username: string
    password: string
}

export async function userCreate(request: CreateUserRequest): Promise<unknown> {
    return await apiFetch(
        '/user',
        {},
        {
            method: 'POST',
            body: JSON.stringify(request),
        },
    )
}

export interface ForgotPasswordRequest {
    email: string
}
export async function forgotPassword(
    request: ForgotPasswordRequest,
): Promise<unknown> {
    return await apiFetch(
        '/user/password/forgot',
        {},
        {
            method: 'POST',
            body: JSON.stringify(request),
        },
    )
}

export interface ResetPasswordRequest {
    token: string
    password: string
}
export async function resetPassword(
    request: ResetPasswordRequest,
): Promise<unknown> {
    return await apiFetch(
        '/user/password/reset',
        {},
        {
            method: 'POST',
            body: JSON.stringify(request),
        },
    )
}
