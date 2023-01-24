import { bindValue } from '@zwzn/spicy'
import { h } from 'preact'
import { FormComponent, FormComponentProps } from './form-component'

h

export type InputType = 'text' | 'number' | 'password'

export interface InputProps extends FormComponentProps {
    type: InputType
    value: string
    onInput: (value: string, event: Event) => void
}

export function Input(props: InputProps) {
    return (
        <FormComponent {...props}>
            <input
                type={props.type}
                value={props.value}
                onInput={bindValue(props.onInput)}
            />
        </FormComponent>
    )
}
