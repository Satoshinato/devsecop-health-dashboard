interface PanelProps {
  title: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

/** Tarjeta contenedora con el mismo encabezado que los paneles del tablero de obsolescencia. */
export default function Panel({
  title,
  hint,
  children,
  className = "",
  bodyClassName = "",
}: PanelProps) {
  return (
    <section
      className={`bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col ${className}`}
    >
      <header className="flex items-baseline justify-between gap-3 px-4 pt-3.5 pb-2">
        <h2 className="text-[13px] font-semibold text-teal-700">{title}</h2>
        {hint && <span className="text-[10px] text-slate-400 shrink-0">{hint}</span>}
      </header>
      <div className={`px-4 pb-4 flex-1 ${bodyClassName}`}>{children}</div>
    </section>
  );
}
