import { Signal, effect } from '@preact/signals-core'
import { useEffect, useState } from 'preact/hooks'

export function useSignalValue<T>(s: Signal<T>): T {
    const [value, setValue] = useState(s.value)
    useEffect(() => {
        return effect(() => {
            setValue(s.value)
        })
    }, [s])
    return value
}
