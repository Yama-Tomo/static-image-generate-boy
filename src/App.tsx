import { h, Fragment } from 'preact';
import styled, { createGlobalStyle } from 'styled-components';
import { Form, FormProps } from '~/components/Form';
import { List, ListProps } from '~/components/List';
import { useState } from 'preact/hooks';

/* -------------------- DOM -------------------- */
type UiProps = {
  className?: string;
} & Pick<FormProps, 'onGenerateClick'> &
  Pick<ListProps, 'videos' | 'width' | 'interval' | 'displayVertical'>;

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
    <Form onGenerateClick={props.onGenerateClick} />
    <List
      interval={props.interval}
      width={props.width}
      videos={props.videos}
      displayVertical={props.displayVertical}
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
  }

  button {
    cursor: pointer;
  }
`;

/* ----------------- Container ----------------- */
type OnGenerateClickArgs = Parameters<FormProps['onGenerateClick']>[0];

const Container = (): h.JSX.Element => {
  const [state, setState] = useState<OnGenerateClickArgs>({
    width: 0,
    displayVertical: false,
    interval: 0,
    videos: [],
  });

  const uiProps: UiProps = {
    ...state,
    onGenerateClick: setState,
  };

  return <StyledUi {...uiProps} />;
};

/* --------------------------------------------- */
export { Container as App };
