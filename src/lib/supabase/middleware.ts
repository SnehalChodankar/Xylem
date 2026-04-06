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

  // IMPORTANT: Use getSession() not getUser() here.
  //
  // getUser() validates the token against the Supabase Auth server on EVERY
  // request. In a Capacitor app, this means every page navigation makes a
  // remote network call. When:
  //   - The user opens the app without network (subway, flight mode)
  //   - The 1-hour access token has expired (common for background apps)
  //   - Supabase Auth server is slow or unavailable
  // ...getUser() returns null and the user is kicked to the login screen.
  //
  // getSession() decodes the JWT locally from the cookie — no network call.
  // The @supabase/ssr cookie adapter already handles refresh token rotation
  // automatically via the setAll() handler above. So the user stays logged in
  // as long as their refresh token is valid (typically 60 days).
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null

  const isAuthRoute = request.nextUrl.pathname === '/'
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard')

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

  return supabaseResponse
}
