import { Card } from "@/components/ui/card";

export const Testimonials = () => {
  const testimonials = [
    {
      rating: 5,
      quote: "This is incredible, you don't need an interior designer anymore!",
      author: "Ada Doda",
      title: "Product Designer",
      avatar: "AD",
    },
    {
      rating: 5,
      quote:
        "Finally! Something to help me get over my indecisiveness when decorating my house!",
      author: "Arthur Dvorkin",
      title: "Software Engineer",
      avatar: "AD",
    },
    {
      rating: 5,
      quote:
        "I haven't changed my room layout for 5 years, but this app may change that. Great job!",
      author: "Rob Attfield",
      title: "Startup Engineer",
      avatar: "RA",
    },
    {
      rating: 5,
      quote:
        "So fun to experiment with different themes before you renovate. How cool is that! 😍",
      author: "Koda",
      title: "Software Engineer",
      avatar: "K",
    },
    {
      rating: 5,
      quote: "So good I need the right now. Congrats on the launch!",
      author: "Eve Porcello",
      title: "Frontend & Author",
      avatar: "EP",
    },
    {
      rating: 5,
      quote:
        "Was using this hobby - the best AI room photo redesigner I have seen!",
      author: "Paul Hindes",
      title: "Senior Engineer",
      avatar: "PH",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Loved by many
            <br />
            <span className="text-blue-600">Worldwide.</span>
          </h2>
          <p className="text-gray-600 text-lg">
            See what our over 2 million users
            <br />
            are saying about the product.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="p-6 border border-gray-200 shadow-sm">
              <div className="space-y-4">
                {/* Star Rating */}
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-lg">
                      ★
                    </span>
                  ))}
                </div>

                {/* Quote */}
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>

                {/* Author */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {testimonial.author}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.title}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
