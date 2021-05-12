import { h } from 'preact';
import { StateUpdater, useEffect, useRef, useState } from 'preact/hooks';
import styled from 'styled-components';

/* -------------------- DOM -------------------- */
type UiProps = {
  className?: string;
  urls: string;
  onUrlsChange: h.JSX.GenericEventHandler<HTMLTextAreaElement>;
  interval: string;
  onIntervalChange: h.JSX.GenericEventHandler<HTMLInputElement>;
  width: string;
  onWidthChange: h.JSX.GenericEventHandler<HTMLInputElement>;
  displayVertical: boolean;
  onDisplayVerticalChange: h.JSX.GenericEventHandler<HTMLInputElement>;
  onGenerateClick: () => void;
  onLocalFilesChange: h.JSX.GenericEventHandler<HTMLInputElement>;
};

const Ui = (props: UiProps) => (
  <div className={props.className}>
    <div className="files">
      <textarea
        id="urls"
        placeholder="ここに動画のURLを入力（複数ある場合は改行区切り）"
        value={props.urls}
        onChange={props.onUrlsChange}
      />
      <p>ローカルにある動画から生成する場合はここから選択してください</p>
      <input type="file" accept="video/*" multiple onChange={props.onLocalFilesChange} />
    </div>
    <div className="gen-options">
      <div>
        <input type="number" value={props.interval} onChange={props.onIntervalChange} />{' '}
        秒ごとに生成
      </div>
      <div>
        <input type="number" value={props.width} onChange={props.onWidthChange} /> px
        の横幅で画像を生成
      </div>
      <div>
        <label>
          <input
            type="checkbox"
            onChange={props.onDisplayVerticalChange}
            checked={props.displayVertical}
          />
          画像を縦に並べる
        </label>
      </div>
    </div>
    <div>
      <button id="gen-btn" onClick={props.onGenerateClick}>
        生成
      </button>
    </div>
  </div>
);

/* ------------------- Style ------------------- */
const StyledUi = styled(Ui)`
  margin-top: 1rem;
  margin-bottom: 1rem;

  > div {
    margin-bottom: 1.5rem;
  }

  .files {
    textarea {
      width: 100%;
      height: 100px;
      box-sizing: border-box;
    }

    p {
      font-size: 0.8rem;
      margin-bottom: 0px;
    }
  }

  .gen-options {
    input {
      margin-top: 0.5rem;
    }

    input[type='number'] {
      width: 60px;
    }

    label {
      cursor: pointer;
    }
  }

  #gen-btn {
    width: 100px;
    height: 30px;
  }
`;

/* ----------------- Container ----------------- */
type State = Pick<UiProps, 'urls' | 'interval' | 'width' | 'displayVertical'> & {
  localFiles: { url: string; label: string }[];
  triggerClick: boolean;
};

type OnGenerateClickArgs = Pick<UiProps, 'displayVertical'> & {
  width: number;
  interval: number;
  videos: { url: string; label: string }[];
};

type ContainerProps = {
  onGenerateClick: (arg: OnGenerateClickArgs) => void;
  onAddonRunStateChange: (running: boolean) => void;
  defaultValues: {
    urls: string[];
    width: number;
    interval: number;
    displayVertical: boolean;
  };
};

const addonEvents = {
  videoUrlTransformStart: 'staticImageGenerateBoyAddon:onVideoUrlTransformStart',
  videoUrlTransformEnd: 'staticImageGenerateBoyAddon:onVideoUrlTransformEnd',
} as const;

const Container = (props: ContainerProps): h.JSX.Element => {
  const isAddonInstalled = !!window.staticImageGenerateBoyAddonInstalled;
  const { onGenerateClick, onAddonRunStateChange } = props;
  const [state, setState] = useState<State>({
    urls: props.defaultValues.urls.join('\n'),
    interval: String(props.defaultValues.interval),
    width: String(props.defaultValues.width),
    displayVertical: props.defaultValues.displayVertical,
    localFiles: [],
    triggerClick: false,
  });

  useListenEndOfVideoUrlTransformByAddon(
    isAddonInstalled,
    onGenerateClick,
    onAddonRunStateChange,
    state
  );
  useTriggerGenerateOnFirstRender(props.defaultValues.urls.length > 0, setState);

  const uiProps: UiProps = {
    ...state,
    onUrlsChange: ({ currentTarget: { value: urls } }) => setState((v) => ({ ...v, urls })),
    onIntervalChange: ({ currentTarget: { value: interval } }) =>
      setState((v) => ({ ...v, interval })),
    onWidthChange: ({ currentTarget: { value: width } }) => setState((v) => ({ ...v, width })),
    onDisplayVerticalChange: ({ currentTarget: { checked } }) => {
      setState((v) => ({ ...v, displayVertical: checked, triggerClick: true }));
    },
    onGenerateClick: () => {
      const { urls, width, interval, localFiles, ...rest } = state;
      const formattedUrls = urls.trim().split('\n').filter(Boolean);

      if (formattedUrls.length && isAddonInstalled) {
        onAddonRunStateChange(true);

        const eventPayload = { detail: { urls: formattedUrls } };
        document.dispatchEvent(new CustomEvent(addonEvents.videoUrlTransformStart, eventPayload));
        return;
      }

      const videos = formattedUrls.map((url) => ({ url, label: url })).concat(localFiles);
      if (!videos.length) {
        return;
      }

      onGenerateClick({ ...rest, width: Number(width), interval: Number(interval), videos });
    },
    onLocalFilesChange: ({ currentTarget }) => {
      if (currentTarget.files) {
        const localFiles = Array.from(currentTarget.files).map((file) => ({
          url: URL.createObjectURL(file),
          label: file.name,
        }));

        setState((v) => {
          v.localFiles.forEach(({ url }) => {
            URL.revokeObjectURL(url);
          });

          return { ...v, localFiles };
        });
      }
    },
  };

  if (state.triggerClick) {
    setState((currentState) => ({ ...currentState, triggerClick: false }));
    uiProps.onGenerateClick();
  }

  return <StyledUi {...uiProps} />;
};

const useListenEndOfVideoUrlTransformByAddon = (
  isAddonInstalled: boolean,
  onGenerateClick: ContainerProps['onGenerateClick'],
  onAddonRunStateChange: ContainerProps['onAddonRunStateChange'],
  state: State
) => {
  useEffect(() => {
    if (!isAddonInstalled) {
      return;
    }

    const eventName = addonEvents.videoUrlTransformEnd;
    const listener: (e: DocumentEventMap[typeof eventName]) => void = (e) => {
      const { width, interval, localFiles, ...rest } = state;
      const videos = e.detail.urls
        .map((url) => ({ url: url.transformed, label: url.original }))
        .concat(localFiles);

      if (!videos.length) {
        return;
      }

      onAddonRunStateChange(false);
      onGenerateClick({ ...rest, width: Number(width), interval: Number(interval), videos });
    };

    document.addEventListener(eventName, listener);
    return function unbindListener() {
      document.removeEventListener(eventName, listener);
    };
  }, [isAddonInstalled, onGenerateClick, onAddonRunStateChange, state]);
};

const useTriggerGenerateOnFirstRender = (
  isGenerateExecutable: boolean,
  setState: StateUpdater<State>
) => {
  const useEffectCalled = useRef(false);

  useEffect(() => {
    if (useEffectCalled.current) {
      return;
    }
    useEffectCalled.current = true;

    if (!isGenerateExecutable) {
      return;
    }

    const waitIntervalMs = 5;
    const waitTimeoutMs = 50;
    (async () => {
      // 拡張機能がインストールされているかの変数は非同期で定義されるので，定義されているか一定期間の間待機する
      //（一定期間待機しても変数定義がされていない場合もあるのでその点に留意
      for (let i = 1; i <= waitTimeoutMs / waitIntervalMs; i++) {
        if (window.staticImageGenerateBoyAddonInstalled) {
          break;
        }

        await new Promise((r) => setTimeout(r, waitIntervalMs));
      }

      setState((currentState) => ({ ...currentState, triggerClick: true }));
    })();
  }, [isGenerateExecutable, setState]);
};

/* --------------------------------------------- */
export { Container as Form };
export type { ContainerProps as FormProps };
