import { bindValue } from '@zwzn/spicy'
import { h } from 'preact'
import { FormComponent, FormComponentProps } from './form-component'
import styles from './form-component.module.css'

export type InputType = 'text' | 'number' | 'password'

export interface InputProps extends FormComponentProps {
    type?: InputType
    value: string
    onInput: (value: string, event: Event) => void
}

export function Input(props: InputProps) {
    return (
        <FormComponent {...props}>
            <input
                class={styles.element}
                type={props.type}
                value={props.value}
                onInput={bindValue(props.onInput)}
                tabIndex={props.tabIndex}
            />
        </FormComponent>
    )
}
