"use server";

import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createSession(formData: FormData) {
  const session = await auth.getSession();
  const sessionUser = session?.data?.user;

  if (!sessionUser) {
    return { error: "You must be signed in." };
  }

  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const batchId = formData.get("batchId") as string;

  try {
    // 1. Validate the role against the database directly
    const [dbUser] = await sql`
      SELECT id, role FROM users 
      WHERE clerk_user_id = ${sessionUser.id}
      LIMIT 1
    `;

    if (!dbUser) {
      return { error: "User profile not found in database." };
    }

    // 2. Perform the authorization check using the DB record
    if (dbUser.role.toLowerCase() !== "trainer") {
      return { error: `Unauthorized: Your database role is '${dbUser.role}'. Only trainers can create sessions.` };
    }

    // 3. Insert the session using the verified internal user ID
    await sql`
      INSERT INTO sessions (batch_id, trainer_id, title, date, start_time, end_time)
      VALUES (${batchId}, ${dbUser.id}, ${title}, ${date}, ${startTime}, ${endTime})
    `;
    
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { error: "Failed to create session due to a database error." };
  }
}