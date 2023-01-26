import { apiFetch } from './internal'

export interface InviteResponse {
    invite_token: string
}

export async function invite(): Promise<InviteResponse> {
    return apiFetch('/invite')
}
