import {env} from 'cloudflare:workers';

/** Configure the exact immutable auth subject and verified email, never a tenant setting. */
export function platformOwnerIdentity() {
  const config = env as unknown as Record<string, string | undefined>;
  const userId = config.PLANFLO_PLATFORM_OWNER_ID?.trim();
  const email = config.PLANFLO_PLATFORM_OWNER_EMAIL?.trim().toLowerCase();
  return userId && email && !/[\s,]/.test(userId) && /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(email)
    ? {userId, email} : null;
}

export function isPlatformOwner(user: {userId?:string; email:string}) {
  const owner = platformOwnerIdentity();
  return !!owner && user.userId === owner.userId && user.email.trim().toLowerCase() === owner.email;
}
