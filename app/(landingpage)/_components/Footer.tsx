export const Footer = () => {
  return (
    <footer className="bg-gray-100 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-gray-600 text-sm">
            Powered by{" "}
            <span className="text-blue-600 font-semibold">Replicate</span> and{" "}
            <span className="text-blue-600 font-semibold">Vercel</span>
          </div>

          <div className="text-gray-600 text-sm">
            Created by{" "}
            <span className="text-blue-600 font-semibold">Moustafa</span>{" "}
          </div>
        </div>
      </div>
    </footer>
  );
};
