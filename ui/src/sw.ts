import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope & { skipWaiting(): void }

precacheAndRoute(self.__WB_MANIFEST)

registerRoute(({ url }) => {
    return !url.pathname.startsWith('/api')
}, new NetworkFirst())

addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})
