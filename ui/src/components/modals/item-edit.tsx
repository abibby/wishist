import { h } from 'preact'
import { Modal, ModalActions, useCloseModal } from '../modal'
import { Form } from '../form/form'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { useRoute } from 'preact-iso'
import { Input } from '../form/input'
import { TextArea } from '../form/textarea'
import { item as itemAPI } from '../../api'
import { ErrorFetchError } from '../../pages/error-fetch-error'

h

export function ItemEditModal() {
    const { params } = useRoute()
    const { id } = params

    const closeModal = useCloseModal()

    const [name, setName] = useState('')
    const [url, setURL] = useState('')
    const [description, setDescription] = useState('')

    const [items, err] = itemAPI.useList({ id: id })
    const item = items?.[0]

    useEffect(() => {
        setName(item?.name ?? '')
        setURL(item?.url ?? '')
        setDescription(item?.description ?? '')
    }, [item])

    const save = useCallback(async () => {
        if (item === undefined) {
            return
        }

        const newItem = {
            ...item,
            name: name,
            url: url,
            description: description,
        }

        await itemAPI.update(newItem)
        closeModal()
    }, [item, name, url, description, closeModal])

    if (err) {
        return (
            <Modal title={err.message}>
                <ErrorFetchError err={err} />
            </Modal>
        )
    }
    return (
        <Modal title='Edit item'>
            <Form onSubmit={save}>
                <Input
                    title='Name'
                    value={name}
                    onInput={setName}
                    name='name'
                />
                <Input title='URL' value={url} onInput={setURL} name='url' />
                <TextArea
                    title='Description'
                    value={description}
                    onInput={setDescription}
                    name='description'
                />
                <div></div>
                <ModalActions>
                    <button type='submit'>Save</button>
                </ModalActions>
            </Form>
        </Modal>
    )
}
