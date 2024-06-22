import { h } from 'preact'
import styles from './install-prompt.module.css'
import { Outcome, useInstallPrompt } from '../hooks/use-insall-prompt'
import { usePersistentState } from '../hooks/use-persistent-state'
import { useCallback } from 'preact/hooks'
import { openToast } from './toast'

h

export function FloatingInstallPrompt() {
    const [baseInstall, canInstall] = useInstallPrompt()
    const [state, setState] = usePersistentState<'ready' | Outcome>(
        'before-install-prompt-outcome',
        'ready',
    )

    const install = useCallback(async () => {
        const choice = await baseInstall()
        setState(choice.outcome)
        if (choice.outcome === 'dismissed') {
            await openToast(
                'Install canceled. You can install from the Account page at any time',
            )
        }
    }, [baseInstall])

    const dismiss = useCallback(() => {
        setState('dismissed')
    }, [])

    if (!canInstall || state !== 'ready') {
        return <></>
    }

    return (
        <div class={styles.installPrompt}>
            <h3>Install Wishist</h3>
            <p>Add Wishist to your home screen</p>
            <div class={styles.buttons}>
                <button class='default lg' onClick={dismiss}>
                    Dismiss
                </button>
                <button class='primary lg' onClick={install}>
                    Install
                </button>
            </div>
        </div>
    )
}
