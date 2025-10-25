// ============================================================
// 🧠 SYNC SIX ENGINE — v1.2
// Unified Gematria + Numerology + Scoring Core
// ============================================================


// ------------------------------------------------------------
// 1️⃣ GEMATRIA MODEL
// ------------------------------------------------------------
// Pythagorean-style reduction (A=1..I=9, J=1..R=9, S=1..Z=8)
function getGematriaValue(str) {
  const table = {
    a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
    j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
    s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8
  };

  return (str || "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .split("")
    .reduce((sum, ch) => sum + (table[ch] || 0), 0);
}


// ------------------------------------------------------------
// 2️⃣ SYNC SIX NUMEROLOGY CORE
// ------------------------------------------------------------
// Returns 6 numbers for a given date.
// We'll interpret them like this in the UI:
// [0] fullComponent        (Full Numerology / Full Component)
// [1] partialReduction     (Reduced / Partial Reduction)
// [2] lifePath             (Life Path / Digit Collapse)
// [3] simplifiedComp       (Simplified Component)
// [4] simplifiedRoot       (Simplified Root)
// [5] rawDay               (Day of Month, used in jersey ↔ date hit)
function getSyncSix(date) {
  const d = new Date(date);
  const day = d.getDate();
  const m = d.getMonth() + 1;
  const y = d.getFullYear();

  // You can tune these however you want. We're just keeping
  // consistent with what you were already using.
  const base = [
    m + day + y,           // fullComponent
    m + day + (y % 100),   // partialReduction
    m + day,               // lifePath / digitCollapse-ish
    m + y,                 // simplifiedComp
    day + y                // simplifiedRoot
  ];

  return [...base, day];   // day is index 5
}


// ------------------------------------------------------------
// 3️⃣ PRIME CHECKER
// ------------------------------------------------------------
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}


// ------------------------------------------------------------
// 4️⃣ PLAYER NORMALIZATION
// ------------------------------------------------------------
// Takes a raw player object from getRosterForGame() plus game metadata,
// then enriches with gematria + syncSix (numerology for that date).
function normalizePlayerGameData(player, gameData, gameDateString) {
  const syncSix = getSyncSix(gameDateString);

  return {
    ...player,

    // numerology snapshot for this player/game context
    syncSix,

    // gematria values we’ll use for scoring / display
    playerGematria: getGematriaValue(player.name),
    teamGematria: getGematriaValue(player.teamName || player.team || ""),
    oppGematria: getGematriaValue(player.opponentName || player.opponent || "")
  };
}


// ------------------------------------------------------------
// 5️⃣ WEIGHTS / MULTIPLIERS CONFIG
// ------------------------------------------------------------
const WEIGHTS = {
  JERSEY_DATE_MATCH:     25,
  MILESTONE_COMPLETE:    20,   // placeholder for future use
  MILESTONE_PENDING:     12,   // placeholder for future use
  PRIME_RELATION:        5,
  WEEK_ALIGNMENT:        5,    // placeholder for future use
  TEAM_ALIGNMENT:        3,    // placeholder for future use
  OPPONENT_MIRROR:       3,    // placeholder for future use
  GEMATRIA_SYNC:         10,
  TEAM_GEMATRIA_SYNC:     8
};

// multiplier tiers based on number of strong hits
const MULTIPLIERS = [1, 1.25, 1.5, 1.75, 2];

// hard cap so we don't claim "100% destiny"
const MAX_SYNC = 98;


// ------------------------------------------------------------
// 6️⃣ CORE SCORING LOOP
// ------------------------------------------------------------
function scorePlayers(players, gameData, dateNums) {
  const results = [];

  for (const p of players) {
    let base = 0;
    let count = 0;
    const hits = [];

    // ============================================================
    // 🔹 BASE SCORING LOGIC
    // ============================================================

    // 1️⃣ Jersey ↔ Date Numerology
    // direct match to raw day-of-month (dateNums[5])
    // or match to any numerology element in dateNums
    if (p.jersey === dateNums[5] || dateNums.includes(p.jersey)) {
      base += WEIGHTS.JERSEY_DATE_MATCH;
      count++;
      hits.push("JERSEY_DATE_MATCH");
    }

    // 2️⃣ Prime Relation
    if (isPrime(p.jersey) && dateNums.some(n => isPrime(n))) {
      base += WEIGHTS.PRIME_RELATION;
      hits.push("PRIME_RELATION");
    }

    // 3️⃣ Gematria Syncs
    if (p.playerGematria && dateNums.includes(p.playerGematria)) {
      base += WEIGHTS.GEMATRIA_SYNC;
      hits.push("PLAYER_GEMATRIA_SYNC");
    }

    if (p.teamGematria && dateNums.includes(p.teamGematria)) {
      base += WEIGHTS.TEAM_GEMATRIA_SYNC;
      hits.push("TEAM_GEMATRIA_SYNC");
    }

    if (p.oppGematria && dateNums.includes(p.oppGematria)) {
      base += WEIGHTS.TEAM_GEMATRIA_SYNC;
      hits.push("OPPONENT_GEMATRIA_SYNC");
    }

    // (We left stubs like WEEK_ALIGNMENT, TEAM_ALIGNMENT, etc.
    //  in WEIGHTS so you can turn them on when you’re ready.)

    // ============================================================
    // 🔹 STAGE 3 — AUTO-MATCH INTELLIGENCE
    // ============================================================

    // jersey ↔ date true/false (for UI "✅ Yes" / "✖ No")
    const jerseyMatch = dateNums.includes(p.jersey);

    // dob ↔ date true/false
    const dobMatch = (() => {
      if (!p.dob || p.dob === "—") return false;
      try {
        const dobDay = new Date(p.dob).getDate();
        return dateNums.includes(dobDay);
      } catch {
        return false;
      }
    })();

    // categoryHit = what kind of sync this looks like
    let categoryHit = "Gematria";
    if (jerseyMatch) {
      categoryHit = "Jersey-Date";
    } else if (dobMatch) {
      categoryHit = "Life Path";
    } else if (isPrime(p.jersey)) {
      categoryHit = "Prime Relation";
    }

    // attach flags to player object (they’ll get spread below)
    p.jerseyMatch = jerseyMatch;
    p.dobMatch = dobMatch;
    p.categoryHit = categoryHit;

    // methodType = headline label for how this sync is "winning"
    if (jerseyMatch && p.playerGematria && dateNums.includes(p.playerGematria)) {
      p.methodType = "Hybrid Sync";
    } else if (jerseyMatch) {
      p.methodType = "Jersey Alignment";
    } else if (dobMatch) {
      p.methodType = "Life Path Resonance";
    } else if (p.playerGematria && dateNums.includes(p.playerGematria)) {
      p.methodType = "Gematria Sync";
    } else {
      p.methodType = "Gematria";
    }

    // ============================================================
    // 🔹 FINAL SCORE + MULTIPLIER
    // ============================================================

    const multiplierIndex = Math.min(Math.max(count - 1, 0), 4);
    const multiplier = MULTIPLIERS[multiplierIndex];

    let score = base * multiplier;
    if (score > MAX_SYNC) score = MAX_SYNC;

    // ============================================================
    // 🔹 ATTACH DATE NUMEROLOGY COMPONENTS FOR RAW PARAMETERS
    // ============================================================
    // NOTE: dateNums is the SyncSix array.
    // We map them onto stable property names.
    p.fullComponent     = dateNums?.[0] ?? "--"; // Full Numerology
    p.partialReduction  = dateNums?.[1] ?? "--"; // Reduced
    p.lifePath          = dateNums?.[2] ?? "--"; // Life Path / Digit Collapse
    p.simplifiedComp    = dateNums?.[3] ?? "--"; // Simplified Comp
    p.simplifiedRoot    = dateNums?.[4] ?? "--"; // Simplified Root
    // dateNums[5] is raw day-of-month, which we already use for jersey hit

    // ============================================================
    // 🔹 BUILD RESULT OBJECT FOR UI
    // ============================================================
    results.push({
      // include all enriched player context
      ...p,

      // normalize naming so renderResults() never sees undefined
      teamName: p.teamName || p.team || "—",
      opponentName: p.opponentName || p.opponent || "—",
      date: p.date || "TBD",
      time: p.time || "TBD",
      venue: p.venue || "—",
      position: p.position || "—",
      dob: p.dob || "—",
      result: p.result || "TBD",

      // score + diagnostic info
      score: Number(score.toFixed(1)),
      hits: hits || [],
      methodType: p.methodType,
      categoryHit: p.categoryHit,
      primeMatch: isPrime(p.jersey),
      energyPhase: false // placeholder for moon/ritual energy, etc.
    });
  }

  // ============================================================
  // 🔹 FILTER + SORT FINAL OUTPUT
  // ============================================================
  const MIN_SCORE = 20; // You control this difficulty gate

  return results
    .filter(r => r.score >= MIN_SCORE || (r.hits && r.hits.length >= 2))
    .sort((a, b) => b.score - a.score);
}


// ------------------------------------------------------------
// 7️⃣ ENGINE WRAPPER
// ------------------------------------------------------------
// You can use this if you ever want to just hand players+game
// and get scored output directly.
function runSyncSixEngine(players, gameData) {
  // gameData.date?.start should be like "2025-10-26T10:00:00Z" etc.
  const gameDateString = gameData?.date?.start || gameData?.game?.date?.start || new Date().toISOString();

  // Normalize (adds syncSix + gematria per player)
  const normalized = players.map(p =>
    normalizePlayerGameData(p, gameData, gameDateString)
  );

  // pull numerology array off first normalized player
  const dateNums = normalized[0]?.syncSix || [];

  // score
  return scorePlayers(normalized, gameData, dateNums);
}


// ------------------------------------------------------------
// 8️⃣ EXPORTS
// ------------------------------------------------------------
export {
  getGematriaValue,
  getSyncSix,
  normalizePlayerGameData,
  scorePlayers,
  runSyncSixEngine
};
