"use client"
import Sidebar from "@/components/Sidebar"

export default function ThemeExamplePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 md:ml-[300px]">
        <div className="bg-themeGray p-6 rounded-xl">
          <h1 className="text-themeTextWhite text-2xl font-bold">
            Theme Example Page
          </h1>
          <p className="text-themeTextGray mt-2">
            This content uses the custom theme colors and styling.
          </p>
          
          {/* Gradient Text Example */}
          <div className="mt-8">
            <h2 className="text-gradient text-xl font-bold">
              Gradient Text Example
            </h2>
          </div>
          
          {/* Dark Section */}
          <div className="mt-4 p-4 rounded-md bg-black">
            <p className="text-themeTextWhite">
              This is a darker section with custom theming.
            </p>
          </div>
          
          {/* Radial Gradient Example */}
          <div className="radial mt-8 p-8 rounded-xl">
            <h3 className="text-themeTextWhite text-center text-xl font-bold">
              Radial Gradient Background
            </h3>
            <p className="text-themeTextGray text-center mt-2">
              This section has a radial gradient background
            </p>
          </div>
          
          {/* Image Overlay Example */}
          <div className="mt-8 relative h-48 rounded-xl overflow-hidden">
            <div className="absolute inset-0 bg-gray-800"></div>
            <div className="absolute inset-0 img--overlay"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-themeTextWhite font-bold">Image Overlay Example</h3>
              <p className="text-themeTextGray text-sm">
                This demonstrates the image overlay gradient effect
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 