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

        const jwt = authHeader.replace("Bearer ", "");

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

        // Delete profile

        await supabase
            .from("profiles")
            .delete()
            .eq("id", user.id);

        // Delete watchlist

        await supabase
            .from("watchlist")
            .delete()
            .eq("user_id", user.id);

        // Delete broker connections

        await supabase
            .from("broker_connections")
            .delete()
            .eq("user_id", user.id);

        // Delete auth user

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

                    "Content-Type": "application/json"

                }

            }

        );

    }

    catch (err) {

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