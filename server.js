import express from "express";
import Stripe from "stripe";
import cors from "cors";

const app = express();

// ⚠️ IMPORTANT: raw body for Stripe
app.use("/webhook", express.raw({ type: "application/json" }));

const stripe = new Stripe("YOUR_STRIPE_SECRET_KEY");

// =========================
// 🔥 WEBHOOK
// =========================
app.post("/webhook", async (req, res) => {

  const sig = req.headers["stripe-signature"];
  const endpointSecret = "YOUR_WEBHOOK_SECRET";

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log("❌ Webhook signature failed");
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // =========================
  // 💳 CHECKOUT COMPLETE
  // =========================
  if (event.type === "checkout.session.completed") {

    const session = event.data.object;

    const email = session.customer_details.email;

    console.log("✅ Payment success:", email);

    // 🔥 UPDATE SUPABASE HERE
    await activateUser(email);
  }

  res.json({ received: true });
});

// =========================
// 🔗 SUPABASE UPDATE
// =========================
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  "https://qmonyhukamuuunxxxdlk.supabase.co",
  "YOUR_SERVICE_ROLE_KEY" // ⚠️ NOT public key
);

async function activateUser(email) {

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update({ is_active: true })
    .eq("email", email);

  if (error) {
    console.log("❌ Supabase error:", error);
  } else {
    console.log("🔥 User activated:", email);
  }
}

app.listen(3000, () => {
  console.log("🚀 Webhook server running on port 3000");
});