"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center px-8">
            <h1 className="text-6xl font-bold mb-4">Application Error</h1>
            <p className="text-xl text-gray-400 mb-8">
              A critical error occurred. The application may need to be restarted.
            </p>
            <button
              onClick={reset}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Try Reloading
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
