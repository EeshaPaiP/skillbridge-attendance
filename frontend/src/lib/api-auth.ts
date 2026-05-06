import { auth } from "@/lib/auth";
import { sql } from "@/lib/db";

export interface DbUser {
  id: number;
  role: string;
  name: string | null;
  institution_id: number | null;
}

export async function getDbUser(): Promise<DbUser | null> {
  const session = await auth.getSession();
  const sessionUser = session?.data?.user;

  if (!sessionUser) {
    return null;
  }

  const [dbUser] = (await sql`
    SELECT id, role, name, institution_id
    FROM users
    WHERE clerk_user_id = ${sessionUser.id}
    LIMIT 1
  `) as DbUser[];

  return dbUser ?? null;
}

export function hasRole(user: DbUser, roles: string[]) {
  return roles.includes(user.role.toLowerCase());
}
