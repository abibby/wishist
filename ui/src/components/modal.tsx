import { bind } from '@zwzn/spicy'
import EventTarget, { Event } from 'event-target-shim'
import { Fragment, FunctionalComponent, h, RenderableProps } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'
import styles from './modal.module.css'

h

let id = 0

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
class ModalCloseEvent extends Event<'close'> {
    constructor(public readonly id: number) {
        super('close')
    }
}

type ModalEventMap = {
    open: ModalOpenEvent
    close: ModalCloseEvent
}

const modalEventTarget = new EventTarget<ModalEventMap>()

export function ModalController() {
    const [openModals, setOpenModals] = useState<ModalOpenEvent[]>([])

    useEffect(() => {
        const open = (event: ModalOpenEvent) => {
            setOpenModals(m => m.concat([event]))
        }
        const close = (event: ModalCloseEvent) => {
            setOpenModals(m => m.filter(e => e.id !== event.id))
        }

        modalEventTarget.addEventListener('open', open)
        modalEventTarget.addEventListener('close', close)

        return () => {
            modalEventTarget.removeEventListener('open', open)
            modalEventTarget.removeEventListener('close', close)
        }
    }, [setOpenModals])

    const close = useCallback((id: number) => {
        modalEventTarget.dispatchEvent(new ModalCloseEvent(id))
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

export interface ModalProps {
    title: string
    close: () => void
}

export function Modal({ title, close, children }: RenderableProps<ModalProps>) {
    return (
        <Fragment>
            <div class={styles.screen} onClick={close} />
            <div class={styles.modal}>
                <h2 class={styles.title}>{title}</h2>
                <button class={styles.close} onClick={close}>
                    x
                </button>
                <div class={styles.body}>{children}</div>
            </div>
        </Fragment>
    )
}

export async function openModal<T extends ModalProps>(
    modal: FunctionalComponent<T>,
    props: Omit<T, keyof ModalProps>,
) {
    modalEventTarget.dispatchEvent(new ModalOpenEvent(modal, props))
}

export function ModalActions({ children }: RenderableProps<{}>) {
    return <div class={styles.actions}>{children}</div>
}
