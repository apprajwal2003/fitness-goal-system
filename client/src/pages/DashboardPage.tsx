import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scheduleApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { DashboardData } from '../types';

export function DashboardPage() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.onboardingCompleted) { setLoading(false); return; }
    scheduleApi.getDashboard().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [profile?.onboardingCompleted]);

  if (!profile?.onboardingCompleted) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-slate-900">Hello, {user?.name?.split(' ')[0] ?? 'there'}</h1>
        <Card>
          <p className="text-slate-700">Set your body metrics, work hours, and preferences so we can build your daily meal and workout schedule.</p>
          <Link to="/onboarding" className="inline-block mt-4"><Button>Complete setup</Button></Link>
        </Card>
      </div>
    );
  }

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;
  }

  const t = data?.today;
  const completed = t?.scheduledActivities.filter((a) => a.completed).length ?? 0;
  const total = t?.scheduledActivities.length ?? 0;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  const caloriesConsumed = t?.caloriesConsumed ?? 0;
  const caloriesBurned = t?.caloriesBurned ?? 0;
  const calorieTarget = t?.calorieTarget ?? 2000;
  const macroTargets = t?.macroTargets ?? { proteinG: 0, carbsG: 0, fatG: 0 };
  const nutrition = t?.nutrition ?? { proteinG: 0, carbsG: 0, fatG: 0 };

  const energyColors = { high: 'text-emerald-600', moderate: 'text-amber-600', low: 'text-red-600' };
  const energyBg = { high: 'bg-emerald-50', moderate: 'bg-amber-50', low: 'bg-red-50' };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Hello, {user?.name?.split(' ')[0] ?? 'there'}</h1>
          <p className="text-slate-600 mt-1">Here's your fitness overview for today.</p>
        </div>
        {data?.weekStreak !== undefined && data.weekStreak > 0 && (
          <div className="text-center bg-primary-50 rounded-xl px-4 py-2">
            <p className="text-2xl font-display font-bold text-primary-600">{data.weekStreak}</p>
            <p className="text-xs text-primary-700">day streak</p>
          </div>
        )}
      </div>

      {data?.motivationMessage && (
        <div className="bg-gradient-to-r from-primary-500 to-emerald-500 rounded-xl p-4 text-white">
          <p className="font-medium">{data.motivationMessage}</p>
          {data.shouldRestToday && <p className="text-sm mt-1 text-white/80">You've been working hard — consider a rest day.</p>}
        </div>
      )}

      {data?.energy && (
        <div className={`rounded-xl p-4 ${energyBg[data.energy.level]} border`}>
          <p className={`font-medium ${energyColors[data.energy.level]}`}>Energy: {data.energy.level.charAt(0).toUpperCase() + data.energy.level.slice(1)}</p>
          <p className="text-sm text-slate-600 mt-1">{data.energy.message}</p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Progress</p>
          <p className="text-3xl font-display font-bold text-primary-600 mt-1">{percent}%</p>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">{completed}/{total} done</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Calories In</p>
          <p className="text-3xl font-display font-bold text-amber-600 mt-1">{caloriesConsumed}</p>
          <p className="text-xs text-slate-500 mt-1">of {calorieTarget} kcal</p>
          <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
            <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((caloriesConsumed / calorieTarget) * 100, 100)}%` }} />
          </div>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Burned</p>
          <p className="text-3xl font-display font-bold text-emerald-600 mt-1">{caloriesBurned}</p>
          <p className="text-xs text-slate-500 mt-1">kcal from workouts</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Net Calories</p>
          <p className="text-3xl font-display font-bold text-slate-800 mt-1">{caloriesConsumed - caloriesBurned}</p>
          <p className="text-xs text-slate-500 mt-1">consumed - burned</p>
        </Card>
        {data?.bmi != null && (
          <Card>
            <p className="text-xs text-slate-500 uppercase tracking-wider">BMI</p>
            <p className="text-3xl font-display font-bold text-blue-600 mt-1">{data.bmi}</p>
            <p className="text-xs text-slate-500 mt-1">{data.bmi < 18.5 ? 'Underweight' : data.bmi < 25 ? 'Normal' : data.bmi < 30 ? 'Overweight' : 'Obese'}</p>
          </Card>
        )}
        <Card>
          <p className="text-xs text-slate-500 uppercase tracking-wider">Water Goal</p>
          <p className="text-3xl font-display font-bold text-cyan-600 mt-1">{data?.waterTarget ?? 2.5}L</p>
          <p className="text-xs text-slate-500 mt-1">daily target</p>
        </Card>
      </div>

      <Card title="Nutrition Summary">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Protein', current: nutrition.proteinG, target: macroTargets.proteinG, color: 'bg-blue-500' },
            { label: 'Carbs', current: nutrition.carbsG, target: macroTargets.carbsG, color: 'bg-amber-500' },
            { label: 'Fat', current: nutrition.fatG, target: macroTargets.fatG, color: 'bg-rose-500' },
          ].map((m) => (
            <div key={m.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">{m.label}</span>
                <span className="text-slate-800 font-medium">{m.current}g / {m.target}g</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className={`${m.color} h-2 rounded-full transition-all`} style={{ width: `${m.target > 0 ? Math.min((m.current / m.target) * 100, 100) : 0}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Today's Schedule">
        {t?.scheduledActivities.length ? (
          <ul className="space-y-2">
            {t.scheduledActivities.map((a, i) => (
              <li key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                a.completed ? 'bg-emerald-50 border-emerald-200' :
                a.type === 'meal' || a.type === 'snack' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${a.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className="text-sm font-medium text-slate-500 w-24">{a.start}–{a.end}</span>
                <span className="text-slate-800 flex-1">{a.name ?? a.type}</span>
                {a.nutrition && <span className="text-xs text-slate-500">{a.nutrition.calories} kcal</span>}
                {a.completed && <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Done</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">No schedule for today. Open Schedule to generate your plan.</p>
        )}
      </Card>

      <div className="flex flex-wrap gap-3">
        <Link to="/schedule"><Button>Open Schedule</Button></Link>
        <Link to="/calendar"><Button variant="secondary">Calendar</Button></Link>
        <Link to="/progress"><Button variant="secondary">View Progress</Button></Link>
      </div>
    </div>
  );
}
