import { bindValue } from '@zwzn/spicy'
import { h } from 'preact'
import { route } from 'preact-router'
import { useCallback, useState } from 'preact/hooks'
import { login } from '../auth'

h

export function Login() {
    const [user, setUser] = useState('')
    const [password, setPassword] = useState('')
    const clickLogin = useCallback(async () => {
        await login(user, password)
        route('/')
    }, [user, password])
    return (
        <div>
            <h1>Login</h1>
            <input type='text' value={user} onInput={bindValue(setUser)} />
            <input
                type='password'
                value={password}
                onInput={bindValue(setPassword)}
            />
            <button onClick={clickLogin}>Login</button>
        </div>
    )
}
