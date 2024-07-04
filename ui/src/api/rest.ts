import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { FetchError, apiFetch } from './internal'
import { Event, EventTarget } from '../events'
import { EntityTable, IDType } from 'dexie'
import { authChanges } from '../auth'

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

export type NoArgs = { __no_args__: symbol }
export function buildRestModel<
    T extends Record<string, unknown>,
    K extends keyof T & string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TListRequest extends Partial<T> | NoArgs = NoArgs,
    TCreateRequest = T extends { id: unknown } ? Omit<T, 'id'> : T,
    TUpdateRequest = T,
    TDeleteRequest = T extends { id: unknown } ? Pick<T, 'id'> : T,
>(url: string, pkey: K, table: EntityTable<T, K>) {
    const buss = new EventTarget<Record<string, ModelEvent<T>>>()

    async function put(e: ModelEvent<T>): Promise<void> {
        await table.bulkPut(e.models)
    }
    async function remove(e: ModelEvent<T>): Promise<void> {
        await table.bulkDelete(e.models.map(m => m[pkey] as IDType<T, K>))
    }

    buss.addEventListener('update', put)
    buss.addEventListener('create', put)
    buss.addEventListener('delete', remove)

    return {
        useListFirst(
            ...request: TListRequest extends NoArgs ? [] : [TListRequest]
        ): [T | undefined, FetchError | undefined] {
            const [models, fetchError] = this.useList(...request)
            if (models && models.length === 0) {
                return [
                    undefined,
                    new FetchError('404 Not Found', 404, {
                        error: 'Not Found',
                        status: 404,
                    }),
                ]
            }
            return [models?.[0], fetchError]
        },
        useList(
            ...request: TListRequest extends NoArgs ? [] : [TListRequest]
        ): [T[] | undefined, FetchError | undefined] {
            const [auth, setAuth] = useState(0)
            const req = useMemo(() => {
                return request
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [JSON.stringify(request)])

            useEffect(() => {
                function authChange() {
                    setAuth(a => a + 1)
                }
                authChanges.addEventListener('change', authChange)
                return () =>
                    authChanges.removeEventListener('change', authChange)
            })

            const matchRef = useRef<(model: T) => boolean>(() => false)
            const [result, setResult] = useState<T[]>()
            const [err, setErr] = useState<FetchError>()
            useEffect(() => {
                const filters = req[0]
                matchRef.current = (model: T) => match(model, filters)
                this.list(...req)
                    .then(models => {
                        setResult(models)
                        setErr(undefined)
                    })
                    .catch(e => {
                        setResult(undefined)
                        if (e instanceof FetchError) {
                            setErr(e)
                        } else {
                            setErr(undefined)
                            throw e
                        }
                    })

                if (filters) {
                    table
                        .where(firstOrAll(Object.keys(filters)))
                        .equals(firstOrAll(Object.values(filters)))
                        .toArray()
                        .then(models => {
                            setResult(models)
                            setErr(undefined)
                        })
                } else {
                    table.toArray().then(models => {
                        setResult(models)
                        setErr(undefined)
                    })
                }
            }, [req, auth])

            useEffect(() => {
                const create = (e: ModelEvent<T>) => {
                    setResult(r => r?.concat(e.models.filter(matchRef.current)))
                }
                const update = (e: ModelEvent<T>) => {
                    setResult(r =>
                        r?.map(r => {
                            for (const model of e.models) {
                                if (idsMatch(r, model, pkey)) {
                                    return model
                                }
                            }
                            return r
                        }),
                    )
                }
                const del = (e: ModelEvent<T>) => {
                    setResult(r =>
                        r?.filter(r => {
                            for (const model of e.models) {
                                if (idsMatch(r, model, pkey)) {
                                    return false
                                }
                            }
                            return true
                        }),
                    )
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
            return [result, err]
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
