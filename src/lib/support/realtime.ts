import { getSupportApiKey, supportFetch, type SupportRealtimeConfig, type SupportSignal } from "@/lib/support/client";

export type SupportRealtimeHandle = {
  disconnect: () => void;
  soundUrl: string;
};

export async function connectSupportRealtime(input: {
  phone: string;
  token: string;
  number?: string;
  onSignal: (event: SupportSignal) => void;
  onSoundUrl?: (soundUrl: string) => void;
}): Promise<SupportRealtimeHandle> {
  const params = new URLSearchParams({ phone: input.phone });
  if (input.number) params.set("number", input.number);

  const ready = await supportFetch<SupportRealtimeConfig>(
    `/integrations/redirect/realtime?${params.toString()}`,
    { token: input.token },
  );
  const data = ready.data;

  const [{ default: Echo }, { default: Pusher }] = await Promise.all([
    import("laravel-echo"),
    import("pusher-js"),
  ]);

  const browserWindow = window as Window & { Pusher?: typeof Pusher };
  browserWindow.Pusher = Pusher;

  const echo = new Echo({
    broadcaster: data.broadcaster,
    key: data.key,
    wsHost: data.host,
    wsPort: data.port,
    wssPort: data.port,
    forceTLS: data.scheme === "https",
    enabledTransports: ["ws", "wss"],
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: (error: Error | null, auth: { auth: string } | null) => void) => {
        fetch(data.authEndpoint, {
          method: "POST",
          credentials: "omit",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "X-Api-Key": getSupportApiKey(),
            "X-Client-Token": input.token,
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name,
            phone: input.phone,
          }),
        })
          .then(async (response) => {
            const body = (await response.json()) as { auth?: string; message?: string };
            if (!response.ok || !body.auth) {
              throw new Error(body.message || "The channel could not be joined.");
            }
            callback(null, { auth: body.auth });
          })
          .catch((error: Error) => callback(error, null));
      },
    }),
  } as ConstructorParameters<typeof Echo>[0]);

  if (data.soundUrl) input.onSoundUrl?.(data.soundUrl);

  echo.private(data.customerChannel).listen(".signal", input.onSignal);
  if (data.ticketChannel) {
    echo.private(data.ticketChannel).listen(".signal", input.onSignal);
  }

  return {
    soundUrl: data.soundUrl,
    disconnect: () => {
      echo.disconnect();
    },
  };
}
