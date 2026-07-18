import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {

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
            "Content-Type": "application/json"
          }
        }
      );

    }

    const jwt = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: authError
    } = await supabaseAdmin.auth.getUser(jwt);

    if (authError || !user) {

      return new Response(
        JSON.stringify({
          success: false,
          error: "User not authenticated."
        }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json"
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
    } = await supabaseAdmin
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
            "Content-Type": "application/json"
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
            "Content-Type": "application/json"
          }
        }
      );

    }

    // =========================
    // ACTIVATE PROFILE
    // =========================

    const { error: updateError } =
      await supabaseAdmin
        .from("profiles")
        .update({

          is_active: true,

          stripe_customer_id:
            payment.stripe_customer_id

        })
        .eq("id", user.id);

    if (updateError) {

      return new Response(
        JSON.stringify({
          success: false,
          error: updateError.message
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

    }

    // =========================
    // REMOVE TEMP PAYMENT RECORD
    // =========================

    await supabaseAdmin
      .from("paid_customers")
      .delete()
      .eq("email", email);

    return new Response(
      JSON.stringify({
        success: true
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