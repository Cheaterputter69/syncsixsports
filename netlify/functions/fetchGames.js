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

    // 🏈 API-NFL endpoint — query by specific date
    const apiUrl = `https://v1.american-football.api-sports.io/games?league=${league}&season=${season}&date=${date}`;

    const apiRes = await fetch(apiUrl, {
      headers: {
        "x-apisports-key": process.env.API_KEY, // matches your .env and Netlify variable
      },
    });

    const data = await apiRes.json();

    console.log(`📅 NFL games for ${date}:`, data.results);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
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
