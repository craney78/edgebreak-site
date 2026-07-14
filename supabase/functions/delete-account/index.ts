import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {

    try {

        const authHeader = req.headers.get("Authorization");

        if (!authHeader) {

            return new Response(
                JSON.stringify({
                    error: "Unauthorized"
                }),
                {
                    status: 401
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

                    status: 401

                }

            );

        }

        // ======================================
        // GET PROFILE
        // ======================================

        const {

            data: profile

        } = await supabase

            .from("profiles")

            .select("stripe_customer_id")

            .eq("id", user.id)

            .single();

        // ======================================
        // SAVE USED TRIAL
        // ======================================

        await supabase

            .from("used_trials")

            .upsert({

                email: user.email,

                stripe_customer_id:
                    profile?.stripe_customer_id ?? null,

                deleted_at:
                    new Date().toISOString()

            });

        // ======================================
        // DELETE WATCHLIST
        // ======================================

        await supabase

            .from("watchlist")

            .delete()

            .eq(
                "user_id",
                user.id
            );

        // ======================================
        // DELETE BROKER CONNECTIONS
        // ======================================

        await supabase

            .from("broker_connections")

            .delete()

            .eq(
                "user_id",
                user.id
            );

        // ======================================
        // DELETE PROFILE
        // ======================================

        await supabase

            .from("profiles")

            .delete()

            .eq(
                "id",
                user.id
            );

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

                headers: {

                    "Content-Type":
                        "application/json"

                }

            }

        );

    }

    catch (err) {

        return new Response(

            JSON.stringify({

                error:
                    err instanceof Error
                        ? err.message
                        : "Unknown error"

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