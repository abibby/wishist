import { apiFetch } from './internal'

export interface CreateUserRequest {
    name: string
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
