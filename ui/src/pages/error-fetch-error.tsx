import { Fragment, h } from 'preact'
import { FetchError } from '../api/internal'

h

export type ErrorFetchErrorProps = {
    err: FetchError
}

export function ErrorFetchError({ err }: ErrorFetchErrorProps) {
    return (
        <Fragment>
            <h1>
                {err.body.status} {err.body.error}
            </h1>
            <a href={'/'}>Home</a>
        </Fragment>
    )
}
