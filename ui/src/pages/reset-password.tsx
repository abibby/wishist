import { Fragment, h } from 'preact'
import { useCallback, useState } from 'preact/hooks'
import { forgotPassword, resetPassword } from '../api/user'
import { Input } from '../components/form/input'
import { FetchError } from '../api/internal'
import styles from './forgot-password.module.css'
import { route } from 'preact-router'

h

export function ResetPassword() {
    const [password1, setPassword1] = useState('')
    const [password2, setPassword2] = useState('')
    const [error, setError] = useState<string>()
    const clickSend = useCallback(async () => {
        try {
            if (password1 !== password2) {
                setError('passwords do not match')
                return
            }
            const url = new URL(location.href)
            await resetPassword({
                token: url.searchParams.get('token') ?? '',
                password: password1,
            })
            route('/login')
        } catch (e) {
            if (e instanceof FetchError) {
                setError(e.body.error)
            } else {
                throw e
            }
        }
    }, [password1, password2, setError])
    return (
        <Fragment>
            <h1>Reset Password</h1>
            <Input
                title='password'
                type='password'
                value={password1}
                onInput={setPassword1}
            />
            <Input
                title='repeat password'
                type='password'
                value={password2}
                onInput={setPassword2}
            />
            {error && <p class={styles.error}>{error}</p>}
            <button onClick={clickSend}>Reset</button>
        </Fragment>
    )
}
