import { useEffect, useRef } from 'preact/hooks';

const useOneTimeEffect = (fn: () => void): void => {
  const useEffectCalled = useRef(false);

  useEffect(() => {
    if (useEffectCalled.current) {
      return;
    }
    useEffectCalled.current = true;

    fn();
  }, [fn]);
};

export { useOneTimeEffect };
