import { h, RenderableProps } from 'preact'
import styles from './form-component.module.css'
import { FormContext } from './form'

h

export interface FormComponentProps {
    title: string
    name?: string
}

export function FormComponent({
    title,
    children,
    name,
}: RenderableProps<FormComponentProps>) {
    return (
        <FormContext.Consumer>
            {fetchError => {
                let errMsg = undefined

                const errors = fetchError?.body.fields?.[name ?? ''] ?? []
                if (errors.length > 0) {
                    errMsg = errors[0]
                }
                return (
                    <label class={styles.wrapper}>
                        <div class={styles.title}>
                            {title}
                            {errMsg && (
                                <span class={styles.errorMessage}>
                                    {errMsg}
                                </span>
                            )}
                        </div>
                        {children}
                    </label>
                )
            }}
        </FormContext.Consumer>
    )
}
