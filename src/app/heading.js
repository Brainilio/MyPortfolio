// The brand mark is shared by static headings and the homepage's animated text.
export function HeadingMark({ children = '.', className = '' }) {
  return <span className={['ui-heading-mark', className].filter(Boolean).join(' ')}>{children}</span>;
}

export default function Heading({ as: Tag = 'h1', size = 'section', mark = '.', markClassName, className, children, ...props }) {
  return <Tag className={['ui-heading', `ui-heading--${size}`, className].filter(Boolean).join(' ')} {...props}>
    {children}<HeadingMark className={markClassName}>{mark}</HeadingMark>
  </Tag>;
}
