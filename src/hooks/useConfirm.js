import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Hook quản lý hộp thoại xác nhận ConfirmModal thay thế window.confirm().
 */
export const useConfirm = () => {
  const [confirmState, setConfirmState] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      if (resolverRef.current) {
        resolverRef.current(false);
      }
      resolverRef.current = resolve;
      setConfirmState({
        title: options.title || 'Xác nhận thao tác',
        message: options.message || '',
        detail: options.detail || '',
        confirmText: options.confirmText || 'Xác nhận',
        cancelText: options.cancelText || 'Hủy',
        variant: options.variant || 'danger',
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setConfirmState(null);
    resolve?.(true);
  }, []);

  const handleCancel = useCallback(() => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setConfirmState(null);
    resolve?.(false);
  }, []);

  useEffect(() => {
    return () => {
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }
    };
  }, []);

  return {
    confirm,
    confirmProps: {
      isOpen: Boolean(confirmState),
      ...(confirmState || {}),
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
};

export default useConfirm;
