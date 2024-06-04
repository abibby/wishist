import EventTarget, { Event } from 'event-target-shim'
import { h } from 'preact'
import { useEffect, useState } from 'preact/hooks'
import styles from './toast.module.css'

h

let lastID = 0
type ToastData = {
    id: number
    message: string
    durationMs: number
}

class OpenEvent extends Event<'open'> {
    constructor(public readonly data: ToastData) {
        super('open')
    }
}
class CloseEvent extends Event<'close'> {
    constructor(public readonly id: number) {
        super('close')
    }
}

type ToastEventMap = {
    open: OpenEvent
    close: CloseEvent
}
const toastEvents = new EventTarget<ToastEventMap, 'strict'>()

export async function openToast(msg: string): Promise<void> {
    return new Promise(resolve => {
        const data: ToastData = {
            id: lastID++,
            message: msg,
            durationMs: 5000,
        }
        toastEvents.dispatchEvent(new OpenEvent(data))
        setTimeout(() => {
            toastEvents.dispatchEvent(new CloseEvent(data.id))
        }, data.durationMs)

        function onclose(e: CloseEvent) {
            if (e.id !== data.id) {
                return
            }
            resolve()
            toastEvents.removeEventListener('close', onclose)
        }
        toastEvents.addEventListener('close', onclose)
    })
}

export function ToastController() {
    const [toasts, setToasts] = useState<ToastData[]>([])

    useEffect(() => {
        function onopen(e: OpenEvent) {
            setToasts(toasts => toasts.concat([e.data]))
        }
        function onclose(e: CloseEvent) {
            setToasts(toasts => toasts.filter(t => t.id !== e.id))
        }

        toastEvents.addEventListener('open', onopen)
        toastEvents.addEventListener('close', onclose)
        return () => {
            toastEvents.removeEventListener('open', onopen)
            toastEvents.removeEventListener('close', onclose)
        }
    }, [])
    return (
        <div class={styles.controller}>
            {toasts.map(t => (
                <div class={styles.toast}>{t.message}</div>
            ))}
        </div>
    )
}
