import { computed, signal } from '@preact/signals-core'
import { useSignalValue } from './signal'

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

const installEvent = signal<BeforeInstallPromptEvent | undefined>(undefined)

window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault()

    if (isBeforeInstallPromptEvent(e)) {
        installEvent.value = e
    }
})

const comp = computed((): [() => Promise<UserChoice>, boolean] => [
    installEvent.value?.prompt ?? noopInstall,
    installEvent.value !== undefined,
])

export function useInstallPrompt(): [() => Promise<UserChoice>, boolean] {
    return useSignalValue(comp)
}

async function noopInstall(): Promise<UserChoice> {
    return { outcome: 'dismissed', platform: '' }
}

function isBeforeInstallPromptEvent(v: Event): v is BeforeInstallPromptEvent {
    return 'prompt' in v && 'platforms' in v && 'userChoice' in v
}
