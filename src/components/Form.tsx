import { h } from 'preact';
import { useState } from 'preact/hooks';
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
      <div>ローカルにある動画から生成する場合はここから選択してください</div>
      <input type="file" accept="video/*" multiple />
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
      <button id="gen-btn">生成</button>
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
    cursor: pointer;
    width: 100px;
    height: 30px;
  }
`;

/* ----------------- Container ----------------- */
type State = Pick<UiProps, 'urls' | 'interval' | 'width' | 'displayVertical'>;
const Container = (): h.JSX.Element => {
  const [state, setState] = useState<State>({
    urls: '',
    interval: '1',
    width: '300',
    displayVertical: false,
  });

  const uiProps: UiProps = {
    ...state,
    onUrlsChange: ({ currentTarget: { value: urls } }) => setState((v) => ({ ...v, urls })),
    onIntervalChange: ({ currentTarget: { value: interval } }) =>
      setState((v) => ({ ...v, interval })),
    onWidthChange: ({ currentTarget: { value: width } }) => setState((v) => ({ ...v, width })),
    onDisplayVerticalChange: ({ currentTarget: { checked } }) =>
      setState((v) => ({ ...v, displayVertical: checked })),
  };

  return <StyledUi {...uiProps} />;
};

/* --------------------------------------------- */
export { Container as Form };
