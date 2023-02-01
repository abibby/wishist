import { h } from 'preact'
import { route } from 'preact-router'
import { useCallback, useState } from 'preact/hooks'
import { login } from '../../auth'
import { Input } from '../form/input'
import { Modal, ModalActions, ModalProps } from '../modal'
import styles from './login.module.css'

h

interface LoginModalProps extends ModalProps {}

export function LoginModal({ close }: LoginModalProps) {
    const [user, setUser] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string>()
    const loginSubmit = useCallback(
        async (e: Event) => {
            e.preventDefault()
            const success = await login(user, password)
            if (!success) {
                setError('Invalid username or password')
                return
            }
            close()
        },
        [user, password, setError],
    )

    const createUser = useCallback(() => {
        route('/create-user')
        close()
    }, [])

    return (
        <Modal title='Login' close={close}>
            <form onSubmit={loginSubmit}>
                {error && <div class={styles.error}>{error}</div>}
                <Input
                    title='Username'
                    type='text'
                    value={user}
                    onInput={setUser}
                />
                <Input
                    title='Password'
                    type='password'
                    value={password}
                    onInput={setPassword}
                />
                <ModalActions>
                    <button type='submit'>Login</button>
                    <button onClick={createUser}>Create User</button>
                </ModalActions>
            </form>
        </Modal>
    )
}
