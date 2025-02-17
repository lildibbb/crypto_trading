import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  // beforeLoad: ({ context }) => {
  // 	if (!context.auth.isAuthenticated) {
  // 		throw redirect({ to: "/login" });
  // 	}
  // 	// Redirect root to dashboard
  // 	throw redirect({ to: "/dashboard" });
  // },

  component: () => (
    <div className="min-h-screen  ">
      <Outlet />
    </div>
  ),
});
