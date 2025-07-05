import { Button } from "@/components/ui/button";
import Image from "next/image";

export const CTA = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                Transform any room with
                <br />
                just one photo
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                See what our over 2 million users are saying
                <br />
                about the product.
              </p>
            </div>

            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold inline-flex items-center gap-2">
              Try it now
              <span className="text-lg">→</span>
            </Button>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="relative">
              <Image
                src="/ctaImage.png"
                alt="Room transformation example"
                width={600}
                height={400}
                className="rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
