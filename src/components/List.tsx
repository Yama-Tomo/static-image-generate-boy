import { Fragment, h } from 'preact';
import { useState, useCallback, useEffect } from 'preact/hooks';
import styled from 'styled-components';
import { ListRow, ListRowProps } from '~/components/ListRow';

/* -------------------- DOM -------------------- */
type UiProps = {
  className?: string;
  videos: { url: string; label: string }[];
  progress?: number;
  frames: string[];
  displayVertical: boolean;
  onVideoControlClick: () => void;
} & Pick<
  ListRowProps,
  'onVideoDurationLoaded' | 'onProgressUpdate' | 'interval' | 'width' | 'videoControl'
>;

const Ui = (props: UiProps) => (
  <div className={props.className}>
    {props.frames.length > 0 && (
      <button onClick={props.onVideoControlClick}>
        全ての動画を{props.videoControl === 'pause' ? `再生` : `一時停止`}
      </button>
    )}
    {props.frames.length > 0 && props.progress != null && props.progress !== 100 && (
      <div>Processing... {props.progress.toFixed(0)} %</div>
    )}
    <div className="table-wrapper">
      <table className={props.frames.length > 0 ? '' : 'hide'}>
        <tr className="header">
          <td />
          <td>
            <span>動画</span>
          </td>
          {props.frames.map((sec) => (
            <td key={sec}>
              <span>{sec}</span>
            </td>
          ))}
        </tr>
        {props.videos.map((video, idx) => {
          const unifiedId = createId(video.url, idx);
          return (
            <ListRow
              videoControl={props.videoControl}
              key={unifiedId}
              id={unifiedId}
              frameLength={props.frames.length}
              onVideoDurationLoaded={props.onVideoDurationLoaded}
              onProgressUpdate={props.onProgressUpdate}
              interval={props.interval}
              videoUrl={video.url}
              label={video.label}
              width={props.width}
            />
          );
        })}
      </table>
    </div>
  </div>
);

/* ------------------- Style ------------------- */
const StyledUi = styled(Ui)`
  .table-wrapper {
    overflow: auto;
  }

  table {
    border-spacing: 0;
    border-collapse: collapse;
  }

  td {
    border: solid 1px #9b9b9b;
    padding: 0px;
  }

  .header {
    text-align: center;
  }

  .hide {
    position: absolute;
    top: -9999px;
    left: -9999px;
  }

  ${(p) =>
    p.displayVertical &&
    `
    table {
      writing-mode: vertical-lr;

      td > * {
        writing-mode: horizontal-tb;
      }

      .header > td {
        height: auto;
      }
    }
  `}

  button {
    height: 30px;
    margin-block-end: 1rem;
  }
`;

/* ----------------- Container ----------------- */
type ContainerProps = Pick<UiProps, 'width' | 'videos' | 'interval' | 'displayVertical'>;

type ID = ListRowProps['id'];

type State = ContainerProps & {
  videoDurations: Partial<Record<ID, number>>;
  generateProgress: Partial<Record<ID, number>>;
} & Pick<UiProps, 'videoControl'>;

const Container = (props: ContainerProps): h.JSX.Element => {
  const [state, setState] = useState<State | undefined>(undefined);

  useEffect(() => {
    setState((currentState) => ({
      ...(currentState ?? { videoDurations: {}, generateProgress: {}, videoControl: 'pause' }),
      ...props,
    }));
  }, [props]);

  const onVideoLoaded: UiProps['onVideoDurationLoaded'] = useCallback((id, videoDuration) => {
    setState((currentState) => {
      if (!currentState) {
        return undefined;
      }

      return {
        ...currentState,
        videoDurations: { ...currentState.videoDurations, [id]: videoDuration },
      };
    });
  }, []);

  const onProgressUpdate: UiProps['onProgressUpdate'] = useCallback((id, progress) => {
    setState((currentState) => {
      if (!currentState) {
        return undefined;
      }

      return {
        ...currentState,
        generateProgress: { ...currentState.generateProgress, [id]: progress },
      };
    });
  }, []);

  if (!state) {
    return <Fragment />;
  }

  const durations = state.videos
    .map((video, idx) => state.videoDurations[createId(video.url, idx)] ?? undefined)
    .filter((v): v is NonNullable<typeof v> => !!v);

  const isAllVideoMetadataLoaded = durations.length === state.videos.length;

  const frameLength = isAllVideoMetadataLoaded
    ? Math.floor(Math.max(...durations) / state.interval)
    : 0;

  const total = state.videos.reduce(
    (result, video, idx) => result + (state.generateProgress[createId(video.url, idx)] ?? 0),
    0
  );

  const uiProps: UiProps = {
    ...state,
    progress: state.videos.length > 0 ? (total / state.videos.length) * 100 : undefined,
    frames: Array.from({ length: frameLength }).map((_, idx) => {
      return `${((idx + 1) * props.interval).toFixed(1)} sec`;
    }),
    onVideoDurationLoaded: onVideoLoaded,
    onProgressUpdate,
    onVideoControlClick: () => {
      setState((currentState) => {
        if (!currentState) {
          return undefined;
        }

        const videoControl = currentState?.videoControl === 'pause' ? 'play' : 'pause';
        return { ...currentState, videoControl };
      });
    },
  };

  return <StyledUi {...uiProps} />;
};

const createId = (url: string, arrayIdx: number): ID => `${url}-idx_${arrayIdx}`;

/* --------------------------------------------- */
export { Container as List };
export type { ContainerProps as ListProps };
