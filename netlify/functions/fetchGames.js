// netlify/functions/fetchGames.js
export async function handler(event) {
  try {
    const { league, season, from, to } = event.queryStringParameters;

    if (!league || !season || !from || !to) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing parameters" }),
      };
    }

    // 🏈 Correct endpoint for API-NFL
    const apiUrl = `https://v1.american-football.api-sports.io/games?league=${league}&season=${season}&from=${from}&to=${to}`;

    const apiRes = await fetch(apiUrl, {
      headers: {
        "x-apisports-key": process.env.API_SPORTS_KEY, // ✅ your key from Netlify env
      },
    });

    const data = await apiRes.json();

    // Debugging log (optional)
    console.log("🔑 Key prefix:", process.env.API_SPORTS_KEY?.slice(0, 6));
    console.log("📡 NFL API response keys:", Object.keys(data));

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
      body: JSON.stringify({ error: "Server error", details: err.message }),
    };
  }
}
