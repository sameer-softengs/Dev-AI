function StatsGrid({ activeView, historyCount, imageUsage }) {
  const statCards = [
    {
      label: 'History items',
      value: historyCount,
      hint: 'Stored per account'
    },
    {
      label: 'Images left today',
      value: imageUsage.remaining,
      hint: `Limit ${imageUsage.limit}/day`
    },
    {
      label: 'Current mode',
      value: activeView === 'chat' ? 'Chat' : 'Image',
      hint: 'Switch anytime'
    }
  ];

  return (
    <section className="stats-grid">
      {statCards.map((card) => (
        <article className="stat-card" key={card.label}>
          <span>{card.label}</span>
          <strong>{card.value}</strong>
          <small>{card.hint}</small>
        </article>
      ))}
    </section>
  );
}

export default StatsGrid;
