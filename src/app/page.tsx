import { redirect } from "next/navigation";
import { SIGN_IN_PATH } from "@/lib/auth/constants";

export default function HomePage() {
  redirect(SIGN_IN_PATH);
}
