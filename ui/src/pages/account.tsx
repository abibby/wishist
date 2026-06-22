import { Fragment, h } from 'preact'
import { logout, useNetworkUser } from '../auth'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import { useLocation } from 'preact-iso'
import { useOpenModal } from '../components/modal'
import { ButtonList } from '../components/button-list'
import { useInstallPrompt } from '../hooks/use-install-prompt'
import styles from './account.module.css'
import { Edit } from 'preact-feather'
import { GravatarQuickEditorCore } from '@gravatar-com/quick-editor'
import { Form } from '../components/form/form'
import { Input } from '../components/form/input'
import { userAPI } from '../api'

export function Account() {
    const { route } = useLocation()
    const [install, canInstall] = useInstallPrompt()
    const openModal = useOpenModal()
    const [user, userLoading] = useNetworkUser()
    const changePasswordClick = useCallback(async () => {
        openModal('/change-password')
    }, [openModal])
    const logoutClick = useCallback(async () => {
        await logout()
        route('/')
    }, [route])
    const [avatarKey, setAvatarKey] = useState('')

    const quickEditorCore = useMemo(() => {
        return new GravatarQuickEditorCore({
            email: user?.email,
            scope: ['avatars'],
            onProfileUpdated: () => {
                setAvatarKey('&key=' + Date.now())
            },
        })
    }, [user?.email])

    useEffect(() => {
        if (!userLoading && user === null) {
            route('/', true)
        }
    }, [userLoading, route, user])

    const editAvatar = useCallback(() => {
        quickEditorCore.open()
    }, [quickEditorCore])

    const [name, setName] = useState('')

    useEffect(() => {
        setName(user?.name ?? '')
    }, [user?.name])

    const updateUser = useCallback(async () => {
        if (user?.id === undefined) {
            return
        }
        await userAPI.update({
            id: user.id,
            name: name,
        })
    }, [name, user?.id])

    return (
        <Fragment>
            <h1>Settings</h1>

            <div class={styles.avatarWrapper} onClick={editAvatar}>
                <img
                    class={styles.avatar}
                    src={user?.avatar_url + '&s=320' + avatarKey}
                    alt=''
                />
                <Edit class={styles.edit} />
            </div>

            <Form class={styles.form} onSubmit={updateUser}>
                <Input
                    title='Name'
                    name='name'
                    value={name}
                    onInput={setName}
                />
                <div class={styles.controlls}>
                    <button class='primary'>Save</button>
                </div>
            </Form>

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
