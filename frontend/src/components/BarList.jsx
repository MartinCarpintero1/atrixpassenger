/** Lista de barras horizontales reutilizable. */
function BarList({ data, format = (v) => v }) {
  const entries = Array.isArray(data) ? data : Object.entries(data || {})
  const max = Math.max(1, ...entries.map(([, v]) => Number(v)))

  if (entries.length === 0) return <div className="empty-state">Sin datos</div>

  return (
    <div className="bar-list">
      {entries.map(([label, value]) => (
        <div className="bar-row" key={label}>
          <span>{label}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(Number(value) / max) * 100}%` }} />
          </div>
          <strong>{format(value)}</strong>
        </div>
      ))}
    </div>
  )
}

export default BarList
