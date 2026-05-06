"use server";

import { sql } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createBatch(formData: FormData) {
  const session = await auth.getSession();
  const sessionUser = session?.data?.user;

  if (!sessionUser) {
    return { error: "You must be signed in." };
  }

  try {
    // FIX: Remove 'OR id = ...' to prevent integer/string mismatch
    const [dbUser] = await sql`
      SELECT id, role FROM users 
      WHERE clerk_user_id = ${sessionUser.id}
      LIMIT 1
    `;

    if (!dbUser) {
      return { error: "User profile not found in database." };
    }

    // Role check (normalization for safety)
    if (dbUser.role.toLowerCase() !== "institution") {
      return { error: "Unauthorized: Only institutions can create batches." };
    }

    const name = formData.get("name") as string;
    const trainerIdStr = formData.get("trainerId") as string;
    const trainerId = trainerIdStr ? parseInt(trainerIdStr) : null;

    // Create the batch
    const [batch] = await sql`
      INSERT INTO batches (name, institution_id)
      VALUES (${name}, ${dbUser.id})
      RETURNING id
    `;

    // Link trainer if valid integer ID is provided
    if (batch && trainerId && !isNaN(trainerId)) {
      await sql`
        INSERT INTO batch_trainers (batch_id, trainer_id)
        VALUES (${batch.id}, ${trainerId})
      `;
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Batch Error:", error);
    return { error: "Failed to create batch due to a database error." };
  }
}