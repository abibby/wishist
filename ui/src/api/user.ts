import { apiFetch } from './internal'

export type User = {
    id: number
    name: string
    username: string
}

export async function currentUser(): Promise<User> {
    return await apiFetch('/user/current', {})
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
            withoutToken: true,
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
            withoutToken: true,
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
