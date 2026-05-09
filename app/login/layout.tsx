"use client";

import BackButton from "@/components/BackButton";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <nav style={{ padding: "1rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          className="logo"
          onClick={() => (window.location.href = "/")}
          style={{ cursor: "pointer" }}
        >
          SHIVAM <em>MOBILE CARE</em>
        </div>
        <div className="nav-right">
          <BackButton 
            text="Back" 
            textSize="text-xs" 
            padding="w-20 h-7" 
          />
        </div>
      </nav>
      {children}
    </>
  );
}
