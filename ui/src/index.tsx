import { h, render } from 'preact'
import Router, { Route } from 'preact-router'
import { Error404 } from './pages/error-404'
import { Home } from './pages/home'
import { List } from './pages/list'

h

function Main() {
    return (
        <Router>
            <Route component={Home} path='/' />
            <Route component={List} path='/list/:name' />
            <Route component={Error404} default />
        </Router>
    )
}

render(<Main />, document.getElementById('app')!)

fetch('/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'adam', password: 'test' }),
})
    .then(r => r.json())
    .then(console.log)
