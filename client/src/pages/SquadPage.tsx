import { useEffect, useState } from 'react';
import { squadsApi } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import type { LeaderboardEntry, Squad } from '../types';

function toDateStr(d: Date): string { return d.toISOString().slice(0, 10); }

type ViewMode = 'daily' | 'weekly' | 'monthly';

export function SquadPage() {
  const [squad, setSquad] = useState<Squad | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [date, setDate] = useState(toDateStr(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [createName, setCreateName] = useState('');
  const [joinId, setJoinId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function loadSquad() { squadsApi.getMy().then((res) => setSquad(res.squad)); }
  function loadLeaderboard() { squadsApi.leaderboard(date).then((res) => setLeaderboard(res.leaderboard)); }

  useEffect(() => { loadSquad(); }, []);
  useEffect(() => { if (squad) loadLeaderboard(); }, [squad, date]);

  async function handleCreate() {
    if (!createName.trim()) return;
    setError(''); setLoading(true);
    try { await squadsApi.create(createName.trim()); setCreateName(''); loadSquad(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to create squad'); }
    finally { setLoading(false); }
  }

  async function handleJoin() {
    if (!joinId.trim()) return;
    setError(''); setLoading(true);
    try { await squadsApi.join(joinId.trim()); setJoinId(''); loadSquad(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to join squad'); }
    finally { setLoading(false); }
  }

  const rankColors = ['bg-yellow-100 border-yellow-300 text-yellow-800', 'bg-slate-100 border-slate-300 text-slate-700', 'bg-amber-50 border-amber-300 text-amber-800'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Squad & Leaderboard</h1>
        <p className="text-slate-600 mt-1">Compete with friends and stay accountable together.</p>
      </div>

      {!squad ? (
        <Card title="Create or join a squad">
          <p className="text-slate-600 mb-4">Create a squad to compare progress with friends. Goal % is standardized across all members.</p>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="Squad name" value={createName} onChange={(e) => setCreateName(e.target.value)} className="flex-1" />
              <Button onClick={handleCreate} loading={loading}>Create</Button>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Squad ID to join" value={joinId} onChange={(e) => setJoinId(e.target.value)} className="flex-1" />
              <Button variant="secondary" onClick={handleJoin} loading={loading}>Join</Button>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800">{squad.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{squad.members.length} member{squad.members.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 mb-0.5">Squad ID (share to invite)</p>
                <p className="font-mono text-xs bg-slate-100 px-3 py-1 rounded-lg break-all select-all">{squad.id}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {squad.members.map((m) => (
                <span key={m.id} className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-sm">
                  <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">{m.name.charAt(0).toUpperCase()}</span>
                  <span className="text-slate-700">{m.name}</span>
                </span>
              ))}
            </div>
          </Card>

          <Card title="Leaderboard">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex gap-1">
                {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
                  <button key={mode} type="button" onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${viewMode === mode ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 text-sm" />
            </div>
            <ul className="space-y-2">
              {leaderboard.map((entry, i) => (
                <li key={entry.userId} className={`flex items-center gap-4 p-4 rounded-xl border transition ${i < 3 ? rankColors[i] : 'bg-slate-50 border-slate-100'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm ${
                    i === 0 ? 'bg-yellow-300 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-800' : i === 2 ? 'bg-amber-300 text-amber-900' : 'bg-slate-200 text-slate-600'
                  }`}>{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{entry.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display font-bold text-lg text-primary-600">{entry.goalPercent}%</p>
                    <p className="text-xs text-slate-500">goal</p>
                  </div>
                </li>
              ))}
            </ul>
            {leaderboard.length === 0 && <p className="text-slate-500 text-center py-4">No data for this date yet.</p>}
          </Card>
        </>
      )}
    </div>
  );
}
