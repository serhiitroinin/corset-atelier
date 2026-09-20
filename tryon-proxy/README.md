# Try-on and checkout proxy

Two serverless functions that keep secret keys off the static site.

    cd tryon-proxy
    vercel link            # once
    vercel env add OPENAI_API_KEY production     # or GEMINI_API_KEY   (try-on)
    vercel env add STRIPE_SECRET_KEY production  # sk_live_… or sk_test_… (checkout)
    vercel deploy --prod

## `api/tryon.js`

Set `TRYON.endpoint` in `designs/maison/index.html` to `https://<deployment>/api/tryon`.

OpenAI is used when `OPENAI_API_KEY` is set (`gpt-image-1`, override with `OPENAI_IMAGE_MODEL`; the org must be verified for image models). Otherwise Gemini (`gemini-2.5-flash-image`, "Nano Banana").
Limits (`DAILY_LIMIT`, `PER_IP_LIMIT`) are per warm instance only — put a real counter in front before real traffic. Photos are not stored; only status and error text are logged.

## `api/checkout.js`

Set `SHOP.checkoutEndpoint` in `designs/maison/checkout.html` to `https://<deployment>/api/checkout`. While it is empty the checkout page runs in demo mode: no payment is taken and no card fields are shown.

    POST { items: [{ id, size, qty }], email, shipping: { firstName, lastName, line1, line2?, postal, city, country, phone?, method }, discount?, returnUrl? }
    ->   { url, order }      # url = Stripe Checkout Session, order = VS-XXXXXX
    ->   { error }           # 400 bad input, 403 origin, 405 method, 502 Stripe, 503 STRIPE_SECRET_KEY missing

- The price list lives in the function (`PRICES`). Client prices are never read. Keep it in step with the prices shown in `index.html` and `checkout.html`.
- Validation: known piece ids, even sizes 18–40, quantity 1–5 per piece and size, EU countries and the UK, shipping method `standard` or `express`.
- Discount: `VESNA10` is 10% off merchandise, applied to each unit price (Stripe has no negative line items). Any other code is a 400.
- Shipping: Standard €6.95, free when the subtotal before discount is €120 or more; Express €14.95. Sent as a Stripe `shipping_options` fixed rate.
- The Stripe call is a plain `fetch` to `https://api.stripe.com/v1/checkout/sessions` with a form-encoded body. No SDK.
- `success_url` is `<checkout page>?paid=1&order=VS-XXXXXX`, `cancel_url` is `<checkout page>?cancelled=1`. The page is `returnUrl` when its origin is on the allow-list (or localhost), otherwise `CHECKOUT_URL` (default: the GitHub Pages checkout page).
- `?paid=1` only drives the thank-you page and can be typed by anyone. The record of payment is Stripe (dashboard or a `checkout.session.completed` webhook, not included here). The order number is in the session's `client_reference_id` and `metadata.order`.
- Origins: `ALLOWED_ORIGINS` (comma separated, default `https://serhiitroinin.github.io`) plus localhost, same as the try-on function.
