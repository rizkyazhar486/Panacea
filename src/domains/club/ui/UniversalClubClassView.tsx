import React, { useState } from 'react';
import {
  evaluateClassBooking,
  generateAmericanoBrackets,
  type ClubClassSession,
  type AmericanoMatch,
} from '../engine/universalClubClassEngine';

export interface UniversalClubClassViewProps {
  readonly initialCredits?: number;
  readonly userRecoveryScorePercent?: number;
}

const SAMPLE_SESSIONS: readonly ClubClassSession[] = [
  {
    id: 'SESS-PADEL-01',
    title: 'Sunset Padel Americano',
    studioOrClubName: 'Jungle Padel Canggu',
    venueAddress: 'Jl. Subak Sari No. 10, Bali',
    sportType: 'Padel',
    skillBracket: 'INTERMEDIATE_DUPR_3_TO_4',
    metabolicIntensity: 'ANAEROBIC_LACTATE_ZONE_4_5',
    startTimestampMs: Date.now() + 3600000 * 3,
    durationMinutes: 90,
    maxCapacity: 8,
    registeredUserIds: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6'],
    waitlistUserIds: [],
    creditCost: 6,
    feeRp: 160000,
  },
  {
    id: 'SESS-SAUNA-02',
    title: 'Infrared Sauna & Contrast Plunge',
    studioOrClubName: 'Recovery Sanctum Uluwatu',
    venueAddress: 'Jl. Pantai Suluban No. 8',
    sportType: 'InfraredSaunaColdPlunge',
    skillBracket: 'ALL_LEVELS_WELCOME',
    metabolicIntensity: 'RESTORATIVE_ZONE_1',
    startTimestampMs: Date.now() + 3600000 * 5,
    durationMinutes: 60,
    maxCapacity: 6,
    registeredUserIds: ['u1', 'u2'],
    waitlistUserIds: [],
    creditCost: 4,
    feeRp: 120000,
  },
  {
    id: 'SESS-REFORMER-03',
    title: 'Dynamic Reformer Core & Glutes',
    studioOrClubName: 'Atelier Pilates Studio',
    venueAddress: 'Sunset Road No. 88, Seminyak',
    sportType: 'PilatesReformer',
    skillBracket: 'ALL_LEVELS_WELCOME',
    metabolicIntensity: 'AEROBIC_ZONE_2',
    startTimestampMs: Date.now() + 3600000 * 8,
    durationMinutes: 50,
    maxCapacity: 10,
    registeredUserIds: ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u8', 'u9', 'u10'],
    waitlistUserIds: ['w1'],
    creditCost: 5,
    feeRp: 140000,
  },
];

export const UniversalClubClassView: React.FC<UniversalClubClassViewProps> = ({
  initialCredits = 18,
  userRecoveryScorePercent = 78,
}) => {
  const [credits, setCredits] = useState<number>(initialCredits);
  const [sessions, setSessions] = useState<readonly ClubClassSession[]>(SAMPLE_SESSIONS);
  const [bookedIds, setBookedIds] = useState<ReadonlySet<string>>(new Set());
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [americanoMatches, setAmericanoMatches] = useState<readonly AmericanoMatch[] | null>(null);

  const handleBook = (session: ClubClassSession) => {
    const result = evaluateClassBooking({
      session,
      userId: 'CURRENT_USER',
      userCreditsAvailable: credits,
      userRecoveryScorePercent,
      currentTimestampMs: Date.now(),
    });

    if (result.ok) {
      setCredits(result.remainingCredits);
      setSessions((prev) => prev.map((s) => (s.id === session.id ? result.updatedSession : s)));
      setBookedIds((prev) => new Set([...prev, session.id]));
      setLastMessage(result.message);
    } else {
      setLastMessage(result.message);
    }
  };

  const handleGenerateAmericano = () => {
    const roster = ['Alex (3.5)', 'Budi (3.8)', 'Citra (3.2)', 'David (4.0)', 'Emma (3.5)', 'Farhan (3.7)', 'Grace (3.4)', 'Hadi (3.9)'];
    const matches = generateAmericanoBrackets(roster, 2);
    setAmericanoMatches(matches);
  };

  return (
    <section
      aria-label="Universal Club & Class Pass"
      className="w-full max-w-5xl mx-auto p-6 md:p-10 space-y-8 bg-[#07090C] text-[#E5E9EE] rounded-3xl border border-white/5 font-sans"
    >
      {/* Header bar with glassmorphic credit wallet */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#00F0FF] animate-pulse" />
            <span className="text-[11px] font-mono tracking-widest uppercase text-neutral-400">
              Community Sports & Studio Pass
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-light tracking-tight text-white">
            Universal Club & Drop-in Matrix
          </h2>
        </div>

        {/* Apple-style Glassmorphic Credit Counter */}
        <div className="flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Class Credits</div>
            <div className="text-2xl font-light tabular-nums text-[#00F0FF]">{credits}</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Recovery Status</div>
            <div className="text-sm font-medium text-[#00BF63]">{userRecoveryScorePercent}% Supercompensating</div>
          </div>
        </div>
      </header>

      {lastMessage && (
        <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-[#00F0FF]/30 text-xs text-[#00F0FF] font-mono animate-fadeIn">
          {lastMessage}
        </div>
      )}

      {/* Class & Session List (Spacious, Minimalist, athlytic cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sessions.map((sess) => {
          const isBooked = bookedIds.has(sess.id);
          const isFull = sess.registeredUserIds.length >= sess.maxCapacity;

          return (
            <div
              key={sess.id}
              className="p-6 rounded-2xl bg-white/[0.02] backdrop-blur-lg border border-white/10 flex flex-col justify-between space-y-6 hover:border-white/20 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-white/5 border border-white/10 text-neutral-300">
                    {sess.sportType}
                  </span>
                  <span className="text-xs font-mono font-medium text-[#00F0FF]">
                    {sess.creditCost} Credits
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-normal text-white">{sess.title}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{sess.studioOrClubName}</p>
                </div>

                <div className="text-[11px] text-neutral-500 font-mono space-y-1">
                  <div>📍 {sess.venueAddress}</div>
                  <div>⏱️ {sess.durationMinutes} min · {sess.skillBracket.replace(/_/g, ' ')}</div>
                  <div>
                    👥 {sess.registeredUserIds.length}/{sess.maxCapacity} Spots Taken
                    {sess.waitlistUserIds.length > 0 && ` (${sess.waitlistUserIds.length} on waitlist)`}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button
                  type="button"
                  disabled={isBooked}
                  onClick={() => handleBook(sess)}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium tracking-wide transition-all ${
                    isBooked
                      ? 'bg-white/10 text-neutral-400 cursor-not-allowed'
                      : isFull
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-emerald-400 text-black font-semibold hover:opacity-90'
                  }`}
                >
                  {isBooked ? 'Booked ✓' : isFull ? 'Join Waitlist (0 Upfront)' : `Reserve for ${sess.creditCost} Credits`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Americano Tournament Bracket Generator (Reclub Feature) */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-light text-white">Reclub-Style Americano Match Rotation</h3>
            <p className="text-xs text-neutral-400">
              Generates balanced round-robin partner-swaps for Padel/Badminton tournaments.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateAmericano}
            className="px-4 py-2 rounded-xl text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-colors"
          >
            Generate 8-Player Rotation
          </button>
        </div>

        {americanoMatches && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
            {americanoMatches.map((m, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs font-mono space-y-1">
                <div className="text-neutral-500 text-[10px]">Round {m.round} · Court {m.courtNumber}</div>
                <div className="text-white">
                  <span className="text-[#00F0FF]">{m.teamA.join(' & ')}</span>
                  <span className="text-neutral-500 mx-2">vs</span>
                  <span className="text-[#AF52DE]">{m.teamB.join(' & ')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
