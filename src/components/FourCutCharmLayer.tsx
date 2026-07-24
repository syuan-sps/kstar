export default function FourCutCleanLining({ accent }: { accent: string }) {
  return (
    <div aria-hidden="true" data-fourcut-clean-lining className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-[26px]">
      <div className="absolute inset-[4px] rounded-[22px] shadow-[inset_0_0_0_1px_rgba(28,30,36,.2)]" />
      <div className="absolute inset-[7px] rounded-[19px] border" style={{ borderColor: `${accent}80`, boxShadow: `inset 0 0 0 1px ${accent}24` }} />
    </div>
  );
}
