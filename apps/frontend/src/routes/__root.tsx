import { createRootRoute, Outlet } from '@tanstack/react-router';

const RootComponent = (): React.ReactElement => <Outlet />;

export const Route = createRootRoute({
  component: RootComponent,
});
