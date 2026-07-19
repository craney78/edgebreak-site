import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://www.edgebreak.ai",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {

  // =========================
  // CORS PREFLIGHT
  // =========================

  if (req.method === "OPTIONS") {

    return new Response(
      "ok",
      {
        headers: corsHeaders
      }
    );

  }

  try {

    // =========================
    // AUTHENTICATE USER
    // =========================

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {

      return new Response(

        JSON.stringify({

          success: false,
          error: "Missing authorization token."

        }),

        {

          status: 401,

          headers: {

            ...corsHeaders,

            "Content-Type":
              "application/json"

          }

        }

      );

    }

    const jwt =
      authHeader.replace("Bearer ", "");

    const {

      data: { user },
      error: authError

    } =
      await supabaseAdmin.auth.getUser(jwt);

    if (authError || !user) {

      return new Response(

        JSON.stringify({

          success: false,
          error: "User not authenticated."

        }),

        {

          status: 401,

          headers: {

            ...corsHeaders,

            "Content-Type":
              "application/json"

          }

        }

      );

    }

    const email = user.email;

    // =========================
    // CHECK PAYMENT
    // =========================

    const {

      data: payment,
      error: paymentError

    } =
      await supabaseAdmin
        .from("paid_customers")
        .select("*")
        .eq("email", email)
        .maybeSingle();

    if (paymentError) {

      return new Response(

        JSON.stringify({

          success: false,
          error: paymentError.message

        }),

        {

          status: 500,

          headers: {

            ...corsHeaders,

            "Content-Type":
              "application/json"

          }

        }

      );

    }

    if (!payment) {

      return new Response(

        JSON.stringify({

          success: false,
          error: "No completed payment found."

        }),

        {

          status: 403,

          headers: {

            ...corsHeaders,

            "Content-Type":
              "application/json"

          }

        }

      );

    }

    // =========================
    // CREATE OR ACTIVATE PROFILE
    // =========================

    const { error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: user.id,
            email: email,
            is_active: true,
            stripe_customer_id: payment.stripe_customer_id
          },
          {
            onConflict: "id"
          }
        );

    if (profileError) {

      return new Response(

        JSON.stringify({

          success: false,
          error: profileError.message

        }),

        {

          status: 500,

          headers: {

            ...corsHeaders,

            "Content-Type":
              "application/json"

          }

        }

      );

    }

    // =========================
    // REMOVE PAYMENT RECORD
    // =========================

    await supabaseAdmin
      .from("paid_customers")
      .delete()
      .eq("email", email);

    // =========================
    // SUCCESS
    // =========================

    return new Response(

      JSON.stringify({

        success: true

      }),

      {

        headers: {

          ...corsHeaders,

          "Content-Type":
            "application/json"

        }

      }

    );

  }

  catch (err) {

    return new Response(

      JSON.stringify({

        success: false,
        error: String(err)

      }),

      {

        status: 500,

        headers: {

          ...corsHeaders,

          "Content-Type":
            "application/json"

        }

      }

    );

  }

});