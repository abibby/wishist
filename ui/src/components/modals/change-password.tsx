import { h } from 'preact'
import { Modal, ModalActions, useCloseModal } from '../modal'
import { useCallback, useState } from 'preact/hooks'
import { Input } from '../form/input'
import { FetchError } from '../../api'
import { changePassword } from '../../api/user'

export function ChangePasswordModal() {
    const close = useCloseModal()
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
        [currentPassword, newPassword1, newPassword2, running, close],
    )
    return (
        <Modal title='Change Password'>
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
