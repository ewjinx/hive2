'use client'

import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--card)',
          '--normal-text': 'var(--card-foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': '#E5FAF0',
          '--success-text': '#1E8A4E',
          '--success-border': '#3CCD71',
          '--error-bg': '#FFEDED',
          '--error-text': '#E21212',
          '--error-border': '#FF333F',
          '--border-radius': '16px',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
