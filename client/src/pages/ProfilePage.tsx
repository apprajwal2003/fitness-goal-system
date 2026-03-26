import { useState, useEffect } from 'react';
import { usersApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import type { UserProfile } from '../types';

const selectClass = 'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

export function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    usersApi.getProfile().then(setForm).catch(() => setError('Failed to load profile')).finally(() => setLoading(false));
  }, []);

  const update = (path: keyof UserProfile, value: unknown) => setForm((f) => ({ ...f, [path]: value }));
  const updateNested = <K extends keyof UserProfile>(parent: K, key: string, value: unknown) =>
    setForm((f) => ({ ...f, [parent]: { ...(f[parent] as object), [key]: value } }));

  async function handleSave() {
    setError(''); setSuccess(false); setSaving(true);
    try {
      await usersApi.updateProfile(form);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  }

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Profile & Preferences</h1>
          <p className="text-slate-600 mt-1">Update your details. The schedule recalculates with your new preferences.</p>
        </div>
        <Button onClick={handleSave} loading={saving}>Save changes</Button>
      </div>

      <Card title="Body & Goals">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Weight (kg)" type="number" min={20} max={300} value={form.bodyMetrics?.weightKg ?? ''} onChange={(e) => updateNested('bodyMetrics', 'weightKg', e.target.value ? Number(e.target.value) : undefined)} />
          <Input label="Height (cm)" type="number" min={100} max={250} value={form.bodyMetrics?.heightCm ?? ''} onChange={(e) => updateNested('bodyMetrics', 'heightCm', e.target.value ? Number(e.target.value) : undefined)} />
          <Input label="Age" type="number" min={13} max={120} value={form.bodyMetrics?.age ?? ''} onChange={(e) => updateNested('bodyMetrics', 'age', e.target.value ? Number(e.target.value) : undefined)} />
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Gender</label><select className={selectClass} value={form.bodyMetrics?.gender ?? ''} onChange={(e) => updateNested('bodyMetrics', 'gender', e.target.value || undefined)}><option value="">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Fitness Goal</label><select className={selectClass} value={form.fitnessGoals?.goalType ?? ''} onChange={(e) => updateNested('fitnessGoals', 'goalType', e.target.value)}><option value="maintain">Maintain</option><option value="lose_weight">Lose weight</option><option value="build_muscle">Build muscle</option><option value="endurance">Endurance</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Diet</label><select className={selectClass} value={form.dietaryPreferences?.dietType ?? 'none'} onChange={(e) => updateNested('dietaryPreferences', 'dietType', e.target.value)}><option value="none">No restrictions</option><option value="vegetarian">Vegetarian</option><option value="vegan">Vegan</option><option value="pescatarian">Pescatarian</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Body Type</label><select className={selectClass} value={form.bodyType ?? ''} onChange={(e) => update('bodyType', e.target.value)}><option value="ectomorph">Ectomorph</option><option value="mesomorph">Mesomorph</option><option value="endomorph">Endomorph</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Athleticism Level</label><select className={selectClass} value={form.athleticismLevel ?? ''} onChange={(e) => update('athleticismLevel', e.target.value)}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Exercise Modality</label><select className={selectClass} value={form.exerciseModality ?? ''} onChange={(e) => update('exerciseModality', e.target.value)}><option value="gym">Gym</option><option value="yoga">Yoga</option><option value="home_workout">Home Workout</option><option value="cardio">Cardio</option><option value="mixed">Mixed</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Preferred Food Type</label><select className={selectClass} value={form.preferredFoodType ?? ''} onChange={(e) => update('preferredFoodType', e.target.value)}><option value="high_protein">High Protein</option><option value="low_carb">Low Carb</option><option value="balanced">Balanced</option></select></div>
          <Input label="Daily Water (L)" type="number" min={0} max={10} step={0.5} value={form.dailyWaterIntakeL ?? ''} onChange={(e) => update('dailyWaterIntakeL', e.target.value ? Number(e.target.value) : undefined)} />
          <Input label="Target Weight (kg)" type="number" min={20} max={300} value={form.fitnessGoals?.targetWeightKg ?? ''} onChange={(e) => updateNested('fitnessGoals', 'targetWeightKg', e.target.value ? Number(e.target.value) : undefined)} />
        </div>
      </Card>

      <Card title="Work, Sleep & Routine">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Work Start" type="time" value={form.workHours?.start ?? '09:00'} onChange={(e) => updateNested('workHours', 'start', e.target.value)} />
          <Input label="Work End" type="time" value={form.workHours?.end ?? '17:00'} onChange={(e) => updateNested('workHours', 'end', e.target.value)} />
          <Input label="Work Days/Week" type="number" min={0} max={7} value={form.workHours?.daysPerWeek ?? 5} onChange={(e) => updateNested('workHours', 'daysPerWeek', Number(e.target.value))} />
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Work Intensity</label><select className={selectClass} value={form.workIntensity ?? 'moderate'} onChange={(e) => update('workIntensity', e.target.value)}><option value="light">Light</option><option value="moderate">Moderate</option><option value="heavy">Heavy</option></select></div>
          <Input label="Travel (min/day)" type="number" min={0} max={180} value={form.travelMinutesPerDay ?? 0} onChange={(e) => update('travelMinutesPerDay', Number(e.target.value))} />
          <Input label="Sleep Time" type="time" value={form.sleepSchedule?.sleepTime ?? '23:00'} onChange={(e) => updateNested('sleepSchedule', 'sleepTime', e.target.value)} />
          <Input label="Wake Up Time" type="time" value={form.sleepSchedule?.wakeUpTime ?? '07:00'} onChange={(e) => updateNested('sleepSchedule', 'wakeUpTime', e.target.value)} />
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Preferred Workout Time</label><select className={selectClass} value={form.preferredWorkoutTime ?? 'flexible'} onChange={(e) => update('preferredWorkoutTime', e.target.value)}><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option><option value="flexible">Flexible</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Energy Level</label><select className={selectClass} value={form.energyLevelPreference ?? 'balanced'} onChange={(e) => update('energyLevelPreference', e.target.value)}><option value="high_morning">High Morning</option><option value="balanced">Balanced</option><option value="high_evening">High Evening</option></select></div>
          <label className="flex items-center gap-3 cursor-pointer md:col-span-3">
            <input type="checkbox" checked={form.weekendAvailability ?? true} onChange={(e) => update('weekendAvailability', e.target.checked)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-slate-700">Available for workouts on weekends</span>
          </label>
        </div>
      </Card>

      <Card title="Activity Durations">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Breakfast (min)" type="number" min={5} max={60} value={form.mealDurationsMinutes?.breakfast ?? 15} onChange={(e) => updateNested('mealDurationsMinutes', 'breakfast', Number(e.target.value))} />
          <Input label="Lunch (min)" type="number" min={5} max={90} value={form.mealDurationsMinutes?.lunch ?? 30} onChange={(e) => updateNested('mealDurationsMinutes', 'lunch', Number(e.target.value))} />
          <Input label="Dinner (min)" type="number" min={5} max={90} value={form.mealDurationsMinutes?.dinner ?? 30} onChange={(e) => updateNested('mealDurationsMinutes', 'dinner', Number(e.target.value))} />
          <Input label="Snack (min)" type="number" min={5} max={30} value={form.mealDurationsMinutes?.snack ?? 10} onChange={(e) => updateNested('mealDurationsMinutes', 'snack', Number(e.target.value))} />
          <Input label="Workout (min)" type="number" min={15} max={180} value={form.workoutDurationMinutes ?? 45} onChange={(e) => update('workoutDurationMinutes', Number(e.target.value))} />
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Max Workout Intensity</label><select className={selectClass} value={form.maxWorkoutIntensity ?? 'moderate'} onChange={(e) => update('maxWorkoutIntensity', e.target.value)}><option value="light">Light</option><option value="moderate">Moderate</option><option value="intense">Intense</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Meal Frequency</label><select className={selectClass} value={form.mealFrequency ?? 3} onChange={(e) => update('mealFrequency', Number(e.target.value))}><option value={3}>3 meals</option><option value={4}>4 meals (+ snack)</option><option value={5}>5 meals (+ 2 snacks)</option></select></div>
          <Input label="Daily Calorie Target" type="number" min={0} max={10000} placeholder="Auto-calculated" value={form.dailyCalorieTarget ?? ''} onChange={(e) => update('dailyCalorieTarget', e.target.value ? Number(e.target.value) : undefined)} />
        </div>
      </Card>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
      {success && <p className="text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2">Profile saved successfully.</p>}
      <Button onClick={handleSave} loading={saving}>Save changes</Button>
    </div>
  );
}
