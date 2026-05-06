import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersApi } from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import type { UserProfile } from '../types';

const dietOptions = [
  { value: 'none', label: 'No restrictions' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'pescatarian', label: 'Pescatarian' },
];
const goalOptions = [
  { value: 'maintain', label: 'Maintain fitness' },
  { value: 'lose_weight', label: 'Lose weight' },
  { value: 'build_muscle', label: 'Build muscle' },
  { value: 'endurance', label: 'Improve endurance' },
];
const bodyTypeInfo: Record<string, string> = {
  ectomorph: 'Lean build, fast metabolism, finds it harder to gain weight.',
  mesomorph: 'Athletic build, gains muscle easily, naturally strong.',
  endomorph: 'Wider build, gains weight easily, benefits from cardio + strength.',
};

const selectClass = 'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent';

export function OnboardingPage() {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Partial<UserProfile>>({
    bodyMetrics: {},
    dietaryPreferences: {},
    fitnessGoals: {},
    workHours: { start: '09:00', end: '17:00', daysPerWeek: 5 },
    travelMinutesPerDay: 0,
    weeklyRoutine: [],
    mealDurationsMinutes: { breakfast: 15, lunch: 30, dinner: 30, snack: 10 },
    workoutDurationMinutes: 45,
    bodyType: 'mesomorph',
    athleticismLevel: 'beginner',
    exerciseModality: 'mixed',
    preferredFoodType: 'balanced',
    dailyWaterIntakeL: 2.5,
    sleepSchedule: { sleepTime: '23:00', wakeUpTime: '07:00' },
    preferredWorkoutTime: 'flexible',
    energyLevelPreference: 'balanced',
    weekendAvailability: true,
    workIntensity: 'moderate',
    maxWorkoutIntensity: 'moderate',
    mealFrequency: 3,
  });

  const update = (path: keyof UserProfile, value: unknown) => setForm((f) => ({ ...f, [path]: value }));
  const updateNested = <K extends keyof UserProfile>(parent: K, key: string, value: unknown) =>
    setForm((f) => ({ ...f, [parent]: { ...(f[parent] as object), [key]: value } }));

  async function handleFinish() {
    setError('');
    setLoading(true);
    try {
      await usersApi.updateProfile({ ...form, onboardingCompleted: true });
      await refreshUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  }

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-slate-900">Set up your profile</h1>
          <p className="text-slate-600 mt-2 text-lg">Step {step} of {totalSteps} — We'll use this to build your personalized plan</p>
          <div className="mt-5 flex justify-center gap-2">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className={`h-2 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary-500 w-16' : 'bg-slate-200 w-12'}`} />
            ))}
          </div>
        </div>

        <Card>
          {step === 1 && (
            <>
              <h2 className="font-display font-semibold text-lg text-slate-800 mb-5">Body, Goals & Diet</h2>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Weight (kg)" type="number" min={20} max={300} value={form.bodyMetrics?.weightKg ?? ''} onChange={(e) => updateNested('bodyMetrics', 'weightKg', e.target.value ? Number(e.target.value) : undefined)} />
                  <Input label="Height (cm)" type="number" min={100} max={250} value={form.bodyMetrics?.heightCm ?? ''} onChange={(e) => updateNested('bodyMetrics', 'heightCm', e.target.value ? Number(e.target.value) : undefined)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Age" type="number" min={13} max={120} value={form.bodyMetrics?.age ?? ''} onChange={(e) => updateNested('bodyMetrics', 'age', e.target.value ? Number(e.target.value) : undefined)} />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                    <select className={selectClass} value={form.bodyMetrics?.gender ?? ''} onChange={(e) => updateNested('bodyMetrics', 'gender', e.target.value || undefined)}>
                      <option value="">Prefer not to say</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fitness Goal</label>
                    <select className={selectClass} value={form.fitnessGoals?.goalType ?? 'maintain'} onChange={(e) => updateNested('fitnessGoals', 'goalType', e.target.value)}>
                      {goalOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Diet</label>
                    <select className={selectClass} value={form.dietaryPreferences?.dietType ?? 'none'} onChange={(e) => updateNested('dietaryPreferences', 'dietType', e.target.value)}>
                      {dietOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Body Type</label>
                    <select className={selectClass} value={form.bodyType ?? 'mesomorph'} onChange={(e) => update('bodyType', e.target.value)}>
                      <option value="ectomorph">Ectomorph</option>
                      <option value="mesomorph">Mesomorph</option>
                      <option value="endomorph">Endomorph</option>
                    </select>
                    {form.bodyType && <p className="text-xs text-slate-500 mt-1">{bodyTypeInfo[form.bodyType]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Athleticism Level</label>
                    <select className={selectClass} value={form.athleticismLevel ?? 'beginner'} onChange={(e) => update('athleticismLevel', e.target.value)}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Exercise Modality</label>
                    <select className={selectClass} value={form.exerciseModality ?? 'mixed'} onChange={(e) => update('exerciseModality', e.target.value)}>
                      <option value="gym">Gym</option>
                      <option value="yoga">Yoga</option>
                      <option value="aerobics">Aerobics</option>
                      <option value="home_workout">Home Workout</option>
                      <option value="cardio">Cardio</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Food Type</label>
                    <select className={selectClass} value={form.preferredFoodType ?? 'balanced'} onChange={(e) => update('preferredFoodType', e.target.value)}>
                      <option value="high_protein">High Protein</option>
                      <option value="low_carb">Low Carb</option>
                      <option value="balanced">Balanced Diet</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input label="Daily Water Intake (liters)" type="number" min={0} max={10} step={0.5} value={form.dailyWaterIntakeL ?? 2.5} onChange={(e) => update('dailyWaterIntakeL', Number(e.target.value))} />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Foods to Avoid</label>
                    <select multiple className={`${selectClass} h-24`} value={form.foodsToAvoid ?? []}
                      onChange={(e) => update('foodsToAvoid', Array.from(e.target.selectedOptions, (o) => o.value))}>
                      {['dairy', 'gluten', 'sugar', 'junk_food', 'nuts', 'soy'].map((f) => (
                        <option key={f} value={f}>{f.replace('_', ' ').replace(/^\w/, (c) => c.toUpperCase())}</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-0.5">Hold Ctrl/Cmd to select multiple</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-display font-semibold text-lg text-slate-800 mb-5">Work, Sleep & Routine</h2>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Work Start" type="time" value={form.workHours?.start ?? '09:00'} onChange={(e) => updateNested('workHours', 'start', e.target.value)} />
                  <Input label="Work End" type="time" value={form.workHours?.end ?? '17:00'} onChange={(e) => updateNested('workHours', 'end', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Work days per week" type="number" min={0} max={7} value={form.workHours?.daysPerWeek ?? 5} onChange={(e) => updateNested('workHours', 'daysPerWeek', Number(e.target.value))} />
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Work Intensity</label>
                    <select className={selectClass} value={form.workIntensity ?? 'moderate'} onChange={(e) => update('workIntensity', e.target.value)}>
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="heavy">Heavy</option>
                    </select>
                  </div>
                </div>
                <Input label="Travel time (minutes/day)" type="number" min={0} max={180} value={form.travelMinutesPerDay ?? 0} onChange={(e) => update('travelMinutesPerDay', Number(e.target.value))} />

                <div className="border-t border-slate-200 pt-5">
                  <h3 className="font-medium text-slate-700 mb-3">Sleep Schedule</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Sleep Time" type="time" value={form.sleepSchedule?.sleepTime ?? '23:00'} onChange={(e) => updateNested('sleepSchedule', 'sleepTime', e.target.value)} />
                    <Input label="Wake Up Time" type="time" value={form.sleepSchedule?.wakeUpTime ?? '07:00'} onChange={(e) => updateNested('sleepSchedule', 'wakeUpTime', e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Workout Time</label>
                    <select className={selectClass} value={form.preferredWorkoutTime ?? 'flexible'} onChange={(e) => update('preferredWorkoutTime', e.target.value)}>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Energy Level</label>
                    <select className={selectClass} value={form.energyLevelPreference ?? 'balanced'} onChange={(e) => update('energyLevelPreference', e.target.value)}>
                      <option value="high_morning">High Morning Energy</option>
                      <option value="balanced">Balanced</option>
                      <option value="high_evening">High Evening Energy</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.weekendAvailability ?? true} onChange={(e) => update('weekendAvailability', e.target.checked)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-slate-700">Available for workouts on weekends</span>
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="font-display font-semibold text-lg text-slate-800 mb-5">Activity Durations & Preferences</h2>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Breakfast (min)" type="number" min={5} max={60} value={form.mealDurationsMinutes?.breakfast ?? 15} onChange={(e) => updateNested('mealDurationsMinutes', 'breakfast', Number(e.target.value))} />
                  <Input label="Lunch (min)" type="number" min={5} max={90} value={form.mealDurationsMinutes?.lunch ?? 30} onChange={(e) => updateNested('mealDurationsMinutes', 'lunch', Number(e.target.value))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Dinner (min)" type="number" min={5} max={90} value={form.mealDurationsMinutes?.dinner ?? 30} onChange={(e) => updateNested('mealDurationsMinutes', 'dinner', Number(e.target.value))} />
                  <Input label="Snack (min)" type="number" min={5} max={30} value={form.mealDurationsMinutes?.snack ?? 10} onChange={(e) => updateNested('mealDurationsMinutes', 'snack', Number(e.target.value))} />
                </div>
                <Input label="Workout duration (min)" type="number" min={15} max={180} value={form.workoutDurationMinutes ?? 45} onChange={(e) => update('workoutDurationMinutes', Number(e.target.value))} />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Max Workout Intensity</label>
                    <select className={selectClass} value={form.maxWorkoutIntensity ?? 'moderate'} onChange={(e) => update('maxWorkoutIntensity', e.target.value)}>
                      <option value="light">Light</option>
                      <option value="moderate">Moderate</option>
                      <option value="intense">Intense</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Meal Frequency</label>
                    <select className={selectClass} value={form.mealFrequency ?? 3} onChange={(e) => update('mealFrequency', Number(e.target.value))}>
                      <option value={3}>3 meals</option>
                      <option value={4}>4 meals (+ snack)</option>
                      <option value={5}>5 meals (+ 2 snacks)</option>
                    </select>
                  </div>
                </div>

                <Input label="Daily Calorie Target (optional)" type="number" min={0} max={10000} placeholder="Auto-calculated if empty" value={form.dailyCalorieTarget ?? ''} onChange={(e) => update('dailyCalorieTarget', e.target.value ? Number(e.target.value) : undefined)} />
              </div>
            </>
          )}

          {error && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
          <div className="mt-6 flex justify-between">
            {step > 1 ? (
              <Button variant="secondary" type="button" onClick={() => setStep((s) => s - 1)}>Back</Button>
            ) : <span />}
            {step < totalSteps ? (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>Next</Button>
            ) : (
              <Button loading={loading} onClick={handleFinish}>Finish setup</Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
