import { apiFetch } from './internal'

export interface User {
    id: number
    name: string
    username: string
    email: string
}

export async function user(): Promise<User> {
    return await apiFetch('/user', {})
}

export interface CreateUserRequest {
    name: string
    email: string
    username: string
    password: string
}

export async function userCreate(request: CreateUserRequest): Promise<User> {
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

export interface ChangePasswordRequest {
    old_password: string
    new_password: string
}
export async function changePassword(
    request: ChangePasswordRequest,
): Promise<unknown> {
    return await apiFetch(
        '/user/password/change',
        {},
        {
            method: 'POST',
            body: JSON.stringify(request),
        },
    )
}
