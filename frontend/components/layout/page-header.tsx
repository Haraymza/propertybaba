export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-2 space-y-1">
      <h2 className="section-title">{title}</h2>
      {description ? <p className="muted">{description}</p> : null}
    </div>
  );
}
