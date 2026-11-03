import { strict as assert } from 'node:assert';
import {
  evaluateClassBooking,
  generateAmericanoBrackets,
  type ClubClassSession,
} from '../../src/domains/club/engine/universalClubClassEngine.ts';

console.log('[TEST] Starting Universal Club & Class Pass Engine Test Suite...');

const now = Date.now();
const testSession: ClubClassSession = {
  id: 'SESSION-PADEL-BALI-01',
  title: 'Sunset Padel Americano (Open Level)',
  studioOrClubName: 'Jungle Padel Canggu',
  venueAddress: 'Jl. Subak Sari No. 10, Canggu, Bali',
  sportType: 'Padel',
  skillBracket: 'INTERMEDIATE_DUPR_3_TO_4',
  metabolicIntensity: 'ANAEROBIC_LACTATE_ZONE_4_5',
  startTimestampMs: now + 3600_000 * 24,
  durationMinutes: 90,
  maxCapacity: 4,
  registeredUserIds: ['USER_ALEX', 'USER_BELLA'],
  waitlistUserIds: [],
  creditCost: 6,
  feeRp: 150_000,
  lateCancellationWindowHours: 12,
};

// 1. Successful spot booking with credits
const booking1 = evaluateClassBooking({
  session: testSession,
  userId: 'USER_CHARLIE',
  userCreditsAvailable: 15,
  userRecoveryScorePercent: 82, // Green recovery
  currentTimestampMs: now,
});

assert.equal(booking1.ok, true);
assert.equal(booking1.status, 'CONFIRMED');
assert.equal(booking1.creditsDeducted, 6);
assert.equal(booking1.remainingCredits, 9);
assert.ok(booking1.updatedSession.registeredUserIds.includes('USER_CHARLIE'));
assert.equal(booking1.physiologicalAdvisory?.level, 'OPTIMAL_MATCH');

// 2. Insufficient credits test
const bookingNoCredit = evaluateClassBooking({
  session: testSession,
  userId: 'USER_BROKE',
  userCreditsAvailable: 3,
  currentTimestampMs: now,
});
assert.equal(bookingNoCredit.ok, false);
assert.equal(bookingNoCredit.status, 'INSUFFICIENT_CREDITS');

// 3. Duplicate registration test
const bookingDup = evaluateClassBooking({
  session: testSession,
  userId: 'USER_ALEX',
  userCreditsAvailable: 20,
  currentTimestampMs: now,
});
assert.equal(bookingDup.ok, false);
assert.equal(bookingDup.status, 'ALREADY_BOOKED');

// 4. Fill to capacity and verify waitlisting
const fullSession: ClubClassSession = {
  ...testSession,
  registeredUserIds: ['U1', 'U2', 'U3', 'U4'],
  waitlistUserIds: ['U_WAIT_1'],
};

const bookingWaitlist = evaluateClassBooking({
  session: fullSession,
  userId: 'U_WAIT_2',
  userCreditsAvailable: 20,
  currentTimestampMs: now,
});
assert.equal(bookingWaitlist.ok, true);
assert.equal(bookingWaitlist.status, 'WAITLISTED');
assert.equal(bookingWaitlist.creditsDeducted, 0, 'Waitlist must not deduct credits');
assert.equal(bookingWaitlist.updatedSession.waitlistUserIds.length, 2);

// 5. Physiological recovery alert test (User in RED recovery trying to book high lactate session)
const bookingRedRecovery = evaluateClassBooking({
  session: testSession,
  userId: 'USER_EXHAUSTED',
  userCreditsAvailable: 10,
  userRecoveryScorePercent: 34, // Low / compromised recovery
  currentTimestampMs: now,
});
assert.equal(bookingRedRecovery.ok, true);
assert.equal(bookingRedRecovery.status, 'CONFIRMED');
assert.equal(bookingRedRecovery.physiologicalAdvisory?.level, 'RECOVERY_WARNING_OVERREACHING');
assert.ok(bookingRedRecovery.physiologicalAdvisory?.recommendation.includes('Autonomic nervous system in red recovery state'));

// 6. Americano rotating bracket generation
const players = ['Player_A', 'Player_B', 'Player_C', 'Player_D', 'Player_E', 'Player_F', 'Player_G', 'Player_H'];
const brackets = generateAmericanoBrackets(players, 2);

assert.ok(brackets.length >= 6, 'Should generate multiple matches across rounds');
assert.equal(brackets[0].round, 1);
assert.equal(brackets[0].teamA.length, 2);
assert.equal(brackets[0].teamB.length, 2);

console.log('[TEST] ✓ All Universal Club & Class Pass Engine tests PASSED cleanly!');
