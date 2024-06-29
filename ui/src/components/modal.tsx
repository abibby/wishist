import { createContext, Fragment, h, Provider, RenderableProps } from 'preact'
import { useCallback, useContext, useMemo, useRef } from 'preact/hooks'
import styles from './modal.module.css'
import { LocationHook, LocationProvider, useLocation } from 'preact-iso'
import classNames from 'classnames'

h

const MODAL_QUERY = 'm'

let modalUUID = 0
type ModalContext = {
    uuid: number
    uri: string
    close(): void
    closing: boolean
}

const modalContext = createContext<ModalContext>({
    uuid: -1,
    uri: '',
    close() {},
    closing: false,
})

export function ModalController({ children }: RenderableProps<unknown>) {
    const loc = useLocation()
    const lastModals = useRef<(ModalContext | undefined)[]>([])
    const modals = useMemo<ModalContext[]>(() => {
        const url = new URL(loc.url, location.href)

        const uris: (string | undefined)[] =
            url.searchParams.getAll(MODAL_QUERY)
        const newModals: ModalContext[] = []
        let lastIndex = 0
        let index = 0

        while (index < uris.length || lastIndex < lastModals.current.length) {
            const last = lastModals.current[lastIndex]
            const uri = uris[index]

            if (uri && (!last || last.uri === uri)) {
                const uuid = last && !last.closing ? last.uuid : modalUUID++
                newModals.push({
                    uuid: uuid,
                    uri: uri,
                    close() {
                        const newURL = new URL(location.href)
                        newURL.searchParams.delete(MODAL_QUERY)

                        for (const modal of newModals) {
                            if (modal.uuid === uuid || modal.closing) {
                                continue
                            }

                            newURL.searchParams.append(MODAL_QUERY, modal.uri)
                        }
                        loc.route(newURL.toString())
                    },
                    closing: false,
                })
                lastIndex++
                index++
            } else if (last) {
                newModals.push({
                    ...last,
                    closing: true,
                })
                lastIndex++
            } else {
                throw new Error('no uri and last')
            }
        }

        lastModals.current = newModals

        return newModals
    }, [loc])

    const locationValues = useMemo(() => {
        return modals.map(m => {
            const url = m.uri
            const u = new URL(url, location.origin)
            const path = u.pathname.replace(/(.)\/$/g, '$1')
            return {
                ...loc,
                url,
                path,
                query: Object.fromEntries(u.searchParams),
            }
        })
    }, [loc, modals])
    const ModifiedLocationProvider: Provider<LocationHook> =
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        LocationProvider.ctx.Provider

    const Provider = modalContext.Provider
    return (
        <div>
            {modals.map((value, i) => (
                <ModifiedLocationProvider
                    key={value.uuid}
                    value={locationValues[i]}
                >
                    <Provider value={value}>{children}</Provider>
                </ModifiedLocationProvider>
            ))}
        </div>
    )
}

export interface ModalProps {
    title: string
    class?: string
}

export function Modal({
    title,
    children,
    class: className,
}: RenderableProps<ModalProps>) {
    const modal = useContext(modalContext)
    return (
        <Fragment>
            <div
                class={classNames(styles.screen, {
                    [styles.closing]: modal.closing,
                })}
                onClick={modal.close}
            />
            <div
                class={classNames(styles.modal, {
                    [styles.closing]: modal.closing,
                })}
            >
                <h2 class={styles.title}>{title}</h2>
                <button class={styles.close} onClick={modal.close}>
                    x
                </button>
                <div class={classNames(styles.body, className)}>{children}</div>
            </div>
        </Fragment>
    )
}

export function ModalActions({ children }: RenderableProps<unknown>) {
    return <div class={styles.actions}>{children}</div>
}

export function useOpenModal(): (modalURI: string) => void {
    const { route } = useLocation()
    return useCallback(
        uri => {
            const url = new URL(location.href)
            url.searchParams.append(MODAL_QUERY, uri)
            route(url.toString())
        },
        [route],
    )
}
export function useCloseModal(): () => void {
    const modal = useContext(modalContext)
    return useCallback(() => {
        modal.close()
    }, [modal])
}

export function DefaultModal() {
    return <Modal title=''>Not Found</Modal>
}
