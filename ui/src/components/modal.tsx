import { bind } from '@zwzn/spicy'
import EventTarget, { Event } from 'event-target-shim'
import { Fragment, FunctionalComponent, h, RenderableProps } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import styles from './modal.module.css'

h

let id = 0

/* eslint @typescript-eslint/no-explicit-any: 0 */

class ModalOpenEvent extends Event<'open'> {
    public readonly id: number
    constructor(
        public readonly modal: FunctionalComponent<any>,
        public readonly props: any,
    ) {
        super('open')
        this.id = id++
    }
}
class ModalCloseEvent<T> extends Event<'close'> {
    constructor(public readonly id: number, public readonly value: T) {
        super('close')
    }
}

type ModalEventMap = {
    open: ModalOpenEvent
    close: ModalCloseEvent<any>
    closeAll: Event<'closeAll'>
}

const modalEventTarget = new EventTarget<ModalEventMap>()

export function ModalController() {
    const [openModals, setOpenModals] = useState<ModalOpenEvent[]>([])

    useEffect(() => {
        const open = (event: ModalOpenEvent) => {
            setOpenModals(m => m.concat([event]))
        }
        const close = (event: ModalCloseEvent<any>) => {
            setOpenModals(m => m.filter(e => e.id !== event.id))
        }
        const closeAll = () => {
            setOpenModals([])
        }

        modalEventTarget.addEventListener('open', open)
        modalEventTarget.addEventListener('close', close)
        modalEventTarget.addEventListener('closeAll', closeAll)

        return () => {
            modalEventTarget.removeEventListener('open', open)
            modalEventTarget.removeEventListener('close', close)
            modalEventTarget.removeEventListener('closeAll', closeAll)
        }
    }, [setOpenModals])

    const close = useCallback((id: number, value: any) => {
        modalEventTarget.dispatchEvent(new ModalCloseEvent(id, value))
    }, [])

    return (
        <div>
            {openModals.map(e => {
                const Comp = e.modal
                return <Comp close={bind(e.id, close)} {...e.props} />
            })}
        </div>
    )
}

export interface ModalProps<TReturn> {
    title: string
    close: (value: TReturn | undefined) => void
}

export function Modal<TReturn>({
    title,
    close,
    children,
}: RenderableProps<ModalProps<TReturn>>) {
    return (
        <Fragment>
            <div class={styles.screen} onClick={bind(undefined, close)} />
            <div class={styles.modal}>
                <h2 class={styles.title}>{title}</h2>
                <button class={styles.close} onClick={bind(undefined, close)}>
                    x
                </button>
                <div class={styles.body}>{children}</div>
            </div>
        </Fragment>
    )
}

export async function openModal<T extends ModalProps<TReturn>, TReturn>(
    modal: FunctionalComponent<T>,
    props: Omit<T, keyof ModalProps<TReturn>>,
): Promise<TReturn | undefined> {
    return new Promise(resolve => {
        const openEvent = new ModalOpenEvent(modal, props)
        modalEventTarget.dispatchEvent(openEvent)

        function close(e: ModalCloseEvent<TReturn>) {
            if (e.id !== openEvent.id) {
                return
            }
            modalEventTarget.removeEventListener('close', close)
            resolve(e.value)
        }
        modalEventTarget.addEventListener('close', close)
    })
}

export function ModalActions({ children }: RenderableProps<{}>) {
    return <div class={styles.actions}>{children}</div>
}

export function closeModals(): void {
    modalEventTarget.dispatchEvent(new Event('closeAll'))
}
