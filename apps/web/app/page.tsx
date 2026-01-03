export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-white mb-4">
            EventIQ
          </h1>
          <p className="text-xl text-purple-200">
            AI-Powered Event Intelligence Platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-3">
              Real-time Processing
            </h3>
            <p className="text-purple-100">
              Ingest and process events in real-time with Kafka streaming
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-3">
              AI Analysis
            </h3>
            <p className="text-purple-100">
              Detect anomalies and trends using GPT-4 powered insights
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h3 className="text-2xl font-bold text-white mb-3">
              Live Dashboard
            </h3>
            <p className="text-purple-100">
              Monitor your events with real-time analytics and WebSocket updates
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <a
            href="/dashboard"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-lg transition-colors"
          >
            Open Dashboard
          </a>
        </div>
      </div>
    </main>
  );
}
