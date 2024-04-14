import { apiFetch } from './internal'
export type NoArgs = { __no_args__: symbol }
export function buildRestModel<
    T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TListRequest extends Record<string, any> | NoArgs = NoArgs,
    TCreateRequest = T extends { id: unknown } ? Omit<T, 'id'> : T,
    TUpdateRequest = T,
    TDeleteRequest = T extends { id: unknown } ? Pick<T, 'id'> : T,
>(url: string) {
    return {
        async list(
            ...request: TListRequest extends NoArgs ? [] : [TListRequest]
        ): Promise<T[]> {
            return apiFetch(url, request[0] ?? null)
        },
        async create(request: TCreateRequest): Promise<T> {
            return apiFetch(url, null, {
                method: 'POST',
                body: JSON.stringify(request),
            })
        },
        async update(request: TUpdateRequest): Promise<T> {
            return apiFetch(url, null, {
                method: 'PUT',
                body: JSON.stringify(request),
            })
        },
        async delete(request: TDeleteRequest): Promise<T> {
            return apiFetch(url, null, {
                method: 'DELETE',
                body: JSON.stringify(request),
            })
        },
    }
}
