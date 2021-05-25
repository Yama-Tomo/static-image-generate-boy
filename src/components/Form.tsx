import { h } from 'preact';
import { StateUpdater, useEffect, useState } from 'preact/hooks';
import styled from 'styled-components';
import { useOneTimeEffect } from '~/hooks';
import { wait } from '~/libs';

/* -------------------- DOM -------------------- */
type UiProps = {
  className?: string;
  remoteVideos: string;
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
        value={props.remoteVideos}
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
type State = Pick<UiProps, 'remoteVideos' | 'interval' | 'width' | 'displayVertical'> & {
  localFiles: { url: string; label: string }[];
  triggerClick: boolean;
};

type VideoValue = { url: string; label: string; customThumbnail?: string };
type OnGenerateClickArgs = Pick<UiProps, 'displayVertical'> & {
  width: number;
  interval: number;
  videos: VideoValue[];
};

type ContainerProps = Pick<UiProps, 'className'> & {
  onGenerateClick: (arg: OnGenerateClickArgs) => void;
  onAddonRunStateChange: (running: boolean) => void;
  defaultValues: {
    remoteVideos: string[];
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
  const { onGenerateClick, onAddonRunStateChange } = props;
  const [state, setState] = useState<State>({
    remoteVideos: props.defaultValues.remoteVideos.join('\n'),
    interval: String(props.defaultValues.interval),
    width: String(props.defaultValues.width),
    displayVertical: props.defaultValues.displayVertical,
    localFiles: [],
    triggerClick: false,
  });

  useListenEndOfVideoUrlTransformByAddon(onGenerateClick, onAddonRunStateChange, state);
  useTriggerGenerateOnFirstRender(setState);

  const uiProps: UiProps = {
    ...state,
    ...props,
    onUrlsChange: ({ currentTarget: { value: urls } }) =>
      setState((v) => ({ ...v, remoteVideos: urls })),
    onIntervalChange: ({ currentTarget: { value: interval } }) =>
      setState((v) => ({ ...v, interval })),
    onWidthChange: ({ currentTarget: { value: width } }) => setState((v) => ({ ...v, width })),
    onDisplayVerticalChange: ({ currentTarget: { checked } }) => {
      setState((v) => ({ ...v, displayVertical: checked, triggerClick: true }));
    },
    onGenerateClick: () => {
      const { remoteVideos, width, interval, localFiles, ...rest } = state;
      const remoteVideoValues = createRemoteVideoValues(remoteVideos);

      if (remoteVideoValues.length && isAddonInstalled()) {
        onAddonRunStateChange(true);

        const eventPayload = { detail: { urls: remoteVideoValues.map((v) => v.url) } };
        document.dispatchEvent(new CustomEvent(addonEvents.videoUrlTransformStart, eventPayload));
        return;
      }

      const videos = remoteVideoValues.concat(localFiles);
      if (!isGenerateExecutable(videos)) {
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

const isGenerateExecutable = (
  urlsOrVideos: ContainerProps['defaultValues']['remoteVideos'] | OnGenerateClickArgs['videos']
) => urlsOrVideos.length > 0;

const isAddonInstalled = () => !!window.staticImageGenerateBoyAddonInstalled;

const useListenEndOfVideoUrlTransformByAddon = (
  onGenerateClick: ContainerProps['onGenerateClick'],
  onAddonRunStateChange: ContainerProps['onAddonRunStateChange'],
  state: State
) => {
  useEffect(() => {
    if (!isAddonInstalled()) {
      return;
    }

    const eventName = addonEvents.videoUrlTransformEnd;
    const listener: (e: DocumentEventMap[typeof eventName]) => void = (e) => {
      const { width, interval, localFiles, remoteVideos, ...rest } = state;
      const remoteVideoValues = createRemoteVideoValues(remoteVideos);

      const videos = e.detail.urls
        .map((url, idx): VideoValue => {
          const { customThumbnail, label: customLabel } = remoteVideoValues[idx] || {};
          return { url: url.transformed, label: customLabel || url.original, customThumbnail };
        })
        .concat(localFiles);

      if (!isGenerateExecutable(videos)) {
        return;
      }

      onAddonRunStateChange(false);
      onGenerateClick({ ...rest, width: Number(width), interval: Number(interval), videos });
    };

    document.addEventListener(eventName, listener);
    return function unbindListener() {
      document.removeEventListener(eventName, listener);
    };
  }, [onGenerateClick, onAddonRunStateChange, state]);
};

const useTriggerGenerateOnFirstRender = (setState: StateUpdater<State>) => {
  useOneTimeEffect(async () => {
    // 拡張機能がインストールされているかの変数は非同期で定義されるので，定義されているか一定期間の間待機する
    //（一定期間待機しても変数定義がされていない場合もあるのでその点に留意
    await wait(5, 50, isAddonInstalled);
    setState((currentState) => ({ ...currentState, triggerClick: true }));
  });
};

const createRemoteVideoValues = (inputRemoteVideoValues: string) =>
  inputRemoteVideoValues.trim().split('\n').filter(Boolean).map(createVideoValue);

const createVideoValue = (remoteVideoValue: string): VideoValue => {
  const [url, customThumbnail, label] = remoteVideoValue.split(';', 3);
  return { url: url || '', label: label || '', customThumbnail };
};

/* --------------------------------------------- */
export { Container as Form };
export type { ContainerProps as FormProps };
