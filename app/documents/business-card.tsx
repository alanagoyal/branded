import Image from "next/image";

export function BusinessCard({
  nameData,
  userData,
  content,
}: {
  nameData: any;
  userData: any;
  content: any;
}) {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden mx-auto max-w-xs">
      <div className="py-4 px-6">
        <h2 className="font-bold text-xl mb-2">{nameData.name}</h2>
        <div className="mt-4">
          <p className="text-gray-700 font-semibold">
            {userData.name} (Founder & CEO)
          </p>
          <p className="text-gray-500">{userData.email}</p>
        </div>
        <div>
            {content}
        </div>
      </div>
    </div>
  );
}
