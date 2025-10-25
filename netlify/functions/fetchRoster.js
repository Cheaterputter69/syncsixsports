// netlify/functions/fetchRoster.js
export async function handler(event) {
  try {
    const { teamId, season } = event.queryStringParameters;

    if (!teamId || !season) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing teamId or season" }) };
    }

    // 🧭 Call API-Sports Football endpoint for team players
    const apiRes = await fetch(
      `https://v3.football.api-sports.io/players?team=${teamId}&season=${season}`,
      {
        headers: {
          "x-apisports-key": process.env.API_SPORTS_KEY,
        },
      }
    );

    const data = await apiRes.json();

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("❌ fetchRoster error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error", details: err.message }),
    };
  }
}
