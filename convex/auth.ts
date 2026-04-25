import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Phone } from "@convex-dev/auth/providers/Phone";
import Apple from "@auth/core/providers/apple";
import Google from "@auth/core/providers/google";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    Password,
    Apple,
    Google,
    // 6-digit SMS OTP. Sends via Twilio when TWILIO_* env vars are set;
    // otherwise logs the code to the Convex function output so dev can
    // grab it without needing Twilio credentials yet.
    Phone({
      id: "phone",
      generateVerificationToken: async () => {
        const digits = "0123456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += digits[Math.floor(Math.random() * digits.length)];
        }
        return code;
      },
      sendVerificationRequest: async ({ identifier, token }) => {
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const from = process.env.TWILIO_FROM_NUMBER;

        if (!sid || !authToken || !from) {
          console.log(
            `📱 [phone-otp dev mode] code for ${identifier}: ${token} ` +
              `(set TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER ` +
              `in Convex env to send real SMS)`,
          );
          return;
        }

        const body = `Your BayDay code is ${token}. Valid for 20 minutes.`;
        const params = new URLSearchParams({
          To: identifier,
          From: from,
          Body: body,
        });
        const resp = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              Authorization: `Basic ${btoa(`${sid}:${authToken}`)}`,
            },
            body: params.toString(),
          },
        );
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(`Twilio send failed: ${resp.status} ${text}`);
        }
      },
    }),
  ],
});
