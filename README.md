# Namebase
Namebase helps founders generate unique name ideas, available domain names, creative logos, and even sales collateral for their startups.

## Getting Started
`git clone https://github.com/alanagoyal/namebase`

### Supabase
This project uses [Supabase](https://supabase.com) as a backend. To set up the database, create a [new project](https://database.new), enter your project details, and wait for the database to launch. Navigate to the SQL editor in the dashboard, paste the SQL from the [migration file](https://github.com/alanagoyal/namebase/blob/main/supabase/migrations/20240325200017_initial.sql) into the SQL editor and press run. You can also use the Supabase CLI to do this locally.

Grab the project URL and anon key from the API settings and put them in a new `.env.local` file in the root directory as shown:
```
NEXT_PUBLIC_SUPABASE_URL="<your-supabase-url>" 
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
```
### APIs & Dependencies
This project uses the following APIs:
- [OpenAI](https://openai.com) for chat completions and image generation
- [Braintrust](https://braintrustdata.com) for logging & evals
- [Markprompt](https://markprompt.com/) to power the AI customer support chatbot
- [Onedoc](https://www.onedoclabs.com/) to generate the PDF one-pager documents 
- [WHOXY](https://www.whoxy.com/) to fetch available domain names 

For each, you can sign up for a free account, grab your API key, and paste it into `.env.local`.

Run `npm install` to install the dependencies

## Run
Run `npm run dev` and open [http://localhost:3000](http://localhost:3000) to start developing locally.

## Deploy
The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

