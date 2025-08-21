"use client";

import { useState } from "react";

type Platform = "google" | "youtube";

const countries = [
  { name: "United States", code: "us" },
  { name: "Finland", code: "fi" },
  { name: "Germany", code: "de" },
  { name: "United Kingdom", code: "uk" },
  { name: "Canada", code: "ca" },
  { name: "Australia", code: "au" },
  { name: "Japan", code: "jp" },
  { name: "Global", code: "" },
];

export default function HomePage() {
  const [seedKeyword, setSeedKeyword] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState("us");
  const [copyButtonText, setCopyButtonText] = useState("Copy to Clipboard");
  const [platform, setPlatform] = useState<Platform>("google");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!seedKeyword.trim()) {
      setError("Please enter a keyword to search.");
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setCopyButtonText("Copy to Clipboard");

    try {
      let apiUrl = `http://127.0.0.1:8000/api/keywords?q=${encodeURIComponent(
        seedKeyword
      )}&platform=${platform}`;

      if (platform === "google") {
        apiUrl += `&gl=${selectedCountry}`;
      }

      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Something went wrong");
      }

      const data: string[] = await response.json();
      setResults(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (results.length == 0) return;

    const textToCopy = results.join("\n");
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopyButtonText("Copied!");
        setTimeout(() => setCopyButtonText("Copy to Clipboard"), 2000);
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
      });
  };

  const handleExport = () => {
    if (results.length === 0) return;

    const header = "Keywords\n";
    const csvContent = header + results.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `keyvo_${seedKeyword.replace(/\s+/g, "_")}_export.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 sm:p-12 md:p-14 bg-slate-50 text-slate-900 font-sans">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-600 pb-1">
          Keyvo
        </h1>
        <p className="text-slate-500 mb-8 text-base sm:text-lg">
          Keyword discovery tool for SEO
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-8">
          <div className="flex justify-center gap-2">
            {(["google", "youtube"] as Platform[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  platform === p
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-300"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              placeholder="Enter a seed keyword..."
              className="flex-grow p-3 rounded-md bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              disabled={platform === "youtube"}
              className="p-3 rounded-md bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full p-3 px-6 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed font-semibold transition-colors"
          >
            {isLoading ? "Searching.." : "Search"}
          </button>
        </form>
        <div className="text-left">
          {error && <p className="text-red-500 text-center">{error}</p>}
          {isLoading && (
            <p className="text-slate-500 text-center">
              Fetching suggestions...
            </p>
          )}
          {results.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-md p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold mb-3">
                  Results ({results.length})
                </h2>

                <div className="flex gap-3">
                  <button
                    onClick={handleCopy}
                    className="px-3 py-1 text-sm rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors"
                  >
                    {copyButtonText}
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-3 py-1 text-sm rounded-md bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold"
                  >
                    Export to CSV
                  </button>
                </div>
              </div>
              <ul className="space-y-2">
                {results.map((keyword, index) => (
                  <li key={index} className="p-2 bg-slate-100 rounded-md">
                    {keyword}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
