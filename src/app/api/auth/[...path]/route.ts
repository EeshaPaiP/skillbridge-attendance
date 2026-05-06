// app/api/auth/[...path]/route.ts
import { auth } from "@/lib/auth";

export const { GET, POST } = auth.handler();