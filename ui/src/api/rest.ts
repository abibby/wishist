import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { FetchError, apiFetch } from './internal'
import { Event, EventTarget } from '../events'

class ModelEvent<T> extends Event {
    constructor(type: string, public readonly models: T[]) {
        super(type)
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function idsMatch(a: any, b: any, pkeys: string[]): boolean {
    if (pkeys.length === 0) {
        return false
    }
    for (const pkey of pkeys) {
        if (!(pkey in a && pkey in b) || a[pkey] !== b[pkey]) {
            return false
        }
    }
    return true
}

export type NoArgs = { __no_args__: symbol }
export function buildRestModel<
    T extends Record<keyof unknown, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TListRequest extends Record<string, any> | NoArgs = NoArgs,
    TCreateRequest = T extends { id: unknown } ? Omit<T, 'id'> : T,
    TUpdateRequest = T,
    TDeleteRequest = T extends { id: unknown } ? Pick<T, 'id'> : T,
>(
    url: string,
    pkeys: string[],
    match: (
        model: T,
        ...request: TListRequest extends NoArgs ? [] : [TListRequest]
    ) => boolean,
) {
    const buss = new EventTarget<Record<string, ModelEvent<T>>>()
    return {
        useList(
            ...request: TListRequest extends NoArgs ? [] : [TListRequest]
        ): [T[] | undefined, FetchError | undefined] {
            const req = useMemo(() => {
                return request
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [JSON.stringify(request)])

            const matchRef = useRef<(model: T) => boolean>(() => false)
            const [result, setResult] = useState<T[]>()
            const [err, setErr] = useState<FetchError>()
            useEffect(() => {
                matchRef.current = (model: T) => match(model, ...req)
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
            }, [req])

            useEffect(() => {
                const create = (e: ModelEvent<T>) => {
                    setResult(r => r?.concat(e.models.filter(matchRef.current)))
                }
                const update = (e: ModelEvent<T>) => {
                    setResult(r =>
                        r?.map(r => {
                            for (const model of e.models) {
                                if (idsMatch(r, model, pkeys)) {
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
                                if (idsMatch(r, model, pkeys)) {
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
