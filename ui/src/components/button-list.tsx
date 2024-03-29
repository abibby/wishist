import { h, RenderableProps } from 'preact'
import styles from './button-list.module.css'

h

export function ButtonList({ children }: RenderableProps<{}>) {
    return <section class={styles.buttonList}>{children}</section>
}
