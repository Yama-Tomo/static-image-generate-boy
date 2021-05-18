import { h, Fragment } from 'preact';
import styled, { createGlobalStyle } from 'styled-components';
import { Form, FormProps } from '~/components/Form';
import { List, ListProps } from '~/components/List';
import { useState } from 'preact/hooks';
import qs from 'qs';

/* -------------------- DOM -------------------- */
type UiProps = {
  className?: string;
  noDisplayHeader: boolean;
  noDisplayForm: boolean;
} & Pick<FormProps, 'onGenerateClick' | 'onAddonRunStateChange' | 'defaultValues'> &
  Pick<ListProps, 'videos' | 'width' | 'interval' | 'displayVertical' | 'isAddonRunning'>;

const Ui = (props: UiProps): h.JSX.Element => (
  <main className={props.className}>
    <h1>
      <span>静止画生成くん</span>
      <a
        href="https://github.com/Yama-Tomo/static-image-generate-boy"
        target="_blank"
        rel="noreferrer"
      >
        <img
          src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
          alt="github"
        />
      </a>
    </h1>
    <Form
      onGenerateClick={props.onGenerateClick}
      onAddonRunStateChange={props.onAddonRunStateChange}
      defaultValues={props.defaultValues}
      className="form"
    />
    <List
      interval={props.interval}
      width={props.width}
      videos={props.videos}
      displayVertical={props.displayVertical}
      isAddonRunning={props.isAddonRunning}
    />
  </main>
);

/* ------------------- Style ------------------- */
const GlobalStyle = createGlobalStyle`
 body {
   box-sizing: border-box;
   margin: 0rem;
   font-family: "Roboto", "Helvetica", "Arial", sans-serif;
   color: #45515b;
 }
`;

const StyledUi = styled((props: UiProps) => (
  <Fragment>
    <GlobalStyle />
    <Ui {...props} />
  </Fragment>
))`
  margin: 1rem;

  h1 {
    display: flex;
    align-items: center;

    span {
      flex: 1;
    }

    img {
      width: 30px;
    }

    ${(p) => p.noDisplayHeader && `display: none;`}
  }

  .form {
    ${(p) => p.noDisplayForm && `display: none;`}
  }

  button {
    cursor: pointer;
  }
`;

/* ----------------- Container ----------------- */
type OnGenerateClickArgs = Parameters<UiProps['onGenerateClick']>[0];
type State = OnGenerateClickArgs & Pick<UiProps, 'isAddonRunning'>;

const Container = (): h.JSX.Element => {
  const params = parsedUrlParams();
  const [state, setState] = useState<State>({
    width: 0,
    displayVertical: false,
    interval: 0,
    videos: [],
    isAddonRunning: false,
  });

  const uiProps: UiProps = {
    ...state,
    noDisplayForm: params.noDisplayForm,
    noDisplayHeader: params.noDisplayHeader,
    onGenerateClick: (values) => setState((currentState) => ({ ...currentState, ...values })),
    onAddonRunStateChange: (isAddonRunning) =>
      setState((currentState) => ({ ...currentState, isAddonRunning })),
    defaultValues: {
      urls: params.urls,
      width: params.width,
      interval: params.interval,
      displayVertical: params.displayVertical,
    },
  };

  return <StyledUi {...uiProps} />;
};

const parsedUrlParams = () => {
  const parsedParams = qs.parse(location.search, { ignoreQueryPrefix: true });

  const urls = (Array.isArray(parsedParams['u']) ? parsedParams['u'] : []).map(String);
  const commaSeparatedUrls =
    typeof parsedParams['csu'] === 'string' ? parsedParams['csu'].split(',') : [];
  const width = parsedParams['w'] ? Number(parsedParams['w']) : 300;
  const interval = parsedParams['i'] ? Number(parsedParams['i']) : 1;
  const displayVertical = parsedParams['v'] === '1';
  const noDisplayHeader = parsedParams['nohead'] === '1';
  const noDisplayForm = parsedParams['noform'] === '1';

  return {
    urls: urls.concat(commaSeparatedUrls),
    width,
    interval,
    displayVertical,
    noDisplayHeader,
    noDisplayForm,
  };
};

/* --------------------------------------------- */
export { Container as App };
