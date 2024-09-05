import { FetchError } from './api'
import { openToast } from './components/toast'

async function handleError(err: unknown): Promise<void> {
    await openToast(errorMessage(err), {
        durationMs: -1,
    })
}
function errorMessage(err: unknown): string {
    if (err instanceof FetchError && err.body.fields !== undefined) {
        return Object.entries(err.body.fields)
            .flatMap(([, errors]) => errors)
            .join('\n')
    } else if (err instanceof Error) {
        return err.message
    } else {
        return 'unknown error'
    }
}

window.addEventListener('error', e => {
    void handleError(e.error)
})
window.addEventListener('unhandledrejection', e => {
    void handleError(e.reason)
})
