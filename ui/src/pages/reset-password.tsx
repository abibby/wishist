import { Fragment, h } from 'preact'
import { useCallback, useState } from 'preact/hooks'
import { resetPassword } from '../api/user'
import { Input } from '../components/form/input'
import { FetchError } from '../api/internal'
import styles from './reset-password.module.css'
import { useOpenModal } from '../components/modal'
import { useLocation } from 'preact-iso'

h

export function ResetPassword() {
    const [password1, setPassword1] = useState('')
    const [password2, setPassword2] = useState('')
    const [error, setError] = useState<string>()
    const openModal = useOpenModal()
    const { route } = useLocation()
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
            route('/')
            openModal('/login')
        } catch (e) {
            if (e instanceof FetchError) {
                setError(e.body.error)
            } else {
                throw e
            }
        }
    }, [openModal, password1, password2, route])
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
