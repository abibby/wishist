import { showGlobalSpinner } from './components/spinner'
import { openToast } from './components/toast'
import { registerSW } from 'virtual:pwa-register'

export function registerServiceWorker() {
    const updateSW = registerSW({
        async onNeedRefresh() {
            const updateAccepted = await openToast(
                'A new version is available. Would you like to update?',
                {
                    durationMs: -1,
                    buttons: {
                        Yes: true,
                        No: false,
                    },
                },
            )
            // console.log('sw', updateSW, updateAccepted)
            if (updateAccepted) {
                showGlobalSpinner()
                updateSW()
            }
        },
        async onOfflineReady() {
            await openToast('Ready to work offline')
        },
    })
}
