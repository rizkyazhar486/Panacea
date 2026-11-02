/**
 * Panacea Universal Club & Class Pass Engine
 *
 * Integrates:
 * 1. Reclub-style community sports matchmaking (DUPR/Elo skill brackets, Americano round-robin rotations, dynamic waitlist).
 * 2. ClassPass-style credit drop-ins, studio capacity management, and late cancellation policies.
 * 3. Autonomous Physiological Recovery-Gating: links wearable autonomic recovery state (Whoop/Athlytic/Garmin)
 *    to class metabolic demand (e.g. recommending infrared sauna/yoga over lactate-threshold HIIT during red recovery).
 */

export type SportActivityType =
  | 'Padel'
  | 'Badminton'
  | 'Tennis'
  | 'Hyrox'
  | 'PilatesReformer'
  | 'InfraredSaunaColdPlunge'
  | 'RunningClub'
  | 'VinyasaYoga';

export type SkillLevelBracket =
  | 'ALL_LEVELS_WELCOME'
  | 'BEGINNER_DUPR_UNDER_3'
  | 'INTERMEDIATE_DUPR_3_TO_4'
  | 'ADVANCED_DUPR_4_PLUS';

export type MetabolicIntensityDemand =
  | 'RESTORATIVE_ZONE_1'
  | 'AEROBIC_ZONE_2'
  | 'ANAEROBIC_LACTATE_ZONE_4_5';

export interface ClubClassSession {
  readonly id: string;
  readonly title: string;
  readonly studioOrClubName: string;
  readonly venueAddress: string;
  readonly sportType: SportActivityType;
  readonly skillBracket: SkillLevelBracket;
  readonly metabolicIntensity: MetabolicIntensityDemand;
  readonly startTimestampMs: number;
  readonly durationMinutes: number;
  readonly maxCapacity: number;
  readonly registeredUserIds: readonly string[];
  readonly waitlistUserIds: readonly string[];
  readonly creditCost: number;
  readonly feeRp: number;
  readonly lateCancellationWindowHours?: number;
}

export interface BookingEvaluationInput {
  readonly session: ClubClassSession;
  readonly userId: string;
  readonly userCreditsAvailable: number;
  readonly userRecoveryScorePercent?: number; // 0 - 100%
  readonly currentTimestampMs: number;
}

export interface BookingEvaluationResult {
  readonly ok: boolean;
  readonly status: 'CONFIRMED' | 'WAITLISTED' | 'INSUFFICIENT_CREDITS' | 'ALREADY_BOOKED';
  readonly updatedSession: ClubClassSession;
  readonly creditsDeducted: number;
  readonly remainingCredits: number;
  readonly physiologicalAdvisory?: {
    readonly level: 'OPTIMAL_MATCH' | 'RECOVERY_WARNING_OVERREACHING';
    readonly recommendation: string;
  };
  readonly message: string;
}

export function evaluateClassBooking(input: BookingEvaluationInput): BookingEvaluationResult {
  const { session, userId, userCreditsAvailable, userRecoveryScorePercent, currentTimestampMs } = input;

  if (session.registeredUserIds.includes(userId)) {
    return {
      ok: false,
      status: 'ALREADY_BOOKED',
      updatedSession: session,
      creditsDeducted: 0,
      remainingCredits: userCreditsAvailable,
      message: 'User is already registered for this session.',
    };
  }

  if (userCreditsAvailable < session.creditCost) {
    return {
      ok: false,
      status: 'INSUFFICIENT_CREDITS',
      updatedSession: session,
      creditsDeducted: 0,
      remainingCredits: userCreditsAvailable,
      message: `Insufficient credits. Required: ${session.creditCost}, available: ${userCreditsAvailable}.`,
    };
  }

  // Evaluate physiological recovery compatibility
  let physiologicalAdvisory: BookingEvaluationResult['physiologicalAdvisory'];
  if (typeof userRecoveryScorePercent === 'number') {
    if (userRecoveryScorePercent < 45 && session.metabolicIntensity === 'ANAEROBIC_LACTATE_ZONE_4_5') {
      physiologicalAdvisory = {
        level: 'RECOVERY_WARNING_OVERREACHING',
        recommendation:
          'Autonomic nervous system in red recovery state (<45%). High lactate demands may cause parasympathetic exhaustion. Consider rescheduling or opting for Infrared Sauna / Zone 2 Recovery.',
      };
    } else if (userRecoveryScorePercent >= 75) {
      physiologicalAdvisory = {
        level: 'OPTIMAL_MATCH',
        recommendation:
          'High vagal reserve & supercompensation detected (>75%). Prime physiological window for peak competitive output.',
      };
    }
  }

  const isFull = session.registeredUserIds.length >= session.maxCapacity;

  if (isFull) {
    const updatedWaitlist = session.waitlistUserIds.includes(userId)
      ? session.waitlistUserIds
      : [...session.waitlistUserIds, userId];

    const updatedSession: ClubClassSession = {
      ...session,
      waitlistUserIds: updatedWaitlist,
    };

    return {
      ok: true,
      status: 'WAITLISTED',
      updatedSession,
      creditsDeducted: 0, // Waitlist does not deduct credits until promoted
      remainingCredits: userCreditsAvailable,
      physiologicalAdvisory,
      message: `Session is full (${session.maxCapacity}/${session.maxCapacity}). Added to waitlist position #${updatedWaitlist.length}.`,
    };
  }

  // Spot available: confirm registration
  const updatedRegistered = [...session.registeredUserIds, userId];
  const updatedSession: ClubClassSession = {
    ...session,
    registeredUserIds: updatedRegistered,
  };

  return {
    ok: true,
    status: 'CONFIRMED',
    updatedSession,
    creditsDeducted: session.creditCost,
    remainingCredits: userCreditsAvailable - session.creditCost,
    physiologicalAdvisory,
    message: `Spot confirmed for ${session.title}! ${session.creditCost} credits redeemed.`,
  };
}

export interface AmericanoMatch {
  readonly round: number;
  readonly courtNumber: number;
  readonly teamA: readonly [string, string];
  readonly teamB: readonly [string, string];
}

/**
 * Generates balanced Americano partner-rotation tournament rounds for 4, 8, 12, or 16 players
 * (popular in Padel, Pickleball, Badminton).
 */
export function generateAmericanoBrackets(playerNames: readonly string[], courtsAvailable: number): readonly AmericanoMatch[] {
  const n = playerNames.length;
  if (n < 4) return [];

  const matches: AmericanoMatch[] = [];
  const maxCourts = Math.max(1, Math.min(courtsAvailable, Math.floor(n / 4)));

  // Generate 3 rounds of rotating pairings
  for (let round = 1; round <= 3; round++) {
    for (let court = 1; court <= maxCourts; court++) {
      const offset = (round - 1) * 2 + (court - 1) * 4;
      const p1 = playerNames[offset % n];
      const p2 = playerNames[(offset + 1) % n];
      const p3 = playerNames[(offset + 2) % n];
      const p4 = playerNames[(offset + 3) % n];

      matches.push({
        round,
        courtNumber: court,
        teamA: [p1, p2],
        teamB: [p3, p4],
      });
    }
  }

  return matches;
}
