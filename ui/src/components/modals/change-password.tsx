import { h } from 'preact'
import { LoginForm } from '../login-form'
import { Modal, ModalActions, ModalProps } from '../modal'
import { useCallback, useState } from 'preact/hooks'
import { Input } from '../form/input'
import { FetchError } from '../../api/internal'
import { changePassword } from '../../api/user'

h

interface ChangePasswordModalProps extends ModalProps<void> {}

export function ChangePasswordModal({ close }: ChangePasswordModalProps) {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword1, setNewPassword1] = useState('')
    const [newPassword2, setNewPassword2] = useState('')
    const [error, setError] = useState<string>()
    const [running, setRunning] = useState(false)
    const submit = useCallback(
        async (e: Event) => {
            e.preventDefault()
            if (running) {
                return
            }
            if (newPassword1 !== newPassword2) {
                setError('passwords do not match')
                return
            }
            setRunning(true)
            try {
                await changePassword({
                    old_password: currentPassword,
                    new_password: newPassword1,
                })
                close()
            } catch (e) {
                if (e instanceof FetchError) {
                    setError(e.body.error)
                } else {
                    throw e
                }
            } finally {
                setRunning(false)
            }
        },
        [currentPassword, newPassword1, newPassword2, running],
    )
    return (
        <Modal title='Change Password' close={close}>
            <form onSubmit={submit}>
                {error && <div>{error}</div>}
                <Input
                    title='Current Password'
                    type='password'
                    value={currentPassword}
                    onInput={setCurrentPassword}
                />
                <Input
                    title='New Password'
                    type='password'
                    value={newPassword1}
                    onInput={setNewPassword1}
                />
                <Input
                    title='Reenter New Password'
                    type='password'
                    value={newPassword2}
                    onInput={setNewPassword2}
                />
                <ModalActions>
                    <button type='submit'>Change Password</button>
                </ModalActions>
            </form>
        </Modal>
    )
}
