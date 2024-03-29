import { Fragment, h } from 'preact'
import { LoginForm } from '../components/login-form'
import { useCallback } from 'preact/hooks'
import { route } from 'preact-router'

h

export function Login() {
    const login = useCallback(() => {
        const u = new URL(location.href).searchParams.get('redirect')
        route(u ?? '/')
    }, [])
    return (
        <Fragment>
            <h1>Login</h1>
            <LoginForm onLogin={login} />
        </Fragment>
    )
}
