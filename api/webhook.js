import Stripe from "stripe";
import { buffer } from "micro";
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

  let event;

  try {
    const sig = req.headers["stripe-signature"];
    const buf = await buffer(req);

    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

  } catch (err) {
    console.error("❌ Signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log("✅ EVENT:", event.type);

  try {

    if (event.type === "checkout.session.completed") {

      const session = event.data.object;

      console.log("SESSION RECEIVED");

      const email = session.customer_details?.email;

      console.log("EMAIL:", email);

      if (!email) {
        console.log("⚠️ No email found");
        return res.json({ received: true });
      }

      const { data: user, error } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (error) {
        console.error("❌ Supabase error:", error);
      }

      if (user) {
        await supabase
          .from("profiles")
          .update({ is_active: true })
          .eq("id", user.id);

        console.log("✅ USER ACTIVATED:", email);
      } else {
        console.log("⚠️ USER NOT FOUND:", email);
      }
    }

    if (event.type === "customer.subscription.deleted") {

      const subscription = event.data.object;

      const customer = await stripe.customers.retrieve(subscription.customer);

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

        console.log("❌ USER DEACTIVATED:", email);
      }
    }

  } catch (err) {
    console.error("🔥 PROCESSING ERROR:", err);
    return res.status(500).json({ error: "processing_failed" });
  }

  res.status(200).json({ received: true });
}