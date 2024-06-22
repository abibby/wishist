import { useCallback, useEffect, useState } from 'preact/hooks'

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

export function useInstallPrompt(): [() => Promise<UserChoice>, boolean] {
    const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent>()

    useEffect(() => {
        const beforeInstallPrompt = (e: Event) => {
            e.preventDefault()

            setInstallEvent(e as BeforeInstallPromptEvent)
        }
        window.addEventListener('beforeinstallprompt', beforeInstallPrompt)
        return () =>
            window.removeEventListener(
                'beforeinstallprompt',
                beforeInstallPrompt,
            )
    }, [])

    const install = useCallback(async (): Promise<UserChoice> => {
        if (installEvent === undefined) {
            return { outcome: 'dismissed', platform: '' }
        }

        return await installEvent.prompt()
    }, [installEvent])

    return [install, installEvent !== undefined]
}
