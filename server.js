import express from "express";
import Stripe from "stripe";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// =========================
// 🔥 CORS (KEEP * FOR NOW - LOCK LATER)
// =========================
app.use(cors({
  origin: "*"
}));

// =========================
// ⚠️ RAW BODY (STRIPE WEBHOOK ONLY)
// =========================
app.use("/webhook", express.raw({ type: "application/json" }));

// =========================
// 📦 JSON (ALL OTHER ROUTES)
// =========================
app.use(express.json());

// =========================
// 🔑 KEYS
// =========================
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// =========================
// 💳 CREATE CHECKOUT SESSION
// =========================
app.post("/create-checkout-session", async (req, res) => {
  try {

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      payment_method_types: ["card"],

      line_items: [
        {
          price: "price_1TNqKKCys1zSKDi2HpYhlXmQ",
          quantity: 1
        }
      ],

      success_url: "https://edgebreak.ai/login.html",
      cancel_url: "https://edgebreak.ai/pricing.html",

      client_reference_id: userId
    });

    res.json({ url: session.url });

  } catch (err) {
    console.log("❌ Stripe session error:", err);
    res.status(500).json({ error: "Stripe failed" });
  }
});

// =========================
// 🔥 STRIPE WEBHOOK
// =========================
app.post("/webhook", (req, res) => {

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      endpointSecret
    );
  } catch (err) {
    console.log("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("📩 Event received:", event.type);

  // =========================
  // ✅ ACTIVATE USER
  // =========================
  if (event.type === "checkout.session.completed") {

    const session = event.data.object;
    const userId = session.client_reference_id;

    if (!userId) {
      console.log("❌ No userId found in session");
      return res.json({ received: true });
    }

    supabaseAdmin
      .from("profiles")
      .update({ is_active: true })
      .eq("id", userId)
      .then(() => {
        console.log("🔥 USER ACTIVATED:", userId);
      })
      .catch(err => {
        console.log("❌ Activation error:", err);
      });
  }

  res.json({ received: true });
});

// =========================
// 🧪 HEALTH CHECK
// =========================
app.get("/", (req, res) => {
  res.send("🚀 EdgeBreak server running");
});

// =========================
// 🚀 START SERVER
// =========================
app.listen(3000, () => {
  console.log("🚀 Server running on port 3000");
});