import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let session = null
  try {
    const { data } = await supabase.auth.getSession()
    session = data.session
  } catch {
    // Network or token error — treat as no session.
    // Client-side auth guard will handle the actual redirect.
    session = null
  }

  const user = session?.user ?? null
  const isAuthRoute = request.nextUrl.pathname === '/'
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')

  // Detect Capacitor Android WebView via user-agent.
  // Android WebView always includes "wv" in the UA string.
  const userAgent = request.headers.get('user-agent') ?? ''
  const isCapacitorWebView = userAgent.includes('wv') && userAgent.includes('Android')

  if (isCapacitorWebView) {
    // NATIVE APP RULES:
    // ✅ Redirect authenticated user away from login page → dashboard
    //    (This is the critical one: app starts at '/' on relaunch)
    // ❌ Do NOT redirect unauthenticated user away from dashboard → login
    //    (Client-side guard in dashboard/layout.tsx handles this with a 5s
    //     grace period to allow token refresh to complete over the network)
    if (isAuthRoute && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  } else {
    // STANDARD WEB BROWSER RULES: full server-side enforcement
    if (isDashboardRoute && !user) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    if (isAuthRoute && user) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
