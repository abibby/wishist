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

h

function Main() {
    return (
        <Default>
            <ModalController />
            <Router onChange={closeModals}>
                <Route component={Home} path='/' />
                <Route component={Login} path='/login' />
                <Route component={ForgotPassword} path='/forgot-password' />
                <Route component={ResetPassword} path='/reset-password' />
                <Route component={CreateUser} path='/create-user' />
                <Route component={List} path='/list/:username' />
                <Route component={Error404} default />
            </Router>
        </Default>
    )
}
render(<Main />, document.getElementById('app')!)
