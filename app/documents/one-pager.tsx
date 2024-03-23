import { Tailwind } from "@onedoc/react-print";

export function OnePager({
  nameData,
  userData,
  content,
}: {
  nameData: any;
  userData: any;
  content: any;
}) {
  return (
    <Tailwind>
      <div className="py-10 px-10">
        <h2 className="font-bold text-xl">{nameData.name}</h2>
        <div className="pt-4">
          <p className="text-gray-700 font-semibold">
            {userData.name} (Founder & CEO)
          </p>
        </div>
        <div className="pt-4">{content}</div>
        <div className="py-2 text-sm text-muted-foreground">
          To learn more, please contact{" "}
          <a href={`mailto:${userData.email}`} className="underline">
            {userData.email}
          </a>
        </div>
      </div>
    </Tailwind>
  );
}
