import React, { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Logging in with:', { email, password });
    // Add your authentication for email & password here
  };

  const handleGoogleLogin = () => {
    console.log('Google button clicked!'); // add your Google OAuth logic here
  };

  const handleGitHubLogin = () => {
    console.log('GitHub button clicked!');  // add your GitHub OAuth logic here
  };

  return (
    <div className="flex h-screen items-center justify-center bg-[#FFFAEB]">
      <div className="rounded-2xl bg-white p-8 shadow-lg">
        <form
          onSubmit={handleLogin}
          className="flex w-75 flex-col gap-3.75"
        >
          <h2 className="text-2xl font-bold text-red-500">Login</h2>
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="mb-1.25 block"
            >
              Email Address
            </label>

            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="box-border w-full p-2"
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="mb-1.25 block"
            >
              Password
            </label>

            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="box-border w-full p-2"
            />
          </div>

          {/* submit button */}
          <button
            type="submit"
            className="cursor-pointer border-none bg-[#0070f3] p-2.5 text-white"
          >
            Sign In
          </button>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="cursor-pointer rounded border border-gray-300 bg-white p-2.5 text-gray-800"
          >
            Continue with Google
          </button>

          {/* GitHub OAuth */}
          <button
            type="button"
            onClick={handleGitHubLogin}
            className="cursor-pointer rounded border border-gray-300 bg-white p-2.5 text-gray-800"
          >
            Continue with GitHub
          </button>
        </form>
      </div>
    </div>
  );
}
