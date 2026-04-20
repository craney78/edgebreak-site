import express from "express";
import Stripe from "stripe";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const app = express();

// =========================
// ⚠️ IMPORTANT FOR STRIPE
// =========================
app.use("/webhook", express.raw({ type: "application/json" }));

// (optional for other routes later)
app.use(express.json());
app.use(cors());



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
// 🔥 WEBHOOK ROUTE
// =========================
app.post("/webhook", async (req, res) => {

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.log("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("📩 Event received:", event.type);

  // =========================
  // 💳 HANDLE PAYMENTS
  // =========================
  if (
    event.type === "checkout.session.completed" ||
    event.type === "invoice.payment_succeeded"
  ) {

    const session = event.data.object;

    const customerId = session.customer;
    const email = session.customer_details?.email;

    console.log("✅ Payment success:", {
      customerId,
      email
    });

    if (!customerId) {
      console.log("❌ No Stripe customer ID");
      return res.json({ received: true });
    }

    try {
      await activateUser(customerId, email);
    } catch (err) {
      console.log("❌ Activation error:", err);
    }
  }

  res.json({ received: true });
});

// =========================
// 🔗 ACTIVATE USER (FINAL)
// =========================
async function activateUser(customerId, email) {

  // 1️⃣ Try find by Stripe ID
  let { data: user } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  // 2️⃣ If not found → fallback to email
  if (!user && email) {

    const { data: userByEmail } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (userByEmail) {
      console.log("🔄 Linking Stripe customer to user");

      // save Stripe ID
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", userByEmail.id);

      user = userByEmail;
    }
  }

  // 3️⃣ If still not found
  if (!user) {
    console.log("❌ No user found for:", { customerId, email });
    return;
  }

  // 4️⃣ Activate user
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ is_active: true })
    .eq("id", user.id);

  if (error) {
    console.log("❌ Activation failed:", error);
  } else {
    console.log("🔥 User activated:", customerId);
  }
}

// =========================
// 🚀 START SERVER
// =========================
app.listen(3000, () => {
  console.log("🚀 Webhook server running on port 3000");
});