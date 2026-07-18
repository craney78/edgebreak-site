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

    console.error("❌ WEBHOOK SIGNATURE ERROR");
    console.error(err);

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

        const email =
          session.customer_details?.email;

        const customerId =
          session.customer;

        console.log(
          "Checkout Complete",
          email,
          customerId
        );

        if (!email) {

          console.error(
            "No customer email supplied."
          );

          break;

        }

        const {
          data: profile,
          error: lookupError
        } =
          await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();

        if (lookupError) {

          console.error(
            "Lookup Error:",
            lookupError
          );

          break;

        }

        if (profile) {

          console.log(
            "Updating existing profile..."
          );

          const { error } =
            await supabase
              .from("profiles")
              .update({

                stripe_customer_id:
                  customerId,

                is_active: true

              })
              .eq(
                "id",
                profile.id
              );

          if (error) {

            console.error(
              "Update Error:",
              error
            );

          } else {

            console.log(
              "✅ Profile Activated"
            );

          }

        } else {

          console.log(
            "Creating profile..."
          );

          const { error } =
            await supabase
              .from("profiles")
              .insert({

                email,

                stripe_customer_id:
                  customerId,

                is_active: true

              });

          if (error) {

            console.error(
              "Insert Error:",
              error
            );

          } else {

            console.log(
              "✅ Profile Created"
            );

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

        } else {

          console.log(
            "Subscription cancelled."
          );

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

        } else {

          console.log(
            "Payment failed."
          );

        }

        break;

      }

      default:

        console.log(
          "Unhandled Event:",
          event.type
        );

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

    console.error(
      "❌ WEBHOOK PROCESSING ERROR"
    );

    console.error(err);

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