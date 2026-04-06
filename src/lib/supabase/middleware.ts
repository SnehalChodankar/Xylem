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

  // Silently refresh the session token if it's expired.
  // We intentionally do NOT redirect here based on auth state.
  //
  // REASON: This app runs inside a Capacitor WebView on Android. When Android
  // wakes the app from a background state, the network connection is not always
  // immediately available. If we redirect to /login here when getSession() fails
  // due to a network timeout, the user gets kicked out even though they ARE
  // authenticated — their token just couldn't refresh yet.
  //
  // Auth-based redirects are handled client-side in dashboard/layout.tsx where
  // we can wait for the network and retry gracefully.
  try {
    await supabase.auth.getSession()
  } catch {
    // Silently ignore — the response still goes through unchanged.
    // Client-side auth guard will handle unauthenticated users.
  }

  const isAuthRoute = request.nextUrl.pathname === '/'
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')

  // Only enforce redirects on the web browser (non-Capacitor) by checking
  // for the absence of a native user-agent. For the Capacitor WebView, we
  // pass all requests through and let the client handle auth.
  const userAgent = request.headers.get('user-agent') ?? ''
  const isCapacitorWebView = userAgent.includes('wv') && userAgent.includes('Android')

  if (!isCapacitorWebView) {
    // Standard web browser: enforce server-side auth redirects
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user ?? null

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
