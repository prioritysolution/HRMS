import { redirect } from "next/navigation";
import { SIGN_IN_PATH } from "@/lib/auth/constants";

/** Signup is disabled — send visitors to login. */
export default function SignUpRedirectPage() {
  redirect(SIGN_IN_PATH);
}
