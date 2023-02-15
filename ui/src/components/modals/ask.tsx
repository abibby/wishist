import { bind } from '@zwzn/spicy'
import { h } from 'preact'
import { Modal, ModalActions, ModalProps } from '../modal'

h

interface AskProps extends ModalProps<boolean> {
    title: string
    question: string
}

export function Ask({ close, title, question }: AskProps) {
    return (
        <Modal title={title} close={close}>
            <p>{question}</p>
            <ModalActions>
                <button onClick={bind(true, close)}>Yes</button>
                <button class='primary' onClick={bind(false, close)}>
                    No
                </button>
            </ModalActions>
        </Modal>
    )
}
