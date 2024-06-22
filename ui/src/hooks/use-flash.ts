import { useCallback, useRef, useState } from 'preact/hooks'

export function useFlash(timeMs: number = 250): [boolean, () => void] {
    const [flash, setFlash] = useState(false)
    const activeTimeouts = useRef<ReturnType<typeof setTimeout>>()
    return [
        flash,
        useCallback(() => {
            setFlash(true)
            if (activeTimeouts.current !== undefined) {
                clearTimeout(activeTimeouts.current)
            }
            activeTimeouts.current = setTimeout(() => {
                setFlash(false)
            }, timeMs)
        }, [timeMs]),
    ]
}
