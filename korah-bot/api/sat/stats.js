export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch("https://www.mysatprep.fun/api/stats", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      return res.status(502).json({
        error: "OpenSAT upstream error",
        status: response.status,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    console.error("OpenSAT stats fetch error:", err);
    return res.status(502).json({
      error: "OpenSAT unavailable",
      message: "Could not reach OpenSAT upstream for statistics.",
    });
  }
}
