import { h } from 'preact'
import { Modal, ModalActions, useCloseModal } from '../modal'
import { Form } from '../form/form'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { useRoute } from 'preact-iso'
import { Input } from '../form/input'
import { TextArea } from '../form/textarea'
import { itemAPI } from '../../api'
import { ErrorFetchError } from '../../pages/error-fetch-error'
import { Spinner } from '../spinner'
import style from './item-edit.module.css'
import { ExternalLink } from 'preact-feather'

export function ItemEditModal() {
    const { params } = useRoute()
    const { id } = params

    const closeModal = useCloseModal()

    const [name, setName] = useState('')
    const [url, setURL] = useState('')
    const [price, setPrice] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)

    const [items, err] = itemAPI.useList({ id: Number(id) })
    const item = items?.[0]

    useEffect(() => {
        setName(item?.name ?? '')
        setURL(item?.url ?? '')
        setDescription(item?.description ?? '')
        setPrice(item?.price ? (item.price / 100).toFixed(2) : '')
    }, [item])

    const save = useCallback(async () => {
        if (item === undefined) {
            return
        }
        setSaving(true)

        const newItem = {
            ...item,
            name: name,
            url: url,
            description: description,
            price: price !== '' ? Math.round(parseFloat(price) * 100) : null,
        }
        try {
            await itemAPI.update(newItem)
            closeModal()
        } finally {
            setSaving(false)
        }
    }, [item, name, url, description, price, closeModal])

    const remove = useCallback(async () => {
        setSaving(true)
        try {
            await itemAPI.delete({ id: Number(id) })
            closeModal()
        } finally {
            setSaving(false)
        }
    }, [id, closeModal])

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
                <div class={style.urlRow}>
                    <Input
                        title='URL'
                        value={url}
                        onInput={setURL}
                        name='url'
                    />
                    <a href={url} target='_blank'>
                        <ExternalLink />
                    </a>
                </div>
                <Input
                    prefix='$'
                    title='Price'
                    value={price}
                    onInput={setPrice}
                    name='price'
                />
                <TextArea
                    title='Description'
                    value={description}
                    onInput={setDescription}
                    name='description'
                />
                <ModalActions>
                    {saving && <Spinner />}
                    <button
                        class='danger-hover'
                        type='button'
                        onClick={remove}
                        disabled={saving}
                    >
                        Delete
                    </button>
                    <button class='light' type='submit' disabled={saving}>
                        Save
                    </button>
                </ModalActions>
            </Form>
        </Modal>
    )
}
