import { Fragment, h } from 'preact'
import { Link } from 'preact-router'

h

export function AwaitingVerification() {
    return (
        <Fragment>
            <h1>Awaiting Verification</h1>
            <p>
                You have been sent an email verification link. Once you have
                clicked it you will be able to{' '}
                <Link href={'/login'}>login</Link>.
            </p>
        </Fragment>
    )
}
