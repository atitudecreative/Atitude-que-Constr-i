// Mostra um texto no desktop e outro no tablet/celular, como nos frames do Figma.
export function ResponsiveText({ desktop, compact }: { desktop: string; compact: string }) {
  if (desktop === compact) return <>{desktop}</>
  return (
    <>
      <span className="only-desktop">{desktop}</span>
      <span className="only-compact">{compact}</span>
    </>
  )
}
