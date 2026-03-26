import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area } from 'recharts';
import { scheduleApi } from '../services/api';
import { Card } from '../components/ui/Card';
import type { ProgressStats } from '../types';

function toDateStr(d: Date): string { return d.toISOString().slice(0, 10); }

const RANGE_OPTIONS = [
  { label: '7 days', days: 7 },
  { label: '14 days', days: 14 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
];

export function ProgressPage() {
  const [rangeDays, setRangeDays] = useState(30);
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - rangeDays + 1);
  const startStr = toDateStr(start);
  const endStr = toDateStr(end);

  useEffect(() => {
    setLoading(true);
    scheduleApi.getStats(startStr, endStr).then(setStats).finally(() => setLoading(false));
  }, [startStr, endStr]);

  const chartData = stats?.days.map((d) => ({
    date: d.date.slice(5),
    goalPercent: d.goalPercent,
    meals: d.completedMeals,
    workouts: d.completedWorkouts,
    caloriesBurned: d.caloriesBurned,
    caloriesConsumed: d.caloriesConsumed,
    proteinG: d.proteinG,
    label: d.date,
  })) ?? [];

  const avgGoal = stats && stats.days.length > 0 ? Math.round(stats.days.reduce((s, d) => s + d.goalPercent, 0) / stats.days.length) : 0;
  const totalCalBurned = stats?.days.reduce((s, d) => s + d.caloriesBurned, 0) ?? 0;
  const totalProtein = stats?.days.reduce((s, d) => s + d.proteinG, 0) ?? 0;

  // Heatmap data
  const heatmapData = stats?.days.map((d) => ({ date: d.date, value: d.goalPercent })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Progress & Metrics</h1>
        <p className="text-slate-600 mt-1">Track your fitness journey with detailed analytics.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((opt) => (
          <button key={opt.days} type="button" onClick={() => setRangeDays(opt.days)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${rangeDays === opt.days ? 'bg-primary-500 text-white shadow-md' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
      ) : stats && stats.days.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card><p className="text-xs text-slate-500 uppercase tracking-wider">Streak</p><p className="text-3xl font-display font-bold text-primary-600 mt-1">{stats.currentStreak}</p><p className="text-xs text-slate-500">days</p></Card>
            <Card><p className="text-xs text-slate-500 uppercase tracking-wider">Workouts</p><p className="text-3xl font-display font-bold text-emerald-600 mt-1">{stats.totalWorkoutsCompleted}</p><p className="text-xs text-slate-500">completed</p></Card>
            <Card><p className="text-xs text-slate-500 uppercase tracking-wider">Meals</p><p className="text-3xl font-display font-bold text-amber-600 mt-1">{stats.totalMealsCompleted}</p><p className="text-xs text-slate-500">followed</p></Card>
            <Card><p className="text-xs text-slate-500 uppercase tracking-wider">Avg Goal</p><p className="text-3xl font-display font-bold text-slate-800 mt-1">{avgGoal}%</p><p className="text-xs text-slate-500">daily</p></Card>
            <Card><p className="text-xs text-slate-500 uppercase tracking-wider">Cal Burned</p><p className="text-3xl font-display font-bold text-rose-600 mt-1">{totalCalBurned}</p><p className="text-xs text-slate-500">total kcal</p></Card>
            <Card><p className="text-xs text-slate-500 uppercase tracking-wider">Protein</p><p className="text-3xl font-display font-bold text-blue-600 mt-1">{totalProtein}g</p><p className="text-xs text-slate-500">total</p></Card>
          </div>

          {stats.insights.length > 0 && (
            <Card title="Performance Insights">
              <ul className="space-y-2">
                {stats.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-slate-700">{insight}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {stats.prediction && (
            <div className="bg-gradient-to-r from-primary-500 to-emerald-500 rounded-xl p-4 text-white">
              <p className="font-medium text-sm uppercase tracking-wider mb-1">Fitness Prediction</p>
              <p>{stats.prediction}</p>
            </div>
          )}

          <Card title="Goal % Over Time">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ea580c" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} labelFormatter={(_, p) => p[0]?.payload?.label} formatter={(v: number | undefined) => [`${v ?? 0}%`, 'Goal %']} />
                  <Area type="monotone" dataKey="goalPercent" stroke="#ea580c" strokeWidth={2} fill="url(#goalGrad)" name="Goal %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Calories Burned">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} labelFormatter={(_, p) => p[0]?.payload?.label} />
                  <Bar dataKey="caloriesBurned" fill="#ef4444" name="Burned (kcal)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Protein Intake">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} labelFormatter={(_, p) => p[0]?.payload?.label} formatter={(v: number | undefined) => [`${v ?? 0}g`, 'Protein']} />
                  <Line type="monotone" dataKey="proteinG" stroke="#3b82f6" strokeWidth={2} dot={{ r: 2 }} name="Protein (g)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Meals & Workouts Per Day">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} labelFormatter={(_, p) => p[0]?.payload?.label} />
                  <Legend />
                  <Bar dataKey="meals" fill="#f59e0b" name="Meals done" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="workouts" fill="#10b981" name="Workouts done" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Daily Goal Completion Heatmap">
            <div className="flex flex-wrap gap-1">
              {heatmapData.map((d) => {
                const color = d.value >= 80 ? 'bg-emerald-500' : d.value >= 50 ? 'bg-emerald-300' : d.value > 0 ? 'bg-emerald-100' : 'bg-slate-100';
                return (
                  <div key={d.date} className={`w-5 h-5 rounded-sm ${color} cursor-pointer`} title={`${d.date}: ${d.value}%`} />
                );
              })}
            </div>
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
              <span>Less</span>
              <span className="w-4 h-4 rounded-sm bg-slate-100" />
              <span className="w-4 h-4 rounded-sm bg-emerald-100" />
              <span className="w-4 h-4 rounded-sm bg-emerald-300" />
              <span className="w-4 h-4 rounded-sm bg-emerald-500" />
              <span>More</span>
            </div>
          </Card>

          <p className="text-sm text-slate-500">
            <Link to="/schedule" className="text-primary-600 hover:underline">Open schedule</Link> to mark activities done and update these metrics.
          </p>
        </>
      ) : (
        <Card>
          <p className="text-slate-600">No data for this period. Complete activities on the Schedule page to see progress.</p>
          <Link to="/schedule" className="inline-block mt-4"><span className="text-primary-600 font-medium hover:underline">Go to Schedule</span></Link>
        </Card>
      )}
    </div>
  );
}
