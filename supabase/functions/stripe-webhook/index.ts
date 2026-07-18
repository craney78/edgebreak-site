import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(
  Deno.env.get("STRIPE_SECRET_KEY")!,
  {
    apiVersion: "2024-06-20"
  }
);

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {

  const signature =
    req.headers.get("stripe-signature")!;

  const body =
    await req.text();

  let event;

  try {

    event =
      stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get("STRIPE_WEBHOOK_SECRET")!
      );

  } catch (err) {

    return new Response(
      `Webhook Error: ${err.message}`,
      { status: 400 }
    );

  }

  switch (event.type) {

    case "checkout.session.completed": {

      const session = event.data.object;

      const email =
        session.customer_details?.email;

      const customerId =
        session.customer;

      if (email) {

        // Look for an existing profile by email
        const { data: profile } =
          await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (profile) {

          // Existing user
          const { error } =
            await supabase
              .from("profiles")
              .update({
                stripe_customer_id: customerId,
                is_active: true
              })
              .eq("id", profile.id);

          if (error) {
            console.error(error);
          }

        } else {

          // Payment happened before account creation
          const { error } =
            await supabase
              .from("profiles")
              .insert({
                email,
                stripe_customer_id: customerId,
                is_active: true
              });

          if (error) {
            console.error(error);
          }

        }

      }

      break;

    }

    case "customer.subscription.deleted": {

      const subscription =
        event.data.object;

      const customerId =
        subscription.customer;

      const { error } =
        await supabase
          .from("profiles")
          .update({
            is_active: false
          })
          .eq(
            "stripe_customer_id",
            customerId
          );

      if (error) {
        console.error(error);
      }

      break;

    }

    case "invoice.payment_failed": {

      const invoice =
        event.data.object;

      const customerId =
        invoice.customer;

      const { error } =
        await supabase
          .from("profiles")
          .update({
            is_active: false
          })
          .eq(
            "stripe_customer_id",
            customerId
          );

      if (error) {
        console.error(error);
      }

      break;

    }

  }

  return new Response(
    JSON.stringify({
      received: true
    }),
    {
      headers: {
        "Content-Type":
          "application/json"
      }
    }
  );

});