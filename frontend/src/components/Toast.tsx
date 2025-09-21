import { useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Info } from 'lucide-react';
import { toastAtom, hideToastAtom } from '../store/ui';

export default function Toast() {
  const [toast] = useAtom(toastAtom);
  const [, hideToast] = useAtom(hideToastAtom);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <AnimatePresence>
      {toast.show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="fixed top-4 right-4 z-50 max-w-sm w-full"
        >
          <div className={`rounded-lg border p-4 shadow-lg ${getBackgroundColor()}`}>
            <div className="flex items-start gap-3">
              {getIcon()}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {toast.message}
                </p>
              </div>
              <button
                onClick={hideToast}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}