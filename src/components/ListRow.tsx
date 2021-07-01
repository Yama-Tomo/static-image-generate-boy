import { Fragment, h, RefCallback } from 'preact';
import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { styled } from 'goober';
import { forwardRef, memo } from 'preact/compat';

/* -------------------- DOM -------------------- */
type UiProps = {
  className?: string;
  label: string;
  frameLength: number;
  generatedImages: h.JSX.Element[];
  videoUrl: string;
  videoElementHandler: RefCallback<HTMLVideoElement>;
  width: number;
  isError: boolean;
  customThumbnail?: string;
};

const Ui = forwardRef<HTMLVideoElement, UiProps>((props, ref) => (
  <tr className={props.className}>
    <td>
      <span className="label">{props.label}</span>
      <div className="video-wrap">
        <video ref={ref} />
      </div>
    </td>
    {props.customThumbnail != null && (
      <td className="img">{props.customThumbnail && <img src={props.customThumbnail} />}</td>
    )}
    {props.isError ? (
      <td colSpan={props.frameLength + 1}>エラーが発生しました</td>
    ) : (
      <Fragment>
        <td className="video">
          <Video
            src={props.videoUrl}
            preload={'metadata'}
            controls
            ref={props.videoElementHandler}
          />
        </td>
        <GeneratedImages generatedImages={props.generatedImages} />

        {/* 空白のセルが追加で必要な時の場合の描画 */}
        {Array.from({ length: props.frameLength - props.generatedImages.length }).map((_, idx) => (
          <td key={`empty-cell-${idx}`} />
        ))}
      </Fragment>
    )}
  </tr>
));

// NOTE: メモ化しないと画像の生成が必要ないケースの再描画時に video タグの参照をもとに静止画を再生成してしまい全コマ同じ画像になってしまう
const GeneratedImages = memo((props: { generatedImages: h.JSX.Element[] }) => (
  <Fragment>
    {props.generatedImages.map((Image, idx) => (
      <td className="img" key={idx}>
        {Image}
      </td>
    ))}
  </Fragment>
));

const Image = forwardRef<HTMLVideoElement, { width: number; label: string }>((props, videoRef) => {
  const drawImage = (canvasRef: HTMLCanvasElement | null) => {
    if (!canvasRef) {
      return;
    }

    const aspectRatio = videoRef.current.videoHeight / videoRef.current.videoWidth;
    canvasRef.width =
      props.width < videoRef.current.videoWidth ? props.width : videoRef.current.videoWidth;
    canvasRef.height = canvasRef.width * aspectRatio;
    canvasRef.title = props.label;
    canvasRef
      .getContext('2d')
      ?.drawImage(videoRef.current, 0, 0, canvasRef.width, canvasRef.height);
  };

  return <canvas ref={drawImage} />;
});

const Video = forwardRef<HTMLVideoElement, h.JSX.IntrinsicElements['video']>((props, ref) => (
  <video {...props} ref={ref} />
));

/* ------------------- Style ------------------- */
const StyledUi = styled(Ui, forwardRef)`
  .video-wrap {
    position: absolute;
    height: 1px;
    width: 1px;
    opacity: 0;

    > video {
      width: 100%;
    }
  }

  border-collapse: collapse;

  td {
    border: solid 1px #9b9b9b;
    min-width: 100px;

    &.img,
    &.video {
      text-align: center;
      background-color: #e4e4e4;
      > canvas,
      video,
      img {
        vertical-align: middle;
      }

      > video,
      img {
        width: ${(p) => p.width}px;
      }
    }
  }

  span.label {
    width: 150px;
    overflow-wrap: break-word;
    display: inline-block;
    height: 100px;
    overflow: auto;
    padding: 0.2rem;
    box-sizing: border-box;
  }
`;

/* ----------------- Container ----------------- */
type ID = string;
type ContainerProps = {
  id: ID;
  frameLength: number;
  onVideoDurationLoaded: (id: ID, videoDuration: number) => void;
  onProgressUpdate: (id: ID, progress: number) => void;
  interval: number;
  videoUrl: string;
  videoControl: 'play' | 'pause';
} & Pick<UiProps, 'width' | 'label' | 'customThumbnail'>;

const Container = (props: ContainerProps): h.JSX.Element => {
  const [state, setState] = useState<Pick<UiProps, 'generatedImages' | 'isError'>>({
    generatedImages: [],
    isError: false,
  });

  const videoEleRef = useRef<HTMLVideoElement | null>(null);
  // prettier-ignore
  const { onVideoDurationLoaded, onProgressUpdate, interval, videoUrl, width, id, label, videoControl } = props;

  const progress = (() => {
    if (videoEleRef.current?.duration && interval > 0) {
      const numberOfImagesGenerate = Math.floor(videoEleRef.current.duration / interval);
      return state.generatedImages.length / numberOfImagesGenerate;
    }

    return 0;
  })();

  useEffect(() => {
    onProgressUpdate(id, progress);
  }, [id, progress, onProgressUpdate]);

  useEffect(() => {
    const videoRef = videoEleRef.current;
    if (!videoRef) {
      return;
    }

    const onseeked = () => {
      setState((currentState) => ({
        ...currentState,
        generatedImages: currentState.generatedImages.concat(
          <Image
            ref={videoEleRef}
            width={width}
            label={`${label} [${videoRef.currentTime.toFixed(1)} sec]`}
          />
        ),
      }));

      const endOfSeek = videoRef.currentTime >= videoRef.duration;
      if (endOfSeek) {
        return;
      }

      if (videoRef.currentTime + interval <= videoRef.duration) {
        videoRef.currentTime += interval;
      }
    };

    videoRef.onseeked = () => {
      onseeked();
      // NOTE: 同時に画像生成するとブラウザがハングするのでランダム秒(100 ~ 150ms) 遅延させる
      //setTimeout(onseeked, Math.floor(Math.random() * 100) + 50);
    };

    videoRef.onloadeddata = () => {
      onVideoDurationLoaded(id, videoRef.duration);
      videoRef.currentTime = interval;
    };

    videoRef.onerror = () => {
      setState({ generatedImages: [], isError: true });
      // フレームの長さを渡さないとテーブルが描画されないので渡す
      onVideoDurationLoaded(id, 1);
      // 進捗は 100% として渡す
      onProgressUpdate(id, 1);
    };

    console.log(`image generate start: [${videoUrl}]`);

    setState({ generatedImages: [], isError: false });

    videoRef.src = videoUrl;
    videoRef.load();
  }, [interval, width, videoUrl, onVideoDurationLoaded, id, label, onProgressUpdate]);

  const uiProps: UiProps = {
    ...props,
    ...state,
    videoElementHandler: useCallback(
      (ele) => {
        if (!ele) {
          return;
        }

        ele.onloadeddata = () => {
          ele.volume = 0;
        };

        if (videoControl === 'play') {
          ele.play();
        }

        if (videoControl === 'pause') {
          ele.pause();
        }
      },
      [videoControl]
    ),
  };

  return <StyledUi {...uiProps} ref={videoEleRef} />;
};

/* --------------------------------------------- */
export { Container as ListRow };
export type { ContainerProps as ListRowProps };
