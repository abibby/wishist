import { Fragment, h } from 'preact'

export function AwaitingVerification() {
    return (
        <Fragment>
            <h1>Awaiting Verification</h1>
            <p>
                You have been sent an email verification link. Once you have
                clicked it you will be able to <a href={'/login'}>login</a>.
            </p>
        </Fragment>
    )
}
