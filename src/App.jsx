import React, { useState } from 'react';
import WizardContainer from './components/wizard/WizardContainer';

export default function App() {
  const [started, setStarted] = useState(false);

  return (
    <div className="min-h-screen py-8 px-4" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 50%, #FFF7ED 100%)' }}>
      {/* Skip to main content — WCAG 2.1 AA */}
      <a
        href="#main-content"
        id="skip-to-content"
        className="skip-link sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-semibold"
        style={{ color: '#1F4E79' }}
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="text-center mb-8" role="banner">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
            style={{ background: 'linear-gradient(135deg, #1F4E79, #27AE60)' }}
            aria-hidden="true"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold gradient-text leading-none">LendSwift</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide">Digital Lending Made Simple</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main id="main-content" role="main">
        {!started ? (
          <div className="max-w-lg mx-auto animate-fadeInUp">
            {/* Landing card */}
            <div
              className="rounded-3xl overflow-hidden"
              style={{ background: 'white', boxShadow: 'var(--shadow-elevated)' }}
            >
              {/* Gradient banner */}
              <div
                className="px-8 py-10 text-white text-center"
                style={{ background: 'linear-gradient(135deg, #1F4E79 0%, #153a5c 60%, #27AE60 100%)' }}
              >
                <div className="text-5xl mb-3" aria-hidden="true">💰</div>
                <h2 className="text-2xl font-extrabold mb-2">
                  Get Your Loan Approved
                </h2>
                <p className="text-blue-100 text-sm">
                  Fast • Secure • 100% Digital
                </p>
              </div>

              <div className="px-8 py-7">
                {/* Benefits */}
                <div className="grid grid-cols-1 gap-3 mb-7">
                  {[
                    { icon: '⚡', title: 'Instant Pre-Approval', desc: 'Get pre-approved in minutes' },
                    { icon: '🔐', title: 'Bank-grade Security', desc: 'AES-256-GCM encrypted data' },
                    { icon: '📱', title: 'Fully Digital', desc: 'No physical documents needed' },
                    { icon: '💾', title: 'Auto-saved Progress', desc: 'Resume anytime, never lose data' },
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-3.5 px-4 py-3 rounded-xl" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                      <span className="text-xl shrink-0" aria-hidden="true">{item.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Loan types preview */}
                <div className="flex gap-2 mb-7">
                  {[
                    { label: 'Personal', rate: '10.5%', color: '#1F4E79' },
                    { label: 'Home', rate: '8.5%', color: '#27AE60' },
                    { label: 'Business', rate: '14%', color: '#F39C12' },
                  ].map((loan) => (
                    <div
                      key={loan.label}
                      className="flex-1 text-center py-2.5 px-2 rounded-xl"
                      style={{ background: `${loan.color}08`, border: `1px solid ${loan.color}20` }}
                    >
                      <p className="text-xs font-bold" style={{ color: loan.color }}>{loan.label}</p>
                      <p className="text-xs text-slate-400 mt-0.5">from {loan.rate}</p>
                    </div>
                  ))}
                </div>

                <button
                  id="start-application"
                  onClick={() => setStarted(true)}
                  className="btn-primary w-full text-base py-4"
                  aria-label="Start your loan application"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Start Application
                </button>

                <p className="text-xs text-center text-slate-400 mt-3">
                  Takes ~10 minutes · Progress auto-saved · RBI compliant
                </p>
              </div>
            </div>
          </div>
        ) : (
          <WizardContainer />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center mt-8" role="contentinfo">
        <p className="text-xs text-slate-400">
          © 2024 LendSwift Financial Services · Licensed by RBI · DPDPA 2023 Compliant
        </p>
      </footer>
    </div>
  );
}