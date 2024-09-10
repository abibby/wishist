import { h, Fragment } from 'preact'
import { Modal, useModal } from '../modal'
import { ArrowDown, Share } from 'preact-feather'
import styles from './install.module.css'
import classNames from 'classnames'

export function InstallModal() {
    const modal = useModal()
    return (
        <>
            <div
                class={classNames(styles.arrow, {
                    [styles.closing]: modal.closing,
                })}
            >
                Click Here
                <ArrowDown />
            </div>
            <Modal title='Install'>
                <p>Install Wishist to your home screen</p>
                <ul>
                    <li>
                        Tap the share icon <Share height='1em' width='1em' />
                    </li>
                    <li>Select the "Add to Home Screen" option</li>
                    <li>Tap "Add" in the top right corner of the popup</li>
                </ul>
                <p>
                    You can find the install instructions from the Account page
                    at any time
                </p>
            </Modal>
        </>
    )
}
