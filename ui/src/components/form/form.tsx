import { useCallback, useState } from 'preact/hooks'
import { FetchError } from '../../api'
import { JSX, RenderableProps, createContext, h } from 'preact'
import styles from './form.module.css'

export const FormContext = createContext<FetchError | undefined>(undefined)

export interface FormProps extends JSX.HTMLAttributes<HTMLFormElement> {
    onSubmit(): Promise<void> | void
    onCleanup?: (err: Error | undefined) => void
}

export function Form({
    onSubmit,
    onCleanup,
    children,
    ...props
}: RenderableProps<FormProps>) {
    const [fetchError, setFetchError] = useState<FetchError>()
    const [errMsg, setErrMsg] = useState<string>()
    const submit = useCallback(
        async (e: Event) => {
            let err: Error | undefined
            e.preventDefault()
            try {
                await onSubmit()
            } catch (e) {
                if (e instanceof Error) {
                    err = e
                } else {
                    err = new Error('unknown error')
                }

                setErrMsg(err.message)
                if (e instanceof FetchError) {
                    setFetchError(e)
                } else {
                    throw e
                }
            } finally {
                onCleanup?.(err)
            }
        },
        [onCleanup, onSubmit],
    )

    let errElem: JSX.Element | undefined
    if (errMsg !== undefined && fetchError?.body.fields === undefined) {
        errElem = <div class={styles.errorMessage}>{errMsg}</div>
    }

    return (
        <FormContext.Provider value={fetchError}>
            <form {...props} onSubmit={submit}>
                {errElem}
                {children}
            </form>
        </FormContext.Provider>
    )
}
