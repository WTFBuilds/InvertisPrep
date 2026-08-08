"use client"

import type React from "react"

interface ShinyButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  isActive?: boolean
}

export function ShinyButton({ children, onClick, className = "", isActive = false }: ShinyButtonProps) {
  return (
    <>
      <style jsx>{`
        .shiny-cta {
          position: relative;
          overflow: hidden;
          padding: 0.65rem 1.45rem;
          font-family: "Inter", sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          border-radius: 360px;
          cursor: pointer;
          border: none;
          background: transparent;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          isolation: isolate;
          transition: all 0.3s ease;
        }

        /* Inner background masking */
        .shiny-cta::before {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          z-index: -1;
          transition: all 0.3s ease;
        }

        .shiny-cta-active::before {
          background: #030303;
        }

        .shiny-cta-inactive::before {
          background: #ffffff;
        }

        /* Border background container */
        .shiny-cta::after {
          content: "";
          position: absolute;
          z-index: -2;
          transition: all 0.3s ease;
        }

        /* Active State: Widescreen rotating conic-gradient */
        .shiny-cta-active::after {
          inset: -150% -100%;
          background: conic-gradient(
            from 0deg,
            #2563eb,
            #60a5fa,
            #030303,
            #2563eb
          );
          animation: spin 3s linear infinite;
        }

        /* Inactive State: Static gray border */
        .shiny-cta-inactive::after {
          inset: 0;
          background: #cbd5e1;
        }

        /* Hover States for Inactive Buttons */
        .shiny-cta-inactive:hover::before {
          background: #f8fafc;
        }

        .shiny-cta-inactive:hover::after {
          inset: -150% -100%;
          background: conic-gradient(
            from 0deg,
            #2563eb,
            #60a5fa,
            #cbd5e1,
            #2563eb
          );
          animation: spin 3s linear infinite;
        }

        .shiny-cta-active {
          color: #ffffff;
          box-shadow: 0 4px 15px -3px rgba(37, 99, 235, 0.3);
        }

        .shiny-cta-inactive {
          color: #475569;
        }

        .shiny-cta-inactive:hover {
          color: #1e293b;
        }

        .shiny-cta span {
          z-index: 1;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .shiny-cta {
            padding: 0.45rem 0.95rem;
            font-size: 0.6rem;
          }
        }
      `}</style>

      <button className={`shiny-cta ${isActive ? 'shiny-cta-active' : 'shiny-cta-inactive'} ${className}`} onClick={onClick}>
        <span>{children}</span>
      </button>
    </>
  )
}
