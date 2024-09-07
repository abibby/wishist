import { h } from 'preact'
import { useCallback, useState } from 'preact/hooks'
import { login } from '../auth'
import { Input } from './form/input'
import { ModalActions } from './modal'
import { Form } from './form/form'

interface LoginFormProps {
    onLogin: () => void
}

export function LoginForm({ onLogin }: Readonly<LoginFormProps>) {
    const [user, setUser] = useState('')
    const [password, setPassword] = useState('')
    const loginSubmit = useCallback(async () => {
        await login(user, password)
        onLogin()
    }, [user, password, onLogin])

    return (
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
                <a
                    class='button'
                    href={
                        '/create-user?redirect=' +
                        encodeURIComponent(
                            location.pathname + location.search + location.hash,
                        )
                    }
                    tabIndex={5}
                >
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
    )
}
