# Try-on proxy

Serverless function that keeps the image-provider key off the static site.

    cd tryon-proxy
    vercel link            # once
    vercel env add OPENAI_API_KEY production     # or GEMINI_API_KEY
    vercel deploy --prod

Then set `TRYON.endpoint` in `designs/maison/index.html` to `https://<deployment>/api/tryon`.

OpenAI is used when `OPENAI_API_KEY` is set (`gpt-image-1`, override with `OPENAI_IMAGE_MODEL`; the org must be verified for image models). Otherwise Gemini (`gemini-2.5-flash-image`, "Nano Banana").
Limits (`DAILY_LIMIT`, `PER_IP_LIMIT`) are per warm instance only — put a real counter in front before real traffic. Photos are not stored; only status and error text are logged.
