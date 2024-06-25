import { CookieOptions, createServerClient } from "@supabase/ssr";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter, createTRPCContext } from "@craftgen/api";
import type { Database } from "@craftgen/db/db/database.types";

// import { getServiceSupabase } from "@/utils/supabase";
import { env } from "@/env.mjs";
import { createClient } from "@/utils/supabase/server";
import { getServiceSupabase } from "@/utils/supabase/service";

// export const runtime = "edge";

/**
 * Configure basic CORS headers
 * You should extend this to match your needs
 */
const setCorsHeaders = (res: Response) => {
  res.headers.set(
    "Access-Control-Allow-Origin",
    process.env.NODE_ENV === "development"
      ? "http://localhost:1420"
      : "tauri://localhost",
  );
  res.headers.set("Access-Control-Request-Method", "*");
  res.headers.set("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, trpc-batch-mode,  x-trpc-source",
  );
  res.headers.set("Access-Control-Allow-Credentials", "true");
};

export function OPTIONS() {
  const response = new Response(null, {
    status: 204,
  });
  setCorsHeaders(response);
  return response;
}

const handler = async (req: Request) => {
  const supabase = createClient();

  const session = await supabase.auth.getSession();
  // console.log("AUTH", req.headers.get("Cookie"));
  // const user = await supabase.auth.getUser(req.headers.get("Authorization"));

  const supabaseService = getServiceSupabase();

  const response = await fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        headers: req.headers,
        auth: session.data.session,
        // ? {
        //     ...session.data.session,
        //     user: {
        //       ...session.data.session.user,
        //       user_metadata: {
        //         ...session.data.session.user.user_metadata,
        //         ...user?.data?.user?.user_metadata,
        //       },
        //     },
        //   }
        // : null,
        supabaseService: supabaseService,
      }),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

  setCorsHeaders(response);
  return response;
};

export { handler as GET, handler as POST };
