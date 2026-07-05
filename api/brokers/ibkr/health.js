export default async function handler(req, res) {

    if (req.method !== "GET") {

        return res.status(405).json({

            error: "Method Not Allowed"

        });

    }

    return res.status(200).json({

        status: "ok",

        broker: "Interactive Brokers",

        platform: "EdgeBreak",

        version: "1.0",

        environment: process.env.VERCEL_ENV || "development",

        timestamp: new Date().toISOString()

    });

}