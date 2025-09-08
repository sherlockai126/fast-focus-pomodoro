import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    // middleware logic if needed
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/tasks/:path*",
    "/api/pomodoro/:path*",
    "/api/settings/:path*",
    "/api/sessions/migrate/:path*"
  ]
}