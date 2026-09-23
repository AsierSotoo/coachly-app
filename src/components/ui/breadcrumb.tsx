import Link from 'next/link'

interface BreadcrumbItem {
  label: string
  href?: string
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest mb-6"
      style={{ color: 'var(--tx-2)' }}>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && (
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
          )}
          {item.href
            ? <Link href={item.href} className="hover:text-[var(--tx)] transition-colors">{item.label}</Link>
            : <span style={{ color: 'var(--tx)' }}>{item.label}</span>
          }
        </span>
      ))}
    </div>
  )
}
