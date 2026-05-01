function DashboardHero({ imageUsage }) {
  return (
    <header className="hero-card">
      <div>
        <p className="section-tag">Dashboard</p>
        <h2>Ship responses and visuals from one protected workspace.</h2>
        <p className="hero-copy">
          This version keeps chat history, image history, and the daily image
          counter in the user&apos;s browser while previewing generated images
          directly inside the product.
        </p>
      </div>

      <div className="quota-card">
        <span>Daily image budget</span>
        <strong>
          {imageUsage.remaining} / {imageUsage.limit} left
        </strong>
        <small>{imageUsage.used} used today</small>
      </div>
    </header>
  );
}

export default DashboardHero;
