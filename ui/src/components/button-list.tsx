import { h, RenderableProps } from 'preact'
import styles from './button-list.module.css'

export function ButtonList({ children }: RenderableProps<unknown>) {
    return <section class={styles.buttonList}>{children}</section>
}
