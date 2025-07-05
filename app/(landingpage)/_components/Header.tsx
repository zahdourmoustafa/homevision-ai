import { Button } from "@/components/ui/button";
import Link from "next/link";

export const Header = () => {
  return (
    <header className="w-full">
      {/* Flash Sale Banner */}
      <div className="bg-black text-white text-center py-3 px-4">
        <p className="text-sm">
          <span className="text-yellow-400 font-semibold">
            LIMITED-TIME FLASH SALE!
          </span>{" "}
          Use code{" "}
          <span className="bg-yellow-400 text-black px-2 py-1 rounded font-bold">
            {`"FLASH40"`}
          </span>{" "}
          at checkout for 60% off all plans!
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex justify-between items-center py-4 px-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center">
          <div className="text-2xl font-bold text-blue-600">🏠roomGPT</div>
        </Link>

        <Link href="/sign-in">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            Login
          </Button>
        </Link>
      </nav>
    </header>
  );
};
