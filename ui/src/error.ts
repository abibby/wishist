import { FetchError } from './api/internal'
import { openToast } from './components/toast'

function handleError(err: unknown) {
    if (err instanceof FetchError) {
        if (err.status === 500) {
        }
        openToast(err.message)
    } else if (err instanceof Error) {
        openToast(err.message)
    } else {
        openToast('unknown error')
    }
    console.error(err)
}

window.addEventListener('error', e => {
    handleError(e.error)
})
window.addEventListener('unhandledrejection', e => {
    handleError(e.reason)
})
