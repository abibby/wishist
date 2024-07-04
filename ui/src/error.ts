import { FetchError } from './api'
import { openToast } from './components/toast'

function handleError(err: unknown) {
    if (err instanceof FetchError && err.body.fields !== undefined) {
        openToast(
            Object.entries(err.body.fields)
                .flatMap(([, errors]) => errors)
                .join('\n'),
        )
    } else if (err instanceof Error) {
        openToast(err.message)
    } else {
        openToast('unknown error')
    }
}

window.addEventListener('error', e => {
    handleError(e.error)
})
window.addEventListener('unhandledrejection', e => {
    handleError(e.reason)
})
