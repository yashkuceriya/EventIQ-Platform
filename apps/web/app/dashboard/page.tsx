'use client';

import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchData() {
    try {
      const [metricsRes, eventsRes] = await Promise.all([
        fetch('http://localhost:3003/api/metrics/realtime'),
        fetch('http://localhost:3003/api/events?limit=10'),
      ]);

      const metricsData = await metricsRes.json();
      const eventsData = await eventsRes.json();

      setMetrics(metricsData);
      setEvents(eventsData.items || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">
          EventIQ Dashboard
        </h1>

        {/* Metrics Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-purple-600 rounded-lg p-6">
            <div className="text-purple-100 text-sm mb-2">Total Events</div>
            <div className="text-white text-3xl font-bold">
              {metrics?.total || 0}
            </div>
          </div>

          <div className="bg-blue-600 rounded-lg p-6">
            <div className="text-blue-100 text-sm mb-2">Event Types</div>
            <div className="text-white text-3xl font-bold">
              {Object.keys(metrics?.byType || {}).length}
            </div>
          </div>

          <div className="bg-red-600 rounded-lg p-6">
            <div className="text-red-100 text-sm mb-2">Critical Events</div>
            <div className="text-white text-3xl font-bold">
              {metrics?.bySeverity?.critical || 0}
            </div>
          </div>

          <div className="bg-green-600 rounded-lg p-6">
            <div className="text-green-100 text-sm mb-2">Sources</div>
            <div className="text-white text-3xl font-bold">
              {Object.keys(metrics?.bySource || {}).length}
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            Recent Events
          </h2>
          
          <div className="space-y-4">
            {events.map((event: any) => (
              <div
                key={event.id}
                className="bg-slate-700 rounded-lg p-4 border-l-4 border-purple-500"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-purple-400 font-mono text-sm">
                      {event.type}
                    </span>
                    <span className="mx-2 text-slate-500">•</span>
                    <span className="text-slate-400 text-sm">
                      {event.source}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      event.severity === 'critical'
                        ? 'bg-red-500 text-white'
                        : event.severity === 'high'
                        ? 'bg-orange-500 text-white'
                        : event.severity === 'medium'
                        ? 'bg-yellow-500 text-black'
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {event.severity}
                  </span>
                </div>
                
                <p className="text-white">{event.message}</p>
                
                <div className="mt-2 text-slate-400 text-xs">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
