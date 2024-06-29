import './error'

import { h, render } from 'preact'
import { Router, Route, LocationProvider, ErrorBoundary } from 'preact-iso'
import { DefaultModal, ModalController } from './components/modal'
import { Default } from './layouts/default'
import './main.css'
import { CreateUser } from './pages/create-user'
import { Error404 } from './pages/error-404'
import { Home } from './pages/home'
import { List } from './pages/list'
import { ForgotPassword } from './pages/forgot-password'
import { ResetPassword } from './pages/reset-password'
import { AwaitingVerification } from './pages/awaiting-verification'
import { Account } from './pages/account'
import { FloatingInstallPrompt } from './components/install-prompt'
import { LoginModal } from './components/modals/login'
import { ChangePasswordModal } from './components/modals/change-password'
import { ItemEditModal } from './components/modals/item-edit'
import { ItemViewModal } from './components/modals/item-view'

h

function Routes() {
    return (
        <Router>
            <Route component={Home} path='/' />
            <Route component={ForgotPassword} path='/forgot-password' />
            <Route component={ResetPassword} path='/reset-password' />
            <Route
                component={AwaitingVerification}
                path='/awaiting-verification'
            />
            <Route component={CreateUser} path='/create-user' />
            <Route component={List} path='/list/:username' />
            <Route component={Account} path='/account' />
            <Route component={Error404} default />
        </Router>
    )
}
function Modals() {
    return (
        <Router>
            <LoginModal path='/login' />
            <ChangePasswordModal path='/change-password' />
            <ItemEditModal path='/item/:id/edit' />
            <ItemViewModal path='/item/:id' />
            <DefaultModal default />
        </Router>
    )
}

function Main() {
    return (
        <LocationProvider>
            <ErrorBoundary>
                <Default>
                    <ModalController>
                        <Modals />
                    </ModalController>
                    <FloatingInstallPrompt />
                    <Routes />
                </Default>
            </ErrorBoundary>
        </LocationProvider>
    )
}

render(<Main />, document.getElementById('app')!)
