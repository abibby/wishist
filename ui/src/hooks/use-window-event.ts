import { useEffect } from 'preact/hooks'
export function useWindowEvent<K extends keyof WindowEventMap>(
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => void,
): void {
    useEffect(() => {
        const cb = listener
        window.addEventListener(type, cb)
        return () => window.removeEventListener(type, cb)
    }, [type, listener])
}
