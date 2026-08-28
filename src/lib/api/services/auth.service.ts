import type {
  ApiMessageResponse,
  AuthResponse,
  AuthUser,
  ForgotPasswordRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from "@/lib/api/types";
import { loginLocal, registerLocal } from "@/lib/auth/local-auth";
import { clearAccessToken, getStoredUser, setSession } from "@/lib/auth/session";

function persistAuth(response: AuthResponse): AuthResponse {
  setSession(response.token, response.user);
  return response;
}

/** Static auth — no backend API calls until Laravel is wired. */
export const authService = {
  login: async (payload: LoginRequest) => persistAuth(await loginLocal(payload)),

  register: async (payload: RegisterRequest) => persistAuth(await registerLocal(payload)),

  logout: async () => {
    clearAccessToken();
  },

  me: async (): Promise<AuthUser | null> => getStoredUser(),

  forgotPassword: async (_payload: ForgotPasswordRequest): Promise<ApiMessageResponse> => ({
    message: "Password reset is not available in static auth mode.",
  }),

  verifyOtp: async (_payload: VerifyOtpRequest): Promise<ApiMessageResponse> => ({
    message: "OTP verification is not available in static auth mode.",
  }),

  resetPassword: async (_payload: ResetPasswordRequest): Promise<ApiMessageResponse> => ({
    message: "Password reset is not available in static auth mode.",
  }),
};
