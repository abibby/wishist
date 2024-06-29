import { h } from 'preact'
import { LoginForm } from '../login-form'
import { Modal, useCloseModal } from '../modal'
import { useRoute } from 'preact-iso'

h

export function LoginModal() {
    const { query } = useRoute()
    const { message } = query
    const close = useCloseModal()
    return (
        <Modal title='Login'>
            {message && <p>{message}</p>}
            <LoginForm onLogin={close} />
        </Modal>
    )
}
