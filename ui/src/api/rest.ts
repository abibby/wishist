import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { apiFetch } from './internal'
import { FetchError } from './fetch-error'
import { Event, EventTarget } from '../events'
import { EntityTable, IDType } from 'dexie'
import { useUser } from '../auth'

class ModelEvent<T> extends Event {
    constructor(type: string, public readonly models: T[]) {
        super(type)
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function idsMatch(a: any, b: any, pkey: string): boolean {
    return pkey in a && pkey in b && a[pkey] === b[pkey]
}

function match<T extends Record<string, unknown>>(
    model: T,
    filter?: Partial<T>,
): boolean {
    if (filter === undefined) {
        return true
    }
    for (const [key, value] of Object.entries(filter)) {
        if (model[key] !== value) {
            return false
        }
    }
    return true
}

function firstOrAll<T>(v: T[]): T | T[] {
    if (v.length === 1) {
        return v[0]
    }
    return v
}

type UseListStatus = 'loading' | 'cache' | 'network'

export type NoArgs = { __no_args__: symbol }
export function buildRestModel<
    T extends Record<string, unknown>,
    K extends keyof T & string,
    TListRequest extends Partial<T> | NoArgs = NoArgs,
    TCreateRequest = T extends { id: unknown } ? Omit<T, 'id'> : T,
    TUpdateRequest = T,
    TDeleteRequest = T extends { id: unknown } ? Pick<T, 'id'> : T,
>(url: string, pkey: K, table: EntityTable<T, K>) {
    const buss = new EventTarget<Record<string, ModelEvent<T>>>()

    async function put(e: ModelEvent<T>): Promise<void> {
        await table.bulkPut(e.models).catch(console.warn)
    }
    async function remove(e: ModelEvent<T>): Promise<void> {
        await table
            .bulkDelete(e.models.map(m => m[pkey] as IDType<T, K>))
            .catch(console.warn)
    }

    buss.addEventListener('update', put)
    buss.addEventListener('create', put)
    buss.addEventListener('delete', remove)

    return {
        useListFirst(
            ...request: TListRequest extends NoArgs
                ? []
                : [request: TListRequest]
        ): [T | undefined, FetchError | undefined, UseListStatus] {
            const [models, fetchError, status] = this.useList(...request)
            if (status === 'network' && models && models.length === 0) {
                return [
                    undefined,
                    new FetchError('404 Not Found', 404, {
                        error: 'Not Found',
                        status: 404,
                    }),
                    status,
                ]
            }
            return [models?.[0], fetchError, status]
        },
        useList(
            ...request: TListRequest extends NoArgs
                ? []
                : [request: TListRequest]
        ): [T[] | undefined, FetchError | undefined, UseListStatus] {
            const req = useMemo(() => {
                return request
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [JSON.stringify(request)])

            const [user] = useUser()

            const matchRef = useRef<(model: T) => boolean>(() => false)
            const [result, setResult] = useState<
                [T[] | undefined, FetchError | undefined, UseListStatus]
            >([undefined, undefined, 'loading'])
            useEffect(() => {
                const filters = req[0]
                matchRef.current = (model: T) => match(model, filters)

                // Network fetch
                void (async () => {
                    try {
                        const models = await this.list(...req)
                        setResult([models, undefined, 'network'])
                    } catch (e) {
                        if (e instanceof FetchError) {
                            setResult(([value, err, status]) => {
                                if (value !== undefined) {
                                    return [value, err, status]
                                }
                                return [undefined, e, 'network']
                            })
                        } else {
                            throw e
                        }
                    }
                })()

                // Cache fetch
                void (async () => {
                    let models: T[]
                    if (filters) {
                        models = await table
                            .where(firstOrAll(Object.keys(filters)))
                            .equals(firstOrAll(Object.values(filters)))
                            .toArray()
                    } else {
                        models = await table.toArray()
                    }
                    setResult(([value, err, status]) => {
                        if (value !== undefined && status === 'network') {
                            return [value, err, status]
                        }
                        return [models, undefined, 'cache']
                    })
                })()
            }, [req, user?.id])

            useEffect(() => {
                const create = (e: ModelEvent<T>) => {
                    setResult(([models, err, state]) => [
                        models?.concat(e.models.filter(matchRef.current)),
                        err,
                        state,
                    ])
                }
                const update = (e: ModelEvent<T>) => {
                    setResult(([models, err, state]) => [
                        models?.map(model => {
                            for (const newModel of e.models) {
                                if (idsMatch(model, newModel, pkey)) {
                                    return model
                                }
                            }
                            return model
                        }),
                        err,
                        state,
                    ])
                }
                const del = (e: ModelEvent<T>) => {
                    setResult(([models, err, state]) => [
                        models?.filter(r => {
                            for (const model of e.models) {
                                if (idsMatch(r, model, pkey)) {
                                    return false
                                }
                            }
                            return true
                        }),
                        err,
                        state,
                    ])
                }
                buss.addEventListener('create', create)
                buss.addEventListener('update', update)
                buss.addEventListener('delete', del)
                return () => {
                    buss.removeEventListener('create', create)
                    buss.removeEventListener('update', update)
                    buss.removeEventListener('delete', del)
                }
            }, [])
            return result
        },
        async list(
            ...request: TListRequest extends NoArgs ? [] : [TListRequest]
        ): Promise<T[]> {
            const models = await apiFetch<T[]>(url, request[0] ?? null)
            buss.dispatchEvent(new ModelEvent('update', models))
            return models
        },
        async create(request: TCreateRequest): Promise<T> {
            const model = await apiFetch<T>(url, null, {
                method: 'POST',
                body: JSON.stringify(request),
            })
            buss.dispatchEvent(new ModelEvent('create', [model]))
            return model
        },
        async update(request: TUpdateRequest): Promise<T> {
            const model = await apiFetch<T>(url, null, {
                method: 'PUT',
                body: JSON.stringify(request),
            })
            buss.dispatchEvent(new ModelEvent('update', [model]))
            return model
        },
        async delete(request: TDeleteRequest): Promise<T> {
            buss.dispatchEvent(new ModelEvent('delete', [request]))
            return apiFetch(url, null, {
                method: 'DELETE',
                body: JSON.stringify(request),
            })
        },
    }
}
