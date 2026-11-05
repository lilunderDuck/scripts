import type { ParentProps } from 'solid-js'
import { startHeartbeat } from './utils'

export default function App(props: ParentProps) {
  if (!import.meta.env.DEV) {
    startHeartbeat(() => {}, () => {})
  }
  
  return (
    <>
      {props.children}
    </>
  )
}
