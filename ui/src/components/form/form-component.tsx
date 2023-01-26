import { h, RenderableProps } from 'preact'
import styles from './form-component.module.css'

h

export interface FormComponentProps {
    title: string
}

export function FormComponent({
    title,
    children,
}: RenderableProps<FormComponentProps>) {
    return (
        <label class={styles.wrapper}>
            <div class={styles.title}>{title}</div>
            {children}
        </label>
    )
}
