import { h } from 'preact'
import { LoginForm } from '../login-form'
import { Modal, ModalProps } from '../modal'

h

interface LoginModalProps extends ModalProps<void> {
    message?: string
}

export function LoginModal({ message, close }: LoginModalProps) {
    return (
        <Modal title='Login' close={close}>
            {message && <p>{message}</p>}
            <LoginForm onLogin={close} />
        </Modal>
    )
}
