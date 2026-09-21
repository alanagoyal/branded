export class ProviderRequestError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function readProviderResponse(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error) {
    const fallback = response.status === 401 ? "Sign in to continue."
      : response.status === 429 ? "You've reached a usage limit. Please try again later."
      : "Unable to complete this request. Please try again.";
    throw new ProviderRequestError(typeof data?.error === "string" ? data.error : fallback, response.status);
  }
  if (!data) throw new Error("The server returned an invalid response. Please try again.");
  return data;
}
