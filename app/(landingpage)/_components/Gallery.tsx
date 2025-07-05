export const Gallery = () => {
  const rooms = [
    { id: 1, style: "Modern Bedroom" },
    { id: 2, style: "Minimalist Living Room" },
    { id: 3, style: "Industrial Kitchen" },
    { id: 4, style: "Scandinavian Bedroom" },
    { id: 5, style: "Bohemian Living Room" },
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Rooms that <span className="text-blue-600">AISpacefy</span> created
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="relative group">
              <div className="aspect-square bg-gray-300 rounded-lg overflow-hidden shadow-lg">
                <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-400 flex items-center justify-center">
                  <span className="text-gray-600 text-sm font-medium">
                    {room.style}
                  </span>
                </div>
              </div>

              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
