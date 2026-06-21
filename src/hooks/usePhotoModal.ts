import { useState, useCallback } from 'react';

export interface UsePhotoModalReturn {
  modalVisible: boolean;
  openModal: () => void;
  closeModal: () => void;
}

export function usePhotoModal(): UsePhotoModalReturn {
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalVisible(false);
  }, []);

  return {
    modalVisible,
    openModal,
    closeModal,
  };
}
