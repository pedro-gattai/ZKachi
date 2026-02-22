const SectionDivider = () => {
  return (
    <div className="relative py-8 flex items-center justify-center">
      <div
        className="w-[200px] h-px opacity-30"
        style={{
          background: "linear-gradient(90deg, transparent 0%, hsl(var(--zkachi-purple)) 30%, hsl(var(--zkachi-gold)) 70%, transparent 100%)",
        }}
      />
    </div>
  );
};

export default SectionDivider;
