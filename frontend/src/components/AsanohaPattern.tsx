const AsanohaPattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ opacity: 0.025 }}>
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="asanoha" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M20 0 L40 20 L20 40 L0 20 Z" fill="none" stroke="#8B5CF6" strokeWidth="0.5" />
          <path d="M20 0 L20 40 M0 20 L40 20" fill="none" stroke="#8B5CF6" strokeWidth="0.3" />
          <path d="M0 0 L20 20 L0 40 M40 0 L20 20 L40 40" fill="none" stroke="#8B5CF6" strokeWidth="0.3" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#asanoha)" />
    </svg>
  </div>
);

export default AsanohaPattern;
