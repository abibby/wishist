import './error'

import { h, render } from 'preact'
import Router, { Route } from 'preact-router'
import { ModalController, closeModals } from './components/modal'
import { Default } from './layouts/default'
import './main.css'
import { CreateUser } from './pages/create-user'
import { Error404 } from './pages/error-404'
import { Home } from './pages/home'
import { List } from './pages/list'
import { Login } from './pages/login'
import { ForgotPassword } from './pages/forgot-password'
import { ResetPassword } from './pages/reset-password'
import { AwaitingVerification } from './pages/awaiting-verification'
import { Account } from './pages/account'
import { ToastController } from './components/toast'
import { FloatingInstallPrompt } from './components/install-prompt'

h

function Main() {
    return (
        <Default>
            <ModalController />
            <ToastController />
            <Router onChange={closeModals}>
                <Route component={Home} path='/' />
                <Route component={Login} path='/login' />
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
            <FloatingInstallPrompt />
        </Default>
    )
}
render(<Main />, document.getElementById('app')!)
