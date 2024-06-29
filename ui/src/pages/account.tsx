import { Fragment, h } from 'preact'
import { getUser, logout } from '../auth'
import { useCallback, useEffect } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { useOpenModal } from '../components/modal'
import { ButtonList } from '../components/button-list'
import { useInstallPrompt } from '../hooks/use-install-prompt'

h

export function Account() {
    const { route } = useLocation()
    const [install, canInstall] = useInstallPrompt()
    const openModal = useOpenModal()

    const changePasswordClick = useCallback(async () => {
        openModal('/change-password')
    }, [openModal])
    const logoutClick = useCallback(async () => {
        await logout()
        route('/')
    }, [route])

    useEffect(() => {
        getUser().then(u => {
            if (u === null) {
                route('/', true)
            }
        })
    }, [route])

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
