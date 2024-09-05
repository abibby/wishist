import { Event, EventTarget } from '../events'
import styles from './toast.module.css'

let lastID = 0
type ToastOptions = {
    durationMs: number
}
type ToastData = ToastOptions & {
    id: number
    message: string
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

export async function openToast(
    msg: string,
    options: Partial<ToastOptions> = {},
): Promise<void> {
    return new Promise(resolve => {
        const data: ToastData = {
            id: lastID++,
            message: msg,
            durationMs: 5000,
            ...options,
        }
        toastEvents.dispatchEvent(new OpenEvent(data))

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

// Not using preact to prevent an infinite loop if there is an issue setting up
// preact
const toastWrapper = document.createElement('div')
toastWrapper.classList.add(styles.controller)
document.body.appendChild(toastWrapper)

toastEvents.addEventListener('open', e => {
    const { message, id, durationMs } = e.data
    const toast = document.createElement('div')
    toast.dataset.id = String(id)
    toast.classList.add(styles.toast)
    toast.innerHTML = message
        .split('\n')
        .map(line => `<p>${line}</p>`)
        .join('')
    const closeBtn = document.createElement('button')

    closeBtn.innerText = 'x'
    closeBtn.classList.add(styles.close)

    closeBtn.addEventListener('click', () => {
        toastEvents.dispatchEvent(new CloseEvent(id))
    })
    toast.prepend(closeBtn)
    toastWrapper.appendChild(toast)

    if (durationMs > 0) {
        setTimeout(() => {
            toastEvents.dispatchEvent(new CloseEvent(id))
        }, durationMs)
    }
})
toastEvents.addEventListener('close', e => {
    const toasts = toastWrapper.querySelectorAll(`[data-id="${e.id}"]`)
    for (const toast of toasts) {
        toastWrapper.removeChild(toast)
    }
})
