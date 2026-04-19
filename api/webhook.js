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
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // ✅ PAYMENT SUCCESS
  if (event.type === "checkout.session.completed") {

    const session = event.data.object;
    const email = session.customer_details.email;

    const { data: user } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (user) {
      await supabase
        .from("profiles")
        .update({ is_active: true })
        .eq("id", user.id);
    }
  }

  // ❌ SUBSCRIPTION CANCELLED
  if (event.type === "customer.subscription.deleted") {

    const subscription = event.data.object;
    const customer = await stripe.customers.retrieve(subscription.customer);

    const email = customer.email;

    const { data: user } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (user) {
      await supabase
        .from("profiles")
        .update({ is_active: false })
        .eq("id", user.id);
    }
  }

  res.json({ received: true });
}