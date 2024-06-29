import {
    ComponentChild,
    ComponentChildren,
    Fragment,
    RenderableProps,
    VNode,
    h,
} from 'preact'

h

interface ConditionsProps {
    'v-if'?: boolean
    'v-else'?: boolean
    'v-else-if'?: boolean
}

export function Conditions(props: RenderableProps<unknown>) {
    return <Fragment>{filterChildren(props.children)}</Fragment>
}

function isVNode(c: ComponentChild): c is VNode<ConditionsProps> {
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
            if (child.props['v-if'] === true) {
                newChildren.push(child)
                ifDone = true
            } else if (child.props['v-if'] === false) {
                ifDone = false
            } else if (child.props['v-else-if'] === true) {
                if (ifDone === false) {
                    newChildren.push(child)
                    ifDone = true
                }
            } else if (child.props['v-else-if'] === false) {
                // noop
            } else if (child.props['v-else']) {
                if (ifDone === false) {
                    newChildren.push(child)
                    ifDone = true
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
