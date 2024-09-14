declare module 'virtual:pwa-register' {
    export function registerSW(options: {
        immediate?: boolean
        onNeedRefresh?: () => void
        onOfflineReady?: () => void
        onRegistered?: (registration: ServiceWorkerRegistration) => void
        onRegisteredSW?: (
            path: string,
            registration: ServiceWorkerRegistration,
        ) => void
        onRegisterError?: (err: unknown) => void
    }): () => Promise<void>
}
