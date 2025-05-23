// filepath: /app/page.tsx
import { UserButton } from "@clerk/nextjs";
// import { User } from "lucide-react"; // User is unused
// import Link from "next/link"; // Link is unused

function HomePage() {
  return (
    <div>
      <main className="max-w-md mx-auto p-8">
        <h1 className="text-4xl font-bold mb-6">Welcome to the App</h1>
        <UserButton />
      </main>
    </div>
  );
}

export default HomePage;
