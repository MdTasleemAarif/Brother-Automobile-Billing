"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [profileMissing, setProfileMissing] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password, remember: true }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Login failed.");
        return;
      }

      const nextPath = new URLSearchParams(window.location.search).get("next");
      router.replace(nextPath?.startsWith("/") ? nextPath : "/");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#fff8ea]">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(15,159,166,0.22),transparent_30rem),radial-gradient(circle_at_bottom_right,rgba(244,125,97,0.18),transparent_28rem)]" />
        <div className="absolute left-0 top-0 h-40 w-40 rounded-br-[80px] bg-[#0f9fa6]/20" />
        <div className="absolute bottom-0 right-0 h-44 w-44 rounded-tl-[90px] bg-[#f7c948]/30" />

        <section className="relative w-full max-w-md overflow-hidden rounded-[30px] border border-[#87d8d8] bg-white shadow-[0_28px_90px_rgba(8,35,66,0.20)]">
          <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-[#0f9fa6] via-[#f7c948] to-[#f47d61]" />
          <div className="p-6 sm:p-10">
            <div className="mx-auto max-w-md">
              <div className="flex flex-col items-center text-center">
                <div className="relative grid h-28 w-28 place-items-center rounded-full bg-[#d9f3f2] p-1 shadow-lg ring-4 ring-white">
                  {!profileMissing ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/loginProfile.jpeg"
                      alt="Syed Irfan"
                      className="h-full w-full rounded-full object-cover"
                      onError={() => setProfileMissing(true)}
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center rounded-full bg-[#082342] text-3xl font-black text-white">
                      SI
                    </div>
                  )}
                  <span className="absolute -bottom-1 rounded-full bg-[#0f9fa6] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white">
                    Admin
                  </span>
                </div>

                <div className="mt-8">
                  <p className="text-[11px] font-black uppercase tracking-[0.32em] text-[#0f9fa6]">
                    Login to
                  </p>
                  <h2 className="mt-2 font-serif text-[34px] font-bold leading-none tracking-wide text-[#082342] sm:text-[38px]">
                    Brothers Automobiles
                  </h2>
                  <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-[#0f9fa6] via-[#f7c948] to-[#f47d61]" />
                </div>
              </div>

              <form className="mt-9 space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-black text-[#082342]">
                    Username or Email
                  </label>
                  <input
                    value={identifier}
                    onChange={(event) => setIdentifier(event.target.value)}
                    className="h-14 w-full rounded-2xl border border-[#b7eceb] bg-[#fffaf0] px-4 py-3 text-base font-bold text-[#082342] shadow-sm outline-none transition focus:border-[#0f9fa6] focus:bg-white focus:ring-4 focus:ring-[#d9f3f2]"
                    placeholder="Enter Username or Email"
                    autoComplete="username"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-[#082342]">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-14 w-full rounded-2xl border border-[#b7eceb] bg-[#fffaf0] px-4 py-3 pr-20 text-base font-bold text-[#082342] shadow-sm outline-none transition focus:border-[#0f9fa6] focus:bg-white focus:ring-4 focus:ring-[#d9f3f2]"
                      placeholder="Enter password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-xs font-black text-[#0f9fa6] transition hover:bg-[#d9f3f2]"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-2xl border border-[#f47d61]/40 bg-[#fff0eb] px-4 py-3 text-sm font-bold text-[#a33f2f]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-14 w-full rounded-2xl bg-[#082342] px-5 py-3 text-base font-black text-white shadow-[0_14px_30px_rgba(8,35,66,0.24)] transition hover:bg-[#0f9fa6] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSubmitting ? "Checking..." : "Login Securely"}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
