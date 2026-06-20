import { ImageResponse } from 'next/og';

export const alt = 'FormIQ — AI-Powered Form Builder';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          position: 'relative',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Background grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.07) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '600px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(139,92,246,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Top badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.4)',
            borderRadius: '100px',
            padding: '8px 20px',
            marginBottom: '32px',
          }}
        >
          <span style={{ color: '#a78bfa', fontSize: '16px', fontWeight: 600, letterSpacing: '0.05em' }}>
            ✦ AI-POWERED FORM BUILDER
          </span>
        </div>

        {/* Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
            }}
          >
            📋
          </div>
          <span
            style={{
              fontSize: '80px',
              fontWeight: 800,
              background: 'linear-gradient(90deg, #ffffff, #a78bfa)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-2px',
            }}
          >
            FormIQ
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: '28px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '700px',
            lineHeight: 1.4,
            margin: '0 0 48px 0',
          }}
        >
          Create intelligent forms, surveys & quizzes in seconds with AI
        </p>

        {/* Features row */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '48px' }}>
          {['AI Generation', 'Drag & Drop', 'Smart Evaluation', 'Analytics'].map(
            feature => (
              <div
                key={feature}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#e2e8f0',
                  fontSize: '16px',
                  fontWeight: 500,
                }}
              >
                {feature}
              </div>
            )
          )}
        </div>

        {/* Footer - Built by */}
        <div
          style={{
            position: 'absolute',
            bottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: '#475569', fontSize: '16px' }}>Built by</span>
          <span style={{ color: '#a78bfa', fontSize: '16px', fontWeight: 700 }}>
            Ashish Jethva
          </span>
          <span style={{ color: '#475569', fontSize: '16px' }}>·</span>
          <span style={{ color: '#475569', fontSize: '16px' }}>ashishjethva.com</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
