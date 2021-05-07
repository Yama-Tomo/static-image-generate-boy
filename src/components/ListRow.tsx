import { Fragment, h } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import styled from 'styled-components';
import { forwardRef, memo } from 'preact/compat';

/* -------------------- DOM -------------------- */
type UiProps = {
  className?: string;
  label: string;
  frameLength: number;
  generatedImages: h.JSX.Element[];
  width: number;
  isError: boolean;
};

const Ui = forwardRef<HTMLVideoElement, UiProps>((props, ref) => (
  <tr className={props.className}>
    <td>
      <span className="label">{props.label}</span>
      <video ref={ref} className="hide" />
    </td>
    {props.isError ? (
      <td colSpan={props.frameLength}>エラーが発生しました</td>
    ) : (
      <Fragment>
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
      <td key={idx}>{Image}</td>
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

/* ------------------- Style ------------------- */
const StyledUi = styled(Ui)`
  .hide {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }

  border-collapse: collapse;

  td {
    border: solid 1px #9b9b9b;
    min-width: 100px;
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
  onVideoLoaded: (id: ID, videoDuration: number) => void;
  onProgressUpdate: (id: ID, progress: number) => void;
  interval: number;
  videoUrl: string;
} & Pick<UiProps, 'width' | 'label'>;

const Container = (props: ContainerProps): h.JSX.Element => {
  const [state, setState] = useState<Pick<UiProps, 'generatedImages' | 'isError'>>({
    generatedImages: [],
    isError: false,
  });

  const videoEleRef = useRef<HTMLVideoElement | null>(null);
  const { onVideoLoaded, onProgressUpdate, interval, videoUrl, width, id, label } = props;

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
      // NOTE: 同時に画像生成するとブラウザがハングするのでランダム秒(100 ~ 150ms) 遅延させる
      setTimeout(onseeked, Math.floor(Math.random() * 100) + 50);
    };

    videoRef.onloadeddata = () => {
      onVideoLoaded(id, videoRef.duration);
    };

    videoRef.onerror = () => {
      setState({ generatedImages: [], isError: true });
      // フレームの長さを渡さないとテーブルが描画されないので渡す
      onVideoLoaded(id, 1);
      // 進捗は 100% として渡す
      onProgressUpdate(id, 1);
    };

    console.log(`image generate start: [${videoUrl}]`);

    setState({ generatedImages: [], isError: false });

    videoRef.src = videoUrl;
    videoRef.load();
    videoRef.currentTime = interval;
  }, [interval, width, videoUrl, onVideoLoaded, id, label, onProgressUpdate]);

  const uiProps: UiProps = {
    ...props,
    ...state,
  };

  return <StyledUi {...uiProps} ref={videoEleRef} />;
};

/* --------------------------------------------- */
export { Container as ListRow };
export type { ContainerProps as ListRowProps };
