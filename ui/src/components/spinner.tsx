import classNames from 'classnames'
import styles from './spinner.module.css'
import { h } from 'preact'
import { CheckCircle, XCircle } from 'preact-feather'

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

export function PageSpinner() {
    return (
        <div class={styles.pageSpinner}>
            <Spinner />
        </div>
    )
}
