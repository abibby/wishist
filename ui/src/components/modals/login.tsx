import { h } from 'preact'
import { Link } from 'preact-router'
import { useCallback, useState } from 'preact/hooks'
import { login } from '../../auth'
import { Input } from '../form/input'
import { Modal, ModalProps } from '../modal'

h

interface LoginModalProps extends ModalProps {}

export function LoginModal({ close }: LoginModalProps) {
    const [user, setUser] = useState('')
    const [password, setPassword] = useState('')
    const clickLogin = useCallback(async () => {
        await login(user, password)
        close()
    }, [user, password])

    return (
        <Modal title='Login' close={close}>
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
            <button onClick={clickLogin}>Login</button>

            <Link href='/create-user'>Create User</Link>
        </Modal>
    )
}
