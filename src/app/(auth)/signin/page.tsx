import { redirect } from "next/navigation";
import { SIGN_IN_PATH } from "@/lib/auth/constants";

/** Legacy /signin → /login */
export default function SignInRedirectPage() {
  redirect(SIGN_IN_PATH);
}
