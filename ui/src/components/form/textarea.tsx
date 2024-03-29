import { bindValue } from '@zwzn/spicy'
import { h } from 'preact'
import { FormComponent, FormComponentProps } from './form-component'
import styles from './form-component.module.css'

h

export interface TextAreaProps extends FormComponentProps {
    value: string
    onInput: (value: string, event: Event) => void
}

export function TextArea(props: TextAreaProps) {
    return (
        <FormComponent {...props}>
            <textarea
                class={styles.element}
                value={props.value}
                onInput={bindValue(props.onInput)}
            />
        </FormComponent>
    )
}
