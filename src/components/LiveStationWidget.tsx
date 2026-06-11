"use client"

export default function LiveStationWidget() {
  return (
    <div className="w-full max-w-2xl mx-auto mt-6">
      <p className="text-sm font-medium mb-2">Station en direct — Pointe Faula</p>
      <div className="rounded-lg border overflow-hidden bg-card">
        <iframe
          src="https://www.windguru.cz/wgs-iframe.php?s=4164&wj=knots&tj=c&tmprh=1&avg_min=0&date_format=Y-m-d%20H%3Ai%3As%20T"
          width="100%"
          height="80"
          frameBorder="0"
          scrolling="no"
          title="Station vent Pointe Faula — Windguru"
          className="block"
        />
      </div>
    </div>
  )
}
