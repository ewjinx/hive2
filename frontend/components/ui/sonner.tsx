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
          '--success-bg': '#F0FAE5',
          '--success-text': '#559915',
          '--success-border': '#ABF600',
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
