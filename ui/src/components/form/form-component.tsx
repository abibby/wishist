import { h, RenderableProps } from 'preact'
import styles from './form-component.module.css'
import { FormContext } from './form'
import { useContext, useLayoutEffect, useRef } from 'preact/hooks'

h

export interface FormComponentProps {
    title: string
    name?: string
    tabIndex?: number
    autoFocus?: boolean
}

export function FormComponent({
    title,
    children,
    name,
    autoFocus,
}: RenderableProps<FormComponentProps>) {
    const fetchError = useContext(FormContext)
    const labelRef = useRef<HTMLLabelElement | null>(null)
    useLayoutEffect(() => {
        if (autoFocus) {
            labelRef.current?.focus()
        }
    }, [autoFocus])
    let errMsg = undefined

    const errors = fetchError?.body.fields?.[name ?? ''] ?? []
    if (errors.length > 0) {
        errMsg = errors[0]
    }
    return (
        <label class={styles.wrapper} ref={labelRef}>
            <div class={styles.title}>
                {title}
                {errMsg && <span class={styles.errorMessage}>{errMsg}</span>}
            </div>
            {children}
        </label>
    )
}
