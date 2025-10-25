// netlify/functions/fetchGames.js
export async function handler(event) {
  try {
    const { league, season, date } = event.queryStringParameters;

    if (!league || !season || !date) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Missing parameters (league, season, or date)",
        }),
      };
    }

    // 🧭 Parse incoming date and prepare both current + next day
    const dateObj = new Date(`${date}T00:00:00`);
    const nextDay = new Date(dateObj);
    nextDay.setDate(nextDay.getDate() + 1);

    const nextDateStr = nextDay.toISOString().split("T")[0];

    // 🏈 Call API for both days (to catch late-night UTC rollovers)
    const apiUrlDay1 = `https://v1.american-football.api-sports.io/games?league=${league}&season=${season}&date=${date}`;
    const apiUrlDay2 = `https://v1.american-football.api-sports.io/games?league=${league}&season=${season}&date=${nextDateStr}`;

    const headers = {
      "x-apisports-key": process.env.API_KEY, // matches your .env + Netlify variable
    };

    const [res1, res2] = await Promise.all([
      fetch(apiUrlDay1, { headers }),
      fetch(apiUrlDay2, { headers }),
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();

    // 🧩 Combine both days into one list
    const combined = {
      get: data1.get,
      parameters: { league, season, date, nextDate: nextDateStr },
      results: (data1.results || 0) + (data2.results || 0),
      response: [...(data1.response || []), ...(data2.response || [])],
    };

    console.log(
      `📅 Combined results for ${date} (+${nextDateStr}): ${combined.results} games`
    );

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(combined),
    };
  } catch (err) {
    console.error("❌ fetchGames error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        details: err.message,
      }),
    };
  }
}
