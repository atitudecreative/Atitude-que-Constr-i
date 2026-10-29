import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import styles from './ui.module.css'

type Variant = 'primary' | 'accent'

function classes(variant: Variant, extra?: string) {
  return [styles.button, styles[variant], extra].filter(Boolean).join(' ')
}

export function ButtonLink({ variant = 'primary', className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: Variant }) {
  return <a className={classes(variant, className)} {...props} />
}

export function Button({ variant = 'primary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={classes(variant, className)} {...props} />
}
