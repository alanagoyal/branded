// create a simple page that tells the user they can close this tab and need to confirm their account by clicking the link in their email
export default function ConfirmEmail() {
  return (
    <div className="w-full px-4 flex justify-center items-center flex-col">
      <h1 className="text-2xl font-bold mb-4">Confirm Your Email</h1>
      <div className="min-h-screen">
        <p className="text-sm pt-10">
          Close this tab and confirm your account by clicking the link in your
          email.
        </p>
      </div>
    </div>
  );
}
