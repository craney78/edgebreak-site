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

  const signature =
    req.headers.get(
      "stripe-signature"
    );

  const body =
    await req.text();


  let event;


  /* =========================================
  VERIFY STRIPE WEBHOOK
  ========================================= */

  try {

    event =
      await stripe.webhooks.constructEventAsync(
        body,
        signature!,
        Deno.env.get(
          "STRIPE_WEBHOOK_SECRET"
        )!
      );


    console.log(
      "✅ Stripe Event:",
      event.type
    );

  }
  catch (err) {

    console.error(
      "❌ Signature Error:",
      err
    );


    return new Response(
      JSON.stringify({
        success: false,
        error: String(err)
      }),
      {
        status: 400,
        headers: {
          "Content-Type":
            "application/json"
        }
      }
    );

  }


  /* =========================================
  PROCESS STRIPE EVENT
  ========================================= */

  try {

    switch (event.type) {


      /* =====================================
      CHECKOUT COMPLETED
      ===================================== */

      case "checkout.session.completed": {

        const session =
          event.data.object;


        const email =
          session.customer_details
            ?.email;


        const customerId =
          session.customer;


        const subscriptionId =
          session.subscription;


        if (!email) {

          console.error(
            "No customer email."
          );

          break;

        }


        /* =================================
        DETERMINE EDGEBREAK PLAN
        ================================= */

        let aiAccessLevel =
          "included";


        let stripePriceId =
          null;


        if (subscriptionId) {

          const subscription =
            await stripe
              .subscriptions
              .retrieve(
                String(
                  subscriptionId
                )
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
            SAFE FALLBACK

            Never accidentally grant
            Unlimited access for an
            unknown Stripe price.
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


        /* =================================
        SAVE PAID CUSTOMER
        ================================= */

        const {
          error: paidError
        } =
          await supabase
            .from(
              "paid_customers"
            )
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


        /* =================================
        ACTIVATE OR CREATE PROFILE
        ================================= */

        const {
          data: profile
        } =
          await supabase
            .from(
              "profiles"
            )
            .select(
              "id"
            )
            .eq(
              "email",
              email
            )
            .maybeSingle();


        if (profile) {

          const {
            error
          } =
            await supabase
              .from(
                "profiles"
              )
              .update({

                is_active:
                  true,

                stripe_customer_id:
                  customerId

              })
              .eq(
                "email",
                email
              );


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

          const {
            error
          } =
            await supabase
              .from(
                "profiles"
              )
              .insert({

                email,

                is_active:
                  true,

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


      /* =====================================
      PAYMENT FAILED
      ===================================== */

      case "invoice.payment_failed": {

        const invoice =
          event.data.object;


        const customerId =
          invoice.customer;


        /*
        IMPORTANT:

        DO NOT deactivate the customer.

        A failed payment can be temporary
        and Stripe may still be retrying it.

        EdgeBreak access remains active
        during Stripe payment recovery.
        */


        console.log(
          "⚠️ Payment failed — keeping EdgeBreak access active while Stripe retries.",
          {

            customerId,

            attemptCount:
              invoice.attempt_count ??
              null,

            nextPaymentAttempt:
              invoice.next_payment_attempt ??
              null

          }
        );


        break;

      }


      /* =====================================
      PAYMENT SUCCEEDED
      ===================================== */

      case "invoice.payment_succeeded": {

        const invoice =
          event.data.object;


        const customerId =
          invoice.customer;


        /*
        If Stripe successfully recovers
        a subscription payment, make sure
        EdgeBreak access is active.
        */

        if (customerId) {

          const {
            error
          } =
            await supabase
              .from(
                "profiles"
              )
              .update({

                is_active:
                  true

              })
              .eq(
                "stripe_customer_id",
                customerId
              );


          if (error) {

            console.error(
              "Payment success activation failed:",
              error
            );

          }
          else {

            console.log(
              "✅ Payment succeeded — EdgeBreak access active."
            );

          }

        }


        break;

      }


      /* =====================================
      SUBSCRIPTION UPDATED
      ===================================== */

      case "customer.subscription.updated": {

        const subscription =
          event.data.object;


        const customerId =
          subscription.customer;


        const subscriptionStatus =
          subscription.status;


        console.log(
          "Subscription updated:",
          {
            customerId,
            subscriptionStatus
          }
        );


        /*
        =====================================
        KEEP ACCESS
        =====================================

        active
        trialing
        past_due

        past_due is intentionally allowed.

        Stripe may still be trying to
        recover payment.
        */

        if (
          subscriptionStatus ===
            "active" ||
          subscriptionStatus ===
            "trialing" ||
          subscriptionStatus ===
            "past_due"
        ) {

          const {
            error
          } =
            await supabase
              .from(
                "profiles"
              )
              .update({

                is_active:
                  true

              })
              .eq(
                "stripe_customer_id",
                customerId
              );


          if (error) {

            console.error(
              "Profile activation update failed:",
              error
            );

          }
          else {

            console.log(
              "✅ EdgeBreak access remains active:",
              subscriptionStatus
            );

          }

        }


        /*
        =====================================
        REMOVE ACCESS
        =====================================

        unpaid
        canceled
        incomplete_expired
        paused
        */

        else if (
          subscriptionStatus ===
            "unpaid" ||
          subscriptionStatus ===
            "canceled" ||
          subscriptionStatus ===
            "incomplete_expired" ||
          subscriptionStatus ===
            "paused"
        ) {

          const {
            error
          } =
            await supabase
              .from(
                "profiles"
              )
              .update({

                is_active:
                  false

              })
              .eq(
                "stripe_customer_id",
                customerId
              );


          if (error) {

            console.error(
              "Profile deactivation failed:",
              error
            );

          }
          else {

            console.log(
              "❌ EdgeBreak access deactivated:",
              subscriptionStatus
            );

          }

        }


        break;

      }


      /* =====================================
      SUBSCRIPTION DELETED
      ===================================== */

      case "customer.subscription.deleted": {

        const subscription =
          event.data.object;


        const customerId =
          subscription.customer;


        const {
          error
        } =
          await supabase
            .from(
              "profiles"
            )
            .update({

              is_active:
                false

            })
            .eq(
              "stripe_customer_id",
              customerId
            );


        if (error) {

          console.error(
            "Subscription cancellation update failed:",
            error
          );

        }
        else {

          console.log(
            "❌ Subscription cancelled — EdgeBreak access deactivated."
          );

        }


        break;

      }


      /* =====================================
      EVERYTHING ELSE
      ===================================== */

      default:

        console.log(
          "Unhandled Event:",
          event.type
        );

    }


    /* =========================================
    SUCCESS RESPONSE
    ========================================= */

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
          "Content-Type":
            "application/json"
        }
      }
    );

  }

});