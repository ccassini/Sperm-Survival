import { ImageResponse } from 'next/og';
import { APP_NAME, APP_DESCRIPTION } from '../../../lib/constants';

export const runtime = 'edge';

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          fontSize: 40,
          color: 'white',
          background: 'linear-gradient(135deg, #4a00e0, #8e2de2, #22c55e)',
          width: '100%',
          height: '100%',
          textAlign: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          padding: 40,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.1) 0%, transparent 40%)',
          zIndex: 1,
        }} />
        
        {/* Decorative sperm shapes */}
        <div style={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          fontSize: 150,
          opacity: 0.2,
          transform: 'rotate(45deg)',
        }}>💧</div>
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '5%',
          fontSize: 120,
          opacity: 0.2,
          transform: 'rotate(-30deg)',
        }}>💧</div>
        
        {/* Main content */}
        <div style={{ fontSize: 100, marginBottom: 20, zIndex: 2 }}>💧</div>
        <h1 style={{ 
          margin: 0, 
          fontSize: 80, 
          fontWeight: 'bold',
          textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          zIndex: 2,
          background: 'linear-gradient(to right, #ffffff, #f0f0f0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>{APP_NAME}</h1>
        <p style={{ 
          margin: '20px 0', 
          fontSize: 36,
          maxWidth: '80%',
          zIndex: 2,
          textShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>{APP_DESCRIPTION}</p>
        <div style={{ 
          padding: '15px 40px', 
          background: '#ffbe0b', 
          color: '#000', 
          borderRadius: 50,
          fontWeight: 'bold',
          fontSize: 36,
          marginTop: 30,
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>PLAY NOW</span>
          <span style={{ fontSize: 30 }}>▶</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, immutable, no-transform, max-age=3600'
      }
    }
  );
}