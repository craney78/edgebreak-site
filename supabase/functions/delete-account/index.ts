import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17.7.0?target=deno";

const stripe = new Stripe(
    Deno.env.get("STRIPE_SECRET_KEY")!,
    {
        apiVersion: "2025-06-30.basil"
    }
);

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
};

serve(async (req) => {

    if (req.method === "OPTIONS") {
        return new Response("ok", {
            headers: corsHeaders
        });
    }

    try {

        const authHeader = req.headers.get("Authorization");

        if (!authHeader) {

            return new Response(
                JSON.stringify({
                    error: "Unauthorized"
                }),
                {
                    status: 401,
                    headers: corsHeaders
                }
            );

        }

        const supabase = createClient(

            Deno.env.get("SUPABASE_URL")!,

            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

        );

        const jwt = authHeader.replace(
            "Bearer ",
            ""
        );

        const {

            data: { user },

            error

        } = await supabase.auth.getUser(jwt);

        if (error || !user) {

            return new Response(

                JSON.stringify({

                    error: "Invalid user"

                }),

                {

                    status: 401,
                    headers: corsHeaders

                }

            );

        }

        // ======================================
        // GET PROFILE
        // ======================================

        const {

            data: profile,
            error: profileError

        } = await supabase

            .from("profiles")

            .select("stripe_customer_id")

            .eq("id", user.id)

            .single();

        if (profileError) throw profileError;

        // ======================================
        // SAVE USED TRIAL
        // ======================================

        const { error: trialError } = await supabase

            .from("used_trials")

            .upsert({

                email: user.email,

                stripe_customer_id:
                    profile?.stripe_customer_id ?? null,

                deleted_at:
                    new Date().toISOString()

            });

        if (trialError) throw trialError;

        // ======================================
        // CANCEL STRIPE SUBSCRIPTION
        // ======================================

        if (profile?.stripe_customer_id) {

            const subscriptions = await stripe.subscriptions.list({

                customer: profile.stripe_customer_id,

                status: "active",

                limit: 1

            });

            if (subscriptions.data.length > 0) {

                await stripe.subscriptions.cancel(

                    subscriptions.data[0].id

                );

            }

        }

        // ======================================
        // DELETE WATCHLIST
        // ======================================

        const { error: watchlistError } = await supabase

            .from("watchlist")

            .delete()

            .eq(
                "user_id",
                user.id
            );

        if (watchlistError) throw watchlistError;

        // ======================================
        // DELETE BROKER CONNECTIONS
        // ======================================

        const { error: brokerError } = await supabase

            .from("broker_connections")

            .delete()

            .eq(
                "user_id",
                user.id
            );

        if (brokerError) throw brokerError;

        // ======================================
        // DELETE PROFILE
        // ======================================

        const { error: profileDeleteError } = await supabase

            .from("profiles")

            .delete()

            .eq(
                "id",
                user.id
            );

        if (profileDeleteError) throw profileDeleteError;

        // ======================================
        // DELETE AUTH USER
        // ======================================

        const {

            error: deleteError

        } = await supabase.auth.admin.deleteUser(

            user.id

        );

        if (deleteError) {

            throw deleteError;

        }

        return new Response(

            JSON.stringify({

                success: true

            }),

            {

                headers: corsHeaders

            }

        );

    }

    catch (err) {

        console.error(err);

        return new Response(

            JSON.stringify({

                error:
                    err instanceof Error
                        ? err.message
                        : "Unknown error"

            }),

            {

                status: 500,

                headers: corsHeaders

            }

        );

    }

});