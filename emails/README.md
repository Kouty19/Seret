# Seret — Email templates

HTML templates designed for Supabase Auth's Email Templates. Black-and-gold
premium look that matches the app. Auto-switches between French and English
based on the user's browser language at signup time.

## How Supabase gets the language

When the client calls `sb.auth.signUp(...)`, the language is passed via
`options.data.lang`. Supabase stores this in `user_metadata` and exposes it
in email templates as `{{ .Data.lang }}`. That's why every template uses:

```
{{ if eq .Data.lang "fr" }} ... FR ... {{ else }} ... EN ... {{ end }}
```

Every language we don't have a dedicated branch for falls back to English.

## How to install the welcome email in Supabase

There's no native Supabase API to push email templates — you paste them in
the dashboard. One-time, takes about two minutes.

1. Open [Supabase → Authentication → Email Templates](https://app.supabase.com/project/vowlzbidjmytnsbthrfb/auth/templates)
2. Pick **"Confirm signup"** (this is the ONE email every new user receives)
3. Replace the **Subject** field with the contents of
   [`confirm-signup.subject.txt`](confirm-signup.subject.txt)
4. Replace the **Message body** (HTML editor) with the contents of
   [`confirm-signup.html`](confirm-signup.html)
5. Click **Save**

## Required settings

For the signup email to actually fire:

- Supabase → Authentication → **Providers → Email → Confirm email: ENABLED**
- Supabase → Authentication → **URL Configuration → Site URL: https://seret-weld.vercel.app**
  (so `{{ .SiteURL }}` and `{{ .ConfirmationURL }}` point back to prod)
- Supabase → Authentication → **URL Configuration → Redirect URLs**:
  add `https://seret-weld.vercel.app/*`

## Testing

The easiest way to verify is to sign up with a fresh test email. If you don't
want to pollute your user list:

1. Keep the "Confirm email" toggle ON
2. Sign up with `yourname+test1@gmail.com`, `yourname+test2@gmail.com`, etc.
   (Gmail ignores everything after `+` but still delivers to your inbox)

You should get the gold-on-black email within ~10 seconds. If you set
`options.data.lang = 'fr'` in the signup call (which the app does
automatically based on `currentLang`), you get the French version.

## Template variables available

From Supabase's Go template context:

- `{{ .Email }}` — user's email
- `{{ .Token }}` — 6-digit OTP code (if OTP mode)
- `{{ .TokenHash }}` — token hash (if link mode)
- `{{ .ConfirmationURL }}` — full activation URL (already includes token)
- `{{ .SiteURL }}` — configured Site URL
- `{{ .RedirectTo }}` — where the user lands after clicking confirm
- `{{ .Data.lang }}` — our custom `lang` field (en/fr/es/de/pt/ru/he/ar)

## Other email flows

Supabase sends emails for several flows. The templates live under the same
dashboard page:

- `Confirm signup` → **this welcome email** (covered above)
- `Invite user` → not used by Seret (we use share codes instead)
- `Magic Link` → uses same variables; can reuse this HTML with minor tweaks
- `Change Email Address` → default template is fine
- `Reset Password` → default template is fine (not critical to brand it yet)

We only brand the **Confirm signup** one for now since it's what every
new user sees first.
