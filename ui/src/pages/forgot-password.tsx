import { Fragment, h } from 'preact'
import { useCallback, useState } from 'preact/hooks'
import { forgotPassword } from '../api/user'
import { Input } from '../components/form/input'
import { FetchError } from '../api/internal'
import styles from './forgot-password.module.css'

h

export function ForgotPassword() {
    const [email, setEmail] = useState('')
    const [error, setError] = useState<string>()
    const [success, setSuccess] = useState(false)
    const [sending, setSending] = useState(false)
    const clickSend = useCallback(async () => {
        setSending(true)
        try {
            await forgotPassword({ email: email })
            setSuccess(true)
        } catch (e) {
            if (e instanceof FetchError) {
                setError(e.body.error)
                setSending(false)
            } else {
                throw e
            }
        }
    }, [email, setError])
    return (
        <Fragment>
            <h1>Forgot Password</h1>
            {success ? (
                <p>Password reset email sent to {email}</p>
            ) : (
                <Fragment>
                    <Input
                        title='email'
                        type='text'
                        value={email}
                        onInput={setEmail}
                    />
                    {error && <p class={styles.error}>{error}</p>}
                    <button onClick={clickSend} disabled={sending}>
                        {sending ? 'Sending...' : 'Send'}
                    </button>
                </Fragment>
            )}
        </Fragment>
    )
}
