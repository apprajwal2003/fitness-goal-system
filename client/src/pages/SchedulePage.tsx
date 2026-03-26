import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { scheduleApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import type { BusySlot, ScheduledActivity } from '../types';

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function SchedulePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const [selectedDate, setSelectedDate] = useState(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return dateParam;
    return toDateStr(new Date());
  });
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [scheduledActivities, setScheduledActivities] = useState<ScheduledActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBusy, setNewBusy] = useState({ start: '12:00', end: '13:00', label: 'Busy' });
  const [recalcMsg, setRecalcMsg] = useState('');
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  function loadDay() {
    setLoading(true);
    scheduleApi.getDay(selectedDate)
      .then((data) => { setBusySlots(data.busySlots); setScheduledActivities(data.scheduledActivities); })
      .catch(() => { setBusySlots([]); setScheduledActivities([]); })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) setSelectedDate(dateParam);
  }, [dateParam]);

  useEffect(() => { loadDay(); }, [selectedDate]);
  useEffect(() => { setSearchParams({ date: selectedDate }, { replace: true }); }, [selectedDate, setSearchParams]);
  useEffect(() => {
    if (loading || scheduledActivities.length > 0) return;
    scheduleApi.recalculate(selectedDate).then((res) => setScheduledActivities(res.scheduledActivities)).catch(() => {});
  }, [selectedDate, loading, scheduledActivities.length]);

  async function handleAddBusy() {
    const slot: BusySlot = { start: newBusy.start, end: newBusy.end, label: newBusy.label };
    const next = [...busySlots, slot];
    setBusySlots(next);
    setSaving(true);
    setRecalcMsg('');
    try {
      const res = await scheduleApi.updateBusy(selectedDate, next);
      setScheduledActivities(res.scheduledActivities);
      setRecalcMsg('Schedule recalculated to accommodate your busy time.');
      setTimeout(() => setRecalcMsg(''), 4000);
    } finally { setSaving(false); }
  }

  function removeBusy(index: number) {
    const next = busySlots.filter((_, i) => i !== index);
    setBusySlots(next);
    setSaving(true);
    scheduleApi.updateBusy(selectedDate, next).then((res) => { setScheduledActivities(res.scheduledActivities); setSaving(false); });
  }

  async function toggleComplete(index: number, completed: boolean) {
    await scheduleApi.markComplete(selectedDate, index, completed);
    setScheduledActivities((prev) => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index], completed };
      return next;
    });
  }

  async function recalculate() {
    setSaving(true);
    try {
      const res = await scheduleApi.recalculate(selectedDate);
      setScheduledActivities(res.scheduledActivities);
    } finally { setSaving(false); }
  }

  const prevDay = () => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() - 1); setSelectedDate(toDateStr(d)); };
  const nextDay = () => { const d = new Date(selectedDate + 'T12:00:00'); d.setDate(d.getDate() + 1); setSelectedDate(toDateStr(d)); };

  const totalCalIn = scheduledActivities.filter((a) => (a.type === 'meal' || a.type === 'snack') && a.completed && a.nutrition).reduce((s, a) => s + (a.nutrition?.calories ?? 0), 0);
  const totalCalBurned = scheduledActivities.filter((a) => a.type === 'workout' && a.completed && a.nutrition).reduce((s, a) => s + (a.nutrition?.calories ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="font-display text-2xl font-bold text-slate-900">Schedule</h1>
        <div className="flex items-center gap-2">
          <button type="button" onClick={prevDay} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition">&#8592;</button>
          <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500" />
          <button type="button" onClick={nextDay} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition">&#8594;</button>
        </div>
      </div>

      {(totalCalIn > 0 || totalCalBurned > 0) && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-xs text-amber-700 uppercase tracking-wider">Calories Consumed</p>
            <p className="text-2xl font-display font-bold text-amber-600">{totalCalIn} kcal</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-700 uppercase tracking-wider">Calories Burned</p>
            <p className="text-2xl font-display font-bold text-emerald-600">{totalCalBurned} kcal</p>
          </div>
        </div>
      )}

      <Card title="Mark time as busy">
        <p className="text-sm text-slate-600 mb-4">Add a busy block and the schedule recalculates automatically.</p>
        <div className="flex flex-wrap items-end gap-3">
          <input type="time" value={newBusy.start} onChange={(e) => setNewBusy((b) => ({ ...b, start: e.target.value }))} className="px-3 py-2 rounded-lg border border-slate-300" />
          <input type="time" value={newBusy.end} onChange={(e) => setNewBusy((b) => ({ ...b, end: e.target.value }))} className="px-3 py-2 rounded-lg border border-slate-300" />
          <input type="text" placeholder="Label" value={newBusy.label} onChange={(e) => setNewBusy((b) => ({ ...b, label: e.target.value }))} className="px-3 py-2 rounded-lg border border-slate-300 w-32" />
          <Button onClick={handleAddBusy} disabled={saving}>Add busy</Button>
        </div>
        {recalcMsg && <p className="mt-3 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{recalcMsg}</p>}
        {busySlots.length > 0 && (
          <ul className="mt-4 space-y-2">
            {busySlots.map((b, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="bg-slate-100 border border-slate-300 text-slate-600 px-2 py-1 rounded">{b.start}&#8211;{b.end} {b.label}</span>
                <button type="button" onClick={() => removeBusy(i)} className="text-red-600 hover:underline text-xs">Remove</button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title={`Plan for ${selectedDate}`}>
        {loading ? (
          <div className="flex justify-center py-8"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button variant="secondary" onClick={recalculate} disabled={saving}>Recalculate</Button>
            </div>
            <ul className="space-y-3">
              {scheduledActivities.map((a, i) => {
                const isMeal = a.type === 'meal' || a.type === 'snack';
                const isExpanded = expandedIdx === i;
                return (
                  <li key={i} className="rounded-xl border overflow-hidden">
                    <div className={`flex items-center gap-4 p-4 cursor-pointer transition ${
                      a.completed ? 'bg-emerald-50 border-emerald-200' :
                      isMeal ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'
                    }`} onClick={() => setExpandedIdx(isExpanded ? null : i)}>
                      <span className="text-sm font-mono text-slate-500 w-28 shrink-0">{a.start} &#8211; {a.end}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{a.name ?? a.type}</p>
                        {a.nutrition && <p className="text-xs text-slate-500">{isMeal ? `${a.nutrition.calories} kcal` : `Burns ~${a.nutrition.calories} kcal`}</p>}
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer shrink-0" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={a.completed ?? false} onChange={(e) => toggleComplete(i, e.target.checked)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm text-slate-600">Done</span>
                      </label>
                      <span className="text-slate-400 text-xs">{isExpanded ? '&#9650;' : '&#9660;'}</span>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 bg-white border-t border-slate-100">
                        {a.nutrition && (
                          <div className="grid grid-cols-4 gap-2 mt-3 text-center text-xs">
                            <div className="bg-slate-50 rounded-lg p-2"><p className="text-slate-500">Calories</p><p className="font-bold text-slate-800">{a.nutrition.calories}</p></div>
                            <div className="bg-blue-50 rounded-lg p-2"><p className="text-blue-600">Protein</p><p className="font-bold text-blue-800">{a.nutrition.proteinG}g</p></div>
                            <div className="bg-amber-50 rounded-lg p-2"><p className="text-amber-600">Carbs</p><p className="font-bold text-amber-800">{a.nutrition.carbsG}g</p></div>
                            <div className="bg-rose-50 rounded-lg p-2"><p className="text-rose-600">Fat</p><p className="font-bold text-rose-800">{a.nutrition.fatG}g</p></div>
                          </div>
                        )}
                        {a.exerciseDetails && a.exerciseDetails.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Exercises</p>
                            <ul className="space-y-1.5">
                              {a.exerciseDetails.map((ex, j) => (
                                <li key={j} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-3 py-2">
                                  <div>
                                    <span className="font-medium text-slate-800">{ex.exerciseName}</span>
                                    <span className="text-slate-500 ml-2">{ex.sets && `${ex.sets} sets`} {ex.reps && `x ${ex.reps}`}</span>
                                  </div>
                                  <div className="flex gap-1">
                                    {ex.muscleGroups.slice(0, 3).map((mg) => (
                                      <span key={mg} className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">{mg.replace('_', ' ')}</span>
                                    ))}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {a.mealDetail && (
                          <div className="mt-3">
                            {a.mealDetail.description && <p className="text-sm text-slate-600">{a.mealDetail.description}</p>}
                            {a.mealDetail.alternatives.length > 0 && (
                              <div className="mt-2">
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Alternatives</p>
                                <ul className="space-y-1">
                                  {a.mealDetail.alternatives.map((alt) => (
                                    <li key={alt.mealId} className="flex justify-between text-sm bg-slate-50 rounded-lg px-3 py-1.5">
                                      <span className="text-slate-700">{alt.mealName}</span>
                                      <span className="text-slate-500">{alt.calories} kcal</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {scheduledActivities.length === 0 && !loading && (
              <p className="text-slate-500 text-center py-4">No activities scheduled. Click Recalculate to generate a plan.</p>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
