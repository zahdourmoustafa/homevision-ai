// filepath: /app/page.tsx
import Link from 'next/link';

function HomePage() {
  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-4xl font-bold mb-6">Welcome to the App</h1>
      <Link href="/auth/signup">
        <a className="text-blue-500">Sign Up</a>
      </Link>
      <br />
      <Link href="/auth/signin">
        <a className="text-blue-500">Sign In</a>
      </Link>
    </div>
  );
}

export default HomePage;