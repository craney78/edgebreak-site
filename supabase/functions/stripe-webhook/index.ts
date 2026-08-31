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


/* =========================================
EDGEBREAK STRIPE PLANS
========================================= */

const EDGEBREAK_INCLUDED_PRICE =
  "price_1U3x0CCys1zSKDi29dlDNeBq";

const EDGEBREAK_UNLIMITED_PRICE =
  "price_1UAL6NCys1zSKDi2Yj2qnkv1";


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

        const email =
          session.customer_details?.email;

        const customerId =
          session.customer;

        const subscriptionId =
          session.subscription;

        if (!email) {

          console.error("No customer email.");
          break;

        }


        /* =================================
        DETERMINE EDGEBREAK PLAN

        Existing subscription flow remains
        unchanged.

        We simply read the Stripe price so
        the temporary paid_customers record
        knows which AI entitlement should be
        attached when the account activates.
        ================================= */

        let aiAccessLevel =
          "included";

        let stripePriceId =
          null;


        if (subscriptionId) {

          const subscription =
            await stripe.subscriptions.retrieve(
              String(subscriptionId)
            );


          stripePriceId =
            subscription
              ?.items
              ?.data?.[0]
              ?.price
              ?.id ||
            null;


          if (
            stripePriceId ===
            EDGEBREAK_UNLIMITED_PRICE
          ) {

            aiAccessLevel =
              "unlimited";

          }
          else if (
            stripePriceId ===
            EDGEBREAK_INCLUDED_PRICE
          ) {

            aiAccessLevel =
              "included";

          }
          else {

            console.warn(
              "Unknown EdgeBreak Stripe price:",
              stripePriceId
            );

            /*
            Safe fallback.

            Never accidentally grant Unlimited
            when an unknown Stripe price appears.
            */

            aiAccessLevel =
              "included";

          }

        }


        console.log(
          "Saving paid customer:",
          email,
          "Price:",
          stripePriceId,
          "AI access:",
          aiAccessLevel
        );


        const { error: paidError } =
          await supabase
            .from("paid_customers")
            .upsert({

              email,

              stripe_customer_id:
                customerId,

              status:
                "active",

              ai_access_level:
                aiAccessLevel

            });


        if (paidError) {

          console.error(
            "Paid customer save failed:",
            paidError
          );

        }


        // =========================
        // ACTIVATE OR CREATE PROFILE
        // =========================

        const { data: profile } =
          await supabase
            .from("profiles")
            .select("id")
            .eq("email", email)
            .maybeSingle();


        if (profile) {

          const { error } =
            await supabase
              .from("profiles")
              .update({

                is_active: true,

                stripe_customer_id:
                  customerId

              })
              .eq("email", email);


          if (error) {

            console.error(
              "Profile activation failed:",
              error
            );

          }
          else {

            console.log(
              "✅ Existing profile activated"
            );

          }

        }
        else {

          const { error } =
            await supabase
              .from("profiles")
              .insert({

                email,

                is_active: true,

                stripe_customer_id:
                  customerId

              });


          if (error) {

            console.error(
              "Profile creation failed:",
              error
            );

          }
          else {

            console.log(
              "✅ New profile created"
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

        }
        else {

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

        }
        else {

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

  }
  catch (err) {

    console.error(
      "Webhook Error:",
      err
    );


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