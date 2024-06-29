import { signal } from '@preact/signals-core'
import { useSignalValue } from './signal'
import { useCallback } from 'preact/hooks'

export type Outcome = 'accepted' | 'dismissed'
export interface UserChoice {
    outcome: 'accepted' | 'dismissed'
    platform: string
}

/**
 * The BeforeInstallPromptEvent is fired at the Window.onbeforeinstallprompt handler
 * before a user is prompted to "install" a web site to a home screen on mobile.
 *
 */
export interface BeforeInstallPromptEvent extends Event {
    /**
     * Returns an array of DOMString items containing the platforms on which the event was dispatched.
     * This is provided for user agents that want to present a choice of versions to the user such as,
     * for example, "web" or "play" which would allow the user to chose between a web version or
     * an Android version.
     */
    readonly platforms: Array<string>

    /**
     * Returns a Promise that resolves to a DOMString containing either "accepted" or "dismissed".
     */
    readonly userChoice: Promise<UserChoice>

    /**
     * Allows a developer to show the install prompt at a time of their own choosing.
     * This method returns a Promise.
     */
    prompt(): Promise<UserChoice>
}

let installEvent: BeforeInstallPromptEvent | undefined
const installEventReady = signal(false)

window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()

    if (isBeforeInstallPromptEvent(e)) {
        installEventReady.value = true
        installEvent = e
    }
})

export function useInstallPrompt(): [() => Promise<UserChoice>, boolean] {
    const ready = useSignalValue(installEventReady)

    const install = useCallback(async (): Promise<UserChoice> => {
        if (installEvent) {
            installEvent.prompt()
            return installEvent.userChoice
        }
        return { outcome: 'dismissed', platform: '' }
    }, [])

    return [install, ready]
}

function isBeforeInstallPromptEvent(v: Event): v is BeforeInstallPromptEvent {
    return 'prompt' in v && 'platforms' in v && 'userChoice' in v
}
