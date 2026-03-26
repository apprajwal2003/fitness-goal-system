import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { scheduleApi } from '../services/api';
import { Card } from '../components/ui/Card';
import type { DaySchedule } from '../types';

function toDateStr(d: Date): string { return d.toISOString().slice(0, 10); }

function getMonthStartEnd(year: number, month: number) {
  return { start: toDateStr(new Date(year, month, 1)), end: toDateStr(new Date(year, month + 1, 0)) };
}

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startPad = first.getDay();
  const days: { date: string; isCurrentMonth: boolean }[] = [];
  const padStart = new Date(first);
  padStart.setDate(padStart.getDate() - startPad);
  for (let i = 0; i < startPad; i++) {
    const d = new Date(padStart); d.setDate(d.getDate() + i);
    days.push({ date: toDateStr(d), isCurrentMonth: false });
  }
  for (let d = 1; d <= last.getDate(); d++) days.push({ date: toDateStr(new Date(year, month, d)), isCurrentMonth: true });
  const remaining = 42 - days.length;
  const nextMonth = new Date(year, month + 1, 1);
  for (let i = 0; i < remaining; i++) {
    const d = new Date(nextMonth); d.setDate(d.getDate() + i);
    days.push({ date: toDateStr(d), isCurrentMonth: false });
  }
  return days;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayStats(day: DaySchedule | undefined) {
  if (!day || day.scheduledActivities.length === 0) return null;
  const workouts = day.scheduledActivities.filter((a) => a.type === 'workout');
  const meals = day.scheduledActivities.filter((a) => a.type === 'meal' || a.type === 'snack');
  const completedW = workouts.filter((a) => a.completed).length;
  const completedM = meals.filter((a) => a.completed).length;
  const total = day.scheduledActivities.length;
  const done = day.scheduledActivities.filter((a) => a.completed).length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 0;
  const caloriesBurned = workouts.filter((a) => a.completed).reduce((s, a) => s + (a.nutrition?.calories ?? 0), 0);
  return { completedW, totalW: workouts.length, completedM, totalM: meals.length, percent, caloriesBurned };
}

export function CalendarPage() {
  const [now] = useState(() => new Date());
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  const { start, end } = getMonthStartEnd(year, month);

  useEffect(() => {
    setLoading(true);
    scheduleApi.getRange(start, end).then((r) => setSchedule(r.schedule)).finally(() => setLoading(false));
  }, [start, end]);

  const byDate = new Map(schedule.map((s) => [s.date, s]));
  const calendarDays = getCalendarDays(year, month);
  const today = toDateStr(new Date());

  function dayStatus(date: string): 'done' | 'missed' | 'partial' | 'none' {
    const stats = getDayStats(byDate.get(date));
    if (!stats) return 'none';
    if (stats.totalW === 0) return 'none';
    if (stats.completedW >= stats.totalW) return 'done';
    if (stats.completedW > 0) return 'partial';
    return date < today ? 'missed' : 'none';
  }

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); };
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });

  // Weekly summary for current view
  const currentMonthSchedule = schedule.filter((s) => s.date >= start && s.date <= end);
  const weeklyWorkouts = currentMonthSchedule.reduce((s, d) => s + d.scheduledActivities.filter((a) => a.type === 'workout' && a.completed).length, 0);
  const weeklyTotalWorkouts = currentMonthSchedule.reduce((s, d) => s + d.scheduledActivities.filter((a) => a.type === 'workout').length, 0);
  const weeklyMeals = currentMonthSchedule.reduce((s, d) => s + d.scheduledActivities.filter((a) => (a.type === 'meal' || a.type === 'snack') && a.completed).length, 0);
  const weeklyTotalMeals = currentMonthSchedule.reduce((s, d) => s + d.scheduledActivities.filter((a) => a.type === 'meal' || a.type === 'snack').length, 0);
  const weeklyCalBurned = currentMonthSchedule.reduce((s, d) => s + d.scheduledActivities.filter((a) => a.type === 'workout' && a.completed).reduce((c, a) => c + (a.nutrition?.calories ?? 0), 0), 0);

  const hoveredStats = hoveredDate ? getDayStats(byDate.get(hoveredDate)) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Calendar</h1>
        <p className="text-slate-600 mt-1">Track your workout and meal completion across the month.</p>
      </div>

      {!loading && (weeklyTotalWorkouts > 0 || weeklyTotalMeals > 0) && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-700 uppercase tracking-wider">Workouts</p>
            <p className="text-xl font-display font-bold text-emerald-600">{weeklyWorkouts}/{weeklyTotalWorkouts}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-xs text-amber-700 uppercase tracking-wider">Meals Followed</p>
            <p className="text-xl font-display font-bold text-amber-600">{weeklyMeals}/{weeklyTotalMeals}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
            <p className="text-xs text-blue-700 uppercase tracking-wider">Calories Burned</p>
            <p className="text-xl font-display font-bold text-blue-600">{weeklyCalBurned}</p>
          </div>
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between mb-6">
          <button type="button" onClick={prevMonth} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition">&#8592; Previous</button>
          <h2 className="font-display font-semibold text-slate-800 text-lg">{monthName}</h2>
          <button type="button" onClick={nextMonth} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 transition">Next &#8594;</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAY_NAMES.map((day) => <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 relative">
              {calendarDays.map(({ date, isCurrentMonth }) => {
                const status = dayStatus(date);
                const isToday = date === today;
                const stats = getDayStats(byDate.get(date));
                const bg = status === 'done' ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : status === 'missed' ? 'bg-red-100 text-red-800 hover:bg-red-200'
                  : status === 'partial' ? 'bg-amber-200 text-amber-900 hover:bg-amber-300'
                  : isCurrentMonth ? 'bg-slate-50 text-slate-700 hover:bg-slate-100' : 'bg-slate-50/50 text-slate-400';
                const statusIcon = status === 'done' ? '\u2714' : status === 'missed' ? '\u2718' : status === 'partial' ? '\u26A0' : '';
                return (
                  <Link key={date} to={`/schedule?date=${date}`}
                    className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition relative ${bg} ${isToday ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
                    onMouseEnter={() => setHoveredDate(date)} onMouseLeave={() => setHoveredDate(null)}>
                    <span>{new Date(date + 'T12:00:00').getDate()}</span>
                    {statusIcon && <span className="text-[10px] leading-none mt-0.5">{statusIcon}</span>}
                    {stats && <span className="text-[9px] leading-none mt-0.5 opacity-70">{stats.percent}%</span>}
                  </Link>
                );
              })}
            </div>

            {hoveredDate && hoveredStats && (
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm">
                <p className="font-medium text-slate-800 mb-1">{hoveredDate}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <span>Workouts: {hoveredStats.completedW}/{hoveredStats.totalW}</span>
                  <span>Meals: {hoveredStats.completedM}/{hoveredStats.totalM}</span>
                  <span>Burned: {hoveredStats.caloriesBurned} kcal</span>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-slate-200">
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-emerald-500" /> Done</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-red-100 border border-red-200" /> Missed</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-amber-200" /> Partial</span>
              <span className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-slate-100" /> No data</span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
