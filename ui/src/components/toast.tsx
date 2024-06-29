import { Event, EventTarget } from '../events'
import styles from './toast.module.css'

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

// Not using preact to prevent an infinite loop if there is an issue setting up
// preact
const toastWrapper = document.createElement('div')
toastWrapper.classList.add(styles.controller)
document.body.appendChild(toastWrapper)

toastEvents.addEventListener('open', e => {
    const { message, id } = e.data
    const toast = document.createElement('div')
    toast.dataset.id = String(id)
    toast.innerHTML = `<div class="${styles.toast}">
        ${message.split('\n').map(line => `<p>${line}</p>`)}
    </div>`
    toast.addEventListener('click', () => {
        toastEvents.dispatchEvent(new CloseEvent(id))
    })
    toastWrapper.appendChild(toast)
})
toastEvents.addEventListener('close', e => {
    const toasts = toastWrapper.querySelectorAll(`[data-id="${e.id}"]`)
    for (const toast of toasts) {
        toastWrapper.removeChild(toast)
    }
})
