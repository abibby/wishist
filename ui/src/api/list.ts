import { apiFetch } from './internal'

export interface Item {
    id: number
    user_id: number
    name: string
    description: string
    url: string
}

export interface ListRequest {
    user: string
}
export type ListResponse = Item[]

export async function list(request: ListRequest): Promise<ListResponse> {
    return apiFetch(`/list?user=${request.user}`)
}

export type ListAddRequest = Omit<Item, 'id'>
export type ListAddResponse = Item

export async function listAdd(
    request: ListAddRequest,
): Promise<ListAddResponse> {
    return apiFetch(`/list/add`, {
        method: 'POST',
        body: JSON.stringify(request),
    })
}

export type ListRemoveRequest = {
    item_id: number
}
export type ListRemoveResponse = Item

export async function listRemove(
    request: ListRemoveRequest,
): Promise<ListRemoveResponse> {
    return apiFetch(`/list/remove`, {
        method: 'POST',
        body: JSON.stringify(request),
    })
}

export type ListEditRequest = Omit<Item, 'user_id'>
export type ListEditResponse = Item

export async function listEdit(
    request: ListEditRequest,
): Promise<ListEditResponse> {
    return apiFetch(`/list/edit`, {
        method: 'POST',
        body: JSON.stringify(request),
    })
}
