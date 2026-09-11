import { useApp } from '../context/AppContext';

export const usePondData = () => {
  const { ponds, selectedPond, selectedPondId, setSelectedPondId, isLoading, lastUpdated, refreshData, toggleDevice } = useApp();

  return {
    ponds,
    currentPond: selectedPond,
    selectedPondId,
    changePond: setSelectedPondId,
    isLoading,
    lastUpdated,
    refreshData,
    toggleDevice,
  };
};
