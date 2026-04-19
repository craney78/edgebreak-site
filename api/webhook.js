import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {

  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ EVENT RECEIVED:", event.type);

  try {

    // =========================
    // ✅ PAYMENT SUCCESS
    // =========================
    if (event.type === "checkout.session.completed") {

      const session = event.data.object;

      console.log("SESSION:", session);

      // safer email handling
      const email =
        session.customer_details?.email ||
        session.customer_email ||
        null;

      console.log("EMAIL:", email);

      if (!email) {
        console.log("⚠️ No email found — skipping");
        return res.json({ received: true });
      }

      const { data: user, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error("❌ Supabase fetch error:", error);
      }

      if (user) {
        await supabase
          .from("profiles")
          .update({ is_active: true })
          .eq("id", user.id);

        console.log("✅ User activated:", email);
      } else {
        console.log("⚠️ User not found in DB:", email);
      }
    }

    // =========================
    // ❌ SUBSCRIPTION CANCELLED
    // =========================
    if (event.type === "customer.subscription.deleted") {

      const subscription = event.data.object;

      const customer = await stripe.customers.retrieve(
        subscription.customer
      );

      const email = customer.email;

      console.log("CANCEL EMAIL:", email);

      const { data: user } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (user) {
        await supabase
          .from("profiles")
          .update({ is_active: false })
          .eq("id", user.id);

        console.log("❌ User deactivated:", email);
      }
    }

  } catch (err) {
    console.error("🔥 Webhook processing error:", err);
    return res.status(500).send("Server error");
  }

  return res.json({ received: true });
}