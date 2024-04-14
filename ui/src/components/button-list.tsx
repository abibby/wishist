import { h, RenderableProps } from 'preact'
import styles from './button-list.module.css'

h

export function ButtonList({ children }: RenderableProps<never>) {
    return <section class={styles.buttonList}>{children}</section>
}
