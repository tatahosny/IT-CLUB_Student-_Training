const Logo = ({ size = 32, className = "", style = {}, showText = true }) => {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const finalSize = isMobile && size > 40 ? size * 0.7 : size;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, ...style }} className={className}>
      <div style={{ position: 'relative' }}>
        <img src="/logo.png" alt="IT Club Logo" style={{ width: finalSize, height: 'auto', objectFit: 'contain' }} />
        <div style={{ 
          position: 'absolute', inset: -4, borderRadius: '50%', 
          boxShadow: '0 0 15px var(--color-cyan-glow)', pointerEvents: 'none' 
        }} />
      </div>
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span className="font-orbitron" style={{ 
            fontSize: finalSize * 0.45, fontWeight: 900, 
            letterSpacing: '0.1em', background: 'linear-gradient(135deg, #12D6FF, #9BEA27)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>
            IT CLUB
          </span>
          <span style={{ 
            fontSize: finalSize * 0.22, color: 'var(--color-text-muted)', 
            fontWeight: 600, letterSpacing: '0.2em', marginTop: 2 
          }}>
            TRAINING SYSTEM
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
