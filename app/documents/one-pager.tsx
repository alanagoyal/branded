import { Tailwind } from "@onedoc/react-print";

export function OnePager({
  nameData,
  userData,
  content,
  logoUrl,
}: {
  nameData: any;
  userData: any;
  content: any;
  logoUrl: any;
}) {
  return (
    <Tailwind>
      <div className="py-4 px-4">
        <div className="flex justify-center">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="w-[256px] h-[256px]" />
          )}
        </div>
        <h2 className="font-bold text-xl text-center pt-4">{nameData.name}</h2>
        {userData.name && (
          <div className="pt-4 text-center">
            <p className="text-gray-700 font-semibold">
              {userData.name} (Founder & CEO)
            </p>
          </div>
        )}
        <div className="pt-4 text-center">{content}</div>
        <div className="py-2 text-sm text-muted-foreground text-center">
          To learn more, please contact{" "}
          <a href={`mailto:${userData.email}`} className="underline">
            {userData.email}
          </a>
        </div>
      </div>
    </Tailwind>
  );
}
