// utils/cookies.ts
"use server";
import { cookies } from "next/headers";

export async function deleteAuthToken() {
    const cookieStore = await cookies();
    cookieStore.delete("token");
}
