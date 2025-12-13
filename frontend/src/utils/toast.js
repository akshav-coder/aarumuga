// This file is kept for backward compatibility
// The actual toast functionality is now in ToastProvider component
export const showToast = () => {
  console.warn('showToast from utils/toast.js is deprecated. Use useToast hook instead.');
};
