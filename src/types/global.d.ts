interface Window {
  staticImageGenerateBoyAddonInstalled?: boolean;
}

interface DocumentEventMap {
  'staticImageGenerateBoyAddon:onVideoUrlTransformEnd': CustomEvent<{
    urls: { original: string; transformed: string }[];
  }>;
}
