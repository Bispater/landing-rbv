import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Wait until Firebase has restored any persisted session at least once, then
  // decide based on the CURRENT auth state — not the one-shot initial value,
  // which would be stale right after an in-session login.
  await auth.authReady;
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/admin/login']);
};
