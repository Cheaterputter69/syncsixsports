// netlify/functions/fetchRoster.js
export async function handler(event) {
  try {
    const { team, season } = event.queryStringParameters;

    if (!team || !season) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing parameters" }),
      };
    }

    const apiUrl = `https://v1.american-football.api-sports.io/players?team=${team}&season=${season}`;

    const apiRes = await fetch(apiUrl, {
      headers: {
        "x-apisports-key": process.env.API_KEY, // ✅ same here
      },
    });

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
