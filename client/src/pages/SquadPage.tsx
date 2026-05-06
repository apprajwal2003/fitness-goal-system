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
  const [createDescription, setCreateDescription] = useState('');
  const [createPrivacy, setCreatePrivacy] = useState<'public' | 'invite_only'>('invite_only');
  const [joinId, setJoinId] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  function loadSquad() { squadsApi.getMy().then((res) => setSquad(res.squad)); }
  function loadLeaderboard() { squadsApi.leaderboard(date).then((res) => setLeaderboard(res.leaderboard)); }

  useEffect(() => { loadSquad(); }, []);
  useEffect(() => { if (squad) loadLeaderboard(); }, [squad, date]);

  async function handleCreate() {
    if (!createName.trim()) return;
    setError(''); setLoading(true);
    try {
      await squadsApi.create({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        privacy: createPrivacy,
      });
      setCreateName(''); setCreateDescription('');
      loadSquad();
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create squad'); }
    finally { setLoading(false); }
  }

  async function handleJoinById() {
    if (!joinId.trim()) return;
    setError(''); setLoading(true);
    try { await squadsApi.join(joinId.trim()); setJoinId(''); loadSquad(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to join squad'); }
    finally { setLoading(false); }
  }

  async function handleJoinByCode() {
    if (!joinCode.trim()) return;
    setError(''); setLoading(true);
    try { await squadsApi.joinByCode(joinCode.trim()); setJoinCode(''); loadSquad(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to join squad'); }
    finally { setLoading(false); }
  }

  async function copyInviteCode() {
    if (!squad?.inviteCode) return;
    try {
      await navigator.clipboard.writeText(squad.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable; ignore */
    }
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
          <div className="space-y-5">
            <div className="space-y-3 border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-700">Create a new squad</p>
              <Input placeholder="Squad name" value={createName} onChange={(e) => setCreateName(e.target.value)} />
              <Input placeholder="Description (optional)" value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} />
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Privacy</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={createPrivacy}
                  onChange={(e) => setCreatePrivacy(e.target.value as 'public' | 'invite_only')}
                >
                  <option value="invite_only">Invite-only (join via invite code)</option>
                  <option value="public">Public (anyone can find by ID)</option>
                </select>
              </div>
              <Button onClick={handleCreate} loading={loading} fullWidth>Create squad</Button>
            </div>

            <div className="space-y-3 border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-700">Join with an invite code</p>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. AB23XY"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="flex-1"
                />
                <Button onClick={handleJoinByCode} loading={loading}>Join</Button>
              </div>
            </div>

            <div className="space-y-3 border border-slate-200 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-700">Or join by squad ID</p>
              <div className="flex gap-2">
                <Input placeholder="Squad ID" value={joinId} onChange={(e) => setJoinId(e.target.value)} className="flex-1" />
                <Button variant="secondary" onClick={handleJoinById} loading={loading}>Join</Button>
              </div>
            </div>
          </div>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </Card>
      ) : (
        <>
          <Card>
            <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
              <div>
                <h2 className="font-display font-semibold text-lg text-slate-800">{squad.name}</h2>
                {squad.description && <p className="text-sm text-slate-600 mt-1">{squad.description}</p>}
                <p className="text-xs text-slate-500 mt-1">
                  {squad.members.length} member{squad.members.length !== 1 ? 's' : ''}
                  {squad.privacy === 'public' ? ' · Public' : ' · Invite-only'}
                </p>
              </div>
              {squad.inviteCode && (
                <div className="text-right">
                  <p className="text-xs text-slate-500 mb-0.5">Invite code (share to invite)</p>
                  <div className="inline-flex items-center gap-2">
                    <p className="font-mono text-base bg-primary-50 border border-primary-200 text-primary-700 px-3 py-1.5 rounded-lg tracking-wider select-all">
                      {squad.inviteCode}
                    </p>
                    <button
                      type="button"
                      onClick={copyInviteCode}
                      className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
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
