import { AnimatePresence, motion } from 'motion/react';
import { WifiOff } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { selectConnection } from '@/features/session/sessionSlice';

export function ConnectionBanner() {
  const connection = useAppSelector(selectConnection);

  return (
    <AnimatePresence>
      {connection !== 'connected' && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden border-b border-warning/20 bg-warning/10"
        >
          <p className="flex items-center justify-center gap-2 py-1.5 text-xs font-medium text-warning">
            <WifiOff className="size-3.5" />
            {connection === 'connecting' ? 'Connecting to the LAN server…' : 'Connection lost. Reconnecting…'}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
