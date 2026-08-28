import classNames from 'classnames'
import styles from './spinner.module.css'
import { h } from 'preact'
import { CheckCircle, XCircle } from 'preact-feather'
import { signal } from '@preact/signals-core'
import { useSignalValue } from '../hooks/signal'

const showGlobalSpinnerSignal = signal<Record<number, boolean>>({})

export type SpinnerProps = {
    class?: string
    done?: boolean
    failed?: boolean
}

export function Spinner({ done, failed, class: className }: SpinnerProps) {
    if (failed) {
        return <XCircle class={classNames(styles.spinner, className)} />
    }
    if (done) {
        return <CheckCircle class={classNames(styles.spinner, className)} />
    }
    return (
        <span
            class={classNames(styles.spinner, styles.rainbow, className)}
        ></span>
    )
}

export function GlobalSpinner() {
    const show = useSignalValue(showGlobalSpinnerSignal)
    return (
        <div
            class={classNames(styles.pageSpinnerLine, {
                [styles.show]: Array.from(Object.keys(show)).length > 0,
            })}
        ></div>
    )
}
let id = 0
export function showGlobalSpinner(): () => void {
    const localID = id++
    showGlobalSpinnerSignal.value = {
        ...showGlobalSpinnerSignal.value,
        [localID]: true,
    }

    return () => {
        showGlobalSpinnerSignal.value = {
            ...showGlobalSpinnerSignal.value,
        }
        delete showGlobalSpinnerSignal.value[localID]
    }
}
