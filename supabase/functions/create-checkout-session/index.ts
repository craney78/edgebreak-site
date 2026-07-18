import { serve } from "https://deno.land/std/http/server.ts";
import Stripe from "https://esm.sh/stripe@14?target=denonext";

const key = Deno.env.get("STRIPE_SECRET_KEY");

console.log("KEY PREFIX:", key?.substring(0, 8));

const stripe = new Stripe(
  key!,
  {
    apiVersion: "2024-06-20"
  }
);

serve(async (req) => {

  try {

    const { email } = await req.json();

    if (!email) {

      return new Response(
        JSON.stringify({
          error: "Missing email"
        }),
        {
          status: 400
        }
      );

    }

    const session =
      await stripe.checkout.sessions.create({

        mode: "subscription",

        customer_email: email,

        line_items: [

          {
            price: "price_1TMVSdCys1zSKDi2HILFnFV1",
            quantity: 1
          }

        ],

        success_url:
          "https://www.edgebreak.ai/create-account.html",

        cancel_url:
          "https://www.edgebreak.ai/pricing.html"

      });

    return new Response(
      JSON.stringify({
        url: session.url
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

  } catch (err) {

    return new Response(
      JSON.stringify({
        error: err.message
      }),
      {
        status: 500
      }
    );

  }

});