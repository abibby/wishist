import { Event, EventTarget } from '../events'
import styles from './toast.module.css'

let lastID = 0
export type ToastOptions<T = void> = {
    durationMs?: number
    requireAction?: boolean
    buttons?: Record<string, T>
}
type ToastData<T> = Required<ToastOptions<T>> & {
    id: number
    message: string
}

class OpenEvent extends Event<'open'> {
    constructor(public readonly data: ToastData<unknown>) {
        super('open')
    }
}
class CloseEvent extends Event<'close'> {
    constructor(public readonly id: number, public readonly value: unknown) {
        super('close')
    }
}

type ToastEventMap = {
    open: OpenEvent
    close: CloseEvent
}
const toastEvents = new EventTarget<ToastEventMap, 'strict'>()

export async function openToast<T = void>(
    msg: string,
    options: ToastOptions<T> = {},
): Promise<T | undefined> {
    return new Promise(resolve => {
        const data: ToastData<T> = {
            id: lastID++,
            message: msg,
            durationMs: 5000,
            requireAction: false,
            buttons: {},
            ...options,
        }
        toastEvents.dispatchEvent(new OpenEvent(data))
        if (data.durationMs > 0) {
            setTimeout(() => {
                toastEvents.dispatchEvent(new CloseEvent(data.id, undefined))
            }, data.durationMs)
        }

        function onclose(e: CloseEvent) {
            if (e.id !== data.id) {
                return
            }
            resolve(e.value as T | undefined)
            toastEvents.removeEventListener('close', onclose)
        }
        toastEvents.addEventListener('close', onclose)
    })
}

// Not using preact to prevent an infinite loop if there is an issue setting up
// preact
const toastWrapper = document.createElement('div')
toastWrapper.classList.add(styles.controller)
document.body.appendChild(toastWrapper)

toastEvents.addEventListener('open', e => {
    const { message, id } = e.data
    const toast = document.createElement('div')
    toast.classList.add(styles.toast)
    toast.dataset.id = String(id)
    toast.innerHTML = message
        .split('\n')
        .map(line => `<p>${line}</p>`)
        .join('\n')
    if (!e.data.requireAction) {
        toast.addEventListener('click', () => {
            toastEvents.dispatchEvent(new CloseEvent(id, undefined))
        })
    }

    for (const [text, value] of Object.entries(e.data.buttons)) {
        const button = document.createElement('button')
        button.innerText = text
        button.addEventListener('click', () => {
            toastEvents.dispatchEvent(new CloseEvent(id, value))
        })

        toast.prepend(button)
    }
    toastWrapper.appendChild(toast)
})
toastEvents.addEventListener('close', e => {
    const toasts = toastWrapper.querySelectorAll(`[data-id="${e.id}"]`)
    for (const toast of toasts) {
        toastWrapper.removeChild(toast)
    }
})
