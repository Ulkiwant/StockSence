import { Resend } from "resend";

// Lazy singleton — n'instancie Resend qu'au premier appel (pas au build)
let _client: Resend | null = null;

export function getResend(): Resend {
  if (!_client) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _client = new Resend(key);
  }
  return _client;
}

// Alias de commodité pour les routes existantes
export const resend = {
  emails: {
    send: (payload: Parameters<Resend["emails"]["send"]>[0]) =>
      getResend().emails.send(payload),
  },
};

export const FROM_EMAIL = "StockSense <alertes@stocksense.app>";
