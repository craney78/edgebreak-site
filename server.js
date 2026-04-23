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

      subscription_data: {
        trial_period_days: 28
      },

      payment_method_types: ["card"],

      line_items: [
        {
          price: "price_1TMVSdCys1zSKDi2HILFnFV1",
          quantity: 1
        }
      ],

      success_url: "https://www.edgebreak.ai/login.html?success=true",
      cancel_url: "https://www.edgebreak.ai/pricing.html",

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
app.post("/webhook", async (req, res) => {

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
  // ✅ STRIPE: PAYMENT SUCCESS
  // =========================
  if (event.type === "checkout.session.completed") {

    const session = event.data.object;
    const userId = session.client_reference_id;
    const customerId = session.customer;

    if (!userId) {
      console.log("❌ No userId found in session");
      return res.json({ received: true });
    }

    await supabaseAdmin
      .from("profiles")
      .update({
        is_active: true,
        stripe_customer_id: customerId // 🔥 IMPORTANT
      })
      .eq("id", userId);

    console.log("🔥 USER ACTIVATED:", userId);
  }

  // =========================
  // ❌ STRIPE: PAYMENT FAILED
  // =========================
  if (event.type === "invoice.payment_failed") {

    const invoice = event.data.object;
    const customerId = invoice.customer;

    console.log("❌ Payment failed:", customerId);

    await supabaseAdmin
      .from("profiles")
      .update({ is_active: false })
      .eq("stripe_customer_id", customerId);

    console.log("🚫 Access removed (payment failed)");
  }

  // =========================
  // ❌ STRIPE: SUBSCRIPTION CANCELLED
  // =========================
  if (event.type === "customer.subscription.deleted") {

    const subscription = event.data.object;
    const customerId = subscription.customer;

    console.log("❌ Subscription cancelled:", customerId);

    await supabaseAdmin
      .from("profiles")
      .update({ is_active: false })
      .eq("stripe_customer_id", customerId);

    console.log("🚫 Access removed (subscription cancelled)");
  }

  // =========================
  // ✅ RESPONSE
  // =========================
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