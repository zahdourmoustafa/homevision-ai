export const LogoCloud = () => {
  const logos = [
    { name: "Business Insider", width: 150 },
    { name: "MSN", width: 80 },
    { name: "NBC", width: 100 },
    { name: "Business of Home", width: 180 },
    { name: "Yahoo News", width: 120 },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-center items-center space-x-12 grayscale opacity-60">
          {logos.map((logo, index) => (
            <div key={index} className="text-gray-700 font-semibold text-lg">
              {logo.name}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
