/* @refresh reload */
import './assets/index.css'
import 'molcss/style.css'
// @ts-ignore
import routes from '~solid-pages'
import { render } from 'solid-js/web'
import App from './app'
import { Router } from '@solidjs/router'

declare global {
  const APP_NAME: string
  const APP_USED_STACK: string
  const APP_VERSION: string
}

const root = document.getElementById('root')!
if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  )
}

render(
  () => <Router root={App}>{routes}</Router>,
  root,
)
