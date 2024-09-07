import classNames from 'classnames'
import styles from './spinner.module.css'
import { h } from 'preact'

interface SpinnerProps {
    class?: string
}

export function Spinner(props: SpinnerProps) {
    return (
        <span class={classNames(styles.wrapper, props.class)}>
            <span class={styles.loader}></span>
        </span>
    )
}
