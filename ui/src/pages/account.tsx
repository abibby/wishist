import { Fragment, h } from 'preact'
import { logout, useUser } from '../auth'
import { useCallback, useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { useOpenModal } from '../components/modal'
import { ButtonList } from '../components/button-list'
import { useInstallPrompt } from '../hooks/use-install-prompt'

export function Account() {
    const { route } = useLocation()
    const [install, canInstall] = useInstallPrompt()
    const openModal = useOpenModal()
    const [user, userLoading] = useUser()
    const changePasswordClick = useCallback(async () => {
        openModal('/change-password')
    }, [openModal])
    const logoutClick = useCallback(async () => {
        await logout()
        route('/')
    }, [route])

    useEffect(() => {
        if (!userLoading && user === null) {
            route('/', true)
        }
    }, [userLoading, route, user])

    return (
        <Fragment>
            <h1>Account</h1>
            <ButtonList>
                <button class='light' onClick={logoutClick}>
                    Logout
                </button>
                <button class='light' onClick={changePasswordClick}>
                    Change Password
                </button>
                {canInstall && (
                    <button class='light' onClick={install}>
                        Install
                    </button>
                )}
            </ButtonList>
        </Fragment>
    )
}
