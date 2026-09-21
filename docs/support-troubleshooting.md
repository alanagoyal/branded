# Support chat troubleshooting

Human support is available to everyone at hi@basecase.vc. The help page can prepare an email with the chat transcript. It opens the visitor's email app; the visitor must send the email there. It does not create a ticket in a backend.

## Investigating a failed reply

1. Expand **Error details** under the failed reply. The installed Markprompt SDK puts non-abort API errors in `message.error` while marking the reply `cancelled`; that state alone does not identify a user cancellation.
2. In browser developer tools, inspect the failed Markprompt chat request's HTTP status, response error, time, and request identifier. Do not copy authentication headers, cookies, or private transcripts into a public issue.
3. In the Markprompt project, match that request/time and check project authorization, allowed origins, quota, enabled model, and upstream provider status.
4. Confirm the project's support for the configured `gpt-4-turbo-preview` model before changing it. The [OpenAI model reference](https://developers.openai.com/api/docs/models/gpt-4-turbo-preview) still documents the model; that does not establish access or configuration in this Markprompt project. Omitting `model` in the installed SDK selects `gpt-4`, so removing the setting is not a verified repair.
5. `NEXT_PUBLIC_API_URL` is an optional override. The installed SDK has a default API endpoint; a missing override does not by itself explain production failures. A missing `NEXT_PUBLIC_PROJECT_KEY` disables the chat UI while leaving email support available.

The production upstream cause remains unconfirmed. Local regression checks exercise failed replies and escalation without making paid provider calls or sending support emails.
