import { Button } from "@/components/ui/button";
import Image from "next/image";

export const Hero = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="space-y-6">
          <div className="text-gray-600">
            Used by over <span className="font-semibold">2 million people</span>{" "}
            to redesign homes
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Your personal <span className="text-blue-600">AI</span>
              <br />
              interior designer
            </h1>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full text-lg font-semibold inline-flex items-center gap-2">
            ⚡ Instantly Redesign
            <span className="text-lg">→</span>
          </Button>
        </div>

        {/* Right Content */}
        <div>
          <Image
            src="/hero.png"
            alt="Hero Image"
            width={700}
            height={700}
            className="rounded-3xl"
          />
        </div>
      </div>
    </section>
  );
};
