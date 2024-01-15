import { h, RenderableProps } from 'preact'
import styles from './form-component.module.css'

h

export interface FormComponentProps {
    title: string
    error?: string[]
}

export function FormComponent({
    title,
    error,
    children,
}: RenderableProps<FormComponentProps>) {
    return (
        <label class={styles.wrapper}>
            <div class={styles.title}>{title}</div>
            {children}
            {error && <div class={styles.error}>{error}</div>}
        </label>
    )
}
