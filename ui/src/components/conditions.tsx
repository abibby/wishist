import {
    ComponentChild,
    ComponentChildren,
    Fragment,
    RenderableProps,
    VNode,
    h,
} from 'preact'

export function Conditions(props: RenderableProps<unknown>) {
    return <Fragment>{filterChildren(props.children)}</Fragment>
}

function isVNode(c: ComponentChild): c is VNode {
    return typeof c === 'object' && c !== null && 'type' in c
}

function filterChildren(children: ComponentChildren): ComponentChildren {
    let childrenArray: ComponentChild[]
    if (children instanceof Array) {
        childrenArray = children
    } else {
        childrenArray = [children]
    }

    const newChildren = []
    let ifDone = false
    for (const child of childrenArray) {
        if (isVNode(child)) {
            if ('v-if' in child.props) {
                if (child.props['v-if']) {
                    newChildren.push(child)
                    ifDone = true
                } else {
                    ifDone = false
                }
            } else if ('v-else-if' in child.props) {
                if (child.props['v-else-if']) {
                    if (ifDone === false) {
                        newChildren.push(child)
                        ifDone = true
                    }
                }
            } else if ('v-else' in child.props) {
                if (child.props['v-else']) {
                    if (ifDone === false) {
                        newChildren.push(child)
                        ifDone = true
                    }
                }
            } else {
                newChildren.push(child)
                ifDone = false
            }
            child.props.children = filterChildren(child.props.children)
        } else {
            newChildren.push(child)
            ifDone = false
        }
    }
    return newChildren
}
