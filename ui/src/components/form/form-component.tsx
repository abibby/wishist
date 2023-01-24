import { h, RenderableProps } from 'preact'

h

export interface FormComponentProps {
    title: string
}

export function FormComponent({
    title,
    children,
}: RenderableProps<FormComponentProps>) {
    return (
        <label>
            <div>{title}</div>
            <div>{children}</div>
        </label>
    )
}
