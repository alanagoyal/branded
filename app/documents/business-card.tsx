import Image from "next/image";

export function BusinessCard({
  nameData,
  userData,
}: {
  nameData: any;
  userData: any;
}) {
  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden mx-auto max-w-xs">
      <div className="py-4 px-6">
        <h2 className="font-bold text-xl mb-2">{nameData.name}</h2>
        <p className="text-gray-700 text-base">{nameData.description}</p>
        <div className="mt-4">
          <p className="text-gray-700 font-semibold">
            Founder: {userData.name}
          </p>
          <p className="text-gray-700">Email: {userData.email}</p>
        </div>
      </div>
    </div>
  );
}
