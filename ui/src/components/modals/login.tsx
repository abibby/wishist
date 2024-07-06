import { h } from 'preact'
import { Modal, ModalActions, useCloseModal } from '../modal'
import { useRoute } from 'preact-iso'
import { useCallback, useState } from 'preact/hooks'
import { login } from '../../auth'
import { Form } from '../form/form'
import { Input } from '../form/input'

h

export function LoginModal() {
    const { query } = useRoute()
    const { message } = query
    const close = useCloseModal()

    const [user, setUser] = useState('')
    const [password, setPassword] = useState('')
    const loginSubmit = useCallback(async () => {
        await login(user, password)
        close()
    }, [user, password, close])

    return (
        <Modal title='Login'>
            {message && <p>{message}</p>}
            <Form onSubmit={loginSubmit}>
                <Input
                    title='Username'
                    type='text'
                    value={user}
                    onInput={setUser}
                    tabIndex={1}
                    autoFocus
                />
                <Input
                    title='Password'
                    type='password'
                    value={password}
                    onInput={setPassword}
                    tabIndex={2}
                />
                <ModalActions>
                    <a class='button' href={'/create-user'} tabIndex={5}>
                        Create User
                    </a>
                    <a class='button' href={'/forgot-password'} tabIndex={4}>
                        Forgot Password
                    </a>
                    <button class='light' type='submit' tabIndex={3}>
                        Login
                    </button>
                </ModalActions>
            </Form>
        </Modal>
    )
}
