import { Button } from "@/components/ui/button";
import Image from "next/image";

export const Tools = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {/* Top Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            AI render tools to level up your architecture design workflow
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            12+ tools, 40+ styles to render or redesign in seconds
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg">Explore AI tools</Button>
            <Button size="lg" variant="outline">
              Explore Feed
            </Button>
          </div>

          {/* Hero Image */}
          <div className="mt-16">
            <Image
              src="/tools-hero.webp"
              alt="AI Interior Design Tools"
              width={1200}
              height={600}
              className="w-full rounded-lg object-cover"
            />
          </div>
        </div>

        {/* Bottom Showcase Section */}
        <div className="grid md:grid-cols-2 gap-16">
          {/* Sketch to Image */}
          <div className="space-y-8">
            <div>
              <Image
                src="/tools-sketch-ai.webp"
                alt="Sketch to Image"
                width={600}
                height={384}
                className="h-[400px] w-full rounded-lg object-cover"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                Sketch to Image{" "}
                <span className="border rounded-md p-1 text-sm">AI</span>
              </h3>
              <p className="mt-4 text-base text-gray-600">
                Transform your hand-drawn or digital sketches into stunning,
                fully rendered shots. Unlock the power of generating design
                variations from a single sketch, providing you with unparalleled
                flexibility.
              </p>
              <div className="mt-6">
                <Button size="lg">Try Sketch to Image</Button>
              </div>
            </div>
          </div>

          {/* AI Video Maker */}
          <div className="space-y-8">
            <div>
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-[400px] w-full rounded-lg object-cover"
              >
                <source src="/thumb.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                AI Video{" "}
                <span className="border rounded-md p-1 text-sm">Maker</span>
              </h3>
              <p className="mt-4 text-base text-gray-600">
                Turn your designs into a 10 seconds animation in 1080p
                resolution with 1-click.
              </p>
              <div className="mt-6">
                <Button size="lg">Try Video AI</Button>
              </div>
            </div>
          </div>

          {/* Exterior AI */}
          <div className="space-y-8">
            <div>
              <Image
                src="/tools-exterior-ai.webp"
                alt="Exterior AI"
                width={600}
                height={384}
                className="h-[400px] w-full rounded-lg object-cover"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                Exterior AI{" "}
                <span className="border rounded-md p-1 text-sm">AI</span>
              </h3>
              <p className="mt-4 text-base text-gray-600">
                Redesign and visualize your exterior designs in seconds.
                Transform your building facades and outdoor spaces with
                AI-powered design suggestions and stunning visual renderings.
              </p>
              <div className="mt-6">
                <Button size="lg">Try Exterior AI</Button>
              </div>
            </div>
          </div>

          {/* Interior AI */}
          <div className="space-y-8">
            <div>
              <Image
                src="/tools-interior-ai.webp"
                alt="Interior AI"
                width={600}
                height={384}
                className="h-[400px] w-full rounded-lg object-cover"
              />
            </div>
            <div>
              <h3 className="text-2xl font-bold">
                Interior AI{" "}
                <span className="border rounded-md p-1 text-sm">AI</span>
              </h3>
              <p className="mt-4 text-base text-gray-600">
                Redesign your interior space with more than 20 unique styles.
                Create beautiful, functional interiors that match your vision
                with AI-powered design recommendations.
              </p>
              <div className="mt-6">
                <Button size="lg">Try Interior AI</Button>
              </div>
            </div>
          </div>
        </div>

        {/* Video Production Section */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Video production
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Transform your photos into animated videos in just a few seconds
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Box 1 */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
              <div className="relative">
                <Image
                  src="/tools-exterior-ai.webp"
                  alt="Original photo"
                  width={400}
                  height={300}
                  className="h-64 w-full rounded-lg object-cover"
                />
                <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-md text-sm font-medium">
                  Original photo
                </div>
              </div>
              <div className="relative">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-64 w-full rounded-lg object-cover"
                >
                  <source src="/thumb.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute top-4 left-4 bg-gray-800 text-white px-3 py-1 rounded-md text-sm font-medium">
                  Video by IASpacefy
                </div>
              </div>
            </div>

            {/* Box 2 */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
              <div className="relative">
                <Image
                  src="/tools-exterior-ai.webp"
                  alt="Original photo"
                  width={400}
                  height={300}
                  className="h-64 w-full rounded-lg object-cover"
                />
                <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-md text-sm font-medium">
                  Original photo
                </div>
              </div>
              <div className="relative">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-64 w-full rounded-lg object-cover"
                >
                  <source src="/thumb.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute top-4 left-4 bg-gray-800 text-white px-3 py-1 rounded-md text-sm font-medium">
                  Video by IASpacefy
                </div>
              </div>
            </div>

            {/* Box 3 */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
              <div className="relative">
                <Image
                  src="/tools-exterior-ai.webp"
                  alt="Original photo"
                  width={400}
                  height={300}
                  className="h-64 w-full rounded-lg object-cover"
                />
                <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-md text-sm font-medium">
                  Original photo
                </div>
              </div>
              <div className="relative">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-64 w-full rounded-lg object-cover"
                >
                  <source src="/thumb.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute top-4 left-4 bg-gray-800 text-white px-3 py-1 rounded-md text-sm font-medium">
                  Video by IASpacefy
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
