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

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event;

  try {

    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );

    console.log("✅ Stripe Event:", event.type);

  } catch (err) {

    console.error("❌ Signature Error:", err);

    return new Response(
      JSON.stringify({
        success: false,
        error: String(err)
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  }

  try {

    switch (event.type) {

      case "checkout.session.completed": {

        const session = event.data.object;

        const email = session.customer_details?.email;
        const customerId = session.customer;

        if (!email) {

          console.error("No customer email.");

          break;

        }

        console.log("Saving paid customer:", email);

        const { error } = await supabase
          .from("paid_customers")
          .upsert({
            email,
            stripe_customer_id: customerId,
            status: "active"
          });

        if (error) {

          console.error("Paid customer save failed:", error);

        } else {

          console.log("✅ Payment recorded");

        }

        break;

      }

      case "customer.subscription.deleted": {

        const subscription = event.data.object;

        const customerId = subscription.customer;

        const { error } = await supabase
          .from("profiles")
          .update({
            is_active: false
          })
          .eq("stripe_customer_id", customerId);

        if (error) {

          console.error(error);

        } else {

          console.log("Subscription cancelled.");

        }

        break;

      }

      case "invoice.payment_failed": {

        const invoice = event.data.object;

        const customerId = invoice.customer;

        const { error } = await supabase
          .from("profiles")
          .update({
            is_active: false
          })
          .eq("stripe_customer_id", customerId);

        if (error) {

          console.error(error);

        } else {

          console.log("Payment failed.");

        }

        break;

      }

      default:

        console.log("Unhandled Event:", event.type);

    }

    return new Response(
      JSON.stringify({
        received: true
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {

    console.error("Webhook Error:", err);

    return new Response(
      JSON.stringify({
        success: false,
        error: String(err)
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  }

});