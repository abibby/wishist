import { Fragment, h } from 'preact'
import { getUser, logout } from '../auth'
import { useCallback, useEffect } from 'preact/hooks'
import { openModal } from '../components/modal'
import { ChangePasswordModal } from '../components/modals/change-password'
import { route } from 'preact-router'
import { ButtonList } from '../components/button-list'

h

export function Account() {
    const changePasswordClick = useCallback(async () => {
        await openModal(ChangePasswordModal, {})
    }, [])
    const logoutClick = useCallback(async () => {
        await logout()
        route('/')
    }, [])

    useEffect(() => {
        getUser().then(u => {
            if (u === null) {
                route('/', true)
            }
        })
    }, [])

    return (
        <Fragment>
            <h1>Account</h1>
            <ButtonList>
                <button onClick={logoutClick}>Logout</button>
                <button onClick={changePasswordClick}>Change Password</button>
            </ButtonList>
        </Fragment>
    )
}
