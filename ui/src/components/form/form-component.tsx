import { h, RenderableProps } from 'preact'
import styles from './form-component.module.css'
import { FetchError } from '../../api/internal'

h

export interface FormComponentProps {
    title: string
    fetchError?: FetchError
    name?: string
}

export function FormComponent({
    title,
    children,
    fetchError,
    name,
}: RenderableProps<FormComponentProps>) {
    let errMsg = undefined

    const errors = fetchError?.body.fields?.[name ?? ''] ?? []
    if (errors.length > 0) {
        errMsg = errors.join(', ')
    }

    return (
        <label class={styles.wrapper}>
            <div class={styles.title}>
                {title}
                {errMsg && <span class={styles.errorMessage}>{errMsg}</span>}
            </div>
            {children}
        </label>
    )
}
