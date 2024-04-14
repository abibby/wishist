import { h } from 'preact'
import { Link } from 'preact-router'
import { useCallback, useState } from 'preact/hooks'
import { login } from '../auth'
import { Input } from './form/input'
import styles from './login-form.module.css'
import { ModalActions } from './modal'

h

interface LoginFormProps {
    onLogin: () => void
}

export function LoginForm({ onLogin }: Readonly<LoginFormProps>) {
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
            onLogin()
        },
        [user, password, onLogin],
    )

    return (
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
        </form>
    )
}
