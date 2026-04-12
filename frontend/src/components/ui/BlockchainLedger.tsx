import { useBlockchain, BlockchainBlock } from '../../hooks/useBlockchain'

export function BlockchainLedger() {
  const { blocks } = useBlockchain()

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-mono tracking-widest text-white/80">IMMUTABLE LEDGER</h2>
          <span className="text-xs font-mono text-vigil-cyan opacity-80 mt-1">TOTAL_BLOCKS: {blocks.length}</span>
        </div>
      </div>

      <div className="flex-1 glass-panel overflow-hidden flex flex-col">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-black/40 font-mono text-xs text-white/50 tracking-wider">
          <div className="col-span-2">TIMESTAMP</div>
          <div className="col-span-3">TYPE</div>
          <div className="col-span-5">HASH ID</div>
          <div className="col-span-2">METADATA</div>
        </div>
        
        <div className="flex-1 overflow-y-auto w-full">
          {blocks.map((block, idx) => (
            <LedgerRow key={block.id} block={block} isNew={idx === 0} />
          ))}
        </div>
      </div>
    </div>
  )
}

function LedgerRow({ block, isNew }: { block: BlockchainBlock, isNew: boolean }) {
  return (
    <div className={`grid grid-cols-12 gap-4 p-4 border-b border-white/5 font-mono text-sm items-center hover:bg-white/5 transition-colors ${isNew ? 'bg-vigil-cyan/5 animate-pulse' : ''}`}>
      <div className="col-span-2 text-white/40 text-xs">
        {new Date(block.timestamp).toLocaleTimeString()}
      </div>
      <div className="col-span-3">
        <span className="px-2 py-1 bg-white/10 rounded text-xs text-vigil-cyan">{block.type}</span>
      </div>
      <div className="col-span-5 text-white/70 truncate text-xs">
        {block.hash}
      </div>
      <div className="col-span-2 text-vigil-amethyst truncate text-xs">
        {block.metadata}
      </div>
    </div>
  )
}
