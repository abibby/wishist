import { h } from 'preact'
import { Link } from 'preact-router'
import { useCallback, useState } from 'preact/hooks'
import { login } from '../auth'
import { Input } from './form/input'
import { ModalActions } from './modal'
import { Form } from './form/form'

h

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
            />
            <Input
                title='Password'
                type='password'
                value={password}
                onInput={setPassword}
            />
            <ModalActions>
                <button type='submit'>Login</button>
                <Link class='button' href={'/forgot-password'}>
                    Forgot Password
                </Link>
                <Link
                    class='button'
                    href={
                        '/create-user?redirect=' +
                        encodeURIComponent(
                            location.pathname + location.search + location.hash,
                        )
                    }
                >
                    Create User
                </Link>
            </ModalActions>
        </Form>
    )
}
